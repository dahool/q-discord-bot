const { Events } = require('discord.js');
const { db } = require('../db/db');
const { THREAD_ANNOUNCER } = require("../values");
const format = require("string-template");
const { asChannel } = require('../utils');

module.exports = {
	name: Events.ThreadCreate,
	once: false,
	execute(client, thread, isNew) {

		if (isNew && thread.parentId) {
			const guild = thread.guild;
			db.config.findBy({guild: thread.guildId, channel: thread.parentId, uuid: THREAD_ANNOUNCER}).then(cfgs => {
				cfgs.forEach((cfg) => {
					const channel = guild.channels.cache.get(cfg.channelPost);
					const data = {
						channel: asChannel(cfg.channel),
						title: asChannel(thread.id),
						user: guild.members.cache.get(thread.ownerId)
					}
					channel.send(format(cfg.message, data));
				})
			})
		}

	}
};

