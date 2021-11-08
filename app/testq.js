const dotenv = require('dotenv');
dotenv.config();

const { connectionManager } = require('./db/db');
const bot = require('./bot')

connectionManager.connect().then(() => {
	bot.start(connectionManager);
})

