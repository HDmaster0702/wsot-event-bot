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
            this.connection.query("INSERT INTO events SET type= ?, name = ?, datetime = ?, creator = ?", [event.type, event.name, String(event.datetime.valueOf()), String(event.creator)], (err, results, fields) => {
                if (err) console.error(err);
                callback.insertEvent(event, results.insertId);
            })
        } else if (event.type === "training") {
            
        }
    }
}

module.exports = Database