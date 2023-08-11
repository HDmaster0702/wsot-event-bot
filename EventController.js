const { EmbedBuilder } = require("discord.js")
const scheduler = require("node-schedule");
const Event = require("./Event.js")
const { token, clientid, guildid } = require("./config.json")
const { mission_channel, training_channel, notification_channel, mission_role, training_role } = require("./channels.json")


class EventController {
    events = [] 

    constructor(client, db) {
        this.client = client
        this.db = db

        this.db.loadAllEvents(this)

        console.log("Event Controller successfully initalized!")
    }
    
    addEvent(type, name, datetime, attachments, creator) {
        if (!attachments) { attachments = false }
        var event = new Event(type, name, datetime, attachments, creator)

        event.dbid = 0
        this.db.insertEventIntoDB(event, this)
    }

    loadEvent(query) {
        var datetime = new Date(Date(parseFloat(query.datetime)))
        var event = new Event(query.type, query.name, datetime, false, parseFloat(query.creator))
        event.dbid = query.dbid

        this.events[event.dbid] = event
    }

    insertEvent(event, id) {
        event.dbid = id
        this.events[event.dbid] = event

        this.announceEvent(event)
    }

    announceEvent(event) {
        var client = this.client
        client.guilds.fetch(guildid).then(guild => guild.channels.fetch(mission_channel).then(channel => {
            guild.members.fetch(event.creator).then(member => {
                var embed = new EmbedBuilder()
                .setTitle("KÜLDETÉS BEJELENTÉS")
                .setAuthor({name: member.displayName, iconURL: member.user.avatarURL()})
                .setDescription("**" + event.name + " (" + event.datetime.toLocaleString() + ")**\n\nKérlek jelezz vissza a szokásos jelzésformákkal.\n\n✅: Jönni fogok\n❌: Nem fogok jönni\n❓: Még nem tudom biztosra\n⏰: Késni fogok (kiegészítő jelzés)")
                .setTimestamp(event.datetime.valueOf())

                channel.send({ embeds: [embed] }).then(message => {
                    message.react("✅")
                    message.react("❌")
                    message.react("❓")
                    message.react("⏰")
                    event.message = message
                    event.createReactionCollector()
                })
            })
        }))
    }
}

module.exports = EventController
