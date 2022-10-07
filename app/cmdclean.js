require('dotenv').config()
const Discord = require('discord.js');

const { Client, GatewayIntentBits, Partials, ChannelType, ApplicationCommandOptionType } = require('discord.js');

const REST_VERSION = '10';
const TOKEN = process.env.PROD_TOKEN;

const INTENTS = [
	GatewayIntentBits.Guilds,
	GatewayIntentBits.GuildPresences,
	GatewayIntentBits.GuildMembers,
	GatewayIntentBits.GuildMessages,
	GatewayIntentBits.GuildWebhooks,
	GatewayIntentBits.DirectMessages,
	GatewayIntentBits.MessageContent
]

cleanCommands = async (client) => {

    const clientId = client.user.id;
    const route = Discord.Routes.applicationCommands(clientId);

    console.log("Fetch commands...")
    var currentCommandList = await client.application.commands.fetch();
    console.log("Found commands: " + JSON.stringify(currentCommandList));

    if (currentCommandList.size > 0) {
        const rest = new Discord.REST({ version: REST_VERSION }).setToken(TOKEN);
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

console.log("Logging in...")
const client = new Client({ intents: INTENTS, partials: [Partials.Channel]});
client.login(TOKEN).then(() => {
    console.log("Logged in.")
    cleanCommands(client).then(() => {
        client.destroy();
    });
});