import { logger } from "@/logging/logger";
import { Config, ConfigModel, WebhookModel } from "@/repository";
import { Client, Guild, GuildBasedChannel, TextChannel } from "discord.js";

export async function createOrUpdateWebhooks(client: Client, guild: Guild, config?: Config | null): Promise<any> {
    if (config == undefined || config == null) config = await ConfigModel.findOne({guild: guild.id}).exec();
    if (config?.channels) {
        for (let [configKey, chId] of Object.entries(config.channels)) {
            if (chId != undefined) createWebhook(client, guild.channels.cache.get(chId)).catch(e => logger.error("Error config %s: %s", configKey, e));
        }
    }
    return true;
}

export async function createWebhook(client: Client, channel: GuildBasedChannel | undefined): Promise<void> {
    return new Promise((reso, reje) => {
        if (channel && channel?.isTextBased()) {
            WebhookModel.findOne({guild: channel.guildId, channelId: channel.id}).exec().then(r => {
                if (!r) {
                    logger.info("Initialize webhook for channel %s", channel.name);
                    (channel as TextChannel).createWebhook({
                        name: client.user?.username!,
                        avatar: client.user?.avatar,
                        reason: "WebhookFor" + channel.name
                    }).then((w) => {
                        WebhookModel.create({guild: channel.guildId, channelId: channel.id, webhookId: w.id, webhookToken: w.token});
                        reso();
                    }).catch((e) => {
                        logger.error(e);
                        reje(e);
                    })
                }
            })
        } else {
            reje("Channel invalid or not Text " + channel);
        }
    })
}