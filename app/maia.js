const dotenv = require('dotenv');
dotenv.config();

const { prefix } = require('./config.json');
const { Client, Intents } = require('discord.js');
const { BotCommander } = require('./botclient');

var dailies = require('./maia_commands/dailies');

const { connectionManager } = require('./db/db');

//const client = new Client({ ws: { intents: Intents.ALL } });
const client = new Client();
const botclient = new BotCommander(client, connectionManager, 
	{name: 'Maia', 
	commandsDir: './maia_commands', 
	prefix: prefix,
	activity: {
		message: 'and serving the alliance`',
		type: 'WATCHING'
	}
})

module.exports = {
	async rotate() {
		console.log('rotate daily calendar');
		return dailies.rotate(connectionManager);
	},
	async events(part) {
		const parts = ["0400","1000","1600","2200"]
		console.log('dailies part ' + parts[part]);
		return dailies.notify(connectionManager, parts[part], client, part == 0);
	},
	async start(connectionManager) {
		botclient.login(process.env.MAIA_TOKEN);
	}
};