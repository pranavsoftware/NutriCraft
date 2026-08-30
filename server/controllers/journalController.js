import { db } from '../db.js';
import { randomUUID } from 'crypto';

/** Helper: compute macros for an entry based on food nutritional data & quantity */
function computeMacros(food, quantity_g) {
  const factor = quantity_g / 100;
  return {
    calories: Math.round(food.calories_per_100g * factor * 10) / 10,
    protein:  Math.round(food.protein_per_100g  * factor * 10) / 10,
    carbs:    Math.round(food.carbs_per_100g    * factor * 10) / 10,
    fat:      Math.round(food.fat_per_100g      * factor * 10) / 10,
  };
}

// GET /api/journal/entries?date=2026-08-30
export async function getEntries(req, res) {
  try {
    const userId = req.user.userId;
    const date = req.query.date || new Date().toISOString().slice(0, 10);

    const result = await db.execute({
      sql: `SELECT fe.*, f.serving_unit FROM food_entries fe
            LEFT JOIN foods f ON fe.food_id = f.id
            WHERE fe.user_id = ? AND fe.date = ?
            ORDER BY fe.created_at ASC`,
      args: [userId, date],
    });

    // Group by meal type
    const grouped = { breakfast: [], lunch: [], dinner: [], snack: [] };
    for (const row of result.rows) {
      const slot = row.meal_type?.toLowerCase() || 'snack';
      if (!grouped[slot]) grouped[slot] = [];
      grouped[slot].push(row);
    }

    // Daily totals
    const totals = result.rows.reduce(
      (acc, r) => ({
        calories: acc.calories + (r.calories || 0),
        protein:  acc.protein  + (r.protein  || 0),
        carbs:    acc.carbs    + (r.carbs     || 0),
        fat:      acc.fat      + (r.fat       || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    return res.json({ success: true, date, entries: grouped, totals, allEntries: result.rows });
  } catch (err) {
    console.error('[JOURNAL] getEntries error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch journal entries.' });
  }
}

// POST /api/journal/entries
export async function addEntry(req, res) {
  try {
    const userId = req.user.userId;
    const { food_id, food_name, quantity_g = 100, meal_type = 'snack', source = 'manual', date, calories, protein, carbs, fat } = req.body;

    if (!food_name) {
      return res.status(400).json({ success: false, message: 'food_name is required.' });
    }

    const entryDate = date || new Date().toISOString().slice(0, 10);
    let macros = { calories: calories || 0, protein: protein || 0, carbs: carbs || 0, fat: fat || 0 };

    // If food_id provided and no macros given, compute from food table
    if (food_id && !calories) {
      const foodResult = await db.execute({ sql: 'SELECT * FROM foods WHERE id = ?', args: [food_id] });
      if (foodResult.rows.length > 0) {
        macros = computeMacros(foodResult.rows[0], quantity_g);
      }
    }

    const id = randomUUID();
    await db.execute({
      sql: `INSERT INTO food_entries (id, user_id, food_id, food_name, quantity_g, meal_type, source, calories, protein, carbs, fat, date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, userId, food_id || null, food_name, quantity_g, meal_type, source,
        macros.calories, macros.protein, macros.carbs, macros.fat, entryDate],
    });

    const result = await db.execute({ sql: 'SELECT * FROM food_entries WHERE id = ?', args: [id] });
    return res.status(201).json({ success: true, entry: result.rows[0] });
  } catch (err) {
    console.error('[JOURNAL] addEntry error:', err);
    return res.status(500).json({ success: false, message: 'Failed to add journal entry.' });
  }
}

// PUT /api/journal/entries/:id
export async function updateEntry(req, res) {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { quantity_g, meal_type } = req.body;

    // Verify ownership
    const existing = await db.execute({ sql: 'SELECT * FROM food_entries WHERE id=? AND user_id=?', args: [id, userId] });
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Entry not found.' });
    }

    const entry = existing.rows[0];
    const newQty = quantity_g || entry.quantity_g;

    // Recompute macros if food_id exists
    let macros = { calories: entry.calories, protein: entry.protein, carbs: entry.carbs, fat: entry.fat };
    if (entry.food_id && quantity_g) {
      const foodResult = await db.execute({ sql: 'SELECT * FROM foods WHERE id = ?', args: [entry.food_id] });
      if (foodResult.rows.length > 0) {
        macros = computeMacros(foodResult.rows[0], newQty);
      }
    }

    await db.execute({
      sql: `UPDATE food_entries SET quantity_g=?, meal_type=?, calories=?, protein=?, carbs=?, fat=? WHERE id=? AND user_id=?`,
      args: [newQty, meal_type || entry.meal_type, macros.calories, macros.protein, macros.carbs, macros.fat, id, userId],
    });

    const updated = await db.execute({ sql: 'SELECT * FROM food_entries WHERE id=?', args: [id] });
    return res.json({ success: true, entry: updated.rows[0] });
  } catch (err) {
    console.error('[JOURNAL] updateEntry error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update entry.' });
  }
}

// DELETE /api/journal/entries/:id
export async function deleteEntry(req, res) {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const existing = await db.execute({ sql: 'SELECT id FROM food_entries WHERE id=? AND user_id=?', args: [id, userId] });
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Entry not found.' });
    }

    await db.execute({ sql: 'DELETE FROM food_entries WHERE id=? AND user_id=?', args: [id, userId] });
    return res.json({ success: true, message: 'Entry deleted.' });
  } catch (err) {
    console.error('[JOURNAL] deleteEntry error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete entry.' });
  }
}
