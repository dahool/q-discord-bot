const dotenv = require('dotenv');
dotenv.config();

const fs = require('fs');
const Discord = require('discord.js');
const { prefix } = require('./config.json');
const { Client, Intents } = require('discord.js');

const announcer = require('./functions/announcer');
const calendar = require('./functions/calendar');
const membersOnline = require('./functions/online');
const hook = require('./functions/hooksender');
const cs = require('./values')

const client = new Client({ ws: { intents: Intents.ALL } });
client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./hal_commands').filter(file => file.endsWith('.js'));

const { MembersDb, ConfigDb, connectionManager } = require('./db/db');

var ready = false;

const getApp = (guildId) => {
	const app = client.api.applications(client.user.id)
	if (guildId) {
		app.guilds(guildId)
	}
	return app;
}

client.once('ready', async () => {
	client.user.setActivity(`you` , { type: `WATCHING` });

	var data = [];
	client.commands.each((cmd) => {
		data.push({name: cmd.name, description: cmd.description});
	})
	
	ready = true;
	console.log('HAL online!');
});

var memberDb;
client.on('presenceUpdate', (oldMember, newMember) => {
	if (!newMember.user.bot && newMember.status != 'offline') {
		memberDb.updateOnline(newMember);
	}
})

var configDb;

handleNonCommand = async (message) => {
	if (message.author.bot) return;

	const cfg = await configDb.findOneBy({guild: message.guild.id, uuid: cs.WEEBHOOK, channel: message.channel.id});
	if (cfg && cfg.url) {
		return hook.relayMessage(message, cfg.url);
	}
}

client.on('message', message => {

	;(async () => {

		if (!message.content.startsWith(prefix) || message.author.bot || message.mentions.everyone) return handleNonCommand(message);

		const args = message.content.slice(prefix.length).split(/ +/);
		
		const commandName = args.shift().toLowerCase();
		const command = client.commands.get(commandName)
			|| client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

		if (!command) return;

		const isAdmin = message.member.hasPermission(['ADMINISTRATOR','MANAGE_GUILD'])

		if (message.channel.type == "dm" && command.dm === false) {
			return message.reply("Sorry, can't process in DM");
		}
	
		if (command.permission && !isAdmin && !message.member.hasPermission(command.permission)) {
			return message.reply("Sorry, you don't have enough permissions to execute this command.");	
		}

		if (command.admin && !isAdmin) {
			return message.reply("Sorry, you don't have enough permissions to execute this command.");	
		}

		const roles = (await configDb.findOne(message.channel.guild.id, "roles", "roles")) || [];
		const isManag = message.member.roles.cache.some( r => roles.includes(r) )
		if (command.private && !isAdmin && !isManag) {
			return message.reply("Sorry, you don't have enough permissions to execute this command.");	
		}

		if (command.args && !args.length) {
			let reply = `Please specify, `;
			if (command.usage) {
				reply += `\`${prefix}${command.name} ${command.usage}\``;
			}
			return message.reply(reply);
		}
		
		try {
			command.isAdmin = isAdmin || isManag;
			const r = command.execute(client, message, args);
			if (!message.channel.type == "dm") message.delete();
		} catch (error) {
			console.error(error);
			message.reply('There was an error trying to execute the command!');
		}		
	})().catch((error) => { 
		message.reply('There was an error trying to execute the command!')
		console.error(error);
	});
});

var connection;
module.exports = {
	async start(connectionManager) {
		connection = connectionManager;

		for (const file of commandFiles) {
			const command = require(`./hal_commands/${file}`);
			command.conn = connectionManager;
			client.commands.set(command.name, command);
		}

		memberDb = new MembersDb(connectionManager);
		configDb = new ConfigDb(connectionManager);
		
		client.login(process.env.HAL_TOKEN);
	},
	async announce(num) {
		if (!ready) {
			console.error("Not ready yet!");
			return;
		}
		return announcer.execute(client, connection, num);
	},
	async events() {
		return calendar.execute(connection);
	},
	async online() {
		if (!ready) {
			console.error("Not ready yet!");
			return;
		}
		return membersOnline.execute(client, connection);
	}
};