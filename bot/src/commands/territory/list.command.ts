import { CALENDAR_SOURCE } from "@/actions/calendar";
import { EVENT_TYPE } from "@/actions/notification";
import { Territory, TerritoryEvents } from "@/api";
import { Colors } from "@/common/colors";
import { Command } from "@/common/decorators";
import { DiscordCommand } from "@/common/schemas";
import { asTimeFormat, createURLwithParameters, groupBy, highlightText, safeLower } from "@/common/utils";
import { environment } from "@/env/environment";
import { logger } from "@/logging/logger";
import { CalendarModel, ConfigModel, TerritoryEventModel } from "@/repository";

import { ApplicationCommandOptionType, Client, CommandInteraction, EmbedBuilder } from "discord.js";
import { DateTime } from "luxon";


@Command({
    name: 'tcevent-list',
	description: 'List Scheduled Territory Events',
	options: [
		{
			name: 'zone',
			description: 'Territory Name',
			type: ApplicationCommandOptionType.String,
			required: false
		}
	],	
})
export class TerritoryEventList implements DiscordCommand {

	async listEvents(interaction: CommandInteraction, zone: Territory.Zone) {

		let tcEvents = await TerritoryEventModel.find({
			guild: interaction.guildId,
			zone: zone.zone,
			next: { $gte: DateTime.utc().toJSDate() }
		}).exec();
	
		let calendarEvents = await CalendarModel.find({
			guild: interaction.guildId,
			type: EVENT_TYPE.TERRITORY,
			location: zone.zone,
			src: CALENDAR_SOURCE,
			notified: false,
			start: { $gte: DateTime.utc().toJSDate() }
		}).sort({ start: 1 }).allowDiskUse(true).exec();
	
		if ((tcEvents.length) || calendarEvents.length) {
			const msgEmbed = new EmbedBuilder()
			.setColor(Colors.Lime)
			.setThumbnail(interaction.guild ? interaction.guild.iconURL() : interaction.client.user.avatarURL())
			.setTitle("Events Scheduled for " + zone.zone)
			.setDescription(asTimeFormat(zone.next));
		
			if (tcEvents.length) {
				msgEmbed.addFields({
					name: 'Scheduled Events', value: tcEvents.map(ev => highlightText(ev.title)).join('\n')
				})
			}
			
			let caevents: any[] = [];
			groupBy(calendarEvents, (u: any) => u.parentId).forEach(values => {
				caevents.push(values[0].summary);
			})
			if (caevents.length) {
				msgEmbed.addFields([{name: 'Calendar Events', value: caevents.join('\n')}])
			}

			return interaction.editReply({ embeds: [ msgEmbed ]});

		}

		return interaction.editReply("No events scheduled for " + highlightText(zone.zone));
	}

	async listAllEvents(interaction: CommandInteraction) {
	
		let events = await TerritoryEvents.listCalendarEntries(interaction.guildId!, 7);
	
		const guildConfig = await ConfigModel.findOne({ guild: interaction.guildId }).exec();

		let url;
		if (guildConfig?.token) {
			let params = {
				'TOKEN': encodeURIComponent(guildConfig.token),
				'ID': encodeURIComponent(interaction.guildId!)
			}
			url = createURLwithParameters(environment.url.calendar!, params);
		}
	
		const msgEmbed = new EmbedBuilder()
			.setColor(Colors.Gray)
			.setThumbnail(interaction.guild ? interaction.guild.iconURL() : interaction.client.user.avatarURL())
			.setTitle("Territory Events in Next 7 days")
			.setFooter({text: "* calendar events can't be removed by me"});
	
		if (url != undefined) {
			msgEmbed.setURL(url + '&nocache');
		}

		groupBy(events, (e: any) => e.location).forEach((values, key) => {
			values.sort((a: any, b: any) => a.start - b.start);
			msgEmbed.addFields({name: key, value: values.map((ev: any) => {
				const start = DateTime.fromJSDate(ev.start).setZone('UTC');
				const flag = ev.src == CALENDAR_SOURCE ? ':calendar_spiral:' : '';
				const ob = '`' + ev.summary + '` on ' + asTimeFormat(start) + ' ' + flag;
				return ob;
			}).join('\n')});
		})
	
		return interaction.editReply({ embeds: [ msgEmbed ] })
	}

    async run(client: Client, interaction: CommandInteraction, args: any): Promise<any> {

		logger.info("Zone: %s", args.zone);

		await interaction.deferReply();

		if (args.zone == undefined || args.zone == '*') {
			return this.listAllEvents(interaction);
		}
		
		const lookupName = safeLower(args.zone);
		let zones = Territory.findZonesByName(lookupName);
		if (zones.length == 1) {
			return this.listEvents(interaction, zones[0]);
		} else if (zones.length > 1) {
			return interaction.editReply('Pardon mon capitaine, too many zones matching ' + highlightText(args.zone) + '. Narrow your search.');
		}

		return interaction.editReply('No zones found matching ' + highlightText(args.zone));
    }
    
}

