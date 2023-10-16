import { Command } from "@/common/decorators";
import { DiscordCommand } from "@/common/schemas";
import { ApplicationCommandOptionType, ChatInputCommandInteraction, Client, IntentsBitField, PermissionFlagsBits } from "discord.js";

@Command({
	name: 'removerole',
	description: 'Remove Roles from Users having another Role',
	options: [
        {
			name: 'filterrole',
			description: 'To users having this Role',
			type: ApplicationCommandOptionType.Role,
			required: true
		},
        {
            name: 'removerole',
            description: 'Remove this Role',
            type: ApplicationCommandOptionType.Role,
            required: true
	}],
    defaultPermissions: PermissionFlagsBits.ManageGuild | PermissionFlagsBits.Administrator,
    requiresIntents: [ IntentsBitField.Flags.GuildMembers ]
})
export class DelRoleCommand implements DiscordCommand {

	async run(client: Client, interaction: ChatInputCommandInteraction, args: any): Promise<any> {
		
		await interaction.deferReply({ ephemeral: true });

        let count = 0;

        const members = (await interaction.guild?.roles.fetch(args.filterrole))?.members;

        try {
            if (members) {
                for (let member of members.values()) {
                    if (member.roles.cache.has(args.removerole)) {
                        await member.roles.remove(args.removerole);
                        count++;
                    }
                }
            }
        } catch (error) {
            return interaction.editReply({ content: `Sorry, I cannot modify that role. I need more privileges to do it. Try placing me higher`});    
        }
        
        return interaction.editReply({ content: `Updated ${count} members`});

	}

}
