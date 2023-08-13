const { ReactionCollector } = require("discord.js")

class Event {
    constructor(type, name, datetime, attachments, creator) {
        this.type = type
        this.name = name
        this.datetime = new Date(datetime[0], datetime[1]-1, datetime[2], datetime[3], datetime[4])
        this.attachments = attachments
        this.creator = creator
    }
}

module.exports = Event