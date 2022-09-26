const Discord = require('discord.js');
const { statusKey } = require('../config.json');
const { db } = require('../db/db');
const { groupBy } = require('../utils')

build_diplomacy = async(client) => {
	var list = await db.alliance.findBy({guild: client.guild.id, status: {$ne: statusKey.NEUTRAL.name}});
	if (list.length == 0) {
		return `${client.guild.name} doesn't have diplomatic relationships with any alliance`
	}

	const confirm = new Discord.MessageEmbed()
		.setColor('#24ce4d')
		.setTitle('Diplomacy Status')
		.setThumbnail(client.guild.iconURL())
		.setTimestamp();

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

	return confirm;
}

module.exports = {
	name: 'diplomacy',
	description: 'List alliance diplomacy status',
	dm: false,
	slash: true,
	build_diplomacy,
	async execute(client, args) {
		return client.reply(await build_diplomacy(client));
	}
};
