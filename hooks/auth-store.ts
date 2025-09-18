import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState, useCallback, useMemo } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { AuthState, User, LoginCredentials, RegisterCredentials, AuthResponse, ApiError } from '@/types/auth';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// Mock API base URL - replace with your actual backend URL
const API_BASE_URL = 'https://your-backend-api.com/api';

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
};

// Secure storage wrapper for web compatibility
const secureStorage = {
  async setItem(key: string, value: string): Promise<void> {
    if (!key?.trim() || !value?.trim()) return;
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },
  
  async getItem(key: string): Promise<string | null> {
    if (!key?.trim()) return null;
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  },
  
  async removeItem(key: string): Promise<void> {
    if (!key?.trim()) return;
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [state, setState] = useState<AuthState>(initialState);

  // Store auth data securely
  const storeAuth = useCallback(async (user: User, token: string) => {
    if (!token?.trim()) return;
    try {
      await Promise.all([
        secureStorage.setItem(TOKEN_KEY, token),
        secureStorage.setItem(USER_KEY, JSON.stringify(user)),
      ]);
    } catch (error) {
      console.error('Error storing auth data:', error);
    }
  }, []);

  // Clear stored auth data
  const clearStoredAuth = useCallback(async () => {
    try {
      await Promise.all([
        secureStorage.removeItem(TOKEN_KEY),
        secureStorage.removeItem(USER_KEY),
      ]);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }, []);

  // API helper function
  const apiCall = useCallback(async (endpoint: string, options: RequestInit = {}): Promise<any> => {
    if (!endpoint?.trim()) throw new Error('Endpoint is required');
    
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    if (state.token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${state.token}`,
      };
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw {
          message: data.message || 'Something went wrong',
          code: data.code,
          field: data.field,
        } as ApiError;
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw {
          message: error.message,
        } as ApiError;
      }
      throw error;
    }
  }, [state.token]);

  // Load stored auth data on app start
  const loadStoredAuth = useCallback(async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        secureStorage.getItem(TOKEN_KEY),
        secureStorage.getItem(USER_KEY),
      ]);

      if (storedToken && storedUser) {
        const user = JSON.parse(storedUser);
        setState({
          user,
          token: storedToken,
          isLoading: false,
          isAuthenticated: true,
        });

        // Verify token is still valid
        try {
          await apiCall('/auth/verify', {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
        } catch {
          // Token is invalid, clear stored data
          await clearStoredAuth();
          setState({
            user: null,
            token: null,
            isLoading: false,
            isAuthenticated: false,
          });
        }
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [apiCall, clearStoredAuth]);

  // Register new user
  const register = useCallback(async (credentials: RegisterCredentials): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Validate passwords match
      if (credentials.password !== credentials.confirmPassword) {
        throw {
          message: 'Heslá sa nezhodujú',
          field: 'confirmPassword',
        } as ApiError;
      }

      // For demo purposes, simulate API call
      // Replace this with actual API call
      const mockResponse: AuthResponse = {
        user: {
          id: Date.now().toString(),
          email: credentials.email,
          name: credentials.name,
          createdAt: new Date().toISOString(),
          isEmailVerified: false,
        },
        token: `mock_token_${Date.now()}`,
      };

      // Simulate network delay
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 1000));

      // In real implementation:
      // const response = await apiCall('/auth/register', {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     email: credentials.email,
      //     password: credentials.password,
      //     name: credentials.name,
      //   }),
      // });

      await storeAuth(mockResponse.user, mockResponse.token);

      setState({
        user: mockResponse.user,
        token: mockResponse.token,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, [storeAuth]);

  // Login user
  const login = useCallback(async (credentials: LoginCredentials): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // For demo purposes, simulate API call
      // Replace this with actual API call
      const mockResponse: AuthResponse = {
        user: {
          id: '1',
          email: credentials.email,
          name: 'Demo User',
          createdAt: new Date().toISOString(),
          isEmailVerified: true,
        },
        token: `mock_token_${Date.now()}`,
      };

      // Simulate network delay
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 1000));

      // In real implementation:
      // const response = await apiCall('/auth/login', {
      //   method: 'POST',
      //   body: JSON.stringify(credentials),
      // });

      await storeAuth(mockResponse.user, mockResponse.token);

      setState({
        user: mockResponse.user,
        token: mockResponse.token,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, [storeAuth]);

  // Logout user
  const logout = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Call logout endpoint if needed
      // await apiCall('/auth/logout', { method: 'POST' });

      await clearStoredAuth();

      setState({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('Error during logout:', error);
      // Still clear local data even if API call fails
      await clearStoredAuth();
      setState({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  }, [clearStoredAuth]);

  // Update user profile
  const updateProfile = useCallback(async (updates: Partial<User>): Promise<void> => {
    if (!state.user) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // In real implementation:
      // const response = await apiCall('/auth/profile', {
      //   method: 'PUT',
      //   body: JSON.stringify(updates),
      // });

      const updatedUser = { ...state.user, ...updates };
      await storeAuth(updatedUser, state.token!);

      setState(prev => ({
        ...prev,
        user: updatedUser,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, [state.user, state.token, storeAuth]);

  // Initialize auth on mount
  useEffect(() => {
    loadStoredAuth();
  }, [loadStoredAuth]);

  return useMemo(() => ({
    ...state,
    register,
    login,
    logout,
    updateProfile,
    apiCall,
  }), [
    state,
    register,
    login,
    logout,
    updateProfile,
    apiCall,
  ]);
}, initialState);