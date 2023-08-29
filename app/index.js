const express = require('express')
const favicon = require('serve-favicon');
const bot = require('./bot')

const TelegramBot = require('node-telegram-bot-api');

const { connectionManager } = require('./db/db');

const serverRouter = require('./router/server');
const botRouter = require('./router/bot');

const app = express()
app.use(express.json());
app.use(favicon('public/favicon.ico'));
app.use(express.static('static'))

botRouter.routerSetup(app);
serverRouter.routerSetup(app);

const port = process.env.WEB_PORT || 3000;

const gramBot = new TelegramBot(process.env.TELEGRAM_TOKEN, {polling: false});

process.on('SIGINT', function() {
    gramBot.sendMessage(process.env.TELEGRAM_ID, 'Q Bot stopped').then(() => {
        gramBot.close();
    });
    bot.stop();
    connectionManager.close().then(() => {
        process.exit(0);
    });
});

connectionManager.connect().then(() => {
    bot.start();
    app.listen(port, () => {
        console.log("Web Listener Ready on port " + port);
        gramBot.sendMessage(process.env.TELEGRAM_ID, 'Q Bot ready');
    })
})