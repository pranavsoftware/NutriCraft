import React, { useState } from 'react';
import { Sparkles, RefreshCw, ChefHat, Globe2, ArrowRight } from 'lucide-react';
import { Recipe } from '../../types/recipe';
import { recipeApi } from '../../services/features';
import { FeaturedRecipeSkeleton } from './RecipeLoader';

interface FeaturedRecipeCardProps {
  initialRecipe: Recipe | null;
  onSelect: (recipeId: string) => void;
}

export default function FeaturedRecipeCard({ initialRecipe, onSelect }: FeaturedRecipeCardProps) {
  const [recipe, setRecipe] = useState<Recipe | null>(initialRecipe);
  const [refreshing, setRefreshing] = useState(false);

  // Update local state when parent fetches initial
  React.useEffect(() => {
    if (initialRecipe) {
      setRecipe(initialRecipe);
    }
  }, [initialRecipe]);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const res = await recipeApi.getRandom();
      if (res.data?.success && res.data?.recipe) {
        setRecipe(res.data.recipe);
      }
    } catch (err) {
      console.warn('Failed to refresh featured recipe:', err);
    } finally {
      setRefreshing(false);
    }
  };

  if (!recipe) {
    return <FeaturedRecipeSkeleton />;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0B1E29] via-[#0e2735] to-[#0B1E29] border border-green-500/20 shadow-xl group">
      {/* Background Subtle Glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative p-6 sm:p-8 flex flex-col lg:flex-row items-center gap-6 lg:gap-8">
        {/* Thumbnail Image with Zoom Effect */}
        <div className="relative w-full lg:w-72 h-52 sm:h-60 rounded-xl overflow-hidden shadow-lg shrink-0 border border-white/10">
          <img
            src={recipe.image}
            alt={recipe.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-black/60 text-green-400 backdrop-blur-md border border-white/10">
              <Sparkles size={12} className="text-green-400" />
              Chef's Pick
            </span>
          </div>
        </div>

        {/* Content Info */}
        <div className="flex-1 min-w-0 text-left w-full space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {recipe.category && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/15 text-green-400 border border-green-500/25">
                  <ChefHat size={12} />
                  {recipe.category}
                </span>
              )}
              {recipe.area && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/15 text-blue-400 border border-blue-500/25">
                  <Globe2 size={12} />
                  {recipe.area}
                </span>
              )}
            </div>

            {/* Refresh / Shuffle Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
              title="Get another featured recipe"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin text-green-400' : ''} />
              Shuffle
            </button>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug line-clamp-2">
            {recipe.name}
          </h2>

          <p className="text-sm text-slate-300 line-clamp-2 sm:line-clamp-3 leading-relaxed">
            {recipe.instructions
              ? recipe.instructions.replace(/\r?\n/g, ' ')
              : 'Discover how to prepare this delicious dish with fresh ingredients and authentic flavors.'}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              onClick={() => onSelect(recipe.id)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold text-sm transition-all shadow-md hover:shadow-green-500/20 active:scale-95"
            >
              View Full Recipe
              <ArrowRight size={16} />
            </button>
            <span className="text-xs text-slate-400">
              Ingredients: {recipe.ingredients?.length || 'Multiple'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
