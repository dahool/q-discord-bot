const Discord = require('discord.js');
const db = require('../db/db');
const cs = require('../values')
const ical = require('node-ical');

const CHANNEL_ID = /<#(\d+)+>/;
const ROLE_ID = /<@&(\d+)+>/;

function extract_id(regex, str) {
	const m = regex.exec(str);
	if (m) {
		return m[++m.index];
	}
	return null;
}

module.exports = {
	name: 'config',
    description: 'My Settings',
	dm: false,
    permission: ['ADMINISTRATOR','MANAGE_GUILD','MANAGE_ROLES'],
    async execute(client, message, args) {
		const guild = message.channel.guild.id;
		var log = true;
		const msgEmbed = new Discord.MessageEmbed()
			.setColor('#e1dad8')
			.setThumbnail('https://www.dropbox.com/s/vu1eosf1vi6kgwn/HAL9000.png?raw=1')
			.setTitle('My Settings')
			.setTimestamp();
		
		if (!args.length) {
			msgEmbed
				.setDescription('Change the settings for this server. Re run the commands with the required arguments')
				.addFields(
					{ name: 'General Announcement Channel', value: '`!config '+cs.ANNOUNCE_CHANNEL+' #channel_name `'},
					{ name: 'Territory Announcement Channel', value: '`!config '+cs.TERRITORY_CHANNEL+' #channel_name`'},
					{ name: 'Logging Channel', value: '`!config '+cs.LOG_CHANNEL+' #channel_name`'},
					{ name: 'Add privileged role', value: '`!config addrole @rolename`'},
					{ name: 'Removed privileged role', value: '`!config delrole @rolename`'},
					{ name: 'List privileged roles', value: '`!config roles`'},
					{ name: 'Territory Events Calendar', value: '`!config territory_events calendar_ical_url`'},
				)
		} else {
			const config = new db.ConfigDb(this.conn);
			const command = args[0].toLowerCase();
			const params = args.slice(1).join(" ")
			if (!command) {
				return message.reply(`Missing required arguments \`!${this.name} <command> <argument>\``);
			}

			if (cs.ANNOUNCE_CHANNEL == command
				|| cs.TERRITORY_CHANNEL == command
				|| cs.LOG_CHANNEL == command
				|| cs.DAILY_CHANNEL == command) {
				const id = extract_id(CHANNEL_ID, params);
				if (id == null) {
					return message.reply(`Invalid argument \`${params}\`. Specify a valid channel.`);
				}
				config.push(guild, command, {'channel': id});

				msgEmbed
					.setDescription(`Updated ${command} channel`)
					.addFields(
						{ name: 'Channel', value : '<#' + id + '>'}
					)

			} else if ("addrole" == command || "delrole" == command) {
				const id = extract_id(ROLE_ID, params);
				if (id == null) {
					return message.reply(`Invalid argument \`${params}\`. Specify a valid role.`);
				}

				const configRole = Object.assign({roles: []}, await config.findOne(guild, "roles"))
				
				if ("addrole" == command) {
					// prevent duplicates
					configRole.roles = configRole.roles.filter(r => r != id)
					configRole.roles.push(id);
					msgEmbed.setDescription(`Added privileged role`)
				} else {
					configRole.roles = configRole.roles.filter(r => r != id)
					msgEmbed.setDescription(`Removed privileged role`)
				}

				config.push(guild, "roles", configRole);

				msgEmbed
					.addFields(
						{ name: 'Role', value : '<@&' + id + '>'}
					)
			} else if ("roles" == command) {
				const configRole = Object.assign({roles: []}, await config.findOne(guild, "roles"))
				const roles = configRole.roles.map(rid => '<@&' + rid + '>');

				msgEmbed
					.setDescription(`List of privileged roles`)
					.addFields(
						{ name: 'Roles', value : roles.join(" ")}
					)

				log = false;
			} else if ("territory_events" == command) {

				try {
					await ical.async.fromURL(params);
				} catch (error) {
					console.error(error);
					return message.reply(`Sorry, I'm unable to validate URL \`${params}\``);
				}
				
				config.push(guild, "territory_events", {'url': params});

				msgEmbed
					.setDescription(`Updated Territory Events Calendar`)
					.addFields(
						{ name: 'URL', value : '`'+params+'`'}
					)

			} else {
				return message.reply(`Unkown command \`${command}\``);
			}
			
			msgEmbed
				.setFooter(`!config | Requested by ${message.author.username}`, `${message.author.displayAvatarURL()}`);

			if (log) {
				config.findOne(guild, cs.LOG_CHANNEL).then(cfg => {
					if (cfg) message.guild.channels.cache.get(cfg.channel).send(msgEmbed);
				});
			}
		
		}
		
		return message.channel.send(msgEmbed);
    },
};