const Discord = require('discord.js');

module.exports = {
	name: 'hal',
	description: 'Help',
	dm: true,
	help: false,
	execute(client, message, args) {

		if (!args.length) {
			const help = new Discord.MessageEmbed()
				.setColor('#015267')
				.setTitle('What can I do')
				.setThumbnail(client.user.avatarURL())
				.setFooter('Type `!' + this.name + ' <command>` for more help')
				.setTimestamp();

			var commands = [];
			client.commands.sort((a,b) => a.name - b.name).forEach((cmd) => {
				if (cmd.usage) usage = ' `' + cmd.usage + '`'
				else usage = '';
				if (cmd.help !== false) {
					commands.push('`!' + cmd.name + '`' + usage + ' :: ' + cmd.description)
				}
			})
			help.addField('Commands', commands.join('\n'));
        	return message.channel.send(help);
		}

		const cmdName = args.shift().toLowerCase();
		const cmd = client.commands.get(cmdName)
			|| client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(cmdName));
		
		if (!cmd) {
			return message.reply('Command `' + cmdName + '` not found.');
		}

		const help = new Discord.MessageEmbed()
		.setColor('#015267')
		.setTitle(cmd.description)
		.setThumbnail(client.user.avatarURL())
		.addFields({name: 'Command', value: cmd.name})
		.setFooter('Help for ' + cmd.name)
		.setTimestamp();

		if (cmd.man_description) {
			help.setDescription(cmd.man_description);
		}
		if (cmd.aliases) {
			help.addField("Alias", cmd.aliases.join('\n'));
		}
		if (cmd.usage) {
			help.addField("Usage", '`!' + cmd.name + ' ' + cmd.usage + '`');
		}
		if (cmd.man_usage) {
			help.addField("Options", cmd.man_usage.join('\n'));
		}

		return message.channel.send(help);

	},
};