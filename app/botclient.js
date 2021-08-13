const dotenv = require('dotenv');
dotenv.config();

const fs = require('fs');
const Discord = require('discord.js');
const { Client, Intents } = require('discord.js');

const { ConfigDb, LoggerDb } = require('./db/db');

const { safeTrim } = require('./utils');

const CHANNEL_ID = /<#(\d+)+>/;
const ROLE_ID = /<@&(\d+)+>/;
const USER_ID = /<@!(\d+)+>/;

const INTENTS = [
	Intents.FLAGS.GUILDS,
	Intents.FLAGS.GUILD_PRESENCES,
	Intents.FLAGS.GUILD_MEMBERS,
	Intents.FLAGS.GUILD_MESSAGES,
	Intents.FLAGS.GUILD_WEBHOOKS,
	Intents.FLAGS.DIRECT_MESSAGES
]

function extract_id(regex, str) {
	const m = regex.exec(str);
	if (m) {
		return m[++m.index];
	}
	return null;
}

class BotClient {
	
	constructor(client, message, member, guild, channel, connectionManager, isAdmin, isManager, interaction) {
		this.client = client;
		this.interaction = interaction;
		this.connection = connectionManager;
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
		const r = new Discord.MessageEmbed(embed);
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
		embed.fields.forEach((field) => {
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
		response.push(current);

		return response;
	}

	_createMessage(response, hidden = false) {
		if (response instanceof Discord.MessageEmbed) {
			// check size and split if necessary
			// even with multiple embeds, limit is still 6000 for the whole
			return this._splitEmbed(response).map((r) => { return {embeds: [ r ], ephemeral: hidden} });
		}
		return [{content: response, ephemeral: hidden}];
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
		r.catch(() => this._reply("Sorry Commander, you have to allow me to send you PMs"))
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

	reply = async (response, hidden = false) => {
		const r = this._createMessage(response, hidden)
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
		return Promise.all(this._createMessage(response).map(r => channel.send(r)));
	}

	clear = () => {
		if (this.channel.type != "DM" && !this.interaction) this.message.delete().catch((e) => true );
	}

}

class BotCommander {
	
	constructor(connectionManager, options) {
		this.client = new Client({ intents: INTENTS, partials: ['CHANNEL']});

		this.connectionManager = connectionManager;
		this.client.commands = new Discord.Collection();
		this.options = Object.assign({commandsDir: null, prefix: '!'}, options)
		this._initialize();
	}

	_initialize = () => {
		this.client.once('ready', async () => {
			if (this.options.activity) {
				this.client.user.setActivity(this.options.activity.message, { type: this.options.activity.type });
			}
			
			this.commandsData.forEach(cmd => {
				this._getApp().commands.post({data: cmd});	
			})

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
			if (!interaction.isCommand()) return;

			const member = interaction.member;
			const command = interaction.commandName;
			const channel = interaction.channel;
			const guild = interaction.guild;

			this.invokeCommand(interaction, null, command, {}, new Discord.GuildMember(this.client, member, guild), guild, channel);
		});

		this._prepareCommands();
	}

	// execution by interaction
	// args: interaction.options
	// options: command.options
	_parseOptions = (args, options) => {
		const parsed = {};
		options.forEach((option) => {
			if (option.type == 1) {
				if (args.getSubcommand() == option.name) {
					if (option.options) {
						parsed[option.name] = this._parseOptions(args, option.options);
					} else {
						parsed[option.name] = {};
					}
				}
			} else if (option.type == 2) {
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
			if (option.type == 1 || option.type == 2) {
				if (args[argIndex] == option.name) {
					if (option.options) {
						parsed[option.name] = this._parseArguments(args.slice(argIndex+1), option.options)
					} else {
						parsed[option.name] = {};
					}
				}
			} else {
				if (args[argIndex]) {
					let value;
					if (argIndex == options.length-1) {
						value = args.slice(argIndex).join(' ');
					} else {
						value = safeTrim(args[argIndex]);
					}
					if (option.type == 7) {
						const id = extract_id(CHANNEL_ID, value);
						if (!id) throw 'Invalid channel ' + value
						value = id;
					} else if (option.type == 8) {
						const id = extract_id(ROLE_ID, value);
						if (!id) throw 'Invalid role ' + value
						value = id;
					} else if (option.type == 6) {
						const id = extract_id(USER_ID, value);
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

		const roles = (await this.configDb.findOne(guild.id, "roles", "roles")) || [];
		const isAdmin = member.permissions.has(['ADMINISTRATOR','MANAGE_GUILD','MANAGE_ROLES']);
		const isManager = isAdmin || member.roles.cache.some( r => roles.includes(r.id) );

    	console.debug("Command: " + commandName +  " - IsManager: " + isManager);

		const bc = new BotClient(this.client, message, member, guild, channel, this.connectionManager, isAdmin, isManager, interaction);

		if (channel.type == "DM" && command.dm === false) {
			return bc.reply("Sorry, can't process in DM");
		}
		
		if ((command.admin || command.permission) && !(isAdmin || member.permissions.has(command.permission || []))) {
			return bc.reply("Sorry, you don't have enough permissions to execute this command.");
		}
	
		if (command.private && !isManager) {
			return bc.reply("Sorry, you don't have enough permissions to execute this command.");	
		}
	
		if (command.options) {
			if (interaction) {
				args = this._parseOptions(interaction.options, command.options);
			} else {
				try {
					args = this._parseArguments(args, command.singleOptions || command.options);
				} catch (e) {
					let reply = `Error, ${e}`;
					return bc.reply(reply);
				}
			}
		}

		console.debug(args);
		
		try {
			command.execute(bc, args);
			//bc.clear();
		} catch (error) {
			console.error(error);
			this.loggerDb.error(error);
		}
		
	}

	_prepareCommands = () => {
		if (this.options.commandsDir) {
			const cmdDir = this.options.commandsDir;
			const commandFiles = fs.readdirSync(cmdDir).filter(file => file.endsWith('.js'));

			this.commandsData = [];
			for (const file of commandFiles) {
				const command = require(`${cmdDir}/${file}`);
				this.client.commands.set(command.name, command);
				if (command.slash === true) {
					this.commandsData.push({name: command.slashName || command.name, description: command.description, options: command.options || []});
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
		this.configDb = new ConfigDb(this.connectionManager);
		this.loggerDb = new LoggerDb(this.connectionManager);
		return this.client.login(tokenId);
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