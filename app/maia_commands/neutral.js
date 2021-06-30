const { statusKey } = require('../config.json');
const { AllianceStatus } = require('./allied')

module.exports = {
	name: 'neutral',
	description: 'Set an alliance to "neutral"',
	dm: false,
    args: true,
    usage: '<TAG> <reason>',	
	private: true,
	async execute(client, message, args) {
		const as = new AllianceStatus(this.conn, statusKey.NEUTRAL, this.name);
		as.execute(client, message, args);
	}
};
