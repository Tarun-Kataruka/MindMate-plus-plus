import Blog from '../models/Blog.js';

export const getBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({}).sort({ createdAt: -1 }).lean();
    res.json(blogs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch blogs' });
  }
};

export const createBlog = async (req, res) => {
  try {
    const { author, title, image, excerpt } = req.body || {};
    if (!author || !title || !excerpt) {
      return res.status(400).json({ message: 'author, title, and excerpt are required' });
    }
    const created = await Blog.create({ author, title, image: image || '', excerpt });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create blog' });
  }
};


