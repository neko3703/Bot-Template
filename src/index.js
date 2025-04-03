import { config } from "dotenv";
import { Client, GatewayIntentBits } from "discord.js";
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
    GatewayIntentBits.MessageContent,
  ],
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
