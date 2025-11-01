import path from 'path';
import fs from 'fs';
import AcademicSubject from '../models/AcademicSubject.js';
import AcademicNote from '../models/AcademicNote.js';
import StudyPlan from '../models/StudyPlan.js';
import User from '../models/User.js';
import { uploadsRoot, ensureDir } from '../utils/upload.js';

// Subjects
export const getSubjects = async (req, res) => {
  try {
    const items = await AcademicSubject.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error('getSubjects error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createSubject = async (req, res) => {
  try {
    const name = (req.body?.name || '').trim();
    if (!name) return res.status(400).json({ message: 'Name required' });
    const created = await AcademicSubject.create({ userId: req.userId, name });
    res.status(201).json(created);
  } catch (err) {
    console.error('createSubject error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteSubject = async (req, res) => {
  try {
    await AcademicSubject.deleteOne({ _id: req.params.id, userId: req.userId });
    res.json({ ok: true });
  } catch (err) {
    console.error('deleteSubject error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Notes
export const getNotes = async (req, res) => {
  try {
    const subjectId = req.query.subjectId;
    if (!subjectId) return res.status(400).json({ message: 'subjectId required' });
    const items = await AcademicNote.find({ userId: req.userId, subjectId }).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error('getNotes error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const uploadNotes = async (req, res) => {
  try {
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
  } catch (err) {
    console.error('uploadNotes error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteNotes = async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    if (!ids.length) return res.status(400).json({ message: 'ids required' });
    const docs = await AcademicNote.find({ _id: { $in: ids }, userId: req.userId });
    for (const d of docs) {
      try {
        if (d.filePath && fs.existsSync(d.filePath)) fs.unlinkSync(d.filePath);
      } catch {}
    }
    await AcademicNote.deleteMany({ _id: { $in: ids }, userId: req.userId });
    res.json({ ok: true, deleted: ids.length });
  } catch (err) {
    console.error('deleteNotes error:', err);
    res.status(500).json({ message: 'Failed to delete' });
  }
};

// Materials
export const uploadMaterials = async (req, res) => {
  try {
    const files = req.files || (req.file ? [req.file] : []);
    if (!files.length) return res.status(400).json({ message: 'file(s) required' });
    const items = files.map((f) => {
      const rel = f.path.replace(path.join(process.cwd()), '').replace(/\\/g, '/');
      const url = rel.startsWith('/') ? rel : `/${rel}`;
      return { url, originalName: f.originalname };
    });
    res.status(201).json(items);
  } catch (err) {
    console.error('uploadMaterials error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMaterials = async (req, res) => {
  try {
    const baseDir = path.join(uploadsRoot, 'planner', String(req.userId), 'materials');
    ensureDir(baseDir);
    const list = fs.readdirSync(baseDir).map((name) => {
      const full = path.join(baseDir, name);
      const stat = fs.statSync(full);
      return {
        originalName: name.replace(/^[0-9]+-[0-9]+-/, ''),
        url: `/uploads/planner/${req.userId}/materials/${name}`,
        size: stat.size,
        name,
      };
    });
    res.json(list);
  } catch (err) {
    console.error('getMaterials error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteMaterials = async (req, res) => {
  try {
    const names = Array.isArray(req.body?.names) ? req.body.names : [];
    if (!names.length) return res.status(400).json({ message: 'names required' });
    const baseDir = path.join(uploadsRoot, 'planner', String(req.userId), 'materials');
    ensureDir(baseDir);
    let count = 0;
    for (const n of names) {
      const full = path.join(baseDir, n);
      try {
        if (fs.existsSync(full)) {
          fs.unlinkSync(full);
          count++;
        }
      } catch {}
    }
    res.json({ ok: true, deleted: count });
  } catch (err) {
    console.error('deleteMaterials error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Datesheet
export const uploadDatesheet = async (req, res) => {
  try {
    const files = req.files || (req.file ? [req.file] : []);
    if (!files.length) return res.status(400).json({ message: 'file(s) required' });
    const items = files.map((f) => {
      const rel = f.path.replace(path.join(process.cwd()), '').replace(/\\/g, '/');
      const url = rel.startsWith('/') ? rel : `/${rel}`;
      return { url, originalName: f.originalname };
    });
    res.status(201).json(items);
  } catch (err) {
    console.error('uploadDatesheet error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getDatesheet = async (req, res) => {
  try {
    const baseDir = path.join(uploadsRoot, 'planner', String(req.userId), 'datesheets');
    ensureDir(baseDir);
    const list = fs.readdirSync(baseDir).map((name) => {
      const full = path.join(baseDir, name);
      const stat = fs.statSync(full);
      return {
        originalName: name.replace(/^[0-9]+-[0-9]+-/, ''),
        url: `/uploads/planner/${req.userId}/datesheets/${name}`,
        size: stat.size,
        name,
      };
    });
    res.json(list);
  } catch (err) {
    console.error('getDatesheet error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteDatesheet = async (req, res) => {
  try {
    const names = Array.isArray(req.body?.names) ? req.body.names : [];
    if (!names.length) return res.status(400).json({ message: 'names required' });
    const baseDir = path.join(uploadsRoot, 'planner', String(req.userId), 'datesheets');
    ensureDir(baseDir);
    let count = 0;
    for (const n of names) {
      const full = path.join(baseDir, n);
      try {
        if (fs.existsSync(full)) {
          fs.unlinkSync(full);
          count++;
        }
      } catch {}
    }
    res.json({ ok: true, deleted: count });
  } catch (err) {
    console.error('deleteDatesheet error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};


export const createPlan = async (req, res) => {
  try {
    const startFrom = req.body?.startFrom ? new Date(req.body.startFrom) : new Date();
    const subjects = await AcademicSubject.find({ userId: req.userId }).sort({ createdAt: 1 });
    if (!subjects.length) return res.status(400).json({ message: 'Add at least one subject' });

    const items = [];
    const totalDays = 7; 
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
      cursor.setDate(cursor.getDate() + 1);
      cursor.setHours(9, 0, 0, 0);
    }

    const plan = await StudyPlan.create({ userId: req.userId, items });
    res.status(201).json(plan);
  } catch (err) {
    console.error('createPlan error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getPlan = async (req, res) => {
  try {
    const latest = await StudyPlan.findOne({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(latest || { items: [] });
  } catch (err) {
    console.error('getPlan error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};


export const pushPlanToGoogle = async (req, res) => {
  try {
    console.log('Starting pushPlanToGoogle for user:', req.userId);
    const user = await User.findById(req.userId);
    if (!user || !user.google?.accessToken) {
      console.log('No Google credentials found for user:', req.userId);
      return res.status(400).json({ message: 'No Google credentials found' });
    }

    let { accessToken, refreshToken, tokenExpiry } = user.google;
    if (!accessToken || !tokenExpiry || new Date() >= new Date(tokenExpiry)) {
      if (!refreshToken) {
        console.log('⚠️ No refresh token found for user:', user.email);
        return res.status(401).json({ message: 'Google token expired and no refresh token available' });
      }
      console.log('Refreshing Google access token...');
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );
      oauth2Client.setCredentials({ refresh_token: refreshToken });
      try {
        const tokenResponse = await oauth2Client.getAccessToken();
        accessToken = tokenResponse.token;
        tokenExpiry = new Date(Date.now() + 55 * 60 * 1000);
        user.google.accessToken = accessToken;
        user.google.tokenExpiry = tokenExpiry;
        await user.save();

        console.log('Token refreshed and saved for user:', user.email);
      } catch (refreshError) {
        console.error('Error refreshing access token:', refreshError);
        return res.status(401).json({ message: 'Failed to refresh Google token' });
      }
    }
    const plan = await StudyPlan.findOne({ userId: req.userId }).sort({ createdAt: -1 });
    if (!plan || !plan.items?.length) {
      console.log('⚠️ No study plan found for user:', user.email);
      return res.status(400).json({ message: 'No study plan found' });
    }
    let created = 0;
    for (const item of plan.items) {
      try {
        const eventData = {
          summary: item.title || 'Study Session',
          start: { dateTime: new Date(item.start).toISOString() },
          end: { dateTime: new Date(item.end).toISOString() },
        };

        const resp = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(eventData),
        });

        if (resp.ok) {
          created++;
          console.log(`Created event: ${eventData.summary}`);
        } else {
          const errData = await resp.json();
          console.error(`Failed to create event:`, errData);
        }
      } catch (e) {
        console.error('Error pushing event to Google Calendar:', e);
      }
    }

    console.log(`Successfully created ${created} Google Calendar events for ${user.email}`);
    res.json({ ok: true, created });
  } catch (err) {
    console.error('pushPlanToGoogle error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

