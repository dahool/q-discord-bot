const log4js = require('log4js');

log4js.configure({
    appenders: { 
        database: { 
            type: "influx-logging-appender",
            host: process.env.LOGGING_HOST,
            token: process.env.LOGGING_TOKEN,
            database: process.env.LOGGING_DB,
            measurement: process.env.LOGGING_MES,
            fields: ['data','fileName','lineNumber']
        },
        dbLoggerFilter: {
            type: "logLevelFilter",
            appender: "database",
            level: "info",
        },
        console: {
            type: "stdout",
            pattern: "%d{yyyy-MM-dd hh:mm.ss} [%p] [%c] %m"
        }
    },
    categories: { default: { appenders: ["dbLoggerFilter","console"], level: "debug", enableCallStack: true } },
});

function getLogger() {
    return log4js.getLogger();
}

module.exports = getLogger;