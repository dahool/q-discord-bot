import { LocalChannelManager, LocalGuildClient } from "@/client";
import { Command } from "@/common/decorators";
import { DiscordCommand } from "@/common/schemas";
import { GuildMemberModel } from "@/repository";
import { channel } from "diagnostics_channel";
import { ApplicationCommandOptionType, CacheType, ChatInputCommandInteraction, Client, EmbedBuilder, GuildBasedChannel, userMention } from "discord.js";
import { url } from "inspector";

@Command({
	name: 'addcontact',
	description: 'Add contact info',
	options: [
        {
			name: 'message',
            description: 'The information you want to add',
			type: ApplicationCommandOptionType.String,
			required: true
		},
    ],
})
export class AddContactCommand implements DiscordCommand {

	async run(client: Client, interaction: ChatInputCommandInteraction, args: any): Promise<any> {
		
        let guildClient = new LocalGuildClient(interaction.guildId!);
        let config = await guildClient.getConfig();

        if (config?.channels?.contactInfo) {
            await interaction.reply({content: 'Thank you. Your message as been recorded.', ephemeral: true})
            return this.saveContactInfo(guildClient.getChannel(config.channels.contactInfo), interaction, args.message)
        } else {
            return interaction.reply({content: 'Sorry. This function is disabled.', ephemeral: true})
        }

	}

    saveContactInfo(localChannel: Promise<LocalChannelManager | null>, interaction: ChatInputCommandInteraction<CacheType>, message: string): any {
        const member = interaction.user;
        GuildMemberModel.findOne({guild: interaction.guildId, memberId: member.id}).exec().then(
            model => {
                if (model) {
                    model.contactInfo = message
                    model.save()
                }
            }
        );
        localChannel.then(channel => {
            const embed = new EmbedBuilder()
                .setColor("White")
                .setAuthor({ name: member.displayName, iconURL: member.displayAvatarURL()})
                .setThumbnail(member.displayAvatarURL())
                .setDescription(userMention(member.id) + ' contact details')
                .setThumbnail(interaction.user.avatarURL({size: 32 }))
                .addFields(
                        { name: 'Message', value: message}
                );

            channel?.send({ embeds: [ embed ] })
        })
    }


}

