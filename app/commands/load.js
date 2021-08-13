const { DateTime } = require('luxon');
const calendar = require('../functions/calendar');

module.exports = {
	name: 'load',
	description: 'Reload events calendar',
	dm: false,
	slash: false,
	admin: true,
	async execute(client, args) {
		client.clear();
		const r = calendar.execute(client.connection).then(r => client.reply(r, true));
		return r;
	}
};
