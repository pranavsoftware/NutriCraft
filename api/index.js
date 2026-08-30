import app from '../server/index.js';
import { initDb } from '../server/db.js';

let dbInitPromise = null;

export default async function handler(req, res) {
  // Ensure database schema and Turso connection are initialized once per lambda instance
  if (!dbInitPromise) {
    dbInitPromise = initDb().catch((err) => {
      console.error('[VERCEL SERVERLESS DB ERROR]:', err);
      dbInitPromise = null; // Retry on subsequent requests if failed
    });
  }

  await dbInitPromise;
  return app(req, res);
}
