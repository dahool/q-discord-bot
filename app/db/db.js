const dotenv = require('dotenv');
dotenv.config();
const MongoClient = require('mongodb').MongoClient;
const { DateTime } = require('luxon');

class ConnectionManager {

    constructor() {
        this.client = new MongoClient(process.env.DBCONN, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
    }

    async connect() {
        if (this._db == undefined) {
            await this.client.connect();
            console.log("Database connected");
            this._db = this.client.db(process.env.DBNAME);
        }
        return this._db;
    }

    getConnection() {
        return this._db;
    }

}

class DbHelper {

    constructor(connection, collection) {
        this.db = connection.getConnection().collection(collection);
    }

    async push(guild, uuid, data) {
        const query = { guild: guild, uuid: uuid }
        const mergedData = Object.assign({}, data, query);
        const toInsert= { $set: mergedData }
        this.db.updateOne(query, toInsert, { upsert: true});
    }

    async pushBy(query, data) {
        const mergedData = Object.assign({}, data, query);
        const toInsert= { $set: mergedData }
        this.db.updateOne(query, toInsert, { upsert: true});
    }

    async findOne(guild, uuid, property) {
        const query = { guild: guild, uuid: uuid }
        var results = []
        var returnValue;
        await this.db.find(query).forEach((m) => results.push(m));
        if (results.length > 0) {
            returnValue = results[0];
            if (property) {
                returnValue = returnValue[property];
            }
            return returnValue;
        }
        return undefined;
    }

    async getCommon(uuid, property) {
        return this.findOne("general", uuid, property);
    }

    async pushCommon(uuid, data) {
        return this.push("general", uuid, data);
    }

    async findOneBy(query) {
        var returnValue = undefined;
        var results = await this.db.find(query).toArray();
        if (results.length > 0) {
            returnValue = results[0];
        }
        return returnValue;
    }

    async findBy(query) {
        return await this.db.find(query).toArray();
    }

    async delete(guild, uuid) {
        await this.db.deleteOne({ guild: guild, uuid: uuid });
    }

    async deleteBy(query) {
        await this.db.deleteOne(query);
    }
}

class UserDb extends DbHelper {
    constructor(connection) {
        super(connection, "user");
    }
}

class AllianceDb extends DbHelper {
    constructor(connection) {
        super(connection, "alliance");
    }
}

class ConfigDb extends DbHelper {
    constructor(connection) {
        super(connection, "config");
    }
}

class ZoneEventsDb extends DbHelper {
    constructor(connection) {
        super(connection, "zone_events");
    }
}

class BotDb extends DbHelper {

    constructor(connection) {
        super(connection, "bot");
    }

    async addGuild(id, name) {
        return this.db.insertOne({type: 'guild', id: id, name: name});
    }

    async addGuilds(guilds) {
        return this.db.insertMany(guilds.map(g => Object.assign({type: 'guild'}, g)));
    }

    async removeGuild(id) {
        return this.deleteBy({type: 'guild', id: id});
    }

    async fetchGuilds() {
        return this.findBy({type: 'guild'});
    }

    async addChannel(guild, id, name) {
        return this.db.insertOne({guild: guild, id: id, name: name, type: 'channel'});
    }

    async removeChannel(guild, id) {
        return this.deleteBy({type: 'channel', id: id, guild: guild});
    }

    async addChannels(guild, channels) {
        return this.db.insertMany(channels.map(ch => Object.assign({guild: guild, type: 'channel'}, ch)));
    }

    async fetchChannels(guild) {
        return this.findBy({type: 'channel', guild: guild});
    }

}

class LoggerDb {
    
    constructor(connection) {
        this.db = connection.getConnection().collection("logging");
    }

    error(message) {
        this.db.insertOne({datetime: DateTime.utc().setZone(process.env.ZONE).toJSDate(), type: 'error', message: message})
    }

}
class CalendarDb {

    constructor(connection) {
        this.db = connection.getConnection().collection("events_calendar");
    }
    
    async readEvents(ahead, update) {
        const query = {
            start: { $gt: DateTime.utc().toJSDate(), $lte: DateTime.utc().plus(ahead).toJSDate()},
            notified: false
        }

        const cursor = this.db.find(query);
        let events = [];
        await cursor.forEach((ev) => {
            events.push(ev);
        });
        
        if (update) {
            await this.db.updateMany(query, {$set: {notified: true}}, {upsert: false});
        }

        return events;
    }

    async delete(query) {
        return this.db.deleteMany(query);
    }

    async insert(list) {
        return this.db.insertMany(list);
    }

    async findBy(query) {
        return await this.db.find(query).toArray();
    }
        
}

class MembersDb extends DbHelper {
    constructor(connection) {
        super(connection, "members");
    }

    async update(guild, memberId, data) {
        const query = { gid: memberId, guild: guild }
        const toSave = Object.assign(data, query);
        return this.db.updateOne(query, { $set: toSave }, { upsert: true})
    }

    async updateOnline(member) {
        const query = { gid: member.user.id, guild: member.guild.id }
        const data = { $set: { gid: member.user.id, lastOnline: DateTime.utc().toJSDate(), displayName: member.displayName || member.user.username, userName: member.user.username, guild: member.guild.id } }
        //console.log("Saved " + member.user.username);
        return this.db.updateOne(query, data, { upsert: true});
    }

    async pushOnline(members) {
        for (let member of members) {
            const query = { gid: member.user.id, guild: member.guild.id }
            const data = { $set: { gid: member.user.id, lastOnline: DateTime.utc().toJSDate(), displayName: member.displayName, userName: member.user.username, guild: member.guild.id} }
            await this.db.updateOne(query, data, { upsert: true});
        }
        //console.log("Saved " + members.length);
    }
    
}

const connectionManager = new ConnectionManager();

module.exports = { connectionManager, UserDb, AllianceDb, ConfigDb, MembersDb, CalendarDb, ZoneEventsDb, LoggerDb, BotDb }