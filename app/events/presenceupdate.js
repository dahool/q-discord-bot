const { Events } = require('discord.js');
const { db } = require('../db/db');
const getLogger = require('../logger');

const logger = getLogger();

module.exports = {
	name: Events.PresenceUpdate,
	once: false,
	async execute(client, oldMember, newMember) {
		if (!newMember.user.bot && newMember.status != 'offline') {
			db.members.updateOnline(newMember.guild.members.cache.get(newMember.user.id));
		}
	}
};

