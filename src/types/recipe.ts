export interface RecipeIngredient {
  name: string;
  measure: string;
}

export interface Recipe {
  id: string;
  name: string;
  image: string;
  category?: string | null;
  area?: string | null;
  ingredient?: string | null;
  instructions?: string;
  ingredients?: RecipeIngredient[];
  tags?: string[];
  youtubeUrl?: string | null;
  sourceUrl?: string | null;
  provider: string;
  cachedAt?: string;
}

export interface RecipeCategory {
  id: string;
  name: string;
  image: string;
  description: string;
}
