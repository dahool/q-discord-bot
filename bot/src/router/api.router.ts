import { Territory, TerritoryEvents, Webhook } from '@/api';
import { environment } from '@/env/environment';
import { TYPES, container } from '@/ic.config';
import { logger } from '@/logging/logger';
import { OAuthClient, OAuthClientFace, OAuthGuild, OAuthToken } from '@/oauth';
import { StubClient } from '@/oauth/stub';
import { BotConfigModel, CalendarModel, Config, ConfigModel, LocalGuildChannelModel, LocalGuildRoleModel, PlayerInfoModel } from '@/repository';
import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, Res, Use } from 'decorators-express';
import { ChannelType, PermissionsBitField } from 'discord.js';
import { NextFunction, Request, Response } from 'express';
import { DateTime } from 'luxon';
import { MemoryCache } from 'memory-cache-node';
import { Observable, map } from 'rxjs';
import { PlayerInfoFilter } from './api.dto';

const itemsExpirationCheckIntervalInSecs = 60 * 60;
const maxItemCount = 1000000;
const timeToLive = 60 * 60;
const memoryCache = new MemoryCache<string, number>(itemsExpirationCheckIntervalInSecs, maxItemCount);

const ENV_VARS = ['CALLBACK_URL','OAUTH_URL','CLIENT_ID','SECRET_ID','SESSION_SECRET'];

const OAUTH_SCOPES = ['identify', 'guilds'];

let oClient: OAuthClientFace;
oClient = new StubClient({
    redirectUri: environment.api.oauth.callbackUrl!
})
/*if (environment.api.stub === true) {
    oClient = new StubClient({
        redirectUri: environment.api.oauth.callbackUrl!
    })
} else {
    oClient = new OAuthClient({
        clientId: environment.api.oauth.clientId!,
        clientSecret: environment.api.oauth.secretId!,
        redirectUri: environment.api.oauth.callbackUrl!
    });
}*/

const OAUTH_REDIRECT_URL = oClient.getAuthorizationUrl(OAUTH_SCOPES);

interface AccessToken {
    accessToken: string;
}

declare module "express-session" {
    interface SessionData {
        token: AccessToken,
        token_expiration: DateTime
    }
}

function getOrCache(key: string, retriever: Observable<any>): Observable<any> {
    if (memoryCache.hasItem(key)) {
        logger.debug("Returning %s from cache", key)
        return new Observable(sus => {
            sus.next(memoryCache.retrieveItemValue(key));
            sus.complete();
        })
    }
    return retriever.pipe(map(value => {
        memoryCache.storeExpiringItem(key, value, timeToLive);
        return value;
    }));
}

@Controller("/oauth")
export class AuthController {

    @Get("/redirect")
    redirect(@Query("code") code: string, @Req() req: Request, @Res() res: Response) {
        logger.debug("Entering /oauth/redirect with %s", code);
        if (code) {
            oClient.getAccessToken(code)
                .subscribe({next: (token) => {
                    req.session.token = token;
                    req.session.token_expiration = DateTime.utc().plus({seconds: token.expiresIn});
                    res.redirect(environment.url.dashboard || '/');
                }, error: err => {
                    logger.error(err);
                    res.redirect(OAUTH_REDIRECT_URL);
                }})
        }
    }

}

@Controller("/api")
@Use(TokenValidationMiddleware)
export class ApiController {
    
    isGuildOwner(guild: OAuthGuild): boolean {
        const permissions = new PermissionsBitField(guild.permissions);
        return guild.isOwner || permissions.any([PermissionsBitField.Flags.Administrator, PermissionsBitField.Flags.ManageGuild]);
    }

    @Get("/servers")
    listServers(@Req() req: Request, @Res() res: Response) {
        getOrCache('servers'+req.session.token?.accessToken, oClient.getGuilds(req.session.token as OAuthToken))
            .subscribe({
                next: (guilds: OAuthGuild[]) => {
                    logger.debug("%O", guilds);
                    ConfigModel.find({}).exec().then(localGuilds => {
                        res.send(guilds.filter(g => this.isGuildOwner(g) && localGuilds.some(s => s.guild == g.id)).map(g => {
                            return {
                                id: g.id,
                                name: g.name,
                                icon: g.iconURL({size: 128, format: 'webp'})
                            }
                        }))
                    })
                },
                error: (e) => {
                    logger.error(e);
                    res.send({});
                }
            });
    }

