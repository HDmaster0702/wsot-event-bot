const { EmbedBuilder } = require("discord.js")
const scheduler = require("node-schedule");
const Event = require("./Event.js")
const EventScheduler = require("./EventScheduler.js")
const { token, clientid, guildid } = require("./config.json")
const {mission_channel, training_channel, notification_channel, sitrep_channel, mission_role, training_role, supervisor_role, selector_channel, supervisor_channel} = require("./channels.json")


class EventController {
    events = []

    constructor(client, db) {
        this.client = client
        this.db = db

        this.db.loadAllEvents(this)

        this.initNotificationSelector()

        console.log("Event Controller successfully initalized!")
    }
    
    addEvent(type, name, datetime, attachments, attachments2, creator) {
        if (!attachments) { attachments = false }
        if (!attachments2) { attachments2 = false }
        var event = new Event(type, name, datetime, [attachments, attachments2], creator)

        event.dbid = 0
        this.db.insertEventIntoDB(event, this)
    }

    loadEvent(query) {
        this.client.guilds.fetch(guildid).then(guild => {
            guild.members.fetch(query.creator).then(member => {
                var datetime = new Date(parseFloat(query.datetime))
                var event = new Event(query.type, query.name, datetime, false, member, true)
                event.dbid = query.dbid
        
                this.events[event.dbid] = event
        
                var fetchChannel = ""
                if(query.type === "mission") {
                    fetchChannel = mission_channel
                    
                } else {
                    fetchChannel = training_channel
                }
    
                guild.channels.fetch(fetchChannel).then(channel => channel.messages.fetch(query.messageid).then(message => event.message = message))
                if(query.sitrepid) {
                    guild.channels.fetch(sitrep_channel).then(channel => channel.messages.fetch(query.sitrepid).then(message => {
                        event.sitrep = message

                    }))
                }
            })
        })
    }

