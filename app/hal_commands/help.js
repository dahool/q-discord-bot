const Discord = require('discord.js');

function StringBuilder() {
    this.__strings__ = new Array;
}
 
StringBuilder.prototype.append = function (str) {
    this.__strings__.push(str);
	return this;
};
 
StringBuilder.prototype.toString = function () {
    return this.__strings__.join("");
};

capitalize = (string) => {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

recurseOptions = (ops) => {
	const args = [];
	for (const key in Object.keys(ops)) {
		const buf = new StringBuilder();
		const option = ops[key];
		if (option.options) {
			option.options.forEach(o1 => {
				buf.append(option.name + ' ' + o1.name + ' ');
				if (o1.options) {
					o1.options.forEach(o2 => {
						if (o2.required) {
							buf.append(`<${o2.description}> `)
						} else {
							buf.append(`[${o2.description}] `)
						}
					})
				}
				buf.append(' :: ' + o1.description + '\n');
			})
			args.push({name: option.description, values: buf.toString()});
		} else {
			if (option.choices) {
				option.choices.forEach(c => {
					buf.append(`${c.value} :: ${c.name}\n`)
				})
			} else {
				if (option.required) {
					buf.append(`<${option.description}> `)
				} else {
					buf.append(`[${option.description}] `)
				}
			}
			args.push({name: capitalize(option.name), values: buf.toString()});
		}
	}
	return args;	
}

module.exports = {
	name: 'hal',
	slashName: 'help',
	description: 'Help',
	dm: true,
	slash: true,
	options: [{
		name: 'command',
		description: 'Command you require help for',
		type: 3,
		required: false
	}],
	help: false,
	execute(client, args) {

		if (!args.command) {
			const help = new Discord.MessageEmbed()
				.setColor('#015267')
				.setTitle('What can I do')
				.setThumbnail(client.client.user.avatarURL())
				.setFooter('Type `!' + this.name + ' <command>` for more help')
				.setTimestamp();

			var commands = [];
			client.client.commands.sort((a,b) => a.name - b.name).forEach((cmd) => {
				if (cmd.help !== false) {
					commands.push('`!' + cmd.name + '` :: ' + cmd.description)
				}
			})
			help.addField('Commands', commands.join('\n'));
        	return client.sendMessage(help);
		}

		const cmdName = args.command.toLowerCase();
		const cmd = client.client.commands.get(cmdName)
			|| client.client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(cmdName));
		
		if (!cmd) {
			return client.reply('Command `' + cmdName + '` not found.');
		}

		const help = new Discord.MessageEmbed()
			.setColor('#015267')
			.setTitle(cmd.description)
			.setThumbnail(client.client.user.avatarURL())
			.addFields({name: 'Command', value: cmd.name})
			.setFooter('Help for ' + cmd.name)
			.setTimestamp();

		if (cmd.man_description) {
			help.setDescription(cmd.description);
		}

		if (cmd.aliases) {
			help.addField("Alias", cmd.aliases.join('\n'));
		}

		const options = recurseOptions(cmd.options);
		if (options.length) {
			options.forEach(o => {
				help.addField(o.name, o.values);
			})
		}

		return client.sendMessage(help);
	},
};