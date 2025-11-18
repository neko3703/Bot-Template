import { EmbedBuilder, PermissionFlagsBits } from "discord.js";

export default async (client, interaction) => {
  if (!interaction.isChatInputCommand() || interaction.commandName !== "ban") return;

  await interaction.deferReply({ ephemeral: true });

  // Get user and reason
  const user = interaction.options.getUser("user");
  const reason = interaction.options.getString("reason") || `No reason provided by <@${interaction.user.id}>`;

  if (!user) {
    return interaction.editReply({ content: "❌ Please mention a valid user!" });
  }

  // Check if the bot has permission to ban
  if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
    return interaction.editReply({ content: "❌ I don't have permission to ban members!" });
  }

  // Check if the user has permission to ban members
  if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
    return interaction.editReply({ content: "❌ You don't have permission to ban members!" });
  }

  try {
    const guild = interaction.guild;
    
    // Ban user
    await interaction.guild.members.ban(user.id, { reason });

    // Send ban confirmation message
    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle("🚨 User Banned!")
      .setDescription(`**User:** <@${user.id}>\n**Reason:** ${reason}\n**Moderator:** <@${interaction.user.id}>`);

    await interaction.editReply({ embeds: [embed] });

    // Try sending a DM to the banned user
    try {
      const dmEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("⚠️ You have been banned!")
        .setDescription(`🔨 You have just been banned from the server: **${guild.name}**\n\n**Reason:** ${reason}\n**Moderator:** <@${interaction.user.id}>`);

      await user.send({ embeds: [dmEmbed] });
    } catch (error) {
      console.log(`⚠️ Could not DM the banned user: ${error.message}`);
      await interaction.followUp({ content: "⚠️ Could not DM the user!", ephemeral: true });
    }
  } catch (error) {
    console.error("❌ Error banning user:", error);
    await interaction.editReply({ content: "❌ An error occurred while trying to ban the user." });
  }
};
