import { db } from '../db.js';
import { randomUUID } from 'crypto';

/**
 * Calculate daily calorie target using Mifflin-St Jeor equation
 */
function calculateCalorieTarget(age, height_cm, weight_kg, gender, activity_level, goal) {
  const a = Number(age) || 25;
  const h = Number(height_cm) || 170;
  const w = Number(weight_kg) || 70;

  let bmr;
  if (gender === 'female') {
    bmr = 10 * w + 6.25 * h - 5 * a - 161;
  } else {
    bmr = 10 * w + 6.25 * h - 5 * a + 5;
  }

  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };
  const multiplier = activityMultipliers[activity_level] || 1.55;
  let tdee = bmr * multiplier;

  if (goal === 'lose_weight') tdee -= 400;
  else if (goal === 'gain_muscle') tdee += 300;

  return Math.round(tdee);
}

function macrosFromCalories(calories, goal) {
  const splits = {
    lose_weight: { protein: 0.35, carbs: 0.35, fat: 0.30 },
    gain_muscle: { protein: 0.30, carbs: 0.45, fat: 0.25 },
    maintain:    { protein: 0.25, carbs: 0.50, fat: 0.25 },
  };
  const split = splits[goal] || splits.maintain;
  return {
    protein: Math.round((calories * split.protein) / 4),
    carbs:   Math.round((calories * split.carbs) / 4),
    fat:     Math.round((calories * split.fat) / 9),
  };
}

// GET /api/profile
export async function getProfile(req, res) {
  try {
    const userId = req.user.userId || req.user.id;
    const result = await db.execute({
      sql: 'SELECT * FROM profiles WHERE user_id = ?',
      args: [userId],
    });

    const weightResult = await db.execute({
      sql: 'SELECT weight_kg, logged_at FROM weight_logs WHERE user_id = ? ORDER BY logged_at DESC LIMIT 10',
      args: [userId],
    });

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        profile: null,
        weightHistory: weightResult.rows,
      });
    }

    return res.json({
      success: true,
      profile: result.rows[0],
      weightHistory: weightResult.rows,
    });
  } catch (err) {
    console.error('[PROFILE] getProfile error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch profile.' });
  }
}

// PUT /api/profile
export async function updateProfile(req, res) {
  try {
    const userId = req.user.userId || req.user.id;
    const {
      age, height_cm, weight_kg, gender,
      activity_level, goal, dietary_preference, allergies,
    } = req.body;

    const ageNum = Number(age) || 25;
    const heightNum = Number(height_cm) || 170;
    const weightNum = Number(weight_kg) || 70;
    const genderVal = gender || 'male';
    const activityVal = activity_level || 'moderate';
    const goalVal = goal || 'maintain';
    const dietaryVal = dietary_preference || 'none';
    const allergiesVal = (allergies || '').trim();

    // Compute calorie target & macros using Mifflin-St Jeor
    const calTarget = calculateCalorieTarget(ageNum, heightNum, weightNum, genderVal, activityVal, goalVal);
    const macros = macrosFromCalories(calTarget, goalVal);

    // Check if profile row exists in Turso DB
    const existing = await db.execute({
      sql: 'SELECT id FROM profiles WHERE user_id = ?',
      args: [userId],
    });

    if (existing.rows.length === 0) {
      await db.execute({
        sql: `INSERT INTO profiles (id, user_id, age, height_cm, weight_kg, gender, activity_level, goal, dietary_preference, allergies, daily_calorie_target, daily_protein_target, daily_carb_target, daily_fat_target)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [randomUUID(), userId, ageNum, heightNum, weightNum, genderVal, activityVal, goalVal,
          dietaryVal, allergiesVal,
          calTarget, macros.protein, macros.carbs, macros.fat],
      });
    } else {
      await db.execute({
        sql: `UPDATE profiles SET age=?, height_cm=?, weight_kg=?, gender=?, activity_level=?, goal=?, dietary_preference=?, allergies=?,
              daily_calorie_target=?, daily_protein_target=?, daily_carb_target=?, daily_fat_target=?, updated_at=datetime('now')
              WHERE user_id=?`,
        args: [ageNum, heightNum, weightNum, genderVal, activityVal, goalVal,
          dietaryVal, allergiesVal,
          calTarget, macros.protein, macros.carbs, macros.fat, userId],
      });
    }

    // Append weight history entry to weight_logs table
    if (weightNum) {
      await db.execute({
        sql: 'INSERT INTO weight_logs (id, user_id, weight_kg) VALUES (?, ?, ?)',
        args: [randomUUID(), userId, weightNum],
      });
    }

    const updated = await db.execute({ sql: 'SELECT * FROM profiles WHERE user_id = ?', args: [userId] });
    return res.json({ success: true, profile: updated.rows[0], message: 'Profile updated successfully.' });
  } catch (err) {
    console.error('[PROFILE] updateProfile error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
}

// GET /api/profile/export
export async function exportData(req, res) {
  try {
    const userId = req.user.userId || req.user.id;
    const [userRes, profileRes, entriesRes, weightsRes, chatsRes, plansRes] = await Promise.all([
      db.execute({ sql: 'SELECT id, name, email, created_at FROM users WHERE id=?', args: [userId] }),
      db.execute({ sql: 'SELECT * FROM profiles WHERE user_id=?', args: [userId] }),
      db.execute({ sql: 'SELECT * FROM food_entries WHERE user_id=? ORDER BY date DESC', args: [userId] }),
      db.execute({ sql: 'SELECT * FROM weight_logs WHERE user_id=? ORDER BY logged_at DESC', args: [userId] }),
      db.execute({ sql: 'SELECT * FROM chat_messages WHERE user_id=? ORDER BY created_at DESC LIMIT 200', args: [userId] }),
      db.execute({ sql: 'SELECT * FROM meal_plans WHERE user_id=? ORDER BY week_start_date DESC', args: [userId] }),
    ]);

    return res.json({
      success: true,
      exportedAt: new Date().toISOString(),
      user: userRes.rows[0] || null,
      profile: profileRes.rows[0] || null,
      foodEntries: entriesRes.rows,
      weightHistory: weightsRes.rows,
      chatHistory: chatsRes.rows,
      mealPlans: plansRes.rows,
    });
  } catch (err) {
    console.error('[PROFILE] exportData error:', err);
    return res.status(500).json({ success: false, message: 'Failed to export data.' });
  }
}
