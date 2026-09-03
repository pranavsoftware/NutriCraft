import React from 'react';
import { ChefHat, Globe2, ArrowRight } from 'lucide-react';
import { Recipe } from '../../types/recipe';

interface RecipeCardProps {
  key?: React.Key;
  recipe: Recipe;
  onSelect: (recipeId: string) => void;
}

export default function RecipeCard({ recipe, onSelect }: RecipeCardProps) {
  return (
    <div
      onClick={() => onSelect(recipe.id)}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-[#0B1E29] border border-white/10 hover:border-green-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/5 hover:-translate-y-1 cursor-pointer"
    >
      {/* Recipe Thumbnail */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-900">
        <img
          src={recipe.image || 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&q=80'}
          alt={recipe.name}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&q=80';
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1E29] via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

        {/* Badges on Thumbnail */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {recipe.category && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-black/60 text-green-400 backdrop-blur-md border border-white/10">
              <ChefHat size={11} />
              {recipe.category}
            </span>
          )}
          {recipe.area && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-black/60 text-blue-400 backdrop-blur-md border border-white/10">
              <Globe2 size={11} />
              {recipe.area}
            </span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight leading-snug line-clamp-2 group-hover:text-green-400 transition-colors">
            {recipe.name}
          </h3>
          {recipe.ingredient && (
            <p className="mt-1 text-xs text-slate-400">
              Key ingredient: <span className="text-green-400/90 font-medium capitalize">{recipe.ingredient.replace(/_/g, ' ')}</span>
            </p>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-green-400 group-hover:text-green-300">
          <span>View Recipe</span>
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
}
