module.exports = {
	name: 'rollcall',
	description: 'Roll Call',
	execute(client, message, args) {
		message.channel.send('Ready. Type !help for more');
	},
};