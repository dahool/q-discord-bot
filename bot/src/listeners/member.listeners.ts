import { EventListener } from "@/common/decorators";
import { DiscordEventListener } from "@/common/schemas";
import { logger } from "@/logging/logger";
import { GuildMemberModel } from "@/repository";
import { Client, Events, GuildMember, Presence } from "discord.js";


@EventListener({
    event: Events.GuildMemberRemove
})
export class GuildMemberRemoveListener implements DiscordEventListener {

    async onEvent(client: Client, member: GuildMember): Promise<any> {
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
        logger.debug("Removed: %s", member.user.username)
        model.left = new Date();
        return model.save();
    }
    
}

@EventListener({
    event: Events.GuildMemberUpdate
})
export class GuildMemberUpdateListener implements DiscordEventListener {

    async onEvent(client: Client, oldMember: GuildMember, member: GuildMember): Promise<any> {
        let model = await GuildMemberModel.findOne({guild: member.guild.id, memberId: member.id}).exec();
        if (model == null) {
            model = new GuildMemberModel({
                guild: member.guild.id,
                memberId: member.id,
                username: member.user.username,
                lastSeen: new Date(),
                alias: [ oldMember.displayName, member.displayName ]
            });
        }
        let aliases = new Set(model.alias);
        aliases.add(member.displayName);
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
        let model = await GuildMemberModel.findOne({guild: member.guild.id, memberId: member.id}).exec();
        logger.debug("Joined: %s", member.user.username)
        if (model == null) {
            model = new GuildMemberModel({
                guild: member.guild.id,
                memberId: member.id,
                username: member.user.username,
                join: new Date(),
                lastSeen: new Date(),
                avatar: member.displayAvatarURL(),
                alias: [ member.displayName ]
            });
        } else {
            logger.debug("%s joined again", member.user.username);
        }
        model.join = new Date();
        model.lastSeen = new Date();
        model.left = undefined;
        return model.save();
    }
    
}

@EventListener({
    event: Events.PresenceUpdate
})
export class GuildMemberPresenceUpdateListener implements DiscordEventListener {

    async onEvent(client: Client, oldPre: Presence, newPre: Presence): Promise<any> {
        let model = await GuildMemberModel.findOne({guild: newPre.guild?.id, memberId: newPre.member?.id}).exec();
        logger.debug("Updated: %s", newPre.member?.user.username)
        if (model == null) {
            model = new GuildMemberModel({
                guild: newPre.guild?.id,
                memberId: newPre.member?.id,
                username: newPre.member?.user.username,
                alias: [ newPre.member?.displayName ]
            });
        }
        model.lastSeen = new Date();
        if (newPre.member) model.avatar = newPre.member.displayAvatarURL();
        return model.save();
    }
    
}