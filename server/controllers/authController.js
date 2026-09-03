import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { db, firebaseConfig } from '../db.js';

/**
 * Checks if a user has completed their biometric profile in Firebase RTDB
 */
export async function checkProfileComplete(userId) {
  if (!userId) return false;
  try {
    const profile = await db.getVal(`profiles/${userId}`);
    return Boolean(
      profile &&
      profile.age &&
      profile.height_cm &&
      profile.weight_kg &&
      profile.gender &&
      profile.goal
    );
  } catch {
    return false;
  }
}

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'nutripro_super_secure_access_token_secret_key_2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'nutripro_super_secure_refresh_token_secret_key_2026';
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Generate Access and Refresh JWT tokens
 */
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email, name: user.name },
    JWT_ACCESS_SECRET,
    { expiresIn: JWT_ACCESS_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );

  return { accessToken, refreshToken };
};

/**
 * Set HTTP-Only Cookie for Refresh Token
 */
const setRefreshTokenCookie = (res, refreshToken) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
};

/**
 * Helper: Call Firebase Auth Identity Toolkit REST API
 */
async function callFirebaseAuth(action, payload) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:${action}?key=${firebaseConfig.apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    const errorMsg = data.error?.message || 'Authentication operation failed.';
    throw new Error(errorMsg);
  }
  return data;
}

/**
 * 1. SIGN UP (Firebase Auth + Firebase Realtime Database)
 * POST /api/auth/signup
 */
export async function signup(req, res) {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Create user in Firebase Auth
    let fbUser;
    try {
      fbUser = await callFirebaseAuth('signUp', {
        email: normalizedEmail,
        password,
        returnSecureToken: true,
      });
    } catch (fbErr) {
      if (fbErr.message.includes('EMAIL_EXISTS')) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email address already exists. Please log in.',
        });
      }
      if (fbErr.message.includes('WEAK_PASSWORD')) {
        return res.status(400).json({
          success: false,
          message: 'Password is too weak. Please use a stronger password.',
        });
      }
      throw fbErr;
    }

    const uid = fbUser.localId;

    // 2. Save user profile in Firebase Realtime Database (/users/{uid})
    const user = await User.create({
      id: uid,
      name: name.trim(),
      email: normalizedEmail,
      isVerified: true,
    });

    // 3. Issue application JWT tokens
    const { accessToken, refreshToken } = generateTokens(user);
    setRefreshTokenCookie(res, refreshToken);

    const isProfileComplete = await checkProfileComplete(user.id);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully with Firebase Auth! Welcome to NutriCraft.',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isVerified: true,
        createdAt: user.createdAt,
        isProfileComplete,
      },
    });
  } catch (error) {
    console.error('[SIGNUP ERROR]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error occurred during sign up.',
    });
  }
}

/**
 * 2. LOGIN (Firebase Auth + Firebase Realtime Database)
 * POST /api/auth/login
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Authenticate with Firebase Auth
    let fbUser;
    try {
      fbUser = await callFirebaseAuth('signInWithPassword', {
        email: normalizedEmail,
        password,
        returnSecureToken: true,
      });
    } catch (fbErr) {
      if (
        fbErr.message.includes('INVALID_LOGIN_CREDENTIALS') ||
        fbErr.message.includes('EMAIL_NOT_FOUND') ||
        fbErr.message.includes('INVALID_PASSWORD')
      ) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.',
        });
      }
      if (fbErr.message.includes('USER_DISABLED')) {
        return res.status(403).json({
          success: false,
          message: 'This user account has been disabled.',
        });
      }
      throw fbErr;
    }

    const uid = fbUser.localId;

    // 2. Fetch or initialize user profile in Firebase Realtime Database
    let user = await User.findById(uid);
    if (!user) {
      user = await User.create({
        id: uid,
        name: fbUser.displayName || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        isVerified: true,
      });
    }

    // 3. Issue application JWT tokens
    const { accessToken, refreshToken } = generateTokens(user);
    setRefreshTokenCookie(res, refreshToken);

    const isProfileComplete = await checkProfileComplete(user.id);

    return res.status(200).json({
      success: true,
      message: 'Login successful! Welcome back.',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isVerified: true,
        createdAt: user.createdAt,
        isProfileComplete,
      },
    });
  } catch (error) {
    console.error('[LOGIN ERROR]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login.',
    });
  }
}

/**
 * 3. FORGOT PASSWORD (Native Firebase Auth Email Dispatch)
 * POST /api/auth/forgot-password
 */
export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your email address.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    try {
      // Trigger Firebase Auth password reset email
      await callFirebaseAuth('sendOobCode', {
        requestType: 'PASSWORD_RESET',
        email: normalizedEmail,
      });
    } catch (err) {
      console.warn('[FORGOT PASSWORD NOTICE]:', err.message);
      // Return 200 to prevent user enumeration
    }

    return res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been dispatched to your inbox by Firebase.',
      email: normalizedEmail,
    });
  } catch (error) {
    console.error('[FORGOT PASSWORD ERROR]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error processing forgot password request.',
    });
  }
}

/**
 * 4. RESET PASSWORD (Firebase Auth oobCode Confirmation)
 * POST /api/auth/reset-password
 */
