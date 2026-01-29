/**
 * @fileoverview API Error Handler
 * @description Utilities for HTTP error categorization and formatting
 * @module services/apiErrorHandler
 */

import Logger from '../utils/logger';

const logger = new Logger('APIErrorHandler');

/**
 * Utilities for centralized API error handling
 * 
 * Provides helper functions to:
 * - Extract consistent error messages
 * - Categorize error types
 * - Format errors for UI
 */

/**
 * Classified error types
 */
export const ErrorTypes = {
  NETWORK: 'network',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  VALIDATION: 'validation',
  NOT_FOUND: 'not_found',
  SERVER: 'server',
  TIMEOUT: 'timeout',
  CANCELLED: 'cancelled',
  UNKNOWN: 'unknown',
};

/**
 * Default error messages in Spanish (user-facing)
 */
const DEFAULT_ERROR_MESSAGES = {
  [ErrorTypes.NETWORK]: 'Error de conexión. Verifica tu conexión a internet.',
  [ErrorTypes.AUTHENTICATION]: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
  [ErrorTypes.AUTHORIZATION]: 'No tienes permisos para realizar esta acción.',
  [ErrorTypes.VALIDATION]: 'Los datos proporcionados no son válidos.',
  [ErrorTypes.NOT_FOUND]: 'El recurso solicitado no fue encontrado.',
  [ErrorTypes.SERVER]: 'Error en el servidor. Inténtalo de nuevo más tarde.',
  [ErrorTypes.TIMEOUT]: 'La petición tardó demasiado tiempo. Inténtalo de nuevo.',
  [ErrorTypes.CANCELLED]: 'La petición fue cancelada.',
  [ErrorTypes.UNKNOWN]: 'Ocurrió un error inesperado.',
};

/**
 * Determines error type based on error object
 * 
 * @param {Object} error - Axios error
 * @returns {string} Error type
 */
export const getErrorType = (error) => {
  // Network error (no response)
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return ErrorTypes.TIMEOUT;
    }
    if (error.message === 'Network Error') {
      return ErrorTypes.NETWORK;
    }
    if (error.message?.includes('cancelada') || error.message?.includes('canceled')) {
      return ErrorTypes.CANCELLED;
    }
    return ErrorTypes.NETWORK;
  }

  // Errors with server response
  const status = error.response.status;

  switch (status) {
    case 401:
      return ErrorTypes.AUTHENTICATION;
    case 403:
      return ErrorTypes.AUTHORIZATION;
    case 404:
      return ErrorTypes.NOT_FOUND;
    case 422:
    case 400:
      return ErrorTypes.VALIDATION;
    case 500:
    case 502:
    case 503:
    case 504:
      return ErrorTypes.SERVER;
    default:
      return ErrorTypes.UNKNOWN;
  }
};

/**
 * Extracts error message from error object
 * 
 * @param {Object} error - Axios error
 * @returns {string} Human-readable error message
 */
export const getErrorMessage = (error) => {
  const errorType = getErrorType(error);

  // If there's a specific server message, use it
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  // If there are detailed validation errors
  if (error.response?.data?.errors) {
    const validationErrors = error.response.data.errors;
    
    // If it's an errors object
    if (typeof validationErrors === 'object' && !Array.isArray(validationErrors)) {
      const firstError = Object.values(validationErrors)[0];
      return Array.isArray(firstError) ? firstError[0] : firstError;
    }
    
    // If it's an errors array
    if (Array.isArray(validationErrors)) {
      return validationErrors[0]?.msg || validationErrors[0];
    }
  }

  // Default message based on type
  return DEFAULT_ERROR_MESSAGES[errorType];
};

/**
 * Extracts all validation errors
 * 
 * @param {Object} error - Axios error
 * @returns {Object} Object with fields and their errors
 */
export const getValidationErrors = (error) => {
  if (error.response?.data?.errors) {
    const errors = error.response.data.errors;
    
    // If already field -> error object, return it
    if (typeof errors === 'object' && !Array.isArray(errors)) {
      return errors;
    }
    
    // If errors array, convert to object
    if (Array.isArray(errors)) {
      return errors.reduce((acc, err) => {
        if (err.param) {
          acc[err.param] = err.msg;
        }
        return acc;
      }, {});
    }
  }
  
  return {};
};

/**
 * Crea un objeto de error formateado para la UI
 * 
 * @param {Object} error - Error de Axios
 * @returns {Object} Error formateado
 */
export const formatError = (error) => {
  return {
    type: getErrorType(error),
    message: getErrorMessage(error),
    validationErrors: getValidationErrors(error),
    status: error.response?.status,
    statusText: error.response?.statusText,
    originalError: import.meta.env.DEV ? error : undefined,
  };
};

/**
 * Verifica si un error es de un tipo específico
 * 
 * @param {Object} error - Error de Axios
 * @param {string} type - Tipo de error a verificar
 * @returns {boolean}
 */
export const isErrorType = (error, type) => {
  return getErrorType(error) === type;
};

/**
 * Verifica si el error es recuperable (puede reintentar)
 * 
 * @param {Object} error - Error de Axios
 * @returns {boolean}
 */
export const isRetryableError = (error) => {
  const type = getErrorType(error);
  return [
    ErrorTypes.NETWORK,
    ErrorTypes.TIMEOUT,
    ErrorTypes.SERVER,
  ].includes(type);
};

/**
 * Muestra un error en consola de forma amigable (solo en desarrollo)
 * 
 * @param {Object} error - Error de Axios
 * @param {string} context - Contexto donde ocurrió el error
 */
export const logError = (error, context = 'API') => {
  const formatted = formatError(error);
  
  logger.error(`[${context}] ${formatted.type}`, {
    message: formatted.message,
    status: formatted.status,
    validationErrors: Object.keys(formatted.validationErrors).length > 0 ? formatted.validationErrors : null,
    originalError: formatted.originalError,
  });
};

export default {
  ErrorTypes,
  getErrorType,
  getErrorMessage,
  getValidationErrors,
  formatError,
  isErrorType,
  isRetryableError,
  logError,
};
