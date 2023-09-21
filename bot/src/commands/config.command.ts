import { Command } from "@/common/decorators";
import { DiscordCommand } from "@/common/schemas";
import { environment } from "@/env/environment";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, CommandInteraction, EmbedBuilder } from "discord.js";

@Command({
    name: 'config',
    admin: true,
    description: 'Settings of the Continuum',
})
export class ConfigCommand implements DiscordCommand {
    async run(client: Client, interaction: CommandInteraction): Promise<void> {

        const msgEmbed = new EmbedBuilder()
            .setColor('#e1dad8')
            .setThumbnail(client.user!.displayAvatarURL())
            .setTitle('Settings of the Continuum');

        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setLabel("Open Dashboard")
                    .setURL(environment.url.dashboard!)
                    .setStyle(ButtonStyle.Link)
            )

        interaction.reply({embeds: [ msgEmbed], components: [ row ], ephemeral: true});
    }
    
}
