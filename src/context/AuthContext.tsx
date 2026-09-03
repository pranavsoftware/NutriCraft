import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
  applyActionCode,
  getActionCodeSettings,
  getPasswordResetActionCodeSettings,
  updateFirebaseProfile,
  firebaseSignOut,
} from '../services/firebase';

export interface User {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
  isProfileComplete?: boolean;
  photoUrl?: string | null;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  markProfileComplete: () => void;
  signup: (formData: { name: string; email: string; password: string; confirmPassword?: string }) => Promise<{ success: boolean; message: string; email?: string; user?: User }>;
  login: (formData: { email: string; password: string }) => Promise<{ success: boolean; message: string; user?: User }>;
  loginWithGoogle: () => Promise<{ success: boolean; message: string; user?: User }>;
  sendVerificationEmail: (targetUser?: any) => Promise<{ success: boolean; message: string }>;
  verifyEmailAction: (oobCode: string) => Promise<{ success: boolean; message: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string; email?: string }>;
  verifyPasswordResetCodeAction: (oobCode: string) => Promise<{ success: boolean; email: string }>;
  resetPassword: (formData: { email?: string; otp?: string; oobCode?: string; newPassword: string; confirmPassword?: string }) => Promise<{ success: boolean; message: string }>;
  verifyOtp: (email: string, otp: string) => Promise<{ success: boolean; message: string; user?: User }>;
  resendOtp: (email: string, type?: 'signup' | 'forgot-password') => Promise<{ success: boolean; message: string }>;
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

