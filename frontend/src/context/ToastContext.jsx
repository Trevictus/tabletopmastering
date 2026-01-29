/**
 * @fileoverview Contexto de Notificaciones Toast (Wrapper sobre Zustand)
 * @description Provee compatibilidad con componentes existentes que usan useToast
 * @module context/ToastContext
 */

import { createContext } from 'react';
import PropTypes from 'prop-types';
import useToastStore, { ToastTypes } from '../stores/toastStore';

const ToastContext = createContext(null);

// Re-exportar tipos para compatibilidad
export { ToastTypes };

/**
 * Hook to access toast context
 * Acts as wrapper over Zustand store for compatibility
 */
export const useToast = () => {
  // Use Zustand store directly
  const toasts = useToastStore((state) => state.toasts);
  const success = useToastStore((state) => state.success);
  const error = useToastStore((state) => state.error);
  const warning = useToastStore((state) => state.warning);
  const info = useToastStore((state) => state.info);
  const promise = useToastStore((state) => state.promise);
  const removeToast = useToastStore((state) => state.removeToast);
  const clearAll = useToastStore((state) => state.clearAll);
  
  return {
    toasts,
    success,
    error,
    warning,
    info,
    promise,
    remove: removeToast,
    clearAll,
  };
};

/**
 * Toast context provider
 * Maintains compatibility with the previous system
 */
export const ToastProvider = ({ children }) => {
  // The context value is just a marker to verify the provider
  return (
    <ToastContext.Provider value={true}>
      {children}
    </ToastContext.Provider>
  );
};

ToastProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ToastContext;
