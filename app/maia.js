const dotenv = require('dotenv');
dotenv.config();

const fs = require('fs');
const Discord = require('discord.js');
const { prefix } = require('./config.json');
const { Client, Intents } = require('discord.js');

const client = new Client({ ws: { intents: Intents.ALL } });
client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./maia_commands').filter(file => file.endsWith('.js'));

const { ConfigDb } = require('./db/db');

client.once('ready', () => {
	client.user.setActivity(`and serving the alliance` , { type: `WATCHING` });

	var data = [];
	client.commands.each((cmd) => {
		data.push({name: cmd.name, description: cmd.description});
	})
	
	if (client.application) {
		client.application.commands.set(data).then(cmds => console.log(cmds));
	}

	console.log('Maia online!');
});

var configDb;
client.on('message', message => {

	;(async () => {

		if (!message.content.startsWith(prefix) || message.author.bot || message.mentions.everyone) return;

		const args = message.content.slice(prefix.length).split(/ +/);
		
		const commandName = args.shift().toLowerCase();
		const command = client.commands.get(commandName)
			|| client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
	
		if (!command) return;
	
		if (message.channel.type == "dm" && command.dm === false) {
			return message.reply("Sorry, can't process in DM");
		}
	
		if (command.permission && !message.member.hasPermission(command.permission)) {
			return message.reply("Sorry, you don't have enough permissions to execute this command.");	
		}
	
		if (command.private) {
			const roles = await configDb.findOne(message.channel.guild.id, "roles") || [];
			if (!message.member.roles.cache.some( r => roles)) {
				return message.reply("Sorry, you don't have enough permissions to execute this command.");	
			}
		}
	
		if (command.args && !args.length) {
			let reply = `Please specify, `;
			if (command.usage) {
				reply += `\`${prefix}${command.name} ${command.usage}\``;
			}
			return message.reply(reply);
		}
		
		try {
			return command.execute(client, message, args);
			//message.delete();
		} catch (error) {
			console.error(error);
			message.reply('There was an error trying to execute the command!');
		}		
	})().catch(console.error);
});


module.exports = {
	async start(connectionManager) {
		for (const file of commandFiles) {
			const command = require(`./maia_commands/${file}`);
			command.conn = connectionManager;
			client.commands.set(command.name, command);
		}

		configDb = new ConfigDb(connectionManager);
		client.login(process.env.MAIA_TOKEN);
	}
};