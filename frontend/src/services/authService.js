/**
 * @fileoverview Authentication Service
 * @description Registration, login, logout and session management operations
 * @module services/authService
 */

import api from './api';
import { STORAGE_KEYS } from '../constants/auth';

/**
 * Authentication service
 * Manages all authentication-related operations and user persistence
 * 
 * IMPORTANT: We use sessionStorage instead of localStorage to isolate sessions per tab.
 * This allows different users to log in on different tabs of the same browser.
 */
const authService = {
  /**
   * Registers a new user
   * @param {Object} userData - User data (name, email, password)
   * @returns {Promise<Object>} User data and token
   */
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.data?.token && response.data.data?.user) {
      sessionStorage.setItem(STORAGE_KEYS.TOKEN, response.data.data.token);
      sessionStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  /**
   * Logs in a user
   * @param {Object} credentials - Email and password
   * @returns {Promise<Object>} User data and token
   */
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.data?.token && response.data.data?.user) {
      sessionStorage.setItem(STORAGE_KEYS.TOKEN, response.data.data.token);
      sessionStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  /**
   * Logs out the user
   * Clears token and user data from sessionStorage
   */
  logout: () => {
    sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.USER);
    sessionStorage.removeItem(STORAGE_KEYS.SELECTED_GROUP);
  },

  /**
   * Gets the authenticated user's profile from the backend
   * Validates that the token is valid
   * @returns {Promise<Object>} Updated user data
   */
  getProfile: async () => {
    const response = await api.get('/auth/me');
    // Backend returns { success, data: user }
    const user = response.data.data || response.data.user;
    if (user) {
      sessionStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    }
    return { user };
  },

  /**
   * Updates the user's profile
   * @param {Object} profileData - Data to update
   * @returns {Promise<Object>} Updated user
   */
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    // Backend returns { success, message, data: { user } }
    if (response.data.data?.user) {
      sessionStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.data.data.user));
      return response.data.data; // Return { user }
    }
    return response.data;
  },

  /**
   * Syncs user data in sessionStorage
   * @param {Object} userData - Updated user data
   */
  syncUserData: (userData) => {
    if (userData) {
      sessionStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
    }
  },

  /**
   * Checks if an authentication token exists
   * @returns {boolean} True if token exists
   */
  isAuthenticated: () => {
    const token = sessionStorage.getItem(STORAGE_KEYS.TOKEN);
    return !!token;
  },

  /**
   * Gets the user from sessionStorage
   * NOTE: This data may be outdated, use getProfile() for fresh data
   * @returns {Object|null} User or null
   */
  getCurrentUser: () => {
    try {
      const user = sessionStorage.getItem(STORAGE_KEYS.USER);
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error parsing user from sessionStorage:', error);
      return null;
    }
  },

  /**
   * Gets the current token
   * @returns {string|null} Authentication token
   */
  getToken: () => {
    return sessionStorage.getItem(STORAGE_KEYS.TOKEN);
  },

  /**
   * Checks nickname availability
   * @param {string} nickname - Nickname to check
   * @param {string} userId - Current user ID (to exclude when editing profile)
   * @returns {Promise<Object>} { available, message, suggestions? }
   */
  checkNickname: async (nickname, userId = null) => {
    try {
      const response = await api.post('/auth/check-nickname', { nickname, userId });
      return response.data;
    } catch (error) {
      return {
        available: false,
        message: error.response?.data?.message || 'Error checking',
      };
    }
  },

  /**
   * Checks email availability
   * @param {string} email - Email to check
   * @param {string} userId - Current user ID (to exclude when editing profile)
   * @returns {Promise<Object>} { available, message }
   */
  checkEmail: async (email, userId = null) => {
    try {
      const response = await api.post('/auth/check-email', { email, userId });
      return response.data;
    } catch (error) {
      return {
        available: false,
        message: error.response?.data?.message || 'Error checking',
      };
    }
  },

  /**
   * Export all user data (GDPR)
   * @returns {Promise<Object>} Exported user data
   */
  exportUserData: async () => {
    const response = await api.get('/auth/export-data');
    return response.data;
  },

  /**
   * Delete account and all data (GDPR)
   * @param {string} password - Password for confirmation
   * @returns {Promise<Object>} Deletion result
   */
  deleteAccount: async (password) => {
    const response = await api.delete('/auth/delete-account', { data: { password } });
    return response.data;
  },
};

export default authService;
