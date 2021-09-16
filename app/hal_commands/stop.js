const { playerQueue, MusicSubscription, MusicTrack, connectToChannel } = require('./player')
const { Permissions } = require('discord.js');

module.exports = {
	name: 'stop',
	description: 'Stop playing',
	dm: false,
	slash: true,
	async execute(client, args) {
		const voiceChannel = client.member.voice.channel;
		if (!voiceChannel) {
			return client.reply('You have to join a voice channel')
		}

		const serverQueue = playerQueue.get(client.guild.id);
		if (!serverQueue) {
			return client.reply("I'm not currently playing anything")
		}

		serverQueue.stop();

		return client.reply("Stopped")
	}
};