const Discord = require('discord.js');
const { DateTime } = require('luxon');
const { statusKey } = require('../config.json');
const db = require('../db/db');

class AllianceStatus {

	constructor(connection, status, cmd) {
		this.allianceDB = new db.AllianceDb(connection);
		this.config = new db.ConfigDb(connection);
		this.status = status;
		this.cmd = cmd;
	}

	execute(client, args) {
		const guild = client.guild.id;

		const alliance = args.tag.toUpperCase().slice(0, 4);
		const reason = args.reason;

		if (!reason && (this.status == statusKey.ENEMY || this.status == statusKey.HOSTILE) ) {
			return client.reply(`Please specify, missing <reason>`);
		}

		const status = this.status.name;
		const eventID = "AL" + Math.random().toString(36).substring(2, 5) + Math.random().toString(36).substring(2, 5);
		const event = {uuid: eventID, reason: reason, status: status, officer: client.member.user.id, time: DateTime.utc().toJSDate() };

		this.allianceDB.findOne(guild, alliance).then(ob => {
			const newOb = Object.assign({events: []}, ob, {status: status})
			newOb.events.push(event);
			this.allianceDB.push(guild, alliance, newOb);
		});

		const confirm = new Discord.MessageEmbed()
			.setColor(`#${this.status.color}`)
			.setTitle(`Alliance **${alliance}** set to ***${this.status.name}*** status`)
			.setDescription(`The status of **${alliance}** alliance has been updated`)
			.setThumbnail(this.status.image)
			.addFields(
				{ name: `Alliance`, value: `${alliance}`, inline: true },
				{ name: `Status`, value: `${status}`, inline: true },
			)
			.setTimestamp()
			.setFooter(`!${this.cmd} • Executed by ${client.member.user.username}`, `${client.member.user.displayAvatarURL()}`);

		if (this.status == statusKey.ENEMY || this.status == statusKey.HOSTILE) {
			confirm.addField('Reason', reason);
		}

		client.sendMessage(confirm);

		this.config.findOne(guild, 'announce').then(cfg => {
			if (cfg) {
				const announcement = client.guild.channels.cache.get(cfg.channel);
				if (announcement) announcement.send(confirm);
			}
		})

	}

}


module.exports = {
	AllianceStatus,
	name: 'allied',
	description: 'Set an alliance to "allied"',
	dm: false,
	private: true,
    slash: true,
    options: [{
		name: 'tag',
		description: 'Alliance Tag',
		type: 3,
		required: true
	}],
	async execute(client, args) {
		const as = new AllianceStatus(client.connection, statusKey.ALLIED, this.name);
		as.execute(client, args);
	}
};
