/**
 * Centralized entry point for authentication system
 * Exports all necessary elements to use authentication in the app
 *
 * @example
 * // Import everything needed from a single place
 * import { useAuth, AuthProvider, AUTH_ROUTES, STORAGE_KEYS } from './auth';
 */

// Context and Hooks
export { useAuth, AuthProvider } from './context/AuthContext';
export { useAuthValidation } from './hooks/useAuthValidation';

// Services
export { default as authService } from './services/authService';
export { default as api } from './services/api';

// Constants
export {
  STORAGE_KEYS,
  AUTH_ERRORS,
  AUTH_SUCCESS,
  AUTH_ROUTES,
  AUTH_CONFIG,
  USER_ROLES,
} from './constants/auth';

// Utility components (if they exist)
// export { default as ProtectedRoute } from './components/routes/ProtectedRoute';
// export { default as PublicRoute } from './components/routes/PublicRoute';
// export { default as UserInfo } from './components/common/UserInfo';

