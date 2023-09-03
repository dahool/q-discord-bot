const { Events } = require('discord.js');
const { db } = require('../db/db');
const { SCHEDULED_EVENTS } = require('../values');
const getLogger = require('../logger');

const logger = getLogger();

module.exports = {
	name: Events.GuildScheduledEventDelete,
	once: false,
	async execute(client, event) {
		logger.debug("Removed event", JSON.stringify(event));
		const key = { guild: event.guildId, uuid: event.id, "type": SCHEDULED_EVENTS}
		logger.info("Lookup and remove event", event.id);
		return db.calendar.deleteBy(key);
	}
};

