const Discord = require('discord.js');

module.exports = {
	name: 'lcars',
    description: 'Link to Library Computer Access/Retrieval System',
	dm: true,
    args: false,
    execute(client, message, args) {
        const msgEmbed = new Discord.MessageEmbed()
        	.setColor('#0000ff')
			.setTitle('Library Computer Access/Retrieval System')
			.setURL('https://discord.gg/lcars')
			.setDescription('**LCARS** or "Library Computer Access/Retrieval System", uses a command entry interface where you can query our expansive database for specific information. All commands available are listed below.')
			.setThumbnail('https://uss-theurgy.com/w/images/b/bb/Starfleet_command_emblem.png')
			.addFields(
				{ name: 'Information', value: 'The LCARS Discord Server is a comprehensive crowd-sourced database platform. On this server, you will find detailed information about ships, officers, missions, systems, factions, etc.', inline: true },
        		{ name: '`Link`', value: 'https://discord.gg/lcars', inline: true },
			)
			.setImage('https://www.dropbox.com/s/opc4hpkv9i501ti/lcars.png?raw=1')
			.setTimestamp()
			.setFooter(`!lcars | Requested by ${message.author.username}`, `${message.author.displayAvatarURL()}`);
        return message.channel.send(msgEmbed);
    },
};