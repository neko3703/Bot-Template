import {
  Client,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  ChannelType,
} from "discord.js";

import { commandsGlobal, commandsGuild } from "../registerCommands.js";

import {
  incrementCounter,
  unlockAchievement,
  keywordMatch as importedKeywordMatch,
} from "../utils/achievementManager.js";

import afkCommand, { checkMentionAFK, clearAFK } from "../commands/afk.js";
import { ghostPingCache } from "../utils/ghostPingCache.js";
import { isBlacklisted } from "../utils/blacklist.js";

// Bot prefixes
const prefixes = ["!", "$", "?", ">"];

// Regex & helpers
const linkRegex = /\b(?:(?:https?:\/\/|www\.)[^\s]+|discord\.gg\/[A-Za-z0-9-]+)\b/i;
const msgLinkRegex = /https?:\/\/(?:canary\.)?discord(?:app)?\.com\/channels\/(\d+)\/(\d+)\/(\d+)/g;
const tokenRegex = /[\w-]{24}\.[\w-]{6}\.[\w-]{25,}/;

const cooldowns = new Map();
const processedMessages = new Set(); // To prevent duplicate processing 

function escapeForRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchesKeyword(text, keyword) {
  try {
    if (!keyword) return false;

    if (keyword.length <= 2 || /[^a-z0-9\s]/i.test(keyword)) {
      const pat = escapeForRegex(keyword);
      return new RegExp(pat, "i").test(text);
    }

    const pat = escapeForRegex(keyword);
    return new RegExp(pat, "i").test(text);
  } catch {
    try {
      return importedKeywordMatch ? importedKeywordMatch(text, keyword) : text.includes(keyword);
    } catch {
      return text.includes(keyword);
    }
  }
}

