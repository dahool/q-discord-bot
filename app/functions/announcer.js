
const Discord = require("discord.js");
const { json } = require("express/lib/response");
const { DateTime } = require("luxon");
const { db } = require('../db/db');

const { randomColor, asRole, asTimeRelative } = require('../utils');
const { TERRITORY_CHANNEL, GENERAL_EVENTS, SCHEDULED_EVENTS } = require("../values");

const striptags = require("striptags");
const { scheduleEvent } = require("../client/events");

const { find_by_name } = require('../commands/zones');

const getLogger = require('../logger')
const logger = getLogger();

const MENTION_REX = /@([\[\]\w\s]+)/gm;

createTerritoryContent = (data) => {
    return data.summary + ' [' + data.location + '] @here ';
}

stripHtml = (data) => {
    if (data && data != '') {
        data = striptags(data.replace('<br>', '\n'));
    }
    return data;
}

createTerritoryEmbed = (data) => {
    let startTime;
    if (data.start instanceof Date) {
        startTime = DateTime.fromJSDate(data.start).setLocale('en');
    } else {
        startTime = DateTime.fromISO(data.start).setLocale('en');
    }

    const zones = find_by_name(data.location);

    const message = new Discord.EmbedBuilder()
        .setColor(randomColor())
        .setTitle(data.summary)
        .setURL('https://www.timeanddate.com/countdown/generic?p0=1440&iso=' + startTime.setZone('UTC').toISO() + "&msg=" + encodeURIComponent(data.summary))
        .setDescription(stripHtml(data.description) || ' ')
        .setThumbnail('https://www.dropbox.com/s/6jzlixqvk4nhpg9/redalert.gif?raw=1')
        .addFields(
            { name: 'Zone', value: data.location },
            { name: 'Starts', value: asTimeRelative(startTime), inline: true });

    if (zones.length > 0) {
        const zone = zones[0];
        message.addFields({name: 'Type', value: (zone.type == 1 ? ':one:' : zone.type == 2 ? ':two:' : ':three:')})
        message.addFields({name: 'Risk level', value: zone.type == 1 ? 'High :warning:' : 'Medium'})
    }

    return message;
}

createEventEmbed = (data) => {

    let startTime;
    if (data.start instanceof Date) {
        startTime = DateTime.fromJSDate(data.start).setLocale('en');
    } else {
        startTime = DateTime.fromISO(data.start).setLocale('en');
    }

    const message = new Discord.EmbedBuilder()
        .setColor(randomColor())
        .setTitle(data.summary)
        .setURL('https://www.timeanddate.com/countdown/generic?p0=1440&iso=' + startTime.setZone('UTC').toISO() + "&msg=" + encodeURIComponent(data.summary))
        .setThumbnail("https://www.dropbox.com/s/nrviw00vxo2xk3z/bell.png?raw=1")
        .addFields(
            { name: 'Event', value: data.summary },
            { name: 'Starts', value: asTimeRelative(startTime), inline: true });

    return message;
}

createEventContent = (data) => {
    return data.summary + ' @here ';
}

createScheduledEventContent = (data) => {
    console.log(data);
    return `Attention @everyone **${data.summary}** is starting soon. Join us ${data.url}`;
}

getRoles = (channel, message) => {
    let roles = [];
    if (message.description && message.description != '') {
        const msgdescription = stripHtml(message.description);
        logger.debug("get roles " + msgdescription);
        const m = msgdescription.match(MENTION_REX);
        logger.debug(m);
        if (m) {
            m.map(v => v.substring(1).trim()).forEach(v => {
                logger.debug("Lookup " + v);
                let role = channel.guild.roles.cache.find(r => r.name === v);
                logger.debug(role);
                if (role) {
                    roles.push(asRole(role.id));
                }
            });
        }
    }
    return roles.join(' ');
}

getMentions = (data, cfgMention) => {
    let r = [];
    if (data.mentions && data.mentions.length > 0) {
        r = data.mentions;
    } else if (cfgMention) {
        r = cfgMention;
    }
    if (Array.isArray(r)) {
        return r;
    }
    return [ r ];
}

sendMessage = async (data, channel, cfgMention) => {
    if (data.type == TERRITORY_CHANNEL) {
        var embed = createTerritoryEmbed(data);
        var content = createTerritoryContent(data);
    } else if (data.type == GENERAL_EVENTS) {
        var embed = createEventEmbed(data);
        var content = createEventContent(data);
    } else if (data.type == SCHEDULED_EVENTS) {
        var embed = null;
        var content = createScheduledEventContent(data);
    }
    const roles = getMentions(data, cfgMention).map(r => asRole(r)).join(' ') + getRoles(channel, data);
    if (embed) {
        return channel.send({ embeds: [ embed ], content: content + roles }).catch((e) => logger.error(e));    
    }
    return channel.send({ content: content + roles }).catch((e) => logger.error(e));
}

generateSchedule = async (client) => {
    const query = {
        start: { $gt: DateTime.utc().toJSDate(), $lte: DateTime.utc().plus({hours: 24}).toJSDate()},
        notified: false,
        eventId: null,
        type: 'territory'
    }
    const events = await db.calendar.findBy(query);
    events.forEach((item) => {
        scheduleEvent(client.client.guilds.cache.get(item.guild), item.summary, '', 'general', DateTime.fromJSDate(item.start), item.duration, item.location).then((event) => {
            logger.info("Scheduled event", event.id);
            db.calendar.updateOne(item._id, { eventId: event.id });
        })
    })
}

module.exports = {
    getRoles,
	async execute(client, number) {
        db.calendar.readEvents({minutes: number}).then(events => {
            logger.info("Found events", events);
            events.forEach(e => {
                if (e.channel) {
                    const channel = client.client.guilds.cache.get(e.guild).channels.cache.get(e.channel);
                    if (channel) {
                        sendMessage(e, channel, null).then(() => {
                            logger.debug("Mark event", JSON.stringify(e));
                            db.calendar.updateEvent(e);
                        });
                    } else {
                        logger.error("No channel found on guild %s with id %s", e.guild, e.channel);
                    }
                } else {
                    db.config.findOne(e.guild, e.type).then(cfg => {
                        if (cfg) {
                            logger.debug(cfg);
                            const channel = client.client.guilds.cache.get(cfg.guild).channels.cache.get(cfg.channel);
                            if (channel) sendMessage(e, channel, cfg.mention).then(() => {
                                                        logger.debug("Mark event", e);
                                                        db.calendar.updateEvent(e);
                                                    });
                        } else {
                            logger.error("No default channel defined for %s on guild %s with id %s", e.type, e.guild, e.channel);
                        }
                    })
                }
            });
        });
        generateSchedule(client);
	}
};