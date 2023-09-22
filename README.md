# Configuration

## Main Database

* DBCONN: MongoDB URL

## Dashboard

* DASHBOARD_URL: used by the bot and dashboard oauth redirection
* PORT: default listening port
* SESSION_SECRET: secret seed for web sessions
* CLIENT_ID: oAuth2 Client ID (Discord)
* SECRET_ID: oAuth2 Secret ID (Discord)
* CALLBACK_URL: Callback URL for oAuth2 ($DASHBOARD_URL/oauth/redirect)

## Discord

* Q_TOKEN: discord bot token

## General

* TZ: default env timezone
* ZONE: timezone (unused)
* SECRET: secret used for calendar link generator
* CALENDAR_URL: URL of calendar (normaly $DASHBOARD_URL/calendar

## PM2

MONITORING_TOKEN: for pm2.io dashboard
INFRA_TOKEN: for pm2.io dashboard

## Telegram Bot

* TELEGRAM_TOKEN: Telegram Bot Token
* TELEGRAM_ID: Client ID to send notifications

## Logging DB
* LOGGING_HOST: URL of logging database
* LOGGING_DB: database name
* LOGGING_MES: measurement name (for infradb3)
* LOGGING_TOKEN: Authentication Token (for infradb3)