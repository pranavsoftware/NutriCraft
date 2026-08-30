import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

export interface User {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signup: (formData: { name: string; email: string; password: string; confirmPassword?: string }) => Promise<{ success: boolean; message: string; email?: string }>;
  verifyOtp: (email: string, otp: string) => Promise<{ success: boolean; message: string; user?: User }>;
  resendOtp: (email: string, type?: 'signup' | 'forgot-password') => Promise<{ success: boolean; message: string }>;
  login: (formData: { email: string; password: string }) => Promise<{ success: boolean; message: string; user?: User; requiresVerification?: boolean; email?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string; email?: string }>;
  resetPassword: (formData: { email: string; otp: string; newPassword: string; confirmPassword?: string }) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('nutripro_user');
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('nutripro_access_token');
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check auth state from backend /api/auth/me
  const checkAuth = async () => {
    const storedToken = localStorage.getItem('nutripro_access_token');
    if (!storedToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.get('/auth/me');
      if (response.data.success && response.data.user) {
        setUser(response.data.user);
        localStorage.setItem('nutripro_user', JSON.stringify(response.data.user));
      }
    } catch (err) {
      // If token expired, api interceptor will try to refresh. If that also fails:
      setUser(null);
      setToken(null);
      localStorage.removeItem('nutripro_access_token');
      localStorage.removeItem('nutripro_user');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();

    const handleLogoutEvent = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth:logout', handleLogoutEvent);
    return () => window.removeEventListener('auth:logout', handleLogoutEvent);
  }, []);

  const signup = async (formData: { name: string; email: string; password: string; confirmPassword?: string }) => {
    try {
      const res = await api.post('/auth/signup', formData);
      return {
        success: true,
        message: res.data.message || 'Verification code sent to your email.',
        email: res.data.email,
      };
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to sign up. Please try again.';
      throw new Error(msg);
    }
  };

  const verifyOtp = async (email: string, otp: string) => {
    try {
      const res = await api.post('/auth/verify-otp', { email, otp });
      if (res.data.success) {
        setToken(res.data.accessToken);
        setUser(res.data.user);
        localStorage.setItem('nutripro_access_token', res.data.accessToken);
        localStorage.setItem('nutripro_user', JSON.stringify(res.data.user));
        return {
          success: true,
          message: res.data.message,
          user: res.data.user,
        };
      }
      throw new Error(res.data.message || 'OTP verification failed.');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Invalid or expired verification code.';
      throw new Error(msg);
    }
  };

  const resendOtp = async (email: string, type: 'signup' | 'forgot-password' = 'signup') => {
    try {
      const res = await api.post('/auth/resend-otp', { email, type });
      return {
        success: true,
        message: res.data.message || 'New verification code sent.',
      };
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to resend code. Please wait a moment.';
      throw new Error(msg);
    }
  };

  const login = async (formData: { email: string; password: string }) => {
    try {
      const res = await api.post('/auth/login', formData);
      if (res.data.success) {
        setToken(res.data.accessToken);
        setUser(res.data.user);
        localStorage.setItem('nutripro_access_token', res.data.accessToken);
        if (res.data.refreshToken) {
          localStorage.setItem('nutripro_refresh_token', res.data.refreshToken);
        }
        localStorage.setItem('nutripro_user', JSON.stringify(res.data.user));
        return {
          success: true,
          message: res.data.message,
          user: res.data.user,
        };
      }
      throw new Error(res.data.message || 'Login failed.');
    } catch (error: any) {
      if (error.response?.data?.code === 'UNVERIFIED_EMAIL') {
        return {
          success: false,
          requiresVerification: true,
          email: error.response.data.email,
          message: error.response.data.message,
        };
      }
      const msg = error.response?.data?.message || 'Invalid email or password.';
      throw new Error(msg);
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const res = await api.post('/auth/forgot-password', { email });
      return {
        success: true,
        message: res.data.message,
        email: res.data.email,
      };
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to send reset code.';
      throw new Error(msg);
    }
  };

  const resetPassword = async (formData: { email: string; otp: string; newPassword: string; confirmPassword?: string }) => {
    try {
      const res = await api.post('/auth/reset-password', formData);
      return {
        success: true,
        message: res.data.message,
      };
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to reset password.';
      throw new Error(msg);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('nutripro_access_token');
      localStorage.removeItem('nutripro_refresh_token');
      localStorage.removeItem('nutripro_user');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        signup,
        verifyOtp,
        resendOtp,
        login,
        forgotPassword,
        resetPassword,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
