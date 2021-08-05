module.exports = {
	name: 'ready',
	aliases: ['help'],
	slash: true,
	description: 'My status',
	execute(client, args) {
		return client.reply('Ready. Type !hal for help');
	},
};