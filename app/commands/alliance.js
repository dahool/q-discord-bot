const { safeLower } = require('../utils');
const cmds = require('./data/say.json');
const { ApplicationCommandOptionType, AttachmentBuilder } = require('discord.js');
const { db } = require('../db/db');

module.exports = {
	name: 'alliance',
	dm: false,
	description: 'list alliance members',
	options: [{
		name: 'format',
		description: 'Format',
		type: ApplicationCommandOptionType.String,
		required: true,
		choices: [
			{name: 'slim', value: 'slim'},
			{name: 'full', value: 'full'}
		]		
	}],
	async execute(client, args) {
		
		await client.defer(false);

		const list = await db.player.findBy({guild: client.guild.id})
		
		let content = list.map(player => {
			if ('slim' == args.format) {
				return player.name;
			}
			return `"${player.name}",${player.level},${player.power},${player.pd},${player.rss}`
		}).join('\n');

		if ('full' == args.format) {
			content = '"Name","Level","Power","PD","Raided"\n' + content;
		}
	
		let attach = new AttachmentBuilder(Buffer.from(content, 'utf-8'), {name: 'alliance.csv'});

		return client.channel.send({ files: [attach] }).then(() => {
			client.reply("Posted");
		});

	}
};
