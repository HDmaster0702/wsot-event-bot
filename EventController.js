const { EmbedBuilder, AttachmentBuilder, Attachment } = require("discord.js")
const scheduler = require("node-schedule");
const Event = require("./Event.js")
const EventScheduler = require("./EventScheduler.js")
const { token, clientid, guildid } = require("./config.json")
const {mission_channel, training_channel, notification_channel, sitrep_channel, selector_channel, supervisor_channel} = require("./channels.json")
const { mission_role, training_role, supervisor_role, feedback_role } = require("./roles.json")

// TO-DO: KÜLDETÉS KÉSZÍTŐNEK KÜLDENI A FELÜGYELŐI LOGBÓL A LISTÁT???

class EventController {
    events = []

    constructor(client, db) {
        this.client = client
        this.db = db

        this.db.loadAllEvents(this)

        this.initNotificationSelector()

        console.log("Event Controller successfully initalized!")
    }
    
    addEvent(type, name, datetime, attachments, attachments2, attachments3, creator) {
        if (!attachments) { attachments = false }
        if (!attachments2) { attachments2 = false }
        var event = new Event(type, name, datetime, [attachments, attachments2, attachments3], creator)

        event.dbid = 0
        this.db.insertEventIntoDB(event, this)
    }

    loadEvent(query) {
        this.client.guilds.fetch(guildid).then(guild => {
            guild.members.fetch(query.creator).then(member => {
                var datetime = new Date(parseFloat(query.datetime))
                var event = new Event(query.type, query.name, datetime, [false, false, false], member, true)

                event.dbid = query.dbid
        
                this.events[event.dbid] = event
        
                var fetchChannel = ""
                if(query.type === "mission") {
                    fetchChannel = mission_channel
                    
                } else {
                    fetchChannel = training_channel
                }

                if(query.attachment1){
                    event.attachments[0] = new AttachmentBuilder(query.attachment1)
                    
                }

                if(query.attachment2){
                    event.attachments[1] = new AttachmentBuilder(query.attachment2)
                }

                if(query.attachment3){
                    event.attachments[2] = new AttachmentBuilder(query.attachment3)
                }

                if(query.attachment4){
                    event.attachents[3] = new AttachmentBuilder(query.attachment4)
                }
    
                guild.channels.fetch(fetchChannel).then(channel => channel.messages.fetch(query.messageid).then(message => {
                    event.message = message
                    if (!query.sitrepid && !query.rolesid) {
                        const now = new Date()

                        if(event.datetime <= now) {
                            this.deleteEvent(event)
                        } else {
                            event.scheduler = new EventScheduler(this, event)
                        }
                    }
                })).catch(err => console.log(err))
                if(query.sitrepid) {
                    guild.channels.fetch(sitrep_channel).then(channel => channel.messages.fetch(query.sitrepid).then(message => {
                        event.sitrep = message

                        if (!query.rolesid) {
                            const now = new Date()

                            if(event.datetime <= now) {
                                this.deleteEvent(event)
                            } else {
                                event.scheduler = new EventScheduler(this, event)
                            }
                        }
                    })).catch(err => console.log(err))
                }
                if(query.rolesid) {
                    guild.channels.fetch(sitrep_channel).then(channel => channel.messages.fetch(query.rolesid).then(message => {
                        event.roles = message

                        const now = new Date()

                        if(event.datetime <= now) {
                            this.deleteEvent(event)
                        } else {
                            event.scheduler = new EventScheduler(this, event)
                        }
                    })).catch(err => console.log(err))
                }
            })
        })
    }

