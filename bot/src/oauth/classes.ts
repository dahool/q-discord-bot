export declare interface OAuthClientFace {

    getAuthorizationUrl(scopes: string[]): string;

    getAccessToken(code: string): Promise<OAuthToken>;

    refreshToken(token: OAuthToken): Promise<OAuthToken>;

    getUser(token: OAuthToken): Promise<OAuthUser>;

    getGuilds(token: OAuthToken): Promise<OAuthGuild[]>;

}

export interface OAuthToken {
    accessToken: string,
    tokenType: string,
    expiresIn: number,
    refreshToken: string,
    scope: string
}

export class OAuthUser {
    id: string;
    username: string;
    avatar: string;
    discriminator: any;
    email: string;

    constructor(ops: any) {
        this.id = ops.id;
        this.username = ops.username;
        this.avatar = ops.avatar;
        this.discriminator = ops.discriminator;
        this.email = ops.email || null;
    }

    avatarURL(ops: {size?: number, format?: string, dynamic?: boolean}): string {
        const options = Object.assign({size: 512, format : 'webp', dynamic: false}, ops);
        if(this.avatar === null) return `https://cdn.discordapp.com/embed/avatars/${this.discriminator%5}.png?width=230&height=230`
        if(options.size % 128 !== 0 || options.size > 2048) throw new Error('Invalid avatar size');
        if (options.dynamic) options.format = this.avatar.startsWith('a_') ? 'gif' : options.format;
        return `https://cdn.discordapp.com/avatars/${this.id}/${this.avatar}.${options.format}?size=${options.size}`
    }

}

export class OAuthGuild {
    id: string;
    name: string;
    icon: string;
    isOwner: boolean;
    permissions: bigint;
    features: string[];

    constructor(ops: any) {
        this.id = ops.id;
        this.name = ops.name;
        this.icon = ops.icon;
        this.isOwner = ops.owner;
        this.permissions = ops.permissions;
        this.features = ops.features;
    }
    
    iconURL(ops: {size?: number, format?: string, dynamic?: boolean}): string {
        const options = Object.assign({size: 512, format : 'webp', dynamic: false}, ops);        
        if(this.icon === null) return `https://media.discordapp.net/attachments/708680940385337386/744701622885810336/91_Discord_logo_logos-512.png`
        if(options.size % 128 !== 0 || options.size > 2048) throw new Error('Invalid avatar size');
        if (options.dynamic) options.format = this.icon.startsWith('a_') ? 'gif' : options.format;
        return `https://cdn.discordapp.com/icons/${this.id}/${this.icon}.${options.format}?size=${options.size}`
    }

}