  /**
   * 1. Sign up with Email, Password, and Send Verification Link
   */
  const signup = async (formData: { name: string; email: string; password: string; confirmPassword?: string }) => {
    try {
      const normalizedEmail = formData.email.toLowerCase().trim();

      // 1. Create account directly with Firebase Auth on client
      const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, formData.password);
      const fbUser = userCredential.user;

      // 2. Set user display name in Firebase Auth
      if (formData.name?.trim()) {
        try {
          await updateFirebaseProfile(fbUser, { displayName: formData.name.trim() });
        } catch (profileErr) {
          console.warn('[FIREBASE PROFILE UPDATE NOTICE]:', profileErr);
        }
      }

      // 3. Dispatch official Firebase verification link email with custom ActionCodeSettings
      try {
        const actionCodeSettings = getActionCodeSettings();
        await sendEmailVerification(fbUser, actionCodeSettings);
      } catch (verifErr) {
        console.warn('[FIREBASE VERIFICATION EMAIL NOTICE]:', verifErr);
      }

      // 4. Synchronize user profile with backend database
      const res = await api.post('/auth/firebase-sync', {
        uid: fbUser.uid,
        email: normalizedEmail,
        name: formData.name.trim(),
        isVerified: fbUser.emailVerified,
      });

      if (res.data.success && res.data.accessToken) {
        setToken(res.data.accessToken);
        setUser(res.data.user);
        localStorage.setItem('nutripro_access_token', res.data.accessToken);
        if (res.data.refreshToken) {
          localStorage.setItem('nutripro_refresh_token', res.data.refreshToken);
        }
        localStorage.setItem('nutripro_user', JSON.stringify(res.data.user));
      }

      return {
        success: true,
        message: 'Account created! A verification link has been dispatched to your email address.',
        user: res.data.user || { id: fbUser.uid, name: formData.name, email: normalizedEmail, isVerified: false },
        email: normalizedEmail,
      };
    } catch (error: any) {
      console.error('[SIGNUP ERROR]:', error);
      let msg = error.message || 'Failed to sign up. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        msg = 'An account with this email address already exists. Please log in.';
      } else if (error.code === 'auth/weak-password') {
        msg = 'Password must be at least 6 characters long.';
      } else if (error.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      } else if (error.response?.data?.message) {
        msg = error.response.data.message;
      }
      throw new Error(msg);
    }
  };

  /**
   * 2. Log in with Email & Password
   */
  const login = async (formData: { email: string; password: string }) => {
    try {
      const normalizedEmail = formData.email.toLowerCase().trim();

      // Sign in with Firebase Auth client
      const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, formData.password);
      const fbUser = userCredential.user;

      // Synchronize with backend database & issue tokens
      const res = await api.post('/auth/firebase-sync', {
        uid: fbUser.uid,
        email: normalizedEmail,
        name: fbUser.displayName || normalizedEmail.split('@')[0],
        isVerified: fbUser.emailVerified,
      });

      if (res.data.success && res.data.accessToken) {
        setToken(res.data.accessToken);
        setUser(res.data.user);
        localStorage.setItem('nutripro_access_token', res.data.accessToken);
        if (res.data.refreshToken) {
          localStorage.setItem('nutripro_refresh_token', res.data.refreshToken);
        }
        localStorage.setItem('nutripro_user', JSON.stringify(res.data.user));
        return {
          success: true,
          message: 'Login successful! Welcome back.',
          user: res.data.user,
        };
      }

      throw new Error(res.data.message || 'Login failed.');
    } catch (error: any) {
      console.error('[LOGIN ERROR]:', error);
      let msg = 'Invalid email or password. Please try again.';
      if (
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential'
      ) {
        msg = 'Invalid email or password. Please verify your credentials.';
      } else if (error.code === 'auth/too-many-requests') {
        msg = 'Access temporarily disabled due to multiple failed login attempts. Please reset password or try again later.';
      } else if (error.response?.data?.message) {
        msg = error.response.data.message;
      }
      throw new Error(msg);
    }
  };

  /**
   * 3. Google Sign In (Popup with Firebase Auth)
   */
  const loginWithGoogle = async () => {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const fbUser = userCredential.user;
      const idToken = await fbUser.getIdToken();

      // Sync Google user with backend database
      const res = await api.post('/auth/google', {
        uid: fbUser.uid,
        email: fbUser.email,
        name: fbUser.displayName || fbUser.email?.split('@')[0] || 'NutriCraft Member',
        photoUrl: fbUser.photoURL || null,
        idToken,
      });

      if (res.data.success && res.data.accessToken) {
        setToken(res.data.accessToken);
        setUser(res.data.user);
        localStorage.setItem('nutripro_access_token', res.data.accessToken);
        if (res.data.refreshToken) {
          localStorage.setItem('nutripro_refresh_token', res.data.refreshToken);
        }
        localStorage.setItem('nutripro_user', JSON.stringify(res.data.user));
      }

      return {
        success: true,
        message: 'Google Sign In successful! Welcome to NutriCraft.',
        user: res.data.user,
      };
    } catch (error: any) {
      console.error('[GOOGLE SIGN IN ERROR]:', error);
      let msg = 'Google Sign In could not be completed.';
      if (error.code === 'auth/popup-closed-by-user') {
        msg = 'Sign in popup was closed. Please try again.';
      } else if (error.code === 'auth/cancelled-popup-request') {
        msg = 'Sign in request was cancelled.';
      } else if (error.response?.data?.message) {
        msg = error.response.data.message;
      } else if (error.message) {
        msg = error.message;
      }
      throw new Error(msg);
    }
  };

  /**
   * 4. Send or Resend Verification Link Email
   */
  const sendVerificationEmail = async (targetUser?: any) => {
    try {
      const userToVerify = targetUser || auth.currentUser;
      if (userToVerify) {
        const actionCodeSettings = getActionCodeSettings();
        await sendEmailVerification(userToVerify, actionCodeSettings);
        return {
          success: true,
          message: 'A fresh verification link has been sent to your email!',
        };
      }
      throw new Error('No active user found to send verification link.');
    } catch (error: any) {
      console.error('[VERIFICATION EMAIL ERROR]:', error.message || error);
      throw new Error(error.message || 'Failed to send verification link.');
    }
  };

  /**
   * 4b. Apply Firebase Email Verification Action Code (verifyEmail)
   */
  const verifyEmailAction = async (oobCode: string) => {
    if (!oobCode || typeof oobCode !== 'string' || !oobCode.trim()) {
      throw new Error('This verification link is invalid. No verification code was provided.');
    }

    try {
      // 1. Verify and apply action code in Firebase Authentication
      await applyActionCode(auth, oobCode);

      // 2. Reload current user if active in session to refresh emailVerified
      if (auth.currentUser) {
        try {
          await auth.currentUser.reload();
        } catch (reloadErr) {
          console.warn('[FIREBASE USER RELOAD NOTICE]:', reloadErr);
        }

        // 3. Synchronize emailVerified status with backend database
        try {
          await api.post('/auth/firebase-sync', {
            uid: auth.currentUser.uid,
            email: auth.currentUser.email,
            isVerified: true,
          });
        } catch (syncErr) {
          console.warn('[BACKEND VERIFICATION SYNC NOTICE]:', syncErr);
        }

        // 4. Refresh client user state in AuthContext
        await checkAuth();
      }

      return {
        success: true,
        message: 'Your email address has been successfully verified.',
      };
    } catch (error: any) {
      // Security: Never print or log oobCode
      let friendlyMessage = 'This verification link is invalid or has already been used.';
      const errorCode = error?.code || '';

      if (errorCode === 'auth/expired-action-code') {
        friendlyMessage = 'This verification link has expired. Please request a new verification email.';
      } else if (errorCode === 'auth/invalid-action-code') {
        friendlyMessage = 'This verification link is invalid or has already been used.';
      } else if (errorCode === 'auth/user-disabled') {
        friendlyMessage = 'This user account has been disabled.';
      } else if (errorCode === 'auth/user-not-found') {
        friendlyMessage = 'No account associated with this verification link was found.';
      } else if (errorCode === 'auth/invalid-continue-uri') {
        friendlyMessage = 'The verification return destination is invalid.';
      } else if (errorCode === 'auth/unauthorized-continue-uri') {
        friendlyMessage = 'The verification return domain is not authorized.';
      } else if (error?.message && !error.message.includes('oobCode') && !error.message.includes('apiKey')) {
        friendlyMessage = error.message;
      }

      throw new Error(friendlyMessage);
    }
  };

  /**
   * 5. Forgot Password (Dispatches official Firebase reset link with custom ActionCodeSettings)
   */
  const forgotPassword = async (email: string) => {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const actionCodeSettings = getPasswordResetActionCodeSettings();
      await sendPasswordResetEmail(auth, normalizedEmail, actionCodeSettings);
      return {
        success: true,
        message: 'Password reset link sent! Check your inbox to reset your password.',
        email: normalizedEmail,
      };
    } catch (error: any) {
      console.warn('[FIREBASE CLIENT RESET NOTICE, FALLING BACK TO API]:', error.message);
      try {
        const res = await api.post('/auth/forgot-password', { email });
        return {
          success: true,
          message: res.data.message || 'Password reset link sent to your email!',
          email,
        };
      } catch (apiErr: any) {
        throw new Error(apiErr.response?.data?.message || 'Failed to send reset link.');
      }
    }
  };

  /**
   * 5b. Verify Password Reset Code from Link (Firebase oobCode)
   */
  const verifyPasswordResetCodeAction = async (oobCode: string) => {
    if (!oobCode || typeof oobCode !== 'string' || !oobCode.trim()) {
      throw new Error('This password reset link is invalid. No reset code was provided.');
    }

    try {
      const email = await verifyPasswordResetCode(auth, oobCode);
      return {
        success: true,
        email,
      };
    } catch (error: any) {
      let friendlyMessage = 'This password reset link is invalid or has already been used.';
      const errorCode = error?.code || '';

      if (errorCode === 'auth/expired-action-code') {
        friendlyMessage = 'This password reset link has expired. Please request a new link.';
      } else if (errorCode === 'auth/invalid-action-code') {
        friendlyMessage = 'This password reset link is invalid or has already been used.';
      } else if (errorCode === 'auth/user-disabled') {
        friendlyMessage = 'This user account has been disabled.';
      } else if (errorCode === 'auth/user-not-found') {
        friendlyMessage = 'No account associated with this password reset link was found.';
      } else if (error?.message && !error.message.includes('oobCode') && !error.message.includes('apiKey')) {
        friendlyMessage = error.message;
      }

      throw new Error(friendlyMessage);
    }
  };

  /**
   * 6. Reset Password (Firebase confirmPasswordReset or Backend fallback)
   */
  const resetPassword = async (formData: { email?: string; otp?: string; oobCode?: string; newPassword: string; confirmPassword?: string }) => {
    // If oobCode is present, use Firebase Client SDK confirmPasswordReset
    if (formData.oobCode) {
      if (formData.newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
      }
      if (formData.confirmPassword && formData.newPassword !== formData.confirmPassword) {
        throw new Error('Passwords do not match.');
      }

      try {
        await confirmPasswordReset(auth, formData.oobCode, formData.newPassword);
        return {
          success: true,
          message: 'Password reset successfully! You can now log in with your new password.',
        };
      } catch (error: any) {
        let friendlyMessage = 'Failed to reset password. The code may have expired or is invalid.';
        const errorCode = error?.code || '';

        if (errorCode === 'auth/expired-action-code') {
          friendlyMessage = 'This password reset link has expired. Please request a new link.';
        } else if (errorCode === 'auth/invalid-action-code') {
          friendlyMessage = 'This password reset link is invalid or has already been used.';
        } else if (errorCode === 'auth/weak-password') {
          friendlyMessage = 'Password is too weak. Please use at least 6 characters with a combination of letters and numbers.';
        } else if (errorCode === 'auth/user-disabled') {
          friendlyMessage = 'This user account has been disabled.';
        } else if (errorCode === 'auth/user-not-found') {
          friendlyMessage = 'No account associated with this reset request was found.';
        } else if (error?.message && !error.message.includes('oobCode') && !error.message.includes('apiKey')) {
          friendlyMessage = error.message;
        }

        throw new Error(friendlyMessage);
      }
    }

    // Fallback to backend API for legacy OTP reset
    try {
      const res = await api.post('/auth/reset-password', formData);
      return {
        success: true,
        message: res.data.message || 'Password reset successfully!',
      };
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to reset password.';
      throw new Error(msg);
    }
  };

  /**
   * 7. Verify OTP (for backward compatibility)
   */
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
      throw new Error(res.data.message || 'Verification failed.');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Verification failed.';
      throw new Error(msg);
    }
  };

  /**
   * 8. Resend OTP (for backward compatibility)
   */
  const resendOtp = async (email: string, type: 'signup' | 'forgot-password' = 'signup') => {
    try {
      const res = await api.post('/auth/resend-otp', { email, type });
      return {
        success: true,
        message: res.data.message || 'Verification link sent.',
      };
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to resend code.';
      throw new Error(msg);
    }
  };

  /**
   * 9. Logout
   */
  const logout = async () => {
    try {
      await firebaseSignOut(auth);
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

  const markProfileComplete = () => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, isProfileComplete: true };
      localStorage.setItem('nutripro_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        markProfileComplete,
        signup,
        login,
        loginWithGoogle,
        sendVerificationEmail,
        verifyEmailAction,
        forgotPassword,
        verifyPasswordResetCodeAction,
        resetPassword,
        verifyOtp,
        resendOtp,
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
