import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { env } from './env.js';

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.simple(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let result = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      result += ` ${JSON.stringify(meta)}`;
    }
    return result;
  })
);

// Daily rotate file transport for all logs
const fileTransport = new DailyRotateFile({
  filename: 'logs/valkey-db-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: logFormat,
  level: env.LOG_LEVEL,
});

// Daily rotate file transport for errors only
const errorFileTransport = new DailyRotateFile({
  filename: 'logs/valkey-db-error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d',
  format: logFormat,
  level: 'error',
});

// Create logger instance
export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: logFormat,
  defaultMeta: { service: 'valkey-spaces-db' },
  transports: [
    fileTransport,
    errorFileTransport,
  ],
});

// Add console transport for development
if (env.NODE_ENV === 'development') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    level: env.LOG_LEVEL,
  }));
}

// Handle transport events
fileTransport.on('rotate', (oldFilename, newFilename) => {
  logger.info('Log file rotated', { oldFilename, newFilename });
});

errorFileTransport.on('rotate', (oldFilename, newFilename) => {
  logger.info('Error log file rotated', { oldFilename, newFilename });
});

export default logger;