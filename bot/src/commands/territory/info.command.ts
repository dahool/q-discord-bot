import { Command } from "@/common/decorators";
import { DiscordCommand } from "@/common/schemas";
import { asTimeFormat, asTimeRelative, safeLower } from "@/common/utils";
import { logger } from "@/logging/logger";
import { ApplicationCommandOptionType, Client, CommandInteraction, EmbedBuilder } from "discord.js";
import { findZonesByName, findZonesByParticle, rssMap } from ".";

@Command({
    name: 'tcinfo',
	description: 'Display Territory details',
	options: [
		{
			name: 'name',
			description: 'Zone name or Particle',
			type: ApplicationCommandOptionType.String,
			required: true
		}
	],	
})
export class TerritoyInfoCommand implements DiscordCommand {
    async run(client: Client, interaction: CommandInteraction, args: any): Promise<any> {

		logger.info("Zone: %s", args.name);
		
		await interaction.deferReply();

		const lookupName = safeLower(args.name);
		
		let zones = findZonesByName(lookupName);
		if (!zones.length) {
			zones = findZonesByParticle(lookupName);
		}
		if (!zones.length) {
			return interaction.editReply(`No zones found matching \`${args.name}\``);
		}

		logger.debug("Found: %s", zones);
		
		const icon = interaction.guild ? interaction.guild.iconURL() : interaction.client.user.avatarURL();

		const msgEmbed = new EmbedBuilder()
			.setColor('#e1dad8')
			.setThumbnail(icon)
			.setTitle("Territory");

		zones.sort((a: any,b: any) => a.next - b.next).forEach(z => {
			var content = "`Particle:` <" + rssMap.get(z.particle) + "> " + z.particle + "\n";
			content+= "`Type:` " + z.type + "\n";
			content+= "`Resources:` " + z.rss.map(i => '<' + rssMap.get(i) + '>').join(' ') + "\n";
			content+= "`Connected:` *" + z.paths.join(', ') + "*\n";
            content+= "`Takeover Time:` " + asTimeFormat(z.next) + "\n"; 
			content+= "`Next:` **" + asTimeRelative(z.next) + "**";
			msgEmbed.addFields({name: z.zone, value: content});
		})	

		return interaction.editReply({ embeds: [msgEmbed] });
    }
    
}

