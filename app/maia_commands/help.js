const Discord = require('discord.js');

module.exports = {
	name: 'help',
	description: 'Help',
	dm: true,
	execute(client, message, args) {
		const help = new Discord.MessageEmbed()
        	.setColor('#015267')
        	.setTitle('What can I do')
			.setThumbnail(client.user.avatarURL())
			.setTimestamp();

		client.commands.forEach((cmd) => {
			if (cmd.usage) usage = ' `' + cmd.usage + '`'
			else usage = '';
			if (this.name != cmd.name) help.addField('`!' + cmd.name + '`' + usage, cmd.description);
		})

        message.channel.send(help);
	},
};