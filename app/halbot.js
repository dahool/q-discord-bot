const dotenv = require('dotenv');
dotenv.config();

const { prefix } = require('./config.json');
const { BotCommander } = require('./botclient');
const { GatewayIntentBits } = require('discord.js');

const { connectionManager } = require('./db/db');

const INTENTS = [
	GatewayIntentBits.Guilds,
	GatewayIntentBits.GuildMessages,
	GatewayIntentBits.GuildVoiceStates,
	GatewayIntentBits.DirectMessages
]


const botclient = new BotCommander(connectionManager, 
	INTENTS,
	{name: 'HAL', 
	commandsDir: './hal_commands',
	prefix: prefix,
	activity: {
		message: 'Ready to rock your world',
		type: 4
	}
})

module.exports = {
	async start(connectionManager) {
		botclient.login(process.env.HAL_TOKEN);
	}
};