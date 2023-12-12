import { logger } from '@/logging/logger';
import axios, { AxiosInstance } from 'axios';
import { OAuthClientFace, OAuthGuild, OAuthToken, OAuthUser } from './classes';

const API_ENDPOINT = 'https://discord.com/api/v10'
const AUTH_ENDPOINT = 'https://discord.com/api/oauth2/authorize';

export class OAuthClient implements OAuthClientFace {

    clientId: string;
    clientSecret: string;
    redirectUri: string;

    axiosClient: AxiosInstance;

    constructor(ops: {clientId: string, clientSecret: string, redirectUri: string}) {
        this.clientId = ops.clientId;
        this.clientSecret = ops.clientSecret;
        this.redirectUri = ops.redirectUri;
 
        this.axiosClient = axios.create({
            baseURL: API_ENDPOINT,
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            responseType: 'json'
        });
    }

    getAuthorizationUrl(scopes: string[]): string {
        let url = new URL(AUTH_ENDPOINT);
        url.searchParams.append('client_id', this.clientId);
        url.searchParams.append('redirect_uri', this.redirectUri);
        url.searchParams.append('response_type', 'code');
        url.searchParams.append('scope', scopes.join(' '));
        return url.toString();
    }

    _post(data: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const {client_secret, ...dData} = data;
            logger.debug("Posting %O", dData);
            this.axiosClient.post('/oauth2/token', data)
            .then(response => {
                logger.debug("Response status %d", response.status);
                if (response.status == 200) {
                    logger.debug("Got success Token")
                    resolve({
                        accessToken: response.data.access_token,
                        tokenType: response.data.token_type,
                        expiresIn: response.data.expires_in,
                        refreshToken: response.data.refresh_token,
                        scope: response.data.scope
                    })
                } else if (response.data) {
                    logger.debug("Got error %O", response.data);
                    reject(new Error(response.data.error_description));
                } else {
                    logger.debug("Got error %s", response.status);
                    reject(new Error(response.status.toString()));
                }
              }).catch(error => {
                    reject(error);
              })
        })
    }

    getAccessToken(code: string): Promise<OAuthToken> {
        return this._post({
            'client_id': this.clientId,
            'client_secret': this.clientSecret,
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': this.redirectUri
        });
    }

    refreshToken(token: OAuthToken): Promise<OAuthToken> {
        return this._post({
            'client_id': this.clientId,
            'client_secret': this.clientSecret,
            'grant_type': 'refresh_token',
            'refresh_token': token.refreshToken
        });
    }

    getUser(token: OAuthToken): Promise<OAuthUser> {
        return new Promise((resolve, reject) => {
            logger.debug("getUser");
            this.axiosClient.get('/users/@me', {headers: {Authorization: `Bearer ${token.accessToken}`}})
                .then(response => {
                    if (response.status < 200 || response.status > 299) {
                        reject(new Error(response.data.error_description));
                    } else {
                        resolve(new OAuthUser(response.data));
                    }
                }).catch(error => {
                    reject(error);
                })
        })
    }

    getGuilds(token: OAuthToken): Promise<OAuthGuild[]> {
        return new Promise((resolve, reject) => {
            logger.debug("getGuilds");
            this.axiosClient.get('/users/@me/guilds', {headers: {Authorization: `Bearer ${token.accessToken}`}})
                .then(response => {
                    if (response.status < 200 || response.status > 299) {
                        reject(new Error(response.data.error_description));
                    } else {
                        resolve( response.data.map((d: any) => new OAuthGuild(d)) );
                    }
                }).catch(error => {
                    reject(error);
                })
        })
    }

}