const ical = require('node-ical');
const { ApplicationCommandOptionType } = require('discord.js');
const { db } = require('../../db/db');

module.exports = {
	name: 'territory_events',
    description: 'Set Territory Events Calendar',
	type: 1,
	options: [
		{
			name: 'url',
			description: 'Calendar ICAL URL',
			type: ApplicationCommandOptionType.String,
			required: true
		},
	],
	usage: '<url>',
    async execute(client, args) {
		const guild = client.guild.id;

		if (!args.url) {
			return client.reply(`Missing required arguments. Specify a valid ICAL url`);
		}

		const url = args.url;

		try {
			await ical.async.fromURL(url);
		} catch (error) {
			console.error(error);
			return client.reply(`Sorry, I'm unable to validate URL \`${url}\``);
		}
		
		db.config.push(guild, "territory_events", {'url': url});

		return {message: this.description, fields: [{ name: 'URL', value : '`'+url+'`'}], log: true}

    },
};