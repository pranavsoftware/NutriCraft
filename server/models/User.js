import crypto from 'crypto';
import { db } from '../db.js';

export class User {
  /**
   * Find user by email in Firebase Realtime Database
   */
  static async findByEmail(email) {
    if (!email) return null;
    const normalizedEmail = email.toLowerCase().trim();
    const allUsers = await db.getVal('users');
    if (!allUsers) return null;

    for (const [id, u] of Object.entries(allUsers)) {
      if (u && u.email && u.email.toLowerCase().trim() === normalizedEmail) {
        return {
          id: u.id || id,
          name: u.name || '',
          email: u.email,
          isVerified: Boolean(u.isVerified),
          createdAt: u.createdAt || u.created_at,
          updatedAt: u.updatedAt || u.updated_at,
        };
      }
    }
    return null;
  }

  /**
   * Find user by ID in Firebase Realtime Database
   */
  static async findById(id) {
    if (!id) return null;
    const u = await db.getVal(`users/${id}`);
    if (!u) return null;

    return {
      id: u.id || id,
      name: u.name || '',
      email: u.email || '',
      isVerified: Boolean(u.isVerified),
      createdAt: u.createdAt || u.created_at,
      updatedAt: u.updatedAt || u.updated_at,
    };
  }

  /**
   * Create a new user profile in Firebase Realtime Database
   */
  static async create({ id, name, email, isVerified = true }) {
    const userId = id || crypto.randomUUID();
    const normalizedEmail = email.toLowerCase().trim();
    const now = new Date().toISOString();

    const userData = {
      id: userId,
      name: name ? name.trim() : 'NutriCraft Member',
      email: normalizedEmail,
      isVerified: Boolean(isVerified),
      createdAt: now,
      updatedAt: now,
    };

    await db.setVal(`users/${userId}`, userData);
    return userData;
  }

  /**
   * Update user fields by ID in Firebase Realtime Database
   */
  static async updateById(id, fields) {
    if (!id || !fields) return;
    const now = new Date().toISOString();

    await db.updateVal(`users/${id}`, {
      ...fields,
      updatedAt: now,
    });

    return await User.findById(id);
  }
}

export default User;
