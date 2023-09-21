export class User {
    username?: string;
    icon?: string;
}

export class UserServer {
    id?: string;
    name?: string;
    icon?: string;
}

export class Channel {
    id?: string;
    name?: string;
    parent?: string;
}

export class Role {
    id?: string;
    name?: string;
}

export class Server {
    id?: string;
    name?: string;
    icon?: string;
}

export class SaveResponse {
    status?: boolean;
    error?: string;
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
    autoFollowThreadChannels: string[]
    newThreadAnnouncer: [{
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
    autoFollowThreadChannels: [],
    newThreadAnnouncer: [{
        channels: [],
        announceChannel: '',
        message: ''
    }],
    territoyCalendar: ''
}