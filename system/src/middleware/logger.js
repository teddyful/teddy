/**
 * Teddy static website builder logger.
 *
 * @author jillurquddus
 * @copyright Copyright (C) 2025 Jillur Quddus
 * @license GPL-3.0
 * @since 0.0.1
 */

import winston from 'winston';
import 'winston-daily-rotate-file';
import { createDirectory } from '../utils/io-utils.js';
const { combine, errors, label, printf, timestamp, uncolorize } = winston.format;

const LOG_DIR = 'logs';
const LOG_FILE_PATTERN = `${LOG_DIR}/teddy-%DATE%.log`;
const LOG_LABEL = 'Teddy';
const LOG_SERVICE = 'teddy';
const LOG_TIMESTAMP_FORMAT = 'YYYY-MM-DD HH:mm:ss.SSS';
const CONSOLE_LOG_LEVEL = process.env.TEDDY_CONSOLE_LOG_LEVEL ?? 'info';
const FILE_LOG_LEVEL = process.env.TEDDY_FILE_LOG_LEVEL ?? 'debug';
createDirectory(LOG_DIR);

const uppercaseLevel = winston.format(info => {
    info.level = info.level.toUpperCase();
    return info;
});

const loggingFormat = printf(({ level, message, label, timestamp, stack }) => {
    return `${timestamp} [${label}] ${level}: ${stack ?? message}`;
});

const consoleLoggingFormat = combine(
    errors({
        stack: true
    }),
    label({
        label: LOG_LABEL
    }),
    timestamp({
        format: LOG_TIMESTAMP_FORMAT
    }),
    uppercaseLevel(),
    winston.format.colorize({
        level: true,
        message: false
    }),
    loggingFormat
);

const fileLoggingFormat = combine(
    errors({
        stack: true
    }),
    label({
        label: LOG_LABEL
    }),
    timestamp({
        format: LOG_TIMESTAMP_FORMAT
    }),
    uppercaseLevel(),
    uncolorize(),
    loggingFormat
);

const consoleTransport = new winston.transports.Console({
    level: CONSOLE_LOG_LEVEL, 
    format: consoleLoggingFormat
});

const fileRotateTransport = new winston.transports.DailyRotateFile({
    filename: LOG_FILE_PATTERN, 
    datePattern: 'YYYY-MM-DD', 
    level: FILE_LOG_LEVEL, 
    maxFiles: '31d', 
    maxSize: '10m', 
    format: fileLoggingFormat
});

const logger = winston.createLogger({
    defaultMeta: {
        service: LOG_SERVICE
    }, 
    transports: [
        consoleTransport, 
        fileRotateTransport
    ], 
    exceptionHandlers: [
        consoleTransport, 
        fileRotateTransport
    ], 
    rejectionHandlers: [
        consoleTransport,
        fileRotateTransport
    ], 
    exitOnError: true
});

export default logger;
