const express = require('express')
const favicon = require('serve-favicon');
const bot = require('./bot')

const { connectionManager } = require('./db/db');

const botRouter = require('./router/bot');

const app = express()
app.use(express.json());
app.use(favicon('public/favicon.ico'));

botRouter.routerSetup(app);

const port = process.env.WEB_PORT || 3000;

process.on('SIGINT', function() {
    bot.stop();
    connectionManager.close().then(() => {
        process.exit(0);
    });
});

connectionManager.connect().then(() => {
    bot.start();
    app.listen(port, () => {
        console.log("Web Listener Ready on port " + port);
    })
})