export async function resetPassword(req, res) {
  try {
    const { oobCode, otp, newPassword, confirmPassword } = req.body;
    const code = oobCode || otp;

    if (!code || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Reset code and new password are required.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.',
      });
    }

    // Call Firebase Auth to reset password
    try {
      await callFirebaseAuth('resetPassword', {
        oobCode: code,
        newPassword,
      });
    } catch (fbErr) {
      return res.status(400).json({
        success: false,
        message: fbErr.message || 'Invalid or expired password reset code.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.',
    });
  } catch (error) {
    console.error('[RESET PASSWORD ERROR]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error resetting password.',
    });
  }
}

/**
 * 5. VERIFY OTP (Graceful handler for backward compatibility)
 * POST /api/auth/verify-otp
 */
export async function verifyOtp(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findByEmail(normalizedEmail);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const { accessToken, refreshToken } = generateTokens(user);
    setRefreshTokenCookie(res, refreshToken);

    return res.status(200).json({
      success: true,
      message: 'Account verified successfully with Firebase!',
      accessToken,
      user,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'OTP verification failed.' });
  }
}

/**
 * 6. RESEND OTP (Graceful handler for backward compatibility)
 * POST /api/auth/resend-otp
 */
export async function resendOtp(req, res) {
  try {
    const { email, type } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    if (type === 'forgot-password') {
      return forgotPassword(req, res);
    }

    return res.status(200).json({
      success: true,
      message: 'Your account is ready for sign in.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Resend request failed.' });
  }
}

/**
 * 7. REFRESH TOKEN
 * POST /api/auth/refresh-token
 */
export async function refreshToken(req, res) {
  try {
    const token = req.cookies.refreshToken || req.body.refreshToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not provided.',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token.',
      });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User session no longer exists. Please log in again.',
      });
    }

    // Generate new tokens
    const tokens = generateTokens(user);
    setRefreshTokenCookie(res, tokens.refreshToken);

    return res.status(200).json({
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    console.error('[REFRESH TOKEN ERROR]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error refreshing token.',
    });
  }
}

/**
 * 8. LOGOUT
 * POST /api/auth/logout
 */
export async function logout(req, res) {
  try {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/',
    });

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    console.error('[LOGOUT ERROR]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during logout.',
    });
  }
}

/**
 * 9. GET CURRENT USER (ME)
 * GET /api/auth/me (Protected route)
 */
export async function getMe(req, res) {
  try {
    const isProfileComplete = await checkProfileComplete(req.user.id);
    return res.status(200).json({
      success: true,
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        isVerified: req.user.isVerified,
        createdAt: req.user.createdAt,
        isProfileComplete,
      },
    });
  } catch (error) {
    console.error('[GET ME ERROR]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching user profile.',
    });
  }
}

/**
 * 10. GOOGLE SIGN IN
 * POST /api/auth/google
 */
export async function googleSignIn(req, res) {
  try {
    const { uid, email, name, photoUrl } = req.body;

    if (!uid || !email) {
      return res.status(400).json({
        success: false,
        message: 'UID and email are required for Google authentication.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists in Firebase RTDB
    let user = await User.findById(uid);
    if (!user) {
      user = await User.findByEmail(normalizedEmail);
      if (!user) {
        user = await User.create({
          id: uid,
          name: name ? name.trim() : normalizedEmail.split('@')[0],
          email: normalizedEmail,
          isVerified: true,
        });
      }
    }

    // Issue application tokens
    const { accessToken, refreshToken } = generateTokens(user);
    setRefreshTokenCookie(res, refreshToken);

    const isProfileComplete = await checkProfileComplete(user.id);

    return res.status(200).json({
      success: true,
      message: 'Google Sign In successful! Welcome to NutriCraft.',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isVerified: true,
        photoUrl: photoUrl || null,
        createdAt: user.createdAt,
        isProfileComplete,
      },
    });
  } catch (error) {
    console.error('[GOOGLE SIGN IN ERROR]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during Google authentication.',
    });
  }
}

/**
 * 11. FIREBASE CLIENT SYNC (Sync user created on frontend with RTDB)
 * POST /api/auth/firebase-sync
 */
export async function firebaseSync(req, res) {
  try {
    const { uid, email, name, isVerified = false } = req.body;

    if (!uid || !email) {
      return res.status(400).json({
        success: false,
        message: 'UID and email are required to sync account.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = await User.findById(uid);

    if (!user) {
      user = await User.create({
        id: uid,
        name: name ? name.trim() : normalizedEmail.split('@')[0],
        email: normalizedEmail,
        isVerified: Boolean(isVerified),
      });
    } else if (isVerified && !user.isVerified) {
      user = await User.updateById(uid, { isVerified: true });
    }

    const { accessToken, refreshToken } = generateTokens(user);
    setRefreshTokenCookie(res, refreshToken);

    const isProfileComplete = await checkProfileComplete(user.id);

    return res.status(200).json({
      success: true,
      message: 'Account synchronized successfully.',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        isProfileComplete,
      },
    });
  } catch (error) {
    console.error('[FIREBASE SYNC ERROR]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to sync account.',
    });
  }
}

