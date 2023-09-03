const { Events } = require('discord.js');
const { db } = require('../db/db');
const { SCHEDULED_EVENTS } = require('../values');
const getLogger = require('../logger');

const logger = getLogger();

module.exports = {
	name: Events.GuildScheduledEventCreate,
	once: false,
	async execute(client, event) {
		logger.debug("Event", JSON.stringify(event));
		if (!event.creator.bot) {
			const key = { guild: event.guildId, uuid: event.id, "type": SCHEDULED_EVENTS}
			let saveData = {"start": event.scheduledStartAt, "summary": event.name, "notified": false, "onChannel": event.channelId, "url": event.url};
			if (event.entityMetadata) {
				saveData['location'] = event.entityMetadata.location;
			}
			return db.calendar.pushBy(key, saveData).then(() => logger.info("Created event reminder for id", event.id));
		}
		return false;
	}
};

