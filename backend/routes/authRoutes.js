/**
 * @fileoverview Rutas de Autenticación
 * @description Define endpoints para registro, login, perfil y gestión de cuenta
 * @module routes/authRoutes
 * @requires express
 * @requires express-validator
 * @requires ../controllers/authController
 * @requires ../middlewares/auth
 */

const express = require('express');
const { body } = require('express-validator');
const { register, login, getMe, updateProfile, checkNickname, checkEmail, exportUserData, deleteAccount } = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const { validate } = require('../middlewares/validator');

const router = express.Router();

// Validaciones
const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('El nombre es obligatorio')
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('El email es obligatorio')
    .isEmail()
    .withMessage('Debe ser un email válido')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('La contraseña es obligatoria')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
];

const loginValidation = [
  body('identifier')
    .trim()
    .notEmpty()
    .withMessage('El email o nombre de jugador es obligatorio')
    .isLength({ min: 3 })
    .withMessage('Debe tener al menos 3 caracteres'),
  body('password').notEmpty().withMessage('La contraseña es obligatoria'),
];

const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  body('avatar')
    .optional()
    .custom((value) => {
      // Allow URLs or base64
      if (!value) return true;
      const isUrl = value.startsWith('http://') || value.startsWith('https://');
      const isBase64 = value.startsWith('data:image/');
      if (!isUrl && !isBase64) {
        throw new Error('El avatar debe ser una URL o imagen base64');
      }
      return true;
    }),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('La descripción no puede exceder 500 caracteres'),
  body('quote')
    .optional()
    .isLength({ max: 200 })
    .withMessage('La cita no puede exceder 200 caracteres'),
];

// Public routes
router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.post('/check-nickname', checkNickname);
router.post('/check-email', checkEmail);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfileValidation, validate, updateProfile);
router.get('/export-data', protect, exportUserData);
router.delete('/delete-account', protect, deleteAccount);

module.exports = router;
