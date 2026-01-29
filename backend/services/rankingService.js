/**
 * @fileoverview Ranking Service
 * @description Logic for rankings, statistics and user scores
 * @module services/rankingService
 * @requires ../models/User
 * @requires ./pointsCalculator
 */

const User = require('../models/User');
const pointsCalculator = require('./pointsCalculator');

/**
 * Service for handling user ranking and statistics
 * Optimized with lean(), projections and efficient queries
 */

/**
 * Projection for ranking data
 */
const RANKING_USER_PROJECTION = {
  nickname: 1,
  name: 1,
  avatar: 1,
  stats: 1,
};

/**
 * Updates a user's points (using atomic findByIdAndUpdate)
 * @param {string} userId - User ID
 * @param {number} pointsEarned - Points earned
 * @param {boolean} isWinner - If was winner
 * @returns {object} Updated user
 */
const updateUserPoints = async (userId, pointsEarned, isWinner = false) => {
  const updateOps = {
    $inc: {
      'stats.totalPoints': pointsEarned,
      'stats.totalMatches': 1,
    }
  };
  
  if (isWinner) {
    updateOps.$inc['stats.totalWins'] = 1;
  }
  
  const user = await User.findByIdAndUpdate(
    userId,
    updateOps,
    { new: true, select: 'stats' }
  ).lean();
  
  if (!user) {
    throw new Error(`Usuario ${userId} no encontrado`);
  }

  return user;
};

/**
 * Updates statistics for all players in a match
 * @param {object} match - Match document with players and winner
 * @returns {object} Update report
 */
const updateMatchStatistics = async (match) => {
  const report = {
    success: true,
    updatedPlayers: [],
    errors: [],
  };

  // Calculate points for each player
  const pointsData = pointsCalculator.calculatePointsForAllPlayers(match.players);

  // Update each player
  for (const data of pointsData) {
    try {
      const isWinner = match.winner && match.winner.toString() === data.userId.toString();
      const updatedUser = await updateUserPoints(data.userId, data.points, isWinner);
      
      report.updatedPlayers.push({
        userId: data.userId,
        points: data.points,
        isWinner,
        stats: updatedUser.stats,
      });
    } catch (error) {
      report.errors.push({
        userId: data.userId,
        error: error.message,
      });
    }
  }

  return report;
};

/**
 * Gets the ranking of a group (optimized with lean and projection)
 * @param {string} groupId - Group ID
 * @returns {Array} Array of users sorted by points
 */
const getGroupRanking = async (groupId) => {
  const users = await User.find({
    groups: groupId,
  })
    .select(RANKING_USER_PROJECTION)
    .sort({ 'stats.totalPoints': -1 })
    .lean();

  return users.map((user, index) => ({
    position: index + 1,
    userId: user._id,
    nickname: user.nickname,
    name: user.name,
    avatar: user.avatar,
    totalPoints: user.stats.totalPoints,
    totalMatches: user.stats.totalMatches,
    totalWins: user.stats.totalWins,
    winRate: user.stats.totalMatches > 0 
      ? ((user.stats.totalWins / user.stats.totalMatches) * 100).toFixed(2) 
      : 0,
  }));
};

/**
 * Gets the global ranking of all users (optimized with lean and projection)
 * @returns {Array} Array of users sorted by points
 */
const getGlobalRanking = async () => {
  const users = await User.find({ isActive: true })
    .select(RANKING_USER_PROJECTION)
    .sort({ 'stats.totalPoints': -1 })
    .lean();

  return users.map((user, index) => ({
    position: index + 1,
    userId: user._id,
    nickname: user.nickname,
    name: user.name,
    avatar: user.avatar,
    totalPoints: user.stats.totalPoints,
    totalMatches: user.stats.totalMatches,
    totalWins: user.stats.totalWins,
    winRate: user.stats.totalMatches > 0 
      ? ((user.stats.totalWins / user.stats.totalMatches) * 100).toFixed(2) 
      : 0,
  }));
};

module.exports = {
  updateUserPoints,
  updateMatchStatistics,
  getGroupRanking,
  getGlobalRanking,
};
