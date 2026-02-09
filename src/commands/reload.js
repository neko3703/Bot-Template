import {
  reloadCommands,
  reloadEvents,
  reloadState,
  reloadUtils,
  reloadConstants,
} from "../handlers/reloader.js";

export default async (client, message, args, commands) => {
  if (message.author.id !== process.env.BOT_OWNER_ID) { // Replace with your discord ID
    return message.reply("❌ Admin only.");
  }

  const target = args[0];
  if (!target) {
    return message.reply("Usage: `!reload all`");
  }

  try {
    if (target === "all") {
      await reloadUtils();
      await reloadConstants();
      await reloadState();
      await reloadCommands(commands); 
      await reloadEvents(client);

      return message.reply("♻️ All files reloaded successfully.");
    }

    if (target === "commands") {
      await reloadCommands(commands); 
      return message.reply("♻️ Commands reloaded.");
    }

    if (target === "events") {
      await reloadEvents(client);
      return message.reply("♻️ Events reloaded.");
    }

    return message.reply("❌ Invalid reload target.");
  } catch (err) {
    console.error("Reload command error:", err);
    return message.reply("❌ Reload failed. Check console.");
  }
};
