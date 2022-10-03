const fs = require('fs');
const Discord = require('discord.js');

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');

const { Client, PermissionsBitField, Partials, ChannelType, ApplicationCommandOptionType, GuildMemberManager } = require('discord.js');

const { safeTrim, extract_channel, extract_role, extract_user } = require('./utils');
const { MESSAGES } = require('./messages');
const REST_VERSION = '10';
const { db } = require('./db/db');

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
		if (this._replyOnce) {
			return this.interaction.followUp(response);
		}
		this._replyOnce = true;
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

	reply = async (response, hidden = false, components = []) => {
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
				if (this.interaction && !this._replyOnce) {
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

}

class BotCommander {
	
	constructor(intents, options) {
		this.client = new Client({ intents: intents, partials: 	[Partials.Channel]});
		this.client.commands = new Discord.Collection();
		this.options = Object.assign({commandsDir: null, prefix: '!'}, options)
		this._initialize();
	}

	async _cleanUnusedCommands(route) {
		const cmdList = await this._getApp().commands.get();
		cmdList.filter((c) => this.commandsData.includes((ca) => ca.name == c.name));
		
		if (cmdList.length > 0) {
			console.log("Remove %s", JSON.stringify(cmdList))
			const rest = new REST({ version: REST_VERSION }).setToken(this.tokenId);
			cmdList.forEach(c => {
				rest.delete(route + `/${c.id}`).then(() => console.log(`Removed ${c.id} ${c.name}`))
				.catch((e) => console.error(e));
			})
		}
		
	}

	async _registerAppCommands() {
		const rest = new REST({ version: REST_VERSION }).setToken(this.tokenId);
	
		let route;
		const clientId = this.client.user.id;
		if (process.env.TEST_SERVER) {
			route = Routes.applicationGuildCommands(clientId, process.env.TEST_SERVER);
		} else {
			route = Routes.applicationCommands(clientId);
			if (process.env.CLEAN_COMMANDS === true) this._cleanUnusedCommands(route);
		}

		console.log("Commands for %s: %s", this.options.name, JSON.stringify(this.commandsData));

		rest.put(route, { body: this.commandsData },
		).then(() => {
			console.log("Commands registered")
		}).catch((e) => {
			console.error(e);
		});

		/*this._getApp().commands.get().then((r) => {
			console.log(r);
		})*/
	}

	_initialize = () => {
		this.client.once('ready', async () => {
			if (this.options.activity) {
				this.client.user.setActivity(this.options.activity.message, { type: this.options.activity.type });
			}

			this._registerAppCommands();
			/*this.commandsData.forEach(cmd => {
				this._getApp().commands.post({data: cmd});	
			})*/
			this.ready = true;
			console.log((this.options.name || 'Bot') + ' online');
		});

		this.client.on('messageCreate', message => {
			if (!message.content.startsWith(this.options.prefix) || message.author.bot || message.mentions.everyone) return;
			const args = message.content.slice(this.options.prefix.length).split(/ +/);
			const commandName = args.shift().toLowerCase();
			this.invokeCommand(null, message, commandName, args, message.member, message.guild, message.channel);
		})

		this.client.on("interactionCreate", async (interaction) => {
			if (interaction.isCommand()) {
				const member = interaction.member;
				const command = interaction.commandName;
				const channel = interaction.channel;
				const guild = interaction.guild;
	
				this.invokeCommand(interaction, null, command, {}, member, guild, channel);
				//invokeCommand = async (interaction, message, commandName, args, member, guild, channel) => {
			} else if (interaction.isButton()) {
				const command = this.client.commands.get(interaction.message.interaction.commandName) 
				if (!command) {
					console.log(interaction);
					console.error("Command " + interaction.commandName + " not found.")
					return;
				}
				const bc = new BotClient(this.client, null, interaction.member, interaction.guild, interaction.channel, false, false, interaction);
				command.interaction(bc, interaction.customId);
			}
		});

		this._prepareCommands();
	}

	// execution by interaction
	// args: interaction.options
	// options: command.options
	_parseOptions = (args, options) => {
		const parsed = {};
		options.forEach((option) => {
			if (option.type === ApplicationCommandOptionType.Subcommand) {
				if (args.getSubcommand() == option.name) {
					if (option.options) {
						parsed[option.name] = this._parseOptions(args, option.options);
					} else {
						parsed[option.name] = {};
					}
				}
			} else if (option.type === ApplicationCommandOptionType.SubcommandGroup) {
				if (args.getSubcommandGroup() == option.name) {
					if (option.options) {
						parsed[option.name] = this._parseOptions(args, option.options);
					} else {
						parsed[option.name] = {};
					}
				}
			} else {
				parsed[option.name] = safeTrim(args.get(option.name, option.required)?.value)
			}
		})
		return parsed;
	}

	// execution by message
	// args: message arguments
	// options: command.options	
	_parseArguments = (args, options) => {
		const parsed = {};
		let argIndex = 0;
		options.forEach((option, index) => {
			if (option.type == ApplicationCommandOptionType.Subcommand || option.type == ApplicationCommandOptionType.SubcommandGroup) {
				if (args[argIndex] == option.name) {
					if (option.options) {
						parsed[option.name] = this._parseArguments(args.slice(argIndex+1), option.options)
					} else {
						parsed[option.name] = {};
					}
				}
			} else {
				console.log(option);
				if (args[argIndex]) {
					let value;
					if (argIndex == options.length-1) {
						value = args.slice(argIndex).join(' ');
					} else {
						value = safeTrim(args[argIndex]);
					}
					if (option.type === ApplicationCommandOptionType.Channel) {
						const id = extract_channel(value);
						if (!id) throw 'Invalid channel ' + value
						value = id;
					} else if (option.type === ApplicationCommandOptionType.Role) {
						const id = extract_role(value);
						if (!id) throw 'Invalid role ' + value
						value = id;
					} else if (option.type === ApplicationCommandOptionType.User) {
						const id = extract_user(value);
						if (!id) throw 'Invalid user ' + value
						value = id;
					}
					parsed[option.name] = value;
				} else if (option.required) {
					throw 'Missing ' + option.description || option.name
				}
				argIndex++;
			}
		})
		return parsed;
	}

	invokeCommand = async (interaction, message, commandName, args, member, guild, channel) => {

		console.log("interaction %s, message %s, commandName %s, args %s, member %s, guild %s, channel %s", interaction, message, commandName, args, member, guild, channel);

		const command = this.client.commands.get(commandName) 
			|| this.client.commands.find(cmd => (interaction && cmd.slashName == commandName) || (!interaction && cmd.aliases && cmd.aliases.includes(commandName)));

		if (!command) return;

		const roles = (await db.config.findOne(guild.id, "roles", "roles")) || [];
		const isAdmin = member.permissions.has([PermissionsBitField.Flags.Administrator, PermissionsBitField.Flags.ManageGuild]);
		const isManager = isAdmin || member.roles.cache.some( r => roles.includes(r.id) );
		
    	console.debug("Command: " + commandName +  " - IsManager: " + isManager);

		const bc = new BotClient(this.client, message, member, guild, channel, isAdmin, isManager, interaction);

		if (channel.type === ChannelType.DM && command.dm === false) {
			return bc.reply(MESSAGES.denied_dm);
		}
		
		if ((command.admin && !isAdmin) || (command.permission && !member.permissions.has(command.permission || []))) {
			return bc.reply(MESSAGES.denied);
		}
	
		if (command.private && !isManager) {
			return bc.reply(MESSAGES.denied);	
		}
	
		if (command.options) {
			if (interaction) {
				args = this._parseOptions(interaction.options, command.options);
			} else {
				try {
					args = this._parseArguments(args, command.singleOptions || command.options);
				} catch (e) {
					let reply = MESSAGES.invalid + e;
					return bc.reply(reply);
				}
			}
		}

		console.debug(args);
		
		try {
			command.execute(bc, args);
			//bc.clear();
		} catch (error) {
			bc.reply(MESSAGES.error);
			console.error(error);
			db.logger.error(error);
		}
		
	}

	_prepareCommands = () => {
		if (this.options.commandsDir) {
			const cmdDir = this.options.commandsDir;
			const commandFiles = fs.readdirSync(cmdDir).filter(file => file.endsWith('.js'));

			this.commandsData = [];
			for (const file of commandFiles) {
				const command = require(`${cmdDir}/${file}`);
				if (command.name) {
					this.client.commands.set(command.name, command);
					if (command.slash === true) {
						this.commandsData.push({name: command.slashName || command.name, description: command.description, options: command.options || []});
					}
				}
			}
		}
	}

	_getApp = () => {
		const app = this.client.api.applications(this.client.user.id)
		if (process.env.TEST_SERVER) {
			app.guilds(process.env.TEST_SERVER)
		}
		return app;
	}
	
	login = (tokenId) => {
		this.tokenId = tokenId;
		return this.client.login(tokenId);
	}

	stop = () => {
		this.client.destroy();
	}

	on = (event, callback) => {
		this.client.on(event, callback);
	}

	once = (event, callback) => {
		this.client.once(event, callback);
	}
}

module.exports = {
    BotCommander
};