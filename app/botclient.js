const dotenv = require('dotenv');
dotenv.config();

const fs = require('fs');
const Discord = require('discord.js');

const { ConfigDb, LoggerDb } = require('./db/db');

const CHANNEL_ID = /<#(\d+)+>/;
const ROLE_ID = /<@&(\d+)+>/;
const USER_ID = /<@!(\d+)+>/;

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
		this._replyOnce = false;
	}

	_reply = async (response) => {

		this._replyOnce = true;

		let data = {
			content: response
		}

		if (typeof response === 'object') {
			data = await this._createAPIMessage(response);
		}

		this.client.api.interactions(this.interaction.id, this.interaction.token).callback.post({
			data: {
				type: 4, 
				data
			}
		})
	}

	_createAPIMessage = async (content) => {
		const { data, files } = await Discord.APIMessage.create(this.channel, content)
			.resolveData()
			.resolveFiles();

		return {...data, files}
	}

	reply = (response) => {
		if (this.interaction) {
			if (this._replyOnce) {
				this._replyChannel(response);
			} else {
				this._reply(response);
			}
		} else {
			this.message.reply(response).then(() => {
				if (this.channel.type != "dm") this.message.delete()
			});
		}
	}

	sendMessage = (response) => {
		if (this.interaction) {
			if (this._replyOnce) {
				this._replyChannel(response);
			} else {
				this._reply(response);
			}
		} else {
			this._replyChannel(response).then(() => {
				if (this.channel.type != "dm") this.message.delete()	
			});
		}
	}

	_replyChannel = async (response) => {
		return this.channel.send(response);
	}

}

class BotCommander {
	
	constructor(client, connectionManager, options) {
		this.connectionManager = connectionManager;
		this.client = client;
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

		this.client.on('message', message => {
			if (!message.content.startsWith(this.options.prefix) || message.author.bot || message.mentions.everyone) return;
			const args = message.content.slice(this.options.prefix.length).split(/ +/);
			const commandName = args.shift().toLowerCase();
			this.invokeCommand(null, message, commandName, args, message.member, message.guild, message.channel);
		})

		this.client.ws.on("INTERACTION_CREATE", async (interaction) => {
			const { member, data, guild_id, channel_id, message } = interaction;
			const { name, options } = data;
	
			const command = name.toLowerCase();
			const guild = this.client.guilds.cache.get(guild_id);

			const args = this._recurseOptions(options);

			//console.log(JSON.stringify(args));

			const channel = guild?.channels.cache.get(channel_id);
			this.invokeCommand(interaction, null, command, args, new Discord.GuildMember(this.client, member, guild), guild, channel);
		});

		this._prepareCommands();
	}

	_recurseOptions = (ops) => {
		const args = {}
		if (ops) {
			for (const option of ops) {
				const { name, value, type, options } = option;
				if (!value && (type == 1 || type == 2) ) {
					args[name] = this._recurseOptions(options);
				} else {
					args[name] = value;
				}
			}
		}
		return args;
	}

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
						value = args[argIndex];
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

		const command = this.client.commands.get(commandName) 
			|| this.client.commands.find(cmd => (interaction && cmd.slashName == commandName) || (!interaction && cmd.aliases && cmd.aliases.includes(commandName)));

		if (!command) return;

		const roles = (await this.configDb.findOne(guild.id, "roles", "roles")) || [];
		const isAdmin = member.hasPermission(['ADMINISTRATOR','MANAGE_GUILD','MANAGE_ROLES']);
		const isManager = isAdmin || member.roles.cache.some( r => roles.includes(r.id) );

    	console.debug("Command: " + commandName +  " - IsManager: " + isManager);

		const bc = new BotClient(this.client, message, member, guild, channel, this.connectionManager, isAdmin, isManager, interaction);

		if (channel.type == "dm" && command.dm === false) {
			return bc.reply("Sorry, can't process in DM");
		}
		
		if ((command.admin || command.permission) && !(isAdmin || member.hasPermission(command.permission || []))) {
			return bc.reply("Sorry, you don't have enough permissions to execute this command.");	
		}
	
		if (command.private && !isManager) {
			return bc.reply("Sorry, you don't have enough permissions to execute this command.");	
		}
	
		if (!interaction && command.options) {
			try {
				args = this._parseArguments(args, command.singleOptions || command.options);
			} catch (e) {
				let reply = `Error, ${e}`;
				return bc.reply(reply);
			}
		}

		console.debug(args);
		
		try {
			return command.execute(bc, args);
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

}

module.exports = {
    BotCommander
};