const { DateTime } = require('luxon');
const calendar = require('../functions/calendar');

module.exports = {
	name: 'load',
	description: 'Reload events calendar',
	dm: false,
	admin: true,
	async execute(client, message, args) {
		message.channel.send('On it');
		return calendar.execute(this.conn);
	}
};
