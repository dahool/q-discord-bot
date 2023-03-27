const fs = require('fs');
const Discord = require('discord.js');

const { Client, PermissionsBitField, Partials, ChannelType, ApplicationCommandOptionType } = require('discord.js');

const { safeTrim, extract_channel, extract_role, extract_user } = require('../utils');
const { MESSAGES } = require('../messages');
const { db } = require('../db/db');
const { BotClient } = require('./botclient')

const REST_VERSION = '10';

class BotCommander {
	
	constructor(intents, options) {
		this.client = new Client({ intents: intents, partials: 	[Partials.Channel]});
		this.client.commands = new Discord.Collection();
		this.options = Object.assign({commandsDir: null, prefix: '!'}, options)
		this._initialize();
	}

	async _cleanUnusedCommands(route) {
		var currentCommandList = await this.client.application.commands.fetch();
		currentCommandList = currentCommandList.filter((c) => !this.commandsData.some((ca) => ca.name == c.name));
		
		if (currentCommandList.size > 0) {
			console.log("Remove %s", JSON.stringify(currentCommandList))
			const rest = new Discord.REST({ version: REST_VERSION }).setToken(this.tokenId);
			return Promise.all(
				currentCommandList.map(c => {
					return new Promise((resolve) => {
						rest.delete(route + `/${c.id}`)
							.then(() => console.log(`Removed ${c.id} ${c.name}`))
							.catch((e) => {
								console.error(`Error removing ${c.id} ${c.name}`);
								console.error(e);
							})
							.finally(() => resolve());
					});
				})
			)
		}
	}

	async _registerAppCommands() {
		const rest = new Discord.REST({ version: REST_VERSION }).setToken(this.tokenId);
	
		let route;
		const clientId = this.client.user.id;
		if (process.env.TEST_SERVER) {
			route = Discord.Routes.applicationGuildCommands(clientId, process.env.TEST_SERVER);
			//await this._cleanUnusedCommands(route);
		} else {
			route = Discord.Routes.applicationCommands(clientId);
            //await this._cleanUnusedCommands(route);
		}

		console.log("Commands for %s: %s", this.options.name, JSON.stringify(this.commandsData));

		rest.put(route, { body: this.commandsData }).then(() => {
			console.log("Commands registered")
		}).catch((e) => {
			console.error(e);
		});

	}

	_initialize = () => {
		this.client.once('ready', async () => {
			if (this.options.activity) {
				this.client.user.setActivity(this.options.activity.message, { type: this.options.activity.type });
			}
			this._registerAppCommands();
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
			
            console.log(interaction);

            if (interaction.isCommand()) {
				const member = interaction.member;
				const command = interaction.commandName;
				const channel = interaction.channel;
				const guild = interaction.guild;
	
				this.invokeCommand(interaction, null, command, {}, member, guild, channel);
			
            } else if (interaction.isButton()) {

				const command = this._getInteractionCommand(interaction);
				if (!command) return;
				const bc = new BotClient(this.client, null, interaction.member, interaction.guild, interaction.channel, false, false, interaction);
				command.interaction(bc, interaction.customId);

			} else if (interaction.isStringSelectMenu()) {
				const command = this._getInteractionCommand(interaction);
				if (!command) return;
				const bc = new BotClient(this.client, null, interaction.member, interaction.guild, interaction.channel, false, false, interaction);
				command.interaction(bc, interaction.customId, interaction.values);
            }

		});

		this._prepareCommands();
	}

    _getInteractionCommand(interaction) {
        const command = this.client.commands.get(interaction.message.interaction.commandName)
        if (!command) {
            console.log(interaction);
            console.error("Command " + interaction.commandName + " not found.")
            return;
        }
        return command;
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
                if (option.type === ApplicationCommandOptionType.Boolean) {
                    parsed[option.name] = args.getBoolean(option.name);
                } else {
                    parsed[option.name] = safeTrim(args.get(option.name, option.required)?.value)
                }
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

        // now on message commands are not supported by default
        if (!interaction && !command.plain === true) return;

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
                    this.commandsData.push({name: command.slashName || command.name, description: command.description, options: command.options || []});
				}
			}
		}
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