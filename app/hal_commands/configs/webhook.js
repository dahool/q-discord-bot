const cs = require('../../values')
const { validateHookUrl } = require('../../functions/hooksender');

const CHANNEL_ID = /<#(\d+)+>/;

function extract_id(regex, str) {
	const m = regex.exec(str);
	if (m) {
		return m[++m.index];
	}
	return null;
}

module.exports = {
	name: 'relay',
	aliases: ['broadcast'],
    description: 'Add Webhook broadcast',
	usage: '#channel_name webhook_url',
    async execute(configDb, cmd, message, params) {
		const guild = message.guild.id;

		const channel = params.shift();
		const url = params.shift();

		if (channel && url) {
			const channelId = extract_id(CHANNEL_ID, channel);
			if (channelId == null) {
				return message.reply(`Invalid argument \`${channel}\`. Specify a valid channel.`);
			}
			
			if (!validateHookUrl(url)) {
				return message.reply(`Invalid discord weebhook url \`${url}\`.`);
			}

			const hooks = (await configDb.findOneBy({guild: guild, uuid: cs.WEEBHOOK, channel: channelId})) || { url: []};
			hooks.url.push(url);
			configDb.pushBy({guild: guild, uuid: cs.WEEBHOOK, channel: channelId}, hooks);

			return {message: this.description, log: true, fields: [{ name: 'Channel', value : '<#' + channelId + '>'}, { name: 'URL', value : url}]}
		}

		return message.reply('Missing required arguments');	
    },
};

