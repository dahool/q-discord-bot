import { EVENT_TYPE } from '@/actions/notification';
import { TYPES, container } from '@/ic.config';
import { logger } from '@/logging/logger';
import { CalendarEvent, CalendarModel, TerritoryEvent, TerritoryEventModel } from '@/repository';
import zonesData from '@data/zones.json';
import { Client } from 'discord.js';
import { DateTime } from 'luxon';
import { DiscordSchedule } from './events';

export namespace TerritoryEvents {

    export function listCalendarEntries(guildId: string, days: number): Promise<CalendarEvent[]> {
		
        const fromDate = DateTime.utc().toJSDate();
		const toDate = DateTime.utc().endOf('day').plus({days: days}).toJSDate();
	
		return CalendarModel.find({
			guild: guildId,
			type: EVENT_TYPE.TERRITORY,
			notified: false,
			start: { $gte: fromDate, $lte: toDate }
		}).sort({ start: 1 }).allowDiskUse(true).exec();
        
    }

    export async function createNewEvent(guildId: string, zone: Territory.Zone, ops: {title: string, recurrent?: boolean, ping?: string[]}): Promise<TerritoryEvent> {
        
        let duration = 60;
		if (zone.type == 1) {
			duration = 30;
		} else if (zone.type == 2) {
			duration = 45;
		}

		const model = new TerritoryEventModel({
			guild: guildId,
			zone: zone.zone,
			title: ops.title,
			next:  zone.next.toJSDate(),
			recurrent: ops.recurrent || false,
			duration: duration,
			ping: ops.ping
		})
		
		await model.save();
		await TerritoryEvents.createCalendarEntry(model);

        return model;
    }

    export async function createCalendarEntry(event: TerritoryEvent) {
        logger.debug("Create calendar entry for %O", event);
        let ping: string[] = [];
        if (event.ping) {
            if (Array.isArray(event.ping)) {
                ping = event.ping;
            } else {
                ping = [ event.ping ];
            }
        }
        return CalendarModel.create({
            guild: event.guild,
            type: EVENT_TYPE.TERRITORY,
            summary: event.title,
            location: event.zone,
            start: event.next,
            duration: event.duration,
            parentId: event._id,
            notified: false,
            pingRoles: ping
        })
    }

	export async function deleteCalendarEntry(event: TerritoryEvent) {
		logger.debug("Remove calendar entries for %s", event._id);
		const calendarEvents = await CalendarModel.find({parentId: event._id}).exec();
		await Promise.all(
			calendarEvents
			.filter(e => e.discordEventId != undefined && e.discordEventId != '')
			.map(e => {
                const client = container.get(TYPES.Bot).client as Client;
                const guild = client.guilds.cache.get(e.guild);
                if (guild) DiscordSchedule.deleteScheduledEvent(guild, e.discordEventId!)
            })
		)
        return CalendarModel.deleteMany({
            _id: {$in: calendarEvents.map(e => e._id)}
        }).exec()
	}

	export async function deleteTerritoryEvent(eventId: string): Promise<TerritoryEvent | null> {
        let eventModel = await TerritoryEventModel.findById(eventId).exec();
        if (eventModel) {
            await deleteCalendarEntry(eventModel);
            logger.debug("Remove territory event %O", eventModel);
            await eventModel.deleteOne();
        }
        return eventModel;
	}

}

export namespace Territory {

    export interface Zone {
        zone: string,
        type: number,
        weekday: number,
        time: string,
        particle: string,
        rss: string[],
        paths: string[],
        next: DateTime
    }

    export function getNextExecution(zone: any): DateTime {
        const today = DateTime.utc();
        var zoneTime = today.set({hour: zone.time.substr(0,2), minute: zone.time.substr(2,2)}).setLocale('en');
        if (today.weekday == zone.weekday) {
            if (zoneTime < today) {
                return zoneTime.plus({days: 7});
            }
            return zoneTime;
        }
        do {
            zoneTime = zoneTime.plus({days: 1});
        } while (zoneTime.weekday != zone.weekday);
        return zoneTime;
    }

    export function findZonesByParticle(name: string): Zone[] {
        return zonesData
            .filter(z => z.particle.toLowerCase().includes(name))
            .map(z => Object.assign({next: getNextExecution(z)}, z));
    }

    export function findZonesByName(name: string): Zone[] {
        return zonesData
            .filter(z => z.zone.toLowerCase().includes(name.toLowerCase()))
            .map(z => Object.assign({next: getNextExecution(z)}, z));
    }

    export function listAll(): Zone[] {
        return zonesData
            .sort((a, b) => a.zone.localeCompare(b.zone) )
            .map(z => Object.assign({next: getNextExecution(z)}, z));
    }

}


