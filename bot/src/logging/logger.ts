import { createLogger, format, transports } from "winston";

export const logger = createLogger({
    level: "debug",
    transports: [
      new transports.Console(),
    ],
    format: format.combine(
      format.timestamp(),
      format.splat(),
      format.printf(({ timestamp, level, message}) => {
        return `[${timestamp}] ${level}: ${message}`;
      })
    ),
});
