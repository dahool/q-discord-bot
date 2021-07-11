const Discord = require('discord.js');
const db = require('../db/db');
const cs = require('../values')
const ical = require('node-ical');
const { safeLower } = require('../utils');

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
			.setThumbnail(client.user.avatarURL())
			.setTitle('My Settings')
			.setTimestamp();
		
		if (!args.length) {
			msgEmbed
				.setDescription('Change the settings for this server. Re run the commands with the required arguments')
				.addFields(
					{ name: 'General Announcement Channel', value: '`!config <set/get> '+cs.ANNOUNCE_CHANNEL+' #channel_name `'},
					{ name: 'Territory Announcement Channel', value: '`!config <set/get> '+cs.TERRITORY_CHANNEL+' #channel_name`'},
					{ name: 'Logging Channel', value: '`!config <set/get> '+cs.LOG_CHANNEL+' #channel_name`'},
					{ name: 'Dailies Channel', value: '`!config <set/get> '+cs.DAILY_CHANNEL +' #channel_name`'},
					{ name: 'Set Territory Events Calendar', value: '`!config territory_events calendar_ical_url`'},
					{ name: 'Add/Remove privileged roles', value: '`!config (+/-)role <@rolename>`'},
					{ name: 'Add/Remove Territory/Events roles mention', value: '`!config (+/-)mention <@rolename>`'},
				)
		} else {
			const config = new db.ConfigDb(this.conn);
			const command = safeLower(args.shift());

			if (!command) {
				return message.reply(`Missing required arguments \`!${this.name} <command> <arguments>\``);
			}

			if (command == 'set' || command == 'get') {
				const key = safeLower(args.shift());

				if (cs.ANNOUNCE_CHANNEL == key
					|| cs.TERRITORY_CHANNEL == key
					|| cs.LOG_CHANNEL == key
					|| cs.DAILY_CHANNEL == key) {

					if (command == 'set') {
						const params = args.join(" ")
						const id = extract_id(CHANNEL_ID, params);
						if (id == null) {
							return message.reply(`Invalid argument \`${params}\`. Specify a valid channel.`);
						}
						config.push(guild, key, {'channel': id});
		
						msgEmbed
							.setDescription(`Updated ${key} channel`)
							.addFields(
								{ name: 'Channel', value : '<#' + id + '>'}
							)
					} else {
						const value = await config.findOne(guild, key, 'channel');
						if (value) {
							msgEmbed
							.setDescription(`${key} channel`)
							.addFields(
								{ name: 'Channel', value : '<#' + value + '>'}
							)
						} else {
							return message.reply(`No config defined for ${key}`);
						}
					}

				} else {
					if (!key) {
						return message.reply(`Missing required argument`);	
					}
					return message.reply(`Sorry, don't know what to do with \`${key}\``);
				}
				
			} else {
				const params = args.join(" ")
				if ("+role" == command || "-role" == command) {
					const id = extract_id(ROLE_ID, params);
					if (id == null) {
						return message.reply(`Invalid argument \`${params}\`. Specify a valid role.`);
					}
	
					const configRole = Object.assign({roles: []}, await config.findOne(guild, "roles"))
					
					if ("+role" == command) {
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

				} else if ("+mention" == command || "-mention" == command) {
					const id = extract_id(ROLE_ID, params);
					if (id == null) {
						return message.reply(`Invalid argument \`${params}\`. Specify a valid role.`);
					}
	
					const configRole = Object.assign({mention: []}, await config.findOne(guild, cs.TERRITORY_CHANNEL))
					
					if ("+mention" == command) {
						// prevent duplicates
						configRole.mention = configRole.mention.filter(r => r != id)
						configRole.mention.push(id);
						msgEmbed.setDescription(`Added ` + params)
					} else {
						configRole.mention = configRole.mention.filter(r => r != id)
						msgEmbed.setDescription(`Removed ` + params)
					}
	
					config.push(guild, cs.TERRITORY_CHANNEL, configRole);

				} else if ("role" == command) {
					const configRole = Object.assign({roles: []}, await config.findOne(guild, "roles"))
					const roles = configRole.roles.map(rid => '<@&' + rid + '>');
	
					if (roles.length) {
						msgEmbed
						.setDescription(`List of privileged roles`)
						.addFields(
							{ name: 'Roles', value : roles.join(" ")}
						)
					} else {
						msgEmbed
						.setDescription(`No roles defined`)
					}
	
					log = false;
				} else if ("mention" == command) {
					const configRole = Object.assign({mention: []}, await config.findOne(guild, cs.TERRITORY_CHANNEL))
					const roles = configRole.mention.map(rid => '<@&' + rid + '>');
	
					if (roles.length) {
						msgEmbed
						.addFields(
							{ name: 'Roles', value : roles.join(" ")}
						)
					} else {
						msgEmbed
						.setDescription(`No roles defined`)
					}
	
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