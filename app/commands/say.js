const { safeLower } = require('../utils');
const cmds = require('./say.json');
const { ApplicationCommandOptionType } = require('discord.js');

module.exports = {
	name: 'say',
	description: 'Say',
	dm: false,
	slash: true,
	options: [{
		name: 'command',
		description: 'Command',
		type: ApplicationCommandOptionType.String
	}],
	async execute(client, args) {
		if (!args.command) {
			const values = cmds.map(v => v.id);
			client.clear();
			return client.reply('Commands\n>>> ' + values.join('\n'), true)
		} else {
			const cmd = cmds.find(v => v.id == safeLower(args.command));
			if (!cmd) {
				client.clear();
				return client.reply('Unknown command `' + args.command + '`', true);
			}
			client.clear();
			return client.sendMessage(cmd.value);
		}

	}
};
