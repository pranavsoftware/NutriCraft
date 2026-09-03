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
    const allMessages = await db.getList(`chat_messages/${userId}`);

    const sortedMessages = allMessages
      .sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''))
      .slice(-HISTORY_LIMIT);

    return res.json({ success: true, messages: sortedMessages });
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

    const now = new Date().toISOString();
    const userMsgId = randomUUID();

    // Save user message to Firebase RTDB
    await db.setVal(`chat_messages/${userId}/${userMsgId}`, {
      id: userMsgId,
      user_id: userId,
      role: 'user',
      content: message.trim(),
      created_at: now,
    });

    // Gather context: today's food entries + profile + weight
    const today = now.slice(0, 10);
    const [allEntries, profile, allWeights] = await Promise.all([
      db.getList(`food_entries/${userId}`),
      db.getVal(`profiles/${userId}`),
      db.getList(`weight_logs/${userId}`),
    ]);

    const todayEntries = allEntries.filter((e) => e.date === today);
    const recentWeights = allWeights
      .sort((a, b) => (b.logged_at || '').localeCompare(a.logged_at || ''))
      .slice(0, 3);

    const todayTotals = todayEntries.reduce(
      (acc, e) => ({
        calories: acc.calories + (Number(e.calories) || 0),
        protein: acc.protein + (Number(e.protein) || 0),
        carbs: acc.carbs + (Number(e.carbs) || 0),
        fat: acc.fat + (Number(e.fat) || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    const contextBlock = [
      `User profile: goal=${profile?.goal || 'maintain'}, age=${profile?.age || 'unknown'}, gender=${profile?.gender || 'unknown'}`,
      `Daily targets: ${profile?.daily_calorie_target || 2000} kcal, ${profile?.daily_protein_target || 120}g protein, ${profile?.daily_carb_target || 250}g carbs, ${profile?.daily_fat_target || 65}g fat`,
      `Today's intake (${today}): ${Math.round(todayTotals.calories)} kcal, ${Math.round(todayTotals.protein)}g protein, ${Math.round(todayTotals.carbs)}g carbs, ${Math.round(todayTotals.fat)}g fat`,
      todayEntries.length > 0
        ? `Today's meals: ${todayEntries.map((e) => `${e.food_name} (${e.meal_type}, ${e.quantity_g}g, ${e.calories} kcal)`).join('; ')}`
        : 'No meals logged today yet.',
      recentWeights.length > 0
        ? `Recent weight: ${recentWeights.map((w) => `${w.weight_kg}kg`).join(', ')}`
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

    // Save AI reply to Firebase RTDB
    const aiMsgId = randomUUID();
    await db.setVal(`chat_messages/${userId}/${aiMsgId}`, {
      id: aiMsgId,
      user_id: userId,
      role: 'assistant',
      content: aiReply,
      created_at: new Date().toISOString(),
    });

    return res.json({
      success: true,
      reply: aiReply,
      context: { todayTotals, hasProfile: !!profile },
    });
  } catch (err) {
    console.error('[CHAT] sendMessage error:', err);
    return res.status(500).json({ success: false, message: 'Failed to send message.' });
  }
}

// DELETE /api/chat/history
export async function clearHistory(req, res) {
  try {
    const userId = req.user.userId || req.user.id;
    await db.removeVal(`chat_messages/${userId}`);
    return res.json({ success: true, message: 'Chat history cleared in Firebase.' });
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
