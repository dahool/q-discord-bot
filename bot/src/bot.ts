import { Routes } from "discord-api-types/v10";
import { ActivityType, ApplicationCommandOptionType, BaseInteraction, Client, Collection, CommandInteractionOptionResolver, Events, GatewayIntentBits, Partials, PermissionFlagsBits, REST } from "discord.js";
import { application } from "./app";
import { CommandMetadata } from "./common/decorators";
import { DiscordCommand } from "./common/schemas";
import { safeTrim } from "./common/utils";
import { logger } from "./logging/logger";

const REST_VERSION = '10';

const DEFAULT_INTENTS = [
	GatewayIntentBits.Guilds,
	GatewayIntentBits.GuildPresences,
	GatewayIntentBits.GuildMembers,
	GatewayIntentBits.GuildMessages,
	GatewayIntentBits.GuildWebhooks,
	GatewayIntentBits.DirectMessages,
	GatewayIntentBits.MessageContent,
	GatewayIntentBits.GuildScheduledEvents
]

export interface ActivityOps {
    message: string;
    type: ActivityType;
    url?: string;
}

export class BotCommander {

    client: Client;
    options?: ActivityOps;

    intentsList = new Set<GatewayIntentBits>(DEFAULT_INTENTS);
    commandsDefinition: any[] = [];
    commands = new Collection<string, DiscordCommand>();

    name: string;

    ready = false;

    discordToken!: string;

    defaultGuild?: string;

    constructor(name: string, guild?: string, ops?: ActivityOps) {
        this._initialize();
        this.options = ops;
        this.defaultGuild = guild;
        this.name = name;
        this.client = new Client({ intents: [...this.intentsList], partials: [Partials.Channel]});
        this._registerClientEvents();
    }   
    
    login(token: string): Promise<void> {
        this.discordToken = token;
        logger.debug("Login");
        return new Promise(resolve => {
            this.client.login(token).then(() => {
                resolve();
            });
        })        
    }

	stop(): Promise<void> {
		if (this.client) return this.client.destroy();
		return Promise.resolve();
	}
    
    _initialize() {
        this._prepareCommands();
        this._prepareListeners();
    }

    _registerClientEvents() {
        
        this.client.once(Events.ClientReady, async () => {
			if (this.options) {
				this.client.user!.setActivity(this.options.message, { type: this.options.type });
			}
			this._registerAppCommands();
			this.ready = true;
            logger.info(`${this.name} online`)
		});

		this.client.on(Events.InteractionCreate, async (interaction) => {
            this._invokeCommand(interaction)
		});

		for (const anEvent of application.getListeners()) {
            const attrs = anEvent.attrs;
			logger.debug("Register %s [%s]", anEvent.instance, attrs.event);
			if (Array.isArray(attrs.event)) {
				attrs.event.forEach(atrEvent => {
					if (attrs.once === true) {
						this.client.once(atrEvent, (...args) => anEvent.instance.onEvent(this.client, ...args));
					} else {
						this.client.on(atrEvent, (...args) => anEvent.instance.onEvent(this.client, ...args));
					}
				})
			} else {
				if (attrs.once === true) {
					this.client.once(attrs.event, (...args) => anEvent.instance.onEvent(this.client, ...args));
				} else {
					this.client.on(attrs.event, (...args) => anEvent.instance.onEvent(this.client, ...args));
				}
			}


		}

    }

    _prepareListeners() {
        logger.debug("PrepareListeners: %O", application.getListeners());
		for (const anEvent of application.getListeners()) {
            const attrs = anEvent.attrs;
            if (attrs.requiresIntents) {
                attrs.requiresIntents.forEach(i => this.intentsList.add(i));
            }
		}
    }

    _prepareCommands() {
        logger.debug("PrepareCommands: %O", application.getCommands());
        for (const aCommand of application.getCommands()) {
            const attrs = aCommand.attrs;
            if (attrs.requiresIntents) {
                attrs.requiresIntents.forEach(i => this.intentsList.add(i));
            }
            this.commands.set(attrs.name, aCommand.instance);
            this.commandsDefinition.push({
                name: attrs.name,
                description: attrs.description,
                options: attrs.options || [],
				type: attrs.type,
				default_member_permissions: attrs.defaultPermissions != undefined ? attrs.defaultPermissions.toString() : PermissionFlagsBits.UseApplicationCommands.toString()
            })
        }
    }
    
