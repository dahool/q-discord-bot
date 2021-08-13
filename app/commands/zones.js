const Discord = require('discord.js');
const { DateTime } = require('luxon');
const { safeLower, groupBy, toRelative } = require('../utils');
const db = require('../db/db');
const cs = require('../values')

const zones = require('./zones.json');
const rss = require('./rss.json');
const { get } = require('node:https');

const rssMap = new Map();
rss.forEach(item => {
	rssMap.set(item.id, item.icon)
})

const POSITIVE = ['yes', 'si', 'sure', 'claro', 'yup','make it so','y']
const NEGATIVE = ['no','n']

function get_link(title, time) {
	return 'https://www.timeanddate.com/worldclock/fixedtime.html?msg=' + encodeURIComponent(title) + '&p1=1440&iso=' + time.set({second: 0}).toISO();	
}

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
			time = time.plus({days: 7});
			times.push(time.toJSDate());
		} while (times.length < 24)
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

async function create_event(client, zone, title, recurrent) {
	var content;
	if (recurrent) {
		content = "Created a recurrent reminder `" + title + "` for zone `" + zone.zone + "` every `" + zone.next.toFormat("ccc 'at' h:mma ZZZZ") + "`";
	} else {
		content = "Created a one time reminder `" + title + "` for zone `" + zone.zone + "` on `" + zone.next.toFormat("LLL d 'at' h:mma ZZZZ") + "`";
	}
	return add_event(client.connection, client.guild.id, zone.next, title, zone.zone, recurrent).then(() => {
		client.edit(content, true);
	});
}

async function handle_tag(client, zone) {
	
	client.reply(`Ok, I'm creating a reminder for ${zone.zone}. What's the title?`)

	var title;
	var recurrent;

	const messages = [];

	const filter = m => m.author.id == client.member.user.id;
	const collector = client.channel.createMessageCollector({ filter, time: 30000 } );
	
	collector.on('collect', m => {
		messages.push(m);
		if ('cancel' == m.content.toLowerCase()) {
			client.edit("Cancelled.", true)
			title = "cancel"; // to prevent end message
			collector.stop();
		} else if (title == undefined) {
			title = m.content;
			m.reply("Do you want to schedule a recurrent event?").then(m => messages.push(m) );
		} else if (recurrent == undefined) {
			if (POSITIVE.some(v => v == m.content.toLowerCase())) {
				recurrent = true;
				collector.stop();
				return create_event(client, zone, title, true);
			} else if (NEGATIVE.some(v => v == m.content.toLowerCase())) {
				recurrent = false;
				collector.stop();
				return create_event(client, zone, title, false);
			} else {
				m.reply("Sorry, I don't understand, try again. Do you want a recurrent reminder?").then(m => messages.push(m));;
			}
		}
	})
	collector.on('end', m => {
		messages.forEach(m => {if (m) m.delete() });
		if (title != 'cancel' && recurrent == undefined) {
			return client.edit("Sorry, I'm done waiting. Start again", true);
		}
	})

}

async function handle_deltag(client, zone) {
	const zevent = new db.ZoneEventsDb(client.connection);
	const calendar = new db.CalendarDb(client.connection);

	const ze = await zevent.findOneBy({
		guild: client.guild.id,
		uuid: zone.zone,
		events: { $elemMatch: {last: { $gte: DateTime.utc().toJSDate() }} }
	});

	if (ze && ze.events) {
		var handled = false;
		client.reply("Enter the ID of the event you want to delete (or type cancel):\n>>> " + ze.events.map((ev, index) => 'ID: `' + index + '`     Title: `' + ev.title + '`').join('\n'));

		const messages = [];

		const filter = m => m.author.id == client.member.user.id;
		const collector = client.channel.createMessageCollector({ filter, time: 30000});
		collector.on('collect', m => {
			messages.push(m);
			if ('cancel' == m.content.toLowerCase()) {
				client.edit("Cancelled.", true)
				handled = true;
				collector.stop();
			} else {
				const ev = ze.events[m.content];
				if (!ev) {
					m.reply("Sorry, can't find event `" + m.content + "`. Try again.").then(m => messages.push(m) );
				} else {
					handled = true;
					ze.events = ze.events.filter(e => ev.id != e.id);
					calendar.delete({guild: client.guild.id, type: cs.TERRITORY_CHANNEL, uid: ev.id});
					zevent.push(client.guild.id, zone.zone, ze);
					client.edit(`Event \`${ev.title}\` deleted`, true);
					collector.stop();
				}
			}
		})
		collector.on('end', m => {
			messages.forEach(m => {if (m) m.delete() });
			if (!handled) {
				return client.edit("Sorry, I'm done waiting. Good bye.", true);
			}
		})

	} else {
		client.reply("No events scheduled for " + zone.zone);
	}

}