// ----------------------------------------------------
// MAIN EXPORT
// ----------------------------------------------------
export default async (client, message, commands) => {
  try {
    if (!message || message.author.bot) return;

    // Prevent duplicate triggers
    if (processedMessages.has(message.id)) return;
    processedMessages.add(message.id);
    setTimeout(() => processedMessages.delete(message.id), 10_000);

    const content = message.content || "";
    const lower = content.toLowerCase().trim();

    // ----------------------------------------------------
    // 1) MODMAIL (DM HANDLING)
    // ----------------------------------------------------
    if (message.channel.type === ChannelType.DM) {
      try {
        const guild = client.guilds.cache.get("765170694514016297");
        if (!guild) return;

        const member = await guild.members.fetch(message.author.id).catch(() => null);
        if (!member) {
          return message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor("Red")
                .setTitle("🚫 You’re not in the server!")
                .setDescription("Join the server to contact moderators."),
            ],
          });
        }

        // Cooldown (30s)
        const cdKey = `modmail_${message.author.id}`;
        const last = cooldowns.get(cdKey);
        if (last && Date.now() - last < 30_000) {
          const remaining = Math.ceil((30_000 - (Date.now() - last)) / 1000);
          return message.reply(
            `⏳ Please wait **${remaining}s** before sending another message.`
          );
        }
        cooldowns.set(cdKey, Date.now());
        setTimeout(() => cooldowns.delete(cdKey), 30_000);

        // Send to ModMail log channel
        const logChannel = await client.channels.fetch(process.env.MODMAIL_LOG_CHANNEL).catch(() => null);
        if (!logChannel) return;

        const embed = new EmbedBuilder()
          .setColor("#FFD700")
          .setTitle("📬 New ModMail Message")
          .setAuthor({
            name: message.author.tag,
            iconURL: message.author.displayAvatarURL({ dynamic: true }),
          })
          .setDescription(content ? `\`\`\`${content}\`\`\`` : "*No content*")
          .addFields(
            { name: "User", value: `<@${message.author.id}>` },
            { name: "ID", value: message.author.id },
            { name: "Sent", value: `<t:${Math.floor(Date.now() / 1000)}:R>` }
          );

        await logChannel.send({
          content: "<@&1100058514552008704>",
          embeds: [embed],
        });

        return message.reply("✅ Your message has been sent to the moderators.");
      } catch (err) {
        console.error("ModMail Error:", err);
        return message.reply("⚠️ Failed to send your message.");
      }
    }

    // ----------------------------------------------------
    // 2) GUILD-ONLY HANDLING
    // ----------------------------------------------------
    if (!message.guild) return;

    // ----------------------------------------------------
    // LINK BLOCKER (Specific guild)
    // ----------------------------------------------------
    if (message.guild.id === "765170694514016297") {
      try {
        const allowed = ["1118262411049312421", "816699693731676161", "1022422822716461139"];
        const isAllowed = message.member.roles.cache.some((r) => allowed.includes(r.id));

        if (linkRegex.test(content) && !isAllowed) {
          await message.delete().catch(() => {});
          return message.channel.send(`❌ ${message.author}, sharing links is not allowed here.`);
        }
      } catch (err) {
        console.error("Link filter error:", err);
      }
    }

    // ----------------------------------------------------
    // GHOST PING SNAPSHOT
    // ----------------------------------------------------
    try {
      const mentionedUsers = [...message.mentions.users.keys()];
      const mentionedRoles = [...message.mentions.roles.keys()];
      const mentions = [...mentionedUsers, ...mentionedRoles];

      if (mentions.length > 0) {
        ghostPingCache.set(message.id, {
          content,
          author: message.author,
          channel: message.channel,
          mentions,
          timestamp: Date.now(),
        });
      }
    } catch (err) {
      console.error("Ghost ping error:", err);
    }

    // ----------------------------------------------------
    // QUOTE MESSAGE LINKS
    // ----------------------------------------------------
    try {
      const links = [...content.matchAll(msgLinkRegex)];
      for (const match of links) {
        const [, , channelId, msgId] = match;
        try {
          const ch = await client.channels.fetch(channelId).catch(() => null);
          if (!ch || !ch.isTextBased()) continue;

          const quoted = await ch.messages.fetch(msgId).catch(() => null);
          if (!quoted) continue;

          const embed = new EmbedBuilder()
            .setColor("#00b0f4")
            .setAuthor({
              name: quoted.author.tag,
              iconURL: quoted.author.displayAvatarURL({ dynamic: true }),
            })
            .setDescription(quoted.content || "*No content*")
            .setFooter({ text: `Quoted from #${ch.name}` })
            .setTimestamp(quoted.createdAt);

          const attach = quoted.attachments.find((x) => x.contentType?.startsWith("image/"));
          if (attach) embed.setImage(attach.url);

          await message.channel.send({ embeds: [embed] });
        } catch (err) {
          console.error("Quote error:", err);
        }
      }
    } catch {}

    // ----------------------------------------------------
    // TOKEN DETECTION
    // ----------------------------------------------------
    try {
      if (tokenRegex.test(content)) {
        const embed = new EmbedBuilder()
          .setColor("Red")
          .setTitle("🚫 Potential Token Detected")
          .setDescription("Click the button below to delete the original message.");

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`delete_original_${message.id}`)
            .setLabel("Delete Message")
            .setStyle(ButtonStyle.Danger)
        );

        await message.channel.send({ embeds: [embed], components: [row] });
      }
    } catch (err) {
      console.error("Token detection error:", err);
    }

    // ----------------------------------------------------
    // AFK MENTION CHECK
    // ----------------------------------------------------
    try {
      for (const user of message.mentions.users.values()) {
        const afk = await checkMentionAFK(user.id);
        if (afk) {
          const timeAgo = `<t:${Math.floor(afk.time / 1000)}:R>`;
          await message.channel.send(
            `📢 **${user.tag}** is AFK: *${afk.reason}* (since ${timeAgo})`
          );
        }
      }
    } catch (err) {
      console.error("AFK mention error:", err);
    }

    // ----------------------------------------------------
    // CLEAR AFK
    // ----------------------------------------------------
    try {
      const selfAFK = await checkMentionAFK(message.author.id);
      if (selfAFK && !prefixes.some((p) => lower.startsWith(p + "afk"))) {
        await clearAFK(message.author.id);
        await message.reply("✅ You are no longer AFK.");
      }
    } catch (err) {
      console.error("AFK clear error:", err);
    }

    // ----------------------------------------------------
    // ACHIEVEMENT SYSTEM
    // ----------------------------------------------------
    try {
      const achievements = [
        { title: "Certified Clueless", keyword: "idk", key: "idk", count: 15, desc: "You're lost… I'm lost… we're all lost." },
        { title: "Curious George", keyword: "?", key: "questionMark", count: 10, desc: "So many questions… so little patience." },
        { title: "Apex of Disappointment", keyword: "bruh", key: "bruhPeak", count: 25, desc: "You have reached the apex of disappointment." },
        { title: "Emotional Damage", keyword: "cry", key: "cry", count: 10, desc: "Emotionally unstable, but in HD." },
        { title: "Question Overload", keyword: "why", key: "why", count: 10, desc: "Why do you ask so many questions?" },
        { title: "Drama Unleashed", keyword: "noooo", key: "noooo", count: 5, desc: "The drama is strong with this one." },
        { title: "Emojiglyphic Scholar", emojiOnly: true, key: "emojiOnly", count: 25, desc: "Communicating in pure hieroglyphics." },
        { title: "Keyboard Warrior", keyword: "!!!", key: "exclamations", count: 5, desc: "Calm your keyboard, warrior." },
        { title: "Capslock Creature", keyword: "AAAA", key: "caps", count: 5, desc: "Your caps lock needs therapy." },
        { title: "Socially Desperate", keyword: "hello", key: "hello", count: 10, desc: "You talk a lot… suspiciously a lot." },
        { title: "Down Bad Certified", keyword: "love you", key: "loveYou", count: 3, desc: "Down bad detected. Stay hydrated." },
        { title: "Bot’s Bestie", keyword: "hi bot", key: "hiBot", count: 10, desc: "We besties now." },
        { title: "The Philosopher", keyword: "huh", key: "huh", count: 10, desc: "Mind empty. Brain smooth." },
        { title: "Intensity Level: Unnecessary", keyword: "omg", key: "omg", count: 10, desc: "Intensity unmatched, purpose unknown." },
        { title: "JavaScript Survivor", keyword: "javascript", key: "js", count: 5, desc: "You willingly chose pain. Respect." },
        { title: "Python Skeptic", keyword: "python", key: "python", count: 5, desc: "Spaces bad. Anger good." },
        { title: "TypeScript Purist", keyword: "typescript", key: "ts", count: 5, desc: "Your code is safe. Your sanity isn’t." },
        { title: "The Dot Master", keyword: ".", key: "singleDot", count: 10, desc: "Peak “no thoughts, just dots.”" },
        { title: "Grammar Menace", keyword: "u", key: "u", count: 30, desc: "Grammar police have given up." },
      ];

      const seen = new Set();

      for (const a of achievements) {
        if (a.emojiOnly) {
          const isEmoji = /^[\p{Extended_Pictographic}\p{Emoji}]+$/u.test(content);
          if (!isEmoji) continue;

          if (seen.has(a.key)) continue;
          seen.add(a.key);

          const count = await incrementCounter(message.author.id, a.key).catch(() => null);
          if (count === a.count) {
            await unlockAchievement(message.author.id, message.channel, a.title, a.desc);
          }
          continue;
        }

        if (!matchesKeyword(lower, a.keyword)) continue;
        if (seen.has(a.key)) continue;

        seen.add(a.key);

        const count = await incrementCounter(message.author.id, a.key).catch(() => null);
        if (count === a.count) {
          await unlockAchievement(message.author.id, message.channel, a.title, a.desc);
        }
      }
    } catch (err) {
      console.error("Achievement error:", err);
    }

    // ----------------------------------------------------
    // BOT MENTION RESPONSE
    // ----------------------------------------------------
    try {
      const botMention = `<@${client.user.id}>`;
      if (lower.includes(botMention)) {
        const tips = [
          "You can mention me directly to check my prefixes!",
          "Try using Slash Commands for a smoother experience!",
          "Looking for a specific feature? Try /help to find relevant commands!",
          "Want to report a bug? Use /report-issue",
          "Did you know? You can use the prefix command quote!",
          "Use /info for bot stats!",
          "Try the prefix command nasa for NASA images!",
          "Need help? Use /raise-ticket!",
        ];

        const randomTip = tips[Math.floor(Math.random() * tips.length)];

        let totalMembers = 0;
        for (const g of client.guilds.cache.values()) {
          try {
            const fetched = await client.guilds.fetch(g.id);
            totalMembers += fetched.memberCount;
          } catch {}
        }

        const embed = new EmbedBuilder()
          .setColor("#ffcc00")
          .setTitle("👋 Hey there!")
          .setDescription(
            `✨ **Greetings, ${message.author.username}!**\n\n` +
            "🚀 **I am here to assist you!**\n" +
            `🔹 My prefixes are: ${prefixes.map(p => `\`${p}\``).join(", ")}\n` +
            "🔹 Need help? Use **`/help`**!\n" +
            `💡 **Pro Tip:** ${randomTip}`
          )
          .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 256 }))
          .addFields(
            { name: "📡 Servers", value: `${client.guilds.cache.size}`, inline: true },
            { name: "👥 Users", value: `${totalMembers}`, inline: true },
            { name: "⏳ Uptime", value: `<t:${Math.floor(client.readyTimestamp / 1000)}:R>`, inline: true }
          )
          .setFooter({
            text: "Your friendly bot assistant ✨",
            iconURL: client.user.displayAvatarURL(),
          });

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel("Support Server")
            .setStyle(ButtonStyle.Link)
            .setURL("https://discord.gg/Xyk2TjeAMJ")
        );

        return message.reply({ embeds: [embed], components: [row] });
      }
    } catch (err) {
      console.error("Bot mention handler error:", err);
    }

    // ----------------------------------------------------
    // CUSTOM PREDEFINED RESPONSES
    // ----------------------------------------------------
    try {
      const responses = {
        welcome: { triggers: ["thank you", "thanks", "thx"], response: "https://tenor.com/view/disney-moana-youre-welcome-maui-dance-gif-15810606" },
        sneeze: { triggers: ["achoo"], response: "Bless you!" },
        pika: { triggers: ["pikachu", "pika"], response: "Pika Pika" },
        question: { triggers: ["?"], response: "I'm confused too." }
      };

      for (const key in responses) {
        const entry = responses[key];
        if (entry.triggers.some((t) => lower === t)) {
          return message.reply(entry.response);
        }
      }
    } catch (err) {
      console.error("Custom responses error:", err);
    }

    // ----------------------------------------------------
    // PREFIX COMMAND HANDLER (BLACKLIST CHECK HERE ONLY)
    // ----------------------------------------------------
    try {
      const prefix = prefixes.find((p) => lower.startsWith(p));
      if (!prefix) return;

      // 🚫 BLACKLIST CHECK — **ONLY BLOCK BOT COMMANDS**
      if (await isBlacklisted(message.author.id)) {
        return message.reply("🚫 You are blacklisted from using bot commands.").catch(() => {});
      }

      const args = lower.slice(prefix.length).trim().split(/ +/);
      const commandName = args.shift().toLowerCase();

      // Prevent using prefix for slash commands
      const slashNames = [
        ...commandsGlobal.map((x) => x.name),
        ...commandsGuild.map((x) => x.name),
      ];

      if (slashNames.includes(commandName)) {
        return message.reply(`❌ \`${prefix}${commandName}\` is a slash command. Use \`/${commandName}\`.`);
      }

      const cmd = commands.get(commandName);
      if (!cmd) return;

      await message.channel.sendTyping();
      await cmd(client, message, args, commands);
    } catch (err) {
      console.error("Prefix command error:", err);
      message.reply("❌ Error running command.");
    }

  } catch (fatal) {
    console.error("FATAL messageCreate error:", fatal);
  }
};
