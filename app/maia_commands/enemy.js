const { statusKey } = require('../config.json');
const { AllianceStatus } = require('./allied')

module.exports = {
	name: 'enemy',
	description: 'Set an alliance to "enemy"',
	dm: false,
    args: true,
	private: true,
    usage: '<TAG> <reason>',	
	async execute(client, message, args) {
		const as = new AllianceStatus(this.conn, statusKey.ENEMY, this.name);
		as.execute(client, message, args);
	}
};
