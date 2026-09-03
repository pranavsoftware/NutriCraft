import express from 'express';
import { authenticate, requireCompleteProfile } from '../middleware/auth.js';
import { getMealPlan, generateMealPlan, regenerateSlot, logPlanMeal, updateGroceryChecked } from '../controllers/mealPlanController.js';

const router = express.Router();

router.use(authenticate);
router.use(requireCompleteProfile);

router.get('/', getMealPlan);
router.post('/generate', generateMealPlan);
router.put('/:id', regenerateSlot);
router.post('/:id/log', logPlanMeal);
router.patch('/grocery', updateGroceryChecked);

export default router;
