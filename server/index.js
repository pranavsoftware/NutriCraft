import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import foodsRoutes from './routes/foods.js';
import journalRoutes from './routes/journal.js';
import analyticsRoutes from './routes/analytics.js';
import chatRoutes from './routes/chat.js';
import mealPlanRoutes from './routes/mealPlan.js';
import aiAnalyzerRoutes from './routes/aiAnalyzer.js';
import recipeRoutes from './routes/recipes.js';
import { initDb, firebaseConfig } from './db.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, same-origin, curl) or any Render/Vercel/localhost domains
      if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('onrender.com') || origin.includes('vercel.app')) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma'],
  })
);

// Disable caching on all API routes to ensure fresh data from database on every request
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  next();
});

// Increase body size limit for base64 image uploads (up to 10MB)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request logging in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });
}

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date(),
    service: 'NutriCraft Fullstack Backend',
    database: 'Firebase Realtime Database',
    databaseURL: firebaseConfig.databaseURL,
    auth: 'Firebase Auth',
    gemini: process.env.GEMINI_API_KEY ? 'configured' : 'not configured',
    usda: process.env.USDA_FDC_API_KEY ? 'configured' : 'not configured',
    themealdb: process.env.THEMEALDB_API_KEY ? 'configured' : 'not configured',
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/profile',     profileRoutes);
app.use('/api/foods',       foodsRoutes);
app.use('/api/journal',     journalRoutes);
app.use('/api/analytics',   analyticsRoutes);
app.use('/api/chat',        chatRoutes);
app.use('/api/meal-plan',   mealPlanRoutes);
app.use('/api/ai-analyzer', aiAnalyzerRoutes);
app.use('/api/recipes',     recipeRoutes);

// ── Serve Frontend Static Files for Render / Production ───────────────────────
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// For all non-API routes, serve React SPA index.html
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[UNHANDLED SERVER ERROR]:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'An internal server error occurred.',
  });
});

// ── Start Server ──────────────────────────────────────────────────────────────
const isServerless = Boolean(
  process.env.VERCEL ||
  process.env.VERCEL_ENV ||
  process.env.NOW_REGION ||
  process.env.AWS_LAMBDA_FUNCTION_NAME
);

if (!isServerless && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, HOST, async () => {
    console.log(`🚀 [NUTRICRAFT] Server running on http://${HOST}:${PORT}`);
    console.log(`🛡️  CORS configured for local, Vercel, and Render deployments`);
    console.log(`🔥 Firebase RTDB: ${firebaseConfig.databaseURL}`);
    console.log(`🔐 Firebase Auth: enabled (Project: ${firebaseConfig.projectId})`);
    console.log(`📊 Gemini AI: ${process.env.GEMINI_API_KEY ? '✅ configured' : '⚠️  not configured (add GEMINI_API_KEY to .env)'}`);
    console.log(`🥗 USDA FoodData Central: ${process.env.USDA_FDC_API_KEY ? '✅ configured' : '⚠️  not configured (optional)'}`);
    console.log(`🍳 TheMealDB: ${process.env.THEMEALDB_API_KEY ? '✅ configured' : '⚠️  not configured (optional)'}`);
    await initDb();
  });
}

export default app;
