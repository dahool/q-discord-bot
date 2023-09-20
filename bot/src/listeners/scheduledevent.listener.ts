import { EVENT_TYPE } from "@/actions/notification";
import { EventListener } from "@/common/decorators";
import { DiscordEventListener } from "@/common/schemas";
import { logger } from "@/logging/logger";
import { CalendarModel } from "@/repository";
import { Client, Events, GatewayIntentBits, GuildScheduledEvent } from "discord.js";


@EventListener({
    event: Events.GuildScheduledEventCreate,
    requiresIntents: [ GatewayIntentBits.GuildScheduledEvents ]
})
export class OnEventCreateListener implements DiscordEventListener {

    async onEvent(client: Client, event: GuildScheduledEvent): Promise<any> {
        if (!event.creator?.bot) {
            logger.debug("Create Event %O", event);
            await CalendarModel.create({
                guild: event.guildId,
                type: EVENT_TYPE.SCHEDULED_EVENTS,
                parentId: event.id,
                extra: event.url,
                start: event.scheduledStartAt,
                summary: event.name,
                location: event.entityMetadata?.location || event.channelId,
                description: event.description,
                notified: false
            });
        }

        return Promise.resolve();
    }
    
}

@EventListener({
    event: Events.GuildScheduledEventUpdate,
    requiresIntents: [ GatewayIntentBits.GuildScheduledEvents ]
})
export class OnEventUpdateListener implements DiscordEventListener {

    async onEvent(client: Client, oldEvent: GuildScheduledEvent, event: GuildScheduledEvent): Promise<any> {
        if (!event.creator?.bot) {
            logger.debug("Update Event %O", event);
            await CalendarModel.findOneAndUpdate(
                {guild: event.guildId, type: EVENT_TYPE.SCHEDULED_EVENTS, parentId: event.id},
                {
                    extra: event.url,
                    start: event.scheduledStartAt,
                    summary: event.name,
                    location: event.entityMetadata?.location || event.channelId,
                    description: event.description,
                    notified: false
                },
                { upsert: true }
            )
        }

        return Promise.resolve();
    }
    
}

@EventListener({
    event: Events.GuildScheduledEventDelete,
    requiresIntents: [ GatewayIntentBits.GuildScheduledEvents ]
})
export class OnEventDeleteListener implements DiscordEventListener {

    async onEvent(client: Client, event: GuildScheduledEvent): Promise<any> {
        if (!event.creator?.bot) {
            logger.debug("Remove Event %O", event);
            await CalendarModel.findOneAndDelete({guild: event.guildId, type: EVENT_TYPE.SCHEDULED_EVENTS, parentId: event.id});
        }
        return Promise.resolve();
    }
    
}