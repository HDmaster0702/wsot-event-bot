const { ReactionCollector } = require("discord.js")

class Event {
    constructor(type, name, datetime, attachments, creator, customDate) {
        this.type = type
        this.name = name
        if(customDate) {
            this.datetime = datetime
        } else {
            this.datetime = new Date(datetime[0], datetime[1]-1, datetime[2], datetime[3], datetime[4])
        }
        this.attachments = attachments
        this.creator = creator
    }
}

module.exports = Event