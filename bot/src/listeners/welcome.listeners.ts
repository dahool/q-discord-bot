import { EventListener } from "@/common/decorators";
import { DiscordEventListener } from "@/common/schemas";
import { asUser, isNotBlank } from "@/common/utils";
import { logger } from "@/logging/logger";
import { Config, ConfigModel, GuildMemberModel, TemporalRolesModel } from "@/repository";
import { Client, Events, GuildMember, GuildTextBasedChannel } from "discord.js";
import format from 'string-template';

async function getConfig(member: GuildMember): Promise<Config | null> {
    return ConfigModel.findOne({guild: member.guild.id}).exec();
}

async function sendMessage(member: GuildMember, channelId: string, message: string) {
    const channel = member.guild.channels.cache.get(channelId) as GuildTextBasedChannel;
    if (channel) {
        const payload = {
            user: asUser(member.user.id),
            server: member.guild.name
        }
        logger.debug("Posting message with payload %s on %s", payload, channel.name);
        return channel.send({content: format(message, payload)});
    }
    return false;
}

@EventListener({
    event: Events.GuildMemberRemove
})
export class GoodByeMemberListener implements DiscordEventListener {

    async onEvent(client: Client, member: GuildMember): Promise<any> {
        logger.debug("Goodbye: %s", member.user.username);
        let config = await getConfig(member);
        if (config?.welcomeBye?.leaves?.active === true) {
            sendMessage(member, config.welcomeBye.leaves.channel, config.welcomeBye.leaves.message);
        }
    }
    
}

@EventListener({
    event: Events.GuildMemberAdd
})
export class WelcomeMemberListener implements DiscordEventListener {

    async onEvent(client: Client, member: GuildMember): Promise<any> {
        logger.debug("Welcome: %s", member.user.username)
        let config = await getConfig(member);
        if (config?.welcomeBye?.join?.active === true) {
            let memberInfo = await GuildMemberModel.findOne({guild: member.guild.id, memberId: member.id}).exec();
            let message = config.welcomeBye.join.message;
            if (memberInfo?.left !== undefined && isNotBlank(config.welcomeBye.join.message2)) {
                message = config.welcomeBye.join.message2!;
            }
            sendMessage(member, config.welcomeBye.join.channel, message);
            if (config.welcomeBye.join.roles) {
                config.welcomeBye.join.roles.forEach(roleId => {
                    const role = member.guild.roles.cache.get(roleId);
                    if (role) {
                        member.roles.add(role).then(() => {
                            TemporalRolesModel.create({
                                guild: member.guild.id,
                                memberId: member.id,
                                roleId: role.id,
                                created: new Date()
                            })
                        });
                    }
                })
            }
        }
    }
    
}
