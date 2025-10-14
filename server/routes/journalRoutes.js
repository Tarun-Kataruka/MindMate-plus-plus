import express from 'express';
import { getJournals, createJournal, deleteJournal } from '../controllers/journalController.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Reuse simple auth middleware pattern from authRoutes
const requireAuth = (req, res, next) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.sub;
    return next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

router.get('/', requireAuth, getJournals);
router.post('/', requireAuth, createJournal);
router.delete('/:id', requireAuth, deleteJournal);

export default router;


