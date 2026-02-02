/**
 * @fileoverview Authentication Store with Zustand
 * @description Global authentication state management
 * @module stores/authStore
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import authService from '../services/authService';
import { STORAGE_KEYS } from '../constants/auth';

/**
 * Gets initial user from sessionStorage safely
 */
const getInitialUser = () => {
  try {
    const storedUser = sessionStorage.getItem(STORAGE_KEYS.USER);
    const storedToken = sessionStorage.getItem(STORAGE_KEYS.TOKEN);
    if (storedUser && storedToken) {
      return JSON.parse(storedUser);
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Checks if token exists in sessionStorage
 */
const hasStoredToken = () => {
  return !!sessionStorage.getItem(STORAGE_KEYS.TOKEN);
};

/**
 * Authentication store with Zustand
 * 
 * Provides:
 * - Authenticated user state
 * - Login, register, logout methods
 * - Profile update
 * - Session validation
 */
const useAuthStore = create(
  devtools(
    (set, get) => ({
      // State
      user: getInitialUser(),
      loading: false,
      error: null,
      initializing: hasStoredToken(),
      
      // Derived state (getter)
      get isAuthenticated() {
        return !!get().user;
      },

      /**
       * Initializes authentication by validating token with backend
       */
      initAuth: async () => {
        const token = sessionStorage.getItem(STORAGE_KEYS.TOKEN);
        
        if (!token) {
          set({ user: null, initializing: false });
          return;
        }

        try {
          const { user: currentUser } = await authService.getProfile();
          if (currentUser) {
            set({ user: currentUser });
            authService.syncUserData(currentUser);
          }
        } catch (err) {
          // Only logout if token is explicitly invalid
          if (err.response?.status === 401) {
            authService.logout();
            set({ 
              user: null, 
              error: 'Your session has expired. Please log in again.' 
            });
          }
          // On network error, keep local session
        } finally {
          set({ initializing: false });
        }
      },

      /**
       * Logs in with credentials
       */
      login: async (credentials) => {
        set({ loading: true, error: null });
        try {
          const data = await authService.login(credentials);
          
          if (data.data?.user) {
            set({ user: data.data.user, loading: false });
            return data;
          }
          throw new Error('Invalid login response');
        } catch (err) {
          const errorMessage = err.response?.data?.message || err.message || 'Error logging in';
          set({ error: errorMessage, loading: false });
          throw new Error(errorMessage);
        }
      },

      /**
       * Registers a new user
       */
      register: async (userData) => {
        set({ loading: true, error: null });
        try {
          const data = await authService.register(userData);
          
          if (data.data?.user) {
            set({ user: data.data.user, loading: false });
            return data;
          }
          throw new Error('Invalid register response');
        } catch (err) {
          const errorMessage = err.response?.data?.message || err.message || 'Error registering';
          set({ error: errorMessage, loading: false });
          throw new Error(errorMessage);
        }
      },

      /**
       * Logs out the user
       */
      logout: () => {
        authService.logout();
        set({ user: null, error: null });
      },

      /**
       * Updates the user profile
       */
      updateProfile: async (profileData) => {
        set({ loading: true, error: null });
        try {
          const data = await authService.updateProfile(profileData);
          
          if (data.user) {
            set({ user: data.user, loading: false });
            return data;
          }
          throw new Error('Invalid update response');
        } catch (err) {
          const errorMessage = err.response?.data?.message || err.message || 'Error updating profile';
          set({ error: errorMessage, loading: false });
          throw new Error(errorMessage);
        }
      },

      /**
       * Refreshes user data from the backend
       */
      refreshUser: async () => {
        try {
          const { user: updatedUser } = await authService.getProfile();
          if (updatedUser) {
            set({ user: updatedUser });
            authService.syncUserData(updatedUser);
          }
          return updatedUser;
        } catch {
          return null;
        }
      },

      /**
       * Clears error messages
       */
      clearError: () => set({ error: null }),

      /**
       * Sets the user manually (useful for external updates)
       */
      setUser: (user) => set({ user }),
    }),
    { name: 'auth-store' }
  )
);

export default useAuthStore;
