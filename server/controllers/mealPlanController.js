import { db } from '../db.js';
import { randomUUID } from 'crypto';
import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

function getAiClient() {
  if (!GEMINI_API_KEY) return null;
  return new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

/** Get start of the week (Monday) for a given date */
function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
}

// GET /api/meal-plan?week=2026-08-25
export async function getMealPlan(req, res) {
  try {
    const userId = req.user.userId || req.user.id;
    const weekStart = req.query.week || getWeekStart();

    const result = await db.execute({
      sql: `SELECT * FROM meal_plans WHERE user_id=? AND week_start_date=? ORDER BY day_of_week ASC, meal_type ASC`,
      args: [userId, weekStart],
    });

    // Grocery list
    const grocery = await db.execute({
      sql: 'SELECT * FROM grocery_lists WHERE user_id=? AND week_start_date=?',
      args: [userId, weekStart],
    });

    return res.json({
      success: true,
      weekStart,
      plan: result.rows,
      groceryList: grocery.rows[0] || null,
    });
  } catch (err) {
    console.error('[MEALPLAN] getMealPlan error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch meal plan.' });
  }
}

// POST /api/meal-plan/generate
export async function generateMealPlan(req, res) {
  try {
    const userId = req.user.userId || req.user.id;
    const weekStart = req.body.week || getWeekStart();

    // Get user profile
    const profileResult = await db.execute({ sql: 'SELECT * FROM profiles WHERE user_id=?', args: [userId] });
    const userResult = await db.execute({ sql: 'SELECT name FROM users WHERE id=?', args: [userId] });
    const profile = profileResult.rows[0];
    const userName = userResult.rows[0]?.name || 'User';

    const calTarget = profile?.daily_calorie_target || 2000;
    const protein = profile?.daily_protein_target || 120;
    const dietary = profile?.dietary_preference || 'none';
    const allergies = profile?.allergies || 'none';
    const goal = profile?.goal || 'maintain';

    const genai = getAiClient();
    let planData = [];

    if (genai) {
      const prompt = `Generate a 7-day meal plan for ${userName} with these requirements:
- Daily calorie target: ${calTarget} kcal
- Daily protein target: ${protein}g
- Goal: ${goal}
- Dietary preference: ${dietary}
- Allergies/restrictions: ${allergies}

Return ONLY a JSON array (no markdown, no explanation) with this exact structure:
[
  {
    "day": 1,
    "meals": [
      {"meal_type": "breakfast", "food_name": "...", "quantity_g": 200, "calories": 350, "protein": 20, "carbs": 45, "fat": 10, "notes": "..."},
      {"meal_type": "lunch", "food_name": "...", "quantity_g": 300, "calories": 500, "protein": 35, "carbs": 45, "fat": 15, "notes": "..."},
      {"meal_type": "dinner", "food_name": "...", "quantity_g": 300, "calories": 550, "protein": 40, "carbs": 50, "fat": 15, "notes": "..."},
      {"meal_type": "snack", "food_name": "...", "quantity_g": 100, "calories": 150, "protein": 10, "carbs": 15, "fat": 5, "notes": "..."}
    ]
  }
]

Include 7 days (day 1 through day 7). Use real common foods.`;

      const candidateModels = ['gemini-3.6-flash', 'gemini-3.1-pro-preview', 'gemini-2.5-flash'];
      for (const model of candidateModels) {
        try {
          const result = await genai.models.generateContent({
            model,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
          });
          const text = result.text || result.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
          const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          planData = JSON.parse(cleaned);
          if (Array.isArray(planData) && planData.length > 0) break;
        } catch (aiErr) {
          console.error(`[MEALPLAN] Model ${model} error:`, aiErr.message);
        }
      }
      if (!Array.isArray(planData) || planData.length === 0) {
        planData = generateFallbackPlan(calTarget, dietary);
      }
    } else {
      planData = generateFallbackPlan(calTarget, dietary);
    }

    // Clear existing plan for the week
    await db.execute({
      sql: 'DELETE FROM meal_plans WHERE user_id=? AND week_start_date=?',
      args: [userId, weekStart],
    });

    // Insert new plan
    const groceryItems = {};
    for (const day of planData) {
      for (const meal of day.meals || []) {
        const mealId = randomUUID();
        await db.execute({
          sql: `INSERT INTO meal_plans (id, user_id, week_start_date, day_of_week, meal_type, food_name, quantity_g, calories, protein, carbs, fat, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [mealId, userId, weekStart, day.day, meal.meal_type, meal.food_name,
            meal.quantity_g || 100, meal.calories || 0, meal.protein || 0,
            meal.carbs || 0, meal.fat || 0, meal.notes || ''],
        });
        const key = meal.food_name.toLowerCase();
        groceryItems[key] = (groceryItems[key] || 0) + (meal.quantity_g || 100);
      }
    }

    // Save grocery list
    const groceryArr = Object.entries(groceryItems).map(([name, qty]) => ({ name, quantity_g: Math.round(qty) }));
    const existingGrocery = await db.execute({
      sql: 'SELECT id FROM grocery_lists WHERE user_id=? AND week_start_date=?',
      args: [userId, weekStart],
    });
    if (existingGrocery.rows.length > 0) {
      await db.execute({
        sql: `UPDATE grocery_lists SET items=?, checked_state='{}', updated_at=datetime('now') WHERE user_id=? AND week_start_date=?`,
        args: [JSON.stringify(groceryArr), userId, weekStart],
      });
    } else {
      await db.execute({
        sql: `INSERT INTO grocery_lists (id, user_id, week_start_date, items) VALUES (?, ?, ?, ?)`,
        args: [randomUUID(), userId, weekStart, JSON.stringify(groceryArr)],
      });
    }

    const saved = await db.execute({
      sql: 'SELECT * FROM meal_plans WHERE user_id=? AND week_start_date=? ORDER BY day_of_week, meal_type',
      args: [userId, weekStart],
    });
    return res.json({ success: true, weekStart, plan: saved.rows });
  } catch (err) {
    console.error('[MEALPLAN] generateMealPlan error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate meal plan.' });
  }
}

// PUT /api/meal-plan/:id  — regenerate single slot
export async function regenerateSlot(req, res) {
  try {
    const userId = req.user.userId || req.user.id;
    const { id } = req.params;
    const { food_name, quantity_g, calories, protein, carbs, fat, notes } = req.body;

    const existing = await db.execute({ sql: 'SELECT * FROM meal_plans WHERE id=? AND user_id=?', args: [id, userId] });
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Meal plan slot not found.' });
    }

    await db.execute({
      sql: 'UPDATE meal_plans SET food_name=?, quantity_g=?, calories=?, protein=?, carbs=?, fat=?, notes=? WHERE id=? AND user_id=?',
      args: [food_name, quantity_g || 100, calories || 0, protein || 0, carbs || 0, fat || 0, notes || '', id, userId],
    });

    const updated = await db.execute({ sql: 'SELECT * FROM meal_plans WHERE id=?', args: [id] });
    return res.json({ success: true, slot: updated.rows[0] });
  } catch (err) {
    console.error('[MEALPLAN] regenerateSlot error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update meal plan slot.' });
  }
}

// POST /api/meal-plan/:id/log — log plan meal to food journal
export async function logPlanMeal(req, res) {
  try {
    const userId = req.user.userId || req.user.id;
    const { id } = req.params;

    const slotResult = await db.execute({ sql: 'SELECT * FROM meal_plans WHERE id=? AND user_id=?', args: [id, userId] });
    if (slotResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Meal plan slot not found.' });
    }

    const slot = slotResult.rows[0];
    const today = new Date().toISOString().slice(0, 10);
    const entryId = randomUUID();

    await db.execute({
      sql: `INSERT INTO food_entries (id, user_id, food_name, quantity_g, meal_type, source, calories, protein, carbs, fat, date)
            VALUES (?, ?, ?, ?, ?, 'meal_plan', ?, ?, ?, ?, ?)`,
      args: [entryId, userId, slot.food_name, slot.quantity_g, slot.meal_type, slot.calories, slot.protein, slot.carbs, slot.fat, today],
    });

    return res.json({ success: true, message: 'Meal logged to food journal.', entryId });
  } catch (err) {
    console.error('[MEALPLAN] logPlanMeal error:', err);
    return res.status(500).json({ success: false, message: 'Failed to log meal.' });
  }
}

// PATCH /api/meal-plan/grocery — update checked state
export async function updateGroceryChecked(req, res) {
  try {
    const userId = req.user.userId || req.user.id;
    const { week_start_date, checked_state } = req.body;

    await db.execute({
      sql: `UPDATE grocery_lists SET checked_state=?, updated_at=datetime('now') WHERE user_id=? AND week_start_date=?`,
      args: [JSON.stringify(checked_state), userId, week_start_date],
    });
    return res.json({ success: true });
  } catch (err) {
    console.error('[MEALPLAN] updateGroceryChecked error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update grocery list.' });
  }
}

/** Offline fallback plan when no Gemini key */
function generateFallbackPlan(calTarget, dietary) {
  const isVeg = dietary === 'vegetarian' || dietary === 'vegan';
  const protein = isVeg ? 'Tofu scramble' : 'Chicken breast';

  const template = [
    { meal_type: 'breakfast', food_name: 'Oatmeal with banana and almonds', quantity_g: 300, calories: Math.round(calTarget * 0.25), protein: 12, carbs: 55, fat: 8 },
    { meal_type: 'lunch',     food_name: isVeg ? 'Quinoa and chickpea salad' : 'Grilled chicken with brown rice', quantity_g: 350, calories: Math.round(calTarget * 0.35), protein: isVeg ? 18 : 35, carbs: 55, fat: 10 },
    { meal_type: 'dinner',    food_name: isVeg ? 'Dal with chapati and vegetables' : `${protein} with sweet potato`, quantity_g: 400, calories: Math.round(calTarget * 0.30), protein: 28, carbs: 45, fat: 12 },
    { meal_type: 'snack',     food_name: 'Greek yogurt with berries', quantity_g: 150, calories: Math.round(calTarget * 0.10), protein: 10, carbs: 18, fat: 3 },
  ];

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return days.map((_, i) => ({
    day: i + 1,
    meals: template.map((meal, j) => ({
      ...meal,
      food_name: j === 0 && i % 2 === 1 ? 'Whole grain toast with eggs and avocado' : meal.food_name,
    })),
  }));
}
