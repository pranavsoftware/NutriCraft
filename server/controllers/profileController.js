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
    const profile = await db.getVal(`profiles/${userId}`);
    const weightList = await db.getList(`weight_logs/${userId}`);

    // Sort weight logs descending by logged_at
    const sortedWeights = weightList.sort((a, b) => {
      const dateA = new Date(a.logged_at || 0).getTime();
      const dateB = new Date(b.logged_at || 0).getTime();
      return dateB - dateA;
    }).slice(0, 10);

    return res.json({
      success: true,
      profile: profile || null,
      weightHistory: sortedWeights,
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
    const now = new Date().toISOString();

    const existingProfile = await db.getVal(`profiles/${userId}`);
    const profileId = existingProfile?.id || randomUUID();

    const profileData = {
      id: profileId,
      user_id: userId,
      age: ageNum,
      height_cm: heightNum,
      weight_kg: weightNum,
      gender: genderVal,
      activity_level: activityVal,
      goal: goalVal,
      dietary_preference: dietaryVal,
      allergies: allergiesVal,
      daily_calorie_target: calTarget,
      daily_protein_target: macros.protein,
      daily_carb_target: macros.carbs,
      daily_fat_target: macros.fat,
      created_at: existingProfile?.created_at || now,
      updated_at: now,
    };

    // Save to Firebase Realtime Database (/profiles/{userId})
    await db.setVal(`profiles/${userId}`, profileData);

    // Append weight history entry to Firebase RTDB (/weight_logs/{userId})
    if (weightNum) {
      const logId = randomUUID();
      await db.setVal(`weight_logs/${userId}/${logId}`, {
        id: logId,
        user_id: userId,
        weight_kg: weightNum,
        logged_at: now,
      });
    }

    return res.json({
      success: true,
      profile: profileData,
      isProfileComplete: true,
      message: 'Profile updated successfully in Firebase.',
    });
  } catch (err) {
    console.error('[PROFILE] updateProfile error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
}

// GET /api/profile/export
export async function exportData(req, res) {
  try {
    const userId = req.user.userId || req.user.id;
    const [user, profile, foodEntries, weightLogs, chats, mealPlans] = await Promise.all([
      db.getVal(`users/${userId}`),
      db.getVal(`profiles/${userId}`),
      db.getList(`food_entries/${userId}`),
      db.getList(`weight_logs/${userId}`),
      db.getList(`chat_messages/${userId}`),
      db.getList(`meal_plans/${userId}`),
    ]);

    return res.json({
      success: true,
      exportedAt: new Date().toISOString(),
      user: user || null,
      profile: profile || null,
      foodEntries: foodEntries.sort((a, b) => (b.date || '').localeCompare(a.date || '')),
      weightHistory: weightLogs.sort((a, b) => (b.logged_at || '').localeCompare(a.logged_at || '')),
      chatHistory: chats.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || '')),
      mealPlans: mealPlans.sort((a, b) => (b.week_start_date || '').localeCompare(a.week_start_date || '')),
    });
  } catch (err) {
    console.error('[PROFILE] exportData error:', err);
    return res.status(500).json({ success: false, message: 'Failed to export data.' });
  }
}
