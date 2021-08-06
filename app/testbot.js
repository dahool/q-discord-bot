const dotenv = require('dotenv');
dotenv.config();

const { connectionManager } = require('./db/db');

const { Client } = require('discord.js');
const { BotCommander } = require('./botclient');

const client = new Client();

connectionManager.connect().then(() => {
	
	const bot = new BotCommander(client, connectionManager, {commandsDir: './' + process.argv[2] + '_commands', name: process.argv[2]})
	bot.login(process.env.HAL_TOKEN)
})

