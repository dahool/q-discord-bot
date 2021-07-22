const { DateTime } = require('luxon');
const calendar = require('../functions/calendar');

module.exports = {
	name: 'load',
	description: 'Reload events calendar',
	dm: false,
	slash: false,
	admin: true,
	async execute(client, args) {
		client.reply('On it');
		return calendar.execute(client.connection);
	}
};
