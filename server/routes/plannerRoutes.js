import express from 'express';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import AcademicSubject from '../models/AcademicSubject.js';
import AcademicNote from '../models/AcademicNote.js';
import StudyPlan from '../models/StudyPlan.js';
import GoogleCredential from '../models/GoogleCredential.js';

const router = express.Router();

const requireAuth = (req, res, next) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.sub;
    return next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Storage
const uploadsRoot = path.join(process.cwd(), 'uploads');
const ensureDir = (p) => { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); };
ensureDir(uploadsRoot);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Route-specific foldering: subject notes get stored under user/subject folders
    const userId = req.userId || 'anonymous';
    const subjectId = req.query.subjectId || req.body?.subjectId;
    let dir = path.join(uploadsRoot, 'planner');
    if (req.path.includes('/notes') && subjectId) {
      dir = path.join(uploadsRoot, 'planner', String(userId), String(subjectId));
    } else if (req.path.includes('/datesheet')) {
      dir = path.join(uploadsRoot, 'planner', String(userId), 'datesheets');
    } else if (req.path.includes('/materials')) {
      dir = path.join(uploadsRoot, 'planner', String(userId), 'materials');
    } else {
      dir = path.join(uploadsRoot, 'planner', String(userId), 'general');
    }
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + '-' + file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_'));
  },
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// Subjects
router.get('/subjects', requireAuth, async (req, res) => {
  const items = await AcademicSubject.find({ userId: req.userId }).sort({ createdAt: -1 });
  res.json(items);
});

router.post('/subjects', requireAuth, async (req, res) => {
  const name = (req.body?.name || '').trim();
  if (!name) return res.status(400).json({ message: 'Name required' });
  const created = await AcademicSubject.create({ userId: req.userId, name });
  res.status(201).json(created);
});

router.delete('/subjects/:id', requireAuth, async (req, res) => {
  await AcademicSubject.deleteOne({ _id: req.params.id, userId: req.userId });
  res.json({ ok: true });
});

// File uploads
router.get('/notes', requireAuth, async (req, res) => {
  const subjectId = req.query.subjectId;
  if (!subjectId) return res.status(400).json({ message: 'subjectId required' });
  const items = await AcademicNote.find({ userId: req.userId, subjectId }).sort({ createdAt: -1 });
  res.json(items);
});

router.post('/notes', requireAuth, upload.any(), async (req, res) => {
  const subjectId = req.query.subjectId || req.body?.subjectId;
  if (!subjectId) return res.status(400).json({ message: 'subjectId required' });
  const files = req.files || (req.file ? [req.file] : []);
  if (!files.length) return res.status(400).json({ message: 'file(s) required' });
  const items = await Promise.all(files.map(async (f) => {
    // Build relative URL that reflects nested folder
    const rel = f.path.replace(path.join(process.cwd()), '').replace(/\\/g, '/');
    const url = rel.startsWith('/') ? rel : `/${rel}`;
    return AcademicNote.create({
      userId: req.userId,
      subjectId,
      originalName: f.originalname,
      mimeType: f.mimetype,
      size: f.size,
      filePath: f.path,
      url,
    });
  }));
  res.status(201).json(items);
});

router.post('/materials', requireAuth, upload.any(), async (req, res) => {
  const files = req.files || (req.file ? [req.file] : []);
  if (!files.length) return res.status(400).json({ message: 'file(s) required' });
  const items = files.map((f) => {
    const rel = f.path.replace(path.join(process.cwd()), '').replace(/\\/g, '/');
    const url = rel.startsWith('/') ? rel : `/${rel}`;
    return { url, originalName: f.originalname };
  });
  res.status(201).json(items);
});

router.get('/materials', requireAuth, async (req, res) => {
  const baseDir = path.join(uploadsRoot, 'planner', String(req.userId), 'materials');
  ensureDir(baseDir);
  const list = fs.readdirSync(baseDir).map((name) => {
    const full = path.join(baseDir, name);
    const stat = fs.statSync(full);
    return { originalName: name.replace(/^[0-9]+-[0-9]+-/, ''), url: `/uploads/planner/${req.userId}/materials/${name}`, size: stat.size, name };
  });
  res.json(list);
});

router.post('/datesheet', requireAuth, upload.any(), async (req, res) => {
  const files = req.files || (req.file ? [req.file] : []);
  if (!files.length) return res.status(400).json({ message: 'file(s) required' });
  const items = files.map((f) => {
    const rel = f.path.replace(path.join(process.cwd()), '').replace(/\\/g, '/');
    const url = rel.startsWith('/') ? rel : `/${rel}`;
    return { url, originalName: f.originalname };
  });
  res.status(201).json(items);
});

