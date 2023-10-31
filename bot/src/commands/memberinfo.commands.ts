import { Command } from "@/common/decorators";
import { DiscordCommand } from "@/common/schemas";
import { GuildMemberModel } from "@/repository";
import { ApplicationCommandOptionType, ChatInputCommandInteraction, Client, EmbedBuilder, time } from "discord.js";

const AVATAR_URL = 'https://ui-avatars.com/api/?name='
//https://robohash.org/

@Command({
	name: 'memberinfo',
	description: 'Show Guild Member Info',
	options: [{
		name: 'name',
		description: 'Username',
		type: ApplicationCommandOptionType.String,
		required: true
	}]
})
export class MemberInfoCommand implements DiscordCommand {

	async run(client: Client, interaction: ChatInputCommandInteraction, args: any): Promise<any> {
		
		await interaction.deferReply();
		
		let query = {
			guild: interaction.guildId,
			username: {'$regex': `.*${args.name}.*`, "$options": "i" }
		}

		const members = await GuildMemberModel.find(query).exec();

		if (members.length == 0) {
			return interaction.editReply({ content: `No members found matching: ${args.name}`});
		} else if (members.length > 1) {
			const p = members.map(p => `* Name: ${p.username}`).join('\n');
			return interaction.editReply({ content: `Found ${members.length} matches\n\n${p}`})
		}

		const localMember = members.at(0)!;
		// check if exists first
		const guildMember = interaction.guild?.members.cache.get(localMember.id);

		let thumbnail = localMember.avatar;
		let title = localMember.username;
		if (guildMember) {
			thumbnail = guildMember.displayAvatarURL();
			title = guildMember.displayName;
		}

        const msgEmbed = new EmbedBuilder()
            .setColor('Random')
			.setThumbnail(thumbnail)
            .setTitle(title)
			.addFields(
				{ name: 'Alias', value: localMember.alias.join("\n") },
				{ name: 'Last Seen', value: time(localMember.lastSeen) },
			);			
		
		return interaction.editReply({ embeds: [ msgEmbed ] });
	}

}
