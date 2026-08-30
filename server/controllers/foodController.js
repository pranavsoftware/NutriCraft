import { db } from '../db.js';
import { randomUUID } from 'crypto';
import axios from 'axios';

const NX_APP_ID = process.env.NUTRITIONIX_APP_ID;
const NX_APP_KEY = process.env.NUTRITIONIX_APP_KEY;

/**
 * Search the local foods table first; fall back to Nutritionix API if no results.
 * GET /api/foods/search?q=chicken&limit=10
 */
export async function searchFoods(req, res) {
  const q = (req.query.q || '').trim();
  const limit = Math.min(parseInt(req.query.limit || '20', 10), 50);

  if (!q || q.length < 2) {
    return res.status(400).json({ success: false, message: 'Query must be at least 2 characters.' });
  }

  try {
    // 1. Local search
    const localResult = await db.execute({
      sql: `SELECT * FROM foods WHERE name LIKE ? ORDER BY name LIMIT ?`,
      args: [`%${q}%`, limit],
    });

    if (localResult.rows.length >= 3) {
      return res.json({ success: true, source: 'local', foods: localResult.rows });
    }

    // 2. Nutritionix API fallback
    if (NX_APP_ID && NX_APP_KEY) {
      try {
        const { data } = await axios.get('https://trackapi.nutritionix.com/v2/search/instant', {
          headers: { 'x-app-id': NX_APP_ID, 'x-app-key': NX_APP_KEY },
          params: { query: q, self: false, branded: false, common: true },
          timeout: 5000,
        });

        const items = (data.common || []).slice(0, limit).map((item) => ({
          id: `nx_${item.food_name.replace(/\s+/g, '_').toLowerCase()}`,
          name: item.food_name,
          brand: item.brand_name || null,
          calories_per_100g: item.nf_calories || 0,
          protein_per_100g: item.nf_protein || 0,
          carbs_per_100g: item.nf_total_carbohydrate || 0,
          fat_per_100g: item.nf_total_fat || 0,
          fiber_per_100g: item.nf_dietary_fiber || 0,
          serving_size_g: item.serving_weight_grams || 100,
          serving_unit: item.serving_unit || 'g',
          source: 'nutritionix',
          external_id: item.nix_item_id || null,
        }));

        // Cache results to local DB
        for (const food of items) {
          await db.execute({
            sql: `INSERT OR IGNORE INTO foods (id, name, brand, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, serving_size_g, serving_unit, source, external_id)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [food.id, food.name, food.brand, food.calories_per_100g, food.protein_per_100g,
              food.carbs_per_100g, food.fat_per_100g, food.fiber_per_100g,
              food.serving_size_g, food.serving_unit, food.source, food.external_id],
          });
        }

        return res.json({ success: true, source: 'nutritionix', foods: items });
      } catch (apiErr) {
        console.warn('[FOOD] Nutritionix API error:', apiErr.message);
      }
    }

    // 3. Return local results even if < 3
    return res.json({ success: true, source: 'local', foods: localResult.rows });
  } catch (err) {
    console.error('[FOOD] searchFoods error:', err);
    return res.status(500).json({ success: false, message: 'Food search failed.' });
  }
}

// GET /api/foods/:id
export async function getFoodById(req, res) {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM foods WHERE id = ?',
      args: [req.params.id],
    });
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Food not found.' });
    }
    return res.json({ success: true, food: result.rows[0] });
  } catch (err) {
    console.error('[FOOD] getFoodById error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch food.' });
  }
}

// POST /api/foods (create custom food)
export async function createFood(req, res) {
  try {
    const { name, calories_per_100g, protein_per_100g = 0, carbs_per_100g = 0, fat_per_100g = 0, fiber_per_100g = 0, serving_size_g = 100, serving_unit = 'g' } = req.body;
    if (!name || calories_per_100g == null) {
      return res.status(400).json({ success: false, message: 'name and calories_per_100g are required.' });
    }
    const id = `custom_${randomUUID()}`;
    await db.execute({
      sql: `INSERT INTO foods (id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, serving_size_g, serving_unit, source)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'custom')`,
      args: [id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, serving_size_g, serving_unit],
    });
    const result = await db.execute({ sql: 'SELECT * FROM foods WHERE id = ?', args: [id] });
    return res.status(201).json({ success: true, food: result.rows[0] });
  } catch (err) {
    console.error('[FOOD] createFood error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create food.' });
  }
}