	async _cleanCommands(): Promise<any> {
		let currentCommandList = (await this.client.application!.commands.fetch())
                                    .filter((c) => !this.commandsDefinition.some((ca) => ca.name == c.name));
        const clientId = this.client.user?.id!;
		if (currentCommandList.size > 0) {
			logger.debug("Remove %s", JSON.stringify(currentCommandList))
			const rest = new REST({ version: REST_VERSION }).setToken(this.discordToken);
			return Promise.all(
				currentCommandList.map(c => {
					return new Promise<void>((resolve) => {
                        let route;
                        if (this.defaultGuild) {
                            route = Routes.applicationGuildCommand(clientId, this.defaultGuild, c.id);
                        } else {
                            route = Routes.applicationCommand(clientId, c.id);
                        }
						rest.delete(route)
							.then(() => logger.debug("Removed command %s name %s", c.id, c.name))
							.catch((e) => {
								logger.error("Error removing command %s name %s", c.id, c.name, e);
								console.error(e);
							})
							.finally(() => resolve());
					});
				})
			)
		}
	}

	_registerAppCommands(): Promise<void> {
		const rest = new REST({ version: REST_VERSION }).setToken(this.discordToken);

		let route;
		const clientId = this.client.user?.id!;
		if (this.defaultGuild) {
			logger.info("RUNNING IN TEST MODE");
			route = Routes.applicationGuildCommands(clientId, this.defaultGuild);
		} else {
			route = Routes.applicationCommands(clientId);
		}

		logger.debug("Commands for %s: %s", this.name, JSON.stringify(this.commandsDefinition));

		return rest.put(route, { body: this.commandsDefinition }).then(() => {
			logger.debug("Commands registered");
		}).catch((e) => {
			logger.error(e);
		});
	}

    /**
     * parse interactions options for easier use
     */
	_parseOptions(interactionOptions: Omit<CommandInteractionOptionResolver, 'getMessage' | 'getFocused'>, commandOptions: any[]): any {
		const parsed: any = {};
		
		if (commandOptions == undefined) return parsed;

		commandOptions.forEach((option: any) => {
			if (option.type === ApplicationCommandOptionType.Subcommand) {
				if (interactionOptions.getSubcommand() == option.name) {
					if (option.options) {
						parsed[option.name] = this._parseOptions(interactionOptions, option.options);
					} else {
						parsed[option.name] = {};
					}
				}
			} else if (option.type === ApplicationCommandOptionType.SubcommandGroup) {
				if (interactionOptions.getSubcommandGroup() == option.name) {
					if (option.options) {
						parsed[option.name] = this._parseOptions(interactionOptions, option.options);
					} else {
						parsed[option.name] = {};
					}
				}
			} else {
                if (option.type === ApplicationCommandOptionType.Boolean) {
                    parsed[option.name] = interactionOptions.getBoolean(option.name);
                } else {
                    parsed[option.name] = safeTrim(interactionOptions.get(option.name, option.required)?.value)
                }
			}
		})
		return parsed;
	}

    _invokeCommand(interaction: BaseInteraction) {
		logger.info("Received interaction %O", interaction);

        let commandName;
        if (interaction.isCommand()) {
            commandName = interaction.commandName;
        } else if (interaction.isMessageComponent()) {
            commandName = interaction.message.interaction?.commandName;
        }

        if (!commandName) return;

        const command = this.commands.get(commandName);

		if (!command) return;
/*
		const isAdmin = interaction.memberPermissions?.has([PermissionsBitField.Flags.Administrator, PermissionsBitField.Flags.ManageGuild]);

		if ((command.admin && !isAdmin) || (command.permission && !member.permissions.has(command.permission || []))) {
			return bc.reply(MESSAGES.denied);
		}
*/
		if (interaction.isChatInputCommand()) {
			const args = this._parseOptions(interaction.options, Reflect.getMetadata(CommandMetadata, Object.getPrototypeOf(command)).options);
			logger.debug("Calling %s with args %s", commandName, args);
			command.run(this.client, interaction, args);
		} else {
			logger.debug("Calling %s", commandName);
			command.run(this.client, interaction, {});
		}		

/*
        if (!interaction && !command.plain === true) return;

		const roles = (await db.config.findOne(guild.id, "roles", "roles")) || [];

		const isManager = isAdmin || member.roles.cache.some( r => roles.includes(r.id) );
		
    	logger.debug("Command: " + commandName +  " - IsManager: " + isManager);

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

		logger.debug(args);
		
		try {
			command.execute(bc, args);
		} catch (error) {
			bc.reply(MESSAGES.error);
			logger.error(error);
		}
		*/
	}


}


/*
const botclient = new BotCommander(INTENTS,
	{name: 'Q', 
	commandsDir: `${__dirname}/commands`,
	eventsDir: `${__dirname}/events`,
	prefix: prefix,
	activity: {
		message: 'you',
		type: 'WATCHING',
		url: process.env.DASHBOARD_URL
	}
})
*/
/*
console.log("Bot is starting...");

const client = new Client({
    intents: []
});

client.login(environment.discord.token);

console.log(client); */