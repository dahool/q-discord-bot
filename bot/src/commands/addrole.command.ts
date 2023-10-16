import { Command } from "@/common/decorators";
import { DiscordCommand } from "@/common/schemas";
import { ApplicationCommandOptionType, ChatInputCommandInteraction, Client, IntentsBitField, PermissionFlagsBits } from "discord.js";

@Command({
	name: 'addrole',
	description: 'Add Role to Users having selected Role',
	options: [
        {
			name: 'currentrole',
			description: 'To users having this Role',
			type: ApplicationCommandOptionType.Role,
			required: true
		},
        {
            name: 'newrole',
            description: 'Append this Role',
            type: ApplicationCommandOptionType.Role,
            required: true
	}],
    defaultPermissions: PermissionFlagsBits.ManageGuild | PermissionFlagsBits.Administrator,
    requiresIntents: [ IntentsBitField.Flags.GuildMembers ]
})
export class AddRoleCommand implements DiscordCommand {

	async run(client: Client, interaction: ChatInputCommandInteraction, args: any): Promise<any> {
		
		await interaction.deferReply({ ephemeral: true });

        let count = 0;

        const members = (await interaction.guild?.roles.fetch(args.currentrole))?.members;
        const targetRole = await interaction.guild?.roles.fetch(args.newrole);

        try {
            if (targetRole && members) {
                for (let member of members.values()) {
                    await member.roles.add(targetRole);    
                    count++;
                }
            }
        } catch (error) {
            return interaction.editReply({ content: `Sorry, I cannot modify that role. I need more privileges to do it. Try placing me higher`});    
        }
        
        return interaction.editReply({ content: `Updated ${count} members`});

	}

}
