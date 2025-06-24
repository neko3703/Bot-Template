import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';
import os from 'os';
import process from 'process';
import { version as djsVersion } from 'discord.js';
import { version as nodeVersion } from 'process';

// Calculating latency bar length
function latencyBar(ms) {
  const totalBlocks = 10;
  const filledBlocks = Math.min(Math.floor((ms / 1000) * totalBlocks), totalBlocks);
  const emptyBlocks = totalBlocks - filledBlocks;
  return '🟩'.repeat(filledBlocks) + '⬜'.repeat(emptyBlocks);
}

async function createPingEmbed(client, interaction, latency) {
  const apiLatency = client.ws.ping ?? 0;

  const cpuUsage = process.cpuUsage();
  const cpuUserMs = (cpuUsage.user / 1000).toFixed(2);
  const cpuSystemMs = (cpuUsage.system / 1000).toFixed(2);

  const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
  const totalMem = (os.totalmem() / 1024 / 1024).toFixed(2);

// Replace the signal value to the different emojis for high and low ping
  let signal;
  switch (true) {
    case latency <= 100:
      signal = '<:full:1114619733212418068>';
      break;
    case latency <= 500:
      signal = '<:excellent:1114619787981619292>';
      break;
    case latency <= 1000:
      signal = '<:low:1114619850237673553>';
      break;
    default:
      signal = '<:bad:1114619887411802254>';
  }

  const embed = new EmbedBuilder()
    .setColor(0xfaafba)
    .setTitle('🏓“ Pong!')
    .setDescription(
      `${signal} **Bot Latency:** ${latency}ms ${latencyBar(latency)}\n` +
      `ðŸ“¡ **API Latency:** ${apiLatency}ms\n\n` +
      `ðŸ§  **Memory Usage:** ${memoryUsage}MB / ${totalMem}MB\n` +
      `âš™ï¸ **CPU Usage:** User ${cpuUserMs}ms | System ${cpuSystemMs}ms\n\n` +
      `<:nodejs:1099759085571801210> **Node.js Version:** ${nodeVersion}\n` +
      `<:discordjs:1106964170131386468> **Discord.js Version:** ${djsVersion}`
    )
    .addFields(
      { name: '🧩 Shard ID', value: `${client.shard?.ids?.[0] ?? interaction.guild?.shardId ?? 'None'}`, inline: true },
      { name: 'ðŸ”¢ Process ID', value: `${process.pid}`, inline: true },
      { name: 'ðŸ–¥ Platform', value: `${os.platform()} ${os.arch()}`, inline: true },
      { name: 'ðŸ“† Bot Created', value: `<t:${Math.floor(client.user.createdTimestamp / 1000)}:R>`, inline: true },
      { name: 'ðŸ§® CPU Cores', value: `${os.cpus().length}`, inline: true }
    )
    .setFooter({
      text: 'Powered by Neko Code âš¡',
      iconURL: client.user?.displayAvatarURL()
    })
    .setTimestamp();

  return embed;
}

export default async (client, interaction) => {
  const start = Date.now();
  await interaction.deferReply({ ephemeral: false });
  const latency = Date.now() - start;

  const embed = await createPingEmbed(client, interaction, latency);

  await interaction.editReply({ embeds: [embed] });
};