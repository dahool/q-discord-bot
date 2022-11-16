const Discord = require('discord.js');
const { DateTime } = require('luxon');
const { safeLower, groupBy, asTimeFormat, asRole } = require('../utils');
const { db } = require('../db/db');
const cs = require('../values')

const { ApplicationCommandOptionType } = require('discord.js');

const { createURLwithParameters } = require('../utils');
const { find_by_name } = require('./zones');

async function create_event(client, zone, title, recurrent, mentions) {
	const eventID = "Z" + Math.random().toString(36).substring(2, 5) + Math.random().toString(36).substring(2, 5);
	const location = zone.zone;
	var time = zone.next;
	var times = [ time.toJSDate() ];	
	if (recurrent) {
		do {
			time = time.plus({days: 7});
			times.push(time.toJSDate());
		} while (times.length < 104) // 2 years events
	}

	var zoneevent = await db.zoneEvents.findOne(client.guild.id, location) || {events: []};
	zoneevent.events.push({id: eventID, title: title, last: times[times.length-1]})
	await db.zoneEvents.push(client.guild.id, location, zoneevent);

	const insertBulk = times.map((tm, index) => { return {guild: client.guild.id, type: cs.TERRITORY_CHANNEL, uid: eventID, recurrence: index, summary: title, location: location, start: tm, description: '', notified: false, mentions: mentions} } );
	return db.calendar.insert(insertBulk)
}

async function handle_create_event(client, zone, args) {
	
	const title = args.title;
	const recurrent = args.recurrent || false;
	const mentions = args.mention;

	if (!title) {
		return client.reply("Please, specify a `Title` for the event. Try again.")
	}

	await client.defer();

	await create_event(client, zone, title, recurrent, mentions ? mentions : []);

	const msgEmbed = new Discord.EmbedBuilder()
		.setColor('#0099ff')
		.setThumbnail("https://www.dropbox.com/s/nrviw00vxo2xk3z/bell.png?raw=1")
		.setTitle("Created Territory Reminder")
		.addFields(
			{name: 'Title', value: title},
			{name: 'Zone', value: zone.zone}
		);
	
	if (recurrent) {
		msgEmbed.addFields({name: 'Every', value: zone.next.toFormat("ccc 'at' h:mma ZZZZ")})
		msgEmbed.addFields({name: 'Starting on', value: asTimeFormat(zone.next)})
	} else {
		msgEmbed.addFields({name: 'On', value: asTimeFormat(zone.next)})
	}

	if (mentions) {
		msgEmbed.addFields({name: 'Ping', value: asRole(mentions)});
	}

	return client.reply(msgEmbed, false);
}

async function remove_event(client, ids) {
	const delId = ids[0]; // we support 1 only

	await client.defer();

	const ze = await db.zoneEvents.findOneBy({
		guild: client.guild.id,
		events: { $elemMatch: {id: delId } }
		//events: { $elemMatch: {id: { $in: ids }} }
	});

	if (ze) {
		const theEvent = ze.events.find(e => e.id == delId);
		const newEventList = ze.events.filter(e => e.id != delId);

		// filter out matching events
		await db.calendar.delete({guild: client.guild.id, type: cs.TERRITORY_CHANNEL, uid: delId});
		await db.zoneEvents.push(client.guild.id, ze.uuid, { events: newEventList });
		return client.reply(`Event \`${theEvent.title}\` deleted`);
	} else {
		return client.reply('Sorry, event not found.');
	}
}

async function handle_remove_event(client, zone) {

	const ze = await db.zoneEvents.findOneBy({
		guild: client.guild.id,
		uuid: zone.zone,
		events: { $elemMatch: {last: { $gte: DateTime.utc().toJSDate() }} }
	});

	if (ze && ze.events) {
		const options = ze.events.map((ev) => {
			return {
				label: ev.title,
				value: ev.id
			}
		});
		const row = new Discord.ActionRowBuilder()
			.addComponents(
				new Discord.SelectMenuBuilder()
					.setCustomId('remove-event')
					.setPlaceholder('Nothing selected')
					.addOptions(options)
				);
		return client.reply('Select the event you want to remove', true, [row]);
	} else {
		return client.reply("No events scheduled for " + zone.zone);
	}

}

async function list_all_events(client) {

	await client.defer();

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
	.setFooter({text: "* calendar events can't be removed by me"});

	groupBy(calevents, u => u.location).forEach((values, key) => {
		values.sort((a,b) => a.start - b.start);
		msgEmbed.addFields({name: key, value: values.map(ev => {
			const start = DateTime.fromJSDate(ev.start).setZone('UTC');
			const flag = ev.src == 'calendar' ? ':calendar_spiral:' : '';
			const ob = '`' + ev.summary + '` on ' + asTimeFormat(start) + ' ' + flag;
			return ob;
		}).join('\n')});
	})

	client.reply(msgEmbed, false);
}

async function list_events(client, zone) {
	
	await client.defer();

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
			.setDescription(asTimeFormat(zone.next));

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
			client.reply(msgEmbed, false);

		} else {
			client.reply("No events scheduled for " + zone.zone);
		}
	})

}

module.exports = {
	name: 'tc-event',
    description: 'Create Territory reminder',
	private: true,
	options: [
		{
			name: 'zone',
			description: 'Zone name (or * for all events)',
			type: ApplicationCommandOptionType.String,
			required: true
		},{
			name: 'command',
			description: 'Command',
			type: ApplicationCommandOptionType.String,
			required: true,
			choices: [
				{
					name: 'Create reminder',
					value: 'create'
				},
				{
					name: 'Remove reminder',
					value: 'remove'
				},
				{
					name: 'List reminders',
					value: 'list'
				}
			]
		},{
			name: 'title',
			description: 'Event Title (required for `Create reminder`)',
			type: ApplicationCommandOptionType.String,
			required: false
		},{
			name: 'recurrent',
			description: 'Create a recurrent reminder (required for `Create reminder`)',
			type: ApplicationCommandOptionType.Boolean,
			required: false
		},{
			name: 'mention',
			description: 'Ping role (optinal for `Create reminder`)',
			type: ApplicationCommandOptionType.Role,
			required: false
		}
	],
	dm: false,
	async interaction(client, id, values) {
		if ('remove-event' == id) {
			return remove_event(client, values);
		}
	},	
    async execute(client, args) {

		if (args.zone == '*') {
			if ('list' == args.command) {
				return list_all_events(client);
			}
			return client.reply("* is only supported with command `list`. Try again.")
		}

		const zones = find_by_name(safeLower(args.zone));
		if (zones.length > 1) {
			return client.reply(`Pardon mon capitaine, too many zones matching \`${args.zone}\`. Narrow your search.`);		
		} else if (zones.length == 0) {
			return client.reply(`No zones found matching \`${args.zone}\``);
		}
		if ('create' == args.command) {
			return handle_create_event(client, zones[0], args);
		} else if ('remove' == args.command) {
			return handle_remove_event(client, zones[0]);
		} else if ('list' == args.command) {
			return list_events(client, zones[0]);
		}
    },
};
