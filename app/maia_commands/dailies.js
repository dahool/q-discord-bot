const Discord = require('discord.js');
const { DateTime } = require('luxon');

const { groupBy, safeLower, randomColor } = require('../utils')

const cs = require('../values')

const db = require('../db/db');

const dailies = require('./dailies.json');

const { dailiesMax, dailiesPart } = require('../config.json');

function get_next_execution(rotation, zone) {
	var start = DateTime.utc().set({hour: zone.start.substr(0,2), minute: zone.start.substr(2,2)}).setLocale('en');
	if (rotation == zone.day) {
		const today = DateTime.utc();
		if (today > start) {
			start = start.plus({days: dailiesMax});
		}
	} else {
		var r = rotation;
		do {
			r = doRotate(r);
			start = start.plus({days: 1});
		} while (r != zone.day);
	}
	return start;
}

function running(day, z) {
	if (z.day == day) {
		const today = DateTime.utc();
		const start = DateTime.utc().set({hour: z.start.substr(0,2), minute: z.start.substr(2,2)})
		const end = start.plus({hours: z.duration});
		return (today >= start && today < end);
	}
	return false;
}

function find_by_day(day) {
	return dailies
		.filter(z => running(day, z))
		.map(z => {
			z.end = DateTime.utc().set({hour: z.start.substr(0,2), minute: z.start.substr(2,2)}).setLocale('en').plus({hours: z.duration});
			return z;
		})

}

function find_by_name(rotation, name) {
	return dailies
		.filter(z => z.event.toLowerCase().includes(name))
		.map(z => {
			z.next = get_next_execution(rotation, z);
			z.running = running(rotation, z);
			return z;
		});
}

function find_next(rotation) {
	const current = parseInt(DateTime.utc().toFormat('HHmm'));
	var ls = dailies.filter(z => rotation == z.day && parseInt(z.start) > current)
	if (!ls) {
		const r = doRotate(rotation);
		ls = dailies.filter(z => r == z.day && z.start == dailiesPart[0])
	}
	return ls.map(z => {
		z.next = get_next_execution(rotation, z);
		z.running = false;
		return z;
	});
}

function doRotate(value) {
	if (value == dailiesMax) return 1;
	return ++value;
}

async function notify(connection, section, client, rotate) {
	const config = new db.ConfigDb(connection);
	config.getCommon("general").then(general => {
		if (!general) {
			general = {rotation: 1};
		}
		config.findBy({uuid: cs.DAILY_CHANNEL}).then(guilds => {
			if (rotate) general.rotation = doRotate(general.rotation);
			dailies.filter(z => z.day == general.rotation && z.start == section)
				.forEach((z) => {
					const end = DateTime.utc().set({hour: z.start.substr(0,2), minute: z.start.substr(2,2)}).setLocale('en').plus({hours: z.duration});
					guilds.forEach((guild) => {
						const channel = client.guilds.cache.get(guild.guild).channels.cache.get(guild.channel);
						const msgEmbed = new Discord.MessageEmbed()
						.setColor(z.color)
						.setThumbnail("https://www.dropbox.com/s/b6g9gijywzoh3ks/stfc.png?raw=1")
						.setDescription("Coming up next")
						.setTitle(z.event + ' Event')
						.setImage(z.image)
						.setFooter(z.description)
						.addFields({name: "Ends", value: end.toRelative(), inline: true})
						.setTimestamp();
						channel.send(msgEmbed);
					})
				})
		});
	})
}

async function rotate(connection) {
    const config = new db.ConfigDb(connection);
    var general = await config.getCommon("general") || {'rotation': 1};
    if (general.rotation == dailiesMax) {
        general.rotation = 1;
    } else {
        general.rotation++;
    }
    config.pushCommon("general", general);
    return general.rotation;
}

module.exports = {
	name: 'dailies',
	aliases: ['daily'],
    description: 'Show current and future dailies',
	usage: '<name>',
	man_description: 'Use without arguments to get a list of current dailies.',
	dm: true,
	rotate,
	notify,
    async execute(client, message, args) {
		const config = new db.ConfigDb(this.conn);

		const rotation = (await config.getCommon("general") || {rotation: 1}).rotation;

		if (args.length) {
			var list;
			if ('next' == safeLower(args[0])) {
				list = find_next(rotation);
			} else {
				const name = args.join(' ').toLowerCase();
				list = find_by_name(rotation, name);
			}

			if (list.length == 0) {
				return message.reply('No matching dailies found');
			}

			const msgEmbed = new Discord.MessageEmbed()
			.setColor('#f2f542')
			.setThumbnail("https://www.dropbox.com/s/b6g9gijywzoh3ks/stfc.png?raw=1")
			.setTitle('Upcoming Events')
			.setTimestamp();
		
			groupBy(list.sort((a,b) => a.next - b.next), a => a.event).forEach((value, key) => {
				const z = value[0];
				var suffix;
				if (z.running) {
					suffix = "running now";
				} else {
					suffix = "next " + z.next.toRelative();
				}
				msgEmbed.addField(z.event + ' Event (' + suffix + ")", z.description)
			})

			message.channel.send(msgEmbed);

		} else {
			const list = find_by_day(rotation);

			const msgEmbed = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setThumbnail("https://www.dropbox.com/s/b6g9gijywzoh3ks/stfc.png?raw=1")
			.setTitle('Current Events')
			.setFooter(`(${rotation})`)
			.setTimestamp();
		
			list.sort((a,b) => a.next - b.next).forEach(z => {
				msgEmbed.addField(z.event + ' Event (ends ' + z.end.toRelative() + ')', z.description)
			})

			message.channel.send(msgEmbed);
		}
    },
};