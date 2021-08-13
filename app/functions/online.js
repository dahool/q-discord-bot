
const Discord = require("discord.js");
const { DateTime } = require("luxon");
const { MembersDb } = require("../db/db");
const cs = require('../values')

module.exports = {
	async execute(client, connection) {
        const membersDb = new MembersDb(connection);
        client.client.guilds.cache.forEach(g => {
            if (g.id) {
                g.members.fetch().then(members => {
                    const online = members.filter((member) => !member.user?.bot && member.presence?.status != 'offline').map((member) => member);
                    membersDb.pushOnline(online);
                })
            }
        })
	},
};