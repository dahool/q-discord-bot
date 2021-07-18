const Discord = require('discord.js');
const { DateTime } = require('luxon');
const { safeLower, groupBy } = require('../utils');
const db = require('../db/db');
const cs = require('../values')

const zones = require('./zones.json');

const POSITIVE = ['yes', 'si', 'sure', 'claro', 'yup','make it so','y']
const NEGATIVE = ['no','n']
const DAYS = ['*mon','*tue','*wed','*thu','*fri','*sat','*sun']

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

function find_by_weekday(weekday) {
	return zones
		.filter(z => z.weekday == weekday)
		.map(z => Object.assign({next: get_next_execution(z)}, z));
}

async function add_event(connection, guild, time, title, location, recurrent) {
	const eventID = "Z" + Math.random().toString(36).substring(2, 5) + Math.random().toString(36).substring(2, 5);
	var times = [time.toJSDate()];
	if (recurrent) {
		do {
			times.push(time.plus({days: 7}).toJSDate());
		} while (times.length < 12)
	}
	const calendar = new db.CalendarDb(connection);
	const zevent = new db.ZoneEventsDb(connection);

	times.forEach((tm, index) => {
		calendar.insert([{guild: guild, type: cs.TERRITORY_CHANNEL, uid: eventID, recurrence: index, summary: title, location: location, start: tm, description: '', notified: false}]);
	})

	var zoneevent = await zevent.findOne(guild, location) || {events: []};
	zoneevent.events.push({id: eventID, title: title, last: times[times.length-1]})

	return zevent.push(guild, location, zoneevent);
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
		if ('cancel' == m.content.toLowerCase()) {
			message.reply("Cancelled.");
			title = "canceled"; // to prevent end message
			collector.stop();
		} else if (title == undefined) {
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

async function handle_deltag(conn, message, zone) {
	const zevent = new db.ZoneEventsDb(conn);
	const calendar = new db.CalendarDb(conn);

	const ze = await zevent.findOneBy({
		guild: message.channel.guild.id,
		uuid: zone.zone,
		events: { $elemMatch: {last: { $gte: DateTime.utc().toJSDate() }} }
	});
	if (ze && ze.events) {
		var handled = false;
		message.channel.send("Enter the ID of the event you want to delete (or type cancel):\n\n>>> " + ze.events.map(ev => 'ID: `' + ev.id + '`     Title: `' + ev.title + '`\n'));
		const collector = message.channel.createMessageCollector(m => m.author.id == message.author.id, {time: 60000});
		collector.on('collect', m => {
			if ('cancel' == m.content.toLowerCase()) {
				message.reply("Cancelled.");
				handled = true;
				collector.stop();
			} else {
				const ev = ze.events.find(ev => ev.id == m.content);
				if (!ev) {
					message.reply("Sorry, can't find event `" + m.content + "`. Try again.")
				} else {
					handled = true;

					ze.events = ze.events.filter(ev => ev.id != m.content);
					calendar.delete({guild: message.channel.guild.id, type: cs.TERRITORY_CHANNEL, uid: m.content});
					zevent.push(message.channel.guild.id, zone.zone, ze);
					message.reply("Event deleted");
					
					collector.stop();
				}
			}
		})
		collector.on('end', m => {
			if (!handled) {
				return message.reply("Sorry, I'm done waiting. Good bye.");
			}
		})

	} else {
		message.reply("No events scheduled for " + zone.zone);
	}

}

async function list_events(conn, message, zone) {
	const zevent = new db.ZoneEventsDb(conn);
	const calendar = new db.CalendarDb(conn);

	const zevents = zevent.findOneBy({
		guild: message.channel.guild.id,
		uuid: zone.zone,
		events: { $elemMatch: {last: { $gte: DateTime.utc().toJSDate() }} }
	});

	const calevents = await calendar.findBy({
		guild: message.channel.guild.id,
		location: zone.zone,
		type: cs.TERRITORY_CHANNEL,
		src: 'calendar',
		notified: false,
		start: { $gte: DateTime.utc().toJSDate() }
	});
	
	zevents.then(ze => {
		if ((ze && ze.events.length) || calevents.length) {

			const msgEmbed = new Discord.MessageEmbed()
			.setColor('#e1dad8')
			.setThumbnail(message.channel.guild ? message.channel.guild.iconURL() : client.user.avatarURL())
			.setTitle("Events for " + zone.zone)
			.setTimestamp();

			if (ze && ze.events.length) {
				msgEmbed.addFields({
					name: 'Scheduled Events', value: ze.events.map(ev => 'ID: `' + ev.id + '`     Title: `' + ev.title + '`\n')
				})
			}

			var caevents = [];
			groupBy(calevents, u => u.uid).forEach(values => {
				caevents.push(values[0].summary);
			})
			if (caevents.length > 0) {
				msgEmbed.addField('Calendar Events', caevents.join('\n'))
			}
			message.channel.send(msgEmbed);

		} else {
			message.reply("No events scheduled for " + zone.zone);
		}
	})

}

module.exports = {
	name: 'zone',
	aliases: ['territory','zones'],
    description: 'Show territory details',
	usage: '<option> <argument>',
	man_usage: [
		'* *<zonename>* :: `List details for specific zone`',
		'* particle *<particle_name>* :: `List zones with specific particle`',
		'* *<zonename>* tag :: `Create an event`',
		'* *<zonename>* -tag :: `Remove an event`',
		'* *<zonename>* events :: `List events`'],
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
		} else if (DAYS.some(v => v == cmd)) {
			zones = find_by_weekday(DAYS.indexOf(cmd) + 1);
		} else if ('today' == cmd) {
			const today = DateTime.local();
			zones = find_by_weekday(today.weekday).filter(z => z.next.startOf("day") == today.startOf("day"))
		} else {
			zones = find_by_name(cmd);
			if ('tag' == param) {
				if (!this.isAdmin) {
					return message.reply("Sorry, you don't have enough permissions to execute this command.");	
				}
				if (zones.length > 1) {
					message.reply('Sorry, too many zones matching ' + cmd + '. Narrow your search.');		
				} else if (zones.length == 1) {
					return handle_tag(this.conn, message, zones[0]);
				}
			} else if ('-tag' == param) {
				if (!this.isAdmin) {
					return message.reply("Sorry, you don't have enough permissions to execute this command.");	
				}				
				if (zones.length > 1) {
					message.reply('Sorry, too many zones matching ' + cmd + '. Narrow your search.');		
				} else if (zones.length == 1) {
					return handle_deltag(this.conn, message, zones[0]);
				}
			} else if ('events' == param) {
				if (!this.isAdmin) {
					return message.reply("Sorry, you don't have enough permissions to execute this command.");	
				}				
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
			.setDescription("Takeover times are in UTC. Other timezones shown for information only.")
			.setTimestamp();


		const today = DateTime.utc();
		zones.sort((a,b) => a.next - b.next).forEach(z => {
			const next = z.next.hasSame(today, "day") ? z.next.toRelative() : z.next.toFormat('LLL, dd') + ' ' +z.next.toRelative();
			const estTime = z.next.setZone('America/New_York').toFormat('ccc, h:mma ZZZZ');
			const cstTime = z.next.setZone('America/Chicago').toFormat('ccc, h:mma ZZZZ');
			const pstTime = z.next.setZone('America/Los_Angeles').toFormat('ccc, h:mma ZZZZ');
			const mstTime = z.next.setZone('America/Denver').toFormat('ccc, h:mma ZZZZ');

			var content = "`Particle:` " + z.particle + "\n";
			content+= "`Type:` " + z.type + "\n";
			content+= "`Takeover Time:` " + z.next.toFormat('ccc, h:mma ZZZZ') + " `(" + pstTime + ' - ' + mstTime + ' - ' + cstTime + ' - ' + estTime + ")`\n";
			content+= "`Next:` " + next;
			msgEmbed.addField(z.zone, content);
		})	

		return message.channel.send(msgEmbed);
    },
};