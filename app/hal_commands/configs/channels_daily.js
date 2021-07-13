const cs = require('../../values')
const { safeLower } = require('../../utils');

const CHANNEL_ID = /<#(\d+)+>/;

function extract_id(regex, str) {
	const m = regex.exec(str);
	if (m) {
		return m[++m.index];
	}
	return null;
}

module.exports = {
	name: cs.DAILY_CHANNEL,
    description: 'Dailies Announcement Channel',
	usage: 'set #channel_name',
    async execute(configDb, cmd, message, params) {
		const key = cs.DAILY_CHANNEL;
		const guild = message.guild.id;
		const op = safeLower(params.shift());

		if (op == 'set') {
			const args = params.join(" ")
			const id = extract_id(CHANNEL_ID, args);
			if (id == null) {
				return message.reply(`Invalid argument \`${args}\`. Specify a valid channel.`);
			}
			configDb.push(guild, key, {'channel': id});
			return {message: this.description, fields: [{ name: 'Channel', value : '<#' + id + '>'}], log: true};
		} else {
			const value = await configDb.findOne(guild, key, 'channel');
			if (value) {
				return {message: this.description, fields: [{ name: 'Channel', value : '<#' + value + '>'}]}
			} else {
				return message.reply(`No config defined for **${this.description}**`);
			}
		}
    },
};