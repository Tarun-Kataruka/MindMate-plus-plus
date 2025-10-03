import express from 'express';
import { getDailyQuote } from '../controllers/quoteController.js';

const router = express.Router();


router.get('/', getDailyQuote);

export default router;




