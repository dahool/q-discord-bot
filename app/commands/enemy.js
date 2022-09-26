const { statusKey } = require('../config.json');
const { AllianceStatus } = require('./allied')

module.exports = {
	AllianceStatus,
	name: 'enemy',
	description: 'Set an alliance to "enemy"',
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
		const as = new AllianceStatus(statusKey.ENEMY, this.name);
		as.execute(client, args);
	}
};
