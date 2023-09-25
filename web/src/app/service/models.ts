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
    parent: string;
}

export interface Role {
    id: string;
    name: string;
}

export interface Server {
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
    }
    token: string
    allianceTag: string
    autoFollowThreadChannels?: [{
        channel: string,
        silent: boolean
    }]
    newThreadAnnouncer?: [{
        channels: string[]
        announceChannel: string
        message: string
    }]
    territoyCalendar: string
}

export const EMPTY_CONFIG: Config = {
    guild: '',
    name: '',
    channels: {
        announcements: '',
        logging: '',
        territory: '',
        scheduledEvents: '',
    },
    token: '',
    allianceTag: '',
    autoFollowThreadChannels: undefined,
    newThreadAnnouncer: undefined,
    territoyCalendar: ''
}