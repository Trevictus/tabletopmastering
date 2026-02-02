/**
 * @fileoverview Error Handler
 * @description Functions for centralized API error handling
 * @module utils/errorHandler
 */

import Logger from './logger';

const logger = new Logger('ErrorHandler');

/**
 * Handles API request errors
 * @param {Error} error - Axios error
 * @returns {string} Formatted error message
 */
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with a status code outside 2xx range
    return error.response.data?.message || 'Server error';
  } else if (error.request) {
    // Request was made but no response received
    return 'No se pudo conectar con el servidor';
  } else {
    // Something happened while setting up the request
    return error.message || 'Error desconocido';
  }
};

/**
 * Shows a success message
 * @param {string} message - Message to show
 */
export const showSuccess = (message) => {
  // Implement with toast/notification library
  logger.success(message);
};

/**
 * Shows an error message
 * @param {string} message - Message to show
 */
export const showError = (message) => {
  // Implement with toast/notification library
  logger.error(message);
};
