import { db } from '../db.js';

// GET /api/analytics/summary?range=week|month|year
export async function getSummary(req, res) {
  try {
    const userId = req.user.userId;
    const range = req.query.range || 'week';

    let days;
    if (range === 'month') days = 30;
    else if (range === 'year') days = 365;
    else days = 7;

    // Current period — daily aggregates
    const current = await db.execute({
      sql: `SELECT date,
              SUM(calories) as calories,
              SUM(protein)  as protein,
              SUM(carbs)    as carbs,
              SUM(fat)      as fat,
              COUNT(*)      as entries
            FROM food_entries
            WHERE user_id = ?
              AND date >= date('now', ?)
            GROUP BY date
            ORDER BY date ASC`,
      args: [userId, `-${days} days`],
    });

    // Previous period for trend comparison
    const previous = await db.execute({
      sql: `SELECT SUM(calories) as total_calories,
              AVG(calories) as avg_calories,
              SUM(protein)  as total_protein
            FROM (
              SELECT date, SUM(calories) as calories, SUM(protein) as protein
              FROM food_entries
              WHERE user_id = ?
                AND date >= date('now', ?)
                AND date <  date('now', ?)
              GROUP BY date
            )`,
      args: [userId, `-${days * 2} days`, `-${days} days`],
    });

    // Current period summary
    const currentSummary = await db.execute({
      sql: `SELECT SUM(calories) as total_calories,
              AVG(calories) as avg_calories,
              SUM(protein)  as total_protein,
              SUM(carbs)    as total_carbs,
              SUM(fat)      as total_fat,
              COUNT(DISTINCT date) as active_days
            FROM (
              SELECT date, SUM(calories) as calories, SUM(protein) as protein, SUM(carbs) as carbs, SUM(fat) as fat
              FROM food_entries
              WHERE user_id = ? AND date >= date('now', ?)
              GROUP BY date
            )`,
      args: [userId, `-${days} days`],
    });

    // Meal type breakdown
    const mealBreakdown = await db.execute({
      sql: `SELECT meal_type, SUM(calories) as calories, COUNT(*) as entries
            FROM food_entries
            WHERE user_id = ? AND date >= date('now', ?)
            GROUP BY meal_type`,
      args: [userId, `-${days} days`],
    });

    // Weight history
    const weightLogs = await db.execute({
      sql: `SELECT weight_kg, logged_at FROM weight_logs WHERE user_id = ? ORDER BY logged_at ASC LIMIT 30`,
      args: [userId],
    });

    const cur = currentSummary.rows[0] || {};
    const prev = previous.rows[0] || {};
    const calorieDelta = cur.avg_calories && prev.avg_calories
      ? Math.round(((cur.avg_calories - prev.avg_calories) / prev.avg_calories) * 100)
      : 0;

    return res.json({
      success: true,
      range,
      dailyData: current.rows,
      summary: {
        totalCalories: Math.round(cur.total_calories || 0),
        avgCalories:   Math.round(cur.avg_calories   || 0),
        totalProtein:  Math.round(cur.total_protein  || 0),
        totalCarbs:    Math.round(cur.total_carbs    || 0),
        totalFat:      Math.round(cur.total_fat      || 0),
        activeDays:    cur.active_days || 0,
        calorieTrend:  calorieDelta,
      },
      mealBreakdown: mealBreakdown.rows,
      weightHistory: weightLogs.rows,
    });
  } catch (err) {
    console.error('[ANALYTICS] getSummary error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch analytics.' });
  }
}

// GET /api/analytics/today
export async function getTodaySummary(req, res) {
  try {
    const userId = req.user.userId;
    const today = new Date().toISOString().slice(0, 10);

    const result = await db.execute({
      sql: `SELECT SUM(calories) as calories, SUM(protein) as protein, SUM(carbs) as carbs, SUM(fat) as fat, COUNT(*) as entries
            FROM food_entries WHERE user_id=? AND date=?`,
      args: [userId, today],
    });

    const profile = await db.execute({
      sql: 'SELECT daily_calorie_target, daily_protein_target, daily_carb_target, daily_fat_target FROM profiles WHERE user_id=?',
      args: [userId],
    });

    const totals = result.rows[0] || {};
    const targets = profile.rows[0] || { daily_calorie_target: 2000, daily_protein_target: 120, daily_carb_target: 250, daily_fat_target: 65 };

    return res.json({
      success: true,
      today,
      consumed: {
        calories: Math.round(totals.calories || 0),
        protein:  Math.round(totals.protein  || 0),
        carbs:    Math.round(totals.carbs    || 0),
        fat:      Math.round(totals.fat      || 0),
        entries:  totals.entries || 0,
      },
      targets,
    });
  } catch (err) {
    console.error('[ANALYTICS] getTodaySummary error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch today summary.' });
  }
}
