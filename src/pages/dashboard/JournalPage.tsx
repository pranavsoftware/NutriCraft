import React, { useState, useEffect, useCallback } from 'react';
import { journalApi, foodsApi } from '../../services/features';
import { 
  Plus, Search, Trash2, Calendar, Flame, Activity, 
  Utensils, Coffee, Sun, Sunset, Cookie, Check, AlertCircle, Loader2
} from 'lucide-react';
import ThemeLoader from '../../components/common/ThemeLoader';

interface FoodItem {
  id?: string;
  name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  serving_unit?: string;
}

interface FoodEntry {
  id: string;
  food_name: string;
  quantity_g: number;
  meal_type: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  date: string;
  source?: string;
}

export default function JournalPage() {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [entries, setEntries] = useState<{ [slot: string]: FoodEntry[] }>({
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  });
  const [totals, setTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [loading, setLoading] = useState<boolean>(true);
  const [activeModalSlot, setActiveModalSlot] = useState<string | null>(null);

  // Search & add food state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState<number>(100);
  const [customName, setCustomName] = useState('');
  const [customCalories, setCustomCalories] = useState('');
  const [customProtein, setCustomProtein] = useState('');
  const [customCarbs, setCustomCarbs] = useState('');
  const [customFat, setCustomFat] = useState('');
  const [isManualCustom, setIsManualCustom] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadEntries = useCallback(async (date: string) => {
    try {
      setLoading(true);
      const res = await journalApi.getEntries(date);
      if (res.data.success) {
        setEntries(res.data.entries || { breakfast: [], lunch: [], dinner: [], snack: [] });
        setTotals(res.data.totals || { calories: 0, protein: 0, carbs: 0, fat: 0 });
      }
    } catch (err) {
      console.error('Failed to load journal entries:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries(selectedDate);
  }, [selectedDate, loadEntries]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await foodsApi.search(searchQuery.trim());
        if (res.data.success) {
          setSearchResults(res.data.foods || []);
        }
      } catch (err) {
        console.error('Food search error:', err);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleOpenAddModal = (slot: string) => {
    setActiveModalSlot(slot);
    setSelectedFood(null);
    setSearchQuery('');
    setSearchResults([]);
    setQuantity(100);
    setIsManualCustom(false);
    setErrorMsg('');
  };

  const handleCloseModal = () => {
    setActiveModalSlot(null);
    setSelectedFood(null);
    setSearchQuery('');
    setErrorMsg('');
  };

  const handleSelectFood = (food: FoodItem) => {
    setSelectedFood(food);
    setQuantity(100);
  };

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalSlot) return;

    try {
      setActionLoading(true);
      setErrorMsg('');

      if (isManualCustom) {
        if (!customName.trim() || !customCalories) {
          setErrorMsg('Food name and calories are required.');
          setActionLoading(false);
          return;
        }
        await journalApi.addEntry({
          food_name: customName.trim(),
          quantity_g: Number(quantity) || 100,
          meal_type: activeModalSlot,
          calories: Number(customCalories) || 0,
          protein: Number(customProtein) || 0,
          carbs: Number(customCarbs) || 0,
          fat: Number(customFat) || 0,
          date: selectedDate,
          source: 'manual_custom',
        });
      } else {
        if (!selectedFood) {
          setErrorMsg('Please select a food item or enter custom details.');
          setActionLoading(false);
          return;
        }
        await journalApi.addEntry({
          food_id: selectedFood.id,
          food_name: selectedFood.name,
          quantity_g: Number(quantity) || 100,
          meal_type: activeModalSlot,
          date: selectedDate,
          source: 'database',
        });
      }

      handleCloseModal();
      await loadEntries(selectedDate);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setErrorMsg(error.response?.data?.message || 'Failed to save food entry.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!window.confirm('Delete this food entry?')) return;
    try {
      await journalApi.deleteEntry(id);
      await loadEntries(selectedDate);
    } catch (err) {
      console.error('Failed to delete entry:', err);
    }
  };

  const mealSlots = [
    { key: 'breakfast', label: 'Breakfast', icon: <Coffee className="text-amber-500" size={18} /> },
    { key: 'lunch', label: 'Lunch', icon: <Sun className="text-orange-500" size={18} /> },
    { key: 'dinner', label: 'Dinner', icon: <Sunset className="text-indigo-500" size={18} /> },
    { key: 'snack', label: 'Snacks & Bites', icon: <Cookie className="text-emerald-500" size={18} /> },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header & Date Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h1 className="font-serif-display text-2xl font-bold text-[#0B1E29]">Daily Food Journal</h1>
          <p className="text-sm text-slate-500">Track and manage your meal slots with nutritional accuracy.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
            <Calendar size={16} className="text-green-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-sm font-medium text-slate-700 outline-none cursor-pointer"
            />
          </div>
          <button
            onClick={() => setSelectedDate(new Date().toISOString().slice(0, 10))}
            className="text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 px-3 py-2 rounded-xl transition-colors cursor-pointer"
          >
            Today
          </button>
        </div>
      </div>

      {/* Daily Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Flame size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase">Total Calories</div>
            <div className="text-xl font-bold text-slate-900">{Math.round(totals.calories)} <span className="text-xs font-normal text-slate-500">kcal</span></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Activity size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase">Protein</div>
            <div className="text-xl font-bold text-slate-900">{Math.round(totals.protein)} <span className="text-xs font-normal text-slate-500">g</span></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <Utensils size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase">Carbs</div>
            <div className="text-xl font-bold text-slate-900">{Math.round(totals.carbs)} <span className="text-xs font-normal text-slate-500">g</span></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <Flame size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase">Fats</div>
            <div className="text-xl font-bold text-slate-900">{Math.round(totals.fat)} <span className="text-xs font-normal text-slate-500">g</span></div>
          </div>
        </div>
      </div>

      {/* Meal Slots List */}
      {loading ? (
        <ThemeLoader message="Retrieving your food journal entries..." size="md" />
      ) : (
        <div className="space-y-6">
          {mealSlots.map((slot) => {
            const slotEntries = entries[slot.key] || [];
            const slotCalories = slotEntries.reduce((sum, e) => sum + (e.calories || 0), 0);

            return (
              <div key={slot.key} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
                <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {slot.icon}
                    <h3 className="font-serif-display text-lg font-bold text-[#0B1E29]">{slot.label}</h3>
                    <span className="text-xs font-medium text-slate-400">({slotEntries.length} {slotEntries.length === 1 ? 'item' : 'items'})</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-slate-800">{Math.round(slotCalories)} <span className="text-xs font-normal text-slate-500">kcal</span></span>
                    <button
                      onClick={() => handleOpenAddModal(slot.key)}
                      className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <Plus size={14} />
                      <span>Log Food</span>
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {slotEntries.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-sm">
                      No foods logged for {slot.label.toLowerCase()} yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {slotEntries.map((entry) => (
                        <div key={entry.id} className="py-3 flex items-center justify-between gap-4">
                          <div>
                            <div className="font-semibold text-slate-900 text-sm">{entry.food_name}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                              <span>{entry.quantity_g}g</span>
                              <span>•</span>
                              <span>P: {entry.protein}g</span>
                              <span>•</span>
                              <span>C: {entry.carbs}g</span>
                              <span>•</span>
                              <span>F: {entry.fat}g</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="font-bold text-sm text-slate-800">{Math.round(entry.calories)} kcal</span>
                            <button
                              onClick={() => handleDeleteEntry(entry.id)}
                              className="text-slate-300 hover:text-red-500 transition-colors p-1"
                              title="Delete entry"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Food Modal */}
      {activeModalSlot && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-serif-display text-xl font-bold text-[#0B1E29]">
                  Log to {mealSlots.find(s => s.key === activeModalSlot)?.label}
                </h3>
                <p className="text-xs text-slate-400">Search database or enter custom nutrition info</p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Toggle DB Search vs Manual Custom */}
            <div className="flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setIsManualCustom(false)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  !isManualCustom ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Search Food Database
              </button>
              <button
                type="button"
                onClick={() => setIsManualCustom(true)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  isManualCustom ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Custom Quick Entry
              </button>
            </div>

            {!isManualCustom ? (
              <div className="space-y-4">
                {/* Search input */}
                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search e.g. Chicken breast, Oatmeal, Paneer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-green-600 focus:outline-none"
                    autoFocus
                  />
                  {searching && (
                    <Loader2 size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-green-600 animate-spin" />
                  )}
                </div>

                {/* Search Results */}
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {searchResults.map((food) => {
                    const isSelected = selectedFood?.name === food.name;
                    return (
                      <div
                        key={food.id || food.name}
                        onClick={() => handleSelectFood(food)}
                        className={`food-result-item ${isSelected ? 'border-green-600 bg-green-50/70' : ''}`}
                      >
                        <div>
                          <div className="font-semibold text-sm text-slate-900">{food.name}</div>
                          <div className="text-xs text-slate-400">
                            {food.calories_per_100g} kcal per 100g • P: {food.protein_per_100g}g • C: {food.carbs_per_100g}g • F: {food.fat_per_100g}g
                          </div>
                        </div>
                        {isSelected && <Check size={16} className="text-green-600" />}
                      </div>
                    );
                  })}
                  {searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
                    <div className="text-center py-4 text-xs text-slate-400">
                      No matching foods found. Try custom quick entry.
                    </div>
                  )}
                </div>

                {/* Selected Food & Quantity */}
                {selectedFood && (
                  <div className="p-4 rounded-2xl bg-green-50/50 border border-green-200 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm text-green-900">{selectedFood.name}</span>
                      <span className="text-xs font-semibold text-green-700">
                        {Math.round((selectedFood.calories_per_100g * quantity) / 100)} kcal
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="text-xs font-semibold text-slate-600">Portion (grams):</label>
                      <input
                        type="number"
                        min="1"
                        max="2000"
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="w-24 px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold bg-white text-slate-800"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Manual Custom Form */
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Food / Meal Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Grandma's Vegetable Soup"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-green-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Calories (kcal) *</label>
                    <input
                      type="number"
                      placeholder="e.g. 350"
                      value={customCalories}
                      onChange={(e) => setCustomCalories(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-green-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Portion (g)</label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-green-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Protein (g)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={customProtein}
                      onChange={(e) => setCustomProtein(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-green-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Carbs (g)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={customCarbs}
                      onChange={(e) => setCustomCarbs(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-green-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Fat (g)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={customFat}
                      onChange={(e) => setCustomFat(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-green-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading || (!isManualCustom && !selectedFood)}
                onClick={handleSaveEntry}
                className="px-6 py-2 rounded-xl bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:opacity-50 text-white text-sm font-semibold transition-colors cursor-pointer shadow-md shadow-green-600/20"
              >
                {actionLoading ? 'Saving...' : 'Add to Journal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
