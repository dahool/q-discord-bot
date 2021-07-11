
const Discord = require("discord.js");
const { DateTime } = require("luxon");
const { ConfigDb, CalendarDb } = require("../db/db");
const cs = require('../values')

const { randomColor } = require('../utils')

const MENTION_REX = /@([\w]+)/gm;

createMessage = (data) => {
    let startTime;
    if (data.start instanceof Date) {
        startTime = DateTime.fromJSDate(data.start).setLocale('en');
    } else {
        startTime = DateTime.fromISO(data.start).setLocale('en');
    }
    const estTime = startTime.setZone('America/New_York').toFormat('h:mma ZZZZ');
    const cstTime = startTime.setZone('America/Chicago').toFormat('h:mma ZZZZ');
    const pstTime = startTime.setZone('America/Los_Angeles').toFormat('h:mma ZZZZ');
    const mstTime = startTime.setZone('America/Denver').toFormat('h:mma ZZZZ');

    const message = new Discord.MessageEmbed()
        .setColor(randomColor())
        .setTitle(data.summary)
        .setURL('https://zoner.netlify.app/?t=' + startTime.setZone('UTC').toFormat('Hmm'))
        .setDescription(data.description || ' ')
        .setThumbnail('https://www.dropbox.com/s/6jzlixqvk4nhpg9/redalert.gif?raw=1')
        .addFields(
            { name: 'Zone', value: data.location },
            { name: 'Starts at', value: '`' + pstTime + '` - `' + mstTime + '` - `' + cstTime + '` - `' + estTime + '`', inline: true });
    
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
                    roles.push(`<@&${role.id}>`);
                }
            });
            
        }
    }
    return roles.join(' ');
}

sendMessage = async (mention, channel, message) => {
    return channel.send({ embed: message, content: '@here ' + mention.map(r => '<@&' + r + '>').join(' ') + getRoles(channel, message) });
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
                        const channel = client.guilds.cache.get(e.guild).channels.cache.get(cfg.channel);
                        if (channel) sendMessage(cfg.mention || [], channel, createMessage(e));
                    }
                })
            });
        })

	},
};