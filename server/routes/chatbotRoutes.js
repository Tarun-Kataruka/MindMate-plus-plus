import express from 'express';
import jwt from 'jsonwebtoken';
import { getChatbotReply, getChatHistory, getChatAnalytics } from '../controllers/chatbotController.js';

const router = express.Router();

// Optional auth for reply (saves history only if authed)
const tryAuth = (req, _res, next) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.sub;
  } catch (_) {
    // ignore token errors for reply; just proceed unauthenticated
  }
  return next();
};

// Strict auth for history/analytics
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

router.post('/reply', tryAuth, getChatbotReply);
router.get('/history', requireAuth, getChatHistory);
router.get('/analytics', requireAuth, getChatAnalytics);

export default router;


