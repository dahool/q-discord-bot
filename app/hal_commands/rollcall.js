module.exports = {
	name: 'rollcall',
	description: 'Roll Call',
	dm: true,
	execute(client, message, args) {
		message.channel.send('Watching.');
	},
};