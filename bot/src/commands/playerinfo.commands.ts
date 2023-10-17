import { Command } from "@/common/decorators";
import { DiscordCommand } from "@/common/schemas";
import { PlayerInfoModel } from "@/repository";
import { ApplicationCommandOptionType, ChatInputCommandInteraction, Client, EmbedBuilder } from "discord.js";

interface PlayerQuery {
	name: any,
	tag?: string
}

@Command({
	name: 'playerinfo',
	description: 'Show Player Stats',
	options: [{
		name: 'name',
		description: 'Name',
		type: ApplicationCommandOptionType.String,
		required: true
	},{
		name: 'tag',
		description: 'Alliance TAG',
		type: ApplicationCommandOptionType.String,
		required: false
	}]
})
export class PlayerInfoCommand implements DiscordCommand {

	async run(client: Client, interaction: ChatInputCommandInteraction, args: any): Promise<any> {
		
		await interaction.deferReply();
		
		let query: PlayerQuery = {
			name: {'$regex': `.*${args.name}.*`, "$options": "i" }
		}
		if (args.tag) {
			query.tag = args.tag.toUpperCase();
		}

		const players = await PlayerInfoModel.find(query).exec();

		if (players.length == 0) {
			return interaction.editReply({ content: `No player found matching: ${args.name}`});
		} else if (players.length > 1) {
			const p = players.map(p => `* Name: ${p.name} - Alliance: ${p.tag}`).join('\n');
			return interaction.editReply({ content: `Found ${players.length} matches\n\n${p}`})
		}

		const player = players.at(0)!;

        const msgEmbed = new EmbedBuilder()
            .setColor('Random')
            .setThumbnail('https://robohash.org/' + encodeURIComponent(player.name))
            .setTitle((player.tag ? `[${player.tag}] ` : ' ') + player.name)
			.addFields(
				{ name: 'Level', value: player.level.toString() },
				{ name: 'Power', value: player.power.toLocaleString() },
				{ name: 'PD', value: player.pd.toLocaleString() }
			);
		
		return interaction.editReply({ embeds: [ msgEmbed ] });
	}

}
