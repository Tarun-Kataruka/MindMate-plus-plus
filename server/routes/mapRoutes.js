import express from 'express';
import { getNearbyTherapists, getPlacePhoto } from '../controllers/mapController.js';

const router = express.Router();

router.get('/nearby', getNearbyTherapists);
router.get('/photo', getPlacePhoto);

export default router;
