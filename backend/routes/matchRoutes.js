/**
 * @fileoverview Rutas de Partidas
 * @description Define endpoints para CRUD de partidas, resultados y rankings
 * @module routes/matchRoutes
 * @requires express
 * @requires ../middlewares/auth
 * @requires ../controllers/matchController
 */

const express = require('express');
const { protect } = require('../middlewares/auth');
const {
  createMatch,
  getMatches,
  getMatch,
  updateMatch,
  finishMatch,
  confirmAttendance,
  cancelAttendance,
  deleteMatch,
  getGlobalRanking,
  getGroupRanking,
} = require('../controllers/matchController');

const router = express.Router();

// Ranking routes
router.get('/ranking/global', protect, getGlobalRanking);
router.get('/ranking/group/:groupId', protect, getGroupRanking);

// Protected routes
router.post('/', protect, createMatch);
router.get('/', protect, getMatches);
router.get('/:id', protect, getMatch);
router.put('/:id', protect, updateMatch);
router.post('/:id/finish', protect, finishMatch);
router.post('/:id/confirm', protect, confirmAttendance);
router.delete('/:id/confirm', protect, cancelAttendance);
router.delete('/:id', protect, deleteMatch);

module.exports = router;
