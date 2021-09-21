const dotenv = require('dotenv');
dotenv.config();

const { playerQueue, MusicSubscription, MusicTrack, connectToChannel } = require('./player')
const { Permissions } = require('discord.js');

const ytdl = require("ytdl-core");
const YouTube = require("discord-youtube-api");

module.exports = {
	name: 'play',
	description: 'Adds a song to the queue',
	dm: false,
	slash: true,
	options: [{
		name: 'song',
		description: 'Song',
		type: 3,
		required: true
	}],
	async execute(client, args) {
		//console.log(client.member.voice);
		const voiceChannel = client.member.voice.channel;
		if (!voiceChannel) {
			return client.reply('You have to join a voice channel to play music')
		}
		
		if (!client.guild.me.permissionsIn(voiceChannel).has([Permissions.FLAGS.CONNECT, Permissions.FLAGS.SPEAK])) {
			return client.reply(`I don't have permissions to speak in <#${voiceChannel.id}>`);
		}

		const youtube = new YouTube(process.env.YOUTUBE_API);

		client.reply(":mag: searching `" + args.song + "`");

		const videoUrl = await youtube.searchVideos(args.song);
		
		let songInfo;
		try {
			songInfo = await ytdl.getInfo(videoUrl.url);	
		} catch (error) {
			return client.reply("I couldn't find `" + args.song + "`");
		}

		if (!songInfo) {
			return client.reply("I couldn't find `" + args.song + "`");
		}

		//console.log(songInfo);

		const track = new MusicTrack(
			songInfo.videoDetails.video_url,
			songInfo.videoDetails.title,
			songInfo.videoDetails.lengthSeconds,
			client.member);
		//client.reply("Found `" + song.title + "`")

		const serverQueue = playerQueue.get(client.guild.id);
		if (!serverQueue) {
			try {
				const connection = await connectToChannel(voiceChannel);
				const queue = new MusicSubscription(client.channel, connection);
				playerQueue.set(client.guild.id, queue);
				queue.enqueue(track);
				client.edit(":musical_note: Queued `" + track.title + "`");			
				//client.reply(":sound: joined <#" + voiceChannel.id + ">")
			} catch (err) {
				console.log(err);
				playerQueue.delete(client.guild.id);
				return client.reply('Error ' + err);
			}
		} else {
			serverQueue.enqueue(track);
			client.edit(":musical_note: `" + track.title + "` added to queue");			
		}

	}
};