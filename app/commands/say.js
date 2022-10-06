const { safeLower } = require('../utils');
const cmds = require('./data/say.json');
const { ApplicationCommandOptionType } = require('discord.js');

const choices = cmds.map(item => { return {name: item.text, value: item.id} })

module.exports = {
	name: 'say',
	dm: false,
	description: 'say something',
	options: [{
		name: 'command',
		description: 'Command',
		type: ApplicationCommandOptionType.String,
		required: true,
		choices: choices		
	}],
	async execute(client, args) {
		if (!args.command) {
			const values = cmds.map(v => v.id);
			return client.reply('Commands\n>>> ' + values.join('\n'), true)
		} else {
			const cmd = cmds.find(v => v.id == safeLower(args.command));
			if (!cmd) {
				return client.reply('Unknown command `' + args.command + '`', true);
			}
			const r = client.channel.send(cmd.value);
			return client.reply("Used " + cmd.id);
		}
	}
};
