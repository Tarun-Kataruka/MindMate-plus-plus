import express from 'express';
import { signup, login, me, updateMe } from '../controllers/authController.js';

// Simple auth middleware to decode token
import jwt from 'jsonwebtoken';

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

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', requireAuth, me);
router.put('/me', requireAuth, updateMe);

export default router;
