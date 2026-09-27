# Discord Bot Template (JavaScript)

A simple and efficient template for creating a Discord bot using JavaScript. This template is designed to help developers quickly set up and customize their own bot.

## Features

- **Command Handling**: Organized structure for commands.
- **Event Handling**: Easily manage Discord events.
- **Environment Variables**: Secure bot token storage.
- **Logging**: Basic logging for debugging.
- **Modular Codebase**: Easy to expand and maintain.

## Requirements

- [Node.js](https://nodejs.org/) (Latest LTS version recommended)
- [Discord.js](https://discord.js.org/) (Latest version)
- A Discord bot token ([Create one here](https://discord.com/developers/applications))

## Installation

1. **Clone the repository**

   npm init -y

   git clone https://github.com/neko3703/Bot-Template.git
   cd Bot-Template

2. **Install dependencies**

   npm install discord.js@latest

3. **Set up environment variables**

   A `.env` file has already been created in the root directory. Here, you can add your bot's token, bot's ID, bot's client secret (optional) and guild ID of your server to start with:

       TOKEN = BOT_TOKEN_HERE
       CLIENT_ID = 123456789
       ClientSecret = YOUR_BOT_CLIENT_SECRET
       BOT_OWNER_ID = 123456789
       GuildID = 123456789
       GOOGLE_CLIENT_EMAIL = "XYZ"
       GOOGLE_PRIVATE_KEY = "ABC"
       DB_ID = "abcd1234"
       MODMAIL_LOG_CHANNEL = "1234567890"

   More can be added as per needs.

4. **Run the bot**

   node index.js

## Folder Structure

    📦 YOUR_REPO_NAME
     ┣ 📂 src            # Source folder containing bot logic
     ┃ ┣ 📂 commands     # Command files go here (slash and prefix both)
     ┃ ┣ 📂 events       # Event handler files go here
     ┃ ┣ 📂 interactions # Interaction (button and modal handlers) and messageCreate events
     ┃ ┣ 📂 utils         # Utility handler files go here
     ┃ ┣ 📜 index.js      # Main bot entry point
     ┃ ┣ 📜 registerCommands.js # Slash command registration
     ┣ 📜 .env            # Environment variables
     ┣ 📜 package.json    # Dependencies and metadata
     ┗ 📜 README.md       # Documentation

## Usage

- Add commands (prefix and slash commands) in the `commands/` folder.
- Event handlers are present in the `events/` folder.
- Modify `index.js` to customize bot behavior.
- The bot supports multiple prefixes. To update the prefixes, go to `messageCreate.js` file in the `events/` folder.

## License

This project is licensed under the terms outlined in the [LICENSE.md](https://github.com/neko3703/Bot-Template/blob/main/LICENSE.md) file.

## Contact

If you have any questions or suggestions, feel free to reach out at [contact@nekocode.in](mailto:contact@nekocode.in) or join my [discord](https://nekocode.in/discord)!

## 🔗 🏆 Development Team

<table>
	<tr>
		<td align="center" width="33%">
			<img src="https://cdn.discordapp.com/attachments/826750466485780492/1513198613638152202/nbx84v327t11.png?ex=6ab9dac7&is=6ab88947&hm=90b88e67cc7c87d1db2a8d8ef3f3ea3ab504783e5e88b8dd005bb4a0c096f323&" width="100px"
				style="border-radius:50%" /><br />
			<b>Neko</b><br />
			<i>Creator & Lead Developer</i><br />
			<sub>He/Him</sub><br />
			<a href="[https://github.com/name-shitty-github-profile](https://nekocode.in)">Neko Code</a>
		</td>	
</table>

---

Happy Coding! 🚀
