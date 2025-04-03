export default async (client, interaction, commands) => {
  if (interaction.isChatInputCommand()) {
      const command = commands.get(interaction.commandName);
      if (!command) {
          return await interaction.reply({
              content: `❌ Command \`${interaction.commandName}\` not found.`,
              ephemeral: true,
          });
      }

      try {
          await command(client, interaction);
      } catch (error) {
          console.error(error);
          await interaction.reply({
              content: "❌ There was an error executing this command.",
              ephemeral: true,
          });
      }
  }

  // Handle Button Interactions
  if (interaction.isButton()) {
      console.log(`🔘 Button Clicked: ${interaction.customId}`);

      if (interaction.customId === "create_ticket") {
          await handleCreateThread(interaction);
      } else if (interaction.customId === "close_ticket") {
          await handleCloseThread(interaction);
      } else {
          console.log("❌ Unknown button clicked:", interaction.customId);
      }
  }
};

// Import button handlers
import { handleCreateThread, handleCloseThread } from "../commands/raise-ticket.js";
