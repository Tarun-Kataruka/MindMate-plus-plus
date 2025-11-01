import express from 'express';
import { getChatbotReply, getChatHistory, getChatAnalytics } from '../controllers/chatbotController.js';
import { requireAuth, tryAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/reply', tryAuth, getChatbotReply);
router.get('/history', requireAuth, getChatHistory);
router.get('/analytics', requireAuth, getChatAnalytics);

export default router;


