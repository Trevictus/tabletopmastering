/**
 * @fileoverview Ranking Service
 * @description Gets global and group rankings
 * @module services/rankingService
 */

import api from './api';

const rankingService = {
  getGlobalRanking: async () => {
    const response = await api.get('/matches/ranking/global');
    return response.data;
  },

  getGroupRanking: async (groupId) => {
    const response = await api.get(`/matches/ranking/group/${groupId}`);
    return response.data;
  },
};

export default rankingService;
