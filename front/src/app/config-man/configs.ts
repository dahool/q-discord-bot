/* TYPES
string: 1
channel: 4
role: 5
*/

export interface ConfigElement {
    id: string;
    description: string;
    options: ConfigOption[];
}

export interface ConfigOption {
    name: string;
    description: string;
    type: number;
    required: boolean;
    list: boolean;
    value: any;
}

export const CONFIGS = [
    {
        id: 'announce',
        description: 'Main announcements Channel',
        options: [
            {
                name: 'channel',
                description: 'Channel',
                type: 4,
                required: true
            }
        ]
    },
    {
        id: 'log',
        description: 'Logging Channel',
        options: [
            {
                name: 'channel',
                description: 'Channel',
                type: 4,
                required: true
            }
        ]        
    },
    {
        id: 'territory',
        description: 'Territory announcements Channel',
        options: [
            {
                name: 'channel',
                description: 'Channel',
                type: 4,
                required: true
            }
        ]        
    },
    {
        id: 'daily',
        description: 'Daily announcements Channel',
        options: [
            {
                name: 'channel',
                description: 'Channel',
                type: 4,
                required: true
            }
        ]        
    },
    {
        id: 'diplomacy',
        description: 'Diplomacy announcements Channel',
        options: [
            {
                name: 'channel',
                description: 'Channel',
                type: 4,
                required: true
            }
        ]        
    },
    {
        id: 'webhook',
        description: 'Webhook Channel Broadcast',
        add: true,
        options: [
            {
                name: 'channel',
                description: 'Channel',
                type: 4,
                required: true
            },
            {
                name: 'name',
                description: 'Name',
                type: 1,
                required: true
            },            
            {
                name: 'url',
                description: 'Discord Webhook URL',
                type: 1,
                required: true,
                pattern: '^https:\/\/discord.com\/api\/webhooks\/[^\/]+\/[^\/]+$'
            }
        ]        
    },
    {
        id: 'territory_events',
        description: 'Territory Events Calendar',
        options: [
            {
                name: 'url',
                description: 'ICAL URL',
                type: 1,
                required: true,
                pattern: '(https|http):\/\/.*'
            }
        ]        
    },    
    {
        id: 'roles',
        description: 'Privileged roles (access to my protected commands)',
        options: [
            {
                name: 'roles',
                description: 'Role',
                type: 5,
                required: true,
                list: true
            }
        ]        
    },    
    {
        id: 'territory',
        description: 'Roles to Mention in Events Announcements',
        options: [
            {
                name: 'mention',
                description: 'Role',
                type: 5,
                required: true,
                list: true
            }
        ]        
    },
]