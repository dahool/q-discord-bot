const { Events } = require('discord.js');
const { db } = require('../db/db');
const { THREAD_FOLLOWER } = require("../values");

module.exports = {
	name: Events.ThreadCreate,
	once: false,
	execute(client, thread, isNew) {
		if (isNew && thread.invitable == null && thread.parentId) {
			const guild = thread.guild;
			db.config.findOneBy({guild: thread.guildId, uuid: THREAD_FOLLOWER, channel: thread.parentId}).then(async cfg => {
				if (cfg) {
					const channel = guild.channels.cache.get(thread.parentId);
					for (const [id, member] of channel.members) {
						if (!member.user.bot) await thread.members.add(id);
					}
				}
			})
		}

	}
};

