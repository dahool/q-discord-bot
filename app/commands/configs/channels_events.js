const cs = require('../../values')
const { ApplicationCommandOptionType } = require('discord.js');
const generic = require('./generic');

module.exports = {
	name: cs.GENERAL_EVENTS,
    description: 'Reminder Announcement Channel',
	options: [
		{
			name: 'set',
			description: 'Set Reminder Announcement Channel',
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
			description: 'Get Reminder Announcement Channel',
			type: ApplicationCommandOptionType.Subcommand
		}
	],
	usage: '<set/get> <channel>',
    async execute(client, args) {
		return generic.getOrUpdate(client, this.name, this.description, args);
    },
};