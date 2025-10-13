import express from 'express';
import { getChatbotReply } from '../controllers/chatbotController.js';

const router = express.Router();

router.post('/reply', getChatbotReply);

export default router;