    insertEvent(event, id) {
        event.dbid = id
        this.events[event.dbid] = event

        this.announceEvent(event)
        event.scheduler = new EventScheduler(this, event)

        this.client.guilds.fetch(guildid).then(guild => guild.channels.fetch(notification_channel).then(channel => {

            const strDate = event.datetime.toLocaleString()

            var embed = new EmbedBuilder()
                .setTitle(event.creator.displayName)
                .setAuthor({name: "Esemény Létrehozás", iconURL: "https://imgur.com/OW5BzNC.png"})
                .setDescription(`Azonosító: ${event.dbid}\nTípus: ${event.type}\nNév: ${event.name}\nIdőpont: ${strDate.substring(0, strDate.length - 3)}\nSITREP: ${event.attachments[0] ? "Mellékelve" : "Nincs mellékelve"}\nBorítókép: ${event.attachments[1] ? "Van" : "Nincs"}\nEgyedi modlista: ${event.attachments[2] ? "Van" : "Nincs"}`)
                .setTimestamp(new Date().valueOf())
                .setColor("#2ecc71")

            channel.send({embeds: [embed]})

        }))
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
            if(event.attachments[0]) {
                sitrep_text = "A SITREP-et megtalálod a <#" + sitrep_channel + "> csatornában!"
            } else {
                sitrep_text = "A SITREP később kerül beküldésre!"
            }

            var modlist_text = ""
            if(event.attachments[2]) {
                modlist_text = "\n\n**__Az esemény modpackjét fentebb találod meg csatolva.__**"
            } else {
                modlist_text = "\n\nAz esemény a klán aktuális, legfrissebb modpackjét használja."
            }

            const strDate = event.datetime.toLocaleString()

            var embed = new EmbedBuilder()
            .setTitle(event.name + " (" + strDate.substring(0, strDate.length - 3) + ")")
            .setAuthor({name: event.creator.displayName, iconURL: event.creator.user.avatarURL()})
            .setDescription(sitrep_text + modlist_text + "\n\nKérlek jelezz vissza a szokásos jelzésformákkal.\n\n✅: Jönni fogok\n❌: Nem fogok jönni\n❓: Még nem tudom biztosra\n⏰: Késni fogok (kiegészítő jelzés)")
            .setTimestamp(new Date().valueOf())
            .setFooter({ text: "Azonosító: " + String(event.dbid)})

            if(event.attachments[1]){
                embed.setImage(event.attachments[1].attachment)
            }

            var options = {embeds: [embed]}

            if (event.attachments[2]){
                options = {embeds: [embed], files: [event.attachments[2]]}
            }

            channel.send(options).then(message => {
                event.message = message
                message.react("✅")
                message.react("❌")
                message.react("❓")
                message.react("⏰")

                if(event.attachments[0]) {
                    guild.channels.fetch(sitrep_channel).then(channel => channel.send({content: event.name + " SITREP", files: [event.attachments[0].attachment]}).then(msg => {
                        event.sitrep = msg
                        this.db.updateSitrep(event, this)
                        this.db.updateMessage(event, this)
                        this.alertAnnounce(event)
                    }))
                } else {
                    this.db.updateMessage(event, this)
                    this.alertAnnounce(event)
                }
            })
        }))
    }

    modifyEvent(event, name, datetime, attachments, attachments2, attachments3){

        if ((!name && !datetime && !attachments && !attachments2 && !attachments3)) { return }

        if(!attachments) { attachments = false }
        if(!attachments2) { attachments2 = false }
        if(!attachments3) { attachments3 = false }
        
        if(!datetime[0] || !datetime[1] || !datetime[2] || !datetime[3] || !datetime[4]) { 
            if(!datetime[0] && !datetime[1] && !datetime[2] && !datetime[3] && !datetime[4]) {
                datetime = false
            } else{ 
                if(!datetime[0]) {
                    datetime[0] = event.datetime.getFullYear()
                } 
                if(!datetime[1]) {
                    datetime[1] = event.datetime.getMonth()
                } else {
                    datetime[1] = datetime[1] - 1
                } 
                if(!datetime[2]) {
                    datetime[2] = event.datetime.getDate()
                } 
                if(!datetime[3]) {
                    datetime[3] = event.datetime.getHours()
                } 
                if(!datetime[4]) {
                    datetime[4] = event.datetime.getMinutes()
                }

                datetime = new Date(datetime[0], datetime[1], datetime[2], datetime[3], datetime[4])
            }
        } else {
            datetime = new Date(datetime[0], datetime[1], datetime[2], datetime[3], datetime[4])
        }

        var fetchChannel = ""
        if(event.type === "mission") {
            fetchChannel = mission_channel
            
        } else {
            fetchChannel = training_channel
        }

        this.client.guilds.fetch(guildid).then(guild => {

            if (attachments) {
                if (event.attachments[0]) {
                    guild.channels.fetch(sitrep_channel).then(channel => channel.messages.fetch(event.sitrep.id).then(msg => {
                        event.attachments[0] = attachments
                        msg.edit({content: event.name + " SITREP", files: [event.attachments[0].attachment]})
                        this.alertSitrep(event, "modify")
                    }))

                    guild.channels.fetch(notification_channel).then(channel => {
        
                        const strDate = event.datetime.toLocaleString()
            
                        var embed = new EmbedBuilder()
                            .setTitle(event.creator.displayName)
                            .setAuthor({name: "SITREP Frissítés", iconURL: "https://imgur.com/Si82dbz.png"})
                            .setDescription(`Azonosító: ${event.dbid}\nTípus: ${event.type}\nNév: ${event.name}`)
                            .setTimestamp(new Date().valueOf())
                            .setColor("#0d6ad2")
            
                        channel.send({embeds: [embed]})
            
                    })
                } else {
                    if(!event.attachments) {
                        event.attachments = [false, false, false]
                    }
                    event.attachments[0] = attachments
                    guild.channels.fetch(sitrep_channel).then(channel => channel.send({content: event.name + " SITREP", files: [event.attachments[0].attachment]}).then(msg => {
                        event.sitrep = msg
                        this.db.updateSitrep(event, this)
                        this.alertSitrep(event, "add")

                        guild.channels.fetch(notification_channel).then(channel => {

                            const strDate = event.datetime.toLocaleString()
                
                            var embed = new EmbedBuilder()
                                .setTitle(event.creator.displayName)
                                .setAuthor({name: "SITREP Létrehozás", iconURL: "https://imgur.com/Si82dbz.png"})
                                .setDescription(`Azonosító: ${event.dbid}\nTípus: ${event.type}\nNév: ${event.name}`)
                                .setTimestamp(new Date().valueOf())
                                .setColor("#0d6ad2")
                
                            channel.send({embeds: [embed]})
                
                        })
                    }))
                }
            }

            if(attachments3) {
                if(event.attachments[2]) {
                    guild.channels.fetch(notification_channel).then(channel => {
        
                        const strDate = event.datetime.toLocaleString()
            
                        var embed = new EmbedBuilder()
                            .setTitle(event.creator.displayName)
                            .setAuthor({name: "Modlista Frissítés", iconURL: "https://imgur.com/Si82dbz.png"})
                            .setDescription(`Azonosító: ${event.dbid}\nTípus: ${event.type}\nNév: ${event.name}`)
                            .setTimestamp(new Date().valueOf())
                            .setColor("#0d6ad2")
            
                        channel.send({embeds: [embed]}).then(msg => {
                            this.alertModlist(event, "add")
                        })
            
                    })
                } else {
                    if(!event.attachments) {
                        event.attachments = [false, false, false]
                    }

                    event.attachments[2] = attachments3

                    guild.channels.fetch(notification_channel).then(channel => {

                        const strDate = event.datetime.toLocaleString()
            
                        var embed = new EmbedBuilder()
                            .setTitle(event.creator.displayName)
                            .setAuthor({name: "Modlista Létrehozás", iconURL: "https://imgur.com/Si82dbz.png"})
                            .setDescription(`Azonosító: ${event.dbid}\nTípus: ${event.type}\nNév: ${event.name}`)
                            .setTimestamp(new Date().valueOf())
                            .setColor("#0d6ad2")
            
                        channel.send({embeds: [embed]}).then(msg => {
                            this.alertModlist(event, "add")
                        })
            
                    })
                }
            }

            guild.channels.fetch(fetchChannel).then(channel => channel.messages.fetch(event.message.id).then(msg => {

                var sitrep_text = ""
                if(event.attachments) {
                    sitrep_text = "A SITREP-et megtalálod a <#" + sitrep_channel + "> csatornában!"
                } else {
                    if(event.type == "training") {
                        sitrep_text = ""
                    } else {
                        sitrep_text = "A SITREP később kerül beküldésre!"
                    }
                }

                var modlist_text = ""
                if(event.attachments[2]) {
                    modlist_text = "\n\n**__Az esemény modpackjét fentebb találod meg csatolva.__**"
                } else {
                    modlist_text = "\n\nAz esemény a klán aktuális, legfrissebb modpackjét használja."
                }

                var embed = new EmbedBuilder()
    
                if(name && datetime) {
                    const strDate = datetime.toLocaleString()

                    embed.setTitle(name + " (" + strDate.substring(0, strDate.length - 3) + ")")
                } else if(name) {
                    const strDate = event.datetime.toLocaleString()
                    embed.setTitle(name + " (" + strDate.substring(0, strDate.length - 3) + ")")
                } else if(datetime) {
                    const strDate = datetime.toLocaleString()
                    embed.setTitle(event.name + " (" + strDate.substring(0, strDate.length - 3) + ")")
                } else {
                    const strDate = event.datetime.toLocaleString()
                    embed.setTitle(event.name + " (" + strDate.substring(0, strDate.length - 3) + ")")
                }

                if(datetime) {
                    guild.channels.fetch(notification_channel).then(channel => {

                        const strDate = datetime.toLocaleString()
            
                        var embed = new EmbedBuilder()
                            .setTitle(event.creator.displayName)
                            .setAuthor({name: "Időpont Módosítás", iconURL: "https://imgur.com/MF1opUP.png"})
                            .setDescription(`Azonosító: ${event.dbid}\nTípus: ${event.type}\nNév: ${event.name}\nÚj időpont: ${strDate.substring(0, strDate.length - 3)}`)
                            .setTimestamp(new Date().valueOf())
                            .setColor("#b517e2")
            
                        channel.send({embeds: [embed]})
            
                    })
                }

                if(name) {
                    guild.channels.fetch(notification_channel).then(channel => {

                        const strDate = event.datetime.toLocaleString()
            
                        var embed = new EmbedBuilder()
                            .setTitle(event.creator.displayName)
                            .setAuthor({name: "Név módosítás", iconURL: "https://imgur.com/bCinWfz.png"})
                            .setDescription(`Azonosító: ${event.dbid}\nTípus: ${event.type}\nRégi név: ${event.name}\nÚj név: ${name}`)
                            .setTimestamp(new Date().valueOf())
                            .setColor("#eaac17")
            
                        channel.send({embeds: [embed]})
            
                    })
                }

                if(attachments2) {
                    embed.setImage(attachments2.attachment)
                } else {
                    if(event.attachments[1]) {
                        embed.setImage(event.attachments[1].attachment)
                    }
                }

                var options = {embeds: [embed]}

                if(attachments3) {
                    options = {embeds: [embed], files: [attachments3.attachment]}
                }
    
                embed.setAuthor({name: event.creator.displayName, iconURL: event.creator.user.avatarURL()})
                embed.setDescription(sitrep_text + modlist_text + "\n\nKérlek jelezz vissza a szokásos jelzésformákkal.\n\n✅: Jönni fogok\n❌: Nem fogok jönni\n❓: Még nem tudom biztosra\n⏰: Késni fogok (kiegészítő jelzés)")
                embed.setTimestamp(new Date().valueOf())
                embed.setFooter({ text: "Azonosító: " + String(event.dbid)})

                msg.edit(options).then(msg => {
                    if (datetime) {
                        this.alertPostpone(event)
                        this.db.modifyEventInDB(event, name, datetime, attachments, attachments2, attachments3)
                    } else {
                        this.db.modifyEventInDB(event, name, datetime, attachments, attachments2, attachments3)
                    }
                })
            }))        
        })

    }

    deleteEvent(event, message) {
        this.db.removeEventFromDB(event)

        if(event.scheduler){
            event.scheduler.stop()
        }

        if(message) {
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

                if(event.roles) {
                    guild.channels.fetch(sitrep_channel).then(channel => channel.messages.fetch(event.roles.id).then(message => message.delete()))
                }
    
                guild.channels.fetch(fetchChannel).then(channel => channel.messages.fetch(event.message.id).then(message => message.delete().then(msg => {
                    this.events[event.dbid] = null
                    guild.channels.fetch(notification_channel).then(channel => {

                        const strDate = event.datetime.toLocaleString()
            
                        var embed = new EmbedBuilder()
                            .setTitle(event.creator.displayName)
                            .setAuthor({name: "Esemény törlés", iconURL: "https://imgur.com/6tqMEow.png"})
                            .setDescription(`Azonosító: ${event.dbid}\nTípus: ${event.type}\nNév: ${event.name}`)
                            .setTimestamp(new Date().valueOf())
                            .setColor("#ed4245")
            
                        channel.send({embeds: [embed]})
            
                    })
                })))
            })
        }
    }

    setRoles(event, rolesURL) {
        if(event.roles){
            event.roles.fetch().then(msg => {
                msg.edit(event.name + " Beosztás\n" + rolesURL).then(msg => {
                    this.alertRoles(event, "modify")
                })

                this.client.guilds.fetch(guildid).then(guild => {
                    guild.channels.fetch(notification_channel).then(channel => {

                        const strDate = event.datetime.toLocaleString()
            
                        var embed = new EmbedBuilder()
                            .setTitle(event.creator.displayName)
                            .setAuthor({name: "Beosztás Frissítés", iconURL: "https://imgur.com/Si82dbz.png"})
                            .setDescription(`Azonosító: ${event.dbid}\nTípus: ${event.type}\nNév: ${event.name}`)
                            .setTimestamp(new Date().valueOf())
                            .setColor("#0d6ad2")
            
                        channel.send({embeds: [embed]})
            
                    })
                })
            
                this.db.updateRoles(event)
            })
        } else {
            this.client.guilds.fetch(guildid).then(guild => guild.channels.fetch(sitrep_channel).then(channel => {
                channel.send(event.name + " Beosztás\n" + rolesURL).then(msg => {event.roles = msg; this.db.updateRoles(event); this.alertRoles(event, "add")})
                guild.channels.fetch(notification_channel).then(channel => {

                    const strDate = event.datetime.toLocaleString()
        
                    var embed = new EmbedBuilder()
                        .setTitle(event.creator.displayName)
                        .setAuthor({name: "Beosztás Létrehozás", iconURL: "https://imgur.com/Si82dbz.png"})
                        .setDescription(`Azonosító: ${event.dbid}\nTípus: ${event.type}\nNév: ${event.name}`)
                        .setTimestamp(new Date().valueOf())
                        .setColor("#0d6ad2")
        
                    channel.send({embeds: [embed]})
        
                })
            }))
        }
    }

    initNotificationSelector() {
        this.client.guilds.fetch(guildid).then(guild => guild.channels.fetch(selector_channel).then(channel => {
            channel.messages.fetch({limit: 1}, true).then(message => {
                if(!message.first()) {
                    var embed = new EmbedBuilder()
                    .setTitle("Értesítés Választó")
                    .setDescription("Kérlek válaszd ki milyen értesítéseket szeretnél kapni a bottól az alábbi reakciók segítségével.\n\n📊: Visszajelzési értesítés\n⏰: Esemény előtti értesítés\n📆: Esemény kiírások, módosítások\n\n __Az értesítéseket a bot privát üzenet formájában fogja továbbítani neked, ehhez szükséges engedélyezned, hogy a veled egy szerveren lévők tudjanak privát üzenetet küldeni neked!__")
                    .setColor("#fcba03")

                    channel.send({ embeds: [embed] }).then(msg => {
                        msg.react("📊")
                        msg.react("⏰")
                        msg.react("📆")
                        this.notification = msg
                    })   
                } else {
                    this.notification = message.first()
                    this.notification.fetch()
                }
            })
        }))
    }

    alertAnnounce(event) {
        this.notification.reactions.cache.each(reaction => {
            if( reaction.emoji.name === "📆" ){
                reaction.fetch().then(reaction => {
                    reaction.users.fetch().then(users => {
                        users.each(user => {
                            if(user.id !== this.client.user.id) {
                                const strDate = event.datetime.toLocaleString()

                                var embed = new EmbedBuilder()
                                .setTitle(event.name + " (" + strDate.substring(0, strDate.length - 3) + ")")
                                .setAuthor({name: event.creator.displayName + " létrehozott egy eseményt", iconURL: event.creator.user.avatarURL()})
                                .setDescription(event.message.url)
                                .setColor("#fcba03")

                                if(event.attachments[1]){
                                    embed.setImage(event.attachments[1].attachment)
                                }

                                user.createDM().then(channel => channel.send({embeds: [embed]}).catch(error => console.log(error)))
                            }
                        })
                    })
                })
            }
        })
    }

    alertPostpone(event) {
        this.notification.reactions.cache.each(reaction => {
            if( reaction.emoji.name === "📆" ){
                reaction.fetch().then(reaction => {
                    reaction.users.fetch().then(users => {
                        users.each(user => {
                            if(user.id !== this.client.user.id) {
                                const strDate = event.datetime.toLocaleString()

                                var embed = new EmbedBuilder()
                                .setTitle(event.name + " - Új időpont: " + strDate.substring(0, strDate.length - 3) + "")
                                .setAuthor({name: event.creator.displayName + " módosította egy esemény időpontját", iconURL: event.creator.user.avatarURL()})
                                .setDescription(event.message.url)
                                .setColor("#fcba03")

                                if(event.attachments[1]){
                                    embed.setImage(event.attachments[1].attachment)
                                }

                                user.createDM().then(channel => channel.send({embeds: [embed]}).catch(error => console.log(error)))
                            }
                        })
                    })
                })
            }
        })
    }

    alertSitrep(event, type) {
        this.notification.reactions.cache.each(reaction => {
            if( reaction.emoji.name === "📆" ){
                reaction.fetch().then(reaction => {
                    reaction.users.fetch().then(users => {
                        users.each(user => {
                            if(user.id !== this.client.user.id) {
                                if (type === "modify") {
                                    const strDate = event.datetime.toLocaleString()

                                    var embed = new EmbedBuilder()
                                    .setTitle(event.name + " (" + strDate.substring(0, strDate.length - 3) + ") - SITREP frissítve a készítő által")
                                    .setAuthor({name: event.creator.displayName + " frissített egy SITREP-et", iconURL: event.creator.user.avatarURL()})
                                    .setDescription(event.sitrep.url)
                                    .setColor("#fcba03")

                                    if(event.attachments[1]){
                                        embed.setImage(event.attachments[1].attachment)
                                    }

                                    user.createDM().then(channel => channel.send({embeds: [embed]}).catch(error => console.log(error)))
                                } else if (type === "add") {
                                    const strDate = event.datetime.toLocaleString()

                                    var embed = new EmbedBuilder()
                                    .setTitle(event.name + " (" + strDate.substring(0, strDate.length - 3) + ") - SITREP közzétéve a készítő által")
                                    .setAuthor({name: event.creator.displayName + " közzétett egy SITREP-et", iconURL: event.creator.user.avatarURL()})
                                    .setDescription(event.sitrep.url)
                                    .setColor("#fcba03")

                                    if(event.attachments[1]){
                                        embed.setImage(event.attachments[1].attachment)
                                    }

                                    user.createDM().then(channel => channel.send({embeds: [embed]}).catch(error => console.log(error)))
                                }
                            }
                        })
                    })
                })
            }
        })
    }

    alertModlist(event, type) {
        this.notification.reactions.cache.each(reaction => {
            if( reaction.emoji.name === "📆" ){
                reaction.fetch().then(reaction => {
                    reaction.users.fetch().then(users => {
                        users.each(user => {
                            if(user.id !== this.client.user.id) {
                                if (type === "modify") {
                                    const strDate = event.datetime.toLocaleString()

                                    var embed = new EmbedBuilder()
                                    .setTitle(event.name + " (" + strDate.substring(0, strDate.length - 3) + ") - Modlista frissítve a készítő által")
                                    .setAuthor({name: event.creator.displayName + " frissített egy modlistát", iconURL: event.creator.user.avatarURL()})
                                    .setDescription(event.message.url)
                                    .setColor("#fcba03")

                                    if(event.attachments[1]){
                                        embed.setImage(event.attachments[1].attachment)
                                    }

                                    user.createDM().then(channel => channel.send({embeds: [embed]}).catch(error => console.log(error)))
                                } else if (type === "add") {
                                    const strDate = event.datetime.toLocaleString()

                                    var embed = new EmbedBuilder()
                                    .setTitle(event.name + " (" + strDate.substring(0, strDate.length - 3) + ") - Modlista közzétéve a készítő által")
                                    .setAuthor({name: event.creator.displayName + " közzétett egy modlistát", iconURL: event.creator.user.avatarURL()})
                                    .setDescription(event.message.url)
                                    .setColor("#fcba03")

                                    if(event.attachments[1]){
                                        embed.setImage(event.attachments[1].attachment)
                                    }

                                    user.createDM().then(channel => channel.send({embeds: [embed]}).catch(error => console.log(error)))
                                }
                            }
                        })
                    })
                })
            }
        })
    }

    alertRoles(event, type) {
        this.notification.reactions.cache.each(reaction => {
            if( reaction.emoji.name === "📆" ){
                reaction.fetch().then(reaction => {
                    reaction.users.fetch().then(users => {
                        users.each(user => {
                            if(user.id !== this.client.user.id) {
                                if (type === "modify") {
                                    const strDate = event.datetime.toLocaleString()

                                    var embed = new EmbedBuilder()
                                    .setTitle(event.name + " (" + strDate.substring(0, strDate.length - 3) + ") - Beosztás frissítve a készítő által")
                                    .setAuthor({name: event.creator.displayName + " frissített egy beosztást", iconURL: event.creator.user.avatarURL()})
                                    .setDescription(event.roles.url)
                                    .setColor("#fcba03")

                                    if(event.attachments[1]){
                                        embed.setImage(event.attachments[1].attachment)
                                    }

                                    user.createDM().then(channel => channel.send({embeds: [embed]}).catch(error => console.log(error)))
                                } else if (type === "add") {
                                    const strDate = event.datetime.toLocaleString()

                                    var embed = new EmbedBuilder()
                                    .setTitle(event.name + " (" + strDate.substring(0, strDate.length - 3) + ") - Beosztás közzétéve a készítő által")
                                    .setAuthor({name: event.creator.displayName + " közzétett egy beosztást", iconURL: event.creator.user.avatarURL()})
                                    .setDescription(event.roles.url)
                                    .setColor("#fcba03")

                                    if(event.attachments[1]){
                                        embed.setImage(event.attachments[1].attachment)
                                    }

                                    user.createDM().then(channel => channel.send({embeds: [embed]}).catch(error => console.log(error)))
                                }
                            }
                        })
                    })
                })
            }
        })
    }

    alertFeedback(event) {
        this.notification.reactions.cache.each(reaction => {
            if( reaction.emoji.name === "📊" ){
                reaction.fetch().then(reaction => {
                    reaction.users.fetch().then(users => {
                        users.each(user => {
                            if(user.id !== this.client.user.id) {
                                var embed = new EmbedBuilder()
                                .setTitle("Visszajelzési értesítő - " + event.name)
                                .setDescription("A fentebb említett eseményre a visszajelzési határidő __3 óra múlva lejár__. Kérlek amennyiben még nem tetted meg, véglegesítsd a visszajelzésedet.")
                                .setColor("#fcba03")
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
                                .setDescription("A fentebb említett esemény egy óra múlva kezdődik. \n\nKérlek amennyiben még nem tetted meg, akkor:\n * Ellenőrizd, hogy le van-e frissítve a játékod\n* Nézd meg, hogy a TeamSpeaked működőképes-e\n* Bizonyosodj meg róla, hogy a megfelelő modpacket letöltötted\n* Olvasd el a SITREP-et és a beosztást, amennyiben van")
                                .setColor("#fcba03")
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
                                    guild.roles.fetch(feedback_role).then(role => {
                                        var members = role.members

                                        var none = []
                                        none = members.filter(member => {
                                            return !(check.find(r => r === member.user.id) || cross.find(r => r === member.user.id) || mark.find(r => r === member.user.id) || clock.find(r => r == member.user.id))
                                        })



                                        none = none.filter(m => m.user.id !== this.client.user.id)
                                        check = check.filter(m => m !== this.client.user.id)
                                        cross = cross.filter(m => m !== this.client.user.id)
                                        mark = mark.filter(m => m !== this.client.user.id)
                                        clock = clock.filter(m => m !== this.client.user.id)

                                        none = none.map(m => "<@" + m.user.id + ">")

                                        check = check.map(id => "<@" + id + ">")
                                        cross = cross.map(id => "<@" + id + ">")
                                        mark = mark.map(id => "<@" + id + ">")
                                        clock = clock.map(id => "<@" + id + ">")

                                        var str = "# VISSZAJELZÉSI LOG - " + event.name + "\n\n## ✅\n" + check.join("\n") + "\n\n## ❌\n" + cross.join("\n") + "\n\n## ❓\n" + mark.join("\n") + "\n\n## ⏰\n" + clock.join("\n") + "\n\n## **__NEM JELEZTEK VISSZA__**\n" + none.join("\n")
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
