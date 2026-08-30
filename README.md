# 🌿 NutriCraft — Precision Nutrition & Metabolic Wellness Platform

<div align="center">

![NutriCraft Banner](https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1200&auto=format&fit=crop)

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Express.js](https://img.shields.io/badge/Express.js-4.18-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![Turso Cloud](https://img.shields.io/badge/Database-Turso_libSQL-4FF8D2?style=flat-square&logo=sqlite&logoColor=black)](https://turso.tech/)
[![Google Gemini](https://img.shields.io/badge/AI_Vision-Gemini_3.6_Flash-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

**An evidence-based, AI-powered nutritional intelligence platform combining clinical dietetics with real-time multimodal food recognition, Turso cloud database persistence, and personalized Mifflin-St Jeor metabolic calibration.**

[Key Features](#-key-features) • [System Architecture](#-system-architecture) • [Database Schema](#-database-schema) • [Getting Started](#-getting-started) • [API & Tools](#-api--tools)

---

</div>

## 🌟 Key Features

### 1. 📷 Dual-Engine AI Food Vision & Barcode Scanner
- **Open Food Facts API**: Instant global UPC/EAN barcode scanning for 100% verified nutrition labels.
- **Google Gemini 3.6 Flash Multimodal Vision**: Recognizes complex mixed dishes from photos, accurately estimating portion sizes and extracting Calories, Protein, Carbohydrates, and Fats.
- **One-Click Slot Logging**: Directly logs analyzed items into *Breakfast*, *Lunch*, *Dinner*, or *Snacks* with duplicate submission protection.

### 2. 📖 Daily Food Journal & 200+ Food Dataset
- Comprehensive meal tracking organized across 4 daily slots.
- Pre-seeded with over **200+ nutrient-dense food items** spanning poultry, seafood, plant proteins, whole grains, fruits, vegetables, nuts, and authentic Indian & global recipes.
- Instant search with live debounce and custom quick-entry fallback.

### 3. 🎯 Mifflin-St Jeor Metabolic Biometrics
- Calculates Basal Metabolic Rate (BMR) and Total Daily Energy Expenditure (TDEE) based on age, gender, height, weight, activity multiplier, and health goals (*fat loss, muscle gain, maintenance*).
- Visual historical weight tracking with automated progress logging.

### 4. 📅 7-Day AI Meal Planner & Smart Grocery List
- Automatically generates complete, personalized 7-day meal strategies calibrated to your exact daily calorie and macro goals.
- Compiles ingredients into an interactive, categorized grocery checklist.

### 5. 💬 Context-Aware AI Clinical Nutritionist
- Built-in dietary chat assistant with access to the user's active biometrics, calorie limits, and today's logged meals for relevant coaching.

### 6. 📊 Analytics, Trends & PDF Reporting
- Interactive charts powered by **Recharts** displaying daily calorie trends, weekly averages, and macronutrient pie breakdowns.
- One-click clean PDF export for clinical consultations.

### 7. 🔐 Robust Authentication & Email Verification
- Complete auth pipeline: Sign Up, 6-digit OTP Email Verification (Nodemailer), Secure Login (JWT + bcrypt), and Forgot / Reset Password recovery.

### 8. 🎨 High-End Design & Visuals
- Theme-matched loaders with pulsing emerald leaf animations.
- Subtle ambient wellness background animations.
- Dedicated **About Us** page with clinical leadership credentials and interactive client case studies modal.

---

## 🏗️ System Architecture

```
NutriCraft Fullstack Architecture
├── 🖥️ Frontend (React 18 + TypeScript + Vite + Tailwind CSS)
│   ├── Public Landing Page & Dedicated /about Page
│   ├── Auth Flow (Login, Signup, OTP Verification, Password Recovery)
│   └── Dashboard Feature Suite (Journal, AI Scanner, Analytics, Chat, Meal Planner, Profile)
│
├── ⚙️ Backend API Server (Node.js + Express.js — Port 3001)
│   ├── /api/auth       → JWT registration, login, OTP mailer & password reset
│   ├── /api/profile    → Biometrics & Mifflin-St Jeor TDEE calibration
│   ├── /api/journal    → Daily meal slot logs & macro aggregations
│   ├── /api/analyzer   → Open Food Facts + Google Gemini 3.6 Flash vision
│   ├── /api/meal-plan  → 7-Day AI plan generator & grocery state
│   ├── /api/analytics  → Historical trends & macro distributions
│   └── /api/chat       → Personalized AI dietetics assistant
│
└── ☁️ Database Layer (Dual Engine Architecture)
    ├── Primary: Turso Cloud Database (libSQL over HTTP/WebSocket)
    └── Fallback: Local SQLite (`nutricraft_local.db` via `better-sqlite3`)
```

---

## 🗄️ Database Schema

NutriCraft manages 8 interconnected tables with automated schema migration on boot:

| Table Name | Description |
| :--- | :--- |
| `users` | User accounts, hashed passwords, verification state, and OTP timestamps. |
| `profiles` | Age, height, weight, gender, activity tier, goal, allergies & computed macro targets. |
| `food_entries` | Daily logged meals with date, meal slot (`breakfast`, `lunch`, `dinner`, `snack`), portion, and macros. |
| `foods` | 200+ pre-seeded nutrient database items with calories and macro distributions per 100g. |
| `weight_logs` | Timestamped weight entries for long-term body composition tracking. |
| `meal_plans` | 7-day structured meal plans with daily macro splits and meal instructions. |
| `grocery_lists` | Consolidated ingredients and interactive checklist states for generated meal plans. |
| `chat_messages`| Persistent history of conversations with the AI Nutritionist. |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18.0.0 or higher recommended)
- **npm** (v9.0.0 or higher)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/nutricraft.git
cd nutricraft
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3001
JWT_SECRET=your_jwt_secret_key_here
CLIENT_URL=http://localhost:3000

# Turso Cloud Database Credentials
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your_turso_auth_token_here

# Google Gemini AI Vision & Chat
GEMINI_API_KEY=your_gemini_api_key_here

# Email Verification (Nodemailer / Gmail App Password)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password_here
```

*(Note: If `TURSO_DATABASE_URL` is omitted, the app automatically initializes a local SQLite database at `server/nutricraft_local.db`)*

### 4. Run the Application
You can run both the frontend and backend concurrently with a single command:

```bash
npm run dev:all
```

- **Frontend Client:** [http://localhost:3000](http://localhost:3000)
- **Backend API Server:** [http://localhost:3001](http://localhost:3001)

---

## 🛠️ Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev:all` | Runs frontend Vite dev server and backend Express API concurrently. |
| `npm run dev` | Starts only the Vite frontend dev server on port 3000. |
| `npm run server` | Starts only the Express API server with nodemon on port 3001. |
| `npm run build` | Builds the production Vite bundle to `dist/`. |
| `npm run lint` | Runs TypeScript type checking (`tsc --noEmit`). |
| `npm run db:view` | Terminal viewer script that logs all 8 database tables with live row counts. |

---

## 📱 Page Overview

- **Landing Page (`/`)**: Hero section, custom video player, interactive feature cards with nutrition articles, case studies modal, and service offerings.
- **About Us (`/about`)**: Company vision, clinical nutrition methodology, dietitian advisory board profiles, and client outcome metrics.
- **Auth Suite (`/login`, `/signup`, `/verify-otp`, `/forgot-password`, `/reset-password`)**: Secure access with automated OTP emails.
- **Dashboard (`/dashboard`)**: Live daily macro progress bars, quick launch modules, and Mifflin-St Jeor target overview.
- **Food Journal (`/dashboard/journal`)**: Meal slot tracker with live search across 200+ foods and custom entry options.
- **AI Vision Analyzer (`/dashboard/analyzer`)**: Photo upload & barcode lookup powered by Gemini 3.6 Flash and Open Food Facts.
- **Analytics (`/dashboard/analytics`)**: Recharts data visualizations and exportable PDF summaries.
- **Meal Planner (`/dashboard/meal-plan`)**: AI generated 7-day diet plans with automated grocery checklists.
- **Profile (`/dashboard/profile`)**: Biometric configuration with automatic TDEE calculation and weight history logs.
- **AI Chat (`/dashboard/chat`)**: Context-aware dietary consultation bot.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
