import { Command } from "@/common/decorators";
import { DiscordCommand } from "@/common/schemas";
import { ConfigModel, PlayerInfoModel } from "@/repository";
import { ApplicationCommandOptionType, AttachmentBuilder, ChatInputCommandInteraction, Client } from "discord.js";

@Command({
	name: 'alliance',
	description: 'list alliance members',
	options: [{
		name: 'format',
		description: 'Format',
		type: ApplicationCommandOptionType.String,
		required: true,
		choices: [
			{name: 'slim', value: 'slim'},
			{name: 'full', value: 'full'}
		]
	},{
		name: 'tag',
		description: 'Alliance TAG',
		type: ApplicationCommandOptionType.String,
		required: false
	}]
})
export class AllianceCommand implements DiscordCommand {

	async run(client: Client, interaction: ChatInputCommandInteraction, args: any): Promise<any> {
		
		await interaction.deferReply();
		
		const config = await ConfigModel.findOne({guild: interaction.guildId}).exec();

		let tag = args.tag ? args.tag : config?.allianceTag;
		if (tag == undefined || tag == '') {
			return interaction.editReply({ content: "Sorry, no default alliance TAG defined. If you really want everyhing use `*`"});
		}

		let list;
		if (tag == '*') {
			list = await PlayerInfoModel.find({}).exec();
		} else {
			list = await PlayerInfoModel.find({tag: tag.toUpperCase()}).exec();
		}

		let content = list.sort((a, b) => a.name.localeCompare(b.name)).map(player => {
			if ('slim' == args.format) {
				return player.name;
			}
			return `"${player.name}",${player.level},${player.power},${player.pd},${player.rss},${player.tag}`
		}).join('\n');

		if ('full' == args.format) {
			content = '"Name","Level","Power","PD","Raided","TAG"\n' + content;
		}
	
		let attach = new AttachmentBuilder(Buffer.from(content, 'utf-8'), {name: 'alliance.csv'});

		return interaction.editReply({ content: `Here it is ${list.length} players`, files: [ attach ] });
	}

}
