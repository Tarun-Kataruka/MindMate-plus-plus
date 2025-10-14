import express from 'express';
import { getBlogs, createBlog, upload } from '../controllers/blogController.js';

const router = express.Router();

router.get('/', getBlogs);
router.post('/', upload.single('image'), createBlog);

export default router;
