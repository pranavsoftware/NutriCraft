import { db } from '../db.js';
import { randomUUID } from 'crypto';

/**
 * Extract and normalize macronutrients from USDA FoodData Central foodNutrients array.
 * Supports nutrient lookups by nutrientNumber and nutrientName.
 * Handles both kcal and kJ units (converts kJ to kcal: kcal = kJ / 4.184).
 */
function extractUSDANutrients(foodNutrients = []) {
  let kcal = 0;
  let kj = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;
  let fiber = 0;

  for (const n of foodNutrients) {
    if (!n) continue;
    const num = String(n.nutrientNumber || '').trim();
    const name = String(n.nutrientName || '').toLowerCase();
    const unit = String(n.unitName || '').toUpperCase();
    const val = Number(n.value) || 0;

    // Energy / Calories (208 = kcal, 268 = kJ)
    if (num === '208' || (name.includes('energy') && (unit === 'KCAL' || unit === 'CAL'))) {
      kcal = val;
    } else if (num === '268' || (name.includes('energy') && unit === 'KJ')) {
      kj = val;
    }
    // Protein (203)
    else if (num === '203' || name === 'protein') {
      protein = val;
    }
    // Carbohydrates (205)
    else if (num === '205' || name.includes('carbohydrate')) {
      carbs = val;
    }
    // Total lipid / Fat (204)
    else if (num === '204' || name.includes('total lipid') || name === 'fat') {
      fat = val;
    }
    // Dietary Fiber (291)
    else if (num === '291' || name.includes('fiber')) {
      fiber = val;
    }
  }

  // If kcal not directly provided, convert kJ to kcal
  if (!kcal && kj > 0) {
    kcal = Math.round((kj / 4.184) * 10) / 10;
  }

  return {
    calories: Math.round(kcal * 10) / 10,
    protein: Math.round(protein * 10) / 10,
    carbs: Math.round(carbs * 10) / 10,
    fat: Math.round(fat * 10) / 10,
    fiber: Math.round(fiber * 10) / 10,
  };
}

/**
 * Normalizes a USDA FoodData Central item into NutriCraft's standard food schema.
 */
function normalizeUSDAFood(item) {
  if (!item || !item.description) return null;

  const nutrients = extractUSDANutrients(item.foodNutrients);
  const fdcId = item.fdcId;
  const id = `usda_${fdcId}`;

  // Preserve USDA serving size if provided; default to 100g
  const servingSize = Number(item.servingSize) > 0 ? Number(item.servingSize) : 100;
  const servingUnit = item.servingSizeUnit || item.householdServingFullText || 'g';

  return {
    id,
    name: item.description.trim(),
    brand: item.brandOwner || item.brandName || null,
    calories_per_100g: nutrients.calories,
    protein_per_100g: nutrients.protein,
    carbs_per_100g: nutrients.carbs,
    fat_per_100g: nutrients.fat,
    fiber_per_100g: nutrients.fiber,
    serving_size_g: servingSize,
    serving_unit: servingUnit,
    source: 'USDA',
    fdcId: fdcId,
    external_id: fdcId,
    created_at: new Date().toISOString(),
  };
}

/**
 * Search the Firebase foods table first; fall back to USDA FoodData Central API if < 3 results.
 * GET /api/foods/search?q=avocado&limit=10
 */
