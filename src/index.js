import { config } from "dotenv";
import { Client, GatewayIntentBits, EmbedBuilder } from "discord.js";
import { registerCommands } from "./registerCommands.js";
import { readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Convert import.meta.url to __dirname equivalent
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables
config();

const prefix = "!";
const TOKEN = process.env.TOKEN;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // Requires message content intent to be enabled
    GatewayIntentBits.GuildMembers, // Requires the GUILD_MEMBERS intent to be enabled
  ],
});

// Function to find a channel by name
function findChannelByName(guild, channelName) {
  return guild.channels.cache.find(
      (channel) => channel.name.toLowerCase() === channelName.toLowerCase()
  );
}

// When a new member joins
client.on("guildMemberAdd", (member) => {
  const channel = findChannelByName(member.guild, "welcome");
  if (!channel) return;

  const embed = new EmbedBuilder()
      .setColor("#ffcc00") // Cute yellow color
      .setTitle("🎉 Welcome to the Server!")
      .setDescription(`👋 Hey <@${member.id}>, we're so happy to have you here! 🌟\nMake yourself at home and have fun! 🎈`)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: `Welcome to ${member.guild.name}!`, iconURL: member.guild.iconURL({ dynamic: true }) });

  channel.send({ embeds: [embed] });
});

// When a member leaves
client.on("guildMemberRemove", (member) => {
  const channel = findChannelByName(member.guild, "goodbye");
  if (!channel) return;

  const embed = new EmbedBuilder()
      .setColor("#ff6666") // Cute red color
      .setTitle("💔 Goodbye, Friend!")
      .setDescription(`😢 **${member.user.tag}** just left the server...\nWe hope to see you again someday! 🌠`)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: `Goodbye from ${member.guild.name}!`, iconURL: member.guild.iconURL({ dynamic: true }) });

  channel.send({ embeds: [embed] });
});

// Load commands dynamically
const commands = new Map();
const commandFiles = readdirSync(resolve(__dirname, "./commands")).filter(file => file.endsWith(".js"));
for (const file of commandFiles) {
  const { default: command } = await import(`./commands/${file}`);
  const commandName = file.replace(".js", ""); // Extract filename as command name
  commands.set(commandName, command);
}

// Load events dynamically
const eventFiles = readdirSync(resolve(__dirname, "./events")).filter(file => file.endsWith(".js"));
for (const file of eventFiles) {
  const { default: eventHandler } = await import(`./events/${file}`);
  const eventName = file.replace(".js", "");
  client.on(eventName, (...args) => eventHandler(client, ...args));
}

// Load interactions dynamically
const interactionFiles = readdirSync(resolve(__dirname, "./interactions")).filter(file => file.endsWith(".js"));
for (const file of interactionFiles) {
  const { default: interactionHandler } = await import(`./interactions/${file}`);
  const eventName = file.replace(".js", "");

  if (eventName === "messageCreate") {
    client.on(eventName, (...args) => interactionHandler(client, ...args, commands, prefix));
  } else {
    client.on(eventName, (...args) => interactionHandler(client, ...args, commands));
  }
}

// Logging into the bot
client.login(TOKEN);

// Register commands
(async () => {
  await registerCommands();
})();
