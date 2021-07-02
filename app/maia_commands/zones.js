const Discord = require('discord.js');
const { DateTime } = require('luxon');

const zones = require('./zones.json');

function get_next_execution(zone) {
	const zoneTime = DateTime.utc().set({hour: zone.time.substr(0,2), minute: zone.time.substr(2,2)}).setLocale('en');
	const today = DateTime.utc();
	if (zoneTime.weekday == zone.weekday) {
		if (zoneTime < today) {
			return zoneTime.plus({days: 7});
		}
		return zoneTime;
	} else if (zoneTime.weekday < zone.weekday) {
		return zoneTime.plus({days: zone.weekday - zoneTime.weekday});
	}
	return zoneTime.plus({days: (zoneTime.weekday + zone.weekday) - 1});
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
	usage: '<zone_name|particles> <particle_name>',
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

		const icon = message.channel.guild ? message.channel.guild.iconURL() : "https://www.dropbox.com/s/5xeeuzuopinq6bd/maia.png?raw=1";

		const msgEmbed = new Discord.MessageEmbed()
			.setColor('#e1dad8')
			.setThumbnail(icon)
			.setTitle("Territory")
			.setTimestamp();

		zones.sort((a,b) => a.zone.localeCompare(b.zone)) .forEach(z => {
			var content = "`Particle: " + z.particle + "`\n";
			content+= "`Type: " + z.type + "`\n";
			content+= "`Takeover Time: " + z.next.toFormat('h:mma ZZZZ') + "`\n";
			content+= "`Next: " + z.next.toRelative() + "`";
			msgEmbed.addField(z.zone, content);
		})	

		return message.channel.send(msgEmbed);
    },
};