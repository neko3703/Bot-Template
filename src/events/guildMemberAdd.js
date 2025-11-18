import { EmbedBuilder, PermissionsBitField, ChannelType } from "discord.js";
import { getCustomWelcomeMessage } from "../utils/welcome.js";

export default async function guildMemberAdd(client, member) {
  const { user, guild } = member;

  // -------------------------------
  // Utility functions
  // -------------------------------
  function normalizeChannelName(name) {
    return name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  }

  function findChannelByName(guild, channelName) {
    const normalizedSearchName = normalizeChannelName(channelName);
    return guild.channels.cache.find(
      (channel) => normalizeChannelName(channel.name) === normalizedSearchName
    );
  }

  // -------------------------------
  // Welcome Message Logic
  // -------------------------------
  try {
    const welcomeChannel = findChannelByName(guild, "welcome"); // Searching if the server has a channel named "welcome"

    if (!welcomeChannel) {
      console.warn(`⚠️ Welcome channel not found in guild "${guild.name}" (${guild.id})`);
    } else {
      const permissions = welcomeChannel.permissionsFor(guild.members.me);
      if (!permissions?.has(PermissionsBitField.Flags.SendMessages)) {
        console.warn(
          `🚫 No permission to send messages in #${welcomeChannel.name} of guild "${guild.name}"`
        );
      } else {
        let messageTemplate;
        try {
          messageTemplate = await getCustomWelcomeMessage(guild.id);
        } catch (err) {
          console.error(`❌ Failed to fetch custom welcome message for guild ${guild.id}:`, err);
        }

        const welcomeMessage = messageTemplate
          ? messageTemplate.replace("{user}", `<@${member.id}>`)
          : `👋 Hey <@${member.id}>, we're so happy to have you here! 🌟\n\nMake yourself at home and have fun! 🎈`;

        const welcomeEmbed = new EmbedBuilder()
          .setColor("#ffcc00")
          .setTitle(`🎉 Welcome to ${guild.name}!`)
          .setDescription(welcomeMessage)
          .setThumbnail(user.displayAvatarURL({ dynamic: true }) ?? null);

        try {
          await welcomeChannel.send({
            content: `<@${member.id}>`,
            embeds: [welcomeEmbed],
          });
        } catch (sendErr) {
          console.error(`❌ Failed to send welcome message in #${welcomeChannel.name}:`, sendErr);
        }
      }
    }
  } catch (error) {
    console.error(`❌ Unexpected error during welcome logic for ${user.tag}:`, error);
  }
}
