import { EventListener } from "@/common/decorators";
import { DiscordEventListener } from "@/common/schemas";
import { logAction } from "@/logging/discord";
import { logger } from "@/logging/logger";
import { GuildMemberModel } from "@/repository";
import { AuditLogEvent, Client, Colors, EmbedBuilder, Events, GatewayIntentBits, GuildMember, Presence, roleMention, userMention } from "discord.js";

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
    event: Events.GuildMemberRemove,
    requiresIntents: [ GatewayIntentBits.GuildMembers ]
})
export class GuildMemberRemoveListener implements DiscordEventListener {

    async onEvent(client: Client, member: GuildMember): Promise<any> {
        logger.debug("%s has left", member.user.username);
        let model = await getOrCreateMember(member);
        model.left = new Date();
        this.log(member);
        return model.save();
    }
    
    async log(member: GuildMember) {

        const msgEmbed = new EmbedBuilder()
            .setColor(Colors.DarkNavy)
            .setAuthor({ name: member.displayName, iconURL: member.displayAvatarURL()})
            .setThumbnail(member.displayAvatarURL())
            .setDescription(userMention(member.user.id) + ' left the server')
            .setTimestamp();
    
        let auditLog = await member.guild.fetchAuditLogs({type: AuditLogEvent.MemberKick, limit: 1, user: member});
        if (auditLog) {
            let entry = auditLog.entries.first();
            if (entry?.executor) {
                msgEmbed.setFooter({text: 'Updated by ' + userMention(entry.executor.id), iconURL: entry.executor.displayAvatarURL()})
            }
        }

        return logAction(member.guild, { embeds: [msgEmbed] });
    }

}

@EventListener({
    event: Events.GuildMemberUpdate,
    requiresIntents: [ GatewayIntentBits.GuildMembers ]
})
export class GuildMemberUpdateListener implements DiscordEventListener {

    async onEvent(client: Client, oldMember: GuildMember, member: GuildMember): Promise<any> {
        let model = await getOrCreateMember(member);
        let aliases = new Set([...model.alias, oldMember.displayName, member.displayName]);
        model.lastSeen = new Date();
        model.alias = Array.from(aliases);
        model.avatar = member.displayAvatarURL();
        logger.debug("Updated: %s [%s]", member.user.username, model.alias);
        this.log(member, oldMember);
        return model.save();
    }

    async log(member: GuildMember, oldMember: GuildMember) {

        const msgEmbed = new EmbedBuilder()
            .setColor(Colors.DarkNavy)
            .setAuthor({ name: member.displayName, iconURL: member.displayAvatarURL()})
            .setThumbnail(member.displayAvatarURL())
            .setDescription(userMention(member.user.id) + ' profile updated')
            .setTimestamp();
    
        let auditLog = await member.guild.fetchAuditLogs({type: AuditLogEvent.MemberRoleUpdate, limit: 1, user: member});
        if (auditLog) {
            let entry = auditLog.entries.first();
            if (entry?.executor) {
                msgEmbed.setFooter({text: 'Updated by ' + userMention(entry.executor.id), iconURL: entry.executor.displayAvatarURL()})
            }
        }

        if (member.nickname != oldMember.nickname) {
            msgEmbed.addFields({
                name: ':bust_in_silhouette: Name updated', value: `${oldMember.nickname} -> ${member.nickname}`
            })            
        }

        let newRoles = member.roles.cache.filter(role => oldMember.roles.cache.get(role.id) == undefined);
        if (newRoles && newRoles.size > 0) {
            msgEmbed.addFields({
                name: ':white_check_mark: Added roles', value: newRoles.map(r => roleMention(r.id)).join('\n')
            })
        }

        let removedRoles = oldMember.roles.cache.filter(role => member.roles.cache.get(role.id) == undefined);
        if (removedRoles && removedRoles.size > 0) {
            msgEmbed.addFields({
                name: ':no_entry: Removed roles', value: removedRoles.map(r => roleMention(r.id)).join('\n')
            })
        }

        return logAction(member.guild, { embeds: [msgEmbed] });
        
    }    
}

@EventListener({
    event: Events.GuildMemberAdd,
    requiresIntents: [ GatewayIntentBits.GuildMembers ]
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
        //logger.debug("Updated: %s", model.username)
        model.lastSeen = new Date();
        if (newPre.member) model.avatar = newPre.member.displayAvatarURL();
        return model.save();
    }
    
}