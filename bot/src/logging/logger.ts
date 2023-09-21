/*
import { environment } from "@/env/environment";
import * as log4js from "log4js";

log4js.configure({
  appenders: {
    console: {
      type: "stdout",
      layout: {
        type: "pattern",
        pattern: "%d{yyyy-MM-dd hh:mm.ss} [%p] [%C] %m"
      }
    },
    database: {
      type: myAppenderModule,
      host: environment.logging.host,
      token: environment.logging.token,
      database: environment.logging.database,
      measurement: environment.logging.measurement,
      fields: ['data', 'fileName', 'lineNumber'],
      tags: ['level', 'fileName']
    },
  },
  categories: {
    default: {
      appenders: ["console", "database"],
      level: "debug",
      enableCallStack: true
    }
  },
  pm2: true
});

export const logger = log4js.getLogger();
*/

import { environment } from "@/env/environment";
import { Logger } from "@tsed/logger";
import "./influxAppender";

export const logger = new Logger("default");

logger.appenders
  .set("database", {
    type: "influxAppender",
    host: environment.logging.host,
    database: environment.logging.database,
    token: environment.logging.token,
    measurement: environment.logging.measurement,
    fields: ['data', 'fileName', 'lineNumber'],
    layout: {
      type: "messagePassThrough"
    }
  })
  .set("console", {
    type: "stdout",
    layout: {
      type: "pattern",
      pattern: "%d{yyyy-MM-dd hh:mm:ss} [%p] %m"
    }
  });