async function list_all_events(client) {
	const calendar = new db.CalendarDb(client.connection);

	const fromDate = DateTime.utc().toJSDate();
	const toDate = DateTime.utc().plus({days: 7}).toJSDate();

	const calevents = await calendar.findBy({
		guild: client.guild.id,
		type: cs.TERRITORY_CHANNEL,
		notified: false,
		start: { $gte: fromDate, $lte: toDate }
	});

	calevents.sort((a,b) => a.start - b.start);
	
	const msgEmbed = new Discord.MessageEmbed()
	.setColor('#e1dad8')
	.setThumbnail(client.guild ? client.guild.iconURL() : client.client.user.avatarURL())
	.setTitle("Territory Events in next 7 days")
	.setFooter("* calendar events can't be removed by me")
	.setTimestamp();

	groupBy(calevents, u => u.location).forEach((values, key) => {
		values.sort((a,b) => a.start - b.start);
		msgEmbed.addField(key, values.map(ev => {
			const start = DateTime.fromJSDate(ev.start).setZone('UTC');
			const flag = ev.src == 'calendar' ? ':calendar_spiral:' : '';
			const ob = '`' + ev.summary + '` on [`' + start.toFormat("LLL d 'at' h:mma ZZZZ") +'`](' + get_link(ev.summary, start) + ')' + flag;
			return ob;
		}).join('\n'))
	})

	client.reply(msgEmbed);

}

async function list_events(client, zone) {
	const zevent = new db.ZoneEventsDb(client.connection);
	const calendar = new db.CalendarDb(client.connection);

	const zevents = zevent.findOneBy({
		guild: client.guild.id,
		uuid: zone.zone,
		events: { $elemMatch: {last: { $gte: DateTime.utc().toJSDate() }} }
	});

	const calevents = await calendar.findBy({
		guild: client.guild.id,
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
			.setThumbnail(client.guild ? client.guild.iconURL() : client.client.user.avatarURL())
			.setTitle("Events for " + zone.zone)
			.setDescription(zone.next.toFormat("ccc 'at' h:mma ZZZZ"))
			.setTimestamp();

			if (ze && ze.events.length) {
				msgEmbed.addFields({
					name: 'Scheduled Events', value: ze.events.map(ev => '`' + ev.title + '`').join('\n')
				})
			}

			var caevents = [];
			groupBy(calevents, u => u.uid).forEach(values => {
				caevents.push(values[0].summary);
			})
			if (caevents.length > 0) {
				msgEmbed.addField('Calendar Events', caevents.join('\n'))
			}
			client.reply(msgEmbed);

		} else {
			client.reply("No events scheduled for " + zone.zone);
		}
	})

}

module.exports = {
	name: 'zone',
	aliases: ['territory','zones'],
    description: 'Show territory details',
	slash: true,
	options: [{
			name: 'argument',
			description: 'Zone or particle name',
			type: 3,
			required: true
		},{
		name: 'command',
		description: 'Command',
		type: 3,
		required: false,
		choices: [
			{
				name: 'Create event',
				value: 'tag'
			},
			{
				name: 'Remove event',
				value: '-tag'
			},
			{
				name: 'List events',
				value: 'events'
			}
		]
	}],
	singleOptions: [{
		name: 'argument',
		description: 'Zone or particle name',
		required: true,
	},{
		name: 'command',
		required: false
	}],
	dm: false,
    async execute(client, args) {
		const cmd = safeLower(args.command);
		const argument = safeLower(args.argument);
		let zones = [];

		if (['tag','-tag','events'].includes(cmd)) {

			if (!client.isManager) {
				return client.reply("Sorry, you don't have enough permissions to execute this command.");	
			}

			zones = find_by_name(argument);

			if (zones.length > 1) {
				return client.reply('Sorry, too many zones matching ' + argument + '. Narrow your search.');		
			}

			if ('tag' == cmd) {
				return handle_tag(client, zones[0]);
			} else if ('-tag' == cmd) {
				return handle_deltag(client, zones[0]);
			} else if ('events' == cmd) {
				return list_events(client, zones[0]);
			}

		} else {
			if ('events' == argument) {
				return list_all_events(client);
			}

			zones = find_by_name(argument);
			if (!zones.length) {
				zones = list_by_particle(argument);
			}
		}

		if (!zones.length) {
			return client.reply(`No zones found matching ${argument}`);
		}

		const icon = client.guild ? client.guild.iconURL() : client.client.user.avatarURL();

		const msgEmbed = new Discord.MessageEmbed()
			.setColor('#e1dad8')
			.setThumbnail(icon)
			.setTitle("Territory")
			.setDescription("Takeover times are in UTC. Other timezones shown for information only.")
			.setTimestamp();

		const today = DateTime.utc();
		zones.sort((a,b) => a.next - b.next).forEach(z => {
			const estTime = z.next.setZone('America/New_York').toFormat('ccc, h:mma ZZZZ');
			const cstTime = z.next.setZone('America/Chicago').toFormat('ccc, h:mma ZZZZ');
			const pstTime = z.next.setZone('America/Los_Angeles').toFormat('ccc, h:mma ZZZZ');
			const mstTime = z.next.setZone('America/Denver').toFormat('ccc, h:mma ZZZZ');

			var content = "`Particle:` " + z.particle + "\n";
			content+= "`Type:` " + z.type + "\n";
			content+= "`Resources:` " + z.rss.map(i => client.client.emojis.cache.get(rssMap.get(i))).join(' ') + "\n";
			content+= "`Connected:` *" + z.paths.join(', ') + "*\n";
			content+= "`Takeover Time:` [" + z.next.toFormat('ccc, h:mma ZZZZ') + "]("+ get_link(z.zone, z.next) + ") `(" + pstTime + ' - ' + mstTime + ' - ' + cstTime + ' - ' + estTime + ")`\n";
			content+= "`Next:` **" + toRelative(z.next) + "**";
			
			msgEmbed.addField(z.zone, content);
		})	

		return client.reply(msgEmbed);
    },
};