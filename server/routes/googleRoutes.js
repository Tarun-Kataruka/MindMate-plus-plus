import express from 'express';
import jwt from 'jsonwebtoken';
import { exchangeGoogleCode, listCalendarEvents, createCalendarEvent, disconnectGoogle } from '../controllers/googleController.js';

const router = express.Router();

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

router.post('/exchange', requireAuth, exchangeGoogleCode);
router.get('/events', requireAuth, listCalendarEvents);
router.post('/events', requireAuth, createCalendarEvent);
router.post('/disconnect', requireAuth, disconnectGoogle);

export default router;


