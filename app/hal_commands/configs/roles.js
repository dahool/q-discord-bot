
module.exports = {
	name: 'role',
    description: 'Add/Remove privileged roles (access to my protected commands)',
	options: [
		{
			name: 'add',
			description: 'Add Role',
			type: 1,
			options: [
				{
					name: 'role',
					description: 'Role',
					type: 8,
					required: true
				}
			]
		},
		{
			name: 'del',
			description: 'Remove Role',
			type: 1,
			options: [
				{
					name: 'role',
					description: 'Role',
					type: 8,
					required: true
				}
			]
		},
		{
			name: 'get',
			description: 'List Roles',
			type: 1
		},
	],
	usage: '<option> <argument>',
	async execute(configDb, client, args) {
		const guild = client.guild.id;
		const key = 'roles';

		if ('add' in args || 'del' in args) {
			const id = args.add?.role || args.del?.role
			if (id == null) {
				return client.reply(`Missing argument. Specify a valid role.`);
			}
			const configRole = Object.assign({mention: []}, await configDb.findOne(guild, key))
			const response = {message: 'Privileged roles', log: true}

			if ('add' in args) {
				// prevent duplicates
				configRole.mention = configRole.mention.filter(r => r != id)
				configRole.mention.push(id);
				response.fields = [{ name: 'Add', value : '<@&' + id + '>'}]
			} else {
				configRole.mention = configRole.mention.filter(r => r != id)
				response.fields = [{ name: 'Remove', value : '<@&' + id + '>'}]
			}

			configDb.push(guild, key, configRole);

			return response;
		} else {
			const configRole = Object.assign({mention: []}, await configDb.findOne(guild, key))
			const roles = configRole.mention.map(rid => '<@&' + rid + '>');

			if (roles.length) {
				return {message: 'Privileged roles', fields: [{ name: 'Roles', value : roles.join("\n")}]};
			}
			
			return {message: 'No roles defined'};
		}

    },
};