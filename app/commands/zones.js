const Discord = require('discord.js');
const { DateTime } = require('luxon');
const { safeLower, groupBy, asTimeRelative, asTimeFormat } = require('../utils');
const { db } = require('../db/db');
const cs = require('../values')

const { ApplicationCommandOptionType } = require('discord.js');

const zones = require('./zones.json');
const rss = require('./rss.json');

const { extract_role, createURLwithParameters } = require('../utils');

const INTERACTION_TIMEOUT = 60000;

const rssMap = new Map();
rss.forEach(item => {
	rssMap.set(item.id, item.icon)
})

const POSITIVE = ['yes', 'si', 'sure', 'claro', 'yup','make it so','y']
const NEGATIVE = ['no','n']

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

async function add_event(guild, time, title, location, recurrent, mentions) {
	const eventID = "Z" + Math.random().toString(36).substring(2, 5) + Math.random().toString(36).substring(2, 5);
	var times = [time.toJSDate()];	
	if (recurrent) {
		do {
			time = time.plus({days: 7});
			times.push(time.toJSDate());
		} while (times.length < 24)
	}
	
	times.forEach((tm, index) => {
		db.calendar.insert([{guild: guild, type: cs.TERRITORY_CHANNEL, uid: eventID, recurrence: index, summary: title, location: location, start: tm, description: '', notified: false, mentions: mentions}]);
	})

	var zoneevent = await db.zoneEvents.findOne(guild, location) || {events: []};
	zoneevent.events.push({id: eventID, title: title, last: times[times.length-1]})

	return db.zoneEvents.push(guild, location, zoneevent);
}

async function create_event(client, zone, title, recurrent, mentions) {
	var content;
	if (recurrent) {
		content = "Created a recurrent reminder `" + title + "` for zone `" + zone.zone + "` every `" + zone.next.toFormat("ccc 'at' h:mma ZZZZ") + "`";
	} else {
		content = "Created a one time reminder `" + title + "` for zone `" + zone.zone + "` on " + asTimeFormat(zone.next);
	}
	return add_event(client.guild.id, zone.next, title, zone.zone, recurrent, mentions).then(() => {
		client.edit(content, true);
	});
}

async function handle_tag(client, zone) {
	
	client.reply(`Ok mon capitaine, I'm creating a reminder for ${zone.zone}. What's the title?`)

	var title;
	var recurrent;
	var mentions;

	const messages = [];

	const filter = m => m.author.id == client.member.user.id;
	const collector = client.channel.createMessageCollector({ filter, time: INTERACTION_TIMEOUT } );
	
	collector.on('collect', m => {
		messages.push(m);
		if ('cancel' == m.content.toLowerCase()) {
			client.edit("Cancelled.", true)
			collector.stop();
		} else if (title == undefined) {
			title = m.content;
			m.reply("What roles should I ping? Type `no` for none").then(m => messages.push(m));
		} else if (mentions == undefined || mentions.length == 0) {
			if (NEGATIVE.some(v => v == m.content.toLowerCase())) {
				mentions = false;
			} else {
				mentions = m.content.split(' ').map(v => extract_role(v)).filter(v => v != null);
			}
			if (mentions === false || mentions.length > 0) {
				m.reply("Do you want to schedule a recurrent event?").then(m => messages.push(m));
			} else {
				m.reply("You did not enter any valid role. Try again").then(m => messages.push(m));
			}
		} else if (recurrent == undefined) {
			if (POSITIVE.some(v => v == m.content.toLowerCase())) {
				recurrent = true;
				collector.stop('done');
			} else if (NEGATIVE.some(v => v == m.content.toLowerCase())) {
				recurrent = false;
				collector.stop('done');
			} else {
				m.reply("Sorry, I don't understand, try again. Do you want a recurrent reminder? `(y/n)`").then(m => messages.push(m));
			}
		}
	})
	collector.on('end', (collected, reason) => {
		client.channel.bulkDelete(messages).then(() => {
			if (reason == 'done') {
				return create_event(client, zone, title, recurrent, mentions ? mentions : []);
			} else if (reason != 'user') {
				return client.edit("Sorry, I'm done waiting. Start again", true);
			}
		});
	})

}

async function handle_deltag(client, zone) {

	const ze = await db.zoneEvents.findOneBy({
		guild: client.guild.id,
		uuid: zone.zone,
		events: { $elemMatch: {last: { $gte: DateTime.utc().toJSDate() }} }
	});

	if (ze && ze.events) {
		client.reply("Enter the ID of the event you want to delete (or type cancel):\n>>> " + ze.events.map((ev, index) => 'ID: `' + index + '`     Title: `' + ev.title + '`').join('\n'));
		
		const messages = [];
		const filter = m => m.author.id == client.member.user.id;
		const collector = client.channel.createMessageCollector({ filter, time: INTERACTION_TIMEOUT});
		collector.on('collect', m => {
			messages.push(m);
			if ('cancel' == m.content.toLowerCase()) {
				client.edit("Cancelled.", true)
				collector.stop('done');
			} else {
				const ev = ze.events[m.content];
				if (!ev) {
					m.reply("Sorry, can't find event `" + m.content + "`. Try again.").then(m => messages.push(m) );
				} else {
					ze.events = ze.events.filter(e => ev.id != e.id);
					db.calendar.delete({guild: client.guild.id, type: cs.TERRITORY_CHANNEL, uid: ev.id});
					db.zoneEvents.push(client.guild.id, zone.zone, ze);
					client.edit(`Event \`${ev.title}\` deleted`, true);
					collector.stop('done');
				}
			}
		})
		collector.on('end', (collected, reason) => {
			client.channel.bulkDelete(messages).then(() => {
				if (reason != 'done') {
					return client.edit("Sorry, I'm done waiting. Good bye.", true);
				}
			});
		})

	} else {
		client.reply("No events scheduled for " + zone.zone);
	}

}

