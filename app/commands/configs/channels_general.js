const cs = require('../../values')
const { ApplicationCommandOptionType } = require('discord.js');
const generic = require('./generic');

module.exports = {
	name: cs.ANNOUNCE_CHANNEL,
    description: 'General Announcement Channel',
	options: [
		{
			name: 'set',
			description: 'Set General Announcement Channel',
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: 'channel',
					description: 'Channel',
					type: ApplicationCommandOptionType.Channel,
					required: true
				}
			]
		},
		{
			name: 'get',
			description: 'Get General Announcement Channel',
			type: ApplicationCommandOptionType.Subcommand
		}
	],
	usage: '<set/get> <channel>',
    async execute(client, args) {
		return generic.getOrUpdate(client, this.name, this.description, args);
    },
};