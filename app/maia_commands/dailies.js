const Discord = require('discord.js');
const { DateTime } = require('luxon');

const { groupBy, randomColor } = require('../utils')

const cs = require('../values')

const db = require('../db/db');

const dailies = require('./dailies.json');

const { dailiesMax } = require('../config.json');

function get_next_execution(rotation, zone) {
	var start = DateTime.utc().set({hour: zone.start.substr(0,2), minute: zone.start.substr(2,2)}).setLocale('en');
	if (rotation == zone.day) {
		start = start.plus({days: 11});
	} else if (rotation > zone.day) {
		start = start.plus({days: (dailiesMax - rotation) + zone.day});
	} else {
		start = start.plus({days: (dailiesMax - rotation) + (dailiesMax - zone.day)});
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

notify = async (connection, section, client) => {
	const config = new db.ConfigDb(connection);
	config.getCommon("general").then(general => {
		if (!general) {
			general = {rotation: 1};
		}
		config.findBy({uuid: cs.DAILY_CHANNEL}).then(guilds => {
			const rotation = ++general.rotation;
			dailies
			.filter(z => z.day == rotation && z.start == section)
			.forEach((z) => {
				const end = DateTime.utc().set({hour: z.start.substr(0,2), minute: z.start.substr(2,2)}).setLocale('en').plus({hours: z.duration});
				guilds.forEach((guild) => {
					const channel = client.guilds.cache.get(guild.guild).channels.cache.get(guild.channel);
					const msgEmbed = new Discord.MessageEmbed()
					.setColor(z.color)
					.setThumbnail("https://www.dropbox.com/s/b6g9gijywzoh3ks/stfc.png?raw=1")
					.setDescription("Starting soon")
					.setTitle(z.event + ' Event')
					.setImage(z.image)
					.addFields({name: "Ends", value: end.toRelative()})
					.setTimestamp();
					channel.send(msgEmbed);
				})
			})
		});
	})
}

rotate = async (connection) => {
    const config = new ConfigDb(connection);
    var general = await config.getCommon("general") || {rotation: 1};
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
			const name = args.join(' ').toLowerCase();
			const list = find_by_name(rotation, name);

			if (list.length == 0) {
				return message.reply('No matching dailies found');
			}

			groupBy(list.sort((a,b) => a.next - b.next), a => a.event).forEach((value, key) => {
				const first = value[0];

				const msgEmbed = new Discord.MessageEmbed()
				.setColor(first.color)
				.setThumbnail("https://www.dropbox.com/s/b6g9gijywzoh3ks/stfc.png?raw=1")
				.setTitle(first.event + ' Event')
				.addFields({
					name: "Next", value: first.next.toRelative(), inline: true
				})
				.setImage(first.image)
				.setTimestamp();
				if (first.running) {
					msgEmbed.description("Running now");
				}
				message.channel.send(msgEmbed);

			});

		} else {
			const list = find_by_day(rotation);
			list.sort((a,b) => a.next - b.next).forEach(z => {
				const msgEmbed = new Discord.MessageEmbed()
				.setColor(z.color)
				.setThumbnail("https://www.dropbox.com/s/b6g9gijywzoh3ks/stfc.png?raw=1")
				.setDescription("Running now")
				.setTitle(z.event + ' Event')
				.setImage(z.image)
				.addFields({name: "Ends", value: z.end.toRelative()})
				.setTimestamp();
				message.channel.send(msgEmbed);
			})

		}
    },
};