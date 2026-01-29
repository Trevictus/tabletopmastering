/**
 * @fileoverview Rutas de Grupos
 * @description Define endpoints para CRUD de grupos, miembros e invitaciones
 * @module routes/groupRoutes
 * @requires express
 * @requires express-validator
 * @requires ../controllers/groupController
 * @requires ../middlewares/auth
 * @requires ../middlewares/groupAuth
 */

const express = require('express');
const { body, param } = require('express-validator');
const {
  createGroup,
  getMyGroups,
  getGroup,
  getGroupPublic,
  joinGroup,
  updateGroup,
  regenerateInviteCode,
  getMembers,
  removeMember,
  leaveGroup,
  deleteGroup,
  inviteUserToGroup,
} = require('../controllers/groupController');
const { protect } = require('../middlewares/auth');
const { isGroupMember, isGroupAdmin } = require('../middlewares/groupAuth');
const { validate } = require('../middlewares/validator');

const router = express.Router();

// Validaciones
const createGroupValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('El nombre del grupo es obligatorio')
    .isLength({ min: 3, max: 50 })
    .withMessage('El nombre debe tener entre 3 y 50 caracteres'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('La descripción no puede exceder 500 caracteres'),
  body('avatar').optional(),
];

const updateGroupValidation = [
  param('id').isMongoId().withMessage('ID de grupo inválido'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('El nombre debe tener entre 3 y 50 caracteres'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('La descripción no puede exceder 500 caracteres'),
  body('avatar').optional(),
  body('settings.isPrivate').optional().isBoolean().withMessage('isPrivate debe ser booleano'),
  body('settings.maxMembers')
    .optional()
    .isInt({ min: 2, max: 100 })
    .withMessage('maxMembers debe estar entre 2 y 100'),
  body('settings.requireApproval')
    .optional()
    .isBoolean()
    .withMessage('requireApproval debe ser booleano'),
];

const joinGroupValidation = [
  body('inviteCode')
    .trim()
    .toUpperCase()
    .notEmpty()
    .withMessage('El código de invitación es obligatorio')
    .isLength({ min: 8, max: 8 })
    .withMessage('El código debe tener 8 caracteres')
    .isAlphanumeric()
    .withMessage('El código solo puede contener letras y números'),
];

const idValidation = [param('id').isMongoId().withMessage('ID de grupo inválido')];

const memberValidation = [
  param('id').isMongoId().withMessage('ID de grupo inválido'),
  param('userId').isMongoId().withMessage('ID de usuario inválido'),
];

// Public routes (no authentication)
router.get('/public/:id', idValidation, validate, getGroupPublic);

// Protected routes - Specific routes first
router.post('/', protect, createGroupValidation, validate, createGroup);
router.get('/', protect, getMyGroups);
router.post('/join', protect, joinGroupValidation, validate, joinGroup);

// Routes with specific parameters (before generic :id routes)
router.put('/:id/invite-code', protect, idValidation, validate, isGroupAdmin, regenerateInviteCode);
router.post('/:id/invite', protect, idValidation, validate, isGroupAdmin, inviteUserToGroup);
router.delete('/:id/members/:userId', protect, memberValidation, validate, isGroupAdmin, removeMember);

// Routes that require being a group member
router.get('/:id', protect, idValidation, validate, isGroupMember, getGroup);
router.get('/:id/members', protect, idValidation, validate, isGroupMember, getMembers);
router.delete('/:id/leave', protect, idValidation, validate, leaveGroup);

// Routes that require being group admin
router.put('/:id', protect, updateGroupValidation, validate, isGroupAdmin, updateGroup);
router.delete('/:id', protect, idValidation, validate, isGroupAdmin, deleteGroup);

module.exports = router;
