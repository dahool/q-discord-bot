import { LocalChannelManager, LocalGuildClient } from "@/client";
import { createEventCalendar, findZonesByName } from "@/commands/territory";
import { createScheduledEvent } from "@/common/discord";
import { asRole, asTimeRelative, stripHtml } from "@/common/utils";
import { TYPES, container } from "@/ic.config";
import { logger } from "@/logging/logger";
import { CalendarEvent, CalendarModel, TerritoryEventModel } from "@/repository";
import { Client, EmbedBuilder, MessageCreateOptions } from "discord.js";
import { DateTime } from "luxon";

export enum EVENT_TYPE {
    TERRITORY = 'territory',
    GENERAL = 'reminder',
    SCHEDULED_EVENTS = 'event'
}

const MENTION_REX = /@([\[\]\w\s]+)/gm;

async function parseRolesFromText(channel: LocalChannelManager, description: string | undefined): Promise<string[]> {
    if (description == undefined || description.length == 0) return [];

    let roles: string[] = [];
    const stripped = stripHtml(description)!;
    logger.debug("get roles from %s", stripped);
    
    let client = new LocalGuildClient(channel.channel.guild);
    let guildRoles = await client.getRoles();

    const m = stripped.match(MENTION_REX);
    logger.debug("match: %o", m);
    if (m) {
        m.map(v => v.substring(1).trim()).forEach(v => {
            logger.debug("Lookup for %s", v);
            let role = guildRoles.find(r => r.name === v);
            logger.debug("Found %o", role);
            if (role) {
                roles.push(asRole(role.id));
            }
        });
    }
    return roles;
}

async function buildTerritoryAnnouncement(channel: LocalChannelManager, event: CalendarEvent): Promise<MessageCreateOptions> {

    const startTime = DateTime.fromJSDate(event.start).setLocale('en');
    const zones = findZonesByName(event.location);

    const message = new EmbedBuilder()
        .setColor('Random')
        .setTitle(event.summary)
        .setURL('https://www.timeanddate.com/countdown/generic?p0=1440&iso=' + startTime.setZone('UTC').toISO() + "&msg=" + encodeURIComponent(event.summary))
        .setDescription(stripHtml(event.description) || ' ')
        .setThumbnail('https://www.dropbox.com/s/6jzlixqvk4nhpg9/redalert.gif?raw=1')
        .addFields(
            { name: 'Zone', value: event.location },
            { name: 'Starts', value: asTimeRelative(startTime), inline: true });

    if (zones.length > 0) {
        const zone = zones[0];
        message.addFields({name: 'Type', value: (zone.type == 1 ? ':one:' : zone.type == 2 ? ':two:' : ':three:')})
        message.addFields({name: 'Risk level', value: zone.type == 1 ? 'High :warning:' : 'Medium'})
    }

    const parsedRoles = await parseRolesFromText(channel, event.description);
    const roles = parsedRoles.concat(event.pingRoles ? event.pingRoles.map(r => asRole(r)) : []);
    if (roles.length == 0) {
       roles.push("@here");
    }
    const ping = roles.join(' ');
    return { content: `${event.summary} [${event.location}] ${ping}`, embeds: [ message ] }
}

function buildGeneralReminderAnnouncement(event: CalendarEvent): MessageCreateOptions {
    const startTime = DateTime.fromJSDate(event.start).setLocale('en');

    const message = new EmbedBuilder()
        .setColor('Random')
        .setTitle(event.summary)
        .setURL('https://www.timeanddate.com/countdown/generic?p0=1440&iso=' + startTime.setZone('UTC').toISO() + "&msg=" + encodeURIComponent(event.summary))
        .setThumbnail("https://www.dropbox.com/s/nrviw00vxo2xk3z/bell.png?raw=1")
        .addFields(
            { name: 'Event', value: event.summary },
            { name: 'Starts', value: asTimeRelative(startTime), inline: true });


    return { content: `${event.summary} @here`, embeds: [ message ] }
}

function buildScheduledEventsAnnouncement(event: CalendarEvent): MessageCreateOptions {
    return { content: `Attention @everyone **${event.summary}** is starting soon. Join us ${event.extra}` }
}

