const ical = require('node-ical');

module.exports = {
	name: 'territory_events',
    description: 'Set Territory Events Calendar',
	usage: 'calendar_ical_url',
    async execute(configDb, cmd, message, params) {
		const guild = message.guild.id;

		if (!params) {
			return message.reply(`Missing required arguments. Specify a valid ical url`);
		}

		try {
			await ical.async.fromURL(params);
		} catch (error) {
			console.error(error);
			return message.reply(`Sorry, I'm unable to validate URL \`${params}\``);
		}
		
		configDb.push(guild, "territory_events", {'url': params});

		return {message: this.description, fields: [{ name: 'URL', value : '`'+params+'`'}], log: true}

    },
};