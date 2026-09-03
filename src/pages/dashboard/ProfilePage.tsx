import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { profileApi } from '../../services/features';
import { useAuth } from '../../context/AuthContext';
import { 
  User, Check, AlertCircle, Loader2, 
  Flame, Activity, ShieldCheck, Scale, Info, History,
  Sparkles, ArrowRight, LockOpen, Lock
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

export default function ProfilePage() {
  const { user, markProfileComplete } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.age || !profile.height_cm || !profile.weight_kg) {
      setErrorMsg('Please enter your age, height, and weight to calculate your caloric targets.');
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
        setSuccessMsg('🎉 Profile saved and verified! All NutriCraft features are now unlocked.');
        await loadProfile();

        // If user just completed their required setup, automatically take them to dashboard after 2.5s
        if (isProfileRequired) {
          setTimeout(() => {
            navigate('/dashboard');
          }, 2500);
        }
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setErrorMsg(error.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <ThemeLoader message="Loading your biometric profile & target macros..." size="lg" />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Onboarding Welcome Banner for Incomplete Profiles */}
      {isProfileRequired && !justUnlocked && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950 via-[#0B1E29] to-teal-950 border-2 border-emerald-500/40 text-white shadow-xl relative overflow-hidden">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30 shadow-inner">
              <Sparkles size={24} />
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[11px] border border-emerald-500/40 uppercase tracking-wider">
                  Step 1 of 1: Profile Setup
                </span>
                <span className="text-xs text-slate-300 flex items-center gap-1">
                  <Lock size={12} className="text-amber-400" /> Other features locked until saved
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white font-serif-display">
                Welcome to NutriCraft! Please set up your biometric profile first.
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Before you can access the <strong>Food Journal</strong>, <strong>Food & Recipes</strong>, <strong>Meal Planner</strong>, <strong>AI Analyzer</strong>, and <strong>Analytics</strong>, our Mifflin-St Jeor engine needs your age, height, weight, and goals to calculate your daily metabolic requirements.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Celebration Card When Profile Just Unlocked */}
      {justUnlocked && (
        <div className="p-6 rounded-3xl bg-emerald-900/30 border-2 border-emerald-500/50 text-white shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold shadow-lg shrink-0">
              <LockOpen size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">All Features Successfully Unlocked!</h3>
              <p className="text-xs text-emerald-200">
                Your custom daily caloric and macro targets have been saved. Redirecting to your dashboard...
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center gap-2 transition-all shadow-lg hover:scale-105 active:scale-95 shrink-0 cursor-pointer"
          >
            <span>Go to Dashboard</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
            <User size={22} />
          </div>
          <div>
            <h1 className="font-serif-display text-xl sm:text-2xl font-bold text-[#0B1E29]">Nutritional Profile & Health Targets</h1>
            <p className="text-xs text-slate-500">Biometric calculations linked directly to your database profile</p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-green-50 border border-green-200 text-green-800 text-sm flex items-center gap-2">
          <Check size={18} className="text-green-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle size={18} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Target Calorie Preview Banner */}
      <div className="bg-[#0B1E29] text-white p-6 rounded-3xl shadow-md space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-green-400" />
            <span className="text-sm font-semibold text-slate-200">
              {hasExistingProfile ? 'Active Biometric Targets (Database Linked)' : 'Default Baseline Targets'}
            </span>
          </div>
          <span className="text-xs font-bold bg-green-500/20 text-green-400 px-3 py-1 rounded-full border border-green-500/30">
            Mifflin-St Jeor Validated
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-2">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-[11px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1">
              <Flame size={13} className="text-amber-400" /> Daily Calories
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white">
              {profile.daily_calorie_target || 2000} <span className="text-xs font-normal text-slate-400">kcal</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-[11px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1">
              <Activity size={13} className="text-blue-400" /> Daily Protein
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white">
              {profile.daily_protein_target || 120} <span className="text-xs font-normal text-slate-400">g</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-[11px] uppercase font-bold text-slate-400 mb-1">Daily Carbs</div>
            <div className="text-xl sm:text-2xl font-bold text-white">
              {profile.daily_carb_target || 250} <span className="text-xs font-normal text-slate-400">g</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-[11px] uppercase font-bold text-slate-400 mb-1">Daily Fats</div>
            <div className="text-xl sm:text-2xl font-bold text-white">
              {profile.daily_fat_target || 65} <span className="text-xs font-normal text-slate-400">g</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Biometric Form */}
      <form onSubmit={handleSave} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs space-y-6">
        <h2 className="font-serif-display text-lg font-bold text-[#0B1E29]">Biometric Measurements</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Age (years) *</label>
            <input
              type="number"
              min="10"
              max="120"
              placeholder="e.g. 26"
              value={profile.age ?? ''}
              onChange={(e) => setProfile({ ...profile, age: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:border-green-600 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Height (cm) *</label>
            <input
              type="number"
              min="50"
              max="260"
              placeholder="e.g. 175"
              value={profile.height_cm ?? ''}
              onChange={(e) => setProfile({ ...profile, height_cm: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:border-green-600 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
              <Scale size={13} className="text-green-600" />
              <span>Weight (kg) *</span>
            </label>
            <input
              type="number"
              min="20"
              max="350"
              step="0.1"
              placeholder="e.g. 72.5"
              value={profile.weight_kg ?? ''}
              onChange={(e) => setProfile({ ...profile, weight_kg: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:border-green-600 focus:outline-none"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Biological Gender</label>
            <select
              value={profile.gender || 'male'}
              onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold bg-white focus:border-green-600 focus:outline-none cursor-pointer"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Activity Level</label>
            <select
              value={profile.activity_level || 'moderate'}
              onChange={(e) => setProfile({ ...profile, activity_level: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold bg-white focus:border-green-600 focus:outline-none cursor-pointer"
            >
              <option value="sedentary">Sedentary (desk job, little exercise)</option>
              <option value="light">Light Activity (1-3 days/week)</option>
              <option value="moderate">Moderate Activity (3-5 days/week)</option>
              <option value="active">Active (6-7 days/week)</option>
              <option value="very_active">Very Active (hard daily training)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Primary Goal</label>
            <select
              value={profile.goal || 'maintain'}
              onChange={(e) => setProfile({ ...profile, goal: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold bg-white focus:border-green-600 focus:outline-none cursor-pointer"
            >
              <option value="lose_weight">Fat Loss & Leaning (-400 kcal)</option>
              <option value="maintain">Weight Maintenance</option>
              <option value="gain_muscle">Muscle Building (+300 kcal)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Dietary Preference</label>
            <select
              value={profile.dietary_preference || 'none'}
              onChange={(e) => setProfile({ ...profile, dietary_preference: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold bg-white focus:border-green-600 focus:outline-none cursor-pointer"
            >
              <option value="none">Standard / Omnivore</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
              <option value="keto">Ketogenic (Low Carb)</option>
              <option value="pescatarian">Pescatarian</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Food Allergies / Dislikes</label>
            <input
              type="text"
              placeholder="e.g. Peanuts, Gluten, Dairy, Shellfish"
              value={profile.allergies || ''}
              onChange={(e) => setProfile({ ...profile, allergies: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-green-600 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold text-sm flex items-center gap-2 transition-colors cursor-pointer shadow-md shadow-green-600/20"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            <span>Save & Recalculate Targets</span>
          </button>
        </div>
      </form>

      {/* Real Weight History from Database */}
      {weightHistory.length > 0 && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <History size={18} className="text-slate-500" />
            <h3 className="font-serif-display font-bold text-base text-[#0B1E29]">Database Weight Log History</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {weightHistory.slice(0, 8).map((log, index) => (
              <div key={index} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <div className="text-xs text-slate-400 font-medium">
                  {log.logged_at ? new Date(log.logged_at).toLocaleDateString() : 'Recent'}
                </div>
                <div className="text-base font-bold text-slate-800 mt-0.5">
                  {log.weight_kg} <span className="text-xs font-normal text-slate-500">kg</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
