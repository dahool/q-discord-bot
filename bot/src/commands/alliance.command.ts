import { Command } from "@/common/decorators";
import { DiscordCommand } from "@/common/schemas";
import { PlayerInfoModel } from "@/repository";
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
	}]
})
export class AllianceCommand implements DiscordCommand {

	async run(client: Client, interaction: ChatInputCommandInteraction, args: any): Promise<any> {
		
		await interaction.deferReply();

		const list = await PlayerInfoModel.find({guild: interaction.guildId}).exec();

		let content = list.sort((a, b) => a.name.localeCompare(b.name)).map(player => {
			if ('slim' == args.format) {
				return player.name;
			}
			return `"${player.name}",${player.level},${player.power},${player.pd},${player.rss}`
		}).join('\n');

		if ('full' == args.format) {
			content = '"Name","Level","Power","PD","Raided"\n' + content;
		}
	
		let attach = new AttachmentBuilder(Buffer.from(content, 'utf-8'), {name: 'alliance.csv'});

		await interaction.channel?.send({ files: [ attach ]});
		return interaction.editReply('Here it is');
	}

}
