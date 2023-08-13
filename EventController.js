const { EmbedBuilder } = require("discord.js")
const scheduler = require("node-schedule");
const Event = require("./Event.js")
const { token, clientid, guildid } = require("./config.json")
const { mission_channel, training_channel, notification_channel, sitrep_channel, mission_role, training_role } = require("./channels.json")


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
        this.announceEvent(event)
    }

    loadEvent(query) {
        var datetime = new Date(Date(parseFloat(query.datetime)))
        var event = new Event(query.type, query.name, datetime, false, parseFloat(query.creator))
        event.dbid = query.dbid

        this.events[event.dbid] = event

        var fetchChannel = ""
        if(query.type === "mission") {
            fetchChannel = mission_channel
            
        } else {
            fetchChannel = training_channel
        }

        this.client.guilds.fetch(guildid).then(guild => {
            guild.channels.fetch(mission_channel).then(channel => channel.messages.fetch(query.messageid, message => event.message = message))
            if(query.sitrepid) {
                guild.channels.fetch(sitrep_channel).then(channel => channel.messages.fetch(query.sitrepid, message => event.sitrep = message))
            }
        })
    }

    insertEvent(event, id) {
        event.dbid = id
        this.events[event.dbid] = event

    }

    announceEvent(event) {
        var client = this.client

        var fetchChannel = ""
        if(event.type === "mission") {
            fetchChannel = mission_channel
            
        } else {
            fetchChannel = training_channel
        }

        client.guilds.fetch(guildid).then(guild => guild.channels.fetch(fetchChannel).then(channel => {

            var sitrep_text = ""
            if(event.attachments) {
                sitrep_text = "A SITREP-et megtalálod a <#" + sitrep_channel + "> csatornában!"
            } else {
                sitrep_text = "A SITREP később kerül beküldésre!"
            }

            var embed = new EmbedBuilder()
            .setTitle(event.name + " (" + event.datetime.toLocaleString() + ")")
            .setAuthor({name: event.creator.displayName, iconURL: event.creator.user.avatarURL()})
            .setDescription(sitrep_text + "\n\nKérlek jelezz vissza a szokásos jelzésformákkal.\n\n✅: Jönni fogok\n❌: Nem fogok jönni\n❓: Még nem tudom biztosra\n⏰: Késni fogok (kiegészítő jelzés)")
            .setTimestamp(new Date().valueOf())

            channel.send({ embeds: [embed] }).then(message => {
                event.message = message
                message.react("✅")
                message.react("❌")
                message.react("❓")
                message.react("⏰")

                if(event.attachments) {
                    guild.channels.fetch(sitrep_channel).then(channel => channel.send({files: [event.attachments.attachment]}).then(msg => event.sitrep = msg))
                }

                this.db.insertEventIntoDB(event, this)
            })
        }))
    }

    modifyEvent(event, name, datetime, attachments){
        if ((!name && !datetime && !attachments) || datetime.length < 5) { return }
        if (attachments) {
            guild.channels.fetch(sitrep_channel).then(channel => channel.messages.fetch(event.sitrep.id, msg => {
                msg.edit({files: [attachments.attachment]})
            }))
            event.attachments = attachments
        }

        this.db.modifyEventInDB(event, name, datetime)

        guild.channels.fetch(sitrep_channel).then(channel => channel.messages.fetch(event.message.id, msg => {
            var embed = new EmbedBuilder()

            if(name && datetime) {
                datetime = new Date(datetime)
                embed.setTitle(name + " (" + datetime.toLocaleString() + ")")
            } else {
                if(name) {
                    embed.setTitle(name + " (" + event.datetime.toLocaleString() + ")")
                }
    
                if(datetime) {
                    datetime = new Date(datetime)
                    embed.setTitle(event.name + " (" + datetime.toLocaleString() + ")")
                }
            }

            embed.setAuthor({name: event.creator.displayName, iconURL: event.creator.user.avatarURL()})
            embed.setDescription(sitrep_text + "\n\nKérlek jelezz vissza a szokásos jelzésformákkal.\n\n✅: Jönni fogok\n❌: Nem fogok jönni\n❓: Még nem tudom biztosra\n⏰: Késni fogok (kiegészítő jelzés)")
            embed.setTimestamp(new Date().valueOf())

            msg.edit({embeds: [embed]})
        }))        

    }
}

module.exports = EventController
