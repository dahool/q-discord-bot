const Discord = require('discord.js');
const { DateTime } = require('luxon');
const { statusKey } = require('../config.json');
const db = require('../db/db');

module.exports = {
	name: `alliance`,
	description: `Alliance information`,
	aliases: ['status'],
    args: true,
    dm: false,
    usage: '<TAG>',
	async execute(client, message, args) {
        const allianceDB = new db.AllianceDb(this.conn);
        try {
            var tag = args[0].toUpperCase().slice(0, 4);
            var allianceInfo = await allianceDB.findOne(message.channel.guild.id, tag);
            var status = statusKey.NEUTRAL;
            var allowance = "";
            var eventEmbed = [];
            if (allianceInfo !== undefined) {
                if (allianceInfo.status) {
                    switch (allianceInfo.status) {
                        case statusKey.ALLIED.name:
                            status = statusKey.ALLIED;
                            break;
                        case statusKey.FRIENDLY.name:
                            status = statusKey.FRIENDLY;
                            break;
                        case statusKey.ENEMY.name:
                            status = statusKey.ENEMY;
                            break;
                        case statusKey.HOSTILE.name:
                            status = statusKey.HOSTILE;
                            break;
                        default:
                            status = statusKey.NEUTRAL;
                    }
                }
                var eventList = allianceInfo.events;
                if (eventList !== undefined) {
                    eventList.sort((a,b) => b.time - a.time).forEach((eventInfo) => {
                        eventEmbed.push({ 
                            name: `Event: *${eventInfo.status}*`, 
                            value: 'Recorded by: <@' + eventInfo.officer + '> | Status: *' + eventInfo.status + '*' + '\n' + DateTime.fromJSDate(eventInfo.time).toFormat("LLL d, yyyy @ h:mm a ZZZZ") + '\nReason: ' + eventInfo.reason
                        });
                    })
                } else {
                    eventEmbed.push({ name: 'Events', value: `There are no recorded events associated with this alliance.` });
                };
            } else {
                eventEmbed.push({ name: 'Events', value: `There are no recorded events associated with this alliance.` });
            }

            if (status.name == statusKey.ALLIED.name) {
                allowance = `We are allied with ${tag}. You may not attack their members for *any* reason. When they call for aid, we will respond.`;
            } else if (status.name == statusKey.ENEMY.name) {
                allowance = `RoE is **NOT** applicable to ${tag}. This alliance is KoS (Kill on Sight). Seek and **destroy**.`;
            } else if (status.name == statusKey.HOSTILE.name) {
                allowance = `Heavy RoE applicable to ${tag}. Players are encouraged to kill all warships. Don't hit UPC miners.`;
            } else if (status.name == statusKey.FRIENDLY.name) {
                allowance = `Non-aggression pact with ${tag}. Follow friendly RoE with members of this alliance.`;
            } else {
                allowance = `Normal RoE applies to members of the ${tag} alliance`;
            }

            const msgEmbed = new Discord.MessageEmbed()
                .setColor(`#${status.color}`)
                .setTitle(`The ${tag} Alliance is listed as: **${status.name}**.`)
                .setThumbnail(status.image)
                .setDescription(`${allowance}`)
                .addFields(
                    eventEmbed
                )
                .setTimestamp()
                .setFooter(`!alliance ${args[0]} • Requested by ${message.author.username}`, `${message.author.displayAvatarURL()}`);
            message.channel.send(msgEmbed);
        }
        catch (err) {
            console.log(err);
        }
	}
};