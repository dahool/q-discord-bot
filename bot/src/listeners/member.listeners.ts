import { EventListener } from "@/common/decorators";
import { DiscordEventListener } from "@/common/schemas";
import { logger } from "@/logging/logger";
import { GuildMemberModel } from "@/repository";
import { Client, Events, GuildMember, Presence } from "discord.js";

async function getOrCreateMember(member: GuildMember) {
    let model = await GuildMemberModel.findOne({guild: member.guild.id, memberId: member.id}).exec();
    if (model == null) {
        model = new GuildMemberModel({
            guild: member.guild.id,
            memberId: member.id,
            username: member.user.username,
            avatar: member.displayAvatarURL(),
            alias: [ member.displayName ]
        });
    }
    return model;
}

@EventListener({
    event: Events.GuildMemberRemove
})
export class GuildMemberRemoveListener implements DiscordEventListener {

    async onEvent(client: Client, member: GuildMember): Promise<any> {
        logger.debug("%s has left", member.user.username);
        let model = await getOrCreateMember(member);
        model.left = new Date();
        return model.save();
    }
    
}

@EventListener({
    event: Events.GuildMemberUpdate
})
export class GuildMemberUpdateListener implements DiscordEventListener {

    async onEvent(client: Client, oldMember: GuildMember, member: GuildMember): Promise<any> {
        let model = await getOrCreateMember(member);
        let aliases = new Set([...model.alias, oldMember.displayName, member.displayName]);
        model.lastSeen = new Date();
        model.alias = Array.from(aliases);
        model.avatar = member.displayAvatarURL();
        logger.debug("Updated: %s [%s]", member.user.username, model.alias);        
        return model.save();
    }
    
}

@EventListener({
    event: Events.GuildMemberAdd
})
export class GuildMemberAddListener implements DiscordEventListener {

    async onEvent(client: Client, member: GuildMember): Promise<any> {
        logger.debug("Join: %s", member.user.username)
        let model = await getOrCreateMember(member);
        model.join = new Date();
        model.lastSeen = new Date();
        if (model.left) {
            logger.info("%s has joined again. Last time left %s", member.user.username, model.left);
        }
        return model.save();
    }
    
}

@EventListener({
    event: Events.PresenceUpdate
})
export class GuildMemberPresenceUpdateListener implements DiscordEventListener {

    async onEvent(client: Client, oldPre: Presence, newPre: Presence): Promise<any> {
        let model = await getOrCreateMember(newPre.member!);
        logger.debug("Updated: %s", model.username)
        model.lastSeen = new Date();
        if (newPre.member) model.avatar = newPre.member.displayAvatarURL();
        return model.save();
    }
    
}