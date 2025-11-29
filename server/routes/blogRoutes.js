import express from 'express';
import { getBlogs, getBlogById, createBlog, upload, likeBlog } from '../controllers/blogController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth,getBlogs);
router.get('/:id', getBlogById);
router.post('/', createBlog);
router.post('/:id/like', likeBlog);

export default router;
