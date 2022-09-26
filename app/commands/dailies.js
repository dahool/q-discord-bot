const Discord = require('discord.js');
const { DateTime, Settings } = require('luxon');

const { groupBy, asTimeRelative } = require('../utils')

const cs = require('../values')

const { db } = require('../db/db');

const dailies = require('./dailies.json');

const ROT_FORMAT = 'yyyy-MM-dd';

const { dailiesMax, dailiesPart } = require('../config.json');

Settings.defaultZone = process.env.DAILY_TIMEZONE;

function get_next_execution(rotation, daily) {
	var start = DateTime.local().set({hour: daily.start.substr(0,2), minute: daily.start.substr(2,2)});
	if (rotation.rotation == daily.day) {
		const today = DateTime.local();
		if (today > start) {
			start = start.plus({days: dailiesMax});
		}
	} else {
		var r = rotation.rotation;
		do {
			r = doRotate(r);
			start = start.plus({days: 1});
		} while (r != daily.day);
	}
	return start;
}

function running(rotation, z) {
	if (z.day == rotation.rotation) {
		const today = DateTime.local();
		const start = DateTime.fromFormat(rotation.rotationDay, ROT_FORMAT).set({hour: z.start.substr(0,2), minute: z.start.substr(2,2)})
		const end = start.plus({hours: z.duration});
		return (today >= start && today < end);
	}
	return false;
}

function find_by_day(rotation) {
	return dailies
		.filter(z => running(rotation, z))
		.map(z => {
			z.end = endTime(rotation, z)
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
	const current = parseInt(DateTime.local().toFormat('HHmm'));
	var ls = dailies.filter(z => rotation.rotation == z.day && parseInt(z.start) > current)
	if (!ls) {
		const r = doRotate(rotation.rotation);
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

function endTime(rotation, zone) {
	return DateTime.local().set({hour: zone.start.substr(0,2), minute: zone.start.substr(2,2)}).plus({hours: zone.duration})
}

async function notify(section, client, rotate) {
	general = await getCurrentRotation(client);
	db.config.findBy({uuid: cs.DAILY_CHANNEL}).then(guilds => {
		if (rotate) rotateInPlace(general);
		dailies.filter(z => z.day == general.rotation && z.start == section)
			.forEach((z) => {
				const end = endTime(general, z)
				guilds.forEach((guild) => {
					const channel = client.client.guilds.cache.get(guild.guild).channels.cache.get(guild.channel);
					const msgEmbed = new Discord.MessageEmbed()
					.setColor(z.color)
					.setThumbnail("https://www.dropbox.com/s/b6g9gijywzoh3ks/stfc.png?raw=1")
					.setDescription("Coming up next")
					.setTitle(z.event + ' Event')
					.setImage(z.image)
					.addFields({name: "Ends", value: asTimeRelative(end), inline: true})
					.setTimestamp();

					if (z.description) {
						msgEmbed.setFooter(z.description);
					}
					
					channel.send({ embeds: [msgEmbed]}).catch((e) => console.error(e));
				})
			})
	});
}

function rotateInPlace(general) {
	general.rotation = doRotate(general.rotation);
	general.rotationDay = DateTime.local().toFormat(ROT_FORMAT);
}

async function rotate() {
    var general = await db.config.getCommon("general") || {'rotation': 1};
	rotateInPlace(general);
    config.pushCommon("general", general);
    return general;
}

async function getCurrentRotation(client) {
	const currentDay = DateTime.local().toFormat(ROT_FORMAT);
	//return dayRotation.find(v => v.rotationDay == currentDay);
	return await db.dailies.findByDay(currentDay);
}

module.exports = {
	rotate,
	notify,
	name: 'dailies',
	aliases: ['daily'],
    description: 'Show current and future dailies',
	usage: '<name>',
	man_description: 'Use without arguments to get a list of current dailies.',
	dm: true,
    slash: true,
    options: [{
		name: 'command',
		description: 'Command',
		type: 3,
		choices: [
			{
				name: 'Next event in rotation',
				value: 'next',
			},
			{
				name: 'Find by name',
				value: 'find',
			}
		]
	},{
		name: 'event',
		description: 'Event name',
		type: 3
	}],	
	async execute(client, args) {
		const rotation = await getCurrentRotation(client);

		if (args.command) {
			if ('next' == args.command.toLowerCase()) {
				list = find_next(rotation);
			} else {
				let name = null;
				if ('find' == args.command.toLowerCase()) {
					name = args.event?.toLowerCase();
					if (!name) {
						return client.reply('Missing event name')
					}
				} else {
					name = args.command.toLowerCase();
				}
				list = find_by_name(rotation, name);
			}

			if (list.length == 0) {
				return client.reply('No matching dailies found');
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
					suffix = "next " + asTimeRelative(z.next);
				}
				msgEmbed.addField(z.event + ' Event (' + suffix + ")", z.description)
			})

			client.reply(msgEmbed);

		} else {
			const list = find_by_day(rotation);

			const msgEmbed = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setThumbnail("https://www.dropbox.com/s/b6g9gijywzoh3ks/stfc.png?raw=1")
			.setTitle('Current Events')
			.setFooter(`(${rotation.rotation})`)
			.setTimestamp();
		
			list.sort((a,b) => a.next - b.next).forEach(z => {
				msgEmbed.addField(z.event + ' Event (ends ' + asTimeRelative(z.end) + ')', z.description || z.event)
			})

			client.reply(msgEmbed);
		}
    },
};