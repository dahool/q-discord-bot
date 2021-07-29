module.exports = {
	name: 'ready',
	aliases: ['help'],
	slash: true,
	description: 'My status',
	execute(client, args) {
		client.reply('Ready. Type !hal for help');
	},
};