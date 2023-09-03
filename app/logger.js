const log4js = require('log4js');

if (process.env.LOGGING_HOST) {

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
            dbLoggerFilter: { // use to filter logs
                type: "logLevelFilter",
                appender: "database",
                level: "info",
            },
            console: {
                type: "stdout",
                layout: {
                    type: "pattern",
                    pattern: "%d{yyyy-MM-dd hh:mm.ss} [%p] [%C] %m"
                }
            }
        },
        categories: { default: { appenders: ["console","database"], level: "debug", enableCallStack: true, pm2: true } },
    });
    
} else {

    log4js.configure({
        appenders: { 
            console: {
                type: "stdout",
                layout: {
                    type: "pattern",
                    pattern: "%d{yyyy-MM-dd hh:mm.ss} [%p] [%C] %m"
                }
            }
        },
        categories: { default: { appenders: ["console"], level: "debug", enableCallStack: true, pm2: true } },
    });

}

function getLogger() {
    return log4js.getLogger();
}

module.exports = getLogger;