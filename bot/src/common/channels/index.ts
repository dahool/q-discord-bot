import { logger } from "@/logging/logger";
import { LocalGuildChannelModel } from "@/repository";
import { Channel, ChannelType, GuildChannel } from "discord.js";

export function channelAcceptFilter(channel: Channel | null): boolean {
    return channel != null && (ChannelType.GuildText === channel?.type || ChannelType.GuildForum === channel?.type );
}

export async function createOrUpdateChannel(channel: GuildChannel | null): Promise<any> {
    let chData = { name: channel?.name };
    if (channel?.parent) {
        Object.assign(chData, { category: channel.parent.name });
    }
    return LocalGuildChannelModel.findOneAndUpdate(
        {guild: channel!.guildId, channelId: channel?.id},
        chData,
        { upsert: true, includeResultMetadata: true }
    ).exec().then(result => {
        if (!result.lastErrorObject?.updatedExisting) {
            logger.debug("Created channel %s", channel?.name);
        }
    });    
}