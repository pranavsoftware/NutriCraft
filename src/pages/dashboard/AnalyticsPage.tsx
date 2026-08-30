import React, { useState, useEffect, useCallback } from 'react';
import { analyticsApi } from '../../services/features';
import { 
  BarChart3, TrendingUp, TrendingDown, Flame, Activity, 
  Download, Calendar, Award
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid 
} from 'recharts';
import ThemeLoader from '../../components/common/ThemeLoader';

interface DailyData {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface SummaryData {
  totalCalories: number;
  avgCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  activeDays: number;
  calorieTrend: number;
}

interface MealBreakdown {
  meal_type: string;
  calories: number;
  entries: number;
}

interface WeightLog {
  weight_kg: number;
  logged_at: string;
}

const COLORS = ['#16a34a', '#3b82f6', '#f59e0b', '#8b5cf6'];

export default function AnalyticsPage() {
  const [range, setRange] = useState<'week' | 'month' | 'year'>('week');
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [mealBreakdown, setMealBreakdown] = useState<MealBreakdown[]>([]);
  const [weightHistory, setWeightHistory] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = useCallback(async (r: 'week' | 'month' | 'year') => {
    try {
      setLoading(true);
      const res = await analyticsApi.getSummary(r);
      if (res.data.success) {
        setDailyData(res.data.dailyData || []);
        setSummary(res.data.summary || null);
        setMealBreakdown(res.data.mealBreakdown || []);
        setWeightHistory(res.data.weightHistory || []);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics(range);
  }, [range, loadAnalytics]);

  const handlePrintPdf = () => {
    window.print();
  };

  const macroPieData = summary
    ? [
        { name: 'Protein (g)', value: summary.totalProtein },
        { name: 'Carbs (g)', value: summary.totalCarbs },
        { name: 'Fats (g)', value: summary.totalFat },
      ]
    : [];

  if (loading) {
    return <ThemeLoader message="Analyzing your metabolic trends & macro charts..." size="lg" />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <h1 className="font-serif-display text-2xl font-bold text-[#0B1E29]">Nutrition Analytics & Trends</h1>
          <p className="text-xs text-slate-500">Comprehensive historical overview and dietary distribution</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex rounded-xl bg-slate-100 p-1">
            {(['week', 'month', 'year'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg capitalize transition-colors cursor-pointer ${
                  range === r ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {r === 'week' ? '7 Days' : r === 'month' ? '30 Days' : '1 Year'}
              </button>
            ))}
          </div>

          <button
            onClick={handlePrintPdf}
            className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Export PDF</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Average Daily Intake</span>
            <Flame size={18} className="text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{summary?.avgCalories || 0} <span className="text-xs font-normal text-slate-500">kcal/day</span></div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            {summary?.calorieTrend && summary.calorieTrend > 0 ? (
              <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                <TrendingUp size={12} /> +{summary.calorieTrend}% vs prev period
              </span>
            ) : (
              <span className="text-slate-500 flex items-center gap-0.5">
                <TrendingDown size={12} /> {summary?.calorieTrend || 0}% vs prev period
              </span>
            )}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Total Protein Logged</span>
            <Activity size={18} className="text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{summary?.totalProtein || 0} <span className="text-xs font-normal text-slate-500">grams</span></div>
          <div className="text-xs text-slate-400 mt-1">
            Muscle retention & metabolic fuel
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Logged Days</span>
            <Calendar size={18} className="text-green-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{summary?.activeDays || 0} <span className="text-xs font-normal text-slate-500">active days</span></div>
          <div className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1">
            <Award size={12} /> High tracking consistency
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Total Calories</span>
            <Flame size={18} className="text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{summary?.totalCalories || 0} <span className="text-xs font-normal text-slate-500">kcal total</span></div>
          <div className="text-xs text-slate-400 mt-1">Across selected range</div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Calorie Intake Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-serif-display text-lg font-bold text-[#0B1E29]">Daily Calorie History</h3>
              <p className="text-xs text-slate-400">Total calories consumed per logged day</p>
            </div>
            <BarChart3 size={18} className="text-green-600" />
          </div>

          <div className="h-64 w-full pt-4">
            {dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0B1E29',
                      color: '#fff',
                      borderRadius: '12px',
                      border: 'none',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="calories" fill="#16a34a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                No meal entries logged in this time range. Start logging meals to see charts!
              </div>
            )}
          </div>
        </div>

        {/* Macro Distribution Donut */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
          <div>
            <h3 className="font-serif-display text-lg font-bold text-[#0B1E29]">Macronutrient Split</h3>
            <p className="text-xs text-slate-400">Grams of protein, carbs & fats</p>
          </div>

          <div className="h-52 w-full">
            {summary && (summary.totalProtein > 0 || summary.totalCarbs > 0 || summary.totalFat > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={macroPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {macroPieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0B1E29',
                      color: '#fff',
                      borderRadius: '12px',
                      border: 'none',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                No macro data logged yet.
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-600 inline-block" /> Protein</span>
              <span className="font-bold text-slate-800">{summary?.totalProtein || 0}g</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Carbs</span>
              <span className="font-bold text-slate-800">{summary?.totalCarbs || 0}g</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Fats</span>
              <span className="font-bold text-slate-800">{summary?.totalFat || 0}g</span>
            </div>
          </div>
        </div>
      </div>

      {/* Weight History Line Chart */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-serif-display text-lg font-bold text-[#0B1E29]">Weight Log History</h3>
            <p className="text-xs text-slate-400">Historical weight recordings from your profile updates</p>
          </div>
        </div>

        <div className="h-56 w-full pt-2">
          {weightHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightHistory}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="logged_at" tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(d) => d?.slice(5, 10)} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: '#94a3b8' }} unit="kg" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B1E29',
                    color: '#fff',
                    borderRadius: '12px',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <Line type="monotone" dataKey="weight_kg" stroke="#16a34a" strokeWidth={3} dot={{ r: 4, fill: '#16a34a' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
              No weight logs recorded. Update your weight in your Profile page to chart progress!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
