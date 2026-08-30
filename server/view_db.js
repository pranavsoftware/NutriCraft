import { db, initDb } from './db.js';

async function main() {
  await initDb();
  console.clear?.();
  console.log('\n======================================================');
  console.log('         🥗 NUTRICRAFT DATABASE VIEWER 📊            ');
  console.log('======================================================\n');

  console.log('📌 1. REGISTERED USERS');
  console.log('------------------------------------------------------');
  const users = await db.execute('SELECT id, name, email, is_verified, created_at FROM users');
  console.table(users.rows);

  console.log('\n📌 2. PROFILES & BIOMETRICS');
  console.log('------------------------------------------------------');
  const profiles = await db.execute('SELECT user_id, age, height_cm, weight_kg, gender, goal, daily_calorie_target, daily_protein_target, daily_carb_target, daily_fat_target FROM profiles');
  console.table(profiles.rows);

  console.log('\n📌 3. FOOD JOURNAL ENTRIES (LOGGED MEALS)');
  console.log('------------------------------------------------------');
  const entries = await db.execute('SELECT food_name, meal_type, quantity_g, calories, protein, carbs, fat, source, date FROM food_entries ORDER BY created_at DESC');
  console.table(entries.rows);

  console.log('\n📌 4. WEIGHT LOGS HISTORY');
  console.log('------------------------------------------------------');
  const weights = await db.execute('SELECT weight_kg, logged_at FROM weight_logs ORDER BY logged_at DESC');
  console.table(weights.rows);

  console.log('\n📌 5. AI CHAT MESSAGES');
  console.log('------------------------------------------------------');
  const chats = await db.execute('SELECT role, SUBSTR(content, 1, 60) AS content_preview, created_at FROM chat_messages ORDER BY created_at DESC LIMIT 10');
  console.table(chats.rows);

  console.log('\n📌 6. 7-DAY MEAL PLANS');
  console.log('------------------------------------------------------');
  const plans = await db.execute('SELECT week_start_date, day_of_week, meal_type, food_name, calories, protein, carbs, fat FROM meal_plans ORDER BY day_of_week ASC, meal_type ASC LIMIT 10');
  console.table(plans.rows);

  console.log('\n📁 Local Database File: Project/nutricraft_local.db');
  console.log('======================================================\n');
  process.exit(0);
}

main().catch(err => {
  console.error('Error viewing database:', err);
  process.exit(1);
});
