const Discord = require('discord.js');
const { StringBuilder, capitalize } = require('./utils');

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

helper = (name, client, args) => {
    if (!args.command) {
        const help = new Discord.EmbedBuilder()
            .setColor('#015267')
            .setTitle('What can I do')
            .setThumbnail(client.client.user.avatarURL())
            .setFooter({text: 'Type `!' + name + ' <command>` for more help'})
            .setTimestamp();

        var commands = [];
        client.client.commands.sort((a,b) => a.name - b.name).forEach((cmd) => {
            if (cmd.help !== false) {
                commands.push('`!' + cmd.name + '` :: ' + cmd.description)
            }
        })
        help.addFields({name: 'Commands', value: commands.join('\n')});
        return client.reply(help);
    }

    const cmdName = args.command.toLowerCase();
    const cmd = client.client.commands.get(cmdName)
        || client.client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(cmdName));
    
    if (!cmd) {
        return client.reply('Command `' + cmdName + '` not found.');
    }

    const help = new Discord.EmbedBuilder()
        .setColor('#015267')
        .setTitle(cmd.description)
        .setThumbnail(client.client.user.avatarURL())
        .addFields({name: 'Command', value: cmd.name})
        .setFooter({text: 'Help for ' + cmd.name})
        .setTimestamp();

    if (cmd.man_description) {
        help.setDescription(cmd.description);
    }

    if (cmd.aliases) {
        help.addFields({name: "Alias", value: cmd.aliases.join('\n')});
    }

    const options = recurseOptions(cmd.options);
    if (options.length) {
        help.addFields(options.map(o => { return {name: o.name, value: o.values} } ))
    }

    return client.reply(help);
}

module.exports = {
    helper
};