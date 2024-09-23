import { environment } from "@/env/environment";
import { createLogger, format, transports } from 'winston';
import { PapertrailTransport } from 'winston-papertrail-transport';

const papertrailTransport = new PapertrailTransport({
  host: 'logs4.papertrailapp.com',
  port: parseInt(environment.logging.port), // Reemplaza con tu puerto de Papertrail
  hostname: environment.logging.system,
  program: 'Bot',
  disableTls: false, // Habilita TLS para una conexión segura
});

export const logger = createLogger({
  level: environment.logging.logLevel,
  format: format.combine(
    format.timestamp(),
    format.splat(),
    format.colorize(),
    format.simple(),
    format.printf((log) => `${log.timestamp} [${log.level}]: ${log.message}`)
  ),
  transports: [
    new transports.Console(),
    papertrailTransport
  ]
});