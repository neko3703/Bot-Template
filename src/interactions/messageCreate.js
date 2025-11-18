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

// Bot's recognized prefixes
const prefixes = ["!", "$", "?", ">"];

// ------------------------------
// REGEX + COOL DOWNS + HELPERS
// ------------------------------
const linkRegex = /\b(?:(?:https?:\/\/|www\.)[^\s]+|discord\.gg\/[A-Za-z0-9-]+)\b/i; // For detecting a link
const msgLinkRegex = /https?:\/\/(?:canary\.)?discord(?:app)?\.com\/channels\/(\d+)\/(\d+)\/(\d+)/g; // For detecting a discord message link
const tokenRegex = /[\w-]{24}\.[\w-]{6}\.[\w-]{25,}/; // For detecting discord user/bot tokens

const cooldowns = new Map();
const processedMessages = new Set();

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

// ------------------------------
// MAIN MERGED EXPORT
// ------------------------------
export default async (client, message, commands) => {
  try {
    if (!message || message.author.bot) return;

    // Prevent double-trigger from double messageCreate events
    if (processedMessages.has(message.id)) return;
    processedMessages.add(message.id);
    setTimeout(() => processedMessages.delete(message.id), 10_000);

    const content = message.content || "";
    const lower = content.toLowerCase().trim();

    // ------------------------------
    // 1) MODMAIL (DM HANDLING)
    // ------------------------------
    if (message.channel.type === ChannelType.DM) {
      try {
        const guild = client.guilds.cache.get("765170694514016297");
        if (!guild) return;

        const member = await guild.members.fetch(message.author.id).catch(() => null);
        if (!member) {
          return await message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor("Red")
                .setTitle("🚫 You’re not in the server!")
                .setDescription("Join the server to contact moderators."),
            ],
          });
        }

        // Cooldown (30 seconds)
        const cdKey = `modmail_${message.author.id}`;
        const last = cooldowns.get(cdKey);
        if (last && Date.now() - last < 30_000) {
          const remaining = Math.ceil((30_000 - (Date.now() - last)) / 1000);
          return await message.reply(
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

        await message.reply("✅ Your message has been sent to the moderators.");
      } catch (err) {
        console.error("ModMail Error:", err);
        message.reply("⚠️ Failed to send your message.");
      }

      return;
    }

    // ------------------------------
    // 2) GUILD-ONLY HANDLING STARTS
    // ------------------------------
    if (!message.guild) return;

    // ------------------------------
    // 3) LINK BLOCKER (specific guild)
    // ------------------------------
    if (message.guild.id === "765170694514016297") {
      try {
        const allowed = ["1118262411049312421", "816699693731676161", "1022422822716461139"];
        const isAllowed = message.member.roles.cache.some((r) => allowed.includes(r.id));

        if (linkRegex.test(content) && !isAllowed) {
          await message.delete().catch(() => {});
          return await message.channel.send(`❌ ${message.author}, sharing links is not allowed here.`);
        }
      } catch (err) {
        console.error("Link filter error:", err);
      }
    }

    // ------------------------------
    // 4) GHOST PING SNAPSHOT
    // ------------------------------
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

    // ------------------------------
    // 5) QUOTE MESSAGE LINKS
    // ------------------------------
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

    // ------------------------------
    // 6) TOKEN DETECTION
    // ------------------------------
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

    // ------------------------------
    // 7) BOT MENTION → RESPONSE
    // ------------------------------
    try {
      const botMention = `<@${client.user.id}>`;
      if (lower.includes(botMention)) {
        const tips = [
          "You can mention me directly to check my prefixes!",
          "Try using Slash Commands for a smoother experience!",
          "Looking for a specific feature? Try /help to find relevant commands!",
          "Want to report a bug or suggest a feature? Contact my developer at contact@nekocode.in",
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
          .setColor("#ffcc00") // Vibrant color
          .setTitle("👋 **Hey there, traveler!**")
          .setDescription(
            `✨ **Greetings, ${message.author.username}!**\n\n` +
            "🚀 **I am here to assist you!**\n" +
            `🔹 My prefixes are: ${prefixes.map(p => `\`${p}\``).join(", ")}\n` +
            "🔹 Need help? Use **`/help`** to see what I can do!\n" +
            `💡 **Pro Tip:** ${randomTip}` // Random pro tip
          )
          .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 256 }))
          .setImage("https://media.tenor.com/Ufgw1b8oylYAAAAC/discord.gif")
          .addFields(
            { name: "📡 Servers", value: `${client.guilds.cache.size}`, inline: true },
            { name: "👥 Users", value: `${totalMembers}`, inline: true },
            { name: "⏳ Uptime", value: `<t:${Math.floor(client.readyTimestamp / 1000)}:R>`, inline: true }
          )
          .setFooter({
            text: "Your friendly bot assistant ✨",
            iconURL: client.user.displayAvatarURL({ dynamic: true }),
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

    // ------------------------------
    // 8) CUSTOM PREDEFINED RESPONSES
    // ------------------------------
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

    // ------------------------------
    // 9) PREFIX COMMAND HANDLER
    // ------------------------------
    try {
      const prefix = prefixes.find((p) => lower.startsWith(p));
      if (!prefix) return;

      const args = lower.slice(prefix.length).trim().split(/ +/);
      const commandName = args.shift().toLowerCase();

      // Prevent prefix usage for slash commands
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
      await cmd(client, message, args);
    } catch (err) {
      console.error("Prefix command error:", err);
      message.reply("❌ Error running command.");
    }
  } catch (fatal) {
    console.error("FATAL messageCreate error:", fatal);
  }
};
