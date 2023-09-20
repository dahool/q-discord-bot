import { logger } from "@/logging/logger";
import { LocalGuildRoleModel } from "@/repository";
import { Role } from "discord.js";

export function roleAcceptFilter(role: Role): boolean {
    return !role.name.startsWith("@");
}

export async function createOrUpdateRole(role: Role): Promise<any> {
    return LocalGuildRoleModel.findOneAndUpdate(
        {guild: role.guild.id, roleId: role?.id},
        { name: role.name },
        { upsert: true, includeResultMetadata: true }
    ).exec().then(result => {
        if (!result.lastErrorObject?.updatedExisting) {
            logger.debug("Created role %s", role?.name);
        }
    });
}


