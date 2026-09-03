import api from './api';

// ── Profile ──────────────────────────────────────────────────────────────────
export const profileApi = {
  get: () => api.get('/profile'),
  update: (data: Record<string, unknown>) => api.put('/profile', data),
  export: () => api.get('/profile/export'),
};

// ── Foods ─────────────────────────────────────────────────────────────────────
export const foodsApi = {
  search: (q: string, limit = 20) => api.get(`/foods/search?q=${encodeURIComponent(q)}&limit=${limit}`),
  getById: (id: string) => api.get(`/foods/${id}`),
  create: (data: Record<string, unknown>) => api.post('/foods', data),
};

// ── Journal ───────────────────────────────────────────────────────────────────
export const journalApi = {
  getEntries: (date?: string) => api.get(`/journal/entries${date ? `?date=${date}` : ''}`),
  addEntry: (data: Record<string, unknown>) => api.post('/journal/entries', data),
  updateEntry: (id: string, data: Record<string, unknown>) => api.put(`/journal/entries/${id}`, data),
  deleteEntry: (id: string) => api.delete(`/journal/entries/${id}`),
};

// ── Analytics ─────────────────────────────────────────────────────────────────
export const analyticsApi = {
  getSummary: (range: 'week' | 'month' | 'year' = 'week') => api.get(`/analytics/summary?range=${range}`),
  getToday: () => api.get('/analytics/today'),
};

// ── Chat ──────────────────────────────────────────────────────────────────────
export const chatApi = {
  getHistory: () => api.get('/chat/history'),
  sendMessage: (message: string) => api.post('/chat/message', { message }),
  clearHistory: () => api.delete('/chat/history'),
};

// ── Meal Plan ─────────────────────────────────────────────────────────────────
export const mealPlanApi = {
  get: (week?: string) => api.get(`/meal-plan${week ? `?week=${week}` : ''}`),
  generate: (week?: string) => api.post('/meal-plan/generate', { week }),
  updateSlot: (id: string, data: Record<string, unknown>) => api.put(`/meal-plan/${id}`, data),
  logMeal: (id: string) => api.post(`/meal-plan/${id}/log`, {}),
  updateGrocery: (week_start_date: string, checked_state: Record<string, boolean>) =>
    api.patch('/meal-plan/grocery', { week_start_date, checked_state }),
};

// ── AI Analyzer ───────────────────────────────────────────────────────────────
export const aiAnalyzerApi = {
  analyze: (imageBase64: string) => api.post('/ai-analyzer/analyze', { imageBase64 }),
  analyzeBarcode: (barcodeText: string) => api.post('/ai-analyzer/analyze', { barcodeText }),
};

// ── Food & Recipes (TheMealDB) ───────────────────────────────────────────────
export const recipeApi = {
  search: (q: string) => api.get(`/recipes/search?q=${encodeURIComponent(q)}`),
  getRandom: () => api.get('/recipes/random'),
  getById: (id: string) => api.get(`/recipes/${id}`),
  getCategories: () => api.get('/recipes/categories'),
  getByCategory: (category: string) => api.get(`/recipes/category/${encodeURIComponent(category)}`),
  getByArea: (area: string) => api.get(`/recipes/area/${encodeURIComponent(area)}`),
  getByIngredient: (ingredient: string) => api.get(`/recipes/ingredient/${encodeURIComponent(ingredient)}`),
};

