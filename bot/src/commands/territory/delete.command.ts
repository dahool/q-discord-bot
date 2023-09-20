import { Command } from "@/common/decorators";
import { deleteScheduledEvent } from "@/common/discord";
import { DiscordCommand } from "@/common/schemas";
import { highlightText, safeLower } from "@/common/utils";
import { logger } from "@/logging/logger";
import { CalendarModel, TerritoryEventModel } from "@/repository";
import { ActionRowBuilder, ApplicationCommandOptionType, BaseInteraction, Client, CommandInteraction, StringSelectMenuBuilder, StringSelectMenuInteraction } from "discord.js";
import { DateTime } from "luxon";
import { Territory, findZonesByName } from ".";

@Command({
    name: 'tcevent-delete',
	description: 'Delete Territory Reminder',
	options: [
		{
			name: 'zone',
			description: 'Territory Name',
			type: ApplicationCommandOptionType.String,
			required: true
		}
	],	
})
export class TerritoryEventDelete implements DiscordCommand {

	async removeCalendar(interaction: BaseInteraction, eventId: string) {
		logger.debug("Remove calendar entries for %s", eventId);
		const calendarEvents = await CalendarModel.find({parentId: eventId}).exec();
		await Promise.all(
			calendarEvents
			.filter(e => e.discordEventId != undefined && e.discordEventId != '')
			.map(e => deleteScheduledEvent(interaction.guild!, e.discordEventId!))
		)
		return CalendarModel.deleteMany({parentId: eventId}).exec();
	}

	async executeDelete(interaction: BaseInteraction, eventId: string) {
		await this.removeCalendar(interaction, eventId);
		return TerritoryEventModel.findByIdAndDelete(eventId).exec();
	}
	
	async askForDelete(interaction: CommandInteraction, zone: Territory) {

		const events = await TerritoryEventModel.find({
							guild: interaction.guildId,
							zone: zone.zone,
							next: { $gte: DateTime.utc().toJSDate() }
						}).exec();

		if (events.length) {
			const options = events.map((ev) => {
				return {
					label: ev.title,
					value: String(ev._id)
				}
			});
			const row = new ActionRowBuilder<StringSelectMenuBuilder>()
				.addComponents(
					new StringSelectMenuBuilder()
						.setCustomId('remove-event')
						.setPlaceholder('Nothing selected')
						.addOptions(options)
					);
			const response = await interaction.reply({content: 'Select the event you want to remove', ephemeral: true, components: [row]});
			const filter = (i: BaseInteraction) => i.user.id === interaction.user.id;
			try {
				const selection = await response.awaitMessageComponent({ filter: filter, time: 60_000 });
				if (selection.customId == 'remove-event') {
					const selectInteraction = (selection as StringSelectMenuInteraction);
					logger.debug("Selected %O", selectInteraction.values);
					const removed = await this.executeDelete(selection, selectInteraction.values[0]);
					if (removed) return selection.update({ content: 'Removed event ' + highlightText(removed.title), components: [] });
					else return selection.update({ content: 'Removed event', components: [] });
				} else {
					return selection.update({ content: 'Action cancelled', components: [] });
				}
			} catch (e: any) {
				return interaction.editReply({ content: 'Done waiting, try again.', components: [] })
			}
		} else {
			return interaction.reply("No events scheduled for " + highlightText(zone.zone));
		}		
	}

    async run(client: Client, interaction: CommandInteraction, args: any): Promise<any> {
		logger.info("Zone: %s", args.zone);
		
		if (interaction.isChatInputCommand()) {
			const lookupName = safeLower(args.zone);
			let zones = findZonesByName(lookupName);
			if (zones.length == 1) {
				return this.askForDelete(interaction, zones[0]);
			} else if (zones.length > 1) {
				return interaction.reply(`Pardon mon capitaine, too many zones matching \`${args.zone}\`. Narrow your search.`);
			}
			return interaction.reply(`No zones found matching \`${args.zone}\``);
		} else if (interaction.isAnySelectMenu()) {
			return Promise.resolve();
		}

		return interaction.reply(`Pardon mon capitaine, I don't know what to do with that`);
    }
    
}