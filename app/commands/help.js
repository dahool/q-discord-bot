const { helper } = require('../helper');

module.exports = {
	name: 'q',
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
		return helper(this.name, client, args)
	},
};