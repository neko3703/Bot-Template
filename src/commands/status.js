import { ActivityType } from "discord.js";

export default async (client, interaction) => {
  try {
    // Fetching the options from the interaction
    const activityName = interaction.options.getString("status");
    const activityType = interaction.options.getString("activity");

    // Mapping user-friendly input to Discord.js ActivityType enum
    const activityTypeMapping = {
      Watching: ActivityType.Watching,
      Listening: ActivityType.Listening,
      Playing: ActivityType.Playing,
      Competing: ActivityType.Competing,
      Streaming: ActivityType.Streaming,
    };

    // Get the correct enum value
    const selectedActivityType = activityTypeMapping[activityType];

    // Check if the activity type is valid
    if (!selectedActivityType) {
      return await interaction.reply({
        content: `❌ Invalid activity type: **${activityType}**. Valid types: Watching, Listening, Playing, Competing, Streaming.`,
        ephemeral: true,
      });
    }

    // Setting the bot's status
    client.user.setActivity(activityName, {
      type: selectedActivityType,
    });

    // Confirmation response
    await interaction.reply({
      content: `✅ Status set to **${activityType}**: ${activityName}`,
      ephemeral: true,
    });
  } catch (err) {
    console.error(err);
    await interaction.reply({
      content: `❌ Error: ${err.message}`,
      ephemeral: true,
    });
  }
};
