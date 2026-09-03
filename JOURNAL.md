# 🥗 NutriCraft Food Journal Documentation

Comprehensive technical and operational guide for the **NutriCraft Food Journal**, covering its architecture, Firebase Realtime Database persistence, macro calculation engine, REST API endpoints, and frontend user interface.

---

## 📌 Table of Contents
1. [Overview](#1-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Data Model & Firebase Structure](#3-data-model--firebase-structure)
4. [Macro Calculation Engine](#4-macro-calculation-engine)
5. [Core Features & User Workflows](#5-core-features--user-workflows)
6. [API Specification](#6-api-specification)
7. [Frontend Implementation](#7-frontend-implementation)
8. [Integration with Other Modules](#8-integration-with-other-modules)
9. [CLI Database Inspection](#9-cli-database-inspection)

---

## 1. Overview

The **NutriCraft Food Journal** is a nutrition tracking system designed to log daily food intake, calculate macronutrients in real time, and compare them against personalized biometric targets computed using the **Mifflin-St Jeor equation**.

### Key Capabilities:
- **Categorized Meal Logging**: Organize entries into **Breakfast**, **Lunch**, **Dinner**, and **Snacks**.
- **Instant Food Search**: Query across **200+ pre-seeded items** in Firebase Realtime Database with a 300ms debounced search engine.
- **Dynamic Portion Scaling**: Automatically scales calories, protein, carbohydrates, and fats based on the exact quantity consumed in grams.
- **Custom Food Entry**: Allows users to manually specify arbitrary meals and nutritional macros.
- **Calendar & Historical Navigation**: View, edit, and audit meal intake for any past or future date.
- **Biometric Target Comparison**: Real-time progress bars and visual indicators showing consumed vs. target daily calories and macronutrient breakdown.

---

## 2. High-Level Architecture

The Food Journal is built on a decoupled architecture where the frontend communicates with an authenticated Express backend, which directly interacts with **Firebase Realtime Database**.

```
┌─────────────────────────────────────────────────────────────┐
│                    React Client (Vite)                      │
│   src/pages/dashboard/JournalPage.tsx                       │
│   • Date Picker & Navigation                                │
│   • Meal Slot Cards (Breakfast, Lunch, Dinner, Snack)       │
│   • Macro Summary Banners (Calories, Protein, Carbs, Fat)   │
│   • Debounced Food Search Modal                             │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / REST with JWT
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  Express.js Backend API                     │
│   server/routes/journal.js & server/controllers/journal.js  │
│   • Authentication verification (auth middleware)           │
│   • Portion & macro computation algorithm                   │
│   • Daily aggregation & grouping by meal slot               │
└──────────────────────────────┬──────────────────────────────┘
                               │ Firebase Web SDK
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Firebase Realtime Database                  │
│   https://nutricraft-d450f-default-rtdb.firebaseio.com      │
│   • /food_entries/{userId}/{entryId}                        │
│   • /foods/{foodId} (200 Nutritional Items)                 │
│   • /profiles/{userId} (Calorie & Macro Goals)              │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Data Model & Firebase Structure

Journal entries are partitioned by `userId` to ensure data isolation, fast index lookups, and compliance with Firebase Realtime Database security rules.

### Node Path: `/food_entries/{userId}/{entryId}`

```json
{
  "food_entries": {
    "qGke3FqaxFeZG5grqIMjAcU0p6q1": {
      "9f4b7a21-72f1-43ef-93a0-388f8d6840ac": {
        "id": "9f4b7a21-72f1-43ef-93a0-388f8d6840ac",
        "user_id": "qGke3FqaxFeZG5grqIMjAcU0p6q1",
        "food_id": "f001",
        "food_name": "Chicken Breast (cooked, skinless)",
        "quantity_g": 200,
        "meal_type": "lunch",
        "source": "manual",
        "calories": 330,
        "protein": 62,
        "carbs": 0,
        "fat": 7.2,
        "date": "2026-09-03",
        "created_at": "2026-09-03T15:22:54.091Z"
      }
    }
  }
}
```

### Field Definitions:

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `String (UUID)` | Unique identifier for the specific entry |
| `user_id` | `String` | Firebase User ID owning this record |
| `food_id` | `String \| null` | Reference to `/foods/{foodId}` if chosen from database |
| `food_name` | `String` | Name of the food item or dish |
| `quantity_g` | `Number` | Portion weight consumed in grams |
| `meal_type` | `String` | Meal slot: `"breakfast"`, `"lunch"`, `"dinner"`, `"snack"` |
| `source` | `String` | Logging source: `"manual"`, `"search"`, or `"meal_plan"` |
| `calories` | `Number` | Energy content in kilocalories (kcal) |
| `protein` | `Number` | Protein content in grams (g) |
| `carbs` | `Number` | Carbohydrate content in grams (g) |
| `fat` | `Number` | Fat content in grams (g) |
| `date` | `String` | ISO date string (`YYYY-MM-DD`) for the logged meal |
| `created_at` | `String` | ISO timestamp of record creation |

---

## 4. Macro Calculation Engine

Nutritional data in the database is stored per 100 grams (`calories_per_100g`, `protein_per_100g`, etc.). When a user specifies an arbitrary portion in grams, the system calculates the nutrients using a scaling factor:

$$\text{factor} = \frac{\text{quantity\_g}}{100}$$

$$\text{Nutrient} = \text{round}\left(\text{Nutrient}_{100\text{g}} \times \text{factor} \times 10\right) / 10$$

### Implementation (`server/controllers/journalController.js`):
```javascript
function computeMacros(food, quantity_g) {
  const factor = quantity_g / 100;
  return {
    calories: Math.round((food.calories_per_100g || 0) * factor * 10) / 10,
    protein:  Math.round((food.protein_per_100g  || 0) * factor * 10) / 10,
    carbs:    Math.round((food.carbs_per_100g    || 0) * factor * 10) / 10,
    fat:      Math.round((food.fat_per_100g      || 0) * factor * 10) / 10,
  };
}
```

*Example:*
- **Food**: 100g Chicken Breast has 165 kcal, 31g protein, 0g carbs, 3.6g fat.
- **Portion**: User logs **200g** ($\text{factor} = 2.0$).
- **Calculated Entry**: **330 kcal**, **62g protein**, **0g carbs**, **7.2g fat**.

---

## 5. Core Features & User Workflows

### 1. Daily Aggregation & Grouping
When the user accesses the journal for a given date (`YYYY-MM-DD`):
1. The backend retrieves all entries under `/food_entries/{userId}`.
2. Filters entries where `entry.date === requestedDate`.
3. Partitions the entries into 4 meal groups:
   - `breakfast`
   - `lunch`
   - `dinner`
   - `snack`
4. Calculates daily aggregated totals:
   $$\text{Total Calories} = \sum \text{Calories}$$
   $$\text{Total Protein} = \sum \text{Protein}$$
   $$\text{Total Carbs} = \sum \text{Carbs}$$
   $$\text{Total Fat} = \sum \text{Fat}$$

### 2. Searching & Adding Foods
1. The user clicks **+ Add Food** on any meal card (e.g. Lunch).
2. The Add Food modal opens with the slot preset to "Lunch".
3. Typing into the search bar triggers a 300ms debounced request to `GET /api/foods/search?q=chicken`.
4. Matching results from the 200 items in Firebase RTDB are displayed.
5. Selecting a food displays its per-100g breakdown and an editable portion input (default 100g).
6. Changing the portion dynamically updates the estimated nutrition.
7. Clicking **Add to Journal** sends a `POST /api/journal/entries` request.
8. The UI updates optimistically, refreshing the meal slot and total daily progress.

### 3. Manual Custom Food Entry
If a food is not in the database:
1. The user toggles to the **Custom Food** tab in the modal.
2. Inputs name, quantity, calories, protein, carbs, and fat directly.
3. Submitting writes the manual entry to Firebase RTDB.

### 4. Deleting Entries
1. Each food item in a meal group has a trash icon.
2. Clicking the trash icon calls `DELETE /api/journal/entries/:id`.
3. The entry is removed from `/food_entries/{userId}/{id}` in Firebase RTDB.
4. Total calories and macronutrient tallies recalculate instantly.

---

## 6. API Specification

All journal endpoints require a valid Bearer JWT token in the `Authorization` header.

### 1. Fetch Daily Journal Entries
- **Endpoint**: `GET /api/journal/entries?date=YYYY-MM-DD`
- **Query Parameters**: `date` (optional, defaults to today)
- **Response**:
```json
{
  "success": true,
  "date": "2026-09-03",
  "entries": {
    "breakfast": [],
    "lunch": [
      {
        "id": "9f4b7a21-72f1-43ef-93a0-388f8d6840ac",
        "food_name": "Chicken Breast (cooked, skinless)",
        "quantity_g": 200,
        "calories": 330,
        "protein": 62,
        "carbs": 0,
        "fat": 7.2,
        "meal_type": "lunch",
        "date": "2026-09-03"
      }
    ],
    "dinner": [],
    "snack": []
  },
  "totals": {
    "calories": 330,
    "protein": 62,
    "carbs": 0,
    "fat": 7.2
  }
}
```

---

### 2. Log a Food Entry
- **Endpoint**: `POST /api/journal/entries`
- **Request Body**:
```json
{
  "food_id": "f001",
  "food_name": "Chicken Breast (cooked, skinless)",
  "quantity_g": 200,
  "meal_type": "lunch",
  "date": "2026-09-03"
}
```
- **Response (201 Created)**:
```json
{
  "success": true,
  "message": "Meal logged successfully.",
  "entry": {
    "id": "9f4b7a21-72f1-43ef-93a0-388f8d6840ac",
    "user_id": "qGke3FqaxFeZG5grqIMjAcU0p6q1",
    "food_name": "Chicken Breast (cooked, skinless)",
    "quantity_g": 200,
    "calories": 330,
    "protein": 62,
    "carbs": 0,
    "fat": 7.2,
    "meal_type": "lunch",
    "date": "2026-09-03",
    "created_at": "2026-09-03T15:22:54.091Z"
  }
}
```

---

### 3. Update an Existing Entry
- **Endpoint**: `PUT /api/journal/entries/:id`
- **Request Body**:
```json
{
  "quantity_g": 250,
  "meal_type": "lunch"
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Entry updated successfully.",
  "entry": { ... }
}
```

---

### 4. Delete an Entry
- **Endpoint**: `DELETE /api/journal/entries/:id`
- **Response**:
```json
{
  "success": true,
  "message": "Entry deleted successfully."
}
```

---

### 5. Daily Summary
- **Endpoint**: `GET /api/journal/summary?date=YYYY-MM-DD`
- **Response**:
```json
{
  "success": true,
  "date": "2026-09-03",
  "totalCalories": 330,
  "totalProtein": 62,
  "totalCarbs": 0,
  "totalFat": 7.2,
  "entryCount": 1
}
```

---

## 7. Frontend Implementation

The frontend is located at `src/pages/dashboard/JournalPage.tsx`.

### Key Components & Layout:

1. **Header & Date Navigation**:
   - Displays current date with previous/next day arrows.
   - Native HTML5 date picker allowing jump to any date.
   - Displays live total calories consumed today.

2. **Daily Macro Progress Cards**:
   - **Calories**: Displays consumed vs. daily target with animated progress bar.
   - **Protein**: Grams consumed vs. protein goal.
   - **Carbs**: Grams consumed vs. carbs goal.
   - **Fat**: Grams consumed vs. fat goal.

3. **Meal Cards (4 Sections)**:
   - **Breakfast** (Coffee / Sunrise theme)
   - **Lunch** (Sun theme)
   - **Dinner** (Sunset / Utensils theme)
   - **Snacks** (Cookie theme)
   - Each card displays subtotal calories for that specific meal and a list of logged items with individual portions, calories, and delete buttons.

4. **Add Food Modal**:
   - Modal dialog that triggers when pressing **+ Add Food** on any meal group.
   - Search input with 300ms debounce.
   - Real-time portion multiplier.
   - Tab to toggle between **Search Database** and **Custom Food Entry**.

---

## 8. Integration with Other Modules

The Food Journal is integrated with other NutriCraft systems:

1. **AI Meal Planner ([MealPlanPage.tsx](file:///c:/Users/rayba/Downloads/Project/NutriCraft/src/pages/dashboard/MealPlanPage.tsx))**:
   - When viewing a generated 7-day meal plan, clicking **"Log to Journal"** calls `POST /api/meal-plans/log-to-journal`.
   - The backend reads the ingredients of the planned meal and batch-writes entries directly into `/food_entries/{userId}` for the current date.

2. **Analytics Dashboard ([AnalyticsPage.tsx](file:///c:/Users/rayba/Downloads/Project/NutriCraft/src/pages/dashboard/AnalyticsPage.tsx))**:
   - Pulls entries across 7-day, 14-day, or 30-day windows.
   - Calculates weekly averages, calorie adherence percentages, and macro distribution charts.

3. **AI Nutrition Coach ([ChatPage.tsx](file:///c:/Users/rayba/Downloads/Project/NutriCraft/src/pages/dashboard/ChatPage.tsx))**:
   - When users ask questions like *"What did I eat today?"* or *"Did I hit my protein target?"*, the AI assistant reads today's journal entries from Firebase RTDB to ground its advice.

---

## 9. CLI Database Inspection

You can inspect all food journal entries across all registered users directly in your terminal using the built-in viewer:

```bash
npm run db:view
```

### Sample Output:
```text
📌 3. FOOD JOURNAL ENTRIES (LOGGED MEALS)
------------------------------------------------------
┌─────────┬─────────────────────────────────────┬─────────┬─────┬─────┬────┬───┬─────┬──────────────┐
│ (index) │ food                                │ meal    │ qty │ cal │ p  │ c │ f   │ date         │
├─────────┼─────────────────────────────────────┼─────────┼─────┼─────┼────┼───┼─────┼──────────────┤
│ 0       │ 'Chicken Breast'                    │ 'lunch' │ 200 │ 330 │ 62 │ 0 │ 7.2 │ '2026-09-03' │
│ 1       │ 'Chicken Breast (cooked, skinless)' │ 'lunch' │ 200 │ 330 │ 62 │ 0 │ 7.2 │ '2026-09-03' │
└─────────┴─────────────────────────────────────┴─────────┴─────┴─────┴────┴───┴─────┴──────────────┘
```
