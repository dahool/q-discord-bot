const { prefix } = require('./config.json');
const { BotCommander } = require('./client/commander');
const { GatewayIntentBits, ChannelType } = require('discord.js');

const announcer = require('./functions/announcer');
const calendar = require('./functions/calendar');
const membersOnline = require('./functions/online');

const UIDGenerator = require('uid-generator');

const { db } = require('./db/db');

const getLogger = require('./logger')
const logger = getLogger();

const INTENTS = [
	GatewayIntentBits.Guilds,
	GatewayIntentBits.GuildPresences,
	GatewayIntentBits.GuildMembers,
	GatewayIntentBits.GuildMessages,
	GatewayIntentBits.GuildWebhooks,
	GatewayIntentBits.DirectMessages,
	GatewayIntentBits.MessageContent,
	GatewayIntentBits.GuildScheduledEvents
]

const botclient = new BotCommander(INTENTS,
	{name: 'Q', 
	commandsDir: `${__dirname}/commands`,
	eventsDir: `${__dirname}/events`,
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
	logger.debug("Sync", guild.name);

	updateGuildToken(guild.id);

	// channels
	const guildchannels = await guild.channels.fetch();
	const savedchannels = await db.bot.fetchChannels(guild.id);
	const filteredchannels = guildchannels.filter(ch => (ch.type === ChannelType.GuildText || ch.type === ChannelType.GuildForum) && !savedchannels.some(s => s.id == ch.id)).map(c=> { return {id: c.id, name: c.name, category: c.parent ? c.parent.name : null} });
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
			const uidgen = new UIDGenerator(256, UIDGenerator.BASE62);
			uidgen.generate().then(uid => {
				db.bot.updateGuildToken(guildId, uid);
			})
		}
	})
}

botclient.on("guildCreate", guild => {
	logger.info("Joined: " + guild.name)
	db.bot.addGuild(guild.id, guild.name).then(() => {
		syncGuild(guild);
	});
})

botclient.on("guildDelete", guild => {
    logger.info("Left: " + guild.name);
	db.bot.removeGuild(guild.id);
})

botclient.on("channelCreate", channel => {
    logger.debug("Created Channel: " + channel.name);
	if (channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildForum ) db.bot.addChannel(channel.guild.id, channel.id, channel.name, channel.parent?.name);
})

botclient.on("channelDelete", channel => {
    logger.debug("Deleted Channel: " + channel.name);
	db.bot.removeChannel(channel.guild.id, channel.id);
})

botclient.on("channelUpdate", async (oldchannel, channel) => {
    logger.debug("Updated Channel: " + channel.name);
	if (oldchannel.type === ChannelType.GuildText || channel.type === ChannelType.GuildForum) {
		await db.bot.removeChannel(oldchannel.guild.id, oldchannel.id);
	}
	if (channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildForum) {
		db.bot.addChannel(channel.guild.id, channel.id, channel.name, channel.parent?.name);
	}
})

botclient.on("roleCreate", role => {
    logger.debug("Created role: " + role.name);
	db.bot.addRole(role.guild.id, role.id, role.name);
})

botclient.on("roleDelete", role => {
    logger.debug("Deleted Role: " + role.name);
	db.bot.removeRole(role.guild.id, role.id);
})

botclient.on("roleUpdate", async (oldrole, newrole) => {
    logger.debug("Updated Role: " + newrole.name);
	await db.bot.removeRole(oldrole.guild.id, oldrole.id);
	db.bot.addRole(newrole.guild.id, newrole.id, newrole.name);
})

const connectionManager = void 0;

module.exports = {
	async start() {
		botclient.login(process.env.Q_TOKEN);
	},
	async stop() {
		botclient.stop();
	},
	/*async rotate() {
		console.log('rotate daily calendar');
		return true; //disable
		//return dailies.rotate(connectionManager);
	},*/
	/*async events(part) {
		const parts = ["0400","1000","1600","2200"]
		console.log('dailies part ' + parts[part]);
		return dailies.notify(parts[part], botclient, part == 0);
	},*/
	async announce(num) {
		if (!botclient.ready) {
			logger.error("Not ready yet!");
			return;
		}
		return announcer.execute(botclient, num);
	},
	async loadEvents() {
		logger.info("Load Calendar");
		return calendar.execute();
	},
	async online() {
		if (!botclient.ready) {
			logger.error("Not ready yet!");
			return;
		}
		return membersOnline.execute(botclient);
	}
};