async function postAnnouncement(event: CalendarEvent, channel: LocalChannelManager): Promise<CalendarEvent> {
    let payload: MessageCreateOptions;
    switch(event.type) {
        case EVENT_TYPE.TERRITORY:
            payload = await buildTerritoryAnnouncement(channel, event);
            break;
        case EVENT_TYPE.GENERAL:
            payload = buildGeneralReminderAnnouncement(event);
            break;
        case EVENT_TYPE.SCHEDULED_EVENTS:
            payload = buildScheduledEventsAnnouncement(event);
            break;
        default:
            return Promise.reject("Unknown event type " + event.type);
    }
    return new Promise((reso, reje) => {
        channel.send(payload)
            .then(() => reso(event))
            .catch((e: any) => {
                logger.error(e);
                reje(e);
            })
    })
}

async function rolloutEvents() {

    // minimun for territory events is 30 minutes
    const today = DateTime.utc().plus({minutes: 30}) .toJSDate();

    const events = await TerritoryEventModel.find({ next: { $lt: today } }).exec();

    // remove non recurrent events
    let asyncWaiting = events.filter(e => e.recurrent === false).map(e => {
        return new Promise<void>(resolve => {
            e.deleteOne().then(() => resolve());
        })
    })
    asyncWaiting.concat(events.filter(e => e.recurrent === true).map(e => {
        return new Promise<void>(resolve => {
            e.next = DateTime.fromJSDate(e.next).plus({days: 7}).toJSDate();
            e.save().then(() => {
                createEventCalendar(e).then(() => resolve());
            });
        });
    }));

    return Promise.all(asyncWaiting);
}

async function cleanUpCalendar() {
    return CalendarModel.deleteMany({
        start: { $lt: DateTime.utc().minus({ days: 1 }).toJSDate()},
    }).exec();
}

async function scheduleDiscordEvents(client: Client) {
    const query = {
        start: { $gt: DateTime.utc().toJSDate(), $lte: DateTime.utc().plus({hours: 24}).toJSDate()},
        notified: false,
        discordEventId: null,
        type: EVENT_TYPE.TERRITORY
    }
    const events = await CalendarModel.find(query);
    
    return Promise.all(events.map(event => {
        return createScheduledEvent(
            client.guilds.cache.get(event.guild)!,
            event.summary,
            '',
            'general',
            DateTime.fromJSDate(event.start),
            event.duration!,
            event.location).then(dEvent => {
                logger.info("Scheduled event %s for %s", dEvent.id, event.summary);
                event.discordEventId = dEvent.id;
                event.save();
            });
    }));
}

export async function processAnnouncements(minutesAhead: number) {
    
    const events = await CalendarModel.find({
        start: { $gt: DateTime.utc().toJSDate(), $lte: DateTime.utc().plus({minutes: minutesAhead}).toJSDate()},
        $or: [ { notified: false }, { notified: null } ]
    }).exec();

    logger.debug("Events %O", events);
    
    for (let event of events) {
        let toChannel;
        let guild = new LocalGuildClient(event.guild);
        if (event.channel) {
            toChannel = await guild.getChannel(event.channel);
        } else {
            let config = await guild.getConfig();
            if (config) {
                switch(event.type) {
                    case EVENT_TYPE.TERRITORY:
                        if (config.channels?.territory) {
                            toChannel = await guild.getChannel(config.channels.territory);
                        }
                        break;
                    case EVENT_TYPE.SCHEDULED_EVENTS:
                        if (config.channels?.scheduledEvents) {
                            toChannel = await guild.getChannel(config.channels.scheduledEvents);
                        }
                        break;                        
                }
            }
        }
        if (toChannel) {
            postAnnouncement(event, toChannel).then((ev) => {
                ev.notified = true;
                ev.save();
            });
        } else {
            logger.error("No channel defined for event %O", event);
        }
    }
    
    return Promise.all([
        rolloutEvents(),
        cleanUpCalendar(),
        scheduleDiscordEvents(container.get(TYPES.Bot).client)
    ])

}
