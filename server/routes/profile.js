import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { getProfile, updateProfile, exportData } from '../controllers/profileController.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getProfile);
router.put('/', updateProfile);
router.get('/export', exportData);

export default router;
