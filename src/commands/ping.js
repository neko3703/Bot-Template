import { EmbedBuilder } from "discord.js";

export default async (client, interaction) => {
  const start = Date.now(); // Record start time

  // Defer the reply to get accurate response time
  await interaction.deferReply({ ephemeral: true });

  const latency = Date.now() - start; // Calculate round-trip response time
  const apiLatency = client.ws.ping; // WebSocket latency

  let signal;

  if (latency > 0 && latency <= 100) {
    signal = '<:full:1114619733212418068>';
  } else if (latency > 100 && latency <= 500) {
    signal = '<:excellent:1114619787981619292>';
  } else if (latency > 500 && latency <= 1000) {
    signal = '<:low:1114619850237673553>';
  } else {
    signal = '<:bad:1114619887411802254>';
  }

  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor(0xfaafba)
        .setTitle("🏓 Pong!")
        .setDescription(`${signal} **Bot Latency:** ${latency}ms\n📡 **API Latency:** ${apiLatency}ms`)
        .setTimestamp(),
    ],
  });
};
