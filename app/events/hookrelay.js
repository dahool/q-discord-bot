const { Events } = require('discord.js');
const { db } = require('../db/db');
const hook = require('../functions/hooksender');
const cs = require('../values')
const getLogger = require('../logger');

const logger = getLogger();

module.exports = {
	name: Events.MessageCreate,
	once: false,
	async execute(client, message) {
		if (!message.author.bot) {
			const cfg = await db.config.findBy({guild: message.guild.id, uuid: cs.WEBHOOK, channel: message.channel.id});
			if (cfg?.length > 0) {
				logger.debug("Relay message %s", message,)
				return hook.relayMessage(message, cfg);
			}
		}
	}
};