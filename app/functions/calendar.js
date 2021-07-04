
const Discord = require("discord.js");
const { DateTime } = require("luxon");
const { ConfigDb, CalendarDb } = require("../db/db");
const ical = require('node-ical');
const cs = require('../values');
const { load } = require("dotenv");


processRecurrentEvent = (ev) => {
    let events = [];
    if (ev.rrule.options.until) {
        if (DateTime.fromJSDate(ev.rrule.options.until) < DateTime.local()) {
            return events;
        }
    } else {
        ev.rrule.options.dtstart = DateTime.local().minus({ days: 1}).toJSDate();
        ev.rrule.options.until = DateTime.local().plus({ months: 1}).toJSDate();
    }
    ev.rrule.all((v) => {
        events.push({uid: ev.uid, summary: ev.summary, location: ev.location, start: v, description: ev.description, notified: false});
        return true;
    })
    return events;
}

loadEvents = async (guild, url, type, connection) => {
    console.log("load " + url);
    const data = await ical.async.fromURL(url);

    const calendar = new CalendarDb(connection);

    await calendar.delete({guild: guild, type: type});

    for (let k in data) {
        if (data.hasOwnProperty(k)) {
            var ev = data[k];
            if (data[k].type == 'VEVENT') {
                if (ev.rrule) {
                    const events = processRecurrentEvent(ev);
                    if (events.length > 0) {
                        console.log(events);
                        await calendar.insert(events.map(e => Object.assign({}, e, {guild: guild, type: type})));
                    }
                } else {
                    if (DateTime.fromJSDate(ev.start) > DateTime.local()) {
                        console.log(ev);
                        await calendar.insert([{guild: guild, type: type, uid: ev.uid, summary: ev.summary, location: ev.location, start: ev.start, description: ev.description, notified: false}]);
                    }
                }
            }
        }
    }

}

module.exports = {
    add_event,
	async execute(connection) {
        const config = new ConfigDb(connection);

        const configs = await config.findBy({uuid: 'territory_events'});
        configs.forEach(ev => {
                loadEvents(ev.guild, ev.url, 'territory_events', connection);
        });

        console.log("Processed " + configs.length);

	},
};