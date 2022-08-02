const cs = require('../../values')
const { ApplicationCommandOptionType } = require('discord.js');

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
    async execute(configDb, client, args) {
		const key = this.name;
		const guild = client.guild.id;

		if ('set' in args) {
			const id = args['set']['channel']
			if (id == null) {
				return client.reply(`Missing argument. Specify a valid channel.`);
			}
			const r = await client.testChannel(client.guild.channels.cache.get(id));
			if (!r) {
				return client.reply(`I require permissions to read/write/manage in <#${id}>`);
			}
			configDb.push(guild, key, {'channel': id});
			return {message: 'Updated ' + this.description, fields: [{ name: 'Channel', value : '<#' + id + '>'}], log: true};
		} else {
			const value = await configDb.findOne(guild, key, 'channel');
			if (value) {
				return {message: this.description, fields: [{ name: 'Channel', value : '<#' + value + '>'}]}
			} else {
				return client.reply(`No config defined for **${this.description}**`);
			}
		}
    },
};