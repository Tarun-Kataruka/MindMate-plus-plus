import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import { google } from 'googleapis';
import AcademicSubject from '../models/AcademicSubject.js';
import AcademicNote from '../models/AcademicNote.js';
import StudyPlan from '../models/StudyPlan.js';
import User from '../models/User.js';
import { uploadsRoot, ensureDir } from '../utils/upload.js';

const FIXED_BREAKS = [
  { title: 'Lunch Break', startHour: 13, endHour: 14 },
  { title: 'Snack Break', startHour: 17, endHour: 18 },
  { title: 'Dinner Break', startHour: 20, endHour: 21 },
];

const MIN_BLOCK_MINUTES = 60;
const MAX_BLOCK_MINUTES = 120;
const MAX_STUDY_HOURS_PER_DAY = 8;
const MAX_PLANNED_DAYS = 60;

const parseTimeString = (value) => {
  if (typeof value !== 'string') {
    throw new Error('Time must be in HH:MM format');
  }
  const [hoursStr, minutesStr] = value.split(':');
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);
  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    throw new Error(`Invalid time format: ${value}`);
  }
  return { hours, minutes };
};

const minutesBetweenDates = (start, end) => {
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
};

const addMinutes = (date, minutes) => new Date(date.getTime() + minutes * 60000);

const getDailyWindow = (anchorDate, dayIndex, startTime, endTime) => {
  const dayStart = new Date(anchorDate);
  dayStart.setDate(dayStart.getDate() + dayIndex);
  dayStart.setHours(startTime.hours, startTime.minutes, 0, 0);

  const dayEnd = new Date(anchorDate);
  dayEnd.setDate(dayEnd.getDate() + dayIndex);
  dayEnd.setHours(endTime.hours, endTime.minutes, 0, 0);

  if (dayEnd <= dayStart) {
    dayEnd.setDate(dayEnd.getDate() + 1);
  }

  return { dayStart, dayEnd };
};

const buildBreaksForDay = (anchorDate, dayIndex, windowStart, windowEnd) => {
  const baseDay = new Date(anchorDate);
  baseDay.setDate(baseDay.getDate() + dayIndex);
  baseDay.setHours(0, 0, 0, 0);

  const breaks = [];
  for (const brk of FIXED_BREAKS) {
    const start = new Date(baseDay);
    start.setHours(brk.startHour, 0, 0, 0);
    const end = new Date(baseDay);
    end.setHours(brk.endHour, 0, 0, 0);
    if (end <= start) {
      end.setDate(end.getDate() + 1);
    }
    if (start < windowStart) {
      start.setDate(start.getDate() + 1);
      end.setDate(end.getDate() + 1);
    }
    if (start >= windowStart && end <= windowEnd) {
      breaks.push({ title: brk.title, start, end });
    }
  }

  return breaks.sort((a, b) => a.start - b.start);
};

const buildStudyWindows = (dayStart, dayEnd, breaks) => {
  const windows = [];
  let cursor = new Date(dayStart);
  const sortedBreaks = [...breaks].sort((a, b) => a.start - b.start);

  for (const brk of sortedBreaks) {
    if (brk.start > cursor) {
      windows.push({ start: new Date(cursor), end: new Date(brk.start) });
    }
    if (brk.end > cursor) {
      cursor = new Date(brk.end);
    }
  }

  if (cursor < dayEnd) {
    windows.push({ start: new Date(cursor), end: new Date(dayEnd) });
  }

  return windows.filter((slot) => minutesBetweenDates(slot.start, slot.end) >= MIN_BLOCK_MINUTES);
};

const choosePreferredBlockMinutes = (availableMinutes, subjectCount) => {
  if (availableMinutes < MIN_BLOCK_MINUTES || subjectCount <= 0) {
    return 0;
  }
  const perSubject = availableMinutes / subjectCount;
  if (perSubject >= 90 && availableMinutes >= MAX_BLOCK_MINUTES) {
    return MAX_BLOCK_MINUTES;
  }
  return MIN_BLOCK_MINUTES;
};

const pickBlockLength = (preferred, slotRemaining, capRemaining) => {
  if (preferred && slotRemaining >= preferred && capRemaining >= preferred) {
    return preferred;
  }
  if (slotRemaining >= MIN_BLOCK_MINUTES && capRemaining >= MIN_BLOCK_MINUTES) {
    return MIN_BLOCK_MINUTES;
  }
  return 0;
};

