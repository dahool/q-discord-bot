import { GuildBasedChannel, PermissionsBitField } from "discord.js";
import { DateTime } from "luxon";
import striptags from "striptags";

export async function testChannel(channel?: GuildBasedChannel): Promise<boolean> {
    if (channel == undefined) return true;
    return (await channel.guild.members.fetchMe()).permissionsIn(channel).has([PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageMessages])
}

export function asChannel(channelId: string): string {
    return '<#' + channelId + '>'
}

export function asRole(roleId: string): string {
    return '<@&' + roleId + '>'
}

export function asUser(userId: string): string {
    return '<@' + userId + '>'
}

export function safeLower(value: string): string {
    if (value != undefined) return value.toLowerCase();
    return value;
}

export function safeNull(value: string): string {
    if (value != undefined) return value;
    return "";
}

export function safeTrim(value: any | string): any | string {
    if (value !== undefined && typeof value.trim === "function") return value.trim();
    return value;
}

export function generateRandomId(prefix: string) {
    return prefix + Math.random().toString(36).substring(2, 5) + Math.random().toString(36).substring(2, 5);
}

export function asTime(dateTime: DateTime) {
    return '<t:' + Math.trunc(dateTime.toSeconds()) + '>'
}

export function asTimeRelative(dateTime: DateTime) {
    return '<t:' + Math.trunc(dateTime.toSeconds()) + ':R>'
}

export function asTimeFormat(dateTime: DateTime | Date, format = 'F') {
    let dt;
    if (dateTime instanceof Date) {
        dt = DateTime.fromJSDate(dateTime);
    } else {
        dt = dateTime;
    }
    return '<t:' + Math.trunc(dt.toSeconds()) + ':' + format + '>'
}

export function isEmpty(obj: any){
    return (Object.keys(obj).length === 0 && JSON.stringify(obj) === JSON.stringify({}));
}

export function isNotBlank(obj: string | undefined) {
    return obj !== undefined && safeTrim(obj).length > 0;
}

export function createURLwithParameters(baseURL: string, parameters: any): string {
    if(!isEmpty(parameters)){
        var obj = parameters;
        var cnt = 0;
        for (var prop in obj) {
            if( cnt == 0 ) 
            baseURL = baseURL.concat('?',prop,'=',obj[prop]);
            else
            baseURL = baseURL.concat('&',prop,'=',obj[prop]); 
            cnt++;         
        }
    }
    return baseURL;
}

export function groupBy(list: any[], keyGetter: Function) {
    const map = new Map();
    list.forEach((item) => {
         let key = keyGetter(item);
         let collection = map.get(key);
         if (!collection) {
             map.set(key, [item]);
         } else {
             collection.push(item);
         }
    });
    return map;
}

export function highlightText(text: string): string {
    return "`" + text + "`";
}

export function stripHtml(text: string | undefined): string | undefined {
    if (text && text != '') {
        text = striptags(text.replace('<br>', '\n'));
    }
    return text;
}