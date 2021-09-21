const dotenv = require('dotenv');
dotenv.config();

const { prefix } = require('./config.json');
const { BotCommander } = require('./botclient');
const { Intents } = require('discord.js');

const { connectionManager } = require('./db/db');

const INTENTS = [
	Intents.FLAGS.GUILDS,
	Intents.FLAGS.GUILD_MESSAGES,
	Intents.FLAGS.DIRECT_MESSAGES,
	Intents.FLAGS.GUILD_VOICE_STATES
]

const botclient = new BotCommander(connectionManager, 
	INTENTS,
	{name: 'HAL', 
	commandsDir: './hal_commands',
	prefix: prefix,
	activity: {
		message: 'and ready to rock your world',
		type: 'LISTENING'
	}
})

module.exports = {
	async start(connectionManager) {
		botclient.login(process.env.HAL_TOKEN);
	}
};