/**
 * @fileoverview Rutas de Juegos
 * @description Define endpoints para CRUD de juegos, BGG, caché y estadísticas
 * @module routes/gameRoutes
 * @requires express
 * @requires ../middlewares/auth
 * @requires ../middlewares/gameValidator
 * @requires ../controllers/gameController
 * @requires ../controllers/cacheController
 */

const express = require('express');
const { protect } = require('../middlewares/auth');
const { validate } = require('../middlewares/validator');
const upload = require('../middlewares/upload');
const {
  createGameValidation,
  addFromBGGValidation,
  updateGameValidation,
  searchBGGValidation,
  getBGGDetailsValidation,
  getGamesValidation,
  idParamValidation,
  groupStatsValidation,
  hotGamesValidation,
} = require('../middlewares/gameValidator');
const {
  searchBGG,
  getBGGDetails,
  addFromBGG,
  createGame,
  getGames,
  getGame,
  updateGame,
  syncBGGGame,
  deleteGame,
  getHotGames,
  getGroupGameStats,
  uploadGameImage,
} = require('../controllers/gameController');
const {
  getCacheStats,
  invalidateCache,
  clearCache,
} = require('../controllers/cacheController');

const router = express.Router();

// BGG cache routes (administration)
router.get('/cache/stats', protect, getCacheStats);
router.delete('/cache/:bggId', protect, invalidateCache);
router.delete('/cache', protect, clearCache);

// BGG routes (search and fetch external data)
router.get('/search-bgg', protect, searchBGGValidation, validate, searchBGG);
router.get('/bgg/hot', protect, hotGamesValidation, validate, getHotGames);
router.get('/bgg/:bggId', protect, getBGGDetailsValidation, validate, getBGGDetails);

// Game management routes
router.post('/add-from-bgg', protect, addFromBGGValidation, validate, addFromBGG);
router.post('/', protect, createGameValidation, validate, createGame);
router.get('/', protect, getGamesValidation, validate, getGames);

// Specific routes with full paths BEFORE routes with dynamic parameters
router.get('/stats/:groupId', protect, groupStatsValidation, validate, getGroupGameStats);

// Middleware to handle multer errors
const handleMulterError = (err, req, res, next) => {
  if (err) {
    if (err.message.includes('Tipo de archivo no válido')) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'La imagen no puede superar los 5MB',
      });
    }
  }
  next(err);
};

// Routes with dynamic parameters - most specific first
router.post('/:id/upload-image', protect, idParamValidation, validate, upload.single('image'), handleMulterError, uploadGameImage);
router.put('/:id/sync-bgg', protect, idParamValidation, validate, syncBGGGame);
router.get('/:id', protect, idParamValidation, validate, getGame);
router.put('/:id', protect, updateGameValidation, validate, updateGame);
router.delete('/:id', protect, idParamValidation, validate, deleteGame);

module.exports = router;


