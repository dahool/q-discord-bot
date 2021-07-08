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

	execute(client, message, args) {
		const guild = message.channel.guild.id;

		const alliance = args[0].toUpperCase().slice(0, 4);
		const reason = args.slice(1).join(" ");
		if (!reason) {
			return message.reply(`Please specify, identify an alliance and a reason \`!${this.cmd} <XXXX> <reason>\``);
		}
		const status = this.status.name;
		const eventID = "AL" + Math.random().toString(36).substring(2, 5) + Math.random().toString(36).substring(2, 5);
		const event = {uuid: eventID, reason: reason, status: status, officer: message.author.id, time: DateTime.utc().toJSDate() };

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
			.setFooter(`!${this.cmd} • Executed by ${message.author.username}`, `${message.author.displayAvatarURL()}`);

		if (this.status == statusKey.ENEMY) {
			confirm.addField('Reason', reason);
		}

		message.channel.send(confirm);

		this.config.findOne(guild, 'announce').then(cfg => {
			if (cfg) {
				const announcement = message.guild.channels.cache.get(cfg.channel);
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
    args: true,
	private: true,
    usage: '<TAG> <reason>',	
	async execute(client, message, args) {
		const as = new AllianceStatus(this.conn, statusKey.ALLIED, this.name);
		as.execute(client, message, args);
	}
};
