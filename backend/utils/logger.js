/**
 * @fileoverview Professional logger for Tabletop Mastering API
 * @description Centralized logging system with log levels and environment awareness
 * @module utils/logger
 */

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Log levels
 * @enum {number}
 */
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

/**
 * Current log level based on environment
 */
const currentLevel = isDev ? LOG_LEVELS.debug : LOG_LEVELS.warn;

/**
 * Format log message with timestamp and module
 * @param {string} level - Log level
 * @param {string} module - Module name
 * @param {string} message - Log message
 * @returns {string} Formatted message
 */
const formatMessage = (level, module, message) => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] [${module}] ${message}`;
};

/**
 * Logger class for structured logging
 * @class
 */
class Logger {
  /**
   * Create a logger instance
   * @param {string} module - Module name for identification
   */
  constructor(module) {
    this.module = module;
  }

  /**
   * Log error message (always logged)
   * @param {string} message - Error message
   * @param {*} [data] - Additional data
   */
  error(message, data = null) {
    if (currentLevel >= LOG_LEVELS.error) {
      const formatted = formatMessage('error', this.module, message);
      if (data) {
        console.error(formatted, data);
      } else {
        console.error(formatted);
      }
    }
  }

  /**
   * Log warning message (logged in development and production)
   * @param {string} message - Warning message
   * @param {*} [data] - Additional data
   */
  warn(message, data = null) {
    if (currentLevel >= LOG_LEVELS.warn) {
      const formatted = formatMessage('warn', this.module, message);
      if (data) {
        console.warn(formatted, data);
      } else {
        console.warn(formatted);
      }
    }
  }

  /**
   * Log info message (only in development)
   * @param {string} message - Info message
   * @param {*} [data] - Additional data
   */
  info(message, data = null) {
    if (currentLevel >= LOG_LEVELS.info) {
      const formatted = formatMessage('info', this.module, message);
      if (data) {
        console.info(formatted, data);
      } else {
        console.info(formatted);
      }
    }
  }

  /**
   * Log debug message (only in development)
   * @param {string} message - Debug message
   * @param {*} [data] - Additional data
   */
  debug(message, data = null) {
    if (currentLevel >= LOG_LEVELS.debug) {
      const formatted = formatMessage('debug', this.module, message);
      if (data) {
        console.debug(formatted, data);
      } else {
        console.debug(formatted);
      }
    }
  }
}

/**
 * Create a new logger instance
 * @param {string} module - Module name
 * @returns {Logger} Logger instance
 */
const createLogger = (module) => new Logger(module);

module.exports = { Logger, createLogger };