router.get('/datesheet', requireAuth, async (req, res) => {
  const baseDir = path.join(uploadsRoot, 'planner', String(req.userId), 'datesheets');
  ensureDir(baseDir);
  const list = fs.readdirSync(baseDir).map((name) => {
    const full = path.join(baseDir, name);
    const stat = fs.statSync(full);
    return { originalName: name.replace(/^[0-9]+-[0-9]+-/, ''), url: `/uploads/planner/${req.userId}/datesheets/${name}`, size: stat.size, name };
  });
  res.json(list);
});

// Delete APIs
router.delete('/notes', requireAuth, async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    if (!ids.length) return res.status(400).json({ message: 'ids required' });
    const docs = await AcademicNote.find({ _id: { $in: ids }, userId: req.userId });
    for (const d of docs) {
      try { if (d.filePath && fs.existsSync(d.filePath)) fs.unlinkSync(d.filePath); } catch {}
    }
    await AcademicNote.deleteMany({ _id: { $in: ids }, userId: req.userId });
    res.json({ ok: true, deleted: ids.length });
  } catch (e) {
    res.status(500).json({ message: 'failed to delete' });
  }
});

router.delete('/materials', requireAuth, async (req, res) => {
  const names = Array.isArray(req.body?.names) ? req.body.names : [];
  if (!names.length) return res.status(400).json({ message: 'names required' });
  const baseDir = path.join(uploadsRoot, 'planner', String(req.userId), 'materials');
  ensureDir(baseDir);
  let count = 0;
  for (const n of names) {
    const full = path.join(baseDir, n);
    try { if (fs.existsSync(full)) { fs.unlinkSync(full); count++; } } catch {}
  }
  res.json({ ok: true, deleted: count });
});

router.delete('/datesheet', requireAuth, async (req, res) => {
  const names = Array.isArray(req.body?.names) ? req.body.names : [];
  if (!names.length) return res.status(400).json({ message: 'names required' });
  const baseDir = path.join(uploadsRoot, 'planner', String(req.userId), 'datesheets');
  ensureDir(baseDir);
  let count = 0;
  for (const n of names) {
    const full = path.join(baseDir, n);
    try { if (fs.existsSync(full)) { fs.unlinkSync(full); count++; } } catch {}
  }
  res.json({ ok: true, deleted: count });
});

// Simple plan generator: create 2-hour blocks daily until upcoming 7 days
router.post('/plan', requireAuth, async (req, res) => {
  const startFrom = req.body?.startFrom ? new Date(req.body.startFrom) : new Date();
  const subjects = await AcademicSubject.find({ userId: req.userId }).sort({ createdAt: 1 });
  if (!subjects.length) return res.status(400).json({ message: 'Add at least one subject' });

  const items = [];
  const totalDays = 7; // can be extended later with datesheet parsing
  const blockHours = 2;
  let cursor = new Date(startFrom);
  for (let d = 0; d < totalDays; d++) {
    for (const s of subjects) {
      const start = new Date(cursor);
      const end = new Date(cursor);
      end.setHours(end.getHours() + blockHours);
      items.push({ subjectId: s._id, title: `Study ${s.name}`, start, end });
      cursor = new Date(end);
    }
    // Next day morning 9am
    cursor.setDate(cursor.getDate() + 1);
    cursor.setHours(9, 0, 0, 0);
  }

  const plan = await StudyPlan.create({ userId: req.userId, items });
  res.status(201).json(plan);
});

router.get('/plan', requireAuth, async (req, res) => {
  const latest = await StudyPlan.findOne({ userId: req.userId }).sort({ createdAt: -1 });
  res.json(latest || { items: [] });
});

// Google Calendar stubs
router.post('/google/token', requireAuth, async (req, res) => {
  const { accessToken, refreshToken, expiryDate } = req.body || {};
  if (!accessToken) return res.status(400).json({ message: 'accessToken required' });
  await GoogleCredential.findOneAndUpdate(
    { userId: req.userId },
    { accessToken, refreshToken, expiryDate: expiryDate ? new Date(expiryDate) : undefined },
    { upsert: true, new: true }
  );
  res.json({ ok: true });
});

router.post('/google/push', requireAuth, async (req, res) => {
  const cred = await GoogleCredential.findOne({ userId: req.userId });
  if (!cred?.accessToken) return res.status(400).json({ message: 'no token' });
  const plan = await StudyPlan.findOne({ userId: req.userId }).sort({ createdAt: -1 });
  if (!plan || !plan.items?.length) return res.status(400).json({ message: 'no plan' });
  const accessToken = cred.accessToken;

  let created = 0;
  for (const item of plan.items) {
    try {
      const resp = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          summary: item.title || 'Study Session',
          start: { dateTime: new Date(item.start).toISOString() },
          end: { dateTime: new Date(item.end).toISOString() },
        }),
      });
      if (resp.ok) created++;
    } catch {}
  }
  res.json({ ok: true, created });
});

export default router;


