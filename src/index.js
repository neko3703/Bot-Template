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
import cron from "node-cron";
import runDailyTask from "./daily.js";
import { readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import uptimeCommand, { onDisconnect, onReconnect, beforeShutdown } from "./commands/uptime.js";
import { loadAll } from "./handlers/reloader.js";
import { autoReload } from "./handlers/autoReload.js";

// --- Init ---
config();
const __dirname = dirname(fileURLToPath(import.meta.url));
const prefix = "!";
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

// Event listeners for uptime tracking
client.on("shardDisconnect", onDisconnect);
client.on("shardReconnecting", onReconnect);

process.on("unhandledRejection", (reason) => {
  console.error("🔥 Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", err);
});

// Graceful shutdown hooks
process.on("SIGINT", () => {
  console.log("Bot is shutting down (SIGINT)...");
  beforeShutdown();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("Bot is shutting down (SIGTERM)...");
  beforeShutdown();
  process.exit(0);
});

process.on("beforeExit", () => {
  console.log("Bot is shutting down (beforeExit)...");
  beforeShutdown();
});

// --- Daily Cron ---
cron.schedule("0 7 * * *", () => runDailyTask(client), {
  timezone: "Asia/Kolkata",
});

// Update code every minute to pick up changes without restart
cron.schedule("* * * * * *", async () => {
  await autoReload(client, commands);
});

await loadAll(client, commands);

// --- Final login ---
(async () => {
  await loadModules();
  client.login(TOKEN);
  registerCommands();
})();
