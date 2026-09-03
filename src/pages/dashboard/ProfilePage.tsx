import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileApi } from '../../services/features';
import { useAuth } from '../../context/AuthContext';
import { 
  Check, AlertCircle, Loader2, 
  Flame, Activity, ShieldCheck, Scale, Info, History,
  Sparkles, ArrowRight, LockOpen, Lock, Utensils,
  ChevronRight, HeartPulse
} from 'lucide-react';
import ThemeLoader from '../../components/common/ThemeLoader';

interface ProfileData {
  age?: number | string;
  height_cm?: number | string;
  weight_kg?: number | string;
  gender?: string;
  activity_level?: string;
  goal?: string;
  dietary_preference?: string;
  allergies?: string;
  daily_calorie_target?: number;
  daily_protein_target?: number;
  daily_carb_target?: number;
  daily_fat_target?: number;
}

interface WeightLogItem {
  weight_kg: number;
  logged_at: string;
}

const ACTIVITY_OPTIONS = [
  {
    key: 'sedentary',
    label: 'Sedentary',
    sub: 'Desk job, little to no exercise',
    mult: '1.20x',
  },
  {
    key: 'light',
    label: 'Light Activity',
    sub: 'Light exercise 1–3 days/week',
    mult: '1.375x',
  },
  {
    key: 'moderate',
    label: 'Moderate Activity',
    sub: 'Moderate training 3–5 days/week',
    mult: '1.55x',
  },
  {
    key: 'active',
    label: 'Very Active',
    sub: 'Intense training 6–7 days/week',
    mult: '1.725x',
  },
  {
    key: 'very_active',
    label: 'Athlete / Heavy Labor',
    sub: 'Daily double sessions or intense labor',
    mult: '1.90x',
  },
];

const GOAL_OPTIONS = [
  {
    key: 'lose_weight',
    label: 'Fat Loss & Leaning',
    desc: '-400 kcal deficit',
    tag: 'Caloric Deficit',
    icon: '🔥',
  },
  {
    key: 'maintain',
    label: 'Weight Maintenance',
    desc: 'Metabolic equilibrium at TDEE',
    tag: 'Healthy Balance',
    icon: '⚖️',
  },
  {
    key: 'gain_muscle',
    label: 'Lean Muscle Building',
    desc: '+300 kcal surplus for growth',
    tag: 'Caloric Surplus',
    icon: '💪',
  },
];

const DIETARY_OPTIONS = [
  { key: 'none', label: 'Standard / Omnivore' },
  { key: 'vegetarian', label: 'Vegetarian' },
  { key: 'vegan', label: 'Vegan' },
  { key: 'keto', label: 'Keto / Low-Carb' },
  { key: 'pescatarian', label: 'Pescatarian' },
];

const COMMON_ALLERGIES = ['Peanuts', 'Tree Nuts', 'Dairy / Lactose', 'Gluten', 'Shellfish', 'Eggs', 'Soy'];

