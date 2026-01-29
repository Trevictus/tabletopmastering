/**
 * @fileoverview Authentication Constants
 * @description Storage keys, error messages and auth configuration
 * @module constants/auth
 */

/**
 * Constants and configurations for the authentication system
 */

/**
 * sessionStorage keys for authentication
 * IMPORTANT: We use sessionStorage (not localStorage) to isolate sessions per tab
 * This allows different users to use different tabs of the same browser
 */
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  SELECTED_GROUP: 'selectedGroupId',
};

/**
 * Standardized error messages
 */
export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Credenciales inválidas',
  NETWORK_ERROR: 'Error de conexión. Verifica tu conexión a internet',
  UNAUTHORIZED: 'No tienes autorización para realizar esta acción',
  SESSION_EXPIRED: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente',
  USER_NOT_FOUND: 'Usuario no encontrado',
  INVALID_TOKEN: 'Token inválido o expirado',
  REGISTER_FAILED: 'Error al registrar usuario',
  LOGIN_FAILED: 'Error al iniciar sesión',
  PROFILE_UPDATE_FAILED: 'Error al actualizar perfil',
  GENERIC_ERROR: 'Ha ocurrido un error. Intenta nuevamente',
};

/**
 * Success messages
 */
export const AUTH_SUCCESS = {
  LOGIN: 'Sesión iniciada correctamente',
  REGISTER: 'Registro exitoso. ¡Bienvenido!',
  LOGOUT: 'Sesión cerrada correctamente',
  PROFILE_UPDATED: 'Perfil actualizado correctamente',
};

/**
 * Authentication routes
 */
export const AUTH_ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/home',
  PROFILE: '/profile',
  HOME: '/',
};

/**
 * Token validation timeout configuration
 */
export const AUTH_CONFIG = {
  TOKEN_VALIDATION_TIMEOUT: 5000, // 5 seconds
  RETRY_ATTEMPTS: 3,
};

/**
 * Available user roles
 */
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  MODERATOR: 'moderator',
};

export default {
  STORAGE_KEYS,
  AUTH_ERRORS,
  AUTH_SUCCESS,
  AUTH_ROUTES,
  AUTH_CONFIG,
  USER_ROLES,
};

