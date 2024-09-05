import { TYPES, container } from "@/ic.config";
import { logger } from "@/logging/logger";
import { ConfigModel } from "@/repository";
import { BaseGuildTextChannel, Client, FetchedThreadsMore, ForumChannel, ThreadChannel, ThreadOnlyChannel } from "discord.js";

export async function openChannelThreads(guildId: string, channelId: string): Promise<any> {

    const client = container.get(TYPES.Bot).client as Client;
    const guild = client.guilds.cache.get(guildId);
    const channel = guild?.channels.resolve(channelId);
    
    let count = 0;

    logger.info(`Watch threads on ${channel?.name}`);

    if (channel?.isThread) {
        let archivedThreads: FetchedThreadsMore;
        do {
            archivedThreads = await (channel as ThreadOnlyChannel).threads.fetchArchived();
            for (let thread of archivedThreads.threads.values()) {
                count++;
                logger.info(`Unarchive '${thread.name}'`);
                try {
                    await thread.setArchived(false);    
                } catch (error) {
                    logger.error(error);
                }
            }
        } while (archivedThreads.hasMore)
    }

    return count;
}

export async function openAllThreads() {
    const configs = await ConfigModel.find({"threadArchiverWatcher":{$exists: true}}).exec();
    logger.debug(configs);
    for (let config of configs) {
        await Promise.all([
            config.threadArchiverWatcher?.channels.map(ch => openChannelThreads(config.guild, ch))
        ]);
    }
}
