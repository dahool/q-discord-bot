const { DateTime } = require('luxon');
const bot = require('../bot')
const { db } = require('../db/db');
const { isPresent } = require('../utils');
const { TERRITORY_CHANNEL, GENERAL_EVENTS } = require('../values');
const { crawler } = require('../functions/crawler');

const ENV_VARS = ['Q_TOKEN','DBCONN','DBNAME','CALENDAR_URL','DASHBOARD_URL'];

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

checkEnvironment = () => {
    ENV_VARS.forEach(v => {
        if (!isPresent(process.env[v])) {
            throw new Error('Missing ' + v);
        }
    })
}

clearZoneEvents = async () => {
    const today = DateTime.utc().minus({days: 1}).toJSDate();
    return new Promise((resolver) => {
        db.zoneEvents.findBy({events: {$elemMatch: {last: {$lt: today}}}}).then((zoneEvents) => {
            console.log(zoneEvents);
            zoneEvents.forEach((ze) => {
                var newEvents = [];
                ze.events.forEach(event => {
                    if (event.last < today) {
                        console.log("Delete " + event.id);
                        db.calendar.delete({guild: ze.guild, uid: event.id, type: TERRITORY_CHANNEL});
                    } else {
                        newEvents.push(event);
                    }
                })
                if (newEvents.length > 0) {
                    db.zoneEvents.push(ze.guild, ze.uuid, {events: newEvents});    
                } else {
                    db.zoneEvents.deleteBy({_id: ze._id});
                }
            })
            resolver(zoneEvents.length);
        });
    })
}

clearReminders = async () => {
    const today = DateTime.utc().minus({days: 1}).toJSDate();
    return new Promise((resolver) => {
        db.calendar.delete({type: GENERAL_EVENTS, start: {$lt: today}}).then(r => resolver(r['deletedCount']));
    })
}

cleanExpiredEvents = (req, resp) => {
    Promise.all([clearZoneEvents(), clearReminders()]).then((values) => {
        console.log(values);
        resp.send("OK " + values);
    });    
}

crawlerView = (req, res) => {
    crawler();
    res.send("OK");
}

routerSetup = (app) => {

    checkEnvironment();

    app.get('/q', (req, resp) => {
        resp.send("OK");
    });
    
    app.get('/notify', notifyView);
    app.get('/calendar', calendarView);
    app.get('/events', eventsView);
    app.get('/rotate', rotateView);
    app.get('/online', onlineView);
    app.get('/load', loadView);
    app.get('/clean', cleanExpiredEvents);
    app.get('/crawler', crawlerView);

}

module.exports = {
    routerSetup
};