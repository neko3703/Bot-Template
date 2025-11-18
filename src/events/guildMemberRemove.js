import { EmbedBuilder, PermissionsBitField } from "discord.js";
import { getCustomGoodbyeMessage } from "../utils/goodbye.js";

export default async function guildMemberRemove(client, member) {
  function normalizeChannelName(name) {
    return name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  }

  function findChannelByName(guild, channelName) {
    const normalizedSearchName = normalizeChannelName(channelName);
    return guild.channels.cache.find(
      (channel) => normalizeChannelName(channel.name) === normalizedSearchName
    );
  }

  let channel;
  try {
    channel = findChannelByName(member.guild, "goodbye"); // Loos for channel named "goodbye"

    if (!channel) {
      console.warn(
        `⚠️ Goodbye channel not found in guild "${member.guild.name}" (${member.guild.id})`
      );
      return;
    }

    const permissions = channel.permissionsFor(client.user);
    if (
      !permissions ||
      !permissions.has(PermissionsBitField.Flags.SendMessages)
    ) {
      console.warn(
        `🚫 Missing permission to send messages in #${channel.name} of guild "${member.guild.name}"`
      );
      return;
    }
  } catch (err) {
    console.error(`❌ Error finding goodbye channel in ${member.guild.name}:`, err);
    return;
  }

  let messageTemplate;
  try {
    messageTemplate = await getCustomGoodbyeMessage(member.guild.id);
  } catch (err) {
    console.error(
      `❌ Failed to fetch custom goodbye message for guild ${member.guild.id}:`,
      err
    );
  }

  const goodbyeMessage = messageTemplate
    ? messageTemplate.replace("{user}", `<@${member.id}>`)
    : `💔 Goodbye <@${member.id}>, we will miss you!`;

  const embed = new EmbedBuilder()
    .setColor("#ff6666")
    .setTitle("💔 Goodbye...")
    .setDescription(goodbyeMessage)
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }));

  try {
    await channel.send({ embeds: [embed] });
  } catch (error) {
    if (error.code === 50001) {
      console.warn(
        `🚫 Bot does not have access to send messages in #${channel.name} of guild "${member.guild.name}"`
      );
    } else {
      console.error("❌ Failed to send goodbye message:", error);
    }
  }
}
