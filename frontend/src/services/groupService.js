/**
 * @fileoverview Group Service
 * @description CRUD operations for groups, members and invitations
 * @module services/groupService
 */

import api from './api';

const groupService = {
  getMyGroups: () => api.get('/groups').then(r => r.data),
  
  getGroupById: (groupId) => api.get(`/groups/public/${groupId}`).then(r => r.data),
  
  createGroup: (groupData) => api.post('/groups', groupData).then(r => r.data),
  
  joinGroup: (inviteCode) => api.post('/groups/join', { inviteCode }).then(r => r.data),
  
  getGroupMembers: (groupId) => api.get(`/groups/${groupId}/members`).then(r => r.data),
  
  updateGroup: (groupId, groupData) => api.put(`/groups/${groupId}`, groupData).then(r => r.data),
  
  deleteGroup: (groupId) => api.delete(`/groups/${groupId}`).then(r => r.data),
  
  leaveGroup: (groupId) => api.delete(`/groups/${groupId}/leave`).then(r => r.data),
  
  removeMember: (groupId, userId) => api.delete(`/groups/${groupId}/members/${userId}`).then(r => r.data),
  
  inviteUserToGroup: (groupId, email) => api.post(`/groups/${groupId}/invite`, { email }).then(r => r.data),
};

export default groupService;
