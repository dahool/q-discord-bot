const Discord = require('discord.js');
const { statusKey } = require('../config.json');
const db = require('../db/db');

/*var groupBy = function(xs, key) {
	return xs.reduce(function(rv, x) {
		(rv[x[key]] = rv[x[key]] || []).push(x);
		return rv;
	}, {});
};*/
function groupBy(list, keyGetter) {
    const map = new Map();
    list.forEach((item) => {
         const key = keyGetter(item);
         const collection = map.get(key);
         if (!collection) {
             map.set(key, [item]);
         } else {
             collection.push(item);
         }
    });
    return map;
}

module.exports = {
	name: 'diplomacy',
	description: 'List diplomacy status',
	dm: false,
	async execute(client, message, args) {
		const al = new db.AllianceDb(this.conn);
		var list = await al.findBy({guild: message.channel.guild.id, status: {$ne: statusKey.NEUTRAL.name}});
		if (list.length == 0) {
			return message.reply(`${message.channel.guild.name} don't have diplomatic relationships with any alliance`)
		}

		const confirm = new Discord.MessageEmbed()
			.setColor('#24ce4d')
			.setTitle('Diplomacy Status')
			.setThumbnail(message.channel.guild.iconURL())
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

		message.delete();

		return message.channel.send(confirm);

	}
};
