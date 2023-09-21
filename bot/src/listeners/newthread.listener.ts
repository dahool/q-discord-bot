import { EventListener } from "@/common/decorators";
import { DiscordEventListener } from "@/common/schemas";
import { asChannel, asUser } from "@/common/utils";
import { logger } from "@/logging/logger";
import { ConfigModel } from "@/repository";
import { Client, Events, GuildTextBasedChannel, ThreadChannel } from "discord.js";
import format from 'string-template';

@EventListener({
    event: Events.ThreadCreate
})
export class NewTheadFollowerListener implements DiscordEventListener {

    async onEvent(client: Client, thread: ThreadChannel, isNew: boolean): Promise<any> {
        if (isNew && thread.invitable == null && thread.parent) {
            logger.debug("New Thread Created %s", thread.name);
            const config = await ConfigModel.findOne({guild: thread.guildId});
            if (config?.autoFollowThreadChannels && config?.autoFollowThreadChannels.includes(thread.parentId!)) {
                logger.debug("Adding members to %s", thread.name);
                for (const [id, member] of thread.parent?.members!) {
                    if (!member.user.bot) await thread.members.add(id);
                }
            }
		}
        return Promise.resolve();
        
    }
    
}


@EventListener({
    event: Events.ThreadCreate
})
export class NewTheadPingerListener implements DiscordEventListener {

    async onEvent(client: Client, thread: ThreadChannel, isNew: boolean): Promise<any> {
        
        if (isNew && thread.parent) {
            logger.debug("New Thread Created %s", thread.name);
            const config = await ConfigModel.findOne({guild: thread.guildId});
            if (config?.newThreadAnnouncer) {
                const payload = {
                    channel: asChannel(thread.parentId!),
                    title: asChannel(thread.id),
                    user: asUser(thread.guild.members.cache.get(thread.ownerId!)?.id!)
                }
                for (let aConf of config.newThreadAnnouncer) {
                    if (aConf.channels.includes(thread.parentId!)) {
                        const channel = thread.guild.channels.cache.get(aConf.announceChannel) as GuildTextBasedChannel;
                        logger.debug("Sending announcement to %s", channel.name);
                        channel.send({content: format(aConf.message, payload)});
                    }
                }
            }
		}
        return Promise.resolve();

    }
    
}
