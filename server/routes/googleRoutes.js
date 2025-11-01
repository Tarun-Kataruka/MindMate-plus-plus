import express from 'express';
import { exchangeGoogleCode, listCalendarEvents, createCalendarEvent, disconnectGoogle } from '../controllers/googleController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/exchange', requireAuth, exchangeGoogleCode);
router.get('/events', requireAuth, listCalendarEvents);
router.post('/events', requireAuth, createCalendarEvent);
router.post('/disconnect', requireAuth, disconnectGoogle);

export default router;


