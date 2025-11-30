import Blog from "../models/Blog.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import User from "../models/User.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const CATEGORIES = [
  "anger",
  "depression",
  "anxiety and panic attack",
  "eating disorder",
  "self esteem",
  "self harm",
  "stress",
  "sleep disorder",
];

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
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const concerns = user.concerns || [];
    if (concerns.length === 0) {
      return res.json([]);
    }
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

// Initialize Gemini only if API key is available
let genAI = null;
if (process.env.GEMINI_BLOG_KEY) {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_BLOG_KEY);
  } catch (err) {
    console.warn("Failed to initialize Gemini AI:", err);
  }
}

export const createBlog = async (req, res) => {
  try {
    const { author, title, excerpt, image } = req.body;
    if (!author || !title || !excerpt) {
      return res.status(400).json({
        message: "author, title, and excerpt are required",
      });
    }
    const imageValue =
      typeof image === "string"
        ? image
        : req.file
        ? `/uploads/${req.file.filename}`
        : "";

    // Determine category - use Gemini if available, otherwise use first category as default
    let category = CATEGORIES[0]; // Default fallback
    if (genAI && process.env.GEMINI_BLOG_KEY) {
      try {
        console.log("Classifying blog using GEMINI...");
        const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" });

        const prompt = `
Classify this mental-health related blog into EXACTLY ONE category:

${CATEGORIES.join("\n")}

Blog Content:
Author: ${author}
Title: ${title}
Excerpt: ${excerpt}

Return ONLY the category EXACTLY as written in the list above.
No explanation.
        `;

        const result = await model.generateContent(prompt);
        const geminiCategory = result.response.text().trim().toLowerCase();

        console.log("Gemini Assigned Category:", geminiCategory);

        if (CATEGORIES.includes(geminiCategory)) {
          category = geminiCategory;
        } else {
          console.warn("Gemini returned invalid category, using default:", geminiCategory);
        }
      } catch (geminiErr) {
        console.error("Gemini classification error:", geminiErr)
      }
    } else {
      console.warn("Gemini API key not configured, using default category");
    }

    // Save blog
    const created = await Blog.create({
      author,
      title,
      excerpt,
      image: imageValue,
      category,
    });

    res.status(201).json(created);
  } catch (err) {
    console.error("ERROR CREATING BLOG:", err);
    return res.status(500).json({
      message: "Failed to create blog",
      error: err.message,
    });
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
