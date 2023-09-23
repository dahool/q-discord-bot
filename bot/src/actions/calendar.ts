import { deleteScheduledEvent } from "@/common/discord";
import { TYPES, container } from "@/ic.config";
import { logger } from "@/logging/logger";
import { CalendarEvent, CalendarModel, Config, ConfigModel } from "@/repository";
import { Request, Response } from "express";
import generator from "ical-generator";
import { DateTime } from "luxon";
import ical, { VEvent } from 'node-ical';
import { EVENT_TYPE } from "./notification";

export const CALENDAR_SOURCE = "calendar";

function get_duration(ev: VEvent): number {
    return Math.abs(DateTime.fromJSDate(ev.end).diff(DateTime.fromJSDate(ev.start)).as('minutes'));
}

function processRecurrentEvent(ev: VEvent): CalendarEvent[] {
    let events: CalendarEvent[] = [];
    if (ev.rrule?.options.until) {
        if (DateTime.fromJSDate(ev.rrule.options.until) < DateTime.local()) {
            return events;
        }
    }
    ev.rrule?.between(DateTime.local().toJSDate(), DateTime.local().plus({ months: 1}).toJSDate()).forEach((v) => {
        events.push(buildEvent(ev, v));
    })
    return events;
}

function buildEvent(data: VEvent, dtStart: Date | null): CalendarEvent {
    return {
        parentId: data.uid,
        summary: data.summary,
        location: data.location,
        start: dtStart || data.start,
        description: data.description,
        duration: get_duration(data),
        type: EVENT_TYPE.TERRITORY,
        src: CALENDAR_SOURCE,
        notified: false
    } as CalendarEvent;
}

async function loadEvents(config: Config) {
    logger.debug("load %s", config.territoyCalendar);
    const data = await ical.async.fromURL(config.territoyCalendar!);
    
    await CalendarModel.deleteMany({guild: config.guild, src: CALENDAR_SOURCE, start: {$lt: DateTime.utc().toJSDate()}}).exec();

    let calendarEvents: CalendarEvent[] = [];

    for (let k in data) {
        if (data.hasOwnProperty(k)) {
            const ev = data[k];
            if (ev.type == 'VEVENT') {
                if (ev.rrule) {
                    const events = processRecurrentEvent(ev);
                    if (events.length > 0) {
                        logger.debug("%O", events);
                        calendarEvents = calendarEvents.concat(events);
                    }
                } else {
                    if (DateTime.fromJSDate(ev.start) > DateTime.local()) {
                        logger.debug("%O", ev);
                        calendarEvents.push(buildEvent(ev, null));
                    }
                }
            }
        }
    }

    // esto es para mantener los eventos de discord ya creados
    const existingEvents = await CalendarModel.find({guild: config.guild, src: CALENDAR_SOURCE});

    const toInsertEvents = calendarEvents.filter((element) => !existingEvents.some((c) => element.parentId == c.parentId && element.start.getTime() == c.start.getTime() ) );
    const toRemoveEvents = existingEvents.filter((element) => !calendarEvents.some((c) => element.parentId == c.parentId && element.start.getTime() == c.start.getTime() ) );

    logger.debug("Insert %d events", toInsertEvents.length);
    logger.debug("Remove %d events", toRemoveEvents.length);

    if (toInsertEvents.length > 0) {
        await CalendarModel.insertMany(toInsertEvents.map(e => Object.assign({}, e, {guild: config.guild})))
    }
    if (toRemoveEvents.length > 0) {
        toRemoveEvents.forEach(event => {
            if (event.discordEventId) {
                const guild = container.get(TYPES.Bot).client.guild.cache.get(event.guild);
                if (guild) deleteScheduledEvent(guild, event.discordEventId);
            }
            CalendarModel.deleteOne({_id: event._id}).exec();
        })
    }

}

export async function serveCalendar(req: Request, res: Response) {
    // validate token
    const guildData = await ConfigModel.findOne({guild: req.query.ID});

    if (!(guildData && guildData.token == req.query.TOKEN)) {
        logger.error("Calendar 404");
        res.status(404).send('Not found');
        return;
    }

    const cal = generator({name: 'Territory Events'});

    const query = {
        start: { $gt: DateTime.utc().toJSDate(), $lte: DateTime.utc().endOf('day').plus({days: 15}).toJSDate()},
        type: EVENT_TYPE.TERRITORY,
        notified: false,
        guild: guildData.guild
    }

    const events = await CalendarModel.find(query).exec();

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

export async function loadCalendarEvents() {
    const configs = await ConfigModel.find({"territoyCalendar":{$nin:[null,""]}}).exec();
    return Promise.all([
        configs.map(c => loadEvents(c))
    ]).then((r) => {
        logger.debug("Processed %s", r.length)
    })
}
