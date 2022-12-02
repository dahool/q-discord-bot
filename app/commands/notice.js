const { ApplicationCommandOptionType } = require('discord.js');
const Discord = require("discord.js");

module.exports = {
	name: 'notice',
	dm: false,
	description: 'publish a message in a discord embedd',
	options: [{
		name: 'title',
		description: 'Title',
		type: ApplicationCommandOptionType.String,
		required: true
	},{
		name: 'message',
		description: 'Message',
		type: ApplicationCommandOptionType.String,
		required: true
	},
	{
		name: 'color',
		description: 'Color',
		type: ApplicationCommandOptionType.String,
		required: true,
		choices: [
			{
				name: 'Gray/Silver',
				value: '#C0C0C0'
			},
			{
				name: 'Black',
				value: '#000000'
			},
			{
				name: 'White',
				value: '#FFFFFF'
			},						
			{
				name: 'Navy Blue',
				value: '#000080'
			},
			{
				name: 'Cyan',
				value: '#00FFFF'
			},
			{
				name: 'Blue',
				value: '#0000FF'
			},				
			{
				name: 'Red',
				value: '#FF0000'
			},			
			{
				name: 'Salmon',
				value: '#FA8072'
			},
			{
				name: 'HotPink',
				value: '#FF1493'
			},
			{
				name: 'Green',
				value: '#008000'
			},
			{
				name: 'Lime',
				value: '#00FF00'
			},
			{
				name: 'Violet',
				value: '#EE82EE'
			},
			{
				name: 'Purple',
				value: '#800080'
			},
			{
				name: 'Yellow',
				value: '#FFFF00'
			}
		]		
	},{
		name: 'image',
		description: 'Image URL',
		type: ApplicationCommandOptionType.String,
		required: false
	}],
	async execute(client, args) {

		const msgEmbed = new Discord.EmbedBuilder()
			.setColor(args.color)
			.setTitle(args.title)
			.setThumbnail(client.guild.iconURL())
			.setDescription(args.message)
			.setAuthor({ name: client.member.displayName, iconURL: client.member.displayAvatarURL() })
			.setTimestamp();

		if (args.image) {
			msgEmbed.setImage(args.image);
		}

		return client.channel.send({ embeds: [msgEmbed] }).then(() => {
			client.reply("Posted");
		});
		
	}

};
