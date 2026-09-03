import React, { useState, useEffect, useCallback } from 'react';
import {
  UtensilsCrossed,
  Search,
  X,
  ChefHat,
  Globe2,
  Filter,
  Sparkles,
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Recipe, RecipeCategory } from '../../types/recipe';
import { recipeApi } from '../../services/features';
import RecipeCard from '../../components/recipes/RecipeCard';
import FeaturedRecipeCard from '../../components/recipes/FeaturedRecipeCard';
import RecipeModal from '../../components/recipes/RecipeModal';
import { RecipeGridSkeleton, CategoryPillsSkeleton } from '../../components/recipes/RecipeLoader';

const POPULAR_CUISINES = [
  'All',
  'British',
  'Canadian',
  'Chinese',
  'Egyptian',
  'Greek',
  'Indian',
  'Italian',
  'Japanese',
  'Mexican',
  'Spanish',
];

const POPULAR_INGREDIENTS = [
  { label: 'Chicken Breast', value: 'chicken_breast' },
  { label: 'Salmon', value: 'salmon' },
  { label: 'Beef', value: 'beef' },
  { label: 'Egg', value: 'egg' },
  { label: 'Avocado', value: 'avocado' },
  { label: 'Garlic', value: 'garlic' },
];

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [featuredRecipe, setFeaturedRecipe] = useState<Recipe | null>(null);
  const [categories, setCategories] = useState<RecipeCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedCuisine, setSelectedCuisine] = useState<string>('All');
  const [selectedIngredient, setSelectedIngredient] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSearch, setActiveSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);

  // 1. Initial Load: Fetch Featured Recipe & Categories
  useEffect(() => {
    // Fetch random featured recipe
    recipeApi
      .getRandom()
      .then((res) => {
        if (res.data?.success && res.data?.recipe) {
          setFeaturedRecipe(res.data.recipe);
        }
      })
      .catch((err) => console.warn('Failed to load initial featured recipe:', err));

    // Fetch categories
    recipeApi
      .getCategories()
      .then((res) => {
        if (res.data?.success && res.data?.categories) {
          setCategories(res.data.categories);
        }
      })
      .catch((err) => console.warn('Failed to load categories:', err));
  }, []);

  // 2. Fetch Recipes based on active filters / search
  const loadRecipes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (activeSearch.trim()) {
        const res = await recipeApi.search(activeSearch.trim());
        setRecipes(res.data?.recipes || []);
      } else if (selectedIngredient) {
        const res = await recipeApi.getByIngredient(selectedIngredient);
        setRecipes(res.data?.recipes || []);
      } else if (selectedCategory !== 'All') {
        const res = await recipeApi.getByCategory(selectedCategory);
        setRecipes(res.data?.recipes || []);
      } else if (selectedCuisine !== 'All') {
        const res = await recipeApi.getByArea(selectedCuisine);
        setRecipes(res.data?.recipes || []);
      } else {
        // Default: search for standard popular meals
        const res = await recipeApi.search('chicken');
        setRecipes(res.data?.recipes || []);
      }
    } catch (err: any) {
      console.error('Recipe fetch error:', err);
      setError(err.response?.data?.message || 'Could not load recipes.');
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  }, [activeSearch, selectedCategory, selectedCuisine, selectedIngredient]);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  // Handlers
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSelectedCategory('All');
      setSelectedCuisine('All');
      setSelectedIngredient(null);
      setActiveSearch(searchQuery.trim());
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setActiveSearch('');
  };

  const handleCategorySelect = (catName: string) => {
    setSelectedCategory(catName);
    setSelectedCuisine('All');
    setSelectedIngredient(null);
    setActiveSearch('');
    setSearchQuery('');
  };

  const handleCuisineSelect = (areaName: string) => {
    setSelectedCuisine(areaName);
    setSelectedCategory('All');
    setSelectedIngredient(null);
    setActiveSearch('');
    setSearchQuery('');
  };

  const handleIngredientSelect = (ingValue: string) => {
    if (selectedIngredient === ingValue) {
      setSelectedIngredient(null);
    } else {
      setSelectedIngredient(ingValue);
      setSelectedCategory('All');
      setSelectedCuisine('All');
      setActiveSearch('');
      setSearchQuery('');
    }
  };

  const handleResetFilters = () => {
    setSelectedCategory('All');
    setSelectedCuisine('All');
    setSelectedIngredient(null);
    setSearchQuery('');
    setActiveSearch('');
  };

  return (
    <div className="space-y-8 pb-16 animate-fade-in max-w-7xl mx-auto">
      {/* Page Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center border border-green-500/30 shadow-xs">
              <UtensilsCrossed size={20} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-serif-display">
                Food Blogs & Recipes
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Explore delicious homemade recipes, global cuisines, and chef instructions powered by TheMealDB.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Recipe Hero Card */}
      <section>
        <FeaturedRecipeCard
          initialRecipe={featuredRecipe}
          onSelect={(id) => setSelectedRecipeId(id)}
        />
      </section>

      {/* Search & Filter Controls */}
      <section className="space-y-4 bg-[#0B1E29] p-5 sm:p-6 rounded-2xl border border-white/10 shadow-lg">
        {/* Search Input Bar */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search recipes (e.g., 'chicken curry', 'pasta', 'tacos', 'salad')..."
              className="w-full pl-11 pr-10 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 text-sm focus:outline-hidden focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-75 text-white font-semibold text-sm transition-all shadow-md shrink-0 active:scale-95 flex items-center gap-2"
          >
            {loading && activeSearch ? (
              <>
                <RefreshCw size={15} className="animate-spin" />
                Searching...
              </>
            ) : (
              'Search'
            )}
          </button>
        </form>

        {/* Category Pills Carousel */}
        <div className="space-y-2 pt-2 border-t border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ChefHat size={14} className="text-green-400" />
              Categories
            </span>
            {(selectedCategory !== 'All' || selectedCuisine !== 'All' || selectedIngredient || activeSearch) && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-green-400 hover:underline font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>

          {categories.length === 0 ? (
            <CategoryPillsSkeleton />
          ) : (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
              <button
                onClick={() => handleCategorySelect('All')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCategory === 'All' && !selectedIngredient && !activeSearch
                    ? 'bg-green-600 text-white font-semibold shadow-xs'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/5'
                }`}
              >
                All Categories
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleCategorySelect(c.name)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    selectedCategory === c.name
                      ? 'bg-green-600 text-white font-semibold shadow-xs'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/5'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cuisine / Area Filter Pills */}
        <div className="space-y-2 pt-2 border-t border-white/5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Globe2 size={14} className="text-blue-400" />
            Global Cuisines
          </span>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {POPULAR_CUISINES.map((area) => (
              <button
                key={area}
                onClick={() => handleCuisineSelect(area)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCuisine === area && selectedCategory === 'All' && !selectedIngredient && !activeSearch
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200 border border-white/5'
                }`}
              >
                {area === 'All' ? 'All Cuisines' : area}
              </button>
            ))}
          </div>
        </div>

        {/* Popular Ingredient Filters */}
        <div className="space-y-2 pt-2 border-t border-white/5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Filter size={13} className="text-amber-400" />
            Filter by Ingredient
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {POPULAR_INGREDIENTS.map((item) => {
              const active = selectedIngredient === item.value;
              return (
                <button
                  key={item.value}
                  onClick={() => handleIngredientSelect(item.value)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    active
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                      : 'bg-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10 border border-white/5'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Active Filter Badge / Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-green-400" />
          <span>
            {activeSearch ? (
              <>Search results for <strong className="text-white">"{activeSearch}"</strong></>
            ) : selectedIngredient ? (
              <>Recipes containing <strong className="text-white capitalize">{selectedIngredient.replace(/_/g, ' ')}</strong></>
            ) : selectedCategory !== 'All' ? (
              <>Category: <strong className="text-white">{selectedCategory}</strong></>
            ) : selectedCuisine !== 'All' ? (
              <>Cuisine: <strong className="text-white">{selectedCuisine}</strong></>
            ) : (
              <>Discovering delicious recipes</>
            )}
            {!loading && <span className="ml-1.5 text-xs text-slate-500">({recipes.length} available)</span>}
          </span>
        </div>
      </div>

      {/* Recipe Grid / Loading / Empty States */}
      {loading ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-3.5 px-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold animate-pulse">
            <div className="flex items-center gap-2.5">
              <ChefHat size={16} className="animate-bounce" />
              <span>
                {activeSearch
                  ? `Simmering recipes for "${activeSearch}"...`
                  : selectedIngredient
                  ? `Finding dishes with ${selectedIngredient.replace(/_/g, ' ')}...`
                  : selectedCategory !== 'All'
                  ? `Curating ${selectedCategory} recipes...`
                  : selectedCuisine !== 'All'
                  ? `Exploring authentic ${selectedCuisine} cuisine...`
                  : 'Curating delicious inspirations from TheMealDB...'}
              </span>
            </div>
            <span className="hidden sm:inline-block text-[11px] text-green-400/80 font-medium">TheMealDB Live API</span>
          </div>
          <RecipeGridSkeleton count={8} />
        </div>
      ) : error ? (
        <div className="p-12 text-center rounded-2xl bg-[#0B1E29] border border-red-500/20 text-slate-300">
          <AlertCircle size={36} className="mx-auto text-red-400 mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">Could Not Load Recipes</h3>
          <p className="text-sm text-slate-400 mb-6">{error}</p>
          <button
            onClick={loadRecipes}
            className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold transition-all"
          >
            Try Again
          </button>
        </div>
      ) : recipes.length === 0 ? (
        <div className="p-16 text-center rounded-2xl bg-[#0B1E29] border border-white/10 text-slate-300 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-white/5 text-slate-400 flex items-center justify-center mx-auto">
            <UtensilsCrossed size={32} />
          </div>
          <h3 className="text-lg font-bold text-white">
            No recipes found {activeSearch ? `for "${activeSearch}"` : ''}
          </h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Try searching for common ingredients like chicken, pasta, beef, or reset your filters to explore other categories.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-semibold transition-all shadow-md"
          >
            Clear Filters & Search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onSelect={(id) => setSelectedRecipeId(id)}
            />
          ))}
        </div>
      )}

      {/* Provider Attribution Banner */}
      <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-2">
          <span>🍳 Recipe and culinary data provided by</span>
          <a
            href="https://www.themealdb.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-green-400 underline transition-colors"
          >
            TheMealDB
          </a>
        </div>
        <div>
          <span>NutriCraft Food & Recipes • Continuous Culinary Inspiration</span>
        </div>
      </div>

      {/* Detail Modal */}
      <RecipeModal
        recipeId={selectedRecipeId}
        onClose={() => setSelectedRecipeId(null)}
      />
    </div>
  );
}
