import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { searchFoods, getFoodById, createFood } from '../controllers/foodController.js';

const router = express.Router();

router.use(authenticate);

router.get('/search', searchFoods);
router.get('/:id', getFoodById);
router.post('/', createFood);

export default router;
