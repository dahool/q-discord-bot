const Discord = require('discord.js');
const { safeLower } = require('../utils');
const fs = require('fs');
const path = require('path');
const db = require('../db/db');
const cs = require('../values')

function isPromise(value) {
	return Boolean(value && typeof value.then === 'function');
}

const commands = [];
const commandOptions = [];
for (const file of fs.readdirSync(path.resolve(__dirname, 'configs')).filter(file => file.endsWith('.js'))) {
	const command = require(`./configs/${file}`);
	commandOptions.push({name: command.name, description: command.description, type: command.type || 2, options: command.options})
	commands.push(command);
}

module.exports = {
	name: 'config',
    description: 'My Settings',
	dm: false,
	admin: true,
	slash: true,
	options: commandOptions,
    async execute(client, args) {
		
		const msgEmbed = new Discord.MessageEmbed()
			.setColor('#e1dad8')
			.setThumbnail(client.client.user.avatarURL())
			.setTitle('Settings of the Continuum')
			.setFooter(`!config | Requested by ${client.member.user.username}`, `${client.member.user.displayAvatarURL()}`)
			.setTimestamp();

		if (!Object.keys(args).length) {
			msgEmbed.setDescription('Change the settings for this server. Re run the commands with the required parameters');
			commands.forEach(c => {
				const aliases = c.aliases ? '/' + c.aliases.join('/') : ''
				msgEmbed.addField(c.description, '`' + `!${this.name} ${c.name}${aliases} ${c.usage}` + '`')
			})
			return client.reply(msgEmbed);
		} else {
			// la primera clave es el 'comando'
			const commandName = Object.keys(args)[0].toLowerCase();

			const command = commands.find(cmd => cmd.name == commandName || (cmd.aliases && cmd.aliases.includes(commandName)));

			if (!command) {
				return client.reply(`Sorry, unknown command \`${commandName}\``);
			}

			const configDb = new db.ConfigDb(client.connection);
			const response = await command.execute(configDb, client, args[commandName]);
			
			if (isPromise(response)) return response;

			if (response?.message) {
				msgEmbed.setDescription(response.message);
				if (response.fields) msgEmbed.addFields(response.fields);
				if (response.log && response.log === true) {
					configDb.findOne(client.guild.id, cs.LOG_CHANNEL).then(cfg => {
						if (cfg) client.sendTo(client.guild.channels.cache.get(cfg.channel), msgEmbed);
					});
				}
				return client.reply(msgEmbed);
			}

		}

    },
};