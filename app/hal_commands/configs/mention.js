const cs = require('../../values')
const ROLE_ID = /<@&(\d+)+>/;

function extract_id(regex, str) {
	const m = regex.exec(str);
	if (m) {
		return m[++m.index];
	}
	return null;
}

module.exports = {
	name: 'mention',
	aliases: ['+mention','-mention'],
    description: 'Add/Remove Territory/Events roles mention',
	usage: '<@rolename>',
    async execute(configDb, cmd, message, params) {
		const guild = message.guild.id;
		const op = cmd.substring(0,1);

		if (op == '+' || op == '-') {

			const id = extract_id(ROLE_ID, params);
			if (id == null) {
				return message.reply(`Invalid argument \`${params}\`. Specify a valid role.`);
			}

			const configRole = Object.assign({mention: []}, await configDb.findOne(guild, cs.TERRITORY_CHANNEL))
			
			const response = {message: 'Territory/Events roles mention', log: true}

			if (op == '+') {
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
				return {message: 'Territory/Events roles mention', fields: [{ name: 'Roles', value : roles.join("\n")}]};
			}
			
			return {message: 'No roles defined'};
		}

    },
};