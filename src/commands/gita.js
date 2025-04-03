// this is used for prefix commands => [client, message, args]
import { EmbedBuilder } from "discord.js"; // use this to import packages from discord.js in your command files, if you are using any...
import fetch from "node-fetch";

export default async (client, message, args) => {
    // Your code for prefix command goes here...

  if (args.length < 2) {
    return message.channel.send("❌ Please provide a valid chapter and verse number! Example: `!geeta 2 47`");
  }

  const chapter = args[0];
  const verse = args[1];

  if (isNaN(chapter) || isNaN(verse)) {
    return message.channel.send("❌ Chapter and verse must be numbers. Example: `!geeta 2 47`");
  }

  try {
    const apiUrl = `https://vedicscriptures.github.io/slok/${chapter}/${verse}/`;
    console.log(`🔍 Fetching: ${apiUrl}`); // Logs API request URL

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    const geeta = await response.json();
    console.log("✅ API Response:", geeta); // Logs API response

    if (!geeta || !geeta.slok) {
      return message.channel.send("❌ Invalid chapter or verse. Please try again.");
    }

    const { slok, tej, siva } = geeta;

    const embed = new EmbedBuilder()
      .setColor(0xfaafba)
      .setTitle(`📖 Bhagavad Gita - Chapter ${chapter}, Verse ${verse}`)
      .setDescription(`**Shlok:**\n\`\`\`${slok}\`\`\``)
      .addFields(
        { name: "📝 Hindi Explanation", value: `\`\`\`${tej.ht || "N/A"}\`\`\`` },
        { name: "📝 English Translation", value: `\`\`\`${siva.et || "N/A"}\`\`\`` }
      )
      .setFooter({ text: "Jai Shri Krishna 🙏" });

    await message.channel.send({ embeds: [embed] });

  } catch (error) {
    console.error("❌ Fetch Error:", error);
    return message.channel.send(`❌ Error fetching verse: \`${error.message}\``);
  }
};
