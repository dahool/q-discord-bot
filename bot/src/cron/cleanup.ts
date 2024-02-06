import { TYPES, container } from "@/ic.config";
import { PlayerInfoModel, TemporalRolesModel } from "@/repository";
import { Client } from "discord.js";
import { DateTime } from "luxon";

export async function cleanupTempRoles(): Promise<any> {
    const client = container.get(TYPES.Bot).client as Client;
    const memberList = await TemporalRolesModel.find({created: {$lt: DateTime.now().minus({hours: 24})}}).exec();
    return Promise.all(
        memberList.map(tempRole => {
        let member = client.guilds.cache.get(tempRole.guild)?.members.cache.get(tempRole.memberId)
        if (member) {
            member.roles.remove(tempRole.roleId);
        }
        return tempRole.deleteOne();
    }))
}

export async function cleanUpPlayerInfo(): Promise<any> {
    const dt = parseInt(DateTime.now().minus({days: 7}).toFormat('yyyyMMdd'));
    return PlayerInfoModel.deleteMany({version: { $lt: dt }}).exec();
}