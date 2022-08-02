const { ApplicationCommandOptionType } = require('discord.js');

module.exports = {
	name: 'role',
    description: 'Add/Remove privileged roles (access to my protected commands)',
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
	async execute(configDb, client, args) {
		const guild = client.guild.id;
		const key = 'roles';

		if ('add' in args || 'del' in args) {
			const id = args.add?.role || args.del?.role
			if (id == null) {
				return client.reply(`Missing argument. Specify a valid role.`);
			}
			const configRole = Object.assign({roles: []}, await configDb.findOne(guild, key))
			const response = {message: 'Privileged roles', log: true}

			if ('add' in args) {
				// prevent duplicates
				configRole.roles = configRole.roles.filter(r => r != id)
				configRole.roles.push(id);
				response.fields = [{ name: 'Add', value : '<@&' + id + '>'}]
			} else {
				configRole.roles = configRole.roles.filter(r => r != id)
				response.fields = [{ name: 'Remove', value : '<@&' + id + '>'}]
			}

			configDb.push(guild, key, configRole);

			return response;
		} else {
			const configRole = Object.assign({roles: []}, await configDb.findOne(guild, key))
			const roles = configRole.roles.map(rid => '<@&' + rid + '>');

			if (roles.length) {
				return {message: 'Privileged roles', fields: [{ name: 'Roles', value : roles.join("\n")}]};
			}
			
			return {message: 'No roles defined'};
		}

    },
};