const { statusKey } = require('../config.json');
const { AllianceStatus } = require('./allied')
const { ApplicationCommandOptionType } = require('discord.js');

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
		type: ApplicationCommandOptionType.String,
		required: true
	}],
	async execute(client, args) {
		const as = new AllianceStatus(client.connection, statusKey.FRIENDLY, this.name);
		as.execute(client, args);
	}
};
