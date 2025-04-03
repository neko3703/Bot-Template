// This is customized for my bot. Feel free to update this as your bot's needs

import { commandsGlobal, commandsGuild } from "../registerCommands.js";
import { EmbedBuilder } from "discord.js";

export default async (client, message, commands) => {
  if (message.author.bot || !message.guild) return; // Ignore bot messages & DMs

  const content = message.content.trim().toLowerCase();
  const botMention = `<@${client.user.id}>`;

  // ✅ Define Multiple Prefixes
const prefixes = ["!", "$", "?", ">"]; // Modify as needed
const prefix = prefixes.find(p => content.startsWith(p));

// ✅ Pro Tips List
const proTips = [
  "You can mention me directly to check my prefixes!",
  "Try using Slash Commands for a smoother experience!",
  "Looking for a specific feature? Try `/help` to find relevant commands!",
  "Use the prefix command `uptime` to check how long I've been online!",
  "Want to report a bug or suggest a feature? Contact my developer at `contact@nekocode.in` or use /report-issue",
  "Did you know? You can use the prefix command `quote` to get a random inspirational quote!",
  "For advanced users: Use `/info` to get detailed bot stats!",
  "You can mention me directly to check my prefixes!",
  "Need assistance? Try using `/raise-ticket` to get help!",
  "Try using Slash Commands for a smoother experience!",
  "You can use multiple prefixes: `!`, `$`, `?`, `>` – pick your favorite!",
  "For advanced users: Use `/debug` to get detailed bot stats!",
  "Try the prefix command `gita` to receive a random verse from the Bhagavad Gita!",
  "Check the latest NASA image with the prefix command `nasa`!",
  "Do you like anime? Try `/anime-quote`!",
  "Use the prefix command `mcserver` to check the status of your favorite Minecraft server!",
  "Curious about space? Use the prefix command `mars` to get the latest Mars images!",
  "Want to know a color's hex code? Use the prefix command `rgb` to convert it!",
  "Use the prefix command `factor` to calculate the factors of any number!",
  "You can invite me to other servers! Use `/invite` to get my link!"
];

// ✅ Pick a Random Pro Tip
const randomTip = proTips[Math.floor(Math.random() * proTips.length)];

// ✅ Respond when bot is mentioned
if (content.startsWith(botMention)) {
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
    .setFooter({
      text: "Your friendly bot assistant ✨",
      iconURL: client.user.displayAvatarURL({ dynamic: true }),
    });

  return message.reply({ embeds: [embed] });
}

  // ✅ Custom Message Responses
  const customResponses = {
    "thank you": "https://tenor.com/view/disney-moana-youre-welcome-maui-dance-gif-15810606",
    "achoo": "Bless you!",
    "pikachu": "Pika Pika",
  };

  if (customResponses[content]) {
    return message.reply(customResponses[content]);
  }

  // ✅ Handle Prefix Commands
  if (!prefix) return; // Ignore if no valid prefix is used

  const args = content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  message.channel.sendTyping();

  // ❌ Prevent Prefix Use for Slash Commands
  const allSlashCommands = [
    ...commandsGlobal.map(cmd => cmd.name),
    ...commandsGuild.map(cmd => cmd.name),
  ];

  if (allSlashCommands.includes(commandName)) {
    return message.reply(
      `❌ \`${prefix}${commandName}\` is a **slash command**, not a prefix command!\nUse \`/${commandName}\` instead.`
    );
  }

  // ✅ Execute Prefix Command
  const command = commands.get(commandName);
  if (!command) {
    return message.reply(`❌ \`${prefix}${commandName}\` is not a valid command.`);
  }

  try {
    await command(client, message, args);
  } catch (error) {
    console.error("❌ Error executing command:", error);
    message.reply("❌ An error occurred while executing the command.");
  }
};
