const { ApplicationCommandOptionType, ButtonStyle, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const Discord = require("discord.js");

const { asTimeFormat } = require('../utils');
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
	slash: true,
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
	}/*,{
		name: 'role',
		description: 'Role to mention',
		type: ApplicationCommandOptionType.Role,
		required: false
	}*/
	],
	async interaction(client, id) {
		const uid = extractUid(id);
		if (id.startsWith('reminderyes')) {
			const data = reminderDataMap.getAndDelete(uid);
			await db.calendar.push(data.guild.id, uid, {"type": GENERAL_EVENTS, "start": data.startDate.toJSDate(), "summary": data.title, "notified": false});
			return client.reply("Created `"+data.title+"`", true);
		}
		return client.reply('Ok, bye.', true);
	},
	async execute(client, args) {
		const eventData = sherlock.parse(args.event);
		const title = eventData.eventTitle;

		// since all time are UTC and I have no idea what timezone the user is
		// I have to do this bs thingy to create an untouched time with correct timezone
		const startDate = DateTime.fromObject(
			{
				year: eventData.startDate.getFullYear(),
				month: eventData.startDate.getMonth(),
				day: eventData.startDate.getDate(),
				hour: eventData.startDate.getHours(),
				minute: eventData.startDate.getMinutes(),
			}
		).setZone(args.tz);
		 
		if (title == null || startDate == null) {
			return client.reply("Sorry, I don't understand, try to be more clear. Like  `Officer meeting next Saturday at 8PM`", true);
		}

		const uidgen = new UIDGenerator();
		const uid = uidgen.generateSync();

		reminderDataMap.set(uid, {'guild': client.guild, 'title': title, 'startDate': startDate});

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
				{name: 'On', value: asTimeFormat(startDate)}
			);

		return client.reply(msgEmbed, true, [row]);
	}
};
