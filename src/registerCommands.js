import { REST } from "@discordjs/rest";
import { Routes } from "discord.js";
import { config } from "dotenv";
import { type } from "os";
import { deserialize } from "v8";

config();

const TOKEN = process.env.TOKEN;
const ClientID = process.env.CLIENT_ID;
const GuildID = process.env.GuildID; // Trim spaces just in case

const rest = new REST({ version: "10" }).setToken(TOKEN);

const globalCommands = [
  {
    name: "purge",
    description: "Deletes a set number of messages",
    options: [
      {
        name: "amount",
        description: "Number of messages to delete",
        type: 4,
        required: true,
      },
      {
        name: "user",
        description: "Delete messages of a specific user",
        type: 6,
        required: false,
      },
    ],
  },
  {
    name: "ping",
    description: "Returns the latency of the bot",
  },
  {
    name: "whisper",
    description: "Whispers a user",
    options: [
      {
        name: "user",
        description: "User to whisper",
        type: 6,
        required: true,
      },
      {
        name: "message",
        description: "Type the message to whisper",
        type: 3,
        required: true,
      },
    ],
  },
  {
    name: "kick",
    description: "Kick a user from the server",
    options: [
      {
        name: "user",
        description: "User to kick",
        type: 6,
        required: true,
      },
      {
        name: "reason",
        description: "Reason to kick the user",
        type: 3,
        required: false,
      },
    ],
  },
  {
    name: "confess",
    description: "Confess something anonymously",
    options: [
      {
        name: "confession",
        description: "What you want to confess?",
        type: 3,
        required: true,
      },
    ],
  },
  {
    name: "info",
    description: "Some information about me!",
  },
  {
    name: "suggest",
    description: "Suggest something",
    options: [
      {
        name: "suggestion",
        description: "What you want to suggest?",
        type: 3,
        required: true,
      },
    ],
  },
  {
    name: "user-info",
    description: "Get a user's information",
    options: [
      {
        name: "user",
        description: "Name of the for which you want to know about",
        type: 6,
        required: true,
      }
    ]
  },
  {
    name: "warn",
    description: "Warn a user in the server",
    options: [
      {
        name: "user",
        description: "Tag the user to whom you want to issue a warning",
        type: 6,
        required: true,
      },
      {
        name: "reason",
        description: "Reason for the warning",
        type: 3,
        required: false,
      }
    ]
  },
  {
    name: "warn-count",
    description: "Get the number of warning a user in the server has",
    options: [
      {
        name: "user",
        description: "User for which the count is to be determined",
        type: 6,
        required: true,
      }
    ]
  },
  {
    name: "clear-warns",
    description: "Clear all the warning of a user in the server",
    options: [
      {
        name: "user",
        description: "User for which the warnings are being removed",
        type: 6,
        required: true,
      }
    ]
  },
  {
    name: "anime-quote",
    description: "Random anime quote",
  },
  {
    name: "avatar",
    description: "View avatar of a user",
    options: [
      {
        name: "user",
        description: "User for which you want to see avatar",
        type: 6,
        requried: false,
      }
    ]
  },
  {
    name: "ban",
    description: "Ban a user from the server",
    options: [
      {
        name: "user",
        description: "User you want to ban",
        type: 6,
        required: true,
      },
      {
        name: "reason",
        description: "Reason for the ban",
        type: 3,
        required: false,
      }
    ]
  },
  {
    name: "cat",
    description: "Sends a random cute cat picture!",
  },
  {
    name: "create-channel",
    description: "Create a channel",
    options: [
      {
        name: "name",
        description: "Name of the channel",
        type: 3,
        required: true,
      },
      {
        name: "topic",
        description: "Topic of the channel",
        type: 3,
        required: true,
      }
    ]
  },
  {
    name: "raise-ticket",
    description: "Raise a ticket for a ongoing issue",
    options: [
      {
        name: "issue",
        description: "Describe your issue",
        type: 3,
        required: true,
      }
    ]
  },
  {
    name: "validate-cc",
    description: "Validate a credit or debit card number",
    options: [
      {
        name: "cc-number",
        description: "Credit or debit card number to verify",
        type: 3,
        required: true,
      }
    ]
  },
  {
    name: "cry",
    description: "Sends crying anime GIF"
  },
  {
    name: "dance",
    description: "Sends danceing anime GIF"
  },
  {
    name: "delete-channel",
    description: "Delete a channel with it's ID",
    options: [
      {
        name: "channel",
        description: "ID of the channel you wish to delete",
        type: 3,
        required: true,
      }
    ]
  },
  {
    name: "dog",
    description: "Sends a cute dog image"
  },
  {
    name: "happy",
    description: "Sends a happy anime GIF"
  },
  {
    name: "eight-ball",
    description: "Ask a question to decide something",
    options: [
      {
        name: "question",
        description: "Ask a question",
        type: 3,
        required: true,
      }
    ]
  },
  {
    name: "embed",
    description: "Create an embed",
    options: [
      {
        name: "title",
        description: "Title of the embed",
        type: 3,
        required: true,
      },
      {
        name: "description",
        description: "Description of the embed",
        type: 3,
        required: true,
      },
      {
        name: "url",
        description: "URL",
        type: 3,
        required: false,
      },
      {
        name: "footer",
        description: "Footer of the embed",
        type: 3,
        required: false,
      },
      {
        name: "thumbnail",
        description: "Thumbnail of the embed",
        type: 3,
        required: false,
      }
    ]
  },
  {
    name: "guilds",
    description: "List out guilds I am in",
  },
  {
    name: "help",
    description: "Pops-up the help menu",
  },
  {
    name: "create-invite",
    description: "Create an invite link for this server",
  },
  {
    name: "invite",
    description: "Invite me to your server",
  },
  {
    name: "joke",
    description: "Shares a joke",
  },
  {
    name: "movie",
    description: "Suggests a movie",
  },
  {
    name: "set-nickname",
    description: "Set a user's nickname",
    options: [
      {
        name: "user",
        description: "User for which you want to change the nickname",
        type: 6,
        required: true,
      },
      {
        name: "nickname",
        description: "Nickname for the user",
        type: 3,
        required: false,
      }
    ]
  },
  {
    name: "generate-password",
    description: "Create a strong password",
    options: [
      {
        name: "length",
        description: "Length of the password you want to use. Default: 15",
        type: 4,
        required: false,
      }
    ]
  },
  {
    name: "add-role",
    description: "Add a role to a user",
    options: [
      {
        name: "role",
        description: "Role you want to add",
        type: 8,
        required: true,
      },
      {
        name: "user",
        description: "User whom you want to assign the role",
        type: 6,
        required: true,
      }
    ]
  },
  {
    name: "remove-role",
    description: "Remove a role from a user",
    options: [
      {
        name: "user",
        description: "User from whom you want to remove the role",
        type: 6, 
        required: true
      },
      {
        name: "role",
        description: "Role you want to remove",
        type: 8, 
        required: true
      },
      {
        name: "reason",
        description: "Reason for removing the role",
        type: 3, 
        required: false
      }
    ]
  },
  {
    name: "report-issue",
    description: "Report a issue being faced while using the bot",
    options: [
      {
        name: "issue",
        description: "Issue you are facing. Please describe in detail",
        type: 3,
        required: true,
      }
    ]
  },
  {
    name: "server-info",
    description: "Get information about this server",
  },
  {
    name: "slap",
    description: "Sends a slapping anime GIF",
  },
  {
    name: "timeout",
    description: "Timeout a user",
    options: [
      {
        name: "user",
        description: "User you want to timeout",
        type: 6,
        required: true,
      },
      {
        name: "time",
        description: "How long (in minutes) is the timeout?",
        type: 4,
        required: true,
      },
      {
        name: "reason",
        description: "Reason for timeout",
        type: 3,
        required: false,
      }
    ]
  },
  {
    name: "translate",
    description: "Translate something!",
    options: [
      {
        name: "text",
        description: "The text you want to translate.",
        type: 3,
        required: true,
      },
      {
        name: "language",
        description: "Target language (e.g., 'es' for Spanish, 'fr' for French).",
        type: 3,
        required: true,
      }
    ]
  },
  {
    name: "wink",
    description: "Sends a winking anime GIF",
  },
  {
    name: "hire",
    description: "Hire my developer for creating a discord app for you!",
  }
];

const guildCommands = [
  {
    name: "report",
    description: "Report a user",
    options: [
      {
        name: "user",
        description: "User whom you are reporting",
        type: 6,
        required: true,
      },
      {
        name: "reason",
        description: "Reason for reporting the user",
        type: 3,
        required: true,
      }
    ]
  },
  {
    name: "announce",
    description: "Create an announcement",
    options: [
      {
        name: "news",
        description: "Message to announce",
        type: 3,
        required: true,
      },
    ],
  },
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
  {
    name: "leave-guild",
    description: "Leave a guild",
    options: [
      {
        name: "guild_id",
        description: "ID of the guild",
        type: 3,
        required: true,
      }
    ]
  },
  {
    name: "user-count",
    description: "Number of users that I help",
  }
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
