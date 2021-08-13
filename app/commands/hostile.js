const { statusKey } = require('../config.json');
const { AllianceStatus } = require('./allied')

module.exports = {
	AllianceStatus,
	name: 'hostile',
	description: 'Set an alliance to "hostile"',
	dm: false,
	private: true,
    slash: true,
    options: [{
		name: 'tag',
		description: 'Alliance Tag',
		type: 3,
		required: true
	},{
		name: 'reason',
		description: 'Reason',
		type: 3,
		required: true
	}],
	async execute(client, args) {
		const as = new AllianceStatus(client.connection, statusKey.HOSTILE, this.name);
		as.execute(client, args);
	}
};
