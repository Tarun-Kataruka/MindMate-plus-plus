import express from 'express';
import { handleGoogleCallback } from '../controllers/calendarController.js';

const router = express.Router();

router.get('/callback', handleGoogleCallback);

export default router;


