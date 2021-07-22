const cs = require('../../values')

module.exports = {
	name: cs.LOG_CHANNEL,
    description: 'Logging Channel',
	options: [
		{
			name: 'set',
			description: 'Set Logging Channel',
			type: 1,
			options: [
				{
					name: 'channel',
					description: 'Channel',
					type: 7,
					required: true
				}
			]
		},
		{
			name: 'get',
			description: 'Get Logging Channel',
			type: 1
		}
	],
	usage: '<option> <argument>',
    async execute(configDb, client, args) {
		const key = this.name;
		const guild = client.guild.id;

		if ('set' in args) {
			const id = args['set']['channel']
			if (id == null) {
				return client.reply(`Missing argument. Specify a valid channel.`);
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