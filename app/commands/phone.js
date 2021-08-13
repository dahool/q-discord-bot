const db = require('../db/db');

module.exports = {
	name: 'phone',
	slash: true,
	options: [{
		name: 'argument',
		description: 'Phone number (enter 0 to clear)',
		type: 3,
		required: true
	}],
	description: 'Update contact info',
	async execute(client, args) {
		const memberDb = new db.MembersDb(client.connection);
		memberDb.update(client.guild.id, client.member.id, {phone: args.argument})
		await client.reply('Thank you commander, your contact information has been updated.', true);
		client.clear();
	},
};