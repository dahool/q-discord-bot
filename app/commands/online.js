const { DateTime } = require('luxon');
const db = require('../db/db');

module.exports = {
	name: 'online',
	description: 'List last online date for each member',
	dm: false,
	slash: false,
	private: true,
	async execute(client, args) {
		const memberDb = new db.MembersDb(client.connection);
		let content = [];
		var list = await memberDb.findBy({ guild: client.guild.id })
		list.sort((a, b) => b.lastOnline - a.lastOnline).forEach((member) => {
			const time = DateTime.fromJSDate(member.lastOnline).setLocale('en').toRelative();
			content.push("> " + member.displayName || member.userName + " \u0009 `" + time + "`");
		});

		let groups = [''];
		content.reduce((key, curr, index) => {
			if (groups[key].length + curr.length < 1900) {
				groups[key] += '\n' + curr;
			} else {
				key++;
				groups.push(curr);
			}
			return key;
		}, 0)  

		await client.reply('Mon capitaine, information as requested...' + groups[0]);
		groups.slice(1).forEach((m) => {
			client.reply(m);
		})
		
	}
};
