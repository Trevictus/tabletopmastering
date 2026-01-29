/**
 * @fileoverview Toast Notification Store with Zustand
 * @description Global toast notification system
 * @module stores/toastStore
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Available toast types
 */
export const ToastTypes = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

/**
 * Default duration by type
 */
const DEFAULT_DURATIONS = {
  [ToastTypes.SUCCESS]: 3000,
  [ToastTypes.ERROR]: 5000,
  [ToastTypes.WARNING]: 4000,
  [ToastTypes.INFO]: 3000,
};

/**
 * Toast store with Zustand
 * 
 * Provides:
 * - List of active toasts
 * - Methods to add/remove toasts
 * - Shortcuts for success, error, warning, info
 */
const useToastStore = create(
  devtools(
    (set, get) => ({
      // State
      toasts: [],

      /**
       * Adds a new toast
       */
      addToast: (toast) => {
        const id = Date.now() + Math.random();
        const duration = toast.duration ?? DEFAULT_DURATIONS[toast.type];

        const newToast = {
          id,
          type: toast.type || ToastTypes.INFO,
          title: toast.title,
          message: toast.message,
          duration,
          action: toast.action,
        };

        set((state) => ({ toasts: [...state.toasts, newToast] }));

        // Auto-remove after duration
        if (duration > 0) {
          setTimeout(() => {
            get().removeToast(id);
          }, duration);
        }

        return id;
      },

      /**
       * Removes a toast by ID
       */
      removeToast: (id) => {
        set((state) => ({ 
          toasts: state.toasts.filter((toast) => toast.id !== id) 
        }));
      },

      /**
       * Remueve todos los toasts
       */
      clearAll: () => set({ toasts: [] }),

      /**
       * Muestra un toast de éxito
       */
      success: (message, options = {}) => {
        return get().addToast({
          type: ToastTypes.SUCCESS,
          title: options.title || 'Éxito',
          message,
          ...options,
        });
      },

      /**
       * Muestra un toast de error
       */
      error: (message, options = {}) => {
        return get().addToast({
          type: ToastTypes.ERROR,
          title: options.title || 'Error',
          message,
          ...options,
        });
      },

      /**
       * Muestra un toast de advertencia
       */
      warning: (message, options = {}) => {
        return get().addToast({
          type: ToastTypes.WARNING,
          title: options.title || 'Advertencia',
          message,
          ...options,
        });
      },

      /**
       * Muestra un toast de información
       */
      info: (message, options = {}) => {
        return get().addToast({
          type: ToastTypes.INFO,
          title: options.title || 'Información',
          message,
          ...options,
        });
      },

      /**
       * Muestra un toast de promesa
       * Útil para operaciones asíncronas
       */
      promise: async (
        promiseFn,
        {
          loading = 'Cargando...',
          success: successMsg = 'Operación exitosa',
          error: errorMsg = 'Ocurrió un error',
        } = {}
      ) => {
        const { info, removeToast, success, error } = get();
        const loadingId = info(loading, { duration: 0 });

        try {
          const result = await promiseFn;
          removeToast(loadingId);
          success(typeof successMsg === 'function' ? successMsg(result) : successMsg);
          return result;
        } catch (err) {
          removeToast(loadingId);
          error(typeof errorMsg === 'function' ? errorMsg(err) : errorMsg);
          throw err;
        }
      },
    }),
    { name: 'toast-store' }
  )
);

export default useToastStore;
