
const Discord = require("discord.js");
const { db } = require('../db/db');

module.exports = {
	async execute(client) {
        client.client.guilds.cache.forEach(g => {
            if (g.id) {
                g.members.fetch().then(members => {
                    const online = members.filter((member) => !member.user?.bot && member.presence?.status != 'offline').map((member) => member);
                    db.members.pushOnline(online);
                })
            }
        })
	},
};