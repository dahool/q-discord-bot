const { statusKey } = require('../config.json');
const { AllianceStatus } = require('./allied')
const { ApplicationCommandOptionType } = require('discord.js');

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
		type: ApplicationCommandOptionType.String,
		required: true
	},{
		name: 'reason',
		description: 'Reason',
		type: ApplicationCommandOptionType.String,
		required: true
	}],
	async execute(client, args) {
		const as = new AllianceStatus(statusKey.HOSTILE, this.name);
		as.execute(client, args);
	}
};
