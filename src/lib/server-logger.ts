// src/lib/server-logger.ts
import winston from 'winston';
import { LoggingWinston } from '@google-cloud/logging-winston';

// Server-side only logger
// This file MUST NOT be imported by client components

const loggingWinston = new LoggingWinston({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'workshop-starter-480301',
});

export const logger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }),
    loggingWinston,
  ],
});

export const logEvent = (message: string, meta: Record<string, any> = {}) => {
    const structuredMeta = {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        ...meta
    };
    logger.info(message, structuredMeta);
};

export const logError = (message: string, error: any, meta: Record<string, any> = {}) => {
    logger.error(message, {
        timestamp: new Date().toISOString(),
        error: error.message || error,
        stack: error.stack,
        ...meta
    });
};