    @Get("/server/:id")
    getServer(@Param("id") id: string, @Req() req: Request, @Res() res: Response) {
        getOrCache('servers'+req.session.token?.accessToken, oClient.getGuilds(req.session.token as OAuthToken))
            .subscribe({
                next: (guilds: OAuthGuild[]) => {
                    const guild = guilds.find(g => g.id == id)
                    if (guild) {
                        res.send({
                            id: guild.id,
                            name: guild.name,
                            icon: guild.iconURL({size: 128, format: 'webp'})
                        })
                    } else {
                        res.status(404).send("Not found");
                    }
                },
                error: (e) => {
                    logger.error(e);
                    res.send({});
                }
            });
    }    

    @Get("/channels/:id")
    listChannels(@Param("id") id: string, @Req() req: Request, @Res() res: Response) {
        LocalGuildChannelModel.find({guild: id, type: { $ne: ChannelType.GuildVoice }}).exec().then(list => {
            res.send(list.map(c => {
                return {
                    id: c.channelId,
                    name: c.name,
                    parent: c.category,
                    type: c.type
                }
            }))
        });
    }    

    @Get("/roles/:id")
    listRoles(@Param("id") id: string, @Req() req: Request, @Res() res: Response) {
        LocalGuildRoleModel.find({guild: id}).exec().then(list => {
            res.send(list.map(c => {
                return {
                    id: c.roleId,
                    name: c.name
                }
            }))
        });
    }

    @Get("/config/:id")
    getConfig(@Param("id") id: string, @Req() req: Request, @Res() res: Response) {
        ConfigModel.findOne({guild: id}).exec().then(c => {
            if (c) {
                const {token, ...dtoConfig} = c.toObject();
                res.send(dtoConfig);
            } else {
                res.send({});
            }
        });
    }

    @Put("/config/:id")
    saveConfig(@Body() payload: {[key:string]: any}, @Req() req: Request, @Res() res: Response) {
        const id = payload._id;
        const {_id, token, guild, ...toUpdate} = payload;
        ConfigModel.findOneAndUpdate({_id: id}, toUpdate, {upsert: true, setDefaultsOnInsert: true, new: true}).exec()
            .then((updated) => {
                res.send({status: true})
                this._postConfigUpdate(updated).then(() => {
                    logger.debug("Post config update completed");
                });
            }).catch(e => {
                logger.error(e);
                res.send({status: false, error: e});
            })        

    }

    @Get("/zones")
    listZones(@Res() res: Response) {
        res.send(Territory.listAll());
    }

    @Get("/events/:id")
    listEvents(@Param("id") id: string, @Res() res: Response) {
        TerritoryEvents.listCalendarEntries(id, 30).then(events => {
            logger.debug("Events: %O", events);
            res.send(events.map(e => {
                return Object.assign({}, e.toObject(), {
                    start: undefined,
                    id: e._id,
                    dtStart: DateTime.fromJSDate(e.start).toISO(),
                    dtEnd: DateTime.fromJSDate(e.start).plus({minutes: e.duration}).toISO()
                })
            }));
        });
    }    

    @Post("newEvent/:id")
    saveNewEvent(@Param("id") id: string, @Body() payload: {[key:string]: any}, @Res() res: Response) {
        const zone = Territory.findZonesByName(payload.zone);
        if (zone.length > 0) {
            TerritoryEvents.createNewEvent(id, zone[0], {
                title: payload.title,
                recurrent: payload.recurrent,
                ping: payload.ping,
                nextDt: payload.next
            }).then(e => {
                res.send({status: true})
            }).catch(e => {
                logger.error(e);
                res.send({status: false, error: e});
            })
        } else {
            res.send({status: false, error: "Zone " + payload.zone + " not found."});
        }
    }

