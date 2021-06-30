"use strict";
const dotenv = require('dotenv');
dotenv.config();
const MongoClient = require('mongodb').MongoClient;

var _db;

const connectDb = (callback) => {
    if (_db) return callback()
    MongoClient.connect(process.env.DBCONN, { useUnifiedTopology: true },
        (err, database) => {
            if (err) return console.log(err)
            _db = database.db(process.env.DBNAME) 
            console.log("Database Connected")
            callback()
        }
    )
}

const getDb = (collection) => {
    return _db.collection(collection)
}

module.exports = {
    connectDb,
    getDb
}