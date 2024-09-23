
export const environment = {
    database: {
        url: process.env.DBCONN
    },
    url: {
        calendar: process.env.CALENDAR_URL,
        dashboard: process.env.DASHBOARD_URL  
    },
    discord: {
        token: process.env.Q_TOKEN,
        test: process.env.TEST_SERVER,
        name: process.env.NAME
    },
    api: {
        sessionSecret: process.env.SESSION_SECRET,
        oauth: {
            clientId: process.env.CLIENT_ID,
            secretId: process.env.SECRET_ID,
            callbackUrl: process.env.CALLBACK_URL
        },
        stub: process.env.STUB_ACTIVE || false
    },
    infradb: {
        token: process.env.INFRA_TOKEN
    },
    telegram: {
        token: process.env.TELEGRAM_TOKEN,
        recipientId: process.env.TELEGRAM_ID
    },
    logging: {
        host: process.env.LOGGING_HOST,
        database: process.env.LOGGING_DB,
        measurement: process.env.LOGGING_MES,
        token: process.env.LOGGING_TOKEN,
        logLevel: process.env.LOGGING_LEVEL || 'debug',
        port: process.env.LOGGING_PORT || '0'
    },
    translator: {
        endpoint: process.env.TRANSLATOR_ENDPOINT || 'https://api.cognitive.microsofttranslator.com/',
        apiKey: process.env.TRANSLATOR_API_KEY,
        region: process.env.TRANSLATOR_REGION
    },
    timeZone: process.env.ZONE,
    defaultTZ: process.env.TZ,
    secret: process.env.SECRET,
    port: process.env.WEB_PORT || 3000,
    playerInfoURL: process.env.PLAYER_INFO_URL || 'https://stfc.wtf/power/__data.json?server=36&sort=level&page='
}