
const { DateTime } = require("luxon");
const { db } = require("../db/db");
const ical = require('node-ical');
const cs = require('../values');
const generator = require('ical-generator');

get_duration = (ev) => {
    return Math.abs(DateTime.fromJSDate(ev.end).diff(DateTime.fromJSDate(ev.start)).as('minutes'));
}

processRecurrentEvent = (ev) => {
    let events = [];
    if (ev.rrule.options.until) {
        if (DateTime.fromJSDate(ev.rrule.options.until) < DateTime.local()) {
            return events;
        }
    } else {
        //ev.rrule.options.dtstart = DateTime.local().minus({ days: 1}).toJSDate();
        ev.rrule.options.until = DateTime.local().plus({ months: 1}).toJSDate();
    }
    const duration = get_duration(ev);
    ev.rrule.all((v) => {
        if (DateTime.fromJSDate(v) > DateTime.local()) {
            events.push({uid: ev.uid, summary: ev.summary, location: ev.location, start: v, description: ev.description, notified: false, duration: duration});
        }
        return true;
    })
    return events;
}

loadEvents = async (guild, url, type) => {
    console.log("load " + url);
    const data = await ical.async.fromURL(url);
    
    await db.calendar.delete({guild: guild, type: type, src: 'calendar', start: {$lte: DateTime.utc().toJSDate()}});

    let calendarEvents = [];

    for (let k in data) {
        if (data.hasOwnProperty(k)) {
            const ev = data[k];
            if (ev.type == 'VEVENT') {
                if (ev.rrule) {
                    const events = processRecurrentEvent(ev);
                    if (events.length > 0) {
                        console.log(events);
                        calendarEvents = calendarEvents.concat(events.map(e => Object.assign({}, e, {guild: guild, type: type, src: 'calendar'})));
                    }
                } else {
                    if (DateTime.fromJSDate(ev.start) > DateTime.local()) {
                        console.log(ev);
                        const duration = get_duration(ev);
                        calendarEvents.push({guild: guild, type: type, uid: ev.uid, summary: ev.summary, location: ev.location, start: ev.start, description: ev.description, notified: false, src: 'calendar'});
                    }
                }
            }
        }
    }

    const existingEvents = await db.calendar.findBy({guild: guild, type: type, src: 'calendar'});

    const toInsertEvents = calendarEvents.filter((element) => !existingEvents.some((c) => element.uid == c.uid && element.start.getTime() == c.start.getTime() ) );
    const toDeleteEvents = existingEvents.filter((element) => !calendarEvents.some((c) => element.uid == c.uid && element.start.getTime() == c.start.getTime() ) );

    console.log("Delete: %s", toDeleteEvents.map((e) => e.uid + " - " + e.start ));
    console.log("Insert: %s", toInsertEvents.map((e) => e.uid + " - " + e.start ));

    await db.calendar.deleteElements(toDeleteEvents);
    await db.calendar.insert(toInsertEvents);

}

serveCalendar = async (req, res) => {
    // validate token
    const guildData = await db.bot.fetchGuild(req.query.ID);

    if (!(guildData && guildData.token == req.query.TOKEN)) {
        console.error("Calendar 404");
        res.status(404).send('Not found');
        return;        
    }

    const cal = generator({name: 'Territory Events'});

    const query = {
        start: { $gt: DateTime.utc().toJSDate(), $lte: DateTime.utc().plus({days: 30}).toJSDate()},
        //src: { $ne: 'calendar'},
        type: 'territory',
        notified: false,
        guild: guildData.id
    }

    const events = await db.calendar.findBy(query);

    events.forEach(event => {
        cal.createEvent({
            start: event.start,
            end: DateTime.fromJSDate(event.start).plus({minutes: event.duration}),
            summary: event.summary,
            location: event.location
        });
    })

    cal.serve(res);
}

module.exports = {
    serveCalendar,
	async execute() {
        const configs = await db.config.findBy({uuid: 'territory_events'});
        configs.forEach(ev => {
            loadEvents(ev.guild, ev.url, cs.TERRITORY_CHANNEL);
        });
        return "Processed calendars: " + configs.length;
	},
};