const Discord = require('discord.js');
const { statusKey } = require('../config.json');
const db = require('../db/db');
const { groupBy } = require('../utils')

module.exports = {
	name: 'diplomacy',
	description: 'List alliance diplomacy status',
	dm: false,
	slash: true,
	async execute(client, args) {
		const al = new db.AllianceDb(client.connection);
		var list = await al.findBy({guild: client.guild.id, status: {$ne: statusKey.NEUTRAL.name}});
		if (list.length == 0) {
			return message.reply(`${client.guild.name} doesn't have diplomatic relationships with any alliance`)
		}

		const confirm = new Discord.MessageEmbed()
			.setColor('#24ce4d')
			.setTitle('Diplomacy Status')
			.setThumbnail(client.guild.iconURL())
			.setTimestamp();
			//.setFooter(`!${this.name} • Executed by ${message.author.username}`, `${message.author.displayAvatarURL()}`);

		const groups = groupBy(list, p => p.status);

		if (groups.get(statusKey.ALLIED.name)) {
			confirm.addField('<:allied:754785979197292645> Allies', groups.get(statusKey.ALLIED.name).map(a => a.uuid).join('\n'))
		}
		if (groups.get(statusKey.FRIENDLY.name)) {
			confirm.addField('<:friendly:754785979285635072> Friends', groups.get(statusKey.FRIENDLY.name).map(a => a.uuid).join('\n'))
		}
		if (groups.get(statusKey.HOSTILE.name)) {
			confirm.addField('<:enemy:754785979210137721> Hostiles', groups.get(statusKey.HOSTILE.name).map(a => a.uuid).join('\n'))
		}
		if (groups.get(statusKey.ENEMY.name)) {
			confirm.addField('<:enemy:754785979210137721> Enemies (KOS)', groups.get(statusKey.ENEMY.name).map(a => a.uuid).join('\n'))
		}

		return client.sendMessage(confirm);

	}
};
