import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { analyticsApi, profileApi } from '../services/features';
import { 
  Flame, Activity, BookOpen, Camera, BarChart3, 
  MessageCircle, CalendarDays, User, ArrowRight, 
  Sparkles, CheckCircle2, ShieldCheck, Plus, TrendingUp
} from 'lucide-react';
import ThemeLoader from '../components/common/ThemeLoader';

interface TodayConsumed {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  entries: number;
}

interface TargetData {
  daily_calorie_target: number;
  daily_protein_target: number;
  daily_carb_target: number;
  daily_fat_target: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [consumed, setConsumed] = useState<TodayConsumed>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    entries: 0,
  });
  const [targets, setTargets] = useState<TargetData>({
    daily_calorie_target: 2000,
    daily_protein_target: 120,
    daily_carb_target: 250,
    daily_fat_target: 65,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [todayRes, profileRes] = await Promise.all([
          analyticsApi.getToday(),
          profileApi.get(),
        ]);

        if (todayRes.data.success) {
          setConsumed(todayRes.data.consumed);
          if (todayRes.data.targets) {
            setTargets(todayRes.data.targets);
          }
        }

        if (profileRes.data.success && profileRes.data.profile) {
          setTargets({
            daily_calorie_target: profileRes.data.profile.daily_calorie_target || 2000,
            daily_protein_target: profileRes.data.profile.daily_protein_target || 120,
            daily_carb_target: profileRes.data.profile.daily_carb_target || 250,
            daily_fat_target: profileRes.data.profile.daily_fat_target || 65,
          });
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (loading) {
    return <ThemeLoader message="Calibrating your daily nutrition dashboard..." size="lg" />;
  }

  const calPercent = Math.min(Math.round((consumed.calories / (targets.daily_calorie_target || 2000)) * 100), 100);
  const protPercent = Math.min(Math.round((consumed.protein / (targets.daily_protein_target || 120)) * 100), 100);
  const carbPercent = Math.min(Math.round((consumed.carbs / (targets.daily_carb_target || 250)) * 100), 100);
  const fatPercent = Math.min(Math.round((consumed.fat / (targets.daily_fat_target || 65)) * 100), 100);

  const featureCards = [
    {
      to: '/dashboard/journal',
      title: 'Food Journal',
      desc: 'Log daily breakfast, lunch, dinner & snack slots with macro calculation.',
      icon: <BookOpen size={20} className="text-green-600" />,
      tag: `${consumed.entries} logged today`,
      color: 'bg-green-50 text-green-700 border-green-200',
    },
    {
      to: '/dashboard/analyzer',
      title: 'AI Vision Analyzer',
      desc: 'Upload a meal photo or barcode for automated nutritional recognition.',
      icon: <Camera size={20} className="text-emerald-600" />,
      tag: 'Gemini Vision',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      to: '/dashboard/analytics',
      title: 'Analytics & Trends',
      desc: 'Interactive Recharts graphs, weekly macro breakdown & PDF reports.',
      icon: <BarChart3 size={20} className="text-blue-600" />,
      tag: 'Insights',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      to: '/dashboard/chat',
      title: 'AI Nutritionist Chat',
      desc: 'Real-time dietary assistant aware of your daily calories and goals.',
      icon: <MessageCircle size={20} className="text-purple-600" />,
      tag: 'Active Context',
      color: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      to: '/dashboard/meal-plan',
      title: '7-Day Meal Planner',
      desc: 'AI tailored weekly menus with automated grocery shopping list.',
      icon: <CalendarDays size={20} className="text-amber-600" />,
      tag: 'Planner',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      to: '/dashboard/profile',
      title: 'Profile & Targets',
      desc: 'Biometrics, dietary restrictions, Mifflin-St Jeor equation setup.',
      icon: <User size={20} className="text-slate-700" />,
      tag: 'Biometrics',
      color: 'bg-slate-50 text-slate-700 border-slate-200',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome Hero Banner */}
      <div className="bg-gradient-to-r from-[#0B1E29] via-[#102d3e] to-[#0B1E29] rounded-3xl p-6 sm:p-8 md:p-10 text-white shadow-xl shadow-slate-200/60 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full opacity-10 bg-[radial-gradient(#22c55e_2px,transparent_2px)] [background-size:16px_16px] pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold backdrop-blur-md mb-4 border border-green-500/30">
            <Sparkles size={14} />
            <span>Personalized Nutrition Portal</span>
          </div>

          <h1 className="font-serif-display text-2xl sm:text-4xl font-bold mb-3 leading-tight">
            Welcome back, <span className="text-green-400">{user?.name}</span>!
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
            Track today's calories, scan food photos with AI, and review your weekly macro distributions.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/dashboard/journal"
              className="py-2.5 px-6 rounded-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold text-sm transition-all shadow-md shadow-green-600/30 inline-flex items-center gap-2"
            >
              <Plus size={16} />
              <span>Log a Meal Today</span>
            </Link>
            <Link
              to="/dashboard/analyzer"
              className="py-2.5 px-5 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-colors border border-white/20 inline-flex items-center gap-2"
            >
              <Camera size={16} />
              <span>Scan Food Photo</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Live Macro Progress Bar Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Calories */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Calories Today</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Flame size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">
              {consumed.calories} <span className="text-xs font-normal text-slate-400">/ {targets.daily_calorie_target} kcal</span>
            </div>
            <div className="macro-bar-track mt-2">
              <div className="macro-bar-fill bg-amber-500" style={{ width: `${calPercent}%` }} />
            </div>
          </div>
          <div className="text-[11px] text-slate-500 font-medium flex justify-between">
            <span>{calPercent}% consumed</span>
            <span>{Math.max(targets.daily_calorie_target - consumed.calories, 0)} kcal left</span>
          </div>
        </div>

        {/* Protein */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Protein Goal</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Activity size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">
              {consumed.protein} <span className="text-xs font-normal text-slate-400">/ {targets.daily_protein_target} g</span>
            </div>
            <div className="macro-bar-track mt-2">
              <div className="macro-bar-fill bg-blue-600" style={{ width: `${protPercent}%` }} />
            </div>
          </div>
          <div className="text-[11px] text-slate-500 font-medium flex justify-between">
            <span>{protPercent}% completed</span>
            <span>{Math.max(targets.daily_protein_target - consumed.protein, 0)}g remaining</span>
          </div>
        </div>

        {/* Carbs */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Carbohydrates</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">
              {consumed.carbs} <span className="text-xs font-normal text-slate-400">/ {targets.daily_carb_target} g</span>
            </div>
            <div className="macro-bar-track mt-2">
              <div className="macro-bar-fill bg-emerald-500" style={{ width: `${carbPercent}%` }} />
            </div>
          </div>
          <div className="text-[11px] text-slate-500 font-medium flex justify-between">
            <span>{carbPercent}% consumed</span>
            <span>{Math.max(targets.daily_carb_target - consumed.carbs, 0)}g remaining</span>
          </div>
        </div>

        {/* Fat */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Healthy Fats</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">
              {consumed.fat} <span className="text-xs font-normal text-slate-400">/ {targets.daily_fat_target} g</span>
            </div>
            <div className="macro-bar-track mt-2">
              <div className="macro-bar-fill bg-purple-500" style={{ width: `${fatPercent}%` }} />
            </div>
          </div>
          <div className="text-[11px] text-slate-500 font-medium flex justify-between">
            <span>{fatPercent}% consumed</span>
            <span>{Math.max(targets.daily_fat_target - consumed.fat, 0)}g remaining</span>
          </div>
        </div>
      </div>

      {/* Feature Quick Launch Cards */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-serif-display text-xl font-bold text-[#0B1E29]">NutriCraft Feature Modules</h2>
          <span className="text-xs text-slate-400">Connected to Turso Cloud libSQL</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {featureCards.map((feat) => (
            <Link
              key={feat.to}
              to={feat.to}
              className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs hover:shadow-md hover:border-green-300 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 group-hover:bg-green-50 flex items-center justify-center transition-colors">
                    {feat.icon}
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${feat.color}`}>
                    {feat.tag}
                  </span>
                </div>

                <h3 className="font-serif-display font-bold text-lg text-slate-900 group-hover:text-green-700 transition-colors">
                  {feat.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {feat.desc}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-green-700">
                <span>Open Module</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
