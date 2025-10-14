import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema(
  {
    author: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    image: { type: String, default: '' },
    excerpt: { type: String, required: true },
  },
  { timestamps: true }
);

const Blog = mongoose.model('Blog', blogSchema);
export default Blog;


