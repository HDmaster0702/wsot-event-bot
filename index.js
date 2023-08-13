
const {Client, Events, GatewayIntentBits, Collection, Routes} = require("discord.js");
const {token, clientid, guildid} = require("./config.json")
const Database = require("./Database.js")
const EventController = require("./EventController.js")

const db = new Database()

const command = require("./commands/event/event.js");

const client = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages, GatewayIntentBits.GuildModeration, GatewayIntentBits.MessageContent]})

const eventcontroller = new EventController(client, db)

client.commands = new Collection()
client.commands.set("event", command)



client.on(Events.ClientReady, () => {
    console.log('Event Bot Successfully Started as ' + client.user.tag)

    client.on(Events.InteractionCreate, async interaction => {
        if(!interaction.isChatInputCommand()) return;
        
        const command = interaction.client.commands.get(interaction.commandName);
    
        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }
    
        try {
            await command.execute(eventcontroller, interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        }
    })
})

client.login(token)

module.exports = {
    client: client,
    db: db
}