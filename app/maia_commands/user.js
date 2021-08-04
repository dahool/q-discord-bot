const db = require('../db/db');
const { DateTime } = require('luxon');
const utils = require('../utils');
const Discord = require('discord.js');

displayName = (member) => {
	if (member.nickname && member.nickname != null) {
		return member.nickname;
	}
	return member.user.username
}

module.exports = {
	name: 'user',
	slash: true,
	private: true,
	options: [{
		name: 'user',
		description: 'User',
		type: 6,
		required: true
	}],
	description: 'Get user profile',
	async execute(client, args) {
		const memberDb = new db.MembersDb(client.connection);
		const member = await memberDb.findOneBy({ gid: args.user, guild: client.guild.id })

		if (member) {
			const msgEmbed = new Discord.MessageEmbed()
			.setColor(utils.randomColor())
			.setTitle(`${member.displayName || member.userName}`)
			.setDescription('User Profile')
			.setThumbnail(client.guild.iconURL())
			.addFields({
				name: ':hourglass_flowing_sand: Last online', value: DateTime.fromJSDate(member.lastOnline).setLocale('en').toRelative()
			})
			.setTimestamp();

			if (member.phone && member.phone != '0') {
				msgEmbed.addField(":telephone: Contact number", member.phone);
			}

			client.member.send(msgEmbed);
			client.reply('Commander, the information has been sent to your inbox');
		} else {
			const u = client.guild.members.cache.get(args.user);
			client.reply("Sorry Commander, I don't have information for the user " + displayName(u));
		}
	},
};