export async function searchFoods(req, res) {
  const q = (req.query.q || '').trim();
  const limit = Math.min(parseInt(req.query.limit || '20', 10), 50);

  if (!q || q.length < 2) {
    return res.status(400).json({ success: false, message: 'Query must be at least 2 characters.' });
  }

  try {
    const qLower = q.toLowerCase();
    const allFoods = await db.getVal('foods');
    const localMatches = [];

    // 1. Search existing Firebase RTDB foods
    if (allFoods) {
      for (const [id, food] of Object.entries(allFoods)) {
        if (food && food.name && food.name.toLowerCase().includes(qLower)) {
          localMatches.push({ id: food.id || id, ...food });
          if (localMatches.length >= limit) break;
        }
      }
    }

    // If Firebase produces at least 3 suitable results, return immediately
    if (localMatches.length >= 3) {
      console.log(`🔎 Food search: "${q}"`);
      console.log(`📦 Firebase results: ${localMatches.length} (sufficient, skipping USDA)`);
      return res.json({ success: true, source: 'firebase', foods: localMatches });
    }

    console.log(`🔎 Food search: "${q}"`);
    console.log(`📦 Firebase results: ${localMatches.length}`);

    // 2. USDA FoodData Central API fallback if configured
    const apiKey = process.env.USDA_FDC_API_KEY;
    if (!apiKey) {
      console.log('⚠️  USDA FoodData Central not configured (optional)');
      return res.json({ success: true, source: 'firebase', foods: localMatches });
    }

    console.log('🥗 USDA fallback triggered');
    let usdaFoods = [];

    try {
      const response = await fetch(
        `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: q,
            pageSize: Math.max(limit, 10),
          }),
          signal: AbortSignal.timeout(6000), // 6-second timeout
        }
      );

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.warn(`[FOOD] USDA API authorization failed (${response.status}). Check USDA_FDC_API_KEY.`);
        } else if (response.status === 429) {
          console.warn('[FOOD] USDA API rate limit reached (429).');
        } else {
          console.warn(`[FOOD] USDA API returned status ${response.status}.`);
        }
      } else {
        const data = await response.json();
        const rawItems = Array.isArray(data.foods) ? data.foods : [];

        // Normalize USDA items
        const normalizedItems = rawItems
          .map(normalizeUSDAFood)
          .filter((f) => f && f.name);

        console.log(`🥗 USDA results: ${normalizedItems.length}`);

        // Cache new USDA foods to Firebase RTDB (/foods/{foodId})
        let newlyCachedCount = 0;
        for (const food of normalizedItems) {
          try {
            const existing = await db.getVal(`foods/${food.id}`);
            if (!existing) {
              await db.setVal(`foods/${food.id}`, food);
              newlyCachedCount++;
            }
          } catch (cacheErr) {
            console.warn(`[FOOD] Failed to cache USDA food ${food.id}:`, cacheErr.message);
          }
        }

        if (newlyCachedCount > 0) {
          console.log(`💾 Cached ${newlyCachedCount} USDA foods to Firebase`);
        }

        usdaFoods = normalizedItems;
      }
    } catch (apiErr) {
      console.warn('[FOOD] USDA FoodData Central API error:', apiErr.message);
      // Fallback continues without crashing: return localMatches below
    }

    // 3. Combine Firebase results + USDA results (deduplicate)
    const existingIds = new Set(localMatches.map((f) => f.id));
    const existingNames = new Set(localMatches.map((f) => f.name.toLowerCase().trim()));
    const combined = [...localMatches];

    for (const item of usdaFoods) {
      const normalizedName = item.name.toLowerCase().trim();
      if (!existingIds.has(item.id) && !existingNames.has(normalizedName)) {
        combined.push(item);
        existingIds.add(item.id);
        existingNames.add(normalizedName);
      }
      if (combined.length >= limit) break;
    }

    console.log(`✅ Returning ${combined.length} food results`);

    const source =
      localMatches.length > 0 && usdaFoods.length > 0
        ? 'combined'
        : usdaFoods.length > 0
        ? 'usda'
        : 'firebase';

    return res.json({ success: true, source, foods: combined });
  } catch (err) {
    console.error('[FOOD] searchFoods error:', err);
    return res.status(500).json({ success: false, message: 'Food search failed.' });
  }
}

/**
 * GET /api/foods/:id
 */
export async function getFoodById(req, res) {
  try {
    const food = await db.getVal(`foods/${req.params.id}`);
    if (!food) {
      return res.status(404).json({ success: false, message: 'Food not found.' });
    }
    return res.json({ success: true, food: { id: food.id || req.params.id, ...food } });
  } catch (err) {
    console.error('[FOOD] getFoodById error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch food.' });
  }
}

/**
 * POST /api/foods (create custom food)
 */
export async function createFood(req, res) {
  try {
    const {
      name,
      calories_per_100g,
      protein_per_100g = 0,
      carbs_per_100g = 0,
      fat_per_100g = 0,
      fiber_per_100g = 0,
      serving_size_g = 100,
      serving_unit = 'g',
    } = req.body;

    if (!name || calories_per_100g == null) {
      return res.status(400).json({ success: false, message: 'name and calories_per_100g are required.' });
    }

    const id = `custom_${randomUUID()}`;
    const customFood = {
      id,
      name: name.trim(),
      calories_per_100g: Number(calories_per_100g),
      protein_per_100g: Number(protein_per_100g) || 0,
      carbs_per_100g: Number(carbs_per_100g) || 0,
      fat_per_100g: Number(fat_per_100g) || 0,
      fiber_per_100g: Number(fiber_per_100g) || 0,
      serving_size_g: Number(serving_size_g) || 100,
      serving_unit: serving_unit || 'g',
      source: 'custom',
      created_at: new Date().toISOString(),
    };

    await db.setVal(`foods/${id}`, customFood);
    return res.status(201).json({ success: true, food: customFood });
  } catch (err) {
    console.error('[FOOD] createFood error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create food.' });
  }
}
