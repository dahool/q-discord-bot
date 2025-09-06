import { EventListener } from "@/common/decorators";
import { createOrUpdateRole, roleAcceptFilter } from "@/common/roles";
import { DiscordEventListener } from "@/common/schemas";
import { logger } from "@/logging/logger";
import { LocalGuildRoleModel } from "@/repository";
import { Client, Events, Role } from "discord.js";


@EventListener({
    event: Events.GuildRoleCreate
})
export class RoleCreateListener implements DiscordEventListener {

    async onEvent(client: Client, role: Role): Promise<any> {
        if (roleAcceptFilter(role)) {
            return createOrUpdateRole(role);
        }
        return true;
    }
    
}

@EventListener({
    event: Events.GuildRoleUpdate
})
export class RoleUpdateListener implements DiscordEventListener {

    async onEvent(client: Client, oldRole: Role, role: Role): Promise<any> {
        if (roleAcceptFilter(role) && oldRole.name != role.name) {
            logger.debug("Updated role %s -> %s", oldRole?.name, role.name);
            return createOrUpdateRole(role);
        }
        return true;
    }
    
}

@EventListener({
    event: Events.GuildRoleDelete
})
export class RoleDeleteListener implements DiscordEventListener {

    async onEvent(client: Client, role: Role): Promise<any> {
        logger.debug("Deleted role %s", role.name);
        return LocalGuildRoleModel.findOneAndDelete({guild: role.guild.id, roleId: role.id }).exec();
    }
    
}