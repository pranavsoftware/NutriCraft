import { db, initDb, firebaseConfig } from './db.js';

async function main() {
  await initDb();
  console.clear?.();
  console.log('\n======================================================');
  console.log('    🥗 NUTRICRAFT FIREBASE DATABASE VIEWER 📊         ');
  console.log('======================================================\n');
  console.log(`🔥 Connected RTDB: ${firebaseConfig.databaseURL}\n`);

  console.log('📌 1. REGISTERED USERS');
  console.log('------------------------------------------------------');
  const usersObj = await db.getVal('users');
  const users = usersObj ? Object.values(usersObj) : [];
  if (users.length > 0) {
    console.table(users.map((u) => ({ id: u.id, name: u.name, email: u.email, verified: u.isVerified, created: u.createdAt })));
  } else {
    console.log('No registered users yet.');
  }

  console.log('\n📌 2. PROFILES & BIOMETRICS');
  console.log('------------------------------------------------------');
  const profilesObj = await db.getVal('profiles');
  const profiles = profilesObj ? Object.values(profilesObj) : [];
  if (profiles.length > 0) {
    console.table(profiles.map((p) => ({
      userId: p.user_id,
      age: p.age,
      height: p.height_cm,
      weight: p.weight_kg,
      goal: p.goal,
      calories: p.daily_calorie_target,
      protein: p.daily_protein_target,
    })));
  } else {
    console.log('No user profiles yet.');
  }

  console.log('\n📌 3. FOOD JOURNAL ENTRIES (LOGGED MEALS)');
  console.log('------------------------------------------------------');
  const entriesObj = await db.getVal('food_entries');
  let allEntries = [];
  if (entriesObj) {
    for (const [userId, userEntries] of Object.entries(entriesObj)) {
      if (userEntries) {
        allEntries.push(...Object.values(userEntries));
      }
    }
  }
  if (allEntries.length > 0) {
    console.table(allEntries.slice(0, 15).map((e) => ({
      food: e.food_name,
      meal: e.meal_type,
      qty: e.quantity_g,
      cal: e.calories,
      p: e.protein,
      c: e.carbs,
      f: e.fat,
      date: e.date,
    })));
  } else {
    console.log('No journal entries yet.');
  }

  console.log('\n📌 4. WEIGHT LOGS HISTORY');
  console.log('------------------------------------------------------');
  const weightsObj = await db.getVal('weight_logs');
  let allWeights = [];
  if (weightsObj) {
    for (const [userId, userWeights] of Object.entries(weightsObj)) {
      if (userWeights) {
        allWeights.push(...Object.values(userWeights));
      }
    }
  }
  if (allWeights.length > 0) {
    console.table(allWeights.slice(0, 10).map((w) => ({ userId: w.user_id, weightKg: w.weight_kg, date: w.logged_at })));
  } else {
    console.log('No weight logs yet.');
  }

  console.log('\n📌 5. AI CHAT MESSAGES');
  console.log('------------------------------------------------------');
  const chatsObj = await db.getVal('chat_messages');
  let allChats = [];
  if (chatsObj) {
    for (const [userId, userChats] of Object.entries(chatsObj)) {
      if (userChats) {
        allChats.push(...Object.values(userChats));
      }
    }
  }
  if (allChats.length > 0) {
    console.table(allChats.slice(-10).map((c) => ({
      role: c.role,
      preview: (c.content || '').slice(0, 60),
      time: c.created_at,
    })));
  } else {
    console.log('No chat messages yet.');
  }

  console.log('\n📌 6. 7-DAY MEAL PLANS');
  console.log('------------------------------------------------------');
  const plansObj = await db.getVal('meal_plans');
  let allPlans = [];
  if (plansObj) {
    for (const [userId, userPlans] of Object.entries(plansObj)) {
      if (userPlans) {
        allPlans.push(...Object.values(userPlans));
      }
    }
  }
  if (allPlans.length > 0) {
    console.table(allPlans.slice(0, 10).map((p) => ({
      week: p.week_start_date,
      day: p.day_of_week,
      meal: p.meal_type,
      food: p.food_name,
      cal: p.calories,
    })));
  } else {
    console.log('No meal plans yet.');
  }

  console.log('\n📌 7. DATABASE SEEDED FOODS COUNT');
  console.log('------------------------------------------------------');
  const foodsObj = await db.getVal('foods');
  const foodCount = foodsObj ? Object.keys(foodsObj).length : 0;
  console.log(`Total active foods in Firebase RTDB: ${foodCount} items.`);

  console.log('\n📌 8. CACHED RECIPES IN FIREBASE RTDB (/recipes)');
  console.log('------------------------------------------------------');
  const recipesObj = await db.getVal('recipes');
  if (recipesObj) {
    const recipesList = Object.values(recipesObj);
    console.log(`Total cached recipes: ${recipesList.length} items.`);
    console.table(recipesList.slice(0, 10).map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      area: r.area,
      ingredients: r.ingredients?.length || 0,
    })));
  } else {
    console.log('No recipes cached yet.');
  }

  console.log('\n======================================================\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('Error viewing Firebase database:', err);
  process.exit(1);
});
