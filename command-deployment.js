
const {REST, Routes} = require("discord.js")


const {token, clientid, guildid} = require("./config.json")
const command = require("./commands/event/event.js");

const commands = [command.data.toJSON()];
// Grab all the command files from the commands directory you created earlier



// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);



// and deploy your commands!
(async () => {
	try {

		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			Routes.applicationGuildCommands(clientid, guildid),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();