const cs = require('../values')
const { db } = require('../db/db');
const getLogger = require('../logger')
const logger = getLogger();

module.exports = {
	name: 'ready',
	aliases: ['help'],
	private: true,
	plain: true,
	description: 'Self check',
	async execute(client, args) {
		
		const errors = new Set();
		
		for (const cv in cs) {
			const key = cs[cv];
			const cfg = await db.config.findOne(client.guild.id, key);
			if (cfg) {
				const r = await client.testChannel(client.guild.channels.cache.get(cfg.channel));
				if (r) {
					logger.info("Self Check OK " + key);
				} else {
					logger.info("Self Check NOT OK " + key);
					errors.add('<#' + cfg.channel + '>');
				}
			}
		}

		if (errors.size > 0) {
			return client.reply("Mon capitaine. I need permissions on the following channels\n>>> " + Array.from(errors).join('\n'));
		}

		return client.reply("I'm ready mon capitaine. Type !q for help");
	},
};