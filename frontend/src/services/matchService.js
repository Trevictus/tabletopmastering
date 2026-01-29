/**
 * @fileoverview Match Service
 * @description CRUD operations for matches and calendar
 * @module services/matchService
 */

import api from './api';

const matchService = {
  // Get matches (when backend is implemented)
  getMatches: async (params = {}) => {
    const response = await api.get('/matches', { params });
    return response.data;
  },

  // Get all user matches from all their groups
  getAllUserMatches: async (params = {}) => {
    const response = await api.get('/matches', { params });
    return response.data;
  },

  // Create new match
  createMatch: async (matchData) => {
    const response = await api.post('/matches', matchData);
    return response.data;
  },

  // Get match details
  getMatchById: async (matchId) => {
    const response = await api.get(`/matches/${matchId}`);
    return response.data;
  },

  // Update match
  updateMatch: async (matchId, matchData) => {
    const response = await api.put(`/matches/${matchId}`, matchData);
    return response.data;
  },

  // Delete match
  deleteMatch: async (matchId) => {
    const response = await api.delete(`/matches/${matchId}`);
    return response.data;
  },

  // Confirm attendance to a match
  confirmAttendance: async (matchId) => {
    const response = await api.post(`/matches/${matchId}/confirm`);
    return response.data;
  },

  // Cancel attendance (update confirmed to false)
  cancelAttendance: async (matchId) => {
    const response = await api.delete(`/matches/${matchId}/confirm`);
    return response.data;
  },

  /**
   * Finish match and record results
   * @param {string} matchId - Match ID
   * @param {object} resultData - Result data
   * @param {string} resultData.winnerId - Winner ID (optional)
   * @param {Array} resultData.results - Array of { userId, score, position }
   * @param {object} resultData.duration - { value: number, unit: 'minutes'|'hours' }
   * @param {string} resultData.notes - Additional notes (optional)
   * @returns {object} { data: match, ranking: rankingReport }
   */
  finishMatch: async (matchId, resultData) => {
    const response = await api.post(`/matches/${matchId}/finish`, resultData);
    return response.data;
  },
};

export default matchService;
