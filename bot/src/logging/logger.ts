import { environment } from "@/env/environment";
import { createLogger, format, transports, transport } from 'winston';
import { PapertrailTransport } from 'winston-papertrail-transport';

const loggingFormat = format.printf(({timestamp, level, stack, context, message}) => {
  return `${timestamp} [${level}] ${stack || message}`
})

const trans: transport[] = [
  new transports.Console()
]

if (environment.logging.port) {
  const papertrailTransport = new PapertrailTransport({
    host: 'logs4.papertrailapp.com',
    port: parseInt(environment.logging.port), // Reemplaza con tu puerto de Papertrail
    hostname: environment.logging.system,
    program: 'Bot',
    disableTls: false, // Habilita TLS para una conexión segura
  });
  trans.push(papertrailTransport)
}


export const logger = createLogger({
  level: environment.logging.logLevel,
  format: format.combine(
    format.timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
    format.errors({stack: true}),
    format.splat(),
    format.colorize(),
    format.simple(),
    loggingFormat
  ),
  transports: trans
});


