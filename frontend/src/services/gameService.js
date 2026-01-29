/**
 * @fileoverview Game Service
 * @description Game CRUD operations and BGG integration
 * @module services/gameService
 */

import api from './api';

const gameService = {
  // Search games in BoardGameGeek
  searchBGG: async (query) => {
    const response = await api.get('/games/search-bgg', {
      params: { query },
    });
    return response.data;
  },

  // Get BGG game details
  getBGGDetails: async (bggId) => {
    const response = await api.get(`/games/bgg/${bggId}`);
    return response.data;
  },

  // Get list of popular BGG games
  getBGGHotList: async () => {
    const response = await api.get('/games/bgg/hot');
    return response.data;
  },

  // Add game from BGG
  addFromBGG: async (bggId, groupId, notes) => {
    const response = await api.post('/games/add-from-bgg', {
      bggId,
      groupId,
      notes,
    });
    return response.data;
  },

  // Create custom game
  createCustomGame: async (gameData) => {
    const response = await api.post('/games', gameData);
    return response.data;
  },

  // Get games list with filters
  getGames: async (params = {}) => {
    const response = await api.get('/games', { params });
    return response.data;
  },

  // Get game details
  getGameById: async (gameId) => {
    const response = await api.get(`/games/${gameId}`);
    return response.data;
  },

  // Update game
  updateGame: async (gameId, gameData) => {
    const response = await api.put(`/games/${gameId}`, gameData);
    return response.data;
  },

  // Sync game with BGG
  syncWithBGG: async (gameId) => {
    const response = await api.put(`/games/${gameId}/sync-bgg`);
    return response.data;
  },

  // Delete game
  deleteGame: async (gameId) => {
    const response = await api.delete(`/games/${gameId}`);
    return response.data;
  },

  // Get group game statistics
  getGroupStats: async (groupId) => {
    const response = await api.get(`/games/stats/${groupId}`);
    return response.data;
  },

  // Upload game image
  uploadGameImage: async (gameId, imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await api.post(`/games/${gameId}/upload-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default gameService;
