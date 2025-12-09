// src/lib/client-logger.ts

// Client-side safe logger
// Wrapper for console to prevent "child_process" crashes and allow easy toggling

const isDev = process.env.NODE_ENV === 'development';

export const logEvent = (message: string, meta: Record<string, any> = {}) => {
    if (isDev) {
        console.log(`[EVENT] ${message}`, meta);
    }
};

export const logError = (message: string, error: any, meta: Record<string, any> = {}) => {
    // Always log errors, but maybe format them better for prod
    console.error(`[ERROR] ${message}`, error, meta);
};
