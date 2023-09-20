import { EVENT_TYPE } from '@/actions/notification';
import { logger } from '@/logging/logger';
import { CalendarModel, TerritoryEvent } from '@/repository';
import rssData from '@data/rss.json';
import zonesData from '@data/zones.json';
import { DateTime } from 'luxon';

export const rssMap = new Map();
rssData.forEach(item => {
	rssMap.set(item.id, item.icon)
})

export interface Territory {
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

export function findZonesByParticle(name: string): Territory[] {
	return zonesData
		.filter(z => z.particle.toLowerCase().includes(name))
		.map(z => Object.assign({next: getNextExecution(z)}, z));
}

export function findZonesByName(name: string): Territory[] {
	return zonesData
		.filter(z => z.zone.toLowerCase().includes(name.toLowerCase()))
		.map(z => Object.assign({next: getNextExecution(z)}, z));
}

export async function createEventCalendar(event: TerritoryEvent) {
	logger.debug("Create calendar entry for %O", event);
	return CalendarModel.create({
		guild: event.guild,
		type: EVENT_TYPE.TERRITORY,
		summary: event.title,
		location: event.zone,
		start: event.next,
		duration: event.duration,
		parentId: event._id,
		notified: false,
		pingRoles: event.ping ? [ event.ping ] : []
	})
}

export * from "./add.command";
export * from "./delete.command";
export * from "./info.command";
export * from "./list.command";

