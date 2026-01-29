/**
 * @fileoverview API Hook
 * @description Custom hook for HTTP requests with state, cache and error handling
 * @module hooks/useApi
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { formatError, logError } from '../services/apiErrorHandler';
import { useToast } from '../context/ToastContext';

/**
 * Custom hook for handling API requests
 * 
 * Provides:
 * - Loading/error/data state
 * - Automatic error handling with toasts
 * - Automatic cancellation on unmount
 * - Manual retry
 * - Optional cache
 * 
 * @param {Function} apiFunction - Function that returns an Axios promise
 * @param {Object} options - Configuration options
 * @returns {Object} Request state and functions
 * 
 * @example
 * const { data, loading, error, execute, retry } = useApi(
 *   () => gameService.getGames({ page: 1 }),
 *   { immediate: true, showErrorToast: true }
 * );
 */
const useApi = (apiFunction, options = {}) => {
  const {
    immediate = false,
    onSuccess = null,
    onError = null,
    initialData = null,
    cache = false,
    logErrors = true,
    showErrorToast = true,
    showSuccessToast = false,
    successMessage = 'Operación exitosa',
  } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const [executionCount, setExecutionCount] = useState(0);

  const abortControllerRef = useRef(null);
  const cacheRef = useRef(null);
  const isMountedRef = useRef(true);
  const toast = useToast();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  /**
   * Ejecuta la petición a la API
   */
  const execute = useCallback(
    async (...args) => {
      try {
        // Cancelar petición anterior si existe
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        // Crear nuevo AbortController
        abortControllerRef.current = new AbortController();

        // Verificar cache
        if (cache && cacheRef.current) {
          setData(cacheRef.current);
          return cacheRef.current;
        }

        // Start loading
        if (isMountedRef.current) {
          setLoading(true);
          setError(null);
        }

        // Execute API function
        const response = await apiFunction(...args, {
          signal: abortControllerRef.current.signal,
        });

        // Update state only if component is still mounted
        if (isMountedRef.current) {
          const responseData = response.data;
          setData(responseData);
          setLoading(false);
          setExecutionCount(prev => prev + 1);

          // Save in cache if enabled
          if (cache) {
            cacheRef.current = responseData;
          }

          // Show success toast if enabled
          if (showSuccessToast) {
            toast.success(
              typeof successMessage === 'function' 
                ? successMessage(responseData) 
                : successMessage
            );
          }

          // Success callback
          if (onSuccess) {
            onSuccess(responseData);
          }

          return responseData;
        }
      } catch (err) {
        // Ignore cancellation errors
        if (err.name === 'AbortError' || err.message?.includes('cancel')) {
          return;
        }

        if (isMountedRef.current) {
          const formattedError = formatError(err);
          setError(formattedError);
          setLoading(false);

          // Logging
          if (logErrors) {
            logError(err, apiFunction.name || 'useApi');
          }

          // Show error toast if enabled
          if (showErrorToast) {
            toast.error(formattedError.userMessage, {
              title: formattedError.type === 'VALIDATION' 
                ? 'Error de validación' 
                : 'Error',
            });
          }

          // Error callback
          if (onError) {
            onError(formattedError);
          }

          throw formattedError;
        }
      }
    },
    [apiFunction, cache, onSuccess, onError, logErrors, showErrorToast, showSuccessToast, successMessage, toast]
  );

  /**
   * Retry the last request
   */
  const retry = useCallback(() => {
    return execute();
  }, [execute]);

  /**
   * Clear the state
   */
  const reset = useCallback(() => {
    setData(initialData);
    setError(null);
    setLoading(false);
    cacheRef.current = null;
  }, [initialData]);

  /**
   * Invalidate cache
   */
  const invalidateCache = useCallback(() => {
    cacheRef.current = null;
  }, []);

  // Execute immediately if immediate === true
  useEffect(() => {
    if (immediate) {
      execute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  return {
    data,
    loading,
    error,
    execute,
    retry,
    reset,
    invalidateCache,
    executionCount,
    isSuccess: !loading && !error && data !== null,
    isError: !loading && error !== null,
    isIdle: !loading && !error && data === null,
  };
};

export default useApi;
