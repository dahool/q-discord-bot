const { ApplicationCommandOptionType, ButtonStyle, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const Discord = require("discord.js");

const { asTimeFormat, asChannel } = require('../utils');
const sherlock = require('sherlockjs');
const UIDGenerator = require('uid-generator');
const { db } = require('../db/db');
const { GENERAL_EVENTS } = require("../values");
const { DateTime } = require('luxon');

class DataMap extends Map{
    getAndDelete(key) {
		const value = super.get(key);
		super.delete(key);
		return value;
    }
}

const reminderDataMap = new DataMap();

extractUid = (value) => {
	return value.substring(value.indexOf("|")+1);
}

module.exports = {
	name: 'reminder',
	description: 'Create an event reminder',
	dm: false,
	private: true,
	options: [{
		name: 'event',
		description: 'Event description and time. For example `Officer meeting next Saturday at 8PM`',
		type: ApplicationCommandOptionType.String,
		required: true
	},{
		name: 'tz',
		description: 'Event TimeZone (sorry, discord doesn\'t provide me this info)',
		type: ApplicationCommandOptionType.String,
		required: true,
		choices: [
			{
				name: 'Pacific',
				value: 'US/Pacific'
			},
			{
				name: 'Mountain',
				value: 'US/Mountain'
			},
			{
				name: 'Central',
				value: 'US/Central'
			},
			{
				name: 'Eastern',
				value: 'US/Eastern'
			}			
		]		
	},{
		name: 'channel',
		description: 'Alternative channel to post the reminder (instead of the default)',
		type: ApplicationCommandOptionType.Channel,
		required: false
	}
	],
	async interaction(client, id) {
		const uid = extractUid(id);
		if (id.startsWith('reminderyes')) {
			await client.defer();
			const data = reminderDataMap.getAndDelete(uid);
			const saveData = {"type": GENERAL_EVENTS, "start": data.startDate.toJSDate(), "summary": data.title, "notified": false};
			if (data.channel) {
				saveData['channel'] = data.channel;
			}
			await db.calendar.push(data.guild.id, uid, saveData);
			return client.edit("Created event `"+data.title+"`", false);
		}
		return client.edit('Ok, bye.');
	},
	async execute(client, args) {
		const eventData = sherlock.parse(args.event);
		const title = eventData.eventTitle;

		// since all time are UTC and I have no idea what timezone the user is
		// I have to do this bs thingy to create an untouched time with correct timezone
		const startDate = DateTime.fromObject(
			{
				year: eventData.startDate.getFullYear(),
				month: eventData.startDate.getMonth()+1,
				day: eventData.startDate.getDate(),
				hour: eventData.startDate.getHours(),
				minute: eventData.startDate.getMinutes(),
			}
		).setZone(args.tz);
		 
		if (title == null || startDate == null) {
			return client.reply("Sorry, I don't understand, try to be more clear. Like  `Officer meeting next Saturday at 8PM`");
		}

		const uidgen = new UIDGenerator();
		const uid = uidgen.generateSync();

		reminderDataMap.set(uid, {'guild': client.guild, 'title': title, 'startDate': startDate, 'channel': args.channel});

		await client.defer();

		const generalConfig = await db.config.findOne(client.guild.id, GENERAL_EVENTS);

		var channel = args.channel;
		var writeable = true;
		if (channel) {
			writeable = await client.testChannel(client.guild.channels.cache.get(channel));
		} else if (generalConfig && generalConfig.channel) {
			channel = generalConfig.channel;
		}

		if (!writeable) {
			client.reply("Sorry, I can't write in " + asChannel(channel) + "!");
		}

		const row = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('reminderyes|' + uid)
						.setLabel('Yes')
						.setStyle(ButtonStyle.Success),
					new ButtonBuilder()
						.setCustomId('reminderno|' + uid)
						.setLabel('No')
						.setStyle(ButtonStyle.Secondary)
		);
		
		const msgEmbed = new Discord.EmbedBuilder()
			.setColor('#0099ff')
			.setThumbnail("https://www.dropbox.com/s/nrviw00vxo2xk3z/bell.png?raw=1")
			.setTitle("Create Reminder?")
			.addFields(
				{name: 'Title', value: title},
				{name: 'On', value: asTimeFormat(startDate)},
				{name: 'Post in', value: channel ? asChannel(channel) : 'YOU MUST CONFIGURE DEFAULT CHANNEL'}
			);

		return client.reply(msgEmbed, true, [row]);
	}
};
