const Discord = require('discord.js');
const { safeLower } = require('../utils');
const fs = require('fs');
const path = require('path');
const db = require('../db/db');
const cs = require('../values')

function isPromise(value) {
	return Boolean(value && typeof value.then === 'function');
}

module.exports = {
	name: 'config',
    description: 'My Settings',
	dm: false,
    permission: ['ADMINISTRATOR','MANAGE_GUILD','MANAGE_ROLES'],
    async execute(client, message, args) {
		
		const commands = [];
		for (const file of fs.readdirSync(path.resolve(__dirname, 'configs')).filter(file => file.endsWith('.js'))) {
			const command = require(`./configs/${file}`);
			commands.push(command);
		}
		
		const msgEmbed = new Discord.MessageEmbed()
			.setColor('#e1dad8')
			.setThumbnail(client.user.avatarURL())
			.setTitle('My Settings')
			.setFooter(`!config | Requested by ${message.author.username}`, `${message.author.displayAvatarURL()}`)
			.setTimestamp();

		if (!args.length) {
			msgEmbed.setDescription('Change the settings for this server. Re run the commands with the required parameters');
			commands.forEach(c => {
				const aliases = c.aliases ? '/' + c.aliases.join('/') : ''
				msgEmbed.addField(c.description, '`' + `!${this.name} ${c.name}${aliases} ${c.usage}` + '`')
			})
			return message.channel.send(msgEmbed);
		} else {
			const configDb = new db.ConfigDb(this.conn);
			const commandName = safeLower(args.shift());

			if (!commandName) {
				return message.reply(`Missing required arguments \`!${this.name} <command> <arguments>\``);
			}

			const command = commands.find(cmd => cmd.name == commandName || (cmd.aliases && cmd.aliases.includes(commandName)));

			if (!command) {
				return message.reply(`Sorry, unknown command \`${commandName}\``);
			}

			const response = await command.execute(configDb, commandName, message, args);

			if (isPromise(response)) return response;

			if (response.message) {
				msgEmbed.setDescription(response.message);
				if (response.fields) msgEmbed.addFields(response.fields);
				if (response.log && response.log === true) {
					configDb.findOne(message.guild.id, cs.LOG_CHANNEL).then(cfg => {
						if (cfg) message.guild.channels.cache.get(cfg.channel).send(msgEmbed);
					});
				}
				return message.channel.send(msgEmbed);
			}

		}

    },
};