export default function ProfilePage() {
  const { user, markProfileComplete } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileData>({
    age: '',
    height_cm: '',
    weight_kg: '',
    gender: 'male',
    activity_level: 'moderate',
    goal: 'maintain',
    dietary_preference: 'none',
    allergies: '',
    daily_calorie_target: 2000,
    daily_protein_target: 120,
    daily_carb_target: 250,
    daily_fat_target: 65,
  });

  const [weightHistory, setWeightHistory] = useState<WeightLogItem[]>([]);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const isProfileRequired = !user?.isProfileComplete || !hasExistingProfile;

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await profileApi.get();
      if (res.data.success) {
        if (res.data.profile) {
          setProfile(res.data.profile);
          setHasExistingProfile(true);
        } else {
          setHasExistingProfile(false);
        }
        if (res.data.weightHistory) {
          setWeightHistory(res.data.weightHistory);
        }
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  // Real-time live calculation of Mifflin-St Jeor values
  const liveCalculation = useMemo(() => {
    const a = Number(profile.age) || 25;
    const h = Number(profile.height_cm) || 170;
    const w = Number(profile.weight_kg) || 70;
    const g = profile.gender || 'male';
    const act = profile.activity_level || 'moderate';
    const goal = profile.goal || 'maintain';

    // BMR
    let bmr = 10 * w + 6.25 * h - 5 * a;
    bmr += (g === 'female' ? -161 : 5);

    // Multiplier
    const mults: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };
    const multiplier = mults[act] || 1.55;
    let tdee = Math.round(bmr * multiplier);

    // Goal adjustment
    let calories = tdee;
    if (goal === 'lose_weight') calories -= 400;
    else if (goal === 'gain_muscle') calories += 300;

    calories = Math.max(calories, 1200);

    // Macro splits
    const splits: Record<string, { protein: number; carbs: number; fat: number }> = {
      lose_weight: { protein: 0.35, carbs: 0.35, fat: 0.30 },
      gain_muscle: { protein: 0.30, carbs: 0.45, fat: 0.25 },
      maintain:    { protein: 0.25, carbs: 0.50, fat: 0.25 },
    };
    const split = splits[goal] || splits.maintain;

    const protein = Math.round((calories * split.protein) / 4);
    const carbs = Math.round((calories * split.carbs) / 4);
    const fat = Math.round((calories * split.fat) / 9);

    // BMI
    const heightM = h / 100;
    const bmi = Number((w / (heightM * heightM)).toFixed(1));

    let bmiCategory = 'Healthy Range';
    let bmiColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (bmi < 18.5) {
      bmiCategory = 'Underweight';
      bmiColor = 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    } else if (bmi >= 25 && bmi < 30) {
      bmiCategory = 'Overweight';
      bmiColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    } else if (bmi >= 30) {
      bmiCategory = 'High BMI';
      bmiColor = 'text-red-400 bg-red-500/10 border-red-500/30';
    }

    return {
      bmr: Math.round(bmr),
      tdee,
      calories,
      protein,
      carbs,
      fat,
      bmi,
      bmiCategory,
      bmiColor,
    };
  }, [profile.age, profile.height_cm, profile.weight_kg, profile.gender, profile.activity_level, profile.goal]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.age || !profile.height_cm || !profile.weight_kg) {
      setErrorMsg('Please enter your age, height, and weight to calculate your metabolic targets.');
      return;
    }

    try {
      setSaving(true);
      setErrorMsg('');
      const res = await profileApi.update({
        age: Number(profile.age),
        height_cm: Number(profile.height_cm),
        weight_kg: Number(profile.weight_kg),
        gender: profile.gender || 'male',
        activity_level: profile.activity_level || 'moderate',
        goal: profile.goal || 'maintain',
        dietary_preference: profile.dietary_preference || 'none',
        allergies: profile.allergies || '',
      });

      if (res.data.success && res.data.profile) {
        setProfile(res.data.profile);
        setHasExistingProfile(true);
        markProfileComplete();
        setJustUnlocked(true);
        setSuccessMsg('🎉 Profile calibrated and saved! All NutriCraft features are now unlocked.');
        await loadProfile();

        if (isProfileRequired) {
          setTimeout(() => {
            navigate('/dashboard');
          }, 2400);
        }
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setErrorMsg(error.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAllergyTag = (tag: string) => {
    const current = profile.allergies ? profile.allergies.split(',').map((s) => s.trim()) : [];
    let updated: string[];
    if (current.includes(tag)) {
      updated = current.filter((item) => item !== tag);
    } else {
      updated = [...current, tag];
    }
    setProfile({ ...profile, allergies: updated.join(', ') });
  };

  if (loading) {
    return <ThemeLoader message="Loading your biometric profile & target macros..." size="lg" />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* ── Celebration Card When Profile Just Unlocked ── */}
      {justUnlocked && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-900/90 via-teal-950 to-[#0B1E29] border-2 border-emerald-500/50 text-white shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold shadow-lg shrink-0">
              <LockOpen size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">All Features Successfully Unlocked!</h3>
              <p className="text-xs text-emerald-200">
                Your custom daily caloric targets and macronutrients have been saved to the cloud database. Redirecting to your dashboard...
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center gap-2 transition-all shadow-lg hover:scale-105 active:scale-95 shrink-0 cursor-pointer"
          >
            <span>Enter Dashboard</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* ── Success / Error Alerts ── */}
      {successMsg && !justUnlocked && (
        <div className="p-4 rounded-2xl bg-green-50 border border-green-200 text-green-800 text-sm flex items-center gap-2.5 shadow-xs">
          <Check size={18} className="text-green-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2.5 shadow-xs">
          <AlertCircle size={18} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── Unified Hero & Live Metabolic Target Card ── */}
      <section className="bg-gradient-to-br from-[#071722] via-[#0B1E29] to-[#0D2534] text-white p-6 sm:p-8 rounded-3xl border border-white/10 shadow-xl relative overflow-hidden space-y-6">
        {/* Subtle Ambient Background Mesh */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-0" />

        {/* Card Header & Status Badges */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <HeartPulse size={13} />
                Mifflin-St Jeor Clinical Standard
              </span>
              {isProfileRequired ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  <Lock size={11} /> Step 1 Required
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  <ShieldCheck size={12} /> Database Linked
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold font-serif-display text-white tracking-tight">
              Metabolic Profile & Nutrition Calibration
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              {isProfileRequired 
                ? 'Complete your biometric measurements below to calculate your metabolic targets and unlock all platform features.'
                : 'Your daily energy requirements calibrated against your active biometric measurements.'}
            </p>
          </div>

          {/* Live BMR & TDEE Badges */}
          <div className="flex items-center gap-3 bg-white/5 p-2.5 rounded-2xl border border-white/10 shrink-0 self-start sm:self-auto">
            <div className="text-right px-2">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Basal Rate (BMR)</div>
              <div className="text-sm font-extrabold text-slate-200">
                {liveCalculation.bmr} <span className="text-[10px] font-normal text-slate-400">kcal</span>
              </div>
            </div>
            <div className="w-px h-7 bg-white/10" />
            <div className="text-left px-2">
              <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Total TDEE</div>
              <div className="text-sm font-extrabold text-emerald-300">
                {liveCalculation.tdee} <span className="text-[10px] font-normal text-slate-400">kcal</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Live Metric Tiles */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-1">
          {/* Daily Calories */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/40 transition-all group">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              <span className="flex items-center gap-1 text-amber-400">
                <Flame size={14} className="animate-pulse" /> Calories
              </span>
              <span className="text-[10px] font-normal text-slate-400 lowercase">target</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {liveCalculation.calories}
              <span className="text-xs font-normal text-slate-400 ml-1">kcal</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>{profile.goal === 'lose_weight' ? '-400 kcal deficit' : profile.goal === 'gain_muscle' ? '+300 kcal surplus' : 'equilibrium'}</span>
            </div>
          </div>

          {/* Daily Protein */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/40 transition-all group">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              <span className="flex items-center gap-1 text-blue-400">
                <Activity size={14} /> Protein
              </span>
              <span className="text-[10px] font-semibold text-blue-300 bg-blue-500/10 px-1.5 py-0.5 rounded">
                {profile.goal === 'lose_weight' ? '35%' : profile.goal === 'gain_muscle' ? '30%' : '25%'}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {liveCalculation.protein}
              <span className="text-xs font-normal text-slate-400 ml-1">g</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Muscle retention & repair
            </div>
          </div>

          {/* Daily Carbs */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/40 transition-all group">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              <span className="flex items-center gap-1 text-emerald-400">
                <Utensils size={14} /> Carbs
              </span>
              <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                {profile.goal === 'lose_weight' ? '35%' : profile.goal === 'gain_muscle' ? '45%' : '50%'}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {liveCalculation.carbs}
              <span className="text-xs font-normal text-slate-400 ml-1">g</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Energy & brain glycogen
            </div>
          </div>

          {/* Daily Fats */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/40 transition-all group">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              <span className="flex items-center gap-1 text-purple-400">
                <ShieldCheck size={14} /> Healthy Fats
              </span>
              <span className="text-[10px] font-semibold text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded">
                {profile.goal === 'lose_weight' ? '30%' : '25%'}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {liveCalculation.fat}
              <span className="text-xs font-normal text-slate-400 ml-1">g</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Hormone & cell vitality
            </div>
          </div>
        </div>

        {/* Live Calculation Footer Info */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Live Interactive Preview • Values dynamically recalculate as you adjust parameters below.</span>
          </div>

          {profile.height_cm && profile.weight_kg && (
            <div className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${liveCalculation.bmiColor}`}>
              BMI {liveCalculation.bmi} • {liveCalculation.bmiCategory}
            </div>
          )}
        </div>
      </section>

      {/* ── Main Biometric Configuration Form ── */}
      <form onSubmit={handleSave} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8">
        
        {/* Section 1: Body Measurements */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-serif-display text-lg font-bold text-[#0B1E29] flex items-center gap-2">
                <span>1. Core Biometric Measurements</span>
              </h2>
              <p className="text-xs text-slate-500">Essential parameters for calculating BMR and energy output.</p>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Required
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Age */}
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Age *</span>
                <span className="text-[10px] font-medium text-slate-400">years</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="10"
                  max="120"
                  placeholder="e.g. 26"
                  required
                  value={profile.age ?? ''}
                  onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-slate-900 font-bold text-base focus:border-green-600 focus:ring-2 focus:ring-green-500/10 focus:outline-none transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
                  yrs
                </span>
              </div>
            </div>

            {/* Height */}
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Height *</span>
                <span className="text-[10px] font-medium text-slate-400">centimeters</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="50"
                  max="260"
                  placeholder="e.g. 175"
                  required
                  value={profile.height_cm ?? ''}
                  onChange={(e) => setProfile({ ...profile, height_cm: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-slate-900 font-bold text-base focus:border-green-600 focus:ring-2 focus:ring-green-500/10 focus:outline-none transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
                  cm
                </span>
              </div>
            </div>

            {/* Weight */}
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Current Weight *</span>
                <span className="text-[10px] font-medium text-slate-400">kilograms</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="20"
                  max="350"
                  placeholder="e.g. 72.5"
                  required
                  value={profile.weight_kg ?? ''}
                  onChange={(e) => setProfile({ ...profile, weight_kg: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-slate-900 font-bold text-base focus:border-green-600 focus:ring-2 focus:ring-green-500/10 focus:outline-none transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
                  kg
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Biological Gender */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-700 block">
            2. Biological Gender <span className="text-slate-400 font-normal">(Used for BMR formula calibration)</span>
          </label>
          <div className="grid grid-cols-2 gap-3 max-w-md">
            <button
              type="button"
              onClick={() => setProfile({ ...profile, gender: 'male' })}
              className={`py-3 px-4 rounded-2xl border text-center font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                profile.gender === 'male'
                  ? 'bg-[#0B1E29] text-white border-[#0B1E29] shadow-md ring-2 ring-emerald-500/30'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <span>♂</span>
              <span>Male</span>
            </button>

            <button
              type="button"
              onClick={() => setProfile({ ...profile, gender: 'female' })}
              className={`py-3 px-4 rounded-2xl border text-center font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                profile.gender === 'female'
                  ? 'bg-[#0B1E29] text-white border-[#0B1E29] shadow-md ring-2 ring-emerald-500/30'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <span>♀</span>
              <span>Female</span>
            </button>
          </div>
        </div>

        {/* Section 3: Activity Level Multiplier */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
            <span>3. Daily Activity Multiplier</span>
            <span className="text-[11px] text-slate-400 font-medium">Select closest lifestyle habit</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ACTIVITY_OPTIONS.map((item) => {
              const isSelected = (profile.activity_level || 'moderate') === item.key;
              return (
                <div
                  key={item.key}
                  onClick={() => setProfile({ ...profile, activity_level: item.key })}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'bg-slate-50/60 border-slate-200/80 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold ${isSelected ? 'text-emerald-950' : 'text-slate-800'}`}>
                      {item.label}
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${isSelected ? 'bg-emerald-200/80 text-emerald-900' : 'bg-slate-200/60 text-slate-600'}`}>
                      {item.mult}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    {item.sub}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 4: Primary Goal */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-700 block">
            4. Primary Nutrition & Metabolic Goal
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {GOAL_OPTIONS.map((g) => {
              const isSelected = (profile.goal || 'maintain') === g.key;
              return (
                <div
                  key={g.key}
                  onClick={() => setProfile({ ...profile, goal: g.key })}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#0B1E29] text-white border-[#0B1E29] shadow-md ring-2 ring-emerald-500/30'
                      : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xl">{g.icon}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isSelected ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-100 text-slate-600'}`}>
                        {g.tag}
                      </span>
                    </div>
                    <div className="font-bold text-sm mb-1">{g.label}</div>
                    <p className={`text-xs ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                      {g.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 5: Dietary Preference & Allergies */}
        <div className="space-y-4 pt-2 border-t border-slate-100">
          <h2 className="font-serif-display text-lg font-bold text-[#0B1E29]">
            5. Dietary Preferences & Exclusions
          </h2>

          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 block">Dietary Philosophy</label>
            <div className="flex flex-wrap gap-2">
              {DIETARY_OPTIONS.map((opt) => {
                const isSelected = (profile.dietary_preference || 'none') === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setProfile({ ...profile, dietary_preference: opt.key })}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-xs font-bold text-slate-700 block">
              Allergies & Food Intolerances <span className="text-slate-400 font-normal">(Click quick tags or type below)</span>
            </label>
            
            <div className="flex flex-wrap gap-1.5 pb-2">
              {COMMON_ALLERGIES.map((tag) => {
                const isChecked = (profile.allergies || '').toLowerCase().includes(tag.toLowerCase());
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleAllergyTag(tag)}
                    className={`px-3 py-1 rounded-lg text-xs transition-colors cursor-pointer border ${
                      isChecked
                        ? 'bg-red-50 text-red-700 border-red-300 font-semibold'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {isChecked ? `✓ ${tag}` : `+ ${tag}`}
                  </button>
                );
              })}
            </div>

            <input
              type="text"
              placeholder="e.g. Peanuts, Gluten, Dairy, Shellfish"
              value={profile.allergies || ''}
              onChange={(e) => setProfile({ ...profile, allergies: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:border-green-600 focus:ring-2 focus:ring-green-500/10 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Info size={14} className="text-slate-400 shrink-0" />
            <span>Updates are synced instantly across your Food Journal and Meal Planner.</span>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shrink-0"
          >
            {saving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Calibrating & Saving...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Save Profile & Calibrate All Targets</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* ── Real Weight History from Database ── */}
      {weightHistory.length > 0 && (
        <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History size={18} className="text-emerald-600" />
              <h3 className="font-serif-display font-bold text-base text-[#0B1E29]">
                Historical Weight Tracking Log
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">Logged entries</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {weightHistory.slice(0, 8).map((log, index) => (
              <div key={index} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center hover:bg-slate-100/80 transition-colors">
                <div className="text-xs text-slate-400 font-medium">
                  {log.logged_at ? new Date(log.logged_at).toLocaleDateString() : 'Recent'}
                </div>
                <div className="text-lg font-bold text-slate-900 mt-0.5">
                  {log.weight_kg} <span className="text-xs font-normal text-slate-500">kg</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
