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

    const allPlans = await db.getList(`meal_plans/${userId}`);
    const weekPlans = allPlans
      .filter((p) => p.week_start_date === weekStart)
      .sort((a, b) => {
        if (a.day_of_week !== b.day_of_week) {
          return (a.day_of_week || 0) - (b.day_of_week || 0);
        }
        return (a.meal_type || '').localeCompare(b.meal_type || '');
      });

    // Grocery list
    const grocery = await db.getVal(`grocery_lists/${userId}/${weekStart}`);

    return res.json({
      success: true,
      weekStart,
      plan: weekPlans,
      groceryList: grocery || null,
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

    // Get user profile from Firebase RTDB
    const profile = await db.getVal(`profiles/${userId}`);
    const user = await db.getVal(`users/${userId}`);
    const userName = user?.name || 'User';

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

    // Clear existing plans for this week in Firebase RTDB
    const existingPlans = await db.getVal(`meal_plans/${userId}`);
    if (existingPlans) {
      for (const [key, plan] of Object.entries(existingPlans)) {
        if (plan && plan.week_start_date === weekStart) {
          await db.removeVal(`meal_plans/${userId}/${key}`);
        }
      }
    }

    // Insert new plan slots into Firebase RTDB
    const groceryItems = {};
    const savedSlots = [];

    for (const day of planData) {
      for (const meal of day.meals || []) {
        const mealId = randomUUID();
        const slotData = {
          id: mealId,
          user_id: userId,
          week_start_date: weekStart,
          day_of_week: day.day,
          meal_type: meal.meal_type,
          food_name: meal.food_name,
          quantity_g: meal.quantity_g || 100,
          calories: meal.calories || 0,
          protein: meal.protein || 0,
          carbs: meal.carbs || 0,
          fat: meal.fat || 0,
          notes: meal.notes || '',
          created_at: new Date().toISOString(),
        };

        await db.setVal(`meal_plans/${userId}/${mealId}`, slotData);
        savedSlots.push(slotData);

        const key = meal.food_name.toLowerCase();
        groceryItems[key] = (groceryItems[key] || 0) + (meal.quantity_g || 100);
      }
    }

    // Save grocery list to Firebase RTDB
    const groceryArr = Object.entries(groceryItems).map(([name, qty]) => ({
      name,
      quantity_g: Math.round(qty),
    }));

    const groceryData = {
      id: randomUUID(),
      user_id: userId,
      week_start_date: weekStart,
      items: groceryArr,
      checked_state: {},
      updated_at: new Date().toISOString(),
    };

    await db.setVal(`grocery_lists/${userId}/${weekStart}`, groceryData);

    return res.json({ success: true, weekStart, plan: savedSlots });
  } catch (err) {
    console.error('[MEALPLAN] generateMealPlan error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate meal plan.' });
  }
}

// PUT /api/meal-plan/:id — regenerate single slot
export async function regenerateSlot(req, res) {
  try {
    const userId = req.user.userId || req.user.id;
    const { id } = req.params;
    const { food_name, quantity_g, calories, protein, carbs, fat, notes } = req.body;

    const existing = await db.getVal(`meal_plans/${userId}/${id}`);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Meal plan slot not found.' });
    }

    const updatedSlot = {
      ...existing,
      food_name: food_name || existing.food_name,
      quantity_g: quantity_g != null ? Number(quantity_g) : existing.quantity_g,
      calories: calories != null ? Number(calories) : existing.calories,
      protein: protein != null ? Number(protein) : existing.protein,
      carbs: carbs != null ? Number(carbs) : existing.carbs,
      fat: fat != null ? Number(fat) : existing.fat,
      notes: notes != null ? notes : existing.notes,
      updated_at: new Date().toISOString(),
    };

    await db.setVal(`meal_plans/${userId}/${id}`, updatedSlot);

    return res.json({ success: true, slot: updatedSlot });
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

    const slot = await db.getVal(`meal_plans/${userId}/${id}`);
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Meal plan slot not found.' });
    }

    const today = new Date().toISOString().slice(0, 10);
    const entryId = randomUUID();

    const entryData = {
      id: entryId,
      user_id: userId,
      food_name: slot.food_name,
      quantity_g: slot.quantity_g || 100,
      meal_type: slot.meal_type || 'snack',
      source: 'meal_plan',
      calories: slot.calories || 0,
      protein: slot.protein || 0,
      carbs: slot.carbs || 0,
      fat: slot.fat || 0,
      date: today,
      created_at: new Date().toISOString(),
    };

    await db.setVal(`food_entries/${userId}/${entryId}`, entryData);

    return res.json({ success: true, message: 'Meal logged to food journal in Firebase.', entryId });
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

    const existing = await db.getVal(`grocery_lists/${userId}/${week_start_date}`);
    const updated = {
      ...existing,
      checked_state: checked_state || {},
      updated_at: new Date().toISOString(),
    };

    await db.setVal(`grocery_lists/${userId}/${week_start_date}`, updated);
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