    insertEvent(event, id) {
        event.dbid = id
        this.events[event.dbid] = event

        this.announceEvent(event)
        event.scheduler = new EventScheduler(this, event)
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

            const strDate = event.datetime.toLocaleString()

            var embed = new EmbedBuilder()
            .setTitle(event.name + " (" + strDate.substring(0, strDate.length - 3) + ")")
            .setAuthor({name: event.creator.displayName, iconURL: event.creator.user.avatarURL()})
            .setDescription(sitrep_text + "\n\nKérlek jelezz vissza a szokásos jelzésformákkal.\n\n✅: Jönni fogok\n❌: Nem fogok jönni\n❓: Még nem tudom biztosra\n⏰: Késni fogok (kiegészítő jelzés)")
            .setTimestamp(new Date().valueOf())
            .setFooter({ text: "Azonosító: " + String(event.dbid)})

            if(event.attachments[1]){
                embed.setImage(event.attachments[1].attachment)
            }

            channel.send({ embeds: [embed] }).then(message => {
                event.message = message
                message.react("✅")
                message.react("❌")
                message.react("❓")
                message.react("⏰")

                if(event.attachments[0]) {
                    guild.channels.fetch(sitrep_channel).then(channel => channel.send({files: [event.attachments[0].attachment]}).then(msg => {
                        event.sitrep = msg
                        this.db.updateSitrep(event, this)
                        this.db.updateMessage(event, this)
                    }))
                } else {
                    this.db.updateMessage(event, this)
                }
            })
        }))
    }

    modifyEvent(event, name, datetime, attachments, attachments2){

        if(!attachments) { attachments = false }
        if(!attachments2) { attachments2 = false }
        
        if(!datetime[0] || !datetime[1] || !datetime[2] || !datetime[3] || !datetime[4]) { datetime = false }

        if ((!name && !datetime && !attachments) || datetime.length < 5) { return }
        if (attachments) {
            this.client.guilds.fetch(guildid, guild => {
                guild.channels.fetch(sitrep_channel).then(channel => channel.messages.fetch(event.sitrep.id, msg => {
                    msg.edit({files: [attachments.attachment]})
                }))
                event.attachments = attachments
            })
        }

        var fetchChannel = ""
        if(event.type === "mission") {
            fetchChannel = mission_channel
            
        } else {
            fetchChannel = training_channel
        }

        this.client.guilds.fetch(guildid).then(guild => {
            guild.channels.fetch(fetchChannel).then(channel => channel.messages.fetch(event.message.id).then(msg => {

                var sitrep_text = ""
                if(event.attachments) {
                    sitrep_text = "A SITREP-et megtalálod a <#" + sitrep_channel + "> csatornában!"
                } else {
                    sitrep_text = "A SITREP később kerül beküldésre!"
                }

                var embed = new EmbedBuilder()
    
                if(name && datetime) {
                    datetime = new Date(datetime)
                    const strDate = datetime.toLocaleString()

                    embed.setTitle(name + " (" + strDate.substring(0, strDate.length - 3) + ")")
                } else if(name) {
                    const strDate = event.datetime.toLocaleString()
                        embed.setTitle(name + " (" + strDate.substring(0, strDate.length - 3) + ")")
                } else if(datetime) {
                        datetime = new Date(datetime)
                        const strDate = datetime.toLocaleString()
                        embed.setTitle(event.name + " (" + strDate.substring(0, strDate.length - 3) + ")")
                }

                if(attachments2) {
                    embed.setImage(attachments2.attachment)
                } else {
                    if(event.attachments[1]) {
                        embed.setImage(event.attachments[1].attachment)
                    }
                }
    
                embed.setAuthor({name: event.creator.displayName, iconURL: event.creator.user.avatarURL()})
                embed.setDescription(sitrep_text + "\n\nKérlek jelezz vissza a szokásos jelzésformákkal.\n\n✅: Jönni fogok\n❌: Nem fogok jönni\n❓: Még nem tudom biztosra\n⏰: Késni fogok (kiegészítő jelzés)")
                embed.setTimestamp(new Date().valueOf())
                embed.setFooter({ text: "Azonosító: " + String(event.dbid)})

                msg.edit({embeds: [embed]})
            }))        
        })

        this.db.modifyEventInDB(event, name, datetime, attachments, attachments2)

    }

    deleteEvent(event, silent) {
        this.db.removeEventFromDB(event)

        var fetchChannel = ""
        if(event.type === "mission") {
            fetchChannel = mission_channel
            
        } else {
            fetchChannel = training_channel
        }

        this.client.guilds.fetch(guildid).then(guild => {
            if(event.sitrep) {
                guild.channels.fetch(sitrep_channel).then(channel => channel.messages.fetch(event.sitrep.id).then(message => message.delete()))
            }  

            guild.channels.fetch(fetchChannel).then(channel => channel.messages.fetch(event.message.id).then(message => message.delete().then(msg => this.events[event.dbid] = null)))
        })
    }

    initNotificationSelector() {
        this.client.guilds.fetch(guildid).then(guild => guild.channels.fetch(selector_channel).then(channel => {
            channel.messages.fetch({limit: 1}, true).then(message => {
                if(!message.first()) {
                    var embed = new EmbedBuilder()
                    .setTitle("Értesítés Választó")
                    .setDescription("Kérlek válaszd ki milyen értesítéseket szeretnél kapni a bottól az alábbi reakciók segítségével.\n\n📆: Visszajelzési értesítés\n⏰: Küldetés előtti értesítés\n\n __Az értesítéseket a bot privát üzenet formájában fogja továbbítani neked, ehhez szükséges engedélyezned, hogy a veled egy szerveren lévők tudjanak privát üzenetet küldeni neked!__")
                    .setColor("#fcba03")

                    channel.send({ embeds: [embed] }).then(msg => {
                        msg.react("📆")
                        msg.react("⏰")
                        this.notification = msg
                    })   
                } else {
                    this.notification = message.first()
                    this.notification.fetch()
                }
            })
        }))
    }

    alertFeedback(event) {
        this.notification.reactions.cache.each(reaction => {
            if( reaction.emoji.name === "📆" ){
                reaction.fetch().then(reaction => {
                    reaction.users.fetch().then(users => {
                        users.each(user => {
                            if(user.id !== this.client.user.id) {
                                var embed = new EmbedBuilder()
                                .setTitle("Visszajelzési értesítő - " + event.name)
                                .setDescription("A fentebb említett eseményre a visszajelzési határidő __3 óra múlva lejár__. Kérlek amennyiben még nem tetted meg, véglegesítsd a visszajelzésedet.")
                                user.createDM().then(channel => channel.send({embeds: [embed]}).catch(error => console.log(error)))
                            }
                        })
                    })
                })
            }
        })
    }

    alertPreop(event) {
        this.notification.reactions.cache.each(reaction => {
            if( reaction.emoji.name === "⏰" ){
                reaction.fetch().then(reaction => {
                    reaction.users.fetch().then(users => {
                        users.each(user => {
                            if(user.id !== this.client.user.id) {
                                var embed = new EmbedBuilder()
                                .setTitle("Küldetés kezdési értesítő - " + event.name)
                                .setDescription("A fentebb említett esemény egy óra múlva kezdődik. \n\nKérlek amennyiben még nem tetted meg, akkor:\n * Ellenőrizd, hogy le van-e frissítve a játékod\n* Nézd meg, hogy a TeamSpeaked működőképes-e\n* Bizonyosodj meg róla, hogy a megfelelő modpacket letöltötted\n* Olvasd el a SITREP-et és a beosztást")
                                user.createDM().then(channel => channel.send({embeds: [embed]}).catch(error => console.log(error)))
                            }
                        })
                    })
                })
            }
        })
    }

    logFeedback(event) {
        var check = []
        var cross = []
        var mark = []
        var clock = []
        var none = []

        this.client.guilds.fetch(guildid).then(guild => guild.channels.fetch(supervisor_channel).then(channel => {
            event.message.reactions.cache.each(reaction => {
                reaction.users.fetch().then(users => {
                    users.each((user, key, collection) => {
                        switch(reaction.emoji.name) {
                            case "✅":
                                check.push(user.id)
                            break
                                
                            case "❌":
                                cross.push(user.id)
                            break
            
                            case "❓":
                                mark.push(user.id)
                            break
            
                            case "⏰":
                                clock.push(user.id)

                                if(key === collection.lastKey()){
                                    var none = []
                                    guild.members.fetch().then(members => {
                                        none = members.filter(member => {
                                            return !(check.find(r => r === member.user.id) || cross.find(r => r === member.user.id) || mark.find(r => r === member.user.id) || clock.find(r => r == member.user.id))
                                        })
                                        none = none.map(m => m.user.id)

                                        // ITT FOLYTASD A BOT KIFILTEREZÉSÉVEL, HOGY NE MUTASSA A FELÜGYELŐI LOGBAN //

                                        var str = "✅\n" + check.join("\n") + "\n❌\n" + cross.join("\n") + "\n❓\n" + mark.join("\n") + "\n⏰\n" + clock.join("\n") + "\n**__NEM JELEZTEK VISSZA__**\n" + none.join("\n")
                                        channel.send(str)
                                    })
                                }
                            break
                            
                        }      
                    })
                })
            })
        }))
    }
    
}

module.exports = EventController
