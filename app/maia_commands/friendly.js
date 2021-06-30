const { statusKey } = require('../config.json');
const { AllianceStatus } = require('./allied')

module.exports = {
	name: 'friendly',
	description: 'Set an alliance to "friendly"',
	dm: false,
    args: true,
	private: true,
    usage: '<TAG> <reason>',	
	async execute(client, message, args) {
		const as = new AllianceStatus(this.conn, statusKey.FRIENDLY, this.name);
		as.execute(client, message, args);
	}
};
