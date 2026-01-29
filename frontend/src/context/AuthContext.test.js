/**
 * Sample tests for the authentication system
 *
 * To run these tests:
 * 1. Install dependencies: npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
 * 2. Run: npm test
 */

import { render, screen, waitFor } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import authService from '../services/authService';

// Mock of authService
jest.mock('../services/authService');

describe('AuthContext', () => {

  beforeEach(() => {
    // Clear sessionStorage before each test (we use sessionStorage for tab isolation)
    sessionStorage.clear();
    // Clear mocks
    jest.clearAllMocks();
  });

  describe('useAuth hook', () => {

    test('debe lanzar error si se usa fuera del AuthProvider', () => {
      // Suprimir error de consola en el test
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth debe ser usado dentro de un AuthProvider');

      consoleError.mockRestore();
    });

    test('debe proporcionar valores iniciales correctos', async () => {
      authService.isAuthenticated.mockReturnValue(false);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Login', () => {

    test('debe autenticar usuario correctamente', async () => {
      const mockUser = { id: 1, name: 'Test User', email: 'test@example.com' };
      const mockToken = 'mock-token-123';

      authService.isAuthenticated.mockReturnValue(false);
      authService.login.mockResolvedValue({
        data: {
          user: mockUser,
          token: mockToken
        }
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password123'
        });
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.error).toBeNull();
      expect(authService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });

    test('debe manejar errores de login', async () => {
      const errorMessage = 'Credenciales inválidas';

      authService.isAuthenticated.mockReturnValue(false);
      authService.login.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.login({
            email: 'wrong@example.com',
            password: 'wrongpass'
          });
        } catch {
          // Esperamos que lance error
        }
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('Logout', () => {

    test('debe cerrar sesión correctamente', async () => {
      const mockUser = { id: 1, name: 'Test User', email: 'test@example.com' };

      authService.isAuthenticated.mockReturnValue(true);
      authService.getProfile.mockResolvedValue({ user: mockUser });
      authService.logout.mockImplementation(() => {});

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      // Esperar a que cargue el usuario
      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      // Hacer logout
      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(authService.logout).toHaveBeenCalled();
    });
  });

  describe('Register', () => {

    test('debe registrar usuario correctamente', async () => {
      const newUser = {
        name: 'New User',
        email: 'new@example.com',
        password: 'password123'
      };
      const mockResponse = {
        data: {
          user: { id: 2, name: newUser.name, email: newUser.email },
          token: 'new-token-456'
        }
      };

      authService.isAuthenticated.mockReturnValue(false);
      authService.register.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.register(newUser);
      });

      expect(result.current.user).toEqual(mockResponse.data.user);
      expect(result.current.isAuthenticated).toBe(true);
      expect(authService.register).toHaveBeenCalledWith(newUser);
    });
  });

  describe('Update Profile', () => {

    test('debe actualizar perfil correctamente', async () => {
      const initialUser = { id: 1, name: 'Old Name', email: 'test@example.com' };
      const updatedUser = { id: 1, name: 'New Name', email: 'test@example.com' };

      authService.isAuthenticated.mockReturnValue(true);
      authService.getProfile.mockResolvedValue({ user: initialUser });
      authService.updateProfile.mockResolvedValue({ user: updatedUser });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(initialUser);
      });

      await act(async () => {
        await result.current.updateProfile({ name: 'New Name' });
      });

      expect(result.current.user).toEqual(updatedUser);
      expect(authService.updateProfile).toHaveBeenCalledWith({ name: 'New Name' });
    });
  });

  describe('Token Validation', () => {

    test('debe validar token al montar el componente', async () => {
      const mockUser = { id: 1, name: 'Test User', email: 'test@example.com' };

      authService.isAuthenticated.mockReturnValue(true);
      authService.getProfile.mockResolvedValue({ user: mockUser });
      authService.syncUserData.mockImplementation(() => {});

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(authService.getProfile).toHaveBeenCalled();
      expect(authService.syncUserData).toHaveBeenCalledWith(mockUser);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    test('debe limpiar datos si el token es inválido', async () => {
      authService.isAuthenticated.mockReturnValue(true);
      authService.getProfile.mockRejectedValue(new Error('Token inválido'));
      authService.logout.mockImplementation(() => {});

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(authService.logout).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Error Handling', () => {

    test('debe limpiar errores con clearError', async () => {
      authService.isAuthenticated.mockReturnValue(false);
      authService.login.mockRejectedValue(new Error('Test error'));

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Generate an error
      await act(async () => {
        try {
          await result.current.login({ email: 'test', password: 'test' });
        } catch {
          // Esperado
        }
      });

      expect(result.current.error).toBeTruthy();

      // Clear error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});

/**
 * Integration test with component
 */
describe('AuthContext Integration', () => {

  test('debe renderizar componente con usuario autenticado', async () => {
    const mockUser = { id: 1, name: 'Test User', email: 'test@example.com' };

    authService.isAuthenticated.mockReturnValue(true);
    authService.getProfile.mockResolvedValue({ user: mockUser });

    const TestComponent = () => {
      const { user, isAuthenticated, loading } = useAuth();

      if (loading) return <div>Loading...</div>;

      return (
        <div>
          {isAuthenticated ? (
            <h1>Hello {user.name}</h1>
          ) : (
            <h1>Not authenticated</h1>
          )}
        </div>
      );
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Esperar a que termine de cargar
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Hello Test User')).toBeInTheDocument();
  });
});

