const Discord = require("discord.js");

const { randomColor } = require('../utils')

const HOOK_REX = /\/webhooks\/(?<ID>[^\/]+)\/(?<TOKEN>[^\/]+)/;

validateHookUrl = (url) => {
    return (ma = url.match(HOOK_REX)) != undefined;
}

sendMessage = async (message, target) => {

    const embed = new Discord.MessageEmbed()
        .setColor('#f31515')
        .setURL(`https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`)
        //.setThumbnail(message.channel.guild.iconURL())
        .setDescription(message.content)
        .setAuthor(message.author.displayName || message.author.username, message.author.displayAvatarURL())
        .setTimestamp();

    target.forEach(url => {
        const ma = url.match(HOOK_REX);
        if (ma) {
            const client = new Discord.WebhookClient(ma.groups.ID, ma.groups.TOKEN);
            client.send({
                username: message.guild.name,
                avatarURL: message.channel.guild.iconURL(),
                embeds: [embed]
            })            
        }
    });

}

module.exports = { sendMessage, validateHookUrl };