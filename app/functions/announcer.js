
const Discord = require("discord.js");
const { DateTime } = require("luxon");
const { db } = require('../db/db');

const { randomColor, asRole, asTimeRelative } = require('../utils')

const MENTION_REX = /@([\w]+)/gm;

createMessage = (data) => {
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

sendMessage = async (text, mention, channel, message) => {
    return channel.send({ embeds: [ message ], content: text + ' @here ' + mention.map(r => asRole(r)).join(' ') + getRoles(channel, message) }).catch((e) => console.error(e));
}


module.exports = {
	async execute(client, number) {
        db.calendar.readEvents({minutes: number}, true).then(events => {
            console.log(events);
            events.forEach(e => {
                db.config.findOne(e.guild, e.type).then(cfg => {
                    if (cfg) {
                        console.log(cfg);
                        const channel = client.client.guilds.cache.get(cfg.guild).channels.cache.get(cfg.channel);
                        if (channel) sendMessage(e.summary  + ' [' + e.location + ']', (e.mentions && e.mentions.length > 0 ? e.mentions : cfg.mention) || [], channel, createMessage(e));
                    }
                })
            });
        })
	}
};