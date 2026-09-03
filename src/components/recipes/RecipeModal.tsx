import React, { useState, useEffect } from 'react';
import {
  X,
  Youtube,
  ExternalLink,
  ChefHat,
  Globe2,
  Tag,
  CheckCircle2,
  BookOpen,
  Share2,
  Clock
} from 'lucide-react';
import { Recipe } from '../../types/recipe';
import { recipeApi } from '../../services/features';
import { RecipeCulinarySpinner } from './RecipeLoader';

interface RecipeModalProps {
  recipeId: string | null;
  onClose: () => void;
  onLogToJournal?: (ingredientName: string) => void;
}

export default function RecipeModal({ recipeId, onClose, onLogToJournal }: RecipeModalProps) {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!recipeId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);
    setCheckedIngredients({});

    recipeApi
      .getById(recipeId)
      .then((res) => {
        if (isMounted) {
          if (res.data?.success && res.data?.recipe) {
            setRecipe(res.data.recipe);
          } else {
            setError(res.data?.message || 'Failed to load recipe details.');
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.response?.data?.message || 'Network error fetching recipe.');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [recipeId]);

  if (!recipeId) return null;

  const toggleIngredient = (index: number) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Format cooking instructions into discrete readable paragraphs or steps
  const formattedInstructions = recipe?.instructions
    ? recipe.instructions
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div
        className="relative w-full max-w-4xl bg-[#0B1E29] border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-auto text-slate-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header Bar with Close Button */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <button
            onClick={handleShare}
            className="p-2.5 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md text-white/80 hover:text-white transition-all shadow-md"
            title="Share Recipe"
          >
            <Share2 size={18} />
          </button>
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md text-white/80 hover:text-white transition-all shadow-md"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="py-24">
            <RecipeCulinarySpinner
              message="Simmering recipe details from TheMealDB..."
              subtext="Retrieving ingredients, measurements, chef notes, and cooking tutorials"
            />
          </div>
        ) : error || !recipe ? (
          <div className="py-24 px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-4">
              <ChefHat size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Recipe Not Available</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">{error || 'Could not locate recipe details.'}</p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white font-medium rounded-xl transition-all"
            >
              Back to Recipes
            </button>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            {/* Hero Image & Overlay */}
            <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-slate-900">
              <img
                src={recipe.image}
                alt={recipe.name}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1E29] via-[#0B1E29]/60 to-transparent" />

              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex flex-wrap items-center gap-2 mb-2.5">
                  {recipe.category && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30 backdrop-blur-md">
                      <ChefHat size={13} />
                      {recipe.category}
                    </span>
                  )}
                  {recipe.area && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30 backdrop-blur-md">
                      <Globe2 size={13} />
                      {recipe.area} Cuisine
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-slate-300 backdrop-blur-md">
                    <Clock size={13} />
                    Recipe: {recipe.provider}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug">
                  {recipe.name}
                </h1>
              </div>
            </div>

            {/* Modal Content Body */}
            <div className="p-6 sm:p-8 space-y-8">
              {/* Tags & Action Links */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
                <div className="flex flex-wrap items-center gap-1.5">
                  {recipe.tags && recipe.tags.length > 0 ? (
                    recipe.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-white/5 text-slate-400 border border-white/5"
                      >
                        <Tag size={10} />
                        {t}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500 italic">Fresh Homemade Recipe</span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {recipe.youtubeUrl && (
                    <a
                      href={recipe.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30 text-xs font-semibold transition-all shadow-xs"
                    >
                      <Youtube size={16} className="text-red-400" />
                      Watch on YouTube
                    </a>
                  )}
                  {recipe.sourceUrl && (
                    <a
                      href={recipe.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-white/10 text-xs font-semibold transition-all"
                    >
                      <ExternalLink size={14} />
                      Original Source
                    </a>
                  )}
                </div>
              </div>

              {/* Grid: Left Column Ingredients, Right Column Instructions */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Ingredients Column */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-400" />
                      Ingredients ({recipe.ingredients?.length || 0})
                    </h3>
                    <span className="text-xs text-slate-400">Click to check off</span>
                  </div>

                  <div className="bg-white/5 rounded-xl p-3 divide-y divide-white/5 border border-white/5">
                    {recipe.ingredients && recipe.ingredients.length > 0 ? (
                      recipe.ingredients.map((ing, i) => {
                        const isChecked = !!checkedIngredients[i];
                        return (
                          <div
                            key={i}
                            onClick={() => toggleIngredient(i)}
                            className={`flex items-center justify-between py-2.5 px-2 rounded-lg cursor-pointer transition-colors ${
                              isChecked ? 'opacity-50 line-through bg-white/5' : 'hover:bg-white/5'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0 pr-2">
                              <div
                                className={`w-4 h-4 rounded-md flex items-center justify-center transition-colors ${
                                  isChecked
                                    ? 'bg-green-500 text-white'
                                    : 'border border-slate-600 bg-transparent'
                                }`}
                              >
                                {isChecked && <CheckCircle2 size={13} className="text-white" />}
                              </div>
                              <span className="text-sm font-medium text-slate-200 capitalize truncate">
                                {ing.name}
                              </span>
                            </div>
                            <span className="text-xs font-semibold text-green-400/90 shrink-0 bg-green-500/10 px-2.5 py-1 rounded-md">
                              {ing.measure || 'As needed'}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-slate-500 py-4 text-center">No explicit ingredients listed.</p>
                    )}
                  </div>

                  {/* Nutrition Note */}
                  <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-xs text-emerald-300/80 leading-relaxed">
                    💡 <strong>NutriCraft Tip:</strong> Looking to track calorie macros for these ingredients? Search them directly in your <strong>Food Journal</strong> to log accurate USDA nutritional data.
                  </div>
                </div>

                {/* Instructions Column */}
                <div className="lg:col-span-7 space-y-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    Cooking Instructions
                  </h3>

                  <div className="space-y-3.5">
                    {formattedInstructions.length > 0 ? (
                      formattedInstructions.map((step, idx) => {
                        // Check if line already starts with a number (e.g. "1.", "STEP 1")
                        const isNumbered = /^(step\s*\d+|\d+\.)/i.test(step);
                        return (
                          <div
                            key={idx}
                            className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                          >
                            <span className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-green-500/30">
                              {idx + 1}
                            </span>
                            <p className="text-sm text-slate-300 leading-relaxed">
                              {step}
                            </p>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-slate-400 italic">No instructions available for this recipe.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Attribution Footer */}
              <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
                <span>
                  Recipe curated from <strong>TheMealDB</strong> open food database.
                </span>
                {copied && <span className="text-green-400 font-medium animate-pulse">Link copied to clipboard!</span>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
