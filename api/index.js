import app from '../server/index.js';
import { initDb } from '../server/db.js';

let isDbInitialized = false;

/**
 * Vercel Serverless Function Handler
 * Automatically handles API routes under /api/* when hosted on Vercel.
 */
export default async function handler(req, res) {
  if (!isDbInitialized) {
    try {
      await initDb();
      isDbInitialized = true;
    } catch (err) {
      console.warn('[VERCEL SERVERLESS] DB initialization warning:', err?.message);
    }
  }

  return app(req, res);
}
