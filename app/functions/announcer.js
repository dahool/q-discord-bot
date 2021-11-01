
const Discord = require("discord.js");
const { DateTime } = require("luxon");
const { ConfigDb, CalendarDb } = require("../db/db");
const cs = require('../values')

const { randomColor, asRole, asTimeRelative } = require('../utils')

const MENTION_REX = /@([\w]+)/gm;

createMessage = (data) => {
    let startTime;
    if (data.start instanceof Date) {
        startTime = DateTime.fromJSDate(data.start).setLocale('en');
    } else {
        startTime = DateTime.fromISO(data.start).setLocale('en');
    }
    /*const estTime = startTime.setZone('America/New_York').toFormat('h:mma ZZZZ');
    const cstTime = startTime.setZone('America/Chicago').toFormat('h:mma ZZZZ');
    const pstTime = startTime.setZone('America/Los_Angeles').toFormat('h:mma ZZZZ');
    const mstTime = startTime.setZone('America/Denver').toFormat('h:mma ZZZZ');*/

    /*const message = new Discord.MessageEmbed()
        .setColor(randomColor())
        .setTitle(data.summary)
        .setURL('https://www.timeanddate.com/countdown/generic?p0=1440&iso=' + startTime.setZone('UTC').toISO() + "&msg=" + encodeURIComponent(data.summary))
        .setDescription(data.description || ' ')
        .setThumbnail('https://www.dropbox.com/s/6jzlixqvk4nhpg9/redalert.gif?raw=1')
        .addFields(
            { name: 'Zone', value: data.location },
            { name: 'Starts at', value: '`' + pstTime + '` - `' + mstTime + '` - `' + cstTime + '` - `' + estTime + '`', inline: true });
    */

    const message = new Discord.MessageEmbed()
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
    if (message.description != '') {
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
	async execute(client, connection, number) {
        const config = new ConfigDb(connection);
        const calendar = new CalendarDb(connection);
        
        calendar.readEvents({minutes: number}, true).then(events => {
            console.log(events);
            events.forEach(e => {
                config.findOne(e.guild, e.type).then(cfg => {
                    if (cfg) {
                        console.log(cfg);
                        const channel = client.client.guilds.cache.get(cfg.guild).channels.cache.get(cfg.channel);
                        if (channel) sendMessage(e.summary, (e.mentions && e.mentions.length > 0 ? e.mentions : cfg.mention) || [], channel, createMessage(e));
                    }
                })
            });
        })
	}
};