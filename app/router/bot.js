const bot = require('../bot')
const { db } = require('../db/db');

notifyView = (req, resp) => {
    console.log("notify")
    const num = req.query.number || 30;
    bot.announce(num).then(() => resp.send("OK"))
    .catch((error) => {
        resp.send(error);
        db.logger.error(error);
    });
}

loadView = (req, resp) => {
    bot.loadEvents().then(() => resp.send("OK"))
    .catch((error) => {
        resp.send(error);
        db.logger.error(error);
    });
}

onlineView = (req, resp) => {
    bot.online().then(() => resp.send("OK"))
    .catch((error) => {
        resp.send(error);
        db.logger.error(error);
    });
}

rotateView = (req, resp) => {
    bot.rotate().then((r) => resp.send("OK " + r))
    .catch((error) => {
        resp.send(error);
        db.logger.error(error);
    });
}

eventsView = (req, resp) => {
    const num = req.query.number || 0;
    bot.events(num).then((r) => resp.send("OK"))
    .catch((error) => {
        resp.send(error);
        db.logger.error(error);
    });
}

calendarView = (req, res) => {
    console.log("Calendar get");
    serveCalendar(req, res);
}


routerSetup = (app) => {

    app.get('/', (req, resp) => {
        resp.send("OK");
    });
    
    app.get('/notify', notifyView);
    app.get('/calendar', calendarView);
    app.get('/events', eventsView);
    app.get('/rotate', rotateView);
    app.get('/online', onlineView);
    app.get('/load', loadView);

}

module.exports = {
    routerSetup
};