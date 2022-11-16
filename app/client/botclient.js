const Discord = require('discord.js');
const { PermissionsBitField, ChannelType } = require('discord.js');
const { MESSAGES } = require('../messages');

class BotClient {
	
	constructor(client, message, member, guild, channel, isAdmin, isManager, interaction) {
		this.client = client;
		this.interaction = interaction;
		this.member = member;
		this.guild = guild;
		this.channel = channel;
		this.message = message;
		this.isAdmin = isAdmin;
		this.isManager = isManager;
		this._firstReplyMsg = false;
		this._replyOnce = false;
	}
	
	_cloneEmbed(embed) {
		const r = Discord.EmbedBuilder.from(embed.toJSON());
		r.setFields([]);
		return r;
	}

	_splitEmbed(embed) {
		const response = [];

		const generalFields = [embed.title, embed.description, embed.url, embed.footer?.text, embed.author?.name]
		const generalSize = generalFields.reduce((total, current) => {
			if (current != undefined) return total + current.length
			return total;
		}, 0);

		let current = this._cloneEmbed(embed);

		let size = generalSize;
		console.log(embed);
		if (embed.data.fields) {
			embed.data.fields.forEach((field) => {
				const s = field.name.length + field.value.length;
				size += s;
				if (size < 5900) {
					current.addFields([ field ]);
				} else {
					response.push(current);
					size = generalSize;
					current = this._cloneEmbed(embed);
				}
			})
		}
		response.push(current);

		return response;
	}

	_createMessage(response, hidden = false, components = []) {
		if (response instanceof Discord.EmbedBuilder) {
			// check size and split if necessary
			// even with multiple embeds, limit is still 6000 for the whole
			return this._splitEmbed(response).map((r) => { return {embeds: [ r ], ephemeral: hidden, components: components} });
		} else if (response.hasOwnProperty('content')) {
			return [response];
		}
		return [{content: response, ephemeral: hidden, components: components}];
	}

	_reply_interaction = async (response) => {
		if (this.interaction.deferred || this.interaction.replied) {
			return this.interaction.followUp(response);
		}
		return this.interaction.reply(response);
	}

	_reply = async (response) => {
		if (response.ephemeral) return this.dm(response);
		const r = this.message.reply(response);
		r.then(m => {
			if (!this._firstReplyMsg) this._firstReplyMsg = m; 
		});
		return r;
	}

	_replyChannel = async (response) => {
		if (response.ephemeral) return this.dm(response);
		const r = this.channel.send(response);
		r.then(m => {
			if (!this._firstReplyMsg) this._firstReplyMsg = m; 
		});
		r.catch((e) => console.error(e));
		return r;
	}

	_edit = async (response, doReply) => {
		if (this.interaction) {
			return this.interaction.editReply(response);
		} else {
			if (this._firstReplyMsg) {
				await this._firstReplyMsg.delete().catch((e) => console.error(e));
			}
			if (doReply) {
				return this._reply(response);
			}
			return this._replyChannel(response);
		}
	}

	dm = async(response) => {
		const r = this.member.send(response);
		r.catch(() => this._reply(MESSAGES.permission_dm))
		return r;
	}
/*
	edit = async (response, doReply = false) => {
		// edit first message, and add follow up if necessary
		const msgs = this._createMessage(response);
		const r = [ this._edit(msgs[0], doReply) ];
		r.concat(msgs.slice(1).map((msg) => {
			if (this.interaction) {
				return this._reply_interaction(msg);
			}
			return this._reply(msg);
		}))
		return Promise.all(r);
	}
*/
    // all replies are hidden by default
	reply = async (response, hidden = true, components = []) => {
		const r = this._createMessage(response, hidden, components)
			.map((msg) => {
				if (this.interaction) {
					return this._reply_interaction(msg);
				}
				return this._reply(msg);
			});
		return Promise.all(r);
	}

	sendMessage = async (response, hidden = false) => {
		const r = this._createMessage(response, hidden)
			.map((msg) => {
				if (this.interaction) {
					return this._reply_interaction(msg);
				} else {
					return this._replyChannel(msg);
				}
			});
		return Promise.all(r);
	}

	sendTo = async(channel, response) => {
		return Promise.all(this._createMessage(response).map(r => channel.send(r).catch((e) => console.error(e))));
	}

	testChannel = async(channel) => {
		return (await this.guild.members.fetchMe()).permissionsIn(channel).has([PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageMessages])
	}
	
	clear = () => {
		if (this.channel.type !== ChannelType.DM && !this.interaction) this.message.delete().catch((e) => true );
	}

	defer = () => {
		return this.interaction.deferReply();
	}

}

module.exports = { BotClient };