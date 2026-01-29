/**
 * @fileoverview Match Controller
 * @description Handles match CRUD, results and calendar
 * @module controllers/matchController
 * @requires ../services/matchService
 */

const matchService = require('../services/matchService');

/**
 * @desc    Create a match
 * @route   POST /api/matches
 * @access  Private
 */
exports.createMatch = async (req, res, next) => {
  try {
    const { gameId, groupId, scheduledDate, location, playerIds, notes } = req.body;

    const match = await matchService.createMatch(
      gameId,
      groupId,
      scheduledDate,
      req.user._id,
      playerIds,
      location,
      notes
    );

    res.status(201).json({
      success: true,
      message: 'Partida creada exitosamente',
      data: match,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }
    // Handle Mongoose validation errors or other errors
    if (error.message) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

/**
 * @desc    List matches (with filters)
 * @route   GET /api/matches
 * @access  Private
 */
exports.getMatches = async (req, res, next) => {
  try {
    const { groupId, status, page = 1, limit = 20 } = req.query;

    const result = await matchService.getMatches(
      groupId || null,
      req.user._id,
      status,
      page,
      limit
    );

    res.status(200).json({
      success: true,
      count: result.count,
      total: result.total,
      pages: result.pages,
      currentPage: result.currentPage,
      data: result.matches,
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
 * @desc    Get a match by ID
 * @route   GET /api/matches/:id
 * @access  Private
 */
exports.getMatch = async (req, res, next) => {
  try {
    const { id } = req.params;

    const match = await matchService.getMatchById(id, req.user._id);

    res.status(200).json({
      success: true,
      data: match,
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
 * @desc    Update match
 * @route   PUT /api/matches/:id
 * @access  Private
 */
exports.updateMatch = async (req, res, next) => {
  try {
    const { id } = req.params;

    const match = await matchService.updateMatch(id, req.body, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Partida actualizada exitosamente',
      data: match,
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
 * @desc    Register match results
 * @route   POST /api/matches/:id/finish
 * @access  Private
 */
exports.finishMatch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { winnerId, results, duration, notes } = req.body;

    const { match, rankingReport } = await matchService.finishMatch(
      id,
      req.user._id,
      winnerId,
      results,
      duration,
      notes
    );

    res.status(200).json({
      success: true,
      message: 'Partida finalizada y resultados registrados',
      data: match,
      ranking: rankingReport,
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
 * @desc    Confirm match attendance
 * @route   POST /api/matches/:id/confirm
 * @access  Private
 */
exports.confirmAttendance = async (req, res, next) => {
  try {
    const { id } = req.params;

    const match = await matchService.confirmAttendance(id, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Asistencia confirmada',
      data: match,
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
 * @desc    Cancel match attendance
 * @route   DELETE /api/matches/:id/confirm
 * @access  Private
 */
exports.cancelAttendance = async (req, res, next) => {
  try {
    const { id } = req.params;

    const match = await matchService.cancelAttendance(id, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Asistencia cancelada',
      data: match,
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
 * @desc    Delete match
 * @route   DELETE /api/matches/:id
 * @access  Private
 */
exports.deleteMatch = async (req, res, next) => {
  try {
    const { id } = req.params;

    await matchService.deleteMatch(id, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Partida eliminada exitosamente',
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
 * @desc    Get global user ranking
 * @route   GET /api/matches/ranking/global
 * @access  Private
 */
exports.getGlobalRanking = async (req, res, next) => {
  try {
    const ranking = await matchService.getGlobalRanking();

    res.status(200).json({
      success: true,
      data: ranking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get group ranking
 * @route   GET /api/matches/ranking/group/:groupId
 * @access  Private
 */
exports.getGroupRanking = async (req, res, next) => {
  try {
    const { groupId } = req.params;

    const ranking = await matchService.getGroupRanking(groupId, req.user._id);

    res.status(200).json({
      success: true,
      data: ranking,
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
