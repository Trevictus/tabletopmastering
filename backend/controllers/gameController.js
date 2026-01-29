/**
 * @fileoverview Game Controller
 * @description Handles game CRUD, BGG search and synchronization
 * @module controllers/gameController
 * @requires ../services/gameService
 * @requires ../services/bggGameService
 */

const gameService = require('../services/gameService');
const bggGameService = require('../services/bggGameService');
const { createLogger } = require('../utils/logger');

const logger = createLogger('GameController');

/**
 * @desc    Buscar juegos en BoardGameGeek (sin guardar)
 * @route   GET /api/games/search-bgg
 * @access  Private
 */
exports.searchBGG = async (req, res, next) => {
  try {
    const { query, exact } = req.query;

    const results = await bggGameService.searchBGGGames(query, exact === 'true');

    res.status(200).json({
      success: true,
      count: results.length,
      data: results,
      warning: results.length === 0 && query ? 'No se encontraron resultados. BGG API puede estar experimentando problemas.' : null,
    });
  } catch (error) {
    // Return friendly error if BGG is unavailable
    logger.error('BGG search error', { message: error.message });
    
    res.status(503).json({
      success: false,
      message: 'La API de BoardGameGeek no está disponible temporalmente. Por favor, intenta crear un juego personalizado o intenta de nuevo más tarde.',
      error: 'BGG_UNAVAILABLE',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Obtener detalles de un juego de BGG por ID
 * @route   GET /api/games/bgg/:bggId
 * @access  Private
 */
exports.getBGGDetails = async (req, res, next) => {
  try {
    const { bggId } = req.params;

    const gameDetails = await bggGameService.getBGGGameDetails(bggId);

    res.status(200).json({
      success: true,
      data: gameDetails,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Añadir un juego de BGG
 * @route   POST /api/games/add-from-bgg
 * @access  Private
 */
exports.addFromBGG = async (req, res, next) => {
  try {
    const { bggId, groupId, customNotes } = req.body;

    const savedGame = await bggGameService.addBGGGame(
      bggId,
      req.user._id,
      groupId,
      customNotes
    );

    res.status(201).json({
      success: true,
      message: 'Juego añadido desde BGG exitosamente',
      data: savedGame,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
        ...(error.data && { data: error.data }),
      });
    }
    next(error);
  }
};

/**
 * @desc    Crear un juego personalizado
 * @route   POST /api/games
 * @access  Private
 */
exports.createGame = async (req, res, next) => {
  try {
    const {
      name,
      description,
      image,
      minPlayers,
      maxPlayers,
      playingTime,
      categories,
      mechanics,
      difficulty,
      groupId,
      yearPublished,
      customNotes,
    } = req.body;

    const savedGame = await gameService.createCustomGame(
      {
        name,
        description,
        image,
        minPlayers,
        maxPlayers,
        playingTime,
        categories,
        mechanics,
        difficulty,
        yearPublished,
        customNotes,
      },
      req.user._id,
      groupId
    );

    res.status(201).json({
      success: true,
      message: 'Juego personalizado creado exitosamente',
      data: savedGame,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
        ...(error.data && { data: error.data }),
      });
    }
    next(error);
  }
};

/**
 * @desc    List games (personal or by group without duplicates)
 * @route   GET /api/games
 * @access  Private
 */
exports.getGames = async (req, res, next) => {
  try {
    const { groupId, source, search, page = 1, limit = 20 } = req.query;

    // If there's groupId, verify access
    if (groupId) {
      await bggGameService.validateGroupAccess(groupId, req.user._id);
    }

    const result = await gameService.getGames(
      req.user._id,
      groupId || null,
      { source, search, page, limit }
    );

    res.status(200).json({
      success: true,
      count: result.count,
      total: result.total,
      pages: result.pages,
      currentPage: result.currentPage,
      data: result.games,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

/**
 * @desc    Get a game by ID
 * @route   GET /api/games/:id
 * @access  Private
 */
exports.getGame = async (req, res, next) => {
  try {
    const game = await gameService.getGameById(req.params.id, req.user._id);

    res.status(200).json({
      success: true,
      data: game,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

/**
 * @desc    Actualizar un juego
 * @route   PUT /api/games/:id
 * @access  Private
 */
exports.updateGame = async (req, res, next) => {
  try {
    const updatedGame = await gameService.updateGame(
      req.params.id,
      req.body,
      req.user._id
    );

    res.status(200).json({
      success: true,
      message: 'Juego actualizado exitosamente',
      data: updatedGame,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

/**
 * @desc    Sincronizar juego de BGG (actualizar datos)
 * @route   PUT /api/games/:id/sync-bgg
 * @access  Private
 */
exports.syncBGGGame = async (req, res, next) => {
  try {
    const updatedGame = await bggGameService.syncBGGGame(
      req.params.id,
      req.user._id
    );

    res.status(200).json({
      success: true,
      message: 'Juego sincronizado con BGG exitosamente',
      data: updatedGame,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

/**
 * @desc    Eliminar un juego (soft delete)
 * @route   DELETE /api/games/:id
 * @access  Private
 */
exports.deleteGame = async (req, res, next) => {
  try {
    await gameService.deleteGame(req.params.id, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Juego eliminado exitosamente',
      data: {},
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

/**
 * @desc    Obtener juegos populares de BGG
 * @route   GET /api/games/bgg/hot
 * @access  Private
 */
exports.getHotGames = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const hotGames = await bggGameService.getHotGames(limit);

    res.status(200).json({
      success: true,
      count: hotGames.length,
      data: hotGames,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get game statistics for a group
 * @route   GET /api/games/stats/:groupId
 * @access  Private
 */
exports.getGroupGameStats = async (req, res, next) => {
  try {
    const { groupId } = req.params;

    // Verify group access
    await bggGameService.validateGroupAccess(groupId, req.user._id);

    const stats = await gameService.getGroupStats(groupId);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

/**
 * @desc    Upload image for a game
 * @route   POST /api/games/:id/upload-image
 * @access  Private
 */
exports.uploadGameImage = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se ha proporcionado ninguna imagen',
      });
    }

    // Build image URL
    const protocol = req.protocol;
    const host = req.get('host');
    const imageUrl = `${protocol}://${host}/uploads/games/${req.file.filename}`;

    // Update game with new image
    const updatedGame = await gameService.updateGame(
      id,
      { image: imageUrl },
      req.user._id
    );

    res.status(200).json({
      success: true,
      message: 'Imagen subida exitosamente',
      data: {
        game: updatedGame,
        imageUrl: imageUrl,
        filename: req.file.filename,
      },
    });
  } catch (error) {
    // If there's an error, delete the uploaded file
    if (req.file) {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '../uploads/games', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};
