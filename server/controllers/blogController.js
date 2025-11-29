import Blog from "../models/Blog.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import User from "../models/User.js";
// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(new Error("Only image files are allowed"));
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const getBlogs = async (req, res) => {
  try {
    const user = req.userId ? { userId: req.userId } : { _id: null };
    console.log("User ID:", req.userId);
    const concerns = user.concerns;
    console.log("User Concerns:", concerns);
    const blogs = await Blog.find({ category: { $in: concerns } });
    res.json(blogs);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch blogs" });
  }
};

export const getBlogById = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findById(id).lean();
    if (!blog) return res.status(404).json({ message: "Blog not found" });
    res.json(blog);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch blog" });
  }
};

export const createBlog = async (req, res) => {
  try {
    const { author, title, excerpt, image } = req.body;
    if (!author || !title || !excerpt) {
      return res
        .status(400)
        .json({ message: "author, title, and excerpt are required" });
    }
    const imageValue =
      typeof image === "string"
        ? image
        : req.file
        ? `/uploads/${req.file.filename}`
        : "";
    const created = await Blog.create({
      author,
      title,
      image: imageValue,
      excerpt,
    });
    res.status(201).json(created);
  } catch (err) {
    const status = err?.message?.includes("image") ? 400 : 500;
    res
      .status(status)
      .json({ message: err?.message || "Failed to create blog" });
  }
};

export const likeBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Blog.findByIdAndUpdate(
      id,
      { $inc: { likes: 1 } },
      { new: true }
    ).lean();
    if (!updated) return res.status(404).json({ message: "Blog not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to like blog" });
  }
};
