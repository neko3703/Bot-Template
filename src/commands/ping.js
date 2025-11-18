import {
  EmbedBuilder,
} from 'discord.js';
import os from 'os';
import process from 'process';
import { version as djsVersion } from 'discord.js';
import { version as nodeVersion } from 'process';
import { performance } from 'perf_hooks';

async function createPingEmbed(client, interaction, latency) {
  const apiLatency = client.ws.ping ?? 0;

  const cpuUsage = process.cpuUsage();
  const cpuUserMs = (cpuUsage.user / 1000).toFixed(2);
  const cpuSystemMs = (cpuUsage.system / 1000).toFixed(2);

  const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
  const totalMem = (os.totalmem() / 1024 / 1024).toFixed(2);

  let signal = "<:wifi:1393954319950413844>";

  // Replace emoji in embed with your custom ones
  const embed = new EmbedBuilder()
    .setColor(0xfaafba)
    .setTitle('🏓 Pong!')
    .setDescription(
      `${signal} **Bot Latency:** ${latency.toFixed(2)}ms\n` +
      `📡 **API Latency:** ${apiLatency}ms\n\n` +
      `<:RAM:1390884262999494726> **Memory Usage:** ${memoryUsage}MB / ${totalMem}MB\n` +
      `<:CPU:1390885860450500618> **CPU Usage:** User ${cpuUserMs}ms | System ${cpuSystemMs}ms`
    )
    .addFields(
      { name: '<:CPU:1390885860450500618> CPU Cores', value: `${os.cpus().length}`, inline: true }
    )
    .setFooter({
      text: 'Powered by Neko Code ⚡',
      iconURL: client.user?.displayAvatarURL()
    })
    .setTimestamp();

  return embed;
}

export default async (client, interaction) => {
  const start = performance.now();

  await interaction.deferReply({ ephemeral: false });

  const latency = performance.now() - start;

  const embed = await createPingEmbed(client, interaction, latency);

  await interaction.editReply({ embeds: [embed] });
};
