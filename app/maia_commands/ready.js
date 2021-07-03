module.exports = {
	name: 'ready',
	description: 'My status',
	execute(client, message, args) {
		message.channel.send('Ready. Type !maia for help');
	},
};