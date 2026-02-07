import express from 'express';
import { getNearbyTherapists } from '../controllers/therapistController.js';

const router = express.Router();

router.get('/nearby', getNearbyTherapists);

export default router;
