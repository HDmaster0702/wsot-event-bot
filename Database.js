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
        if (event.type === "mission") {
            var query = ""
            var values = []
            if(event.sitrep) {
                query = "INSERT INTO events SET type = ?, name = ?, datetime = ?, creator = ?, messageid = ?, sitrepid = ?"
                values = [event.type, event.name, String(event.datetime.valueOf()), event.creator.id, event.message.id, event.sitrep.id]
            } else {
                query = "INSERT INTO events SET type = ?, name = ?, datetime = ?, creator = ?, messageid = ?"
                values = [event.type, event.name, String(event.datetime.valueOf()), event.creator.id, event.message.id]
            }

            this.connection.query(query, values, (err, results, fields) => {
                if (err) console.error(err);
                callback.insertEvent(event, results.insertId);
            })
        } else if (event.type === "training") {
            
        }
    }

    modifyEventInDB(event, name, datetime) {
        const query = "UPDATE events SET "
        const sets = []
        const values = []
        if (name) {
            sets.push("name = ?")
            values.push(name)
        }

        if (datetime) {
            sets.push("datetime = ?")
            values.push(datetime.valueOf())
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
            }
        })
    }
}

module.exports = Database