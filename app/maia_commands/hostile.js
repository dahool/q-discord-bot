const { statusKey } = require('../config.json');
const { AllianceStatus } = require('./allied')

module.exports = {
	name: 'hostile',
	description: 'Set an alliance to "hostile"',
	dm: false,
    args: true,
    usage: '<TAG> <reason>',	
	private: true,
	async execute(client, message, args) {
		const as = new AllianceStatus(this.conn, statusKey.HOSTILE, this.name);
		as.execute(client, message, args);
	}
};
