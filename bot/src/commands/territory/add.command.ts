import { Colors } from "@/common/colors";
import { Command } from "@/common/decorators";
import { DiscordCommand } from "@/common/schemas";
import { asRole, asTimeFormat, safeLower } from "@/common/utils";
import { logger } from "@/logging/logger";
import { TerritoryEventModel } from "@/repository";
import { ApplicationCommandOptionType, Client, CommandInteraction, EmbedBuilder } from "discord.js";
import { Territory, createEventCalendar, findZonesByName } from ".";

@Command({
    name: 'tcevent-add',
	description: 'Delete Territory Reminder',
	options: [
		{
			name: 'zone',
			description: 'Territory Name',
			type: ApplicationCommandOptionType.String,
			required: true
		},{
			name: 'title',
			description: 'Event Title',
			type: ApplicationCommandOptionType.String,
			required: true
		},{
			name: 'recurrent',
			description: 'Create a recurrent reminder',
			type: ApplicationCommandOptionType.Boolean,
			required: false
		},{
			name: 'mention',
			description: 'Role to Ping',
			type: ApplicationCommandOptionType.Role,
			required: false
		}
	],	
})
export class TerritoryEventAdd implements DiscordCommand {

	async createEvent(interaction: CommandInteraction, zone: Territory, args: any) {
		
		let duration = 60;
		if (zone.type == 1) {
			duration = 30;
		} else if (zone.type == 2) {
			duration = 45;
		}

		const model = new TerritoryEventModel({
			guild: interaction.guildId,
			zone: zone.zone,
			title: args.title,
			next:  zone.next.toJSDate(),
			recurrent: args.recurrent || false,
			duration: duration,
			ping: args.mention
		})
		
		await model.save();
		await createEventCalendar(model);
		
		const msgEmbed = new EmbedBuilder()
			.setColor(Colors.Green)
			.setThumbnail("https://www.dropbox.com/s/nrviw00vxo2xk3z/bell.png?raw=1")
			.setTitle("Created Territory Reminder")
			.addFields(
				{name: 'Title', value: model.title},
				{name: 'Zone', value: zone.zone}
			);
		
		if (model.recurrent) {
			msgEmbed.addFields({name: 'Every', value: zone.next.toFormat("ccc 'at' h:mma ZZZZ")})
			msgEmbed.addFields({name: 'Starting on', value: asTimeFormat(zone.next)})
		} else {
			msgEmbed.addFields({name: 'On', value: asTimeFormat(zone.next)})
		}
	
		if (args.mention) {
			msgEmbed.addFields({name: 'Ping', value: asRole(args.mention)});
		}
	
		return interaction.editReply({ embeds: [ msgEmbed ] });
	}
	
    async run(client: Client, interaction: CommandInteraction, args: any): Promise<any> {
		logger.info("Zone: %s", args.zone);
		await interaction.deferReply();
		const lookupName = safeLower(args.zone);
		let zones = findZonesByName(lookupName);
		if (zones.length == 1) {
			return this.createEvent(interaction, zones[0], args);
		} else if (zones.length > 1) {
			return interaction.editReply(`Pardon mon capitaine, too many zones matching \`${args.zone}\`. Narrow your search.`);
		}
		return interaction.editReply(`No zones found matching \`${args.zone}\``);
    }
    
}