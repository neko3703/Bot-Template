import { config } from "dotenv";
import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  PermissionsBitField,
  ChannelType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Partials,
} from "discord.js";
import { registerCommands } from "./registerCommands.js";
import { readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// --- Init ---
config();
const __dirname = dirname(fileURLToPath(import.meta.url));

const prefix = "!"; // Change this to your preferred prefix
const TOKEN = process.env.TOKEN;

// --- Load Commands/Events/Interactions ---
const commands = new Map();
const loadModules = async () => {
  for (const file of readdirSync(resolve(__dirname, "./commands")).filter((f) =>
    f.endsWith(".js")
  )) {
    const { default: command } = await import(`./commands/${file}`);
    commands.set(file.replace(".js", ""), command);
  }
  for (const file of readdirSync(resolve(__dirname, "./events")).filter((f) =>
    f.endsWith(".js")
  )) {
    const { default: eventHandler } = await import(`./events/${file}`);
    const eventName = file.replace(".js", "");
     // ⛔ Skip messageCreate in events folder
    if (eventName === "messageCreate") continue;
    client.on(eventName, (...args) => eventHandler(client, ...args));
  }
  for (const file of readdirSync(resolve(__dirname, "./interactions")).filter(
    (f) => f.endsWith(".js")
  )) {
    const { default: interactionHandler } = await import(
      `./interactions/${file}`
    );
    const eventName = file.replace(".js", "");
    client.on(eventName, (...args) =>
      eventName === "messageCreate"
        ? interactionHandler(client, ...args, commands, prefix)
        : interactionHandler(client, ...args, commands)
    );
  }
};

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
});


// --- Final login ---
(async () => {
  await loadModules();
  client.login(TOKEN);
  registerCommands();
})();
