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

var dailies = require('./commands/dailies');

const { MembersDb, ConfigDb, connectionManager } = require('./db/db');

const client = new Client({ intents: [
	Intents.FLAGS.GUILD_PRESENCES,
	Intents.FLAGS.GUILD_MEMBERS,
	Intents.FLAGS.GUILDS,
	Intents.FLAGS.GUILD_MESSAGES,
	Intents.FLAGS.GUILD_WEBHOOKS,
	Intents.FLAGS.DIRECT_MESSAGES
], partials: ['CHANNEL']});

const botclient = new BotCommander(client, connectionManager, 
	{name: 'Q', 
	commandsDir: './commands',
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
client.on('messageCreate', message => {
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
		botclient.login(process.env.MAIA_TOKEN);
	},
	async rotate() {
		console.log('rotate daily calendar');
		return dailies.rotate(connectionManager);
	},
	async events(part) {
		const parts = ["0400","1000","1600","2200"]
		console.log('dailies part ' + parts[part]);
		return dailies.notify(connectionManager, parts[part], client, part == 0);
	},
	async announce(num) {
		if (!botclient.ready) {
			console.error("Not ready yet!");
			return;
		}
		return announcer.execute(client, connectionManager, num);
	},
	async loadEvents() {
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