const Discord = require('discord.js');
const { DateTime } = require('luxon');
const { safeLower } = require('../utils');
const { add_event } = require('../functions/calendar');
const db = require('../db/db');

const zones = require('./zones.json');

const POSITIVE = ['yes', 'si', 'sure', 'claro', 'yup']
const NEGATIVE = ['no']

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

function add_event(connection, guild, time, title, location, recurrent) {
	return new Promise((resolve) => {
		const eventID = "Z" + Math.random().toString(36).substring(2, 5) + Math.random().toString(36).substring(2, 5);
		var times = [time.toJSDate()];
		if (recurrent) {
			do {
				times.push(time.plus({days: 7}).toJSDate());
			} while (times.length < 12)
		}
		const calendar = new CalendarDb(connection);
		times.forEach((tm) => {
			calendar.insert([{guild: guild, type: 'zone', uid: eventID, summary: title, location: location, start: tm, description: '', notified: false}]);
		})
		resolve.resolve();
	})
}

async function create_event(conn, message, zone, title, recurrent) {
	var content;
	if (recurrent) {
		content = "Ok, created a recurrent reminder for every " + zone.next.toFormat("ccc 'at' h:mma ZZZZ")
	} else {
		content = "Ok, created a one time reminder on " + zone.next.toFormat("LLL d 'at' h:mma ZZZZ")
	}
	content += ' with the title `' + title + '`';
	return add_event(conn, message.channel.guild.id, zone.next, title, zone.zone, recurrent).then(() => {
		message.reply(content);
	});
}

async function handle_tag(conn, message, zone) {
	
	message.reply(`Ok, I'm creating a reminder for ${zone.zone}. What's the title?`)

	var title;
	var recurrent;

	const collector = message.channel.createMessageCollector(m => m.author.id == message.author.id, {time: 60000});
	collector.on('collect', m => {
		if (title == undefined) {
			title = m.content;
			message.reply("Do you want to schedule a recurrent event?");
		} else if (recurrent == undefined) {
			if (POSITIVE.some(v => v == m.content.toLowerCase())) {
				recurrent = true;
				collector.stop();
				return create_event(conn, message, zone, title, true);
			} else if (NEGATIVE.some(v => v == m.content.toLowerCase())) {
				recurrent = false;
				collector.stop();
				return create_event(conn, message, zone, title, false);
			} else {
				message.reply("Sorry, I don't understand, try again. Do you want a recurrent reminder?");
			}
		}
	})
	collector.on('end', m => {
		if (title == undefined || recurrent == undefined) {
			return message.reply("Sorry, I'm done waiting. Start again");
		}
	})

}
/*
async function list_events(conn, message, zone) {
	const cal = new db.CalendarDb(conn);

	cal.findBy({guild: message.channel.guild.id, type: 'zone', location: zone.zone, notified: false}).then(ev => {

	});

	
	calendar.insert([{guild: guild, type: 'zone', uid: eventID, summary: title, location: location, start: tm, description: '', notified: false}]);
}
*/
module.exports = {
	name: 'zone',
	aliases: ['territory','zones'],
    description: 'Show territory details',
	usage: '<option> <argument>',
	man_usage: [
		'* *<zonename>* :: `List details for specific zone`',
		'* particle *<particle_name>* :: `List zones with specific particle`',
		'* *<zonename>* tag :: `Create an event reminder for this zone`'],
	args: true,
	dm: false,
    async execute(client, message, args) {
		const cmd = safeLower(args.shift());
		const param = safeLower(args.shift());
		var zones = []

		if ('particles' == cmd || 'particle' == cmd) {
			if (!param) {
				return message.reply('Please, specify particle name (quantum, surax, phatom)');
			}
			zones = list_by_particle(param);
		} else {
			zones = find_by_name(cmd);
			if ('tag' == param) {
				if (zones.length > 1) {
					message.reply('Sorry, too many zones matching ' + cmd + '. Narrow your search.');		
				} else if (zones.length == 1) {
					return handle_tag(this.conn, message, zones[0]);
				}
			} else if ('events' == param) {
				if (zones.length > 1) {
					message.reply('Sorry, too many zones matching ' + cmd + '. Narrow your search.');		
				} else if (zones.length == 1) {
					return list_events(this.conn, message, zones[0]);
				}
			}
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