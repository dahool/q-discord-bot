import { EventListener } from "@/common/decorators";
import { DiscordEventListener } from "@/common/schemas";
import { logAction } from "@/logging/discord";
import { logger } from "@/logging/logger";
import { GuildInviteRolesModel, GuildMemberModel } from "@/repository";
import { Client, Collection, Colors, EmbedBuilder, Events, GatewayIntentBits, Guild, GuildMember, Invite, Role, roleMention, time, userMention } from "discord.js";
import { setTimeout } from 'timers/promises';

const invitesCache = new Collection<string, Collection<string, number | null>>();

@EventListener({
    event: Events.ClientReady,
    once: true
})
export class InitializeInviteCache implements DiscordEventListener {

    async onEvent(client: Client, ...args: any): Promise<any> {

        await setTimeout(1000); // wait for the cache to be really ready

        client.guilds.cache.forEach(async (guild) => {
            const invites = await guild.invites.fetch();
            logger.debug("Caching invites for guild: %s [%s]", guild.id, invites);
            invitesCache.set(guild.id, new Collection(invites.map((invite) => [invite.code, invite.uses])));
        })

    }
    
}

@EventListener({
    event: Events.GuildCreate,
    once: true
})
export class NewGuildInviteCache implements DiscordEventListener {

    async onEvent(client: Client, guild: Guild): Promise<any> {
        const invites = await guild.invites.fetch();
        logger.debug("Caching invites for guild: %s [%s]", guild.id, invites);
        invitesCache.set(guild.id, new Collection(invites.map((invite) => [invite.code, invite.uses])));
    }
    
}

@EventListener({
    event: Events.GuildCreate,
    once: true
})
export class RemoveGuildInviteCache implements DiscordEventListener {

    async onEvent(client: Client, guild: Guild): Promise<any> {
        logger.debug("Remove invites for guild: %s", guild.id);
        invitesCache.delete(guild.id);
    }
    
}

@EventListener({
    event: Events.InviteDelete,
    requiresIntents: [ GatewayIntentBits.GuildInvites]
})
export class InviteDeleteListener implements DiscordEventListener {

    async onEvent(client: Client, invite: Invite): Promise<any> {
        if (invite.guild) {
            logger.debug("Remove invite %s for guild %s", invite.code, invite.guild.id);
            invitesCache.get(invite.guild.id)!.delete(invite.code);
        }
    }
    
}

@EventListener({
    event: Events.InviteCreate,
    requiresIntents: [ GatewayIntentBits.GuildInvites ]
})
export class InviteCreateListener implements DiscordEventListener {

    async onEvent(client: Client, invite: Invite): Promise<any> {
        if (invite.guild) {
            logger.debug("Cache invite %s for guild %s", invite.code, invite.guild.id);
            invitesCache.get(invite.guild.id)!.set(invite.code, invite.uses);
        }
    }
    
}

@EventListener({
    event: Events.GuildMemberAdd
})
export class GuildMemberJoinTrackerListener implements DiscordEventListener {

    async onEvent(client: Client, member: GuildMember): Promise<any> {
        const invites = await member.guild.invites.fetch();
        const cached = invitesCache.get(member.guild.id);
        const updatedInvite = invites.find(i => i.uses! > cached!.get(i.code)!)
        if (updatedInvite) {
            invitesCache.get(member.guild.id)!.set(updatedInvite.code, updatedInvite.uses);
            const autoRole = await GuildInviteRolesModel.findOne({guild: member.guild.id, code: updatedInvite?.code}).exec()
            if (autoRole != null) {
                const newRoles = autoRole.roles.map(rid => member.guild.roles.cache.get(rid)) as Role[];
                logger.debug("Member %s joined using invite %s. Add roles %s", member.user.username, updatedInvite?.code, autoRole.roles);
                this.log(member, autoRole.roles);
                newRoles.forEach(role => {
                    member.roles.add(role).catch(error => {
                        logger.error("Unable to add role %s", role.name);
                    })
                })
            }
        } else {
            logger.error("Couldn't determine what invite was used by %s", member.user.username);
        }
    }

    async log(member: GuildMember, roles: string[]) {

		const msgEmbed = new EmbedBuilder()
			.setColor(Colors.Aqua)
			.setAuthor({ name: member.displayName, iconURL: member.displayAvatarURL()})
			.setThumbnail(member.displayAvatarURL())
			.setDescription(userMention(member.user.id) + ' joined the server')
			.setTimestamp();

        msgEmbed.addFields({
            name: 'Account creation', value: time(member.user.createdAt, 'R')
        })

        const mModel = await GuildMemberModel.findOne({guild: member.guild.id, memberId: member.id }).exec();
        if (mModel && mModel.alias && mModel.left != undefined) {
            msgEmbed.addFields(
                { name: 'Returning member', value: 'Yes'},
                { name: 'Previously known as', value: mModel.alias.join('\n')},
                { name: 'Last seen', value: time(mModel.left, 'R')}
            )
        }

        if (roles) {
            msgEmbed.addFields(
                { name: ':white_check_mark: Added roles', value: roles.map(r => roleMention(r)).join('\n')}
            )
        }

        return logAction(member.guild, { embeds: [msgEmbed] });

    }
    
}
