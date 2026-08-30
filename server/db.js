import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

const cloudUrl = process.env.TURSO_DATABASE_URL || 'libsql://nutricraft-project123.aws-ap-south-1.turso.io';
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

// Active client — will be assigned after initDb()
let activeClient = createClient({
  url: cloudUrl,
  authToken,
});

/** All CREATE TABLE / INDEX statements for full schema */
async function createSchema(client) {
  const statements = [
    // ─── Auth ──────────────────────────────────────────────
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      is_verified INTEGER DEFAULT 0,
      otp TEXT,
      otp_expires_at TEXT,
      reset_password_otp TEXT,
      reset_password_otp_expires_at TEXT,
      refresh_token TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,

    // ─── Profiles ──────────────────────────────────────────
    `CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      age INTEGER,
      height_cm REAL,
      weight_kg REAL,
      gender TEXT,
      activity_level TEXT DEFAULT 'moderate',
      goal TEXT DEFAULT 'maintain',
      dietary_preference TEXT DEFAULT 'none',
      allergies TEXT DEFAULT '',
      daily_calorie_target INTEGER DEFAULT 2000,
      daily_protein_target INTEGER DEFAULT 120,
      daily_carb_target INTEGER DEFAULT 250,
      daily_fat_target INTEGER DEFAULT 65,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id)`,

    // ─── Foods (cached from external API) ──────────────────
    `CREATE TABLE IF NOT EXISTS foods (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      brand TEXT,
      calories_per_100g REAL NOT NULL DEFAULT 0,
      protein_per_100g REAL DEFAULT 0,
      carbs_per_100g REAL DEFAULT 0,
      fat_per_100g REAL DEFAULT 0,
      fiber_per_100g REAL DEFAULT 0,
      serving_size_g REAL DEFAULT 100,
      serving_unit TEXT DEFAULT 'g',
      source TEXT DEFAULT 'usda',
      external_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE INDEX IF NOT EXISTS idx_foods_name ON foods(name)`,
    `CREATE INDEX IF NOT EXISTS idx_foods_external_id ON foods(external_id)`,

    // ─── Recipes ───────────────────────────────────────────
    `CREATE TABLE IF NOT EXISTS recipes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      items TEXT NOT NULL DEFAULT '[]',
      total_calories REAL DEFAULT 0,
      total_protein REAL DEFAULT 0,
      total_carbs REAL DEFAULT 0,
      total_fat REAL DEFAULT 0,
      servings INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id)`,

    // ─── Food Entries (single source of truth) ─────────────
    `CREATE TABLE IF NOT EXISTS food_entries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      food_id TEXT,
      recipe_id TEXT,
      food_name TEXT NOT NULL,
      quantity_g REAL NOT NULL DEFAULT 100,
      meal_type TEXT NOT NULL DEFAULT 'snack',
      source TEXT DEFAULT 'manual',
      calories REAL DEFAULT 0,
      protein REAL DEFAULT 0,
      carbs REAL DEFAULT 0,
      fat REAL DEFAULT 0,
      date TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS idx_food_entries_user_date ON food_entries(user_id, date)`,
    `CREATE INDEX IF NOT EXISTS idx_food_entries_meal_type ON food_entries(meal_type)`,

    // ─── Weight Logs ───────────────────────────────────────
    `CREATE TABLE IF NOT EXISTS weight_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      weight_kg REAL NOT NULL,
      logged_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS idx_weight_logs_user ON weight_logs(user_id, logged_at)`,

    // ─── Chat Messages ─────────────────────────────────────
    `CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS idx_chat_user ON chat_messages(user_id, created_at)`,

    // ─── Meal Plans ────────────────────────────────────────
    `CREATE TABLE IF NOT EXISTS meal_plans (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      week_start_date TEXT NOT NULL,
      day_of_week INTEGER NOT NULL,
      meal_type TEXT NOT NULL,
      food_name TEXT NOT NULL,
      food_id TEXT,
      quantity_g REAL DEFAULT 100,
      calories REAL DEFAULT 0,
      protein REAL DEFAULT 0,
      carbs REAL DEFAULT 0,
      fat REAL DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS idx_meal_plans_user_week ON meal_plans(user_id, week_start_date)`,

    // ─── Grocery Lists ─────────────────────────────────────
    `CREATE TABLE IF NOT EXISTS grocery_lists (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      week_start_date TEXT NOT NULL,
      items TEXT NOT NULL DEFAULT '[]',
      checked_state TEXT NOT NULL DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS idx_grocery_lists_user_week ON grocery_lists(user_id, week_start_date)`,
  ];

  for (const sql of statements) {
    await client.execute(sql);
  }
}

import { COMPREHENSIVE_FOODS } from './seed_foods.js';

/** Seed comprehensive foods dataset if the table is empty */
async function seedFoods(client) {
  const result = await client.execute('SELECT COUNT(*) as count FROM foods');
  const count = Number(result.rows[0].count);
  if (count >= 150) return;

  console.log(`[SEED] Seeding comprehensive food database (${COMPREHENSIVE_FOODS.length} items)...`);
  for (const [id, name, brand, cal, prot, carb, fat, fiber, serving, unit] of COMPREHENSIVE_FOODS) {
    await client.execute({
      sql: `INSERT OR REPLACE INTO foods (id, name, brand, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, serving_size_g, serving_unit, source)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'seed')`,
      args: [id, name, brand, cal, prot, carb, fat, fiber, serving, unit],
    });
  }
  console.log(`[SEED] ${COMPREHENSIVE_FOODS.length} comprehensive foods seeded successfully.`);
}

/**
 * Initialize database — tries Turso Cloud first, falls back to local libSQL
 */
export async function initDb() {
  try {
    console.log('[TURSO DB] Attempting connection to Turso Cloud:', cloudUrl);
    await createSchema(activeClient);
    await seedFoods(activeClient);
    console.log('🌿 [SUCCESS] Connected to Turso Cloud database and schema initialized.');
    return true;
  } catch (error) {
    console.warn(`⚠️ [TURSO CLOUD NOTICE] Cloud connection returned: ${error.message}`);

    if (!authToken || error.message.includes('401') || error.message.includes('auth')) {
      console.log('🔄 [FALLBACK ACTIVE] Switched to local libSQL database (file:nutricraft_local.db).');
      console.log('💡 [NOTE] To connect to Turso Cloud, run `turso db tokens create nutricraft-project123` and add TURSO_AUTH_TOKEN to .env.');

      activeClient = createClient({ url: 'file:nutricraft_local.db' });
      await createSchema(activeClient);
      await seedFoods(activeClient);
      console.log('🌿 [SUCCESS] Local libSQL database initialized and ready.');
      return true;
    }

    console.error('[DB FATAL] Could not initialize database:', error.message);
    return false;
  }
}

// Proxy db operations to whichever client is active
export const db = {
  execute: (...args) => activeClient.execute(...args),
  batch: (...args) => activeClient.batch(...args),
};

export default db;
