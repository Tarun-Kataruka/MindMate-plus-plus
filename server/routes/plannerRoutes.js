import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { createPlannerUpload } from '../utils/upload.js';
import {
  getSubjects,
  createSubject,
  deleteSubject,
  getNotes,
  uploadNotes,
  deleteNotes,
  uploadMaterials,
  getMaterials,
  deleteMaterials,
  uploadDatesheet,
  getDatesheet,
  deleteDatesheet,
  createPlan,
  getPlan,
  pushPlanToGoogle,
} from '../controllers/plannerController.js';

const router = express.Router();
const upload = createPlannerUpload();

// Subjects
router.get('/subjects', requireAuth, getSubjects);
router.post('/subjects', requireAuth, createSubject);
router.delete('/deletesubject/:id', requireAuth, deleteSubject);

// Notes
router.get('/notes', requireAuth, getNotes);
router.post('/notes', requireAuth, upload.any(), uploadNotes);
router.delete('/notes', requireAuth, deleteNotes);

// Materials
router.post('/materials', requireAuth, upload.any(), uploadMaterials);
router.get('/materials', requireAuth, getMaterials);
router.delete('/materials', requireAuth, deleteMaterials);

// Datesheet
router.post('/datesheet', requireAuth, upload.any(), uploadDatesheet);
router.get('/datesheet', requireAuth, getDatesheet);
router.delete('/datesheet', requireAuth, deleteDatesheet);

// Study Plan
router.post('/plan', requireAuth, createPlan);
router.get('/plan', requireAuth, getPlan);

// Google Calendar
router.post('/google/push', requireAuth, pushPlanToGoogle);

export default router;


