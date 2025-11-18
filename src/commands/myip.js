// This is a prefix command. Prefix command has this function:

// export default async (client, message, args) => {
//   Your code goes here
// }

import axios from 'axios';
import os from 'os';
import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';

export default async (client, message, args) => {
  try {
    // Bot IP & Info
    const ipRes = await axios.get('https://api.ipify.org?format=json');
    const botIP = ipRes.data.ip;

    const ipInfoRes = await axios.get(`https://ipapi.co/${botIP}/json/`);
    const ipInfo = ipInfoRes.data;

    // Uptime (HH:MM:SS)
    const uptime = process.uptime();
    const uptimeStr = new Date(uptime * 1000).toISOString().substr(11, 8);

    // Host Info
    const hostname = os.hostname();
    const platform = os.platform();

    // Location (Google Maps link)
    const mapsLink = `https://www.google.com/maps/search/?api=1&query=${ipInfo.latitude},${ipInfo.longitude}`;

    // Embed Message
    const embed = new EmbedBuilder()
      .setTitle('🌐 Bot Network Info')
      .setColor(0x1e90ff)
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '📡 Public IP', value: `\`${botIP}\``, inline: false },
        { name: '🗺️ Location', value: `${ipInfo.city}, ${ipInfo.region}, ${ipInfo.country_name}`, inline: true },
        { name: '📍 Coordinates', value: `[View on Map](${mapsLink})`, inline: true },
        { name: '📶 ISP / Org', value: ipInfo.org || 'Unknown', inline: true },
        { name: '🕒 Uptime', value: `\`${uptimeStr}\``, inline: true },
        { name: '📈 Ping', value: `\`${client.ws.ping} ms\``, inline: true },
        { name: '💻 Host Info', value: `\`${hostname}\` / \`${platform}\``, inline: true },
        { name: '🙋 Invoked By', value: `${message.author.tag} (\`${message.author.id}\`)`, inline: false },
        {
          name: '🔐 Privacy Notice',
          value: 'User IPs are not accessible to bots. Only the bot\'s own public IP is shown.',
          inline: false,
        }
      )
      .setFooter({ text: 'Powered by ipify.org & ipapi.co' })
      .setTimestamp();

    // IP Button for User
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('🔗 View Your IP')
        .setStyle(ButtonStyle.Link)
        .setURL('https://whatismyipaddress.com/')
    );

    // Send Response
    await message.reply({ embeds: [embed], components: [row] });

  } catch (err) {
    console.error('IP Fetch Error:', err);
    await message.reply('❌ Failed to retrieve IP information.');
  }
};
