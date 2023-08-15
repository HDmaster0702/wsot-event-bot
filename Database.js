const mysql = require("mysql")
const { host, user, password, database } = require("./db_config.json")

class Database {
    constructor() {
        this.connection = mysql.createConnection({
            host: host,
            user: user,
            password: password,
            database: database
        })

        this.establishConnection()
    }

    establishConnection() {
        this.connection.connect((err) => {
            if (err) {
                console.log(err)
                process.exit(1)
            } else {
                console.log("Successful connection to the MySQL Database.")
            }
        })
    }

    loadAllEvents(callback) {
        this.connection.query("SELECT * FROM events", (err, results, fields) => {
            if(err) console.error(err);

            if(!results) results = [];
            results.forEach(element => {
                callback.loadEvent(element)
            });
        })
    }

    insertEventIntoDB(event, callback) {
        var query = ""
        var values = []

        query = "INSERT INTO events SET type = ?, name = ?, datetime = ?, creator = ?"
        values = [event.type, event.name, String(event.datetime.valueOf()), event.creator.id]

        if(event.attachments[0]) {
            query = query + ", attachment1 = ?"
            values.push(event.attachments[0].url)
        }

        if(event.attachments[1]) {
            query = query + ", attachment2 = ?"
            values.push(event.attachments[1].url)
        }

        this.connection.query(query, values, (err, results, fields) => {
            if (err) console.error(err);
            callback.insertEvent(event, results.insertId);
        })
    }

    modifyEventInDB(event, name, datetime, attachments, attachments2) {

        var query = "UPDATE events SET "
        var sets = []
        var values = []
        if (name) {
            sets.push("name = ?")
            values.push(name)
        }

        if (datetime) {
            sets.push("datetime = ?")
            values.push(datetime.valueOf())
        }

        if(attachments) {
            sets.push("attachment1 = ?")
            values.push(attachments.attachment)
        }

        if(attachments2) {
            sets.push("attachment2 = ?")
            values.push(attachments2.attachment)
        }

        query = query + sets.join(", ")
        values.push(event.dbid)

        this.connection.query(query + " WHERE dbid = ?", values, (err, results, fields) => {
            if (err) {
                console.error(err)
            }

            if (name) {
                event.name = name
            }

            if (datetime) {
                event.datetime = datetime
                event.scheduler.postpone()
            }

            if (attachments){
                if(!event.attachments) {
                    event.attachments = []
                }
                event.attachments[0] = attachments
            }

            if (attachments2){
                if(!event.attachments) {
                    event.attachments = []
                }
                event.attachments[1] = attachments2
            }
        })
    }

    updateSitrep(event) {
        this.connection.query("UPDATE events SET sitrepid = ? WHERE dbid = ?", [event.sitrep.id, event.dbid])
    }

    updateMessage(event) {
        this.connection.query("UPDATE events SET messageid = ? WHERE dbid = ?", [event.message.id, event.dbid])
    }

    removeEventFromDB(event) {
        this.connection.query("DELETE FROM events WHERE dbid = ?", [event.dbid], (err, results, fields) => {
            if(err) console.error(err);
        })
    }
}

module.exports = Database