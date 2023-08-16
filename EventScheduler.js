
const scheduler = require("node-schedule")
const add = require("date-fns/add")
const sub = require("date-fns/sub")

class EventScheduler {
    constructor(ec, event) {

        this.ec = ec
        this.event = event

        var now = new Date()

        var feedbackTime = new Date(event.datetime)
        //feedbackTime = sub(feedbackTime, {days: 1})
        //feedbackTime.setHours(18)
        //feedbackTime.setMinutes(0)
        feedbackTime = sub(feedbackTime, {minutes: 1})

        if (feedbackTime > now) {
            this.feedbackSchedule = scheduler.scheduleJob(feedbackTime, () => {this.ec.alertFeedback(event)})
        }

        var feedbackLogTime = new Date(event.datetime)
        //feedbackLogTime = sub(feedbackLogTime, {days: 1})
        //feedbackLogTime.setHours(21)
        //feedbackLogTime.setMinutes(0)
        feedbackLogTime = sub(feedbackLogTime, {minutes: 1})

        if (feedbackLogTime > now) {
            this.feedbackLogSchedule = scheduler.scheduleJob(feedbackLogTime, () => {this.ec.logFeedback(event)})
        }

        var preopTime = new Date(event.datetime)
        //preopTime = sub(preopTime, {hours: 1})
        preopTime = sub(preopTime, {minutes: 1})
        
        if (preopTime > now) {
            this.preopSchedule = scheduler.scheduleJob(preopTime, () => {this.ec.alertPreop(event)})
        }

        var deleteTime = new Date(event.datetime)
        //deleteTime = add(deleteTime, {minutes: 30})
        deleteTime = add(deleteTime, {minutes: 5})
        
        if (deleteTime > now) {
            this.deleteSchedule = scheduler.scheduleJob(deleteTime, () => {this.ec.deleteEvent(event)})
        }
    }

    postpone(event) {

        var event = this.event

        this.feedbackSchedule.cancel()
        this.feedbackLogSchedule.cancel()
        this.preopSchedule.cancel()
        this.deleteSchedule.cancel()

        var now = new Date()

        var feedbackTime = new Date(event.datetime)
        //feedbackTime.setDate(feedbackTime.getDate() - 1)
        //feedbackTime.setHours(18)
        //feedbackTime.setMinutes(0)
        feedbackTime.setMinutes(feedbackTime.getMinutes() - 1)

        if (feedbackTime > now) {
            this.feedbackSchedule = scheduler.scheduleJob(feedbackTime, () => {this.ec.alertFeedback(event)})
        }

        var feedbackLogTime = new Date(event.datetime)
        //feedbackLogTime.setDate(feedbackLogTime.getDate() - 1)
        //feedbackLogTime.setHours(21)
        //feedbackLogTime.setMinutes(0)
        feedbackLogTime.setMinutes(feedbackLogTime.getMinutes() - 1)

        if (feedbackLogTime > now) {
            this.feedbackLogSchedule = scheduler.scheduleJob(feedbackLogTime, () => {this.ec.logFeedback(event)})
        }

        var preopTime = new Date(event.datetime)
        //preopTime.setHours(preopTime.getHours() - 1)
        //preopTime.setMinutes(0)
        preopTime.setMinutes(preopTime.getMinutes() - 1)
        
        if (preopTime > now) {
            this.preopSchedule = scheduler.scheduleJob(preopTime, () => {this.ec.alertPreop(event)})
        }  

        var deleteTime = new Date(event.datetime)
        //preopTime.setHours(preopTime.getHours() - 1)
        //preopTime.setMinutes(0)
        deleteTime.setMinutes(deleteTime.getMinutes() + 5)
        
        if (deleteTime > now) {
            this.deleteSchedule = scheduler.scheduleJob(deleteTime, () => {this.ec.deleteEvent(event)})
        }
    }

    stop(event) {
        this.feedbackSchedule.cancel()
        this.feedbackLogSchedule.cancel()
        this.preopSchedule.cancel()
        this.deleteSchedule.cancel()
    }
}

module.exports = EventScheduler