import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { getChatHistory, sendMessage, clearHistory } from '../controllers/chatController.js';

const router = express.Router();

router.use(authenticate);

router.get('/history', getChatHistory);
router.post('/message', sendMessage);
router.delete('/history', clearHistory);

export default router;
