import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { getSummary, getTodaySummary } from '../controllers/analyticsController.js';

const router = express.Router();

router.use(authenticate);

router.get('/summary', getSummary);
router.get('/today', getTodaySummary);

export default router;
