module.exports = {
	name: 'ready',
	aliases: ['help'],
	slash: true,
	description: 'About me',
	execute(client, args) {
		return client.reply("I'm ready mon capitaine. Type !q for help");
	},
};