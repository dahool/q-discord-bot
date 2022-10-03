const cs = require('../../values')
const { ApplicationCommandOptionType } = require('discord.js');
const { db } = require('../../db/db');

module.exports = {
	name: 'mention',
	description: 'Territory/Events roles mention',
	options: [
		{
			name: 'add',
			description: 'Add Role',
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: 'role',
					description: 'Role',
					type: ApplicationCommandOptionType.Role,
					required: true
				}
			]
		},
		{
			name: 'del',
			description: 'Remove Role',
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: 'role',
					description: 'Role',
					type: ApplicationCommandOptionType.Role,
					required: true
				}
			]
		},
		{
			name: 'get',
			description: 'List Roles',
			type: ApplicationCommandOptionType.Subcommand
		},
	],
	usage: '<add/del/get> <role>',
    async execute(client, args) {
		const guild = client.guild.id;

		if ('add' in args || 'del' in args) {
			const id = args.add?.role || args.del?.role
			if (id == null) {
				return client.reply(`Missing argument. Specify a valid role.`);
			}
			const configRole = Object.assign({mention: []}, await db.config.findOne(guild, cs.TERRITORY_CHANNEL))
			const response = {message: this.description, log: true}

			if ('add' in args) {
				// prevent duplicates
				configRole.mention = configRole.mention.filter(r => r != id)
				configRole.mention.push(id);
				response.fields = [{ name: 'Add', value : '<@&' + id + '>'}]
			} else {
				configRole.mention = configRole.mention.filter(r => r != id)
				response.fields = [{ name: 'Remove', value : '<@&' + id + '>'}]
			}

			db.config.push(guild, cs.TERRITORY_CHANNEL, configRole);

			return response;
		} else {
			const configRole = Object.assign({mention: []}, await db.config.findOne(guild, cs.TERRITORY_CHANNEL))
			const roles = configRole.mention.map(rid => '<@&' + rid + '>');

			if (roles.length) {
				return {message: this.description, fields: [{ name: 'Roles', value : roles.join("\n")}]};
			}
			
			return {message: 'No roles defined'};
		}

    },
};