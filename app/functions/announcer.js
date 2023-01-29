
const Discord = require("discord.js");
const { json } = require("express/lib/response");
const { DateTime } = require("luxon");
const { db } = require('../db/db');

const { randomColor, asRole, asTimeRelative } = require('../utils');
const { TERRITORY_CHANNEL, GENERAL_EVENTS } = require("../values");

const MENTION_REX = /@([\w]+)/gm;

createTerritoryContent = (data) => {
    return data.summary  + ' [' + data.location + ']';
}

createTerritoryEmbed = (data) => {
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
        .setDescription(data.description || ' ')
        .setThumbnail('https://www.dropbox.com/s/6jzlixqvk4nhpg9/redalert.gif?raw=1')
        .addFields(
            { name: 'Zone', value: data.location },
            { name: 'Starts', value: asTimeRelative(startTime), inline: true });

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
    return data.summary;
}

getRoles = (channel, message) => {
    let roles = [];
    if (message.description && message.description != '') {
        const m = message.description.match(MENTION_REX);
        if (m) {
            m.forEach(v => {
                let role = channel.guild.roles.cache.find(r => r.name === v.substring(1));
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
    }
    const roles = getMentions(data, cfgMention).map(r => asRole(r)).join(' ') + getRoles(channel, embed);
    return channel.send({ embeds: [ embed ], content: content + ' @here ' + roles }).catch((e) => console.error(e));
}

module.exports = {
	async execute(client, number) {
        db.calendar.readEvents({minutes: number}).then(events => {
            console.log(events);
            db.logger.info("Found events " + JSON.stringify(events), "announcer")
            events.forEach(e => {
                if (e.channel) {
                    const channel = client.client.guilds.cache.get(e.guild).channels.cache.get(e.channel);
                    if (channel) {
                        sendMessage(e, channel, null).then(() => {
                            console.debug("Mark event " + e);
                            db.calendar.updateEvent(e);
                        });
                    } else {
                        db.logger.error("No channel found on guild " + e.guild + " with id " + e.channel, "announcer");
                    }
                } else {
                    db.config.findOne(e.guild, e.type).then(cfg => {
                        if (cfg) {
                            console.log(cfg);
                            const channel = client.client.guilds.cache.get(cfg.guild).channels.cache.get(cfg.channel);
                            if (channel) sendMessage(e, channel, cfg.mention).then(() => {
                                                        console.debug("Mark event " + e);
                                                        db.calendar.updateEvent(e);
                                                    });
                        } else {
                            db.logger.error("No default channel defined for " + e.type + " on guild " + e.guild, "announcer");
                        }
                    })
                }
            });
        })
	}
};