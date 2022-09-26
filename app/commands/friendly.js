const { statusKey } = require('../config.json');
const { AllianceStatus } = require('./allied')

module.exports = {
	AllianceStatus,
	name: 'friendly',
	description: 'Set an alliance to "friendly"',
	dm: false,
	private: true,
    slash: true,
    options: [{
		name: 'tag',
		description: 'Alliance Tag',
		type: 3,
		required: true
	}],
	async execute(client, args) {
		const as = new AllianceStatus(statusKey.FRIENDLY, this.name);
		as.execute(client, args);
	}
};
