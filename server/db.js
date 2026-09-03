import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, get, set, update, remove, push, child } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import dotenv from 'dotenv';
import { COMPREHENSIVE_FOODS } from './seed_foods.js';

dotenv.config();

export const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || 'AIzaSyAe0D6EClkAUV1oXwZrKneISa09YqKifRA',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'nutricraft-d450f.firebaseapp.com',
  databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://nutricraft-d450f-default-rtdb.firebaseio.com',
  projectId: process.env.FIREBASE_PROJECT_ID || 'nutricraft-d450f',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'nutricraft-d450f.firebasestorage.app',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '864371133848',
  appId: process.env.FIREBASE_APP_ID || '1:864371133848:web:8b25b1e42571ec144f2fed',
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || 'G-S9BLBTV33S',
};

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const rtdb = getDatabase(app);
export const auth = getAuth(app);

/**
 * RTDB Helper: Read value at a given path
 */
export async function getVal(path) {
  const dbRef = ref(rtdb, path);
  const snapshot = await get(dbRef);
  return snapshot.exists() ? snapshot.val() : null;
}

/**
 * RTDB Helper: Set/Overwrite value at a path
 */
export async function setVal(path, data) {
  const dbRef = ref(rtdb, path);
  await set(dbRef, data);
  return data;
}

/**
 * RTDB Helper: Update specific fields at a path
 */
export async function updateVal(path, data) {
  const dbRef = ref(rtdb, path);
  await update(dbRef, data);
  return data;
}

/**
 * RTDB Helper: Delete node at a path
 */
export async function removeVal(path) {
  const dbRef = ref(rtdb, path);
  await remove(dbRef);
  return true;
}

/**
 * RTDB Helper: Push a new item with unique key
 */
export async function pushVal(path, data) {
  const listRef = ref(rtdb, path);
  const newRef = push(listRef);
  const id = newRef.key;
  const itemWithId = { id, ...data };
  await set(newRef, itemWithId);
  return itemWithId;
}

/**
 * RTDB Helper: Fetch children as an array of items
 */
export async function getList(path) {
  const val = await getVal(path);
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  return Object.entries(val).map(([key, item]) => {
    if (typeof item === 'object' && item !== null) {
      return { id: item.id || key, ...item };
    }
    return { id: key, value: item };
  });
}

/**
 * Seed comprehensive foods into Firebase Realtime Database
 */
export async function seedFoods() {
  try {
    const existingFoods = await getVal('foods');
    const existingCount = existingFoods ? Object.keys(existingFoods).length : 0;

    if (existingCount >= 100) {
      console.log(`🌿 [FIREBASE RTDB] Food database already seeded (${existingCount} items available).`);
      return;
    }

    console.log(`[SEED] Seeding comprehensive food database to Firebase RTDB (${COMPREHENSIVE_FOODS.length} items)...`);
    const updates = {};
    for (const [id, name, brand, cal, prot, carb, fat, fiber, serving, unit] of COMPREHENSIVE_FOODS) {
      updates[`foods/${id}`] = {
        id,
        name,
        brand: brand || null,
        calories_per_100g: cal || 0,
        protein_per_100g: prot || 0,
        carbs_per_100g: carb || 0,
        fat_per_100g: fat || 0,
        fiber_per_100g: fiber || 0,
        serving_size_g: serving || 100,
        serving_unit: unit || 'g',
        source: 'seed',
        created_at: new Date().toISOString(),
      };
    }

    await update(ref(rtdb), updates);
    console.log(`🌿 [SUCCESS] ${COMPREHENSIVE_FOODS.length} comprehensive foods seeded successfully to Firebase RTDB.`);
  } catch (err) {
    console.warn('[SEED WARNING] Could not seed foods to Firebase RTDB:', err.message);
  }
}

/**
 * Initialize Database Connection
 */
export async function initDb() {
  try {
    console.log('🔥 [FIREBASE] Connected to Realtime Database:', firebaseConfig.databaseURL);
    await seedFoods();
    return true;
  } catch (error) {
    console.error('⚠️ [FIREBASE NOTICE] Realtime Database error:', error.message);
    return false;
  }
}

export const db = {
  getVal,
  setVal,
  updateVal,
  removeVal,
  pushVal,
  getList,
  rtdb,
  auth,
};

export default db;
