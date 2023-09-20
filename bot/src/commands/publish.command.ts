import { Colors } from "@/common/colors";
import { Command } from "@/common/decorators";
import { DiscordCommand } from "@/common/schemas";
import { ApplicationCommandOptionType, ChatInputCommandInteraction, Client, EmbedAuthorOptions, EmbedBuilder, GuildMember } from "discord.js";

const choices: any[] = [];
Object.entries(Colors).forEach(([k, v]) => choices.push({'name': k, 'value': v}))

@Command({
	name: 'publish',
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
		choices: choices
	},{
		name: 'image',
		description: 'Image URL',
		type: ApplicationCommandOptionType.String,
		required: false
	}]
})
export class PublishCommand implements DiscordCommand {

	async run(client: Client, interaction: ChatInputCommandInteraction, args: any): Promise<any> {

		const msgEmbed = new EmbedBuilder()
			.setColor(args.color)
			.setTitle(args.title)
			.setThumbnail(interaction.guild ? interaction.guild.iconURL() : interaction.client.user.avatarURL())
			.setDescription(args.message)
			.setAuthor( getAuthor(interaction) )
			.setTimestamp();

		if (args.image) {
			msgEmbed.setImage(args.image);
		}

		return interaction.channel?.send({ embeds: [msgEmbed] }).then(() => {
			interaction.reply({ content: 'Posted', ephemeral: true });
		});
		
	}

}

function getAuthor(interaction: ChatInputCommandInteraction): EmbedAuthorOptions | null {
	if (interaction.member) {
		if (interaction.member instanceof GuildMember) {
			return { name: interaction.member.displayName, iconURL: interaction.member.displayAvatarURL() }
		} else {
			return { name: interaction.member.user.username }
		}
	}
	return null;
}

