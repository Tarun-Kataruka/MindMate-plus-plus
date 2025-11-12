import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import { google } from 'googleapis';
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
    const subjectId = req.params.id;
    if (!subjectId) {
      return res.status(400).json({ message: 'Subject ID is required' });
    }
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({ message: 'Invalid subject ID format' });
    }
    
    // Check if subject exists and belongs to user
    const subject = await AcademicSubject.findOne({ _id: subjectId, userId: req.userId });
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }
  
    // Find all notes for this subject
    const notes = await AcademicNote.find({ subjectId, userId: req.userId });
    
    // Delete all associated files from filesystem
    let deletedFiles = 0;
    for (const note of notes) {
      try {
        if (note.filePath && fs.existsSync(note.filePath)) {
          fs.unlinkSync(note.filePath);
          deletedFiles++;
        }
      } catch (fileErr) {
        console.error('Error deleting file:', fileErr);
      }
    }
    
    // Delete all notes from database
    const deleteNotesResult = await AcademicNote.deleteMany({ subjectId, userId: req.userId });
    
    // Delete the subject
    const deleteSubjectResult = await AcademicSubject.deleteOne({ _id: subjectId, userId: req.userId });
    
    if (deleteSubjectResult.deletedCount === 0) {
      return res.status(404).json({ message: 'Subject not found or already deleted' });
    }
    
    res.json({ 
      ok: true, 
      deletedNotes: notes.length,
      deletedFiles: deletedFiles,
      message: 'Subject and all associated notes deleted successfully'
    });
  } catch (err) {
    console.error('deleteSubject error:', err);
    res.status(500).json({ message: err.message || 'Internal server error' });
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
        items.push({ subjectId: s._id, title: `Study ${s.name}`, start, end, completed: false });
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

export const updatePlanItemCompletion = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { completed } = req.body ?? {};

    if (typeof completed !== 'boolean') {
      return res.status(400).json({ message: 'completed must be a boolean' });
    }

    const plan = await StudyPlan.findOne({ userId: req.userId }).sort({ createdAt: -1 });
    if (!plan) {
      return res.status(404).json({ message: 'No study plan found' });
    }

    const item = plan.items.id(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Plan item not found' });
    }

    item.completed = completed;
    await plan.save();

    res.json({ ok: true, item });
  } catch (err) {
    console.error('updatePlanItemCompletion error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const checkGoogleConnection = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('google');
    const connected = !!(user?.google?.refreshToken || user?.google?.accessToken);
    res.json({ connected });
  } catch (err) {
    console.error('checkGoogleConnection error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const disconnectGoogle = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.google = undefined;
    user.markModified('google');
    await user.save();

    res.json({ ok: true });
  } catch (err) {
    console.error('disconnectGoogle error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const pushPlanToGoogle = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has Google credentials (refreshToken is the key indicator)
    if (!user.google?.refreshToken) {
      return res.status(400).json({ message: 'Google Calendar not connected. Please connect your Google account first.' });
    }

    const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      return res.status(500).json({ message: 'Google OAuth configuration missing' });
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    
    // Set credentials and refresh token if needed
    let accessToken = user.google.accessToken;
    const refreshToken = user.google.refreshToken;
    const tokenExpiry = user.google.tokenExpiry;

    // Check if token needs refresh
    if (!accessToken || !tokenExpiry || new Date() >= new Date(tokenExpiry)) {
      oauth2Client.setCredentials({ refresh_token: refreshToken });
      try {
        const tokenResponse = await oauth2Client.getAccessToken();
        accessToken = tokenResponse.token;
        const newTokenExpiry = new Date(Date.now() + 55 * 60 * 1000);
        
        // Update user with new token
        user.google.accessToken = accessToken;
        user.google.tokenExpiry = newTokenExpiry;
        await user.save();
      } catch (refreshError) {
        console.error('Error refreshing access token:', refreshError);
        return res.status(401).json({ 
          message: 'Failed to refresh Google token. Please reconnect your Google account.',
          error: refreshError?.message 
        });
      }
    } else {
      oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    }

    // Get the study plan
    const plan = await StudyPlan.findOne({ userId: req.userId }).sort({ createdAt: -1 });
    if (!plan || !plan.items?.length) {
      console.log("No study plan found for user:", req.userId);
      return res.status(400).json({ message: 'No study plan found. Please create a study plan first.' });
    }

    // Use Google Calendar API
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    let created = 0;
    const errors = [];

    for (const item of plan.items) {
      try {
        const startDate = new Date(item.start);
        const endDate = new Date(item.end);

        // Validate dates
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          errors.push(`Invalid date for: ${item.title}`);
          continue;
        }

        const event = {
          summary: item.title || 'Study Session',
          start: {
            dateTime: startDate.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          },
          end: {
            dateTime: endDate.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          },
        };

        const response = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: event,
        });

        if (response.data) {
          created++;
        }
      } catch (e) {
        console.error('Error creating calendar event:', e);
        errors.push(`${item.title}: ${e?.message || 'Unknown error'}`);
      }
    }

    if (created === 0 && errors.length > 0) {
      return res.status(400).json({ 
        message: 'Failed to create events',
        errors: errors.slice(0, 5), // Return first 5 errors
        created: 0
      });
    }

    res.json({ 
      ok: true, 
      created,
      total: plan.items.length,
      errors: errors.length > 0 ? errors.slice(0, 5) : undefined
    });
  } catch (err) {
    console.error('pushPlanToGoogle error:', err);
    res.status(500).json({ 
      message: err?.message || 'Internal server error',
      error: err?.toString()
    });
  }
};


