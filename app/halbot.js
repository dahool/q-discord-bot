const dotenv = require('dotenv');
dotenv.config();

const { prefix } = require('./config.json');
const { BotCommander } = require('./botclient');

const { connectionManager } = require('./db/db');

const botclient = new BotCommander(connectionManager, 
	{name: 'HAL', 
	commandsDir: './hal_commands',
	prefix: prefix,
	activity: {
		type: 'LISTENING'
	}
})

module.exports = {
	async start(connectionManager) {
		botclient.login(process.env.HAL_TOKEN);
	}
};