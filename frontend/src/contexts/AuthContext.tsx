import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import { User, AuthContextType, RegisterFormData, ProfileFormData } from '../types';
import apiService from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'CLEAR_ERROR' };

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: false,
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
        error: null,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isLoading: false,
        error: null,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
        isLoading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');

      if (token && userStr) {
        try {
          dispatch({ type: 'SET_LOADING', payload: true });
          const user = JSON.parse(userStr);
          dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
          
          // Verify token is still valid in the background
          // Don't block the UI if verification fails
          apiService.getProfile().catch((error) => {
            // Only clear storage if it's a 401 error (unauthorized)
            if (error.response?.status === 401) {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              dispatch({ type: 'LOGOUT' });
            }
          });
        } catch (error) {
          // Only clear storage if JSON parsing fails
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } else {
        // No token found, ensure loading is false
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await apiService.login({ email, password });
      
      // Store in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: { 
          user: response.data.user, 
          token: response.data.token 
        } 
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  const register = useCallback(async (data: RegisterFormData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await apiService.register(data);
      
      // Store in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: { 
          user: response.data.user, 
          token: response.data.token 
        } 
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch({ type: 'LOGOUT' });
  }, []);

  const updateProfile = useCallback(async (data: ProfileFormData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await apiService.updateProfile(data);
      
      // Update localStorage
      const updatedUser = response.data;
      localStorage.setItem('user', JSON.stringify(updatedUser));

      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Profile update failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  const contextValue = useMemo<AuthContextType>(() => ({
    user: state.user,
    token: state.token,
    login,
    register,
    logout,
    updateProfile,
    isLoading: state.isLoading,
    error: state.error,
  }), [state.user, state.token, state.isLoading, state.error, login, register, logout, updateProfile]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
