import { GoogleGenAI } from '@google/genai';
import axios from 'axios';

function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

/**
 * Fetch verified product data from Open Food Facts by barcode
 */
async function lookupOpenFoodFacts(barcode) {
  try {
    const cleanBarcode = barcode.replace(/[^0-9]/g, '');
    if (!cleanBarcode) return null;

    const res = await axios.get(`https://world.openfoodfacts.org/api/v0/product/${cleanBarcode}.json`, {
      headers: { 'User-Agent': 'NutriCraftApp/1.0 (raybanpranav@gmail.com)' },
      timeout: 4500,
    });

    if (res.data?.status === 1 && res.data?.product) {
      const p = res.data.product;
      const nutriments = p.nutriments || {};

      const name = p.product_name || p.product_name_en || p.generic_name || 'Packaged Food Product';
      const brand = p.brands || p.brand_owner || '';
      
      // Serving size in grams (default 100g)
      let servingG = 100;
      if (p.serving_quantity && !isNaN(Number(p.serving_quantity))) {
        servingG = Number(p.serving_quantity);
      } else if (p.serving_size) {
        const match = p.serving_size.match(/(\d+(?:\.\d+)?)\s*g/i);
        if (match) servingG = Number(match[1]);
      }

      const cal100 = Number(nutriments['energy-kcal_100g'] ?? nutriments['energy-kcal'] ?? (nutriments['energy_100g'] ? nutriments['energy_100g'] / 4.184 : 0));
      const protein100 = Number(nutriments.proteins_100g ?? nutriments.proteins ?? 0);
      const carbs100 = Number(nutriments.carbohydrates_100g ?? nutriments.carbohydrates ?? 0);
      const fat100 = Number(nutriments.fat_100g ?? nutriments.fat ?? 0);

      const factor = servingG / 100;

      return {
        name: brand ? `${name} (${brand})` : name,
        brand,
        confidence: 0.99,
        quantity_g: Math.round(servingG),
        calories: Math.round(cal100 * factor),
        protein: Math.round(protein100 * factor * 10) / 10,
        carbs: Math.round(carbs100 * factor * 10) / 10,
        fat: Math.round(fat100 * factor * 10) / 10,
      };
    }
  } catch (err) {
    console.log('[BARCODE] Open Food Facts lookup notice:', err.message);
  }
  return null;
}

/**
 * POST /api/ai-analyzer/analyze
 * Body: { imageBase64: "data:image/jpeg;base64,..." } OR { barcodeText: "..." }
 */
export async function analyzeFood(req, res) {
  try {
    const { imageBase64, barcodeText } = req.body;

    if (!imageBase64 && !barcodeText) {
      return res.status(400).json({ success: false, message: 'Either imageBase64 or barcodeText is required.' });
    }

    // ── BARCODE PROCESSING ──────────────────────────────────────────────────
    if (barcodeText) {
      const cleanBarcode = barcodeText.trim();

      // 1. First attempt: Query Open Food Facts global verified database
      const verifiedProduct = await lookupOpenFoodFacts(cleanBarcode);
      if (verifiedProduct) {
        console.log(`[BARCODE VERIFIED] Found in Open Food Facts: ${verifiedProduct.name}`);
        return res.json({
          success: true,
          source: 'open_food_facts',
          foods: [verifiedProduct],
        });
      }

      // 2. Second attempt: Intelligent Gemini AI barcode resolution
      const genai = getAiClient();
      if (genai) {
        const prompt = `You are a product database. A user scanned barcode: "${cleanBarcode}".
Identify the food product and provide accurate nutritional information per 100g.
Return ONLY a valid JSON object (no markdown, no backticks):
{
  "name": "Full Product Name",
  "brand": "Brand Name",
  "confidence": 0.88,
  "calories_per_100g": 350,
  "protein_per_100g": 10,
  "carbs_per_100g": 60,
  "fat_per_100g": 8,
  "typical_serving_g": 100
}`;

        const candidateModels = ['gemini-3.6-flash', 'gemini-3.1-pro-preview'];
        for (const model of candidateModels) {
          try {
            const result = await genai.models.generateContent({
              model,
              contents: prompt,
            });

            const text = result.text || result.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
            const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const food = JSON.parse(cleaned);
            const qty = food.typical_serving_g || 100;
            const factor = qty / 100;

            console.log(`[BARCODE GEMINI] Resolved via ${model}: ${food.name}`);
            return res.json({
              success: true,
              source: 'gemini_ai',
              foods: [{
                name: food.brand ? `${food.name} (${food.brand})` : (food.name || `Barcode ${cleanBarcode}`),
                brand: food.brand,
                confidence: food.confidence || 0.85,
                quantity_g: qty,
                calories: Math.round((food.calories_per_100g || 0) * factor),
                protein: Math.round((food.protein_per_100g || 0) * factor * 10) / 10,
                carbs: Math.round((food.carbs_per_100g || 0) * factor * 10) / 10,
                fat: Math.round((food.fat_per_100g || 0) * factor * 10) / 10,
              }],
            });
          } catch (aiErr) {
            console.error(`[AI ANALYZER] Model ${model} barcode error:`, aiErr.message);
          }
        }
      }

      // 3. Fallback generic response if barcode is completely unknown
      return res.json({
        success: true,
        source: 'manual_fallback',
        foods: [{
          name: `Scanned Item (${cleanBarcode})`,
          confidence: 0.7,
          quantity_g: 100,
          calories: 200,
          protein: 5,
          carbs: 25,
          fat: 8,
        }],
      });
    }

    // ── IMAGE PROCESSING WITH GEMINI VISION ─────────────────────────────────
    const genai = getAiClient();
    if (!genai) {
      return res.json({
        success: true,
        simulated: true,
        message: 'Add GEMINI_API_KEY to .env for real AI image analysis.',
        foods: [
          { name: 'Mixed Meal Plate', confidence: 0.85, quantity_g: 250, calories: 350, protein: 20, carbs: 40, fat: 12 },
        ],
      });
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const mimeMatch = imageBase64.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

    const prompt = `Analyze this food image and identify all visible food items.
For each item, estimate the portion size in grams and the nutritional content (calories, protein, carbs, fat).
Return ONLY a valid JSON array (no markdown, no backticks, no code fence):
[
  {
    "name": "Food name",
    "confidence": 0.92,
    "quantity_g": 150,
    "calories": 300,
    "protein": 25,
    "carbs": 20,
    "fat": 10
  }
]
Be realistic about portion sizes. List each distinct food item separately.`;

    const candidateModels = ['gemini-3.6-flash', 'gemini-3.1-pro-preview'];
    for (const model of candidateModels) {
      try {
        const result = await genai.models.generateContent({
          model,
          contents: [{
            role: 'user',
            parts: [
              { text: prompt },
              { inlineData: { mimeType, data: base64Data } },
            ],
          }],
        });

        const text = result.text || result.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
        const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const foods = JSON.parse(cleaned);

        return res.json({ success: true, source: 'gemini_vision', foods: Array.isArray(foods) ? foods : [foods] });
      } catch (aiErr) {
        console.error(`[AI ANALYZER] Model ${model} image vision error:`, aiErr.message);
      }
    }

    return res.json({
      success: true,
      simulated: true,
      foods: [{ name: 'Mixed Meal Dish', confidence: 0.8, quantity_g: 250, calories: 350, protein: 20, carbs: 40, fat: 12 }],
    });
  } catch (err) {
    console.error('[AI ANALYZER] analyzeFood error:', err.message);
    return res.status(500).json({ success: false, message: 'Food analysis failed. Please try again.' });
  }
}
