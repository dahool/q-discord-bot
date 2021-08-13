const cs = require('../../values')
const { validateHookUrl } = require('../../functions/hooksender');

module.exports = {
	name: 'relay',
	description: 'Webhook Channel Broadcast',
	options: [
		{
			name: 'add',
			description: 'Add Broadcast',
			type: 1,
			options: [
				{
					name: 'channel',
					description: 'Channel',
					type: 7,
					required: true
				},
				{
					name: 'url',
					description: 'Discord Webhook URL',
					type: 3,
					required: true
				}				
			]
		},
		{
			name: 'get',
			description: 'List Channel Broadcast',
			type: 1,
			options: [
				{
					name: 'channel',
					description: 'Channel',
					type: 7,
					required: true
				}
			]			
		},
		{
			name: 'clear',
			description: 'Clear Channel Broadcast',
			type: 1,
			options: [
				{
					name: 'channel',
					description: 'Channel',
					type: 7,
					required: true
				}
			]			
		},		
	],
	usage: '<add/get/clear> <channel>',
    async execute(configDb, client, args) {
		const guild = client.guild.id;

		if ('add' in args) {
			const channelId = args.add.channel;
			const url = args.add.url;

			if (!validateHookUrl(url)) {
				return client.reply(`Invalid discord weebhook url \`${url}\`.`);
			}

			const hooks = (await configDb.findOneBy({guild: guild, uuid: cs.WEEBHOOK, channel: channelId})) || { url: []};
			hooks.url.push(url);
			configDb.pushBy({guild: guild, uuid: cs.WEEBHOOK, channel: channelId}, hooks);

			return {message: this.description, log: true, fields: [{ name: 'Add Channel', value : '<#' + channelId + '>'}, { name: 'URL', value : url}]}
		} else if ('get' in args) {
			const channelId = args.get.channel;
			const hooks = (await configDb.findOneBy({guild: guild, uuid: cs.WEEBHOOK, channel: channelId})) || { url: []};

			if (hooks?.url.length > 0) {
				return {message: this.description, log: false, fields: [{ name: 'Channel', value : '<#' + channelId + '>'}, { name: 'URL', value : hooks.url.join('\n')}]}
			} else {
				return {message: this.description, log: false, fields: [{ name: 'Channel', value : '<#' + channelId + '>'}, { name: 'URL', value : '`<< None defined >>`'}]}
			}
		} else if ('clear' in args) {
			const channelId = args.clear.channel;
			configDb.deleteBy({guild: guild, uuid: cs.WEEBHOOK, channel: channelId});
			return {message: this.description, log: true, fields: [{ name: 'Channel', value : '<#' + channelId + '>'}, { name: 'URL', value : '`<< Cleared >>`'}]}
		}

		return client.reply('Unknown command');	
    },
};

