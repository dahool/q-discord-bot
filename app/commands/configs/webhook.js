const cs = require('../../values')
const { validateHookUrl } = require('../../functions/hooksender');

module.exports = {
	name: 'relay',
	description: 'Webhook Channel Broadcast',
	options: [
		{
			name: 'list',
			description: 'List All Channel Broadcast',
			type: 1
		},
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
				},
				{
					name: 'name',
					description: 'Name',
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
			name: 'delete',
			description: 'Delete Channel Broadcast',
			type: 1,
			options: [
				{
					name: 'channel',
					description: 'Channel',
					type: 7,
					required: true
				},
				{
					name: 'name',
					description: 'Name',
					type: 3,
					required: true
				}				
			]			
		},		
		{
			name: 'clear',
			description: 'Clear Channel Broadcasts',
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
	usage: '<add/get/delete/clear/list> <channel> <name> <url>',
    async execute(configDb, client, args) {
		const guild = client.guild.id;

		if ('add' in args) {
			const channelId = args.add.channel;
			const url = args.add.url;
			const name = args.add.name;

			if (!validateHookUrl(url)) {
				return client.reply(`Invalid discord WEBHOOK url \`${url}\`.`);
			}

			configDb.pushBy({guild: guild, uuid: cs.WEBHOOK, channel: channelId, name: name}, {url: url});

			return {message: this.description, log: true, fields: [{ name: 'Add Channel', value : '<#' + channelId + '>'}, { name: 'Name', value : name}, { name: 'URL', value : url}]}
		} else if ('get' in args) {
			const channelId = args.get.channel;
			const hooks = await configDb.findBy({guild: guild, uuid: cs.WEBHOOK, channel: channelId});

			const fields = [];
			if (hooks?.length > 0) {
				hooks.forEach(hook => {
					fields.push({ name: 'Channel', value : '<#' + hook.channel + '>', inline: true});
					fields.push({ name: 'Name', value : hook.name, inline : true});
					fields.push({ name: 'URL', value : hook.url, inline : true});
					fields.push({ name: '\u200B', value: '\u200B' });
				})
			} else {
				fields = [{ name: 'Channel', value : '<#' + channelId + '>', inline : true}, { name: 'WEBHOOK', value : '`<< None defined >>`', inline : true}]
			}
			return {message: this.description, log: false, fields: fields}
		} else if ('list' in args) {
			const hooks = await configDb.findBy({guild: guild, uuid: cs.WEBHOOK});
			if (hooks) {
				const fields = [];
				hooks.forEach(hook => {
					fields.push({ name: 'Channel', value : '<#' + hook.channel + '>', inline: true});
					fields.push({ name: 'Name', value : hook.name, inline : true});
					fields.push({ name: 'URL', value : hook.url, inline : true});
					fields.push({ name: '\u200B', value: '\u200B' });
				})
				return {message: this.description, log: false, fields: fields}
			} else {
				return client.reply('No relays has been configured.');	
			}
		} else if ('clear' in args) {
			const channelId = args.clear.channel;
			configDb.deleteBy({guild: guild, uuid: cs.WEBHOOK, channel: channelId});
			return {message: this.description, log: true, fields: [{ name: 'Channel', value : '<#' + channelId + '>'}, { name: 'URL', value : '`<< Cleared >>`'}]}
		} else if ('delete' in args) {
			const channelId = args.delete.channel;
			const name = args.delete.name;
			const r = await configDb.findBy({guild: guild, uuid: cs.WEBHOOK, channel: channelId, name: new RegExp(`^${name}$`, "i")});
			if (r?.length > 0) {
				configDb.deleteBy({guild: guild, uuid: cs.WEBHOOK, channel: channelId, name: new RegExp(`^${name}$`, "i")});
				return {message: this.description, log: true, fields: [{ name: 'Channel', value : '<#' + channelId + '>'}, { name: 'Name', value : name}, { name: 'URL', value : '`<< Cleared >>`'}]}
			}
			return client.reply(`Relay for channel <#${channelId}> named \`${name}\` not found.`);	
		}

		return client.reply('Unknown command');	
    },
};

