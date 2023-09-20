import { logger } from "@/logging/logger";
import { Guild, GuildScheduledEvent, GuildScheduledEventCreateOptions, GuildScheduledEventEntityType, GuildScheduledEventPrivacyLevel, GuildScheduledEventStatus } from "discord.js";
import { DateTime } from "luxon";

export async function deleteScheduledEvent(guild: Guild, id: string): Promise<void> {
    logger.debug("Remove event %s", id);
    const event = await guild.scheduledEvents.fetch(id);
    return guild.scheduledEvents.delete(event);
}

/*
 * by default, all events in a channel will be voice
 * type: voice / general
 */
export async function createScheduledEvent(
    guild: Guild, 
    title: string, 
    description: string, 
    type: string, 
    startTime: DateTime, 
    durationInMinutes: number, 
    location: string): Promise<GuildScheduledEvent<GuildScheduledEventStatus>> {
    
    let options: GuildScheduledEventCreateOptions = {
        name: title,
        description: description,
        scheduledStartTime: startTime.toJSDate(),
        scheduledEndTime: startTime.plus({ minutes: durationInMinutes }).toJSDate(),
        privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
        entityType: type == 'voice' ? GuildScheduledEventEntityType.Voice : GuildScheduledEventEntityType.External
    };
    if (type == 'voice') {
        options.channel = location;
    } else {
        options.entityMetadata = {'location': location};
    }
    return guild.scheduledEvents.create(options);
}

