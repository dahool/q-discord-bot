const cs = require('../values')
const db = require('../db/db');

module.exports = {
	name: 'ready',
	aliases: ['help'],
	slash: true,
	description: 'Self check',
	async execute(client, args) {
		
		const configDb = new db.ConfigDb(client.connection);

		const errors = new Set();
		
		for (const cv in cs) {
			const key = cs[cv];
			const cfg = await configDb.findOne(client.guild.id, key);
			if (cfg) {
				const r = await client.testChannel(client.guild.channels.cache.get(cfg.channel));
				if (r) {
					console.log("OK " + key);
				} else {
					console.error("NOT OK " + key);
					errors.add('<#' + cfg.channel + '>');
				}
			}
		}

		if (errors.size > 0) {
			return client.reply("Mon capitaine. I need permissions in the following channels\n>>> " + Array.from(errors).join('\n'));
		}

		return client.reply("I'm ready mon capitaine. Type !q for help");
	},
};