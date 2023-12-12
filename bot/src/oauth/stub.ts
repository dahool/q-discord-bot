import { PermissionsBitField } from "discord.js";
import { OAuthClientFace, OAuthGuild, OAuthToken, OAuthUser } from "./classes";

export class StubClient implements OAuthClientFace {

    redirectUri: string;

    constructor(ops: {redirectUri: string}) {
        this.redirectUri = ops.redirectUri;
    }

    getAuthorizationUrl(scopes: string[]): string {
        return this.redirectUri + "?code=1";
    }

    getAccessToken(code: string): Promise<OAuthToken> {
        return new Promise(reso => {
            reso({
                accessToken: "12345",
                tokenType: "12345",
                expiresIn: 60,
                refreshToken: "12345",
                scope: "all"
            })
        })
    }

    refreshToken(token: OAuthToken): Promise<OAuthToken> {
        return new Promise(reso => {
            reso({
                accessToken: "12345",
                tokenType: "12345",
                expiresIn: 60,
                refreshToken: "12345",
                scope: "all"
            })
        })
    }

    getUser(token: OAuthToken): Promise<OAuthUser> {

        return new Promise(resolve => {
            resolve(new OAuthUser({
                id : '12345',
                username: 'StubUsername',
                avatar: null,
                discriminator: null
            }))
        })

    }

    getGuilds(token: OAuthToken): Promise<OAuthGuild[]> {
        return new Promise((resolve) => {
            let guilds = [new OAuthGuild({
                id: '695281624786534420',
                name: 'Test1',
                icon: null,
                owner: true,
                permissions: PermissionsBitField.Flags.Administrator,
                features: ['X']
            }),
            new OAuthGuild({
                id: '700723065524584599',
                name: 'Test2',
                icon: null,
                owner: true,
                permissions: PermissionsBitField.Flags.Administrator,
                features: ['X']
            })];
            resolve(guilds);
        })
    }

}