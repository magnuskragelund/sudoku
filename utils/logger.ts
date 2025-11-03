/**
 * Development-only logger utility
 * Only logs in development mode, strips all logging in production builds
 */

const isDev = __DEV__;

export const logger = {
  log: (...args: any[]): void => {
    if (isDev) {
      console.log(...args);
    }
  },
  
  warn: (...args: any[]): void => {
    if (isDev) {
      console.warn(...args);
    }
  },
  
  error: (...args: any[]): void => {
    if (isDev) {
      console.error(...args);
    }
  },
  
  debug: (...args: any[]): void => {
    if (isDev) {
      console.debug(...args);
    }
  },
  
  info: (...args: any[]): void => {
    if (isDev) {
      console.info(...args);
    }
  },
};

