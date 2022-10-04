const { db } = require('../../db/db');

getOrUpdate = async (client, key, description, args) => {
    console.log(client);
    const guild = client.guild.id;
    if ('set' in args) {
        const id = args['set']['channel']
        if (id == null) {
            return client.reply(`Missing argument. Specify a valid channel.`);
        }
        const r = await client.testChannel(client.guild.channels.cache.get(id));
        if (!r) {
            return client.reply(`I require permissions to read/write/manage in <#${id}>`);
        }
        await db.config.push(guild, key, {'channel': id});
        return {message: 'Updated ' + description, fields: [{ name: 'Channel', value : '<#' + id + '>'}], log: true};
    } else {
        const value = await db.config.findOne(guild, key, 'channel');
        if (value) {
            return {message: description, fields: [{ name: 'Channel', value : '<#' + value + '>'}]}
        } else {
            return client.reply(`No config defined for **${description}**`);
        }
    }
}

module.exports = {
	getOrUpdate
}

