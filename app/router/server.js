const { DateTime } = require('luxon');
const { Permissions } = require('discord.js');

const Client = require('discord-oauth2-api');
const cookieParser = require("cookie-parser");
const sessions = require("express-session");

const { db } = require('../db/db');
const { isPresent } = require('../utils');

const ENV_VARS = ['CALLBACK_URL','OAUTH_URL','CLIENT_ID','SECRET_ID','SESSION_SECRET'];

const oneDayInMillis = 1000 * 60 * 60 * 24;

const client = new Client({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.SECRET_ID,
    scopes: ['identify', 'guilds'],
    redirectURI: process.env.CALLBACK_URL
});

// "/oauth/redirect"
viewRedirect = (req, res) => {
    if (req.query.code) {
        client.getAccessToken(req.query.code).then(token => {
            req.session.token = token;
            req.session.token_expiration = DateTime.utc().plus({seconds: token.expiresIn});
            res.redirect('/');
        }).catch((e) => {
            console.error(e);
            res.redirect(process.env.OAUTH_URL);
        })
    }
}

// '/api/user'
viewUser = (req, res) => {
    client.getUser(req.session.token.accessToken).then((user) => {
        console.debug(user);
        res.send({
            username: user.username,
            icon: user.avatarURL({size: 128, format: 'webp'})
        })
    })
}

// '/api/servers'
viewServers = (req, res) => {
    client.getGuilds(req.session.token.accessToken).then((guilds) => {
        console.debug(guilds);
        db.server.listGuilds().then((servers) => {
            res.send(guilds.filter(g => isGuildOwner(g) && servers.some(s => s.id == g.id)).map(g => {
                return {
                    id: g.id,
                    name: g.name,
                    icon: g.iconURL({size: 128, format: 'webp'})
                }
            }))
        })
    })
}

// '/api/channels/:id'
viewChannels = (req, res) => {
    db.server.listChannels(req.params.id).then((list) => {
        console.debug(list);
        res.send(list.map(m => {
            return {
                id: m.id,
                name: m.name,
                parent: m.category
            }
        }))
    });
}

// '/api/roles/:id'
viewRoles = (req, res) => {
    db.server.listRoles(req.params.id).then((list) => {
        console.debug(list);
        res.send(list.map(m => {
            return {
                id: m.id,
                name: m.name
            }
        }))
    });
}

// '/api/config/:server/:config'
viewLoadConfig = (req, res) => {
    db.config.find(req.params.server, req.params.config).then(r => res.send(r));
}

// '/api/config/:server/:config'
viewSaveConfig = (req, res) => {
    const updates = req.body.map(el => { 
        const cloned = Object.assign({}, el);
        delete cloned.id;
        return db.config.push(req.params.server, req.params.config, el.id, cloned)
    });
    Promise.all(updates)
        .then(r => res.send({status: true}))
        .catch(e => res.send({status: false, error: e}))
}

// '/api/config/:server/:config/:id'
viewDeleteConfig = (req, res) => {
    db.config.delete(req.params.server, req.params.config, req.params.id)
        .then(r => res.send({status: true}))
        .catch(e => res.send({status: false, error: e}))
}

isGuildOwner = (guild) => {
    const permissions = new Permissions(guild.permissions);
    return guild.isOwner || permissions.has(Permissions.FLAGS.ADMINISTRATOR);
}

validate_token = async (req) => {
    return new Promise((resolve) => {
        if (req.session?.token) {
            const token = req.session.token;
            // check if expired
            if (req.session.token_expiration < DateTime.utc()) {
                discord.refreshToken(token.refreshToken).then(newToken => {
                    req.session.token = newToken;
                    req.session.token_expiration = DateTime.utc().plus({seconds: newToken.expiresIn});
                    resolve(true);
                }).catch((e) => {
                    console.error(e);
                    resolve(false);
                });
            } else {
                resolve(true); // token present and not expired
            }
        } else {
            resolve(false); // no token present
        }
    })
}

tokenMiddleware = (req, res, next) => {
    validate_token(req).then((s) => {
        if (!s) {
            res.format({
                html: function() {
                    res.redirect(process.env.OAUTH_URL);
                },
                json: function() {
                    res.status(403);
                    res.send({redirect: process.env.OAUTH_URL});
                }
            })
        } else {
            next();
        }
    })
}

checkEnvironment = () => {
    ENV_VARS.forEach(v => {
        if (!isPresent(process.env[v])) {
            throw new Error('Missing ' + v);
        }
    })
}

routerSetup = (app) => {

    checkEnvironment();

    app.use(cookieParser());

    app.use(sessions({
        secret: process.env.SESSION_SECRET,
        cookie: { maxAge: oneDayInMillis },
        saveUninitialized:true,
        resave: false 
    }));
    
    app.get("/oauth/redirect", viewRedirect);

    app.use("/api", tokenMiddleware);

    app.get('/api/user', viewUser);
    app.get('/api/servers', viewServers);
    app.get('/api/channels/:id', viewChannels);
    app.get('/api/roles/:id', viewRoles);
    app.get('/api/config/:server/:config', viewLoadConfig);
    app.put('/api/config/:server/:config', viewSaveConfig);
    app.delete('/api/config/:server/:config/:id', viewDeleteConfig);

}

module.exports = {
    routerSetup
};