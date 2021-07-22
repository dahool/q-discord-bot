const cs = require('../../values')

module.exports = {
	name: 'mention',
	description: 'Territory/Events roles mention',
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

		if ('add' in args || 'del' in args) {
			const id = args.add?.role || args.del?.role
			if (id == null) {
				return client.reply(`Missing argument. Specify a valid role.`);
			}
			const configRole = Object.assign({mention: []}, await configDb.findOne(guild, cs.TERRITORY_CHANNEL))
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

			configDb.push(guild, cs.TERRITORY_CHANNEL, configRole);

			return response;
		} else {
			const configRole = Object.assign({mention: []}, await configDb.findOne(guild, cs.TERRITORY_CHANNEL))
			const roles = configRole.mention.map(rid => '<@&' + rid + '>');

			if (roles.length) {
				return {message: this.description, fields: [{ name: 'Roles', value : roles.join("\n")}]};
			}
			
			return {message: 'No roles defined'};
		}

    },
};