const { db } = require('../db/db');

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
		db.member.update(client.guild.id, client.member.id, {phone: args.argument})
		await client.reply('Thank you mon capitaine, your contact information has been updated.', true);
		client.clear();
	},
};