
const scheduler = require("node-schedule")

class EventScheduler {
    constructor(ec, event) {
        this.ec = ec
        this.event = event

        var feedbackTime = new Date(event.datetime)
        //feedbackTime.setDate(feedbackTime.getDate() - 1)
        //feedbackTime.setHours(18)
        //feedbackTime.setMinutes(0)
        feedbackTime.setMinutes(feedbackTime.getMinutes() - 1)

        this.feedbackSchedule = scheduler.scheduleJob(feedbackTime, () => {this.ec.alertFeedback(event)})

        var feedbackLogTime = new Date(event.datetime)
        //feedbackLogTime.setDate(feedbackLogTime.getDate() - 1)
        //feedbackLogTime.setHours(21)
        //feedbackLogTime.setMinutes(0)
        feedbackLogTime.setMinutes(feedbackLogTime.getMinutes() - 1)

        this.feedbackLogSchedule = scheduler.scheduleJob(feedbackLogTime, () => {this.ec.logFeedback(event)})

        var preopTime = new Date(event.datetime)
        //preopTime.setHours(preopTime.getHours() - 1)
        //preopTime.setMinutes(0)
        preopTime.setMinutes(preopTime.getMinutes() - 1)
        
        this.preopSchedule = scheduler.scheduleJob(preopTime, () => {this.ec.alertPreop(event)})
    }
}

module.exports = EventScheduler