    @Put("event/:id")
    async saveEvent(@Param("id") id: string, @Body() payload: {[key:string]: any}, @Res() res: Response) {
        const zone = Territory.findZonesByName(payload.zone);
        if (zone.length > 0) {
            let calendar = await CalendarModel.findById(id).exec();
            if (calendar && calendar.parentId) {
                await TerritoryEvents.deleteTerritoryEvent(calendar.parentId);
            } else {
                logger.debug("Remove calendar entry %O", calendar);
                await calendar?.deleteOne();
            }
            TerritoryEvents.createNewEvent(calendar?.guild!, zone[0], {
                title: payload.title,
                recurrent: payload.recurrent,
                ping: payload.ping,
                nextDt: payload.next
            }).then(e => {
                res.send({status: true})
            }).catch(e => {
                logger.error(e);
                res.send({status: false, error: e});
            })
        } else {
            res.send({status: false, error: "Zone " + payload.zone + " not found."});
        }
    }

    @Delete("event/:id")
    async deleteEvent(@Param("id") id: string, @Body() payload: {[key:string]: any}, @Res() res: Response) {
        let calendar = await CalendarModel.findById(id).exec();
        if (calendar && calendar.parentId) {
            await TerritoryEvents.deleteTerritoryEvent(calendar.parentId);
        } else {
            logger.debug("Remove calendar entry %O", calendar);
            await calendar?.deleteOne();
        }
        res.send({status: true});
    }

    @Get("versions")
    async getPlayerVersions(@Res() res: Response) {
        let versions: any = await PlayerInfoModel.aggregate([
            {
                $group: {
                    _id: "0",
                    values: { $addToSet: "$version"}
                }
            }
        ]).exec();
        res.send(versions[0])
    }

    @Get("tags")
    async getPlayerTags(@Res() res: Response) {
        let l: any = await PlayerInfoModel.aggregate([
            {
                $group: {
                    _id: "0",
                    values: { $addToSet: "$tag"}
                }
            }
        ]).exec();
        res.send(l[0])
    }
    
    @Post("playerInfo")
    async getPlayerInfo(@Body() payload: PlayerInfoFilter, @Res() res: Response) {
		const botConfig = await BotConfigModel.findOne().exec();
		const version = payload.version || botConfig?.playerInfoVersion;

        let query: any = {};
        if (version != "*") {
            query['version'] = version;
        } else if (!payload.name) {
            query['version'] = botConfig?.playerInfoVersion;
        }
        if (payload.tag && payload.tag.trim().length > 0) {
            if (payload.tag == "[|]") query['tag'] = "";
            else query['tag'] = payload.tag.trim().toUpperCase();
        }
        if (payload.name && payload.name.trim().length > 0) {
            query['name'] = {'$regex': `.*${payload.name.trim()}.*`, "$options": "i" }
        }

        console.log(query);

        let list = await PlayerInfoModel.find(query).sort({level: 'desc', name: 'asc'}) .exec();

        let i = 0;
        res.send(list.map(p => {
            return {
                id: i++,
                name: p.name,
                level: p.level,
                tag: p.tag,
                power: p.power,
                pd: p.pd,
                rss: p.rss,
                version: p.version
            }
        }))
        
    }

    _postConfigUpdate(updated: Config) {
        const client = container.get(TYPES.Bot).client;
        const guild = client.guilds.cache.get(updated.guild);
        return Webhook.createOrUpdateAll(container.get(TYPES.Bot).client, guild, updated);
    }

}
/*
async function validateOrRefreshToken(req: Request): Promise<boolean> {
    return new Promise((resolve) => {
        if (req.session?.token) {
            const token = req.session.token;
            // check if expired
            if (req.session.token_expiration && req.session.token_expiration < DateTime.utc()) {
                oClient.refreshToken(token).subscribe({next: newToken => {
                    req.session.token = newToken;
                    req.session.token_expiration = DateTime.utc().plus({seconds: newToken.expiresIn});
                    resolve(true);
                }, error: e => {
                    logger.error(e);
                    resolve(false);
                }});
            } else if (req.session.token_expiration) {
                resolve(true); // token present and not expired
            } else {
                resolve(false);
            }
        } else {
            resolve(false); // no token present
        }
    })
}
*/

export function TokenValidationMiddleware(req: Request, res: Response, next: NextFunction) {
    console.log(req.headers);
    const authToken = (req.headers.authorization || '').split("Bearer ").at(1);
    if (!authToken) {
        res.send(403);
    } else {
        console.log('Got token %s', authToken);
        console.log(req.originalUrl);
        req.session.token = {accessToken: authToken};
        next();
    }
}