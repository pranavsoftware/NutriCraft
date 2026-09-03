import { db } from '../db.js';

// GET /api/analytics/summary?range=week|month|year
export async function getSummary(req, res) {
  try {
    const userId = req.user.userId || req.user.id;
    const range = req.query.range || 'week';

    let days;
    if (range === 'month') days = 30;
    else if (range === 'year') days = 365;
    else days = 7;

    const nowMs = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const startDateStr = new Date(nowMs - days * dayMs).toISOString().slice(0, 10);
    const prevDateStr = new Date(nowMs - days * 2 * dayMs).toISOString().slice(0, 10);

    const [allEntries, weightLogs] = await Promise.all([
      db.getList(`food_entries/${userId}`),
      db.getList(`weight_logs/${userId}`),
    ]);

    // Current period entries
    const currentEntries = allEntries.filter((e) => e.date >= startDateStr);

    // Group daily aggregates for current period
    const dailyMap = {};
    for (const e of currentEntries) {
      if (!dailyMap[e.date]) {
        dailyMap[e.date] = { date: e.date, calories: 0, protein: 0, carbs: 0, fat: 0, entries: 0 };
      }
      dailyMap[e.date].calories += Number(e.calories) || 0;
      dailyMap[e.date].protein += Number(e.protein) || 0;
      dailyMap[e.date].carbs += Number(e.carbs) || 0;
      dailyMap[e.date].fat += Number(e.fat) || 0;
      dailyMap[e.date].entries += 1;
    }

    const dailyData = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    // Summary of current period
    const activeDays = Object.keys(dailyMap).length;
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    for (const d of dailyData) {
      totalCalories += d.calories;
      totalProtein += d.protein;
      totalCarbs += d.carbs;
      totalFat += d.fat;
    }

    const avgCalories = activeDays > 0 ? Math.round(totalCalories / activeDays) : 0;

    // Previous period for trend comparison
    const prevEntries = allEntries.filter((e) => e.date >= prevDateStr && e.date < startDateStr);
    const prevDailyMap = {};
    let prevTotalCalories = 0;
    for (const e of prevEntries) {
      if (!prevDailyMap[e.date]) prevDailyMap[e.date] = 0;
      prevDailyMap[e.date] += Number(e.calories) || 0;
      prevTotalCalories += Number(e.calories) || 0;
    }
    const prevActiveDays = Object.keys(prevDailyMap).length;
    const prevAvgCalories = prevActiveDays > 0 ? Math.round(prevTotalCalories / prevActiveDays) : 0;

    const calorieDelta = avgCalories && prevAvgCalories
      ? Math.round(((avgCalories - prevAvgCalories) / prevAvgCalories) * 100)
      : 0;

    // Meal type breakdown
    const mealMap = {};
    for (const e of currentEntries) {
      const type = (e.meal_type || 'snack').toLowerCase();
      if (!mealMap[type]) mealMap[type] = { meal_type: type, calories: 0, entries: 0 };
      mealMap[type].calories += Number(e.calories) || 0;
      mealMap[type].entries += 1;
    }
    const mealBreakdown = Object.values(mealMap);

    // Sorted weight history
    const sortedWeights = weightLogs
      .sort((a, b) => (a.logged_at || '').localeCompare(b.logged_at || ''))
      .slice(-30);

    return res.json({
      success: true,
      range,
      dailyData,
      summary: {
        totalCalories: Math.round(totalCalories),
        avgCalories,
        totalProtein: Math.round(totalProtein),
        totalCarbs: Math.round(totalCarbs),
        totalFat: Math.round(totalFat),
        activeDays,
        calorieTrend: calorieDelta,
      },
      mealBreakdown,
      weightHistory: sortedWeights,
    });
  } catch (err) {
    console.error('[ANALYTICS] getSummary error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch analytics.' });
  }
}

// GET /api/analytics/today
export async function getTodaySummary(req, res) {
  try {
    const userId = req.user.userId || req.user.id;
    const today = new Date().toISOString().slice(0, 10);

    const [allEntries, profile] = await Promise.all([
      db.getList(`food_entries/${userId}`),
      db.getVal(`profiles/${userId}`),
    ]);

    const todayEntries = allEntries.filter((e) => e.date === today);
    const totals = todayEntries.reduce(
      (acc, e) => ({
        calories: acc.calories + (Number(e.calories) || 0),
        protein: acc.protein + (Number(e.protein) || 0),
        carbs: acc.carbs + (Number(e.carbs) || 0),
        fat: acc.fat + (Number(e.fat) || 0),
        entries: acc.entries + 1,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, entries: 0 }
    );

    const targets = profile || {
      daily_calorie_target: 2000,
      daily_protein_target: 120,
      daily_carb_target: 250,
      daily_fat_target: 65,
    };

    return res.json({
      success: true,
      today,
      consumed: {
        calories: Math.round(totals.calories),
        protein: Math.round(totals.protein),
        carbs: Math.round(totals.carbs),
        fat: Math.round(totals.fat),
        entries: totals.entries,
      },
      targets,
    });
  } catch (err) {
    console.error('[ANALYTICS] getTodaySummary error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch today summary.' });
  }
}
