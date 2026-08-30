import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { generateOtp } from '../utils/generateOtp.js';
import { sendOtpEmail } from '../utils/sendEmail.js';

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
 * Set HTTP-Only Cookie for Refresh Token (compatible with cross-origin Vercel -> Render)
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
 * 1. SIGN UP
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
    let existingUser = await User.findByEmail(normalizedEmail);

    const otp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email address already exists. Please log in.',
        });
      }

      // Existing unverified user -> update details and send new OTP
      const passwordHash = await User.hashPassword(password);
      await User.updateById(existingUser.id, {
        name: name.trim(),
        passwordHash,
        otp,
        otpExpiresAt,
      });

      await sendOtpEmail({
        to: normalizedEmail,
        name: name.trim(),
        otp,
        type: 'signup',
      });

      return res.status(200).json({
        success: true,
        message: 'Account pending verification. A fresh 6-digit OTP has been sent to your email.',
        email: normalizedEmail,
      });
    }

    // New user registration
    const passwordHash = await User.hashPassword(password);

    await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      isVerified: false,
      otp,
      otpExpiresAt,
    });

    // Send OTP email
    await sendOtpEmail({
      to: normalizedEmail,
      name: name.trim(),
      otp,
      type: 'signup',
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email for the 6-digit OTP verification code.',
      email: normalizedEmail,
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
 * 2. VERIFY OTP
 * POST /api/auth/verify-otp
 */
export async function verifyOtp(req, res) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP verification code are required.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findByEmail(normalizedEmail);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    if (!user.otp || user.otp !== otp.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code. Please check and try again.',
      });
    }

    if (!user.otpExpiresAt || new Date() > user.otpExpiresAt) {
      return res.status(400).json({
        success: false,
        code: 'OTP_EXPIRED',
        message: 'Verification code has expired. Please request a new code.',
      });
    }

    // Issue tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Mark user verified and clear OTP in Turso DB
    await User.updateById(user.id, {
      isVerified: true,
      otp: null,
      otpExpiresAt: null,
      refreshToken,
    });

    setRefreshTokenCookie(res, refreshToken);

    return res.status(200).json({
      success: true,
      message: 'Account verified successfully! Welcome to NutriCraft.',
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isVerified: true,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('[VERIFY OTP ERROR]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during OTP verification.',
    });
  }
}

/**
 * 3. RESEND OTP
 * POST /api/auth/resend-otp
 */
export async function resendOtp(req, res) {
  try {
    const { email, type = 'signup' } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required to resend verification code.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findByEmail(normalizedEmail);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email.',
      });
    }

    const otp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    if (type === 'forgot-password') {
      await User.updateById(user.id, {
        resetPasswordOtp: otp,
        resetPasswordOtpExpiresAt: otpExpiresAt,
      });
    } else {
      await User.updateById(user.id, {
        otp,
        otpExpiresAt,
      });
    }

    await sendOtpEmail({
      to: normalizedEmail,
      name: user.name,
      otp,
      type: type === 'forgot-password' ? 'forgot-password' : 'resend',
    });

    return res.status(200).json({
      success: true,
      message: 'A new 6-digit verification code has been dispatched to your email.',
    });
  } catch (error) {
    console.error('[RESEND OTP ERROR]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to resend verification code.',
    });
  }
}

/**
 * 4. LOGIN
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
    const user = await User.findByEmail(normalizedEmail);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // If user is not verified, block login and dispatch OTP
    if (!user.isVerified) {
      const otp = generateOtp();
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await User.updateById(user.id, { otp, otpExpiresAt });

      await sendOtpEmail({
        to: normalizedEmail,
        name: user.name,
        otp,
        type: 'signup',
      });

      return res.status(403).json({
        success: false,
        code: 'UNVERIFIED_EMAIL',
        message: 'Your email address is not verified yet. We have sent a verification code to your inbox.',
        email: normalizedEmail,
      });
    }

    // Issue JWTs
    const { accessToken, refreshToken } = generateTokens(user);
    await User.updateById(user.id, { refreshToken });

    setRefreshTokenCookie(res, refreshToken);

    return res.status(200).json({
      success: true,
      message: 'Login successful! Welcome back.',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
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
 * 5. FORGOT PASSWORD
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
    const user = await User.findByEmail(normalizedEmail);

    if (!user) {
      // Return success message even if not found to avoid account enumeration
      return res.status(200).json({
        success: true,
        message: 'If an account exists with that email, a password reset code has been sent.',
        email: normalizedEmail,
      });
    }

    const resetOtp = generateOtp();
    const resetPasswordOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    await User.updateById(user.id, {
      resetPasswordOtp: resetOtp,
      resetPasswordOtpExpiresAt,
    });

    await sendOtpEmail({
      to: normalizedEmail,
      name: user.name,
      otp: resetOtp,
      type: 'forgot-password',
    });

    return res.status(200).json({
      success: true,
      message: 'A 6-digit password reset code has been sent to your email.',
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
 * 6. RESET PASSWORD
 * POST /api/auth/reset-password
 */
export async function resetPassword(req, res) {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, reset code, and new password are required.',
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

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findByEmail(normalizedEmail);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Account not found.',
      });
    }

    if (!user.resetPasswordOtp || user.resetPasswordOtp !== otp.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid password reset code.',
      });
    }

    if (!user.resetPasswordOtpExpiresAt || new Date() > user.resetPasswordOtpExpiresAt) {
      return res.status(400).json({
        success: false,
        code: 'OTP_EXPIRED',
        message: 'Password reset code has expired. Please request a new one.',
      });
    }

    // Set new password, clear reset OTP, and revoke existing sessions
    const passwordHash = await User.hashPassword(newPassword);
    await User.updateById(user.id, {
      passwordHash,
      resetPasswordOtp: null,
      resetPasswordOtpExpiresAt: null,
      refreshToken: null,
      isVerified: true,
    });

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
    if (!user || user.refreshToken !== token) {
      return res.status(401).json({
        success: false,
        message: 'Session has been invalidated. Please log in again.',
      });
    }

    // Generate new tokens
    const tokens = generateTokens(user);
    await User.updateById(user.id, { refreshToken: tokens.refreshToken });

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
    const token = req.cookies.refreshToken || req.body.refreshToken;

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
        await User.updateById(decoded.userId, { refreshToken: null });
      } catch (err) {
        // Ignore token verification errors during logout
      }
    }

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
    return res.status(200).json({
      success: true,
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        isVerified: req.user.isVerified,
        createdAt: req.user.createdAt,
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
