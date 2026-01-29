/**
 * @fileoverview Contexto de Autenticación (Wrapper sobre Zustand)
 * @description Provee compatibilidad con componentes existentes que usan useAuth
 * @module context/AuthContext
 */

import PropTypes from 'prop-types';
import { createContext, useEffect, useRef } from 'react';
import useAuthStore from '../stores/authStore';

const AuthContext = createContext(null);

/**
 * Custom hook to access authentication context
 * Acts as wrapper over Zustand store for compatibility
 * @returns {Object} Authentication context
 */
export const useAuth = () => {
  // Use Zustand store directly
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);
  const initializing = useAuthStore((state) => state.initializing);
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const logout = useAuthStore((state) => state.logout);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const clearError = useAuthStore((state) => state.clearError);
  const refreshUser = useAuthStore((state) => state.refreshUser);
  
  // Derived state
  const isAuthenticated = !!user;
  
  return {
    user,
    loading,
    error,
    isAuthenticated,
    initializing,
    login,
    register,
    logout,
    updateProfile,
    clearError,
    refreshUser,
  };
};

/**
 * Authentication context provider
 * Initializes the store and provides compatibility with the previous system
 */
export const AuthProvider = ({ children }) => {
  const hasCheckedAuth = useRef(false);
  const initAuth = useAuthStore((state) => state.initAuth);

  // Initialize authentication on mount
  useEffect(() => {
    if (hasCheckedAuth.current) return;
    hasCheckedAuth.current = true;
    initAuth();
  }, [initAuth]);

  // The context value is just a marker to verify the provider
  return (
    <AuthContext.Provider value={true}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export default AuthContext;
