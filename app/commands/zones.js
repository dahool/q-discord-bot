const Discord = require('discord.js');
const { DateTime } = require('luxon');
const { safeLower, asTimeRelative, asTimeFormat } = require('../utils');
const { ApplicationCommandOptionType } = require('discord.js');

const zones = require('./data/zones.json');
const rss = require('./data/rss.json');

const rssMap = new Map();
rss.forEach(item => {
	rssMap.set(item.id, item.icon)
})

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
		.filter(z => z.zone.toLowerCase().includes(name.toLowerCase()))
		.map(z => Object.assign({next: get_next_execution(z)}, z));
}

module.exports = {
	find_by_name,
	name: 'zone',
	aliases: ['territory','zones'],
    description: 'Show territory details',
	options: [
		{
			name: 'name',
			description: 'Zone or particle name',
			type: ApplicationCommandOptionType.String,
			required: true
		}
	],
	dm: false,
    async execute(client, args) {
		const lookupName = safeLower(args.name);
		let zones = [];

		zones = find_by_name(lookupName);
		if (!zones.length) {
			zones = list_by_particle(lookupName);
		}

		if (!zones.length) {
			return client.reply(`No zones found matching \`${lookupName}\``);
		}

		const icon = client.guild ? client.guild.iconURL() : client.client.user.avatarURL();

		const msgEmbed = new Discord.EmbedBuilder()
			.setColor('#e1dad8')
			.setThumbnail(icon)
			.setTitle("Territory");

		zones.sort((a,b) => a.next - b.next).forEach(z => {
			var content = "`Particle:` <" + rssMap.get(z.particle) + "> " + z.particle + "\n";
			content+= "`Type:` " + z.type + "\n";
			content+= "`Resources:` " + z.rss.map(i => '<' + rssMap.get(i) + '>').join(' ') + "\n";
			content+= "`Connected:` *" + z.paths.join(', ') + "*\n";
            content+= "`Takeover Time:` " + asTimeFormat(z.next) + "\n"; 
			content+= "`Next:` **" + asTimeRelative(z.next) + "**";
			msgEmbed.addFields({name: z.zone, value: content});
		})	

		return client.reply(msgEmbed, false);
    },
};
