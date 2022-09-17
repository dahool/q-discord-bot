const dotenv = require('dotenv');
dotenv.config();

const { prefix } = require('./config.json');
const { BotCommander } = require('./botclient');
const { Intents } = require('discord.js');

const announcer = require('./functions/announcer');
const calendar = require('./functions/calendar');
const membersOnline = require('./functions/online');
const hook = require('./functions/hooksender');
const cs = require('./values')

const TokenGenerator = require('uuid-token-generator');

var dailies = require('./commands/dailies');

const { MembersDb, ConfigDb, BotDb, connectionManager } = require('./db/db');

const INTENTS = [
	Intents.FLAGS.GUILDS,
	Intents.FLAGS.GUILD_PRESENCES,
	Intents.FLAGS.GUILD_MEMBERS,
	Intents.FLAGS.GUILD_MESSAGES,
	Intents.FLAGS.GUILD_WEBHOOKS,
	Intents.FLAGS.DIRECT_MESSAGES
]

const botclient = new BotCommander(connectionManager, 
	INTENTS,
	{name: 'Q', 
	commandsDir: './commands',
	prefix: prefix,
	activity: {
		message: 'you',
		type: 'WATCHING',
		url: 'https://dashqb.herokuapp.com'
	}
})

var botDb;
botclient.once('ready', async () => {
	const botguilds = botclient.client.guilds.cache.filter(c => c.channels);
	const savedguilds = await botDb.fetchGuilds();
	const filtered = botguilds.filter(guild => !savedguilds.some(s => s.id == guild.id)).map(g => { return {id: g.id, name: g.name} })
	if (filtered.length) botDb.addGuilds(filtered);
	
	for (const [guildId, guild] of botguilds) {
		syncGuild(guild);
	}

});

syncGuild = async (guild) => {
	console.log("Sync: " + guild.name);

	updateGuildToken(guild.id);

	// channels
	const guildchannels = await guild.channels.fetch();
	const savedchannels = await botDb.fetchChannels(guild.id);
	const filteredchannels = guildchannels.filter(ch => ch.type == 'GUILD_TEXT' && !savedchannels.some(s => s.id == ch.id)).map(c=> { return {id: c.id, name: c.name, category: c.parent ? c.parent.name : null} });
	if (filteredchannels.length) botDb.addChannels(guild.id, filteredchannels);

	// roles
	const guildroles = await guild.roles.fetch();
	const savedroles = await botDb.fetchRoles(guild.id);
	const filteredroles = guildroles.filter(r => !savedroles.some(s => s.id == r.id)).map(r => { return {id: r.id, name: r.name}});
	if (filteredroles.length) botDb.addRoles(guild.id, filteredroles);
}

updateGuildToken = (guildId) => {
	botDb.fetchGuild(guildId).then((guild) => {
		if (guild && !guild.token)	{
			const tokenGen = new TokenGenerator(256, TokenGenerator.BASE62);
			const tokenValue = tokenGen.generate();
			botDb.updateGuildToken(guildId, tokenValue);
		}
	})
}

botclient.on("guildCreate", guild => {
    console.log("Joined: " + guild.name);
	botDb.addGuild(guild.id, guild.name).then(() => {
		syncGuild(guild);
	});
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

botclient.on("channelUpdate", async (oldchannel, channel) => {
    console.debug("Updated Channel: " + channel.name);
	if (oldchannel.type == 'GUILD_TEXT') {
		await botDb.removeChannel(oldchannel.guild.id, oldchannel.id);
	}
	if (channel.type == 'GUILD_TEXT') {
		botDb.addChannel(channel.guild.id, channel.id, channel.name);
	}
})

botclient.on("roleCreate", role => {
    console.debug("Created role: " + role.name);
	botDb.addRole(role.guild.id, role.id, role.name);
})

botclient.on("roleDelete", role => {
    console.debug("Deleted Role: " + role.name);
	botDb.removeRole(role.guild.id, role.id);
})

botclient.on("roleUpdate", async (oldrole, newrole) => {
    console.debug("Updated Role: " + newrole.name);
	await botDb.removeRole(oldrole.guild.id, oldrole.id);
	botDb.addRole(newrole.guild.id, newrole.id, newrole.name);
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
		botclient.login(process.env.Q_TOKEN);
	},
	async rotate() {
		console.log('rotate daily calendar');
		return true; //disable
		//return dailies.rotate(connectionManager);
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