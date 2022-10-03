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
		name: 'role',
		description: 'Role to mention',
		type: ApplicationCommandOptionType.Role,
		required: false
	}
	],
	async interaction(client, id) {
		const uid = extractUid(id);
		if (id.startsWith('reminderyes')) {
			const data = reminderDataMap.getAndDelete(uid);
			await db.calendar.push(data.guild.id, uid, {"type": GENERAL_EVENTS, "start": data.startDate, "summary": data.title, "notified": false});
			return client.reply("Created `"+data.title+"`", true);
		}
		return client.reply('Ok, bye.', true);
	},
	async execute(client, args) {
		const eventData = sherlock.parse(args.event);
		const title = eventData.eventTitle;
		const startDate = eventData.startDate;
		
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
