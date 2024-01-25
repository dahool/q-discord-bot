import { EventListener } from "@/common/decorators";
import { DiscordEventListener } from "@/common/schemas";
import { asChannel } from "@/common/utils";
import { logger } from "@/logging/logger";
import { ConfigModel } from "@/repository";
import { Client, Events, GuildTextBasedChannel, ThreadChannel } from "discord.js";
import format from 'string-template';
import { setTimeout } from "timers/promises";

@EventListener({
    event: Events.ThreadCreate
})
export class NewTheadFollowerListener implements DiscordEventListener {

    async onEvent(client: Client, thread: ThreadChannel, isNew: boolean): Promise<any> {
        if (isNew && thread.invitable == null && thread.parent) {
            logger.debug("New Thread Created %s", thread.name);
            const config = await ConfigModel.findOne({guild: thread.guildId});
            let memberstoAdd = thread.parent?.members.filter(member => !member.user.bot).map(member => member);
            config?.autoFollowThreadChannels?.filter(cfg => cfg.channel == thread.parentId).forEach(cfg => {
                if (memberstoAdd.length > 0) {
                    logger.debug("Adding %d members to %s", memberstoAdd.length, thread.name);
                    if (cfg.silent) {
                        thread.send(memberstoAdd.map(member => member.toString()).join(' ')).then(message => {
                            setTimeout(100).then(() => message.delete());
                        })
                    } else {
                        memberstoAdd.forEach(member => thread.members.add(member));
                    }
                }
            })
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
                    user: thread.guild.members.cache.get(thread.ownerId!)?.toString()
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
