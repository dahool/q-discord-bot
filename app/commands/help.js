const { helper } = require('../helper');
const { ApplicationCommandOptionType } = require('discord.js');

module.exports = {
	name: 'q',
	slashName: 'help',
	description: 'Help',
	dm: true,
	slash: true,
	options: [{
		name: 'command',
		description: 'Command you require help for',
		type: ApplicationCommandOptionType.String,
		required: false
	}],
	help: false,
	execute(client, args) {
		return helper(this.name, client, args)
	},
};