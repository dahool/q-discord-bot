const Discord = require('discord.js');
const { DateTime } = require('luxon');

const zones = require('./zones.json');

function get_next_execution(zone) {
	const today = DateTime.utc();
	var zoneTime = today.set({hour: zone.time.substr(0,2), minute: zone.time.substr(2,2)}).setLocale('en');
	if (today.weekday == zone.weekday) {
		if (zoneTime < today) {
			return zoneTime.plus({days: 7});
		}
		return zoneTime;
	}
	do {
		zoneTime = zoneTime.plus({days: 1});
	} while (zoneTime.weekday != zone.weekday);
	return zoneTime;
}

function list_by_particle(particle) {
	return zones
		.filter(z => z.particle.toLowerCase().includes(particle))
		.map(z => Object.assign({next: get_next_execution(z)}, z));
}

function find_by_name(name) {
	return zones
		.filter(z => z.zone.toLowerCase().includes(name))
		.map(z => Object.assign({next: get_next_execution(z)}, z));
}

module.exports = {
	name: 'zone',
	aliases: ['territory','zones'],
    description: 'Show territory details',
	usage: '<option> <argument>',
	man_usage: ['* *<zonename>* :: `List details for specific zone`', '* particle *<particle_name>* :: `List zones with specific particle`'],
	args: true,
	dm: true,
    async execute(client, message, args) {
		const cmd = args[0].toLowerCase();
		var zones = []

		if ('particles' == cmd || 'particle' == cmd) {
			if (args.length == 1) {
				return message.reply('Please, specify particle name (quantum, surax, phatom)');
			}
			const name = args[1].toLowerCase();
			zones = list_by_particle(name);
		} else {
			zones = find_by_name(cmd);
		}

		if (zones.length == 0) {
			return message.reply('No zones found matching criteria');
		}

		//const icon = message.channel.guild ? message.channel.guild.iconURL() : "https://www.dropbox.com/s/5xeeuzuopinq6bd/maia.png?raw=1";
		const icon = message.channel.guild ? message.channel.guild.iconURL() : client.user.avatarURL();

		const msgEmbed = new Discord.MessageEmbed()
			.setColor('#e1dad8')
			.setThumbnail(icon)
			.setTitle("Territory")
			.setTimestamp();

		const today = DateTime.utc();
		zones.sort((a,b) => a.next - b.next).forEach(z => {
			const next = z.next.hasSame(today, "day") ? z.next.toRelative() : z.next.toFormat('LLL, dd') + ' ' +z.next.toRelative();
			var content = "`Particle: " + z.particle + "`\n";
			content+= "`Type: " + z.type + "`\n";
			content+= "`Takeover Time: " + z.next.toFormat('ccc, h:mma ZZZZ') + "`\n";
			content+= "`Next: " + next + "`";
			msgEmbed.addField(z.zone, content);
		})	

		return message.channel.send(msgEmbed);
    },
};