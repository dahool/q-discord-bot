const { prefix } = require('./config.json');
const { BotCommander } = require('./botclient');
const { GatewayIntentBits, ChannelType } = require('discord.js');

const announcer = require('./functions/announcer');
const calendar = require('./functions/calendar');
const membersOnline = require('./functions/online');
const hook = require('./functions/hooksender');
const cs = require('./values')

const TokenGenerator = require('uuid-token-generator');

var dailies = require('./commands/dailies');

const { db } = require('./db/db');

const INTENTS = [
	GatewayIntentBits.Guilds,
	GatewayIntentBits.GuildPresences,
	GatewayIntentBits.GuildMembers,
	GatewayIntentBits.GuildMessages,
	GatewayIntentBits.GuildWebhooks,
	GatewayIntentBits.DirectMessages,
	GatewayIntentBits.MessageContent
]

const botclient = new BotCommander(INTENTS,
	{name: 'Q', 
	commandsDir: `${__dirname}/commands`,
	prefix: prefix,
	activity: {
		message: 'you',
		type: 'WATCHING',
		url: process.env.DASHBOARD_URL
	}
})

botclient.once('ready', async () => {
	const botguilds = botclient.client.guilds.cache.filter(c => c.channels);
	const savedguilds = await db.bot.fetchGuilds();
	const filtered = botguilds.filter(guild => !savedguilds.some(s => s.id == guild.id)).map(g => { return {id: g.id, name: g.name} })
	if (filtered.length) db.bot.addGuilds(filtered);
	
	for (const [guildId, guild] of botguilds) {
		syncGuild(guild);
	}

});

syncGuild = async (guild) => {
	console.log("Sync: " + guild.name);

	updateGuildToken(guild.id);

	// channels
	const guildchannels = await guild.channels.fetch();
	const savedchannels = await db.bot.fetchChannels(guild.id);
	const filteredchannels = guildchannels.filter(ch => ch.type == 'GUILD_TEXT' && !savedchannels.some(s => s.id == ch.id)).map(c=> { return {id: c.id, name: c.name, category: c.parent ? c.parent.name : null} });
	if (filteredchannels.length) db.bot.addChannels(guild.id, filteredchannels);

	// roles
	const guildroles = await guild.roles.fetch();
	const savedroles = await db.bot.fetchRoles(guild.id);
	const filteredroles = guildroles.filter(r => !savedroles.some(s => s.id == r.id)).map(r => { return {id: r.id, name: r.name}});
	if (filteredroles.length) db.bot.addRoles(guild.id, filteredroles);
}

updateGuildToken = (guildId) => {
	db.bot.fetchGuild(guildId).then((guild) => {
		if (guild && !guild.token)	{
			const tokenGen = new TokenGenerator(256, TokenGenerator.BASE62);
			const tokenValue = tokenGen.generate();
			db.bot.updateGuildToken(guildId, tokenValue);
		}
	})
}

botclient.on("guildCreate", guild => {
    console.log("Joined: " + guild.name);
	db.bot.addGuild(guild.id, guild.name).then(() => {
		syncGuild(guild);
	});
})

botclient.on("guildDelete", guild => {
    console.log("Left: " + guild.name);
	db.bot.removeGuild(guild.id);
})

botclient.on("channelCreate", channel => {
    console.debug("Created Channel: " + channel.name);
	if (channel.type === ChannelType.GuildText) db.bot.addChannel(channel.guild.id, channel.id, channel.name);
})

botclient.on("channelDelete", channel => {
    console.debug("Deleted Channel: " + channel.name);
	db.bot.removeChannel(channel.guild.id, channel.id);
})

botclient.on("channelUpdate", async (oldchannel, channel) => {
    console.debug("Updated Channel: " + channel.name);
	if (oldchannel.type === ChannelType.GuildText) {
		await db.bot.removeChannel(oldchannel.guild.id, oldchannel.id);
	}
	if (channel.type === ChannelType.GuildText) {
		db.bot.addChannel(channel.guild.id, channel.id, channel.name);
	}
})

botclient.on("roleCreate", role => {
    console.debug("Created role: " + role.name);
	db.bot.addRole(role.guild.id, role.id, role.name);
})

botclient.on("roleDelete", role => {
    console.debug("Deleted Role: " + role.name);
	db.bot.removeRole(role.guild.id, role.id);
})

botclient.on("roleUpdate", async (oldrole, newrole) => {
    console.debug("Updated Role: " + newrole.name);
	await db.bot.removeRole(oldrole.guild.id, oldrole.id);
	db.bot.addRole(newrole.guild.id, newrole.id, newrole.name);
})

botclient.on('presenceUpdate', async (oldMember, newMember) => {
	if (!newMember.user.bot && newMember.status != 'offline') {
		db.members.updateOnline(newMember.guild.members.cache.get(newMember.user.id));
	}
})

botclient.client.on('messageCreate', async (message) => {
	if (!message.author.bot && !message.content.startsWith(prefix)) {
		const cfg = await db.config.findBy({guild: message.guild.id, uuid: cs.WEBHOOK, channel: message.channel.id});
		if (cfg?.length > 0) {
			return hook.relayMessage(message, cfg);
		}		
	}
});

const connectionManager = void 0;

module.exports = {
	async start() {
		botclient.login(process.env.Q_TOKEN);
	},
	async stop() {
		botclient.stop();
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