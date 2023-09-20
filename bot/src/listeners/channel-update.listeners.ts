import { channelAcceptFilter, createOrUpdateChannel } from "@/common/channels";
import { EventListener } from "@/common/decorators";
import { DiscordEventListener } from "@/common/schemas";
import { logger } from "@/logging/logger";
import { LocalGuildChannelModel } from "@/repository";
import { Channel, Client, Events, GuildChannel } from "discord.js";


@EventListener({
    event: Events.ChannelCreate
})
export class ChannelCreateListener implements DiscordEventListener {

    async onEvent(client: Client, channel: Channel): Promise<any> {
        if (channelAcceptFilter(channel)) {
            return createOrUpdateChannel(channel as GuildChannel);
        }
        return true;
    }
    
}

@EventListener({
    event: Events.ChannelUpdate
})
export class ChannelUpdateListener implements DiscordEventListener {

    async onEvent(client: Client, oldChannel: Channel, channel: Channel): Promise<any> {
        if (channelAcceptFilter(channel)) {
            const guildChannel = channel as GuildChannel;
            logger.debug("Updated channel %s -> %s",(oldChannel as GuildChannel)?.name, guildChannel.name);
            return createOrUpdateChannel(guildChannel);
        }
        return true;
    }
    
}

@EventListener({
    event: Events.ChannelDelete
})
export class ChannelDeleteListener implements DiscordEventListener {

    async onEvent(client: Client, channel: Channel): Promise<any> {
        if (channelAcceptFilter(channel)) {
            const gChannel = channel as GuildChannel;
            logger.debug("Deleted channel %s", gChannel.name);
            await LocalGuildChannelModel.findOneAndRemove({guild: gChannel.guildId, channelId: gChannel.id}).exec();
        }
        return true;
    }
    
}