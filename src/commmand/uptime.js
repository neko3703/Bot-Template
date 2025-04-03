// this is used for prefix commands => [client, interactionOrMessage, args]
import { EmbedBuilder } from "discord.js"; // use this to import packages from discord.js in your command files, if you are using any...

export default async (client, interactionOrMessage, args) => {
    function formatTime(milliseconds) {
      const totalSeconds = Math.floor(milliseconds / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor(totalSeconds / 3600) % 24;
      const minutes = Math.floor(totalSeconds / 60) % 60;
      const seconds = totalSeconds % 60;
      return `${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`;
    }
  
    const uptime = formatTime(client.uptime);
  
    if (interactionOrMessage.reply) {
      // Message command
      return interactionOrMessage.reply(`I'm online for: ${uptime}`);
    } else {
      // Slash command
      return interactionOrMessage.reply({ content: `I'm online for: ${uptime}`, ephemeral: true });
    }
  };
  
