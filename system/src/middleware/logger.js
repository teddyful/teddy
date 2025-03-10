/**
 * Teddy static website builder logger.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

import winston from 'winston';
import 'winston-daily-rotate-file'
const { combine, errors, label, printf, timestamp } = winston.format;


const loggingFormat = printf(({ level, message, label, timestamp }) => {
    return `${timestamp} [${label}] ${level.toUpperCase()}: ${message}`;
});

const consoleTransport = new winston.transports.Console({
    level: 'info'
});

const fileRotateTransport = new winston.transports.DailyRotateFile({
    filename: 'logs/teddy-%DATE%.log', 
    datePattern: 'YYYY-MM-DD', 
    level: 'debug', 
    maxFiles: '14d', 
    maxSize: '10m'
});

const logger = winston.createLogger({
    defaultMeta: {
        service: 'teddy'
    }, 
    format: combine(
        errors({ 
            stack: true
        }), 
        label({ 
            label: 'Teddy'
        }),
        timestamp({
            format: 'YYYY-MM-DD HH:mm:ss.SSS'
        }),
        loggingFormat
    ),
    transports: [
        consoleTransport, 
        fileRotateTransport
    ], 
    exceptionHandlers: [
        consoleTransport, 
        fileRotateTransport
    ], 
    exitOnError: true
});

export default logger;
