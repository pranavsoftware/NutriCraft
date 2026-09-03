import express from 'express';
import { authenticate, requireCompleteProfile } from '../middleware/auth.js';
import { getEntries, addEntry, updateEntry, deleteEntry } from '../controllers/journalController.js';

const router = express.Router();

router.use(authenticate);
router.use(requireCompleteProfile);

router.get('/entries', getEntries);
router.post('/entries', addEntry);
router.put('/entries/:id', updateEntry);
router.delete('/entries/:id', deleteEntry);

export default router;
