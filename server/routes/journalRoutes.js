import express from 'express';
import { getJournals, createJournal, deleteJournal } from '../controllers/journalController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, getJournals);
router.post('/', requireAuth, createJournal);
router.delete('/:id', requireAuth, deleteJournal);

export default router;


