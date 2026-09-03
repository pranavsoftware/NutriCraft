import React from 'react';
import { ChefHat, Sparkles } from 'lucide-react';

interface RecipeGridSkeletonProps {
  count?: number;
}

/**
 * High-fidelity shimmer skeleton cards for Recipe Grid
 */
export function RecipeGridSkeleton({ count = 8 }: RecipeGridSkeletonProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="group relative flex flex-col overflow-hidden rounded-2xl bg-[#0B1E29] border border-white/10 shadow-lg animate-shimmer"
        >
          {/* Image Thumbnail Placeholder */}
          <div className="relative aspect-4/3 w-full bg-slate-800/80">
            {/* Top Left Badge Placeholder */}
            <div className="absolute top-3 left-3 flex gap-1.5">
              <div className="h-5 w-20 rounded-full bg-white/10" />
              <div className="h-5 w-16 rounded-full bg-white/10" />
            </div>
          </div>

          {/* Body Content Placeholder */}
          <div className="flex flex-1 flex-col justify-between p-4 sm:p-5 space-y-4">
            <div className="space-y-2">
              <div className="h-4 w-5/6 rounded-md bg-white/10" />
              <div className="h-3 w-1/2 rounded-md bg-white/5" />
            </div>

            <div className="pt-3 border-t border-white/5 flex items-center justify-between">
              <div className="h-3 w-20 rounded-md bg-green-500/20" />
              <div className="h-3 w-3 rounded-full bg-white/10" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Shimmer skeleton for the Featured Hero Recipe Banner
 */
export function FeaturedRecipeSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0B1E29] via-[#0e2735] to-[#0B1E29] border border-white/10 p-6 sm:p-8 shadow-xl animate-shimmer">
      <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-8">
        {/* Hero Image Skeleton */}
        <div className="relative w-full lg:w-72 h-52 sm:h-60 rounded-xl bg-slate-800/80 shrink-0 border border-white/10 overflow-hidden">
          <div className="absolute top-3 left-3 h-6 w-24 rounded-full bg-black/40 border border-white/10" />
        </div>

        {/* Hero Content Skeleton */}
        <div className="flex-1 w-full space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <div className="h-5 w-24 rounded-full bg-green-500/20" />
              <div className="h-5 w-24 rounded-full bg-blue-500/20" />
            </div>
            <div className="h-7 w-20 rounded-lg bg-white/5" />
          </div>

          <div className="space-y-2">
            <div className="h-7 w-3/4 rounded-md bg-white/10" />
            <div className="h-4 w-full rounded-md bg-white/5" />
            <div className="h-4 w-5/6 rounded-md bg-white/5" />
          </div>

          <div className="pt-2 flex items-center gap-4">
            <div className="h-10 w-36 rounded-xl bg-green-600/30" />
            <div className="h-4 w-28 rounded-md bg-white/5" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Animated Culinary Spinner for Recipe Details Modal or inline loading states
 */
interface RecipeCulinarySpinnerProps {
  message?: string;
  subtext?: string;
}

export function RecipeCulinarySpinner({
  message = 'Fetching chef-crafted recipe details...',
  subtext = 'Curating fresh ingredients and authentic cooking instructions from TheMealDB',
}: RecipeCulinarySpinnerProps) {
  return (
    <div className="py-20 px-6 flex flex-col items-center justify-center text-center space-y-5 animate-fade-in">
      <div className="relative flex items-center justify-center">
        {/* Outer glowing pulsing ring */}
        <div className="absolute w-24 h-24 rounded-full bg-green-500/15 blur-xl animate-pulse" />

        {/* Rotating gradient track */}
        <div
          className="w-20 h-20 rounded-full border-2 border-green-500/20 border-t-green-400 border-r-emerald-500 animate-spin"
          style={{ animationDuration: '1.2s' }}
        />

        {/* Inner floating Chef icon badge */}
        <div className="absolute w-12 h-12 rounded-2xl bg-green-950/80 border border-green-500/40 text-green-400 flex items-center justify-center shadow-lg shadow-green-500/10">
          <ChefHat size={24} className="animate-bounce" style={{ animationDuration: '2s' }} />
        </div>
      </div>

      <div className="space-y-1.5 max-w-md">
        <h4 className="text-base font-bold text-white tracking-tight flex items-center justify-center gap-2">
          <Sparkles size={16} className="text-green-400 animate-pulse" />
          {message}
        </h4>
        <p className="text-xs text-slate-400 leading-relaxed">
          {subtext}
        </p>
      </div>

      {/* Progress pill dots */}
      <div className="flex items-center gap-1.5 pt-1">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 rounded-full bg-green-500/60 animate-pulse" style={{ animationDelay: '200ms' }} />
        <span className="w-2 h-2 rounded-full bg-green-500/30 animate-pulse" style={{ animationDelay: '400ms' }} />
      </div>
    </div>
  );
}

/**
 * Subtle Shimmer Bar for Category Pills loading
 */
export function CategoryPillsSkeleton() {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          className="h-7 w-20 rounded-full bg-white/5 border border-white/5 shrink-0 animate-shimmer"
        />
      ))}
    </div>
  );
}
