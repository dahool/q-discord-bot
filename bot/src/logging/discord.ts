import { ConfigModel } from "@/repository";
import { Guild, MessageCreateOptions, MessageFlags, TextBasedChannel } from "discord.js";

export async function logAction(guild: Guild, payload: MessageCreateOptions) {
    let config = await ConfigModel.findOne({guild: guild.id}).exec();
    if (config && config.channels?.logging) {
        let channel = guild.channels.cache.get(config.channels.logging) as TextBasedChannel;
        if (channel) {
            payload.flags = MessageFlags.SuppressNotifications;
            return channel.send(payload);
        }
    }
    return false;
}
