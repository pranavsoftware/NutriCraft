import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';

export class User {
  /**
   * Hash password with bcrypt
   */
  static async hashPassword(plainPassword) {
    const salt = await bcrypt.genSalt(12);
    return await bcrypt.hash(plainPassword, salt);
  }

  /**
   * Compare candidate password with hash
   */
  static async comparePassword(candidatePassword, passwordHash) {
    return await bcrypt.compare(candidatePassword, passwordHash);
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const normalizedEmail = email.toLowerCase().trim();
    const result = await db.execute({
      sql: `SELECT * FROM users WHERE email = ? LIMIT 1`,
      args: [normalizedEmail],
    });

    if (result.rows.length === 0) return null;
    const row = result.rows[0];

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      passwordHash: row.password_hash,
      isVerified: Boolean(row.is_verified),
      otp: row.otp,
      otpExpiresAt: row.otp_expires_at ? new Date(row.otp_expires_at) : null,
      resetPasswordOtp: row.reset_password_otp,
      resetPasswordOtpExpiresAt: row.reset_password_otp_expires_at ? new Date(row.reset_password_otp_expires_at) : null,
      refreshToken: row.refresh_token,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      comparePassword: async (password) => await User.comparePassword(password, row.password_hash),
    };
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    const result = await db.execute({
      sql: `SELECT id, name, email, is_verified, refresh_token, created_at, updated_at FROM users WHERE id = ? LIMIT 1`,
      args: [id],
    });

    if (result.rows.length === 0) return null;
    const row = result.rows[0];

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      isVerified: Boolean(row.is_verified),
      refreshToken: row.refresh_token,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Create a new user
   */
  static async create({ name, email, passwordHash, isVerified = false, otp = null, otpExpiresAt = null }) {
    const id = crypto.randomUUID();
    const normalizedEmail = email.toLowerCase().trim();
    const now = new Date().toISOString();
    const otpExpStr = otpExpiresAt ? new Date(otpExpiresAt).toISOString() : null;

    await db.execute({
      sql: `INSERT INTO users (id, name, email, password_hash, is_verified, otp, otp_expires_at, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        name.trim(),
        normalizedEmail,
        passwordHash,
        isVerified ? 1 : 0,
        otp,
        otpExpStr,
        now,
        now,
      ],
    });

    return {
      id,
      name: name.trim(),
      email: normalizedEmail,
      isVerified,
      createdAt: now,
    };
  }

  /**
   * Update user fields by ID
   */
  static async updateById(id, fields) {
    const setClauses = [];
    const args = [];

    const fieldMap = {
      name: 'name',
      passwordHash: 'password_hash',
      isVerified: 'is_verified',
      otp: 'otp',
      otpExpiresAt: 'otp_expires_at',
      resetPasswordOtp: 'reset_password_otp',
      resetPasswordOtpExpiresAt: 'reset_password_otp_expires_at',
      refreshToken: 'refresh_token',
    };

    for (const [key, value] of Object.entries(fields)) {
      const colName = fieldMap[key];
      if (colName) {
        setClauses.push(`${colName} = ?`);
        if (key === 'isVerified') {
          args.push(value ? 1 : 0);
        } else if (key === 'otpExpiresAt' || key === 'resetPasswordOtpExpiresAt') {
          args.push(value ? new Date(value).toISOString() : null);
        } else {
          args.push(value);
        }
      }
    }

    if (setClauses.length === 0) return;

    setClauses.push(`updated_at = ?`);
    args.push(new Date().toISOString());

    args.push(id);

    await db.execute({
      sql: `UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`,
      args,
    });
  }
}

export default User;
