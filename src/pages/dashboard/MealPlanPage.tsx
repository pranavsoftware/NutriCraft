import React, { useState, useEffect, useCallback } from 'react';
import { mealPlanApi } from '../../services/features';
import { 
  CalendarDays, Sparkles, ShoppingBag, Check, Plus, 
  Loader2, AlertCircle, Flame
} from 'lucide-react';
import ThemeLoader from '../../components/common/ThemeLoader';

interface MealPlanItem {
  id: string;
  day_of_week: number;
  meal_type: string;
  food_name: string;
  quantity_g: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes?: string;
}

interface GroceryItem {
  name: string;
  quantity_g: number;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function MealPlanPage() {
  const [mealPlan, setMealPlan] = useState<MealPlanItem[]>([]);
  const [groceryList, setGroceryList] = useState<GroceryItem[]>([]);
  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'plan' | 'grocery'>('plan');
  const [selectedDay, setSelectedDay] = useState(1);
  const [loggedMealId, setLoggedMealId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const loadMealPlan = useCallback(async () => {
    try {
      setLoading(true);
      const res = await mealPlanApi.get();
      if (res.data.success) {
        setMealPlan(res.data.plan || []);
        if (res.data.groceryList?.items) {
          try {
            setGroceryList(JSON.parse(res.data.groceryList.items));
            setCheckedItems(JSON.parse(res.data.groceryList.checked_state || '{}'));
          } catch {
            setGroceryList([]);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load meal plan:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMealPlan();
  }, [loadMealPlan]);

  const handleGeneratePlan = async () => {
    try {
      setGenerating(true);
      setErrorMsg('');
      const res = await mealPlanApi.generate();
      if (res.data.success) {
        setMealPlan(res.data.plan || []);
        await loadMealPlan();
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setErrorMsg(error.response?.data?.message || 'Failed to generate plan. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleLogMeal = async (item: MealPlanItem) => {
    try {
      await mealPlanApi.logMeal(item.id);
      setLoggedMealId(item.id);
      setTimeout(() => setLoggedMealId(null), 3000);
    } catch (err) {
      console.error('Failed to log meal:', err);
    }
  };

  const handleToggleGrocery = async (name: string) => {
    const updated = { ...checkedItems, [name]: !checkedItems[name] };
    setCheckedItems(updated);
    try {
      await mealPlanApi.updateGrocery(new Date().toISOString().slice(0, 10), updated);
    } catch (err) {
      console.error('Failed to update grocery list:', err);
    }
  };

  const currentDayMeals = mealPlan.filter((m) => m.day_of_week === selectedDay);
  const dayTotalCalories = currentDayMeals.reduce((sum, m) => sum + (m.calories || 0), 0);

  if (loading) {
    return <ThemeLoader message="Assembling your personalized 7-day meal plan..." size="lg" />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
            <CalendarDays size={22} />
          </div>
          <div>
            <h1 className="font-serif-display text-xl sm:text-2xl font-bold text-[#0B1E29]">Weekly Meal Planner</h1>
            <p className="text-xs text-slate-500">Personalized 7-day nutritional strategy with automated grocery checklist</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tab buttons */}
          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => setActiveTab('plan')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'plan' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              7-Day Plan
            </button>
            <button
              onClick={() => setActiveTab('grocery')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'grocery' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <ShoppingBag size={13} />
              <span>Grocery List ({groceryList.length})</span>
            </button>
          </div>

          <button
            onClick={handleGeneratePlan}
            disabled={generating}
            className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-green-600/20 ml-auto sm:ml-0"
          >
            {generating ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>Generate Plan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Content */}
      {activeTab === 'plan' ? (
        <div className="space-y-6">
          {/* Day of Week Selector — Responsive Grid & Overflow Scroll */}
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {DAYS.map((dayName, idx) => {
              const dayNum = idx + 1;
              const isSelected = selectedDay === dayNum;
              return (
                <button
                  key={dayName}
                  onClick={() => setSelectedDay(dayNum)}
                  className={`py-2.5 sm:py-3 px-2 rounded-2xl text-center transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-[#0B1E29] text-white border-[#0B1E29] shadow-md ring-2 ring-green-500/30'
                      : 'bg-white text-slate-700 border-slate-100 hover:border-slate-300'
                  }`}
                >
                  <div className={`text-[10px] uppercase font-bold ${isSelected ? 'text-green-400' : 'text-slate-400'}`}>
                    Day {dayNum}
                  </div>
                  <div className="font-semibold text-xs mt-0.5">{dayName.slice(0, 3)}</div>
                </button>
              );
            })}
          </div>

          {/* Selected Day's Meal Slots */}
          <div className="bg-white p-5 sm:p-8 rounded-3xl border border-slate-100 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h2 className="font-serif-display text-xl font-bold text-[#0B1E29]">
                  {DAYS[selectedDay - 1]} Menu
                </h2>
                <p className="text-xs text-slate-400">Target calibrated for your daily caloric baseline</p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto bg-amber-50 border border-amber-200/60 px-3 py-1.5 rounded-xl">
                <Flame size={16} className="text-amber-500" />
                <span className="font-bold text-slate-900 text-sm">{Math.round(dayTotalCalories)} kcal</span>
              </div>
            </div>

            {loading ? (
              <div className="py-12 flex justify-center">
                <Loader2 size={32} className="text-green-600 animate-spin" />
              </div>
            ) : mealPlan.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center mx-auto">
                  <CalendarDays size={24} />
                </div>
                <p className="font-semibold text-slate-800">No active meal plan generated yet.</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Tap "Generate Plan" above to create an AI-powered 7-day nutrition routine tailored to your calorie and protein goals.
                </p>
                <button
                  onClick={handleGeneratePlan}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors shadow-xs"
                >
                  Generate Plan Now
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {MEAL_TYPES.map((type) => {
                  const meal = currentDayMeals.find((m) => m.meal_type === type);
                  return (
                    <div
                      key={type}
                      className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-3 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-xs font-bold uppercase tracking-wider text-green-700 capitalize">
                            {type}
                          </span>
                          <span className="text-xs font-bold text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200/70">
                            {meal?.calories || 0} kcal
                          </span>
                        </div>

                        <div className="font-semibold text-slate-900 text-sm">
                          {meal?.food_name || 'No meal scheduled'}
                        </div>

                        {meal && (
                          <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-2">
                            <span>{meal.quantity_g}g</span>
                            <span>•</span>
                            <span>P: <strong>{meal.protein}g</strong></span>
                            <span>•</span>
                            <span>C: <strong>{meal.carbs}g</strong></span>
                            <span>•</span>
                            <span>F: <strong>{meal.fat}g</strong></span>
                          </div>
                        )}
                      </div>

                      {meal && (
                        <div className="pt-3 border-t border-slate-200/60 flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleLogMeal(meal)}
                            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-green-50 border border-slate-200 hover:border-green-300 text-slate-700 hover:text-green-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                          >
                            {loggedMealId === meal.id ? (
                              <>
                                <Check size={13} className="text-green-600" />
                                <span className="text-green-600 font-bold">Logged to Journal!</span>
                              </>
                            ) : (
                              <>
                                <Plus size={13} />
                                <span>Log this meal</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Grocery List Tab */
        <div className="bg-white p-5 sm:p-8 rounded-3xl border border-slate-100 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-serif-display text-xl font-bold text-[#0B1E29]">Weekly Grocery Checklist</h2>
              <p className="text-xs text-slate-400">Aggregated ingredients for your 7-day meal plan</p>
            </div>
            <span className="text-xs font-semibold text-green-700 bg-green-50 px-3 py-1 rounded-full w-fit">
              {Object.values(checkedItems).filter(Boolean).length} / {groceryList.length} items checked
            </span>
          </div>

          {groceryList.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              Generate a meal plan first to populate your weekly grocery list!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {groceryList.map((item) => {
                const isChecked = !!checkedItems[item.name];
                return (
                  <div
                    key={item.name}
                    onClick={() => handleToggleGrocery(item.name)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isChecked
                        ? 'bg-slate-50 border-slate-200 opacity-60 line-through text-slate-400'
                        : 'bg-white border-slate-100 hover:border-green-300 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                          isChecked ? 'bg-green-600 border-green-600 text-white' : 'border-slate-300'
                        }`}
                      >
                        {isChecked && <Check size={12} strokeWidth={3} />}
                      </div>
                      <span className="text-sm font-medium capitalize text-slate-800">{item.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-400">{item.quantity_g}g</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
