const ROLE_ID = /<@&(\d+)+>/;

function extract_id(regex, str) {
	const m = regex.exec(str);
	if (m) {
		return m[++m.index];
	}
	return null;
}

module.exports = {
	name: 'role',
	aliases: ['+role','-role'],
    description: 'Add/Remove privileged roles (access to my protected commands)',
	usage: '<@rolename>',
    async execute(configDb, cmd, message, params) {
		const guild = message.guild.id;
		const op = cmd.substring(0,1);

		if (op == '+' || op == '-') {

			const id = extract_id(ROLE_ID, params);
			if (id == null) {
				return message.reply(`Invalid argument \`${params}\`. Specify a valid role.`);
			}

			const response = {message: 'Privileged roles', log: true}

			const configRole = Object.assign({roles: []}, await configDb.findOne(guild, "roles"))

			if (op == '+') {
				// prevent duplicates
				configRole.roles = configRole.roles.filter(r => r != id)
				configRole.roles.push(id);
				response.fields = [{ name: 'Add', value : '<@&' + id + '>'}]
			} else {
				configRole.roles = configRole.roles.filter(r => r != id)
				response.fields = [{ name: 'Remove', value : '<@&' + id + '>'}]
			}

			configDb.push(guild, "roles", configRole);

			return response;

		} else {
			const configRole = Object.assign({roles: []}, await configDb.findOne(guild, "roles"))
			const roles = configRole.roles.map(rid => '<@&' + rid + '>');

			if (roles.length) {
				return {message: 'Privileged roles', fields: [{ name: 'Roles', value : roles.join("\n")}]};
			}
			
			return {message: 'No roles defined'};
		}

    },
};