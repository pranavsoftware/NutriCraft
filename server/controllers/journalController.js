import { db } from '../db.js';
import { randomUUID } from 'crypto';

/** Helper: compute macros for an entry based on food nutritional data & quantity */
function computeMacros(food, quantity_g) {
  const factor = quantity_g / 100;
  return {
    calories: Math.round((food.calories_per_100g || 0) * factor * 10) / 10,
    protein:  Math.round((food.protein_per_100g  || 0) * factor * 10) / 10,
    carbs:    Math.round((food.carbs_per_100g    || 0) * factor * 10) / 10,
    fat:      Math.round((food.fat_per_100g      || 0) * factor * 10) / 10,
  };
}

// GET /api/journal/entries?date=2026-08-30
export async function getEntries(req, res) {
  try {
    const userId = req.user.userId || req.user.id;
    const date = req.query.date || new Date().toISOString().slice(0, 10);

    const allUserEntries = await db.getList(`food_entries/${userId}`);
    // Filter entries for the requested date
    const dateEntries = allUserEntries.filter((e) => e.date === date);

    // Group by meal type
    const grouped = { breakfast: [], lunch: [], dinner: [], snack: [] };
    for (const row of dateEntries) {
      const slot = row.meal_type?.toLowerCase() || 'snack';
      if (!grouped[slot]) grouped[slot] = [];
      grouped[slot].push(row);
    }

    // Daily totals
    const totals = dateEntries.reduce(
      (acc, r) => ({
        calories: acc.calories + (Number(r.calories) || 0),
        protein:  acc.protein  + (Number(r.protein)  || 0),
        carbs:    acc.carbs    + (Number(r.carbs)     || 0),
        fat:      acc.fat      + (Number(r.fat)       || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    return res.json({
      success: true,
      date,
      entries: grouped,
      totals: {
        calories: Math.round(totals.calories * 10) / 10,
        protein:  Math.round(totals.protein  * 10) / 10,
        carbs:    Math.round(totals.carbs    * 10) / 10,
        fat:      Math.round(totals.fat      * 10) / 10,
      },
      allEntries: dateEntries,
    });
  } catch (err) {
    console.error('[JOURNAL] getEntries error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch journal entries.' });
  }
}

// POST /api/journal/entries
export async function addEntry(req, res) {
  try {
    const userId = req.user.userId || req.user.id;
    const { food_id, food_name, quantity_g = 100, meal_type = 'snack', source = 'manual', date, calories, protein, carbs, fat } = req.body;

    if (!food_name) {
      return res.status(400).json({ success: false, message: 'food_name is required.' });
    }

    const entryDate = date || new Date().toISOString().slice(0, 10);
    const qty = Number(quantity_g) || 100;
    let macros = {
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
    };

    // If food_id provided and no macros given, compute from Firebase foods table
    if (food_id && !calories) {
      const food = await db.getVal(`foods/${food_id}`);
      if (food) {
        macros = computeMacros(food, qty);
      }
    }

    const id = randomUUID();
    const now = new Date().toISOString();

    const entryData = {
      id,
      user_id: userId,
      food_id: food_id || null,
      food_name: food_name.trim(),
      quantity_g: qty,
      meal_type: (meal_type || 'snack').toLowerCase(),
      source,
      calories: Math.round(macros.calories * 10) / 10,
      protein: Math.round(macros.protein * 10) / 10,
      carbs: Math.round(macros.carbs * 10) / 10,
      fat: Math.round(macros.fat * 10) / 10,
      date: entryDate,
      created_at: now,
    };

    // Save to Firebase RTDB (/food_entries/{userId}/{id})
    await db.setVal(`food_entries/${userId}/${id}`, entryData);

    return res.status(201).json({ success: true, entry: entryData });
  } catch (err) {
    console.error('[JOURNAL] addEntry error:', err);
    return res.status(500).json({ success: false, message: 'Failed to add journal entry.' });
  }
}

// PUT /api/journal/entries/:id
export async function updateEntry(req, res) {
  try {
    const userId = req.user.userId || req.user.id;
    const { id } = req.params;
    const { quantity_g, meal_type } = req.body;

    // Verify ownership in Firebase RTDB
    const existing = await db.getVal(`food_entries/${userId}/${id}`);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Entry not found.' });
    }

    const newQty = quantity_g != null ? Number(quantity_g) : existing.quantity_g;

    // Recompute macros if food_id exists
    let macros = {
      calories: existing.calories,
      protein: existing.protein,
      carbs: existing.carbs,
      fat: existing.fat,
    };

    if (existing.food_id && quantity_g != null) {
      const food = await db.getVal(`foods/${existing.food_id}`);
      if (food) {
        macros = computeMacros(food, newQty);
      }
    }

    const updatedData = {
      ...existing,
      quantity_g: newQty,
      meal_type: meal_type ? meal_type.toLowerCase() : existing.meal_type,
      calories: Math.round(macros.calories * 10) / 10,
      protein: Math.round(macros.protein * 10) / 10,
      carbs: Math.round(macros.carbs * 10) / 10,
      fat: Math.round(macros.fat * 10) / 10,
      updated_at: new Date().toISOString(),
    };

    await db.setVal(`food_entries/${userId}/${id}`, updatedData);

    return res.json({ success: true, entry: updatedData });
  } catch (err) {
    console.error('[JOURNAL] updateEntry error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update entry.' });
  }
}

// DELETE /api/journal/entries/:id
export async function deleteEntry(req, res) {
  try {
    const userId = req.user.userId || req.user.id;
    const { id } = req.params;

    const existing = await db.getVal(`food_entries/${userId}/${id}`);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Entry not found.' });
    }

    await db.removeVal(`food_entries/${userId}/${id}`);
    return res.json({ success: true, message: 'Entry deleted from Firebase.' });
  } catch (err) {
    console.error('[JOURNAL] deleteEntry error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete entry.' });
  }
}
