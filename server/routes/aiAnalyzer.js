import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { analyzeFood } from '../controllers/aiAnalyzerController.js';

const router = express.Router();

router.use(authenticate);

router.post('/analyze', analyzeFood);

export default router;
