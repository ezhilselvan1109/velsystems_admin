import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/auth';
import { User } from '../types/auth';
import Cookies from 'js-cookie';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  refetch: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading,
    refetch,
    error,
  } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authService.me,
    retry: (failureCount, error: any) => {
      // Don't retry if it's a 401 (unauthorized) error
      if (error?.message?.includes('401') || error?.status === 401) {
        return false;
      }
      return failureCount < 1;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const login = useCallback((userData: User) => {
    queryClient.setQueryData(['auth', 'me'], userData);
  }, [queryClient]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear auth token cookie
      Cookies.remove('AUTH-TOKEN');
      // Clear all cached data
      queryClient.setQueryData(['auth', 'me'], null);
      queryClient.clear();
      // Redirect to login
      window.location.href = '/login';
    }
  }, [queryClient]);

  // If there's an auth error, clear the user data
  React.useEffect(() => {
    if (error) {
      queryClient.setQueryData(['auth', 'me'], null);
    }
  }, [error, queryClient]);

  const contextValue = useMemo(() => ({
    user: user || null,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refetch,
  }), [user, isLoading, login, logout, refetch]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};