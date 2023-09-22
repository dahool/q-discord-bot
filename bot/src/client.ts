import { Client, MessagePayload, WebhookMessageCreateOptions } from "discord.js";
import { TYPES, container } from "./ic.config";
import { Config, ConfigModel, LocalGuildChannel, LocalGuildChannelModel, LocalGuildRole, LocalGuildRoleModel } from "./repository";

export class LocalChannelManager {

    channel: LocalGuildChannel;

    constructor(channel: LocalGuildChannel) {
        this.channel = channel;
    }

    async send(options: string | MessagePayload | WebhookMessageCreateOptions): Promise<any> {
        const client = container.get(TYPES.Bot).client as Client;
        const gChannel = client.guilds.cache.get(this.channel.guild)?.channels.cache.get(this.channel.channelId);
        if (gChannel && gChannel.isTextBased()) {
            return gChannel.send(options);
        }
        return Promise.reject("Channel not found!");
        /*const whConfig = await WebhookModel.findOne({guild: this.channel.guild, channelId: this.channel.channelId}).exec();
        if (whConfig) {
            const webClient = new WebhookClient({ id: whConfig.webhookId, token: whConfig.webhookToken});
            return webClient.send(options);
        }
        return Promise.reject("Webhook not found!");*/
    }

}
export class LocalGuildClient {

    guildId: string;

    constructor(guildId: string) {
        this.guildId = guildId;
    }

    getConfig(): Promise<Config | null> {
        return ConfigModel.findOne({ guild: this.guildId }).exec();
    }
 
    getChannels(): Promise<LocalChannelManager[]> {
        return new Promise(resolve => {
            LocalGuildChannelModel.find({ guild: this.guildId }).exec()
                .then(list => {
                    if (list.length == 0) {
                        resolve([]);
                    } else {
                        resolve(list.map(ch => new LocalChannelManager(ch)));
                    }
                })
        })
    }

    getChannel(id: string): Promise<LocalChannelManager | null> {
        return new Promise(resolve => {
            LocalGuildChannelModel.findOne({ guild: this.guildId, channelId: id}).exec()
                .then(r => {
                    if (!r) {
                        resolve(null)
                    } else {
                        resolve(new LocalChannelManager(r));
                    }
                })
        })
    }

    getRoles(): Promise<LocalGuildRole[]> {
        return LocalGuildRoleModel.find({ guild: this.guildId }).exec();
    }
    
}