async function list_all_events(client) {
	const fromDate = DateTime.utc().toJSDate();
	const toDate = DateTime.utc().plus({days: 7}).toJSDate();

	const calevents = await db.calendar.findBy({
		guild: client.guild.id,
		type: cs.TERRITORY_CHANNEL,
		notified: false,
		start: { $gte: fromDate, $lte: toDate }
	});

	calevents.sort((a,b) => a.start - b.start);
	
	const guildData = await db.bot.fetchGuild(client.guild.id);

	let params = {
		'TOKEN': encodeURIComponent(guildData.token),
		'ID': encodeURIComponent(client.guild.id)
	}

	const url = createURLwithParameters(process.env.CALENDAR_URL, params);

	const msgEmbed = new Discord.EmbedBuilder()
	.setColor('#e1dad8')
	.setThumbnail(client.guild ? client.guild.iconURL() : client.client.user.avatarURL())
	.setURL(url + '&nocache')
	.setTitle("Territory Events in next 7 days")
	.setFooter({text: "* calendar events can't be removed by me"})
	.setTimestamp();

	groupBy(calevents, u => u.location).forEach((values, key) => {
		values.sort((a,b) => a.start - b.start);
		msgEmbed.addFields({name: key, value: values.map(ev => {
			const start = DateTime.fromJSDate(ev.start).setZone('UTC');
			const flag = ev.src == 'calendar' ? ':calendar_spiral:' : '';
			const ob = '`' + ev.summary + '` on ' + asTimeFormat(start) + ' ' + flag;
			return ob;
		}).join('\n')});
	})

	client.reply(msgEmbed);

}

async function list_events(client, zone) {
	const zevents = db.zoneEvents.findOneBy({
		guild: client.guild.id,
		uuid: zone.zone,
		events: { $elemMatch: {last: { $gte: DateTime.utc().toJSDate() }} }
	});

	const calevents = await db.calendar.findBy({
		guild: client.guild.id,
		location: zone.zone,
		type: cs.TERRITORY_CHANNEL,
		src: 'calendar',
		notified: false,
		start: { $gte: DateTime.utc().toJSDate() }
	});
	
	zevents.then(ze => {
		if ((ze && ze.events.length) || calevents.length) {

			const msgEmbed = new Discord.EmbedBuilder()
			.setColor('#e1dad8')
			.setThumbnail(client.guild ? client.guild.iconURL() : client.client.user.avatarURL())
			.setTitle("Events for " + zone.zone)
			.setDescription(asTimeFormat(zone.next))
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
				msgEmbed.addFields([{name: 'Calendar Events', value: caevents.join('\n')}])
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
			type: ApplicationCommandOptionType.String,
			required: true
		},{
		name: 'command',
		description: 'Command',
		type: ApplicationCommandOptionType.String,
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
				return client.reply("Pardon mon capitaine, you don't have enough permissions to request that.");	
			}

			zones = find_by_name(argument);

			if (zones.length > 1) {
				return client.reply(`Pardon mon capitaine, too many zones matching \`${argument}\`. Narrow your search.`);		
			} else if (zones.length == 0) {
				return client.reply(`No zones found matching \`${argument}\``);
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
			return client.reply(`No zones found matching \`${argument}\``);
		}

		const icon = client.guild ? client.guild.iconURL() : client.client.user.avatarURL();

		const msgEmbed = new Discord.EmbedBuilder()
			.setColor('#e1dad8')
			.setThumbnail(icon)
			.setTitle("Territory")
			//.setDescription("Takeover times are in UTC. Other timezones shown for information only.")
			.setTimestamp();

		const today = DateTime.utc();
		zones.sort((a,b) => a.next - b.next).forEach(z => {
			var content = "`Particle:` <" + rssMap.get(z.particle) + "> " + z.particle + "\n";
			content+= "`Type:` " + z.type + "\n";
			content+= "`Resources:` " + z.rss.map(i => '<' + rssMap.get(i) + '>').join(' ') + "\n";
			content+= "`Connected:` *" + z.paths.join(', ') + "*\n";
            content+= "`Takeover Time:` " + asTimeFormat(z.next) + "\n"; 
			content+= "`Next:` **" + asTimeRelative(z.next) + "**";
			
			msgEmbed.addFields({name: z.zone, value: content});
		})	

		return client.reply(msgEmbed);
    },
};
