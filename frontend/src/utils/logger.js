/**
 * @fileoverview Custom logger for development
 * @description Minimalist logging system with levels and colors
 * @module utils/logger
 */

const isDev = import.meta.env.DEV;

const COLORS = {
  info: '#0ea5e9',      // Blue
  warn: '#eab308',      // Yellow
  error: '#ef4444',     // Red
  debug: '#8b5cf6',     // Purple
  success: '#22c55e',   // Green
};

/**
 * Custom logger with levels and modules
 * Only shows logs in development
 * 
 * @example
 * const logger = new Logger('AuthService');
 * logger.info('User authenticated');
 * logger.error('Connection error', { status: 500 });
 */
class Logger {
  /**
   * @param {string} module - Module name (for identification)
   */
  constructor(module) {
    this.module = module;
  }

  /**
   * Base log with level and optional data
   * @private
   */
  log(level, message, data = null) {
    if (!isDev) return;

    const timestamp = new Date().toLocaleTimeString();
    const style = `color: ${COLORS[level]}; font-weight: bold;`;
    const prefix = `[${timestamp}] ${this.module}`;

    if (data) {
      console.log(`%c${prefix}`, style, message, data);
    } else {
      console.log(`%c${prefix}`, style, message);
    }
  }

  /**
   * Info log
   * @param {string} message
   * @param {*} data - Optional additional data
   */
  info(message, data) {
    this.log('info', message, data);
  }

  /**
   * Warning log
   * @param {string} message
   * @param {*} data - Optional additional data
   */
  warn(message, data) {
    this.log('warn', message, data);
  }

  /**
   * Error log
   * @param {string} message
   * @param {*} data - Optional additional data
   */
  error(message, data) {
    this.log('error', message, data);
  }

  /**
   * Debug log
   * @param {string} message
   * @param {*} data - Optional additional data
   */
  debug(message, data) {
    this.log('debug', message, data);
  }

  /**
   * Success log
   * @param {string} message
   * @param {*} data - Optional additional data
   */
  success(message, data) {
    this.log('success', message, data);
  }
}

export default Logger;
