import { DateTime } from "luxon";

export interface Territory {
    zone: string,
    next: DateTime,
    weekday: number
}

export interface Schedule {
    id: string;
    dtStart: DateTime;
    dtEnd: DateTime;
    summary: string;
    type: string;
    location?: string;
    parentId?: string;
    src?: string;
    recurrent?: boolean;
    pingRoles?: string[];
}

export interface User {
    username: string;
    icon: string;
}

export interface UserServer {
    id: string;
    name: string;
    icon: string;
}

export interface Channel {
    id: string;
    name: string;
    parent?: string;
}

export interface Role {
    id: string;
    name: string;
}

export interface Guild {
    id: string;
    name: string;
    icon: string;
}

export interface SaveResponse {
    status: boolean;
    error: string;
}

export interface Config {
    guild: string
    name: string
    channels: {
        announcements: string
        logging: string
        territory: string
        scheduledEvents: string
        dailyTerritory: string
    }
    token?: string
    allianceTag?: string
    autoFollowThreadChannels?: [{
        channel: string,
        silent: boolean
    }]
    newThreadAnnouncer?: [{
        channels: string[]
        announceChannel: string
        message: string
    }]
    territoyCalendar?: string,
    welcomeBye: {
        join: {
            channel?: string,
            active: boolean,
            message?: string,
            message2?: string,
            roles?: string[]
        },
        leaves: {
            channel?: string,
            active: boolean,
            message?: string
        }
    },
    translateChannels?: [{
        channel: string,
        language: string
    }]
}

export const EMPTY_CONFIG: Config = {
    guild: '',
    name: '',
    channels: {
        announcements: '',
        logging: '',
        territory: '',
        scheduledEvents: '',
        dailyTerritory: ''
    },
    token: '',
    allianceTag: '',
    autoFollowThreadChannels: undefined,
    newThreadAnnouncer: undefined,
    territoyCalendar: '',
    welcomeBye: {
        join: {
            active: false
        },
        leaves: {
            active: false
        }
    }
}
