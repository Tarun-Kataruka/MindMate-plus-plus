import express from 'express';
import { getBlogs, getBlogById, createBlog, upload, likeBlog } from '../controllers/blogController.js';

const router = express.Router();

router.get('/', getBlogs);
router.get('/:id', getBlogById);
router.post('/', createBlog);
router.post('/:id/like', likeBlog);

export default router;
