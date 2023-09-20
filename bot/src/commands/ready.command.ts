import { Command } from "@/common/decorators";
import { DiscordCommand } from "@/common/schemas";
import { asChannel, testChannel } from "@/common/utils";
import { logger } from "@/logging/logger";
import { ConfigModel } from "@/repository";
import { Client, CommandInteraction } from "discord.js";

@Command({
    name: 'ready',
    admin: true,
    description: 'Self Check',
})
export class ReadyCommand implements DiscordCommand {
    async run(client: Client, interaction: CommandInteraction): Promise<void> {
        
        const errors = new Set();

        let config = await ConfigModel.findOne({guild: interaction.guildId}).exec();

        await interaction.deferReply({ ephemeral: true });

        if (config?.channels) {
            const guild = interaction.guild!;
            for (const [configId, channelId] of Object.entries(config.channels)) {
                if (await testChannel(guild.channels.cache.get(channelId))) {
                    logger.info("Self Check SUCCESS for %s", configId);
                } else {
                    logger.info("Self Check FAILED for %s", configId);
                    errors.add(asChannel(channelId));
                }
            }
        }

		if (errors.size > 0) {
            interaction.editReply("Mon capitaine. I need permissions on the following channels\n>>> " + Array.from(errors).join('\n'));
		} else {
            interaction.editReply("I'm ready mon capitaine.");
        }

        return Promise.resolve();
    }
    
}
