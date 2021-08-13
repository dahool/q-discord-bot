const express = require('express')
const favicon = require('serve-favicon');
const bot = require('./bot')

const app = express()
app.use(express.json());
app.use(favicon('public/favicon.ico'));

const connectionManager = require('./db/db').connectionManager;
const { LoggerDb } = require('./db/db');

const port = process.env.PORT || 3000;

app.get('/', function(req, resp) {
    resp.send("OK");
})

app.get('/notify', function(req, resp) {
    console.log("notify")
    const num = req.query.number || 30;
    bot.announce(num).then(() => resp.send("OK"))
    .catch((error) => {
        resp.send(error);
        loggerDb.error(error);
    });
});

app.get('/load', function(req, resp) {
    bot.loadEvents().then(() => resp.send("OK"))
    .catch((error) => {
        resp.send(error);
        loggerDb.error(error);
    });
});

app.get('/online', function(req, resp) {
    bot.online().then(() => resp.send("OK"))
    .catch((error) => {
        resp.send(error);
        loggerDb.error(error);
    });
});

app.get('/rotate', function(req, resp) {
    bot.rotate().then((r) => resp.send("OK " + r))
    .catch((error) => {
        resp.send(error);
        loggerDb.error(error);
    });
});

app.get('/events', function(req, resp) {
    const num = req.query.number || 0;
    bot.events(num).then((r) => resp.send("OK"))
    .catch((error) => {
        resp.send(error);
        loggerDb.error(error);
    });
});

app.get('/calendar', function(req ,resp) {
    console.log("Calendar " + req.get('Referrer'));
    if (process.env.SECRET == req.query.TOKEN) {
        serveCalendar(connectionManager, req.query.ID, resp);
    } else {
        console.error("Calendar 404");
        resp.status(404).send('Not found');
    }
});

let loggerDb;
connectionManager.connect().then(() => {
    bot.start(connectionManager);
    loggerDb = new LoggerDb(connectionManager);

    app.listen(port, () => {
        console.log("Ready on port " + port);
    })    
})