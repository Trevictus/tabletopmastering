/**
 * @fileoverview Group Store with Zustand
 * @description Global state management for groups
 * @module stores/groupStore
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import groupService from '../services/groupService';
import { STORAGE_KEYS } from '../constants/auth';

/**
 * Group store with Zustand
 * 
 * Provides:
 * - List of user's groups
 * - Currently selected group
 * - Group CRUD methods
 */
const useGroupStore = create(
  devtools(
    (set, get) => ({
      // State
      selectedGroup: null,
      groups: [],
      loading: false,
      error: null,

      /**
       * Loads authenticated user's groups
       */
      loadGroups: async () => {
        set({ loading: true, error: null });
        try {
          const response = await groupService.getMyGroups();
          const groups = response.data || [];
          set({ groups, loading: false });
          
          // If there's a saved group in sessionStorage, try to select it
          const savedGroupId = sessionStorage.getItem(STORAGE_KEYS.SELECTED_GROUP);
          if (savedGroupId && groups.length > 0) {
            const savedGroup = groups.find(g => g._id === savedGroupId);
            if (savedGroup) {
              set({ selectedGroup: savedGroup });
            }
          }
          
          return groups;
        } catch (err) {
          // Only show error if not a canceled request
          if (err.name !== 'CanceledError') {
            set({ error: err.response?.data?.message || 'Failed to load groups', loading: false });
          }
          return [];
        }
      },

      /**
       * Selects a group as active
       */
      selectGroup: (group) => {
        set({ selectedGroup: group });
        // Save to sessionStorage for tab persistence
        if (group) {
          sessionStorage.setItem(STORAGE_KEYS.SELECTED_GROUP, group._id);
        } else {
          sessionStorage.removeItem(STORAGE_KEYS.SELECTED_GROUP);
        }
      },

      /**
       * Creates a new group
       */
      createGroup: async (groupData) => {
        set({ loading: true, error: null });
        try {
          const response = await groupService.createGroup(groupData);
          const newGroup = response.data;
          
          // Add new group to list
          set((state) => ({ 
            groups: [...state.groups, newGroup],
            selectedGroup: newGroup,
            loading: false 
          }));
          
          // Save as selected group
          if (newGroup?._id) {
            sessionStorage.setItem(STORAGE_KEYS.SELECTED_GROUP, newGroup._id);
          }
          
          return response;
        } catch (err) {
          const errorMessage = err.response?.data?.message || 'Failed to create group';
          set({ error: errorMessage, loading: false });
          throw new Error(errorMessage);
        }
      },

      /**
       * Joins user to a group via invite code
       */
      joinGroup: async (inviteCode) => {
        set({ loading: true, error: null });
        try {
          const response = await groupService.joinGroup(inviteCode);
          // Reload groups after joining
          await get().loadGroups();
          set({ loading: false });
          return response;
        } catch (err) {
          const errorMessage = err.response?.data?.message || 'Failed to join group';
          set({ error: errorMessage, loading: false });
          throw new Error(errorMessage);
        }
      },

      /**
       * Updates an existing group
       */
      updateGroup: async (groupId, groupData) => {
        set({ loading: true, error: null });
        try {
          const response = await groupService.updateGroup(groupId, groupData);
          const updatedGroup = response.data;
          
          // Update group in list
          set((state) => ({
            groups: state.groups.map(g => g._id === groupId ? updatedGroup : g),
            selectedGroup: state.selectedGroup?._id === groupId ? updatedGroup : state.selectedGroup,
            loading: false
          }));
          
          return response;
        } catch (err) {
          const errorMessage = err.response?.data?.message || 'Failed to update group';
          set({ error: errorMessage, loading: false });
          throw new Error(errorMessage);
        }
      },

      /**
       * Deletes a group
       */
      deleteGroup: async (groupId) => {
        set({ loading: true, error: null });
        try {
          await groupService.deleteGroup(groupId);
          
          // Remove the group from the list
          set((state) => ({
            groups: state.groups.filter(g => g._id !== groupId),
            selectedGroup: state.selectedGroup?._id === groupId ? null : state.selectedGroup,
            loading: false
          }));
          
          // Clear sessionStorage if it was the selected group
          const savedGroupId = sessionStorage.getItem(STORAGE_KEYS.SELECTED_GROUP);
          if (savedGroupId === groupId) {
            sessionStorage.removeItem(STORAGE_KEYS.SELECTED_GROUP);
          }
        } catch (err) {
          const errorMessage = err.response?.data?.message || 'Failed to delete group';
          set({ error: errorMessage, loading: false });
          throw new Error(errorMessage);
        }
      },

      /**
       * Leaves a group
       */
      leaveGroup: async (groupId) => {
        set({ loading: true, error: null });
        try {
          await groupService.leaveGroup(groupId);
          
          // Remove the group from the list
          set((state) => ({
            groups: state.groups.filter(g => g._id !== groupId),
            selectedGroup: state.selectedGroup?._id === groupId ? null : state.selectedGroup,
            loading: false
          }));
          
          // Clear sessionStorage if it was the selected group
          const savedGroupId = sessionStorage.getItem(STORAGE_KEYS.SELECTED_GROUP);
          if (savedGroupId === groupId) {
            sessionStorage.removeItem(STORAGE_KEYS.SELECTED_GROUP);
          }
        } catch (err) {
          const errorMessage = err.response?.data?.message || 'Failed to leave group';
          set({ error: errorMessage, loading: false });
          throw new Error(errorMessage);
        }
      },

      /**
       * Gets a group by ID
       */
      getGroupById: async (groupId) => {
        try {
          const response = await groupService.getGroupById(groupId);
          return response.data;
        } catch (_err) {
          return null;
        }
      },

      /**
       * Clears the error
       */
      clearError: () => set({ error: null }),

      /**
       * Resets the store (useful on logout)
       */
      reset: () => set({ 
        selectedGroup: null, 
        groups: [], 
        loading: false, 
        error: null 
      }),
    }),
    { name: 'group-store' }
  )
);

export default useGroupStore;
