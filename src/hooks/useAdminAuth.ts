import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface User {
  email: string;
  role: string;
  // Add other user properties as needed
}

export function useAdminAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check if user is authenticated
  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/auth/verify', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Not authenticated');
      }

      const data = await response.json();
      setUser(data.user);
      return { isAuthenticated: true, user: data.user };
    } catch (error) {
      console.log('error', error);
      setUser(null);
      return { isAuthenticated: false, user: null };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Login function
  const login = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      setUser(data.user);
      toast.success('Login successful');
      return data.user;
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error instanceof Error ? error.message : 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      setUser(null);
      toast.success('Logged out successfully');
      router.push('/command-center/sign-in');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Check auth status on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    checkAuth,
  };
}
