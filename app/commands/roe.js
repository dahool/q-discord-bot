const { statusKey } = require('../config.json');
const { randomId } = require('../utils')
const db = require('../db/db');
const { DateTime } = require('luxon');
const Discord = require('discord.js');

module.exports = {
	name: 'roe',
	description: 'Record a ROE event for alliance',
	dm: false,
	private: true,
    slash: true,
    options: [{
		name: 'tag',
		description: 'Alliance Tag',
		type: 3,
		required: true
	},{
		name: 'event',
		description: 'Event',
		type: 3,
		required: true
	}],
	async execute(client, args) {
		const allianceDB = new db.AllianceDb(client.connection);

		const guild = client.guild.id;
		const tag = args.tag.toUpperCase();
		const reason = args.event;

		var allianceInfo = await allianceDB.findOne(guild, tag);
		var status = statusKey.NEUTRAL;

		if (allianceInfo !== undefined) {
			status = allianceInfo.status
		}

		const eventID = randomId("ROE")
		const event = {uuid: eventID, reason: reason, status: status, officer: client.member.user.id, time: DateTime.utc().toJSDate(), type: 'ROE' };

		allianceDB.findOne(guild, tag).then(ob => {
			const newOb = Object.assign({events: []}, ob, {status: status})
			newOb.events.push(event);
			allianceDB.push(guild, tag, newOb);
		});

		const confirm = new Discord.MessageEmbed()
			.setColor(`#${statusKey.NEUTRAL.color}`)
			.setTitle(`Added ROE event to alliance **${tag}**`)
			.setDescription(reason)
			.setThumbnail(statusKey.NEUTRAL.image)
			/*.addFields(
				{ name: 'Event', value: reason, inline: true },
			)*/
			.setTimestamp()
			.setFooter(`!${this.name} • Executed by ${client.member.user.username}`, `${client.member.user.displayAvatarURL()}`);
		
		client.reply(confirm);
	}
};
