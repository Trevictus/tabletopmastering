/**
 * @fileoverview Error Handler Middleware
 * @description Centralized application error handling
 * @module middlewares/errorHandler
 */

const { createLogger } = require('../utils/logger');

const logger = createLogger('ErrorHandler');

/**
 * Global error handling middleware
 * @param {Error} err - Captured error
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
const errorHandler = (err, req, res, next) => {
  logger.error('Request error', err);

  // Error de Mongoose - CastError (ID inválido)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'ID de recurso inválido',
    });
  }

  // Error de Mongoose - Validación
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((error) => error.message);
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors,
    });
  }

  // Error de Mongoose - Clave duplicada
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      success: false,
      message: `El ${field} ya existe`,
    });
  }

  // Error de JWT - Token inválido
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token inválido o malformado',
    });
  }

  // Error de JWT - Token expirado
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expirado',
    });
  }

  // Error de CORS
  if (err.message === 'CORS no permitido') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado - Origen no permitido',
    });
  }

  // Error de autenticación
  if (err.statusCode === 401) {
    return res.status(401).json({
      success: false,
      message: err.message || 'No autorizado',
    });
  }

  // Error de autorización
  if (err.statusCode === 403) {
    return res.status(403).json({
      success: false,
      message: err.message || 'Acceso denegado',
    });
  }

  // Error de base de datos (conexión)
  if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
    return res.status(503).json({
      success: false,
      message: 'Base de datos no disponible',
    });
  }

  // Error genérico
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { 
      error: err.name,
      stack: err.stack 
    }),
  });
};

/**
 * Middleware para rutas no encontradas
 */
const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
};

module.exports = { errorHandler, notFound };
