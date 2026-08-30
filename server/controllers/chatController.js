import { db } from '../db.js';
import { randomUUID } from 'crypto';
import { GoogleGenAI } from '@google/genai';

function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

const HISTORY_LIMIT = 20;

// GET /api/chat/history
export async function getChatHistory(req, res) {
  try {
    const userId = req.user.userId || req.user.id;
    const result = await db.execute({
      sql: 'SELECT id, role, content, created_at FROM chat_messages WHERE user_id=? ORDER BY created_at ASC LIMIT ?',
      args: [userId, HISTORY_LIMIT],
    });
    return res.json({ success: true, messages: result.rows });
  } catch (err) {
    console.error('[CHAT] getChatHistory error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch chat history.' });
  }
}

// POST /api/chat/message
export async function sendMessage(req, res) {
  try {
    const userId = req.user.userId || req.user.id;
    const { message } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty.' });
    }

    // Save user message
    await db.execute({
      sql: 'INSERT INTO chat_messages (id, user_id, role, content) VALUES (?, ?, ?, ?)',
      args: [randomUUID(), userId, 'user', message.trim()],
    });

    // Gather context: today's food entries + profile
    const today = new Date().toISOString().slice(0, 10);
    const [entriesResult, profileResult, weightResult] = await Promise.all([
      db.execute({
        sql: `SELECT food_name, quantity_g, meal_type, calories, protein, carbs, fat
              FROM food_entries WHERE user_id=? AND date=? ORDER BY created_at ASC`,
        args: [userId, today],
      }),
      db.execute({ sql: 'SELECT * FROM profiles WHERE user_id=?', args: [userId] }),
      db.execute({
        sql: 'SELECT weight_kg, logged_at FROM weight_logs WHERE user_id=? ORDER BY logged_at DESC LIMIT 3',
        args: [userId],
      }),
    ]);

    const profile = profileResult.rows[0];
    const entries = entriesResult.rows;
    const weights = weightResult.rows;

    const todayTotals = entries.reduce(
      (acc, e) => ({
        calories: acc.calories + (e.calories || 0),
        protein: acc.protein + (e.protein || 0),
        carbs: acc.carbs + (e.carbs || 0),
        fat: acc.fat + (e.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    const contextBlock = [
      `User profile: goal=${profile?.goal || 'maintain'}, age=${profile?.age || 'unknown'}, gender=${profile?.gender || 'unknown'}`,
      `Daily targets: ${profile?.daily_calorie_target || 2000} kcal, ${profile?.daily_protein_target || 120}g protein, ${profile?.daily_carb_target || 250}g carbs, ${profile?.daily_fat_target || 65}g fat`,
      `Today's intake (${today}): ${Math.round(todayTotals.calories)} kcal, ${Math.round(todayTotals.protein)}g protein, ${Math.round(todayTotals.carbs)}g carbs, ${Math.round(todayTotals.fat)}g fat`,
      entries.length > 0
        ? `Today's meals: ${entries.map((e) => `${e.food_name} (${e.meal_type}, ${e.quantity_g}g, ${e.calories} kcal)`).join('; ')}`
        : 'No meals logged today yet.',
      weights.length > 0
        ? `Recent weight: ${weights.map((w) => `${w.weight_kg}kg`).join(', ')}`
        : '',
      `Dietary preference: ${profile?.dietary_preference || 'none'}`,
      `Allergies: ${profile?.allergies || 'none'}`,
    ].filter(Boolean).join('\n');

    const systemPrompt = `You are NutriCraft AI, a warm, professional, and knowledgeable nutrition coach.
FORMATTING RULES:
- Write in clean, simple, easy-to-read text.
- Avoid cluttered markdown like heavy hashes (###, ####) or divider lines (---).
- Keep replies direct, concise, and structured with clear short paragraphs and simple bullet points.
- When suggesting a meal or recipe, provide the dish name, simple macro estimate (Calories, Protein, Carbs, Fat), ingredients, and quick steps in clean text.
- Do NOT provide medical diagnoses or replace clinical advice.

CURRENT USER LOGGED CONTEXT:
${contextBlock}`;

    const genai = getAiClient();
    let aiReply = '';

    if (genai) {
      const candidateModels = ['gemini-3.6-flash', 'gemini-3.1-pro-preview'];
      for (const model of candidateModels) {
        try {
          const result = await genai.models.generateContent({
            model,
            contents: `${systemPrompt}\n\nUser Question: ${message.trim()}`,
          });
          aiReply = result.text || result.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (aiReply) break;
        } catch (aiErr) {
          console.error(`[CHAT] Model ${model} error:`, aiErr.message);
        }
      }
      if (!aiReply) {
        aiReply = generateFallbackReply(message, todayTotals, profile);
      }
    } else {
      aiReply = generateFallbackReply(message, todayTotals, profile);
    }

    // Save AI reply
    await db.execute({
      sql: 'INSERT INTO chat_messages (id, user_id, role, content) VALUES (?, ?, ?, ?)',
      args: [randomUUID(), userId, 'assistant', aiReply],
    });

    return res.json({ success: true, reply: aiReply, context: { todayTotals, hasProfile: !!profile } });
  } catch (err) {
    console.error('[CHAT] sendMessage error:', err);
    return res.status(500).json({ success: false, message: 'Failed to send message.' });
  }
}

// DELETE /api/chat/history
export async function clearHistory(req, res) {
  try {
    const userId = req.user.userId || req.user.id;
    await db.execute({ sql: 'DELETE FROM chat_messages WHERE user_id=?', args: [userId] });
    return res.json({ success: true, message: 'Chat history cleared.' });
  } catch (err) {
    console.error('[CHAT] clearHistory error:', err);
    return res.status(500).json({ success: false, message: 'Failed to clear history.' });
  }
}

/** Offline fallback when needed */
function generateFallbackReply(message, todayTotals, profile) {
  const cal = Math.round(todayTotals.calories);
  const target = profile?.daily_calorie_target || 2000;
  const remaining = target - cal;
  const msg = message.toLowerCase();

  if (msg.includes('calories') || msg.includes('calorie') || msg.includes('kcal') || msg.includes('macro')) {
    return `Based on your food journal, you've consumed ${cal} kcal today out of your ${target} kcal target (${Math.round(todayTotals.protein)}g protein, ${Math.round(todayTotals.carbs)}g carbs, ${Math.round(todayTotals.fat)}g fat). You have ${remaining > 0 ? remaining : 0} kcal remaining.`;
  }
  if (msg.includes('protein')) {
    return `Today you've logged ${Math.round(todayTotals.protein)}g protein out of your ${profile?.daily_protein_target || 120}g target. Great for muscle recovery and metabolic rate!`;
  }
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
    return `Hello! 👋 I'm NutriCraft AI, your personal nutrition coach. You've logged ${cal} kcal today. How can I help you optimize your diet today?`;
  }
  return `Based on your intake, you've consumed ${cal} kcal today (target: ${target} kcal). How can I assist with your recipes or nutrition goals?`;
}
