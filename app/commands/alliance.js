const Discord = require('discord.js');
const { ApplicationCommandOptionType } = require('discord.js');

const { DateTime } = require('luxon');
const { statusKey } = require('../config.json');
const db = require('../db/db');
const { StringBuilder, asTimeFormat } = require('../utils');

module.exports = {
	name: `alliance`,
	description: `Alliance information`,
	aliases: ['status'],
    dm: false,
    slash: true,
    options: [{
		name: 'tag',
		description: 'Alliance Tag',
		type: ApplicationCommandOptionType.String,
		required: true
	}],
	async execute(client, args) {
        const allianceDB = new db.AllianceDb(client.connection);
        try {
            var tag = args.tag.toUpperCase();
            var allianceInfo = await allianceDB.findOne(client.guild.id, tag);
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

                if (allianceInfo.roe !== undefined) {
                    allianceInfo.roe.sort((a,b) => b.time - a.time).forEach((eventInfo) => {
                        const b = new StringBuilder();
                        b.append('Recorded by: <@' + eventInfo.officer + '>\n')
                        b.append(asTimeFormat(DateTime.fromJSDate(eventInfo.time)))
                        b.append('\nReason: ' + eventInfo.reason)
                        const status = eventInfo.type || eventInfo.status
                        eventEmbed.push({ 
                            name: `ROE Incident`, 
                            value: b.toString()
                        });
                    })                    
                } else {
                    eventEmbed.push({ name: 'ROE Incident', value: `There are no recorded ROE incidents associated with this alliance.` });
                }
                eventEmbed.push({ name: '\u200B', value: '\u200B' });
                
                var eventList = allianceInfo.events;
                if (eventList !== undefined) {
                    eventList.sort((a,b) => b.time - a.time).forEach((eventInfo) => {
                        const b = new StringBuilder();
                        b.append('Recorded by: <@' + eventInfo.officer + '> | Status: *' + eventInfo.status + '*' + '\n')
                        b.append(asTimeFormat(DateTime.fromJSDate(eventInfo.time)))
                        if (eventInfo.reason) b.append('\nReason: ' + eventInfo.reason)

                        const status = eventInfo.type || eventInfo.status
                        eventEmbed.push({ 
                            name: `Event: *${status}*`, 
                            value: b.toString()
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

            const msgEmbed = new Discord.EmbedBuilder()
                .setColor(`#${status.color}`)
                .setTitle(`The ${tag} Alliance is listed as: **${status.name}**.`)
                .setThumbnail(status.image)
                .setDescription(`${allowance}`)
                .addFields(
                    eventEmbed
                )
                .setTimestamp()
                .setFooter({text: `!alliance ${tag} • Requested by ${client.member.user.username}`, iconURL: client.member.user.displayAvatarURL()});

            client.sendMessage(msgEmbed);
        }
        catch (err) {
            console.log(err);
        }
	}
};