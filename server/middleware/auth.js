import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Authentication middleware to verify JWT access token and load Firebase user
 */
export async function authenticateToken(req, res, next) {
  try {
    let token = null;

    // Check Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.',
      });
    }

    const secret = process.env.JWT_ACCESS_SECRET || 'nutripro_super_secure_access_token_secret_key_2026';

    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          code: 'TOKEN_EXPIRED',
          message: 'Access token has expired. Please refresh your token.',
        });
      }
      return res.status(401).json({
        success: false,
        code: 'TOKEN_INVALID',
        message: 'Invalid access token.',
      });
    }

    const userId = decoded.userId || decoded.sub || decoded.uid;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to this session was not found.',
      });
    }

    req.user = {
      ...user,
      id: user.id,
      userId: user.id,
    };
    next();
  } catch (error) {
    console.error('[AUTH MIDDLEWARE ERROR]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication.',
    });
  }
}

/**
 * Middleware to ensure the authenticated user has completed their biometric profile
 */
export async function requireCompleteProfile(req, res, next) {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    const { db } = await import('../db.js');
    const profile = await db.getVal(`profiles/${userId}`);
    const isComplete = Boolean(
      profile &&
      profile.age &&
      profile.height_cm &&
      profile.weight_kg &&
      profile.gender &&
      profile.goal
    );

    if (!isComplete) {
      return res.status(403).json({
        success: false,
        code: 'PROFILE_INCOMPLETE',
        message: 'Please complete your biometric profile details first to access this feature.',
      });
    }

    req.profile = profile;
    next();
  } catch (error) {
    console.error('[REQUIRE COMPLETE PROFILE ERROR]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify profile status.',
    });
  }
}

export const authenticate = authenticateToken;
export default authenticateToken;
