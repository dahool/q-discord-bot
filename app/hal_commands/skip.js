const { playerQueue, MusicSubscription, MusicTrack, connectToChannel } = require('./player')
const { Permissions } = require('discord.js');

module.exports = {
	name: 'skip',
	description: 'Skip current track',
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

		if (serverQueue.queue.length > 0) {
			client.reply("Playing next track")
			serverQueue.skip();
			return;
		}

		return client.reply("There are no enqueued tracks")
	}
};