const buildStructuredPlan = ({
  anchorDate,
  subjectNames,
  totalDays,
  startTime,
  endTime,
  maxStudyMinutesPerDay,
}) => {
  const items = [];
  const baseDate = new Date(anchorDate);
  baseDate.setHours(0, 0, 0, 0);
  let subjectCursor = 0;

  for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
    const { dayStart, dayEnd } = getDailyWindow(baseDate, dayIndex, startTime, endTime);
    const breaks = buildBreaksForDay(baseDate, dayIndex, dayStart, dayEnd);
    const windows = buildStudyWindows(dayStart, dayEnd, breaks);
    const availableMinutes = windows.reduce(
      (sum, slot) => sum + minutesBetweenDates(slot.start, slot.end),
      0,
    );

    if (!availableMinutes) {
      items.push(
        ...breaks.map((brk) => ({
          subjectId: null,
          title: brk.title,
          start: brk.start,
          end: brk.end,
          completed: false,
        })),
      );
      continue;
    }

    const preferredBlock = choosePreferredBlockMinutes(availableMinutes, subjectNames.length);
    if (!preferredBlock) {
      items.push(
        ...breaks.map((brk) => ({
          subjectId: null,
          title: brk.title,
          start: brk.start,
          end: brk.end,
          completed: false,
        })),
      );
      continue;
    }

    const dayCap = Math.min(maxStudyMinutesPerDay, availableMinutes);
    let minutesScheduled = 0;
    const sessions = [];

    for (const window of windows) {
      let cursor = new Date(window.start);
      while (minutesScheduled < dayCap) {
        const slotRemaining = minutesBetweenDates(cursor, window.end);
        const capRemaining = dayCap - minutesScheduled;
        const blockLength = pickBlockLength(preferredBlock, slotRemaining, capRemaining);
        if (!blockLength) {
          break;
        }

        const subjectName = subjectNames[subjectCursor % subjectNames.length];
        const start = new Date(cursor);
        const end = addMinutes(start, blockLength);
        sessions.push({
          subjectId: null,
          title: `Study ${subjectName}`,
          start,
          end,
          completed: false,
        });

        minutesScheduled += blockLength;
        cursor = new Date(end);
        subjectCursor++;
      }
      if (minutesScheduled >= dayCap) {
        break;
      }
    }

    const combined = [
      ...sessions,
      ...breaks.map((brk) => ({
        subjectId: null,
        title: brk.title,
        start: brk.start,
        end: brk.end,
        completed: false,
      })),
    ].sort((a, b) => a.start - b.start);

    items.push(...combined);
  }

  return items;
};

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
    const {
      subjects: subjectsInput,
      dailyStartTime = '09:00',
      dailyEndTime = '17:00',
      numDays = 1,
      startDate,
      maxHoursPerDay,
      datesheetPath,
    } = req.body || {};

    let subjectNames = [];
    if (Array.isArray(subjectsInput)) {
      subjectNames = subjectsInput.map((s) => String(s).trim()).filter((s) => s.length > 0);
    } else if (typeof subjectsInput === 'string') {
      subjectNames = subjectsInput
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    }

    if (!subjectNames.length) {
      return res.status(400).json({ message: 'At least one subject is required' });
    }

    const planAnchor = startDate ? new Date(startDate) : new Date();
    if (Number.isNaN(planAnchor.getTime())) {
      return res.status(400).json({ message: 'Invalid start date format' });
    }

    let startTime;
    let endTime;
    try {
      startTime = parseTimeString(dailyStartTime);
      endTime = parseTimeString(dailyEndTime);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    const requestedDays = parseInt(numDays, 10);
    const totalDays = Math.max(1, Math.min(MAX_PLANNED_DAYS, Number.isNaN(requestedDays) ? 1 : requestedDays));

    const startMinutes = startTime.hours * 60 + startTime.minutes;
    const endMinutes = endTime.hours * 60 + endTime.minutes;
    let windowMinutes = endMinutes - startMinutes;
    if (windowMinutes <= 0) {
      windowMinutes += 24 * 60;
    }
    if (windowMinutes < MIN_BLOCK_MINUTES) {
      return res.status(400).json({ message: 'Daily availability window is too short for any study session' });
    }

    const parsedMaxHours = typeof maxHoursPerDay === 'number' ? maxHoursPerDay : parseFloat(maxHoursPerDay);
    const fallbackHours = Math.min(MAX_STUDY_HOURS_PER_DAY, windowMinutes / 60);
    let boundedHours = Number.isFinite(parsedMaxHours) ? parsedMaxHours : fallbackHours;
    boundedHours = Math.min(MAX_STUDY_HOURS_PER_DAY, Math.max(1, boundedHours));
    const maxStudyMinutesPerDay = Math.min(Math.round(boundedHours * 60), windowMinutes);

    if (datesheetPath) {
      console.log(`createPlan requested with datesheet: ${datesheetPath}`);
    }

    const planItems = buildStructuredPlan({
      anchorDate: planAnchor,
      subjectNames,
      totalDays,
      startTime,
      endTime,
      maxStudyMinutesPerDay,
    });

    const studyItemCount = planItems.filter((item) => item.title.toLowerCase().startsWith('study')).length;
    if (!studyItemCount) {
      return res.status(400).json({
        message: 'Unable to build a study plan with the provided availability. Try extending your study window or reducing subjects.',
      });
    }

    if (planItems.length > 1000) {
      return res.status(400).json({ message: 'Generated plan is too large. Reduce the planning window or subject list.' });
    }

    const plan = await StudyPlan.create({ userId: req.userId, items: planItems });
    res.status(201).json(plan);
  } catch (err) {
    console.error('createPlan error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
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


