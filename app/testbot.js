const dotenv = require('dotenv');
dotenv.config();

const { connectionManager } = require('./db/db');

const { Client } = require('discord.js');
const { BotCommander } = require('./botclient');

const client = new Client();

connectionManager.connect().then(() => {
	const bot = new BotCommander(client, connectionManager, {commandsDir: './cmds'})
	bot.login(process.env.HAL_TOKEN)
})

