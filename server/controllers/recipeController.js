import { db } from '../db.js';

const getApiKey = () => process.env.THEMEALDB_API_KEY || '1';
const getBaseUrl = () => process.env.THEMEALDB_BASE_URL || 'https://www.themealdb.com/api/json/v1';

const buildUrl = (endpoint) => `${getBaseUrl()}/${getApiKey()}/${endpoint}`;

/**
 * Normalizes a full TheMealDB recipe object into NutriCraft's internal recipe format.
 */
export function normalizeMeal(meal) {
  if (!meal) return null;

  // Extract ingredients and measurements dynamically
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];

    if (ingredient && typeof ingredient === 'string' && ingredient.trim() !== '') {
      ingredients.push({
        name: ingredient.trim(),
        measure: measure && typeof measure === 'string' ? measure.trim() : '',
      });
    }
  }

  // Parse tags
  let tags = [];
  if (meal.strTags) {
    if (Array.isArray(meal.strTags)) {
      tags = meal.strTags;
    } else if (typeof meal.strTags === 'string') {
      tags = meal.strTags.split(',').map((t) => t.trim()).filter(Boolean);
    }
  }

  return {
    id: String(meal.idMeal || meal.id),
    name: meal.strMeal || meal.name || 'Untitled Recipe',
    image: meal.strMealThumb || meal.image || '',
    category: meal.strCategory || meal.category || 'General',
    area: meal.strArea || meal.area || 'International',
    instructions: meal.strInstructions || meal.instructions || '',
    ingredients,
    tags,
    youtubeUrl: meal.strYoutube || meal.youtubeUrl || null,
    sourceUrl: meal.strSource || meal.sourceUrl || null,
    provider: 'TheMealDB',
    cachedAt: meal.cachedAt || new Date().toISOString(),
  };
}

/**
 * Helper to cache a normalized recipe in Firebase RTDB under /recipes/{id}.
 */
async function cacheRecipe(recipe) {
  if (!recipe || !recipe.id) return;
  try {
    const existing = await db.getVal(`recipes/${recipe.id}`);
    if (!existing) {
      await db.setVal(`recipes/${recipe.id}`, recipe);
      console.log(`💾 [RECIPES] Cached recipe "${recipe.name}" (ID: ${recipe.id}) in Firebase RTDB`);
    }
  } catch (err) {
    console.warn(`[RECIPES] Cache write error for ${recipe.id}:`, err.message);
  }
}

/**
 * 1. SEARCH RECIPES
 * GET /api/recipes/search?q=chicken
 */
export async function searchRecipes(req, res) {
  const q = (req.query.q || '').trim();
  if (!q) {
    return res.status(400).json({ success: false, message: 'Search query "q" is required.' });
  }

  try {
    console.log(`🔎 [RECIPES] Search request: "${q}"`);
    const url = buildUrl(`search.php?s=${encodeURIComponent(q)}`);
    const response = await fetch(url, { signal: AbortSignal.timeout(6000) });

    if (!response.ok) {
      throw new Error(`TheMealDB returned HTTP ${response.status}`);
    }

    const data = await response.json();
    const rawMeals = Array.isArray(data.meals) ? data.meals : [];
    const recipes = rawMeals.map(normalizeMeal).filter(Boolean);

    // Cache individual meals to Firebase RTDB in the background
    for (const recipe of recipes) {
      cacheRecipe(recipe).catch(() => {});
    }

    console.log(`✅ [RECIPES] Found ${recipes.length} recipes for "${q}"`);
    return res.json({ success: true, count: recipes.length, recipes });
  } catch (err) {
    console.warn('[RECIPES] TheMealDB search API failed:', err.message);

    // Fallback: search Firebase RTDB cached recipes
    try {
      const allCached = await db.getVal('recipes');
      const fallbackMatches = [];
      if (allCached) {
        const qLower = q.toLowerCase();
        for (const [id, r] of Object.entries(allCached)) {
          if (r && r.name && r.name.toLowerCase().includes(qLower)) {
            fallbackMatches.push({ id, ...r });
          }
        }
      }
      console.log(`📦 [RECIPES] Fallback served ${fallbackMatches.length} cached recipes from Firebase RTDB`);
      return res.json({ success: true, source: 'firebase_fallback', count: fallbackMatches.length, recipes: fallbackMatches });
    } catch (fbErr) {
      return res.status(500).json({ success: false, message: 'Recipe search currently unavailable.' });
    }
  }
}

