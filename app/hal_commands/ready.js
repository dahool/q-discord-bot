module.exports = {
	name: 'ready',
	slash: true,
	description: 'My status',
	execute(client, args) {
		client.reply('Ready. Type !hal for help');
	},
};