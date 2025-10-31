import { google } from 'googleapis';
import User from '../models/User.js';

function getOAuth2Client() {
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    throw new Error('Missing GOOGLE_CLIENT_ID or GOOGLE_REDIRECT_URI');
  }
  return new google.auth.OAuth2(clientId, clientSecret || undefined, redirectUri);
}

export async function exchangeGoogleCode(req, res) {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
    const { code } = req.body || {};
    if (!code) return res.status(400).json({ message: 'Missing code' });
    const oauth2 = getOAuth2Client();
    const { tokens } = await oauth2.getToken({ code });
    const { refresh_token, access_token, expiry_date, scope } = tokens;
    if (!refresh_token && !access_token) {
      return res.status(400).json({ message: 'No tokens returned from Google' });
    }
    const update = {
      'google.refreshToken': refresh_token || undefined,
      'google.accessToken': access_token || undefined,
      'google.tokenExpiry': expiry_date ? new Date(expiry_date) : undefined,
      'google.scope': scope,
    };
    await User.findByIdAndUpdate(req.userId, update, { new: true });
    return res.json({ connected: true, hasRefreshToken: Boolean(refresh_token) });
  } catch (err) {
    console.error('exchangeGoogleCode error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function getAuthedCalendarForUser(userId) {
  const user = await User.findById(userId).lean();
  if (!user?.google?.refreshToken) throw new Error('Google not connected');
  const oauth2 = getOAuth2Client();
  oauth2.setCredentials({ refresh_token: user.google.refreshToken });
  const calendar = google.calendar({ version: 'v3', auth: oauth2 });
  return { calendar, oauth2 };
}

export async function listCalendarEvents(req, res) {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
    const { calendar } = await getAuthedCalendarForUser(req.userId);
    const now = new Date();
    const { data } = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 20,
    });
    return res.json({ events: data.items || [] });
  } catch (err) {
    console.error('listCalendarEvents error:', err?.message || err);
    const status = /not connected/i.test(String(err?.message)) ? 400 : 500;
    return res.status(status).json({ message: err?.message || 'Internal server error' });
  }
}

export async function createCalendarEvent(req, res) {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
    const { summary, description, startIso, endIso, timeZone } = req.body || {};
    if (!summary || !startIso || !endIso) {
      return res.status(400).json({ message: 'summary, startIso, endIso are required' });
    }
    const { calendar } = await getAuthedCalendarForUser(req.userId);
    const event = {
      summary,
      description,
      start: { dateTime: startIso, timeZone: timeZone || 'UTC' },
      end: { dateTime: endIso, timeZone: timeZone || 'UTC' },
    };
    const { data } = await calendar.events.insert({ calendarId: 'primary', requestBody: event });
    return res.status(201).json({ event: data });
  } catch (err) {
    console.error('createCalendarEvent error:', err?.message || err);
    const status = /not connected/i.test(String(err?.message)) ? 400 : 500;
    return res.status(status).json({ message: err?.message || 'Internal server error' });
  }
}

export async function disconnectGoogle(req, res) {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
    await User.findByIdAndUpdate(req.userId, {
      $unset: { google: 1 },
    });
    return res.json({ disconnected: true });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}


