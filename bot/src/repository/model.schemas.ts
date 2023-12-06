import mongoose, { Schema } from "mongoose";
import { CalendarEvent, Config, GuildWebhook, LocalGuildChannel, LocalGuildRole, Member, PlayerInfo, TemporalRoles, TerritoryEvent, WebHookChannel } from "./model.interfaces";

const ConfigSchema = new Schema<Config>({
    guild: { type: String, required: true },
    name: String,
    channels: { // channels to write
        announcements: String,
        logging: String,
        territory: String,
        scheduledEvents: String,
        dailyTerritory: String
    },
    token: String,
    allianceTag: String,
    territoyCalendar: String,
    autoFollowThreadChannels: [{
        channel: String,
        silent: Boolean
    }], // auto following threads channels
    newThreadAnnouncer: [{
        channels: [String],
        announceChannel: String,
        message: String
    }], // new threads announcements
    welcomeBye: {
        join: {
            channel: String,
            active: Boolean,
            message: String,
            message2: String,
            roles: [String]
        },
        leaves: {
            channel: String,
            active: Boolean,
            message: String
        }
    }    
}, { collection: 'guild_config' })

const PlayerInfoSchema = new Schema<PlayerInfo>({
    name: String,
    level: Number,
    tag: String,
    power: Number,
    pd: Number,
    rss: Number
}, { collection: 'playerinfo'})

const CalendarSchema = new Schema<CalendarEvent>({
    guild: { type: String, required: true },
    type: { type: String, required: true },
    summary: { type: String, required: true },
    location: { type: String, required: true },
    start: { type: Date, required: true },
    duration: Number,
    description: String,
    pingRoles: [String],
    discordEventId: String,
    parentId: String,
    src: String,
    notified: Boolean,
    channel: String,
    extra: String,
    recurrent: Boolean
}, { collection: 'guild_calendar'})

const TerritoryEventSchema = new Schema<TerritoryEvent>({
    guild: { type: String, required: true },
    zone: { type: String, required: true },
    title: { type: String, required: true },
    next: { type: Date, required: true },
    recurrent: { type: Boolean, required: true },
    duration: { type: Number, required: true },
    ping: [String]
}, { collection: 'territory_events'})

const WebHookChannelSchema = new Schema<WebHookChannel>({
    guild: { type: String, required: true },
    wkId: { type: String, required: true },
    wkToken: { type: String, required: true },
    channelId: { type: String, required: true },
}, { collection: 'guild_webhooks'})

const LocalGuildChannelSchema = new Schema<LocalGuildChannel>({
    guild: { type: String, required: true },
    channelId: { type: String, required: true },
    name: { type: String, required: true },
    category: String,
    type: String
}, { collection: 'guild_channels'})

const LocalGuildRoleSchema = new Schema<LocalGuildRole>({
    guild: { type: String, required: true },
    roleId: { type: String, required: true },
    name: { type: String, required: true }
}, { collection: 'guild_roles'})

const WebhookSchema = new Schema<GuildWebhook>({
    guild: { type: String, required: true },
    channelId: { type: String, required: true },
    webhookId: { type: String, required: true },
    webhookToken: { type: String, required: true }
}, { collection: 'guild_webhooks'})

const GuildMemberSchema = new Schema<Member>({
    guild: { type: String, required: true },
    memberId: { type: String, required: true },
    username: { type: String, required: true },
    avatar: { type: String, required: true },
    join: Date,
    lastSeen: Date,
    left: Date,
    alias: [String]
}, { collection: 'guild_members'})

const TemporalRolesSchema = new Schema<TemporalRoles>({
    guild: { type: String, required: true },
    memberId: { type: String, required: true },
    roleId: { type: String, required: true },
    created: { type: Date, required: true }
}, { collection: 'guild_temp_roles'})

export const ConfigModel = mongoose.model<Config>('ConfigModel', ConfigSchema);
export const PlayerInfoModel = mongoose.model<PlayerInfo>('PlayerInfoModel', PlayerInfoSchema);
export const CalendarModel = mongoose.model<CalendarEvent>('CalendarModel', CalendarSchema); 
export const TerritoryEventModel = mongoose.model<TerritoryEvent>('TerritoryEventModel', TerritoryEventSchema); 
export const WebHookChannelModel = mongoose.model<WebHookChannel>('WebHookChannelModel', WebHookChannelSchema); 
export const LocalGuildRoleModel = mongoose.model<LocalGuildRole>('LocalGuildRoleModel', LocalGuildRoleSchema); 
export const LocalGuildChannelModel = mongoose.model<LocalGuildChannel>('LocalGuildChannelModel', LocalGuildChannelSchema); 
export const WebhookModel = mongoose.model<GuildWebhook>('WebhookModel', WebhookSchema);
export const GuildMemberModel = mongoose.model<Member>('GuildMemberModel', GuildMemberSchema);
export const TemporalRolesModel = mongoose.model<TemporalRoles>('TemporalRolesModel', TemporalRolesSchema);
