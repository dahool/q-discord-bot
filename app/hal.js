const dotenv = require('dotenv');
dotenv.config();

const { prefix } = require('./config.json');
const { Client, Intents } = require('discord.js');
const { BotCommander } = require('./botclient');

const announcer = require('./functions/announcer');
const calendar = require('./functions/calendar');
const membersOnline = require('./functions/online');
const hook = require('./functions/hooksender');
const cs = require('./values')

const { MembersDb, ConfigDb, connectionManager } = require('./db/db');

//const client = new Client({ ws: { intents: Intents.ALL } });
const client = new Client();
const botclient = new BotCommander(client, connectionManager, 
	{name: 'HAL', 
	commandsDir: './hal_commands', 
	prefix: prefix,
	activity: {
		message: 'you',
		type: 'WATCHING'
	}
})

var memberDb;
client.on('presenceUpdate', (oldMember, newMember) => {
	if (!newMember.user.bot && newMember.status != 'offline') {
		memberDb.updateOnline(newMember.guild.members.cache.get(newMember.user.id));
	}
})

var configDb;
client.on('message', message => {
	;(async () => {
		if (!message.author.bot && !message.content.startsWith(prefix)) {
			const cfg = await configDb.findOneBy({guild: message.guild.id, uuid: cs.WEEBHOOK, channel: message.channel.id});
			if (cfg && cfg.url) {
				return hook.relayMessage(message, cfg.url);
			}		
		}
	})
});

module.exports = {
	async start(connectionManager) {
		memberDb = new MembersDb(connectionManager);
		configDb = new ConfigDb(connectionManager);
		botclient.login(process.env.HAL_TOKEN);
	},
	async announce(num) {
		if (!botclient.ready) {
			console.error("Not ready yet!");
			return;
		}
		return announcer.execute(client, connectionManager, num);
	},
	async events() {
		return calendar.execute(connectionManager);
	},
	async online() {
		if (!botclient.ready) {
			console.error("Not ready yet!");
			return;
		}
		return membersOnline.execute(client, connectionManager);
	}
};