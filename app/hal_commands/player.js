const playerQueue = new Map();
const ytdl = require('ytdl-core');
const { MessageEmbed } = require('discord.js');
const { Duration } = require('luxon');
const { setTimeout } = require('timers');
const { promisify } = require('util');
const wait = promisify(setTimeout);

const { AudioPlayer,
  AudioPlayerStatus,
  AudioResource,
  createAudioPlayer,
  entersState,
  VoiceConnection,
  VoiceConnectionDisconnectReason,
  VoiceConnectionStatus,
  createAudioResource,
  joinVoiceChannel,
  demuxProbe,
  StreamType
} = require('@discordjs/voice');


async function connectToChannel(channel) {
  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator,
  });
  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
    console.log("Connected " + channel.name);
    return connection;
  } catch (error) {
    connection.destroy();
    throw error;
  }
}

class MusicTrack {

  constructor(url, title, duration, member) {
    this.url = url;
    this.title = title;
    this.duration = duration;
    this.member = member;
  }

  createAudioResource() {
    const stream = ytdl(this.url, {
      filter: 'audio',
      quality: 'highestaudio',
      highWaterMark: 1 << 25
    });
    return createAudioResource(stream, {
      inputType: StreamType.Arbitrary
    });
	}

}

class MusicSubscription {

  constructor(textChannel, connection) {
    this.voiceConnection = connection;
    this.audioPlayer = createAudioPlayer();
    this.textChannel = textChannel;
    this.queue = [];
    this.queueLock = false;
    this.readyLock = false;
    this.nowPlaying = null;

    this.setupPlayer();
  }

  setupPlayer() {
    this.voiceConnection.on('stateChange', async (_, newState) => {

      if (newState.status === VoiceConnectionStatus.Disconnected) {
        if (newState.reason === VoiceConnectionDisconnectReason.WebSocketClose && newState.closeCode === 4014) {
          /*
            If the WebSocket closed with a 4014 code, this means that we should not manually attempt to reconnect,
            but there is a chance the connection will recover itself if the reason of the disconnect was due to
            switching voice channels. This is also the same code for the bot being kicked from the voice channel,
            so we allow 5 seconds to figure out which scenario it is. If the bot has been kicked, we should destroy
            the voice connection.
          */
          try {
            await entersState(this.voiceConnection, VoiceConnectionStatus.Connecting, 5_000);
            // Probably moved voice channel
          } catch {
            this.voiceConnection.destroy();
            // Probably removed from voice channel
          }
        } else if (this.voiceConnection.rejoinAttempts < 5) {
          /*
            The disconnect in this case is recoverable, and we also have <5 repeated attempts so we will reconnect.
          */
          await wait((this.voiceConnection.rejoinAttempts + 1) * 5_000);
          this.voiceConnection.rejoin();
        } else {
          /*
            The disconnect in this case may be recoverable, but we have no more remaining attempts - destroy.
          */
          this.voiceConnection.destroy();
        }
      } else if (newState.status === VoiceConnectionStatus.Destroyed) {
        /*
          Once destroyed, stop the subscription
        */
        this.stop();
      } else if (
        !this.readyLock &&
        (newState.status === VoiceConnectionStatus.Connecting || newState.status === VoiceConnectionStatus.Signalling)
      ) {
        /*
          In the Signalling or Connecting states, we set a 20 second time limit for the connection to become ready
          before destroying the voice connection. This stops the voice connection permanently existing in one of these
          states.
        */
        this.readyLock = true;
        try {
          await entersState(this.voiceConnection, VoiceConnectionStatus.Ready, 20_000);
        } catch {
          if (this.voiceConnection.state.status !== VoiceConnectionStatus.Destroyed) this.voiceConnection.destroy();
        } finally {
          this.readyLock = false;
        }
      }

    })

    // Configure audio player
    this.audioPlayer.on('stateChange', (oldState, newState) => {
      if (newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
        // If the Idle state is entered from a non-Idle state, it means that an audio resource has finished playing.
        // The queue is then processed to start playing the next track, if one is available.
        this.nowPlaying = null;
        if (this.queue.length === 0) {
          playerQueue.delete(this.textChannel.guildId);
          if (this.voiceConnection.state.status !== VoiceConnectionStatus.Destroyed) {
            this.voiceConnection.destroy();
          }
        } else {
          this.processQueue();
        }
      } else if (newState.status === AudioPlayerStatus.Playing) {
        // If the Playing state has been entered, then a new track has started playback.
        const playingEmbed = new MessageEmbed()
          .setURL(this.nowPlaying.url)
          .setTitle(this.nowPlaying.title)
          .setDescription(":notes: Now playing")
          .setColor('#ff0000')
          .addField('Duration', Duration.fromObject({seconds:this.nowPlaying.duration}).toFormat('mm:ss'))
          .setFooter(`Requested by ${this.nowPlaying.member.user.username}`, this.nowPlaying.member.user.displayAvatarURL());
        this.textChannel.send({ embeds: [playingEmbed] });
      }
    });

    this.audioPlayer.on('error', (error) => error.resource.metadata.onError(error));

		this.voiceConnection.subscribe(this.audioPlayer);
  }

  enqueue(track) {
		this.queue.push(track);
		this.processQueue();
	}

  stop() {
		this.queueLock = true;
		this.queue = [];
		this.audioPlayer.stop(true);
    this.queueLock = false;
	}

  skip() {
    this.audioPlayer.stop(true);
  }

  async processQueue() {
		// If the queue is locked (already being processed), is empty, or the audio player is already playing something, return
		if (this.queueLock || this.audioPlayer.state.status !== AudioPlayerStatus.Idle || this.queue.length === 0) {
			return;
		}
		// Lock the queue to guarantee safe access
		this.queueLock = true;

		// Take the first item from the queue. This is guaranteed to exist due to the non-empty check above.
		const nextTrack = this.queue.shift();
		try {
			// Attempt to convert the Track into an AudioResource (i.e. start streaming the video)
			const resource = nextTrack.createAudioResource();
      this.nowPlaying = nextTrack;
			this.audioPlayer.play(resource);
      //this.textChannel.send([{content: ":notes: playing `" + song.title + "`"}]);
			this.queueLock = false;
		} catch (error) {
			// If an error occurred, try the next item of the queue instead
			console.log(error);
			this.queueLock = false;
			return this.processQueue();
		}
	}

}

module.exports = {
  playerQueue,
  MusicSubscription,
  MusicTrack,
  connectToChannel
};
