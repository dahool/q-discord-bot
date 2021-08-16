const dotenv = require('dotenv');
dotenv.config();

const { prefix } = require('./config.json');
const { BotCommander } = require('./botclient');

const announcer = require('./functions/announcer');
const calendar = require('./functions/calendar');
const membersOnline = require('./functions/online');
const hook = require('./functions/hooksender');
const cs = require('./values')

var dailies = require('./commands/dailies');

const { MembersDb, ConfigDb, BotDb, connectionManager } = require('./db/db');

const botclient = new BotCommander(connectionManager, 
	{name: 'Q', 
	commandsDir: './commands',
	prefix: prefix,
	activity: {
		message: 'you',
		type: 'WATCHING'
	}
})

var botDb;
botclient.once('ready', async () => {
	const botguilds = botclient.client.guilds.cache;
	const savedguilds = await botDb.fetchGuilds();
	const filtered = botguilds.filter(guild => !savedguilds.some(s => s.id == guild.id)).map(g => { return {id: g.id, name: g.name} })
	if (filtered.length) botDb.addGuilds(filtered);
	botguilds.forEach(async (guild) => {
		const guildchannels = guild.channels.cache;
		const savedchannels = await botDb.fetchChannels(guild.id);
		const filteredchannels = guildchannels.filter(ch => !ch.deleted && ch.type == 'GUILD_TEXT' && !savedchannels.some(s => s.id == ch.id)).map(c=> { return {id: c.id, name: c.name} });
		if (filteredchannels.length) botDb.addChannels(guild.id, filteredchannels);
	})
});

botclient.on("guildCreate", guild => {
    console.log("Joined: " + guild.name);
	botDb.addGuild(guild.id, guild.name);
})

botclient.on("guildDelete", guild => {
    console.log("Left: " + guild.name);
	botDb.removeGuild(guild.id);
})

botclient.on("channelCreate", channel => {
    console.debug("Created Channel: " + channel.name);
	if (channel.type == 'GUILD_TEXT') botDb.addChannel(channel.guild.id, channel.id, channel.name);
})

botclient.on("channelDelete", channel => {
    console.debug("Deleted Channel: " + channel.name);
	botDb.removeChannel(channel.guild.id, channel.id);
})

var memberDb;
botclient.on('presenceUpdate', async (oldMember, newMember) => {
	if (!newMember.user.bot && newMember.status != 'offline') {
		memberDb.updateOnline(newMember.guild.members.cache.get(newMember.user.id));
	}
})

var configDb;
botclient.client.on('messageCreate', async (message) => {
	if (!message.author.bot && !message.content.startsWith(prefix)) {
		const cfg = await configDb.findBy({guild: message.guild.id, uuid: cs.WEBHOOK, channel: message.channel.id});
		if (cfg?.length > 0) {
			return hook.relayMessage(message, cfg);
		}		
	}
});

module.exports = {
	async start(connectionManager) {
		memberDb = new MembersDb(connectionManager);
		configDb = new ConfigDb(connectionManager);
		botDb = new BotDb(connectionManager);
		botclient.login(process.env.MAIA_TOKEN);
	},
	async rotate() {
		console.log('rotate daily calendar');
		return dailies.rotate(connectionManager);
	},
	async events(part) {
		const parts = ["0400","1000","1600","2200"]
		console.log('dailies part ' + parts[part]);
		return dailies.notify(connectionManager, parts[part], botclient, part == 0);
	},
	async announce(num) {
		if (!botclient.ready) {
			console.error("Not ready yet!");
			return;
		}
		return announcer.execute(botclient, connectionManager, num);
	},
	async loadEvents() {
		return calendar.execute(connectionManager);
	},
	async online() {
		if (!botclient.ready) {
			console.error("Not ready yet!");
			return;
		}
		return membersOnline.execute(botclient, connectionManager);
	}
};