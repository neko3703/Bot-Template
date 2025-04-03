import { REST } from "@discordjs/rest";
import { Routes } from "discord.js";
import { config } from "dotenv";
import { type } from "os";
import { deserialize } from "v8";

config();

const TOKEN = process.env.TOKEN;
const ClientID = process.env.CLIENT_ID; // Your bot's ID
const GuildID = process.env.GuildID; // Guild ID of your server to register commands specfic to your server

const rest = new REST({ version: "10" }).setToken(TOKEN);

// Learn about registering commands here: https://discord.com/developers/docs/interactions/application-commands
// Register global commands here
const globalCommands = [
  {
    name: "ping",
    description: "Returns the latency of the bot",
  },
];

// Register guild specific commands here 
const guildCommands = [
  {
    name: "status",
    description: "Sets my status",
    options: [
      {
        name: "status",
        description: "Status activity",
        type: 3,
        required: true,
      },
      {
        name: "activity",
        description: "Activity type",
        type: 3,
        required: true,
        choices: [
          { name: "WATCHING", value: "Watching" },
          { name: "LISTENING", value: "Listening" },
          { name: "GAME", value: "Playing" },
          { name: "COMPETING", value: "Competing" },
          { name: "STREAMING", value: "Streaming" },
        ],
      },
    ],
  },
];


export async function registerCommands() {
  try {
    console.log(`✅ Registering ${globalCommands.length} global commands...`);
    await rest.put(Routes.applicationCommands(ClientID), { body: globalCommands });
    console.log(`✅ Global commands registered!`);

    if (!GuildID) {
      console.error("❌ Error: GUILD_ID is missing from .env file.");
      return;
    }

    console.log(`✅ Registering ${guildCommands.length} guild commands for ${GuildID}...`);
    await rest.put(Routes.applicationGuildCommands(ClientID, GuildID), { body: guildCommands });
    console.log(`✅ Guild commands registered!`);

  } catch (error) {
    console.error("❌ Error registering commands:", error);
  }
}


export const commandsGlobal = globalCommands;
export const globalCommandsLength = globalCommands.length;
export const commandsGuild = guildCommands;
