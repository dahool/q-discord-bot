import { Document, Types } from "mongoose";

export interface BotConfig extends Document {
    playerInfoVersion: number
}

export interface Config extends Document { 
    guild: string,
    name?: string,
    channels?: {
        announcements?: string,
        logging?: string,
        territory?: string,
        scheduledEvents?: string,
        dailyTerritory?: string,
        invitesChannel?: string
    },
    token?: string,
    allianceTag?: string,
    autoFollowThreadChannels?: [{
        channel: string,
        silent: boolean
    }],
    newThreadAnnouncer?: [{
        channels: string[],
        announceChannel: string,
        message: string
    }],
    territoyCalendar?: string,
    welcomeBye?: {
        join?: {
            channel: string,
            active: boolean,
            message: string,
            message2?: string,
            roles?: Types.Array<string>
        },
        leaves?: {
            channel: string,
            active: boolean,
            message: string
        }
    },
    translateChannels?: [{
        channel: string,
        language: string
    }]
}

export interface PlayerInfo extends Document {
    name: string,
    level: number,
    tag: string,
    power: number,
    pd: number,
    rss: number,
    version: number
}

export interface CalendarEvent extends Document {
    guild: string,
    type: string,
    summary: string,
    location: string,
    start: Date,
    duration?: number,
    description?: string,
    pingRoles?: Types.Array<string>,
    discordEventId?: string,
    parentId?: string,
    src?: string,
    notified: boolean,
    channel?: string,
    extra?: string,
    recurrent?: boolean
}

export interface TerritoryEvent extends Document {
    guild: string,
    zone: string,
    title: string,
    next: Date,
    recurrent: Boolean,
    duration: Number,
    ping?: string[],
}

export interface WebHookChannel extends Document {
    guild: string,
    wkId: string,
    wkToken: string,
    channelId: string,
}

export interface LocalGuildChannel extends Document {
    guild: string,
    channelId: string,
    name: string,
    category?: string,
    type?: string
}

export interface LocalGuildRole extends Document {
    guild: string,
    roleId: string,
    name: string
}

export interface GuildWebhook extends Document {
    guild: string,
    channelId: string,
    webhookId: string,
    webhookToken: string
}

export interface Member extends Document {
    guild: string,
    memberId: string,
    username: string,
    avatar: string,
    join?: Date,
    lastSeen?: Date,
    left?: Date,
    alias: string[]
}

export interface TemporalRoles extends Document {
    guild: string,
    memberId: string,
    roleId: string,
    created: Date
}

export interface InviteRoles extends Document {
    guild: string,
    code: string,
    roles: string[],
    created: Date
    expiration: number
}