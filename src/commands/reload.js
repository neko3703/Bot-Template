import { autoReload } from "../handlers/autoReload.js";

let lastReload = 0;

export default async (client, message, args, commands) => {
  if (message.author.id !== process.env.BOT_OWNER_ID) {
    return message.reply("❌ Admin only.");
  }

  const now = Date.now();
  if (now - lastReload < 5000) {
    return message.reply("⏳ Please wait 5 seconds between reloads.");
  }

  lastReload = now;

  try {
    await autoReload(client, commands);
    return message.reply("♻️ Reload completed.");
  } catch (err) {
    console.error("Reload command error:", err);
    return message.reply("❌ Reload failed.");
  }
};
