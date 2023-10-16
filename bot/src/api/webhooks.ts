import { logger } from "@/logging/logger";
import { Config, ConfigModel, WebhookModel } from "@/repository";
import { Client, Guild, GuildBasedChannel, TextChannel } from "discord.js";

export namespace Webhook {

    export async function createOrUpdateAll(client: Client, guild: Guild, config?: Config | null): Promise<any> {
        if (config == undefined || config == null) config = await ConfigModel.findOne({guild: guild.id}).exec();
        if (config?.channels) {
            for (let [configKey, chId] of Object.entries(config.channels)) {
                try {
                    if (chId != undefined) await createOrUpdateOne(client, guild.channels.cache.get(chId)).catch(e => logger.error("Error config %s: %s", configKey, e));
                } catch(e: any) {
                }
            }
        }
        return true;
    }
    
    export async function createOrUpdateOne(client: Client, channel: GuildBasedChannel | undefined): Promise<void> {
        return new Promise((reso) => {
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
                            reso(e);
                        })
                    }
                })
            } else {
                if (channel != undefined) logger.warn("Channel for WebHook invalid or not type Text %s", channel);
                reso();
            }
        })
    }

}

