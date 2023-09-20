import { createOrUpdateWebhooks } from "@/actions";
import { channelAcceptFilter, createOrUpdateChannel } from "@/common/channels";
import { EventListener } from "@/common/decorators";
import { createOrUpdateRole, roleAcceptFilter } from "@/common/roles";
import { DiscordEventListener } from "@/common/schemas";
import { logger } from "@/logging/logger";
import { ConfigModel, LocalGuildChannelModel, LocalGuildRoleModel } from "@/repository";
import { Client, Events, Guild } from "discord.js";
import UIDGenerator from "uid-generator";

async function syncChannels(client: Client, guild: Guild): Promise<any> {
    const channels = await guild.channels.fetch();
    await Promise.all(channels.filter(channelAcceptFilter)
                                .map(createOrUpdateChannel)
            );

    // clean deleted channels
    const localChannels = await LocalGuildChannelModel.find({guild: guild.id}).exec();
    return Promise.all(
        localChannels.filter(lch => !channels.some(ch => ch?.id == lch.channelId ))
                        .map(lch => { 
                            logger.debug("Remove channel %s", lch.name);
                            return lch.deleteOne();
                        })
    )
}

async function syncRoles(client: Client, guild: Guild): Promise<any> {
    const roles = await guild.roles.fetch();
    await Promise.all(roles.filter(roleAcceptFilter)
                            .map(createOrUpdateRole)
                    );

    // clean deleted roles
    const localRoles = await LocalGuildRoleModel.find({guild: guild.id}).exec();
    return Promise.all(
        localRoles.filter(localRole => !roles.some(role => role?.id == localRole.roleId ))
                        .map(localRole => { 
                            logger.debug("Remove role %s", localRole.name);
                            return localRole.deleteOne();
                        })
    )        
}

async function updateGuildToken(guild: Guild): Promise<any> {
    let config = await ConfigModel.findOne({guild: guild.id}).exec();
    if (config == undefined) {
        config = await ConfigModel.create({guild: guild.id, name: guild.name});
    }
    if (config.token == undefined) {
        logger.debug("Generate token for %s", config.guild);
        config.token = (new UIDGenerator(256, UIDGenerator.BASE62)).generateSync();
        return config.save();
    }
    return true;
}

@EventListener({
    event: Events.ClientReady,
    once: true
})
export class ReadyListener implements DiscordEventListener {

    async onEvent(client: Client, ...args: any): Promise<any> {
        const guilds = client.guilds.cache.filter(c => c.channels);
        for (const [guildId, guild] of guilds) {
            logger.debug("Sync %s", guild.name);
            await Promise.all([
                updateGuildToken(guild),
                syncChannels(client, guild),
                syncRoles(client, guild),
                createOrUpdateWebhooks(client, guild)
            ]);
        }
        logger.debug("Sync completed.");
        return true;
    }
    
}

@EventListener({
    event: [Events.GuildCreate, Events.GuildDelete],
    once: true
})
export class GuildClientUpdateListener implements DiscordEventListener {

    async onEvent(client: Client, guild: Guild): Promise<any> {
        logger.debug("Sync %s", guild.name);
        await Promise.all([
            updateGuildToken(guild),
            syncChannels(client, guild),
            syncRoles(client, guild)
        ]);
        logger.debug("Sync completed.");
    }
    
}
