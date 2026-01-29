/**
 * @fileoverview Authentication Middleware
 * @description Route protection via JWT verification
 * @module middlewares/auth
 * @requires jsonwebtoken
 * @requires ../models/User
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { createLogger } = require('../utils/logger');

const logger = createLogger('Auth');

/**
 * Middleware to protect routes that require authentication
 */
const protect = async (req, res, next) => {
  let token;

  // Check if token is in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token (without password)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no encontrado',
        });
      }

      if (!req.user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Usuario desactivado',
        });
      }

      next();
    } catch (error) {
      logger.error('Authentication error', error);
      
      // Differentiate between expired and invalid tokens
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expirado',
        });
      }
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Token inválido o malformado',
        });
      }
      
      return res.status(401).json({
        success: false,
        message: 'Error en la autenticación',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No autorizado, token no proporcionado',
    });
  }
};

module.exports = { protect };
