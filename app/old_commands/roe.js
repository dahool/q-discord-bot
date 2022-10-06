const { statusKey } = require('../config.json');
const { randomId } = require('../utils')
const { db } = require('../db/db');
const { DateTime } = require('luxon');
const Discord = require('discord.js');
const { ApplicationCommandOptionType } = require('discord.js');

module.exports = {
	name: 'roe',
	description: 'Record a ROE event for alliance',
	dm: false,
	private: true,
    slash: true,
    options: [{
		name: 'tag',
		description: 'Alliance Tag',
		type: ApplicationCommandOptionType.String,
		required: true
	},{
		name: 'event',
		description: 'ROE Indicent',
		type: ApplicationCommandOptionType.String,
		required: true
	}],
	async execute(client, args) {
		const guild = client.guild.id;
		const tag = args.tag.toUpperCase();
		const reason = args.event;

		var allianceInfo = await db.alliance.findOne(guild, tag);
		var status = statusKey.NEUTRAL.name;

		if (allianceInfo !== undefined) {
			status = allianceInfo.status
		}

		const eventID = randomId("ROE")
		const event = {uuid: eventID, reason: reason, officer: client.member.user.id, time: DateTime.utc().toJSDate() };

		db.alliance.findOne(guild, tag).then(ob => {
			const newOb = Object.assign({roe: []}, ob, {status: status})
			newOb.roe.push(event);
			allianceDB.push(guild, tag, newOb);
		});

		const confirm = new Discord.EmbedBuilder()
			.setColor(`#${statusKey.NEUTRAL.color}`)
			.setTitle(`Added ROE event to alliance **${tag}**`)
			.setDescription(reason)
			.setThumbnail(statusKey.NEUTRAL.image)
			.setTimestamp()
			.setFooter({text: `!${this.name} • Executed by ${client.member.user.username}`, iconURL: client.member.user.displayAvatarURL() });
		
		client.reply(confirm);
	}
};