/**
 * 2. GET RANDOM RECIPE (Featured Recipe)
 * GET /api/recipes/random
 */
export async function getRandomRecipe(req, res) {
  try {
    const url = buildUrl('random.php');
    const response = await fetch(url, { signal: AbortSignal.timeout(6000) });

    if (!response.ok) {
      throw new Error(`TheMealDB returned HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!data.meals || data.meals.length === 0) {
      return res.status(404).json({ success: false, message: 'No random recipe found.' });
    }

    const recipe = normalizeMeal(data.meals[0]);
    // Cache to Firebase RTDB
    await cacheRecipe(recipe);

    return res.json({ success: true, recipe });
  } catch (err) {
    console.warn('[RECIPES] TheMealDB random API failed:', err.message);

    // Fallback: Pick a random cached recipe from Firebase RTDB if available
    try {
      const allCached = await db.getVal('recipes');
      if (allCached) {
        const keys = Object.keys(allCached);
        if (keys.length > 0) {
          const randomKey = keys[Math.floor(Math.random() * keys.length)];
          const recipe = allCached[randomKey];
          return res.json({ success: true, source: 'firebase_fallback', recipe });
        }
      }
    } catch {
      // Ignore
    }

    return res.status(500).json({ success: false, message: 'Could not fetch featured recipe.' });
  }
}

/**
 * 3. GET RECIPE DETAILS BY ID (With Firebase Caching)
 * GET /api/recipes/:id
 */
export async function getRecipeById(req, res) {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ success: false, message: 'Recipe ID is required.' });
  }

  try {
    // 1. Check Firebase RTDB cache first
    const cached = await db.getVal(`recipes/${id}`);
    if (cached && cached.name && cached.ingredients && cached.ingredients.length > 0) {
      console.log(`⚡ [RECIPES] Recipe ${id} ("${cached.name}") served from Firebase cache`);
      return res.json({ success: true, source: 'firebase', recipe: cached });
    }

    // 2. Fetch from TheMealDB lookup endpoint
    console.log(`🌐 [RECIPES] Fetching recipe ${id} from TheMealDB lookup API...`);
    const url = buildUrl(`lookup.php?i=${encodeURIComponent(id)}`);
    const response = await fetch(url, { signal: AbortSignal.timeout(6000) });

    if (!response.ok) {
      throw new Error(`TheMealDB lookup returned HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!data.meals || data.meals.length === 0) {
      return res.status(404).json({ success: false, message: `Recipe with ID ${id} not found.` });
    }

    const recipe = normalizeMeal(data.meals[0]);

    // 3. Cache to Firebase RTDB for future instant retrievals
    await cacheRecipe(recipe);

    return res.json({ success: true, source: 'themealdb', recipe });
  } catch (err) {
    console.error(`[RECIPES] Error fetching recipe ${id}:`, err.message);

    // If cached version exists, return it
    try {
      const cached = await db.getVal(`recipes/${id}`);
      if (cached) {
        return res.json({ success: true, source: 'firebase_fallback', recipe: cached });
      }
    } catch {}

    return res.status(500).json({ success: false, message: 'Failed to retrieve recipe details.' });
  }
}

/**
 * 4. GET RECIPE CATEGORIES
 * GET /api/recipes/categories
 */
export async function getCategories(req, res) {
  try {
    const url = buildUrl('categories.php');
    const response = await fetch(url, { signal: AbortSignal.timeout(6000) });

    if (!response.ok) {
      throw new Error(`TheMealDB returned HTTP ${response.status}`);
    }

    const data = await response.json();
    const rawCategories = Array.isArray(data.categories) ? data.categories : [];
    const categories = rawCategories.map((c) => ({
      id: c.idCategory,
      name: c.strCategory,
      image: c.strCategoryThumb,
      description: c.strCategoryDescription || '',
    }));

    return res.json({ success: true, count: categories.length, categories });
  } catch (err) {
    console.warn('[RECIPES] TheMealDB categories API error:', err.message);
    // Hardcoded standard fallback categories if network/external API fails
    const fallbackCategories = [
      'Beef', 'Chicken', 'Dessert', 'Lamb', 'Miscellaneous',
      'Pasta', 'Pork', 'Seafood', 'Side', 'Starter',
      'Vegan', 'Vegetarian', 'Breakfast', 'Goat',
    ].map((name, i) => ({ id: String(i + 1), name, image: '', description: '' }));

    return res.json({ success: true, source: 'fallback', count: fallbackCategories.length, categories: fallbackCategories });
  }
}

/**
 * 5. FILTER BY CATEGORY
 * GET /api/recipes/category/:category
 */
export async function getRecipesByCategory(req, res) {
  const { category } = req.params;
  if (!category) {
    return res.status(400).json({ success: false, message: 'Category is required.' });
  }

  try {
    const url = buildUrl(`filter.php?c=${encodeURIComponent(category)}`);
    const response = await fetch(url, { signal: AbortSignal.timeout(6000) });

    if (!response.ok) {
      throw new Error(`TheMealDB returned HTTP ${response.status}`);
    }

    const data = await response.json();
    const rawMeals = Array.isArray(data.meals) ? data.meals : [];
    const recipes = rawMeals.map((m) => ({
      id: String(m.idMeal),
      name: m.strMeal,
      image: m.strMealThumb,
      category,
      area: m.strArea || null,
      provider: 'TheMealDB',
    }));

    return res.json({ success: true, category, count: recipes.length, recipes });
  } catch (err) {
    console.error(`[RECIPES] Filter by category "${category}" error:`, err.message);
    return res.status(500).json({ success: false, message: 'Failed to filter recipes by category.' });
  }
}

/**
 * 6. FILTER BY CUISINE / AREA
 * GET /api/recipes/area/:area
 */
export async function getRecipesByArea(req, res) {
  const { area } = req.params;
  if (!area) {
    return res.status(400).json({ success: false, message: 'Area is required.' });
  }

  try {
    const url = buildUrl(`filter.php?a=${encodeURIComponent(area)}`);
    const response = await fetch(url, { signal: AbortSignal.timeout(6000) });

    if (!response.ok) {
      throw new Error(`TheMealDB returned HTTP ${response.status}`);
    }

    const data = await response.json();
    const rawMeals = Array.isArray(data.meals) ? data.meals : [];
    const recipes = rawMeals.map((m) => ({
      id: String(m.idMeal),
      name: m.strMeal,
      image: m.strMealThumb,
      area,
      category: m.strCategory || null,
      provider: 'TheMealDB',
    }));

    return res.json({ success: true, area, count: recipes.length, recipes });
  } catch (err) {
    console.error(`[RECIPES] Filter by area "${area}" error:`, err.message);
    return res.status(500).json({ success: false, message: 'Failed to filter recipes by cuisine.' });
  }
}

/**
 * 7. FILTER BY INGREDIENT
 * GET /api/recipes/ingredient/:ingredient
 */
export async function getRecipesByIngredient(req, res) {
  const { ingredient } = req.params;
  if (!ingredient) {
    return res.status(400).json({ success: false, message: 'Ingredient is required.' });
  }

  try {
    const url = buildUrl(`filter.php?i=${encodeURIComponent(ingredient)}`);
    const response = await fetch(url, { signal: AbortSignal.timeout(6000) });

    if (!response.ok) {
      throw new Error(`TheMealDB returned HTTP ${response.status}`);
    }

    const data = await response.json();
    const rawMeals = Array.isArray(data.meals) ? data.meals : [];
    const recipes = rawMeals.map((m) => ({
      id: String(m.idMeal),
      name: m.strMeal,
      image: m.strMealThumb,
      ingredient,
      provider: 'TheMealDB',
    }));

    return res.json({ success: true, ingredient, count: recipes.length, recipes });
  } catch (err) {
    console.error(`[RECIPES] Filter by ingredient "${ingredient}" error:`, err.message);
    return res.status(500).json({ success: false, message: 'Failed to filter recipes by ingredient.' });
  }
}
