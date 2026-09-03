import express from 'express';
import {
  searchRecipes,
  getRandomRecipe,
  getRecipeById,
  getCategories,
  getRecipesByCategory,
  getRecipesByArea,
  getRecipesByIngredient,
} from '../controllers/recipeController.js';

const router = express.Router();

// Specific routes before param route /:id
router.get('/search', searchRecipes);
router.get('/random', getRandomRecipe);
router.get('/categories', getCategories);
router.get('/category/:category', getRecipesByCategory);
router.get('/area/:area', getRecipesByArea);
router.get('/ingredient/:ingredient', getRecipesByIngredient);

// Recipe details by ID
router.get('/:id', getRecipeById);

export default router;
