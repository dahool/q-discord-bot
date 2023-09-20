import "reflect-metadata";
import { environment } from "./env/environment";

import cookieParser from "cookie-parser";
import { AppRouter } from 'decorators-express';
import express from "express";
import sessions from "express-session";
import favicon from "serve-favicon";
import { logger } from "./logging/logger";
import { ApiController, AuthController, BotController, TokenValidationMiddleware } from "./router";

const app = express();

const oneDayInMillis = 1000 * 60 * 60 * 24;

/*jshint unused: true */
const views = [BotController, AuthController, ApiController]; // requerido para registrar los decorators de AppRouter

app.use(express.json());
app.use(favicon('public/favicon.ico'));
app.use(express.static('static'))
app.use(cookieParser());
app.use(sessions({
    secret: environment.api.sessionSecret!,
    cookie: { maxAge: oneDayInMillis },
    saveUninitialized:true,
    resave: false 
}));
app.use("/api", TokenValidationMiddleware);
app.use(AppRouter.getInstance());

app.get('*', function(req, res){
    res.redirect("index.html");
    //res.sendFile(__dirname + "/../static/index.html");
});

export function initializeWebListener() {
    app.listen(environment.port, () => {
        logger.info("Web Listener Ready on port %s", environment.port);
    })
}