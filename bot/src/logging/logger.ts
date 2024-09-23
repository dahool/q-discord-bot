import { environment } from "@/env/environment";
import { createLogger, format, transports } from 'winston';
import { PapertrailTransport } from 'winston-papertrail-transport';
import * as stackTrace from 'stack-trace';

const papertrailTransport = new PapertrailTransport({
  host: 'logs4.papertrailapp.com',
  port: parseInt(environment.logging.port), // Reemplaza con tu puerto de Papertrail
  hostname: environment.logging.system,
  program: 'Bot',
  disableTls: false, // Habilita TLS para una conexión segura
});

const traceContext = format((log) => {
  const trace = stackTrace.get();
  const caller = trace[10]; // Ajusta el índice según la profundidad de la pila de llamadas
  log.meta = {
    functionName: caller.getFunctionName(),
    fileName: caller.getFileName(),
    lineNumber: caller.getLineNumber(),
  };
  log.context = `${caller.getFileName()}.${caller.getFunctionName()}:${caller.getLineNumber()}`;
  return log;
});

const loggingFormat = format.printf(({timestamp, level, stack, context, message}) => {
  return `${timestamp} - [${level}] - [${context}]: ${stack || message}`
})

export const logger = createLogger({
  level: environment.logging.logLevel,
  format: format.combine(
    format.timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
    format.errors({stack: true}),
    format.splat(),
    format.colorize(),
    format.simple(),
    traceContext(),
    loggingFormat
    //format.printf((log) => `${log.timestamp} [${log.level}]: ${log.message}`)
  ),
  transports: [
    new transports.Console(),
    papertrailTransport
  ]
});




