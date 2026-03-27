import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import connectDB from './config/db.js';
import { requireAuth } from './middleware/auth.js';

// Resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverEnvPath = path.join(__dirname, '.env');
const rootEnvPath = path.join(__dirname, '..', '.env');
const envResult = dotenv.config({ path: serverEnvPath });
if (envResult.error) {
  dotenv.config({ path: rootEnvPath });
}

const app = express();

// Middleware
app.use(cors());
// Increase body size limits to handle base64 avatar data
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Connect DB
connectDB();

// Routes
import authRoutes from './routes/authRoutes.js';
import quoteRoutes from './routes/quoteRoutes.js';
import chatbotRoutes from './routes/chatbotRoutes.js';
import journalRoutes from './routes/journalRoutes.js';
import blogRoutes from './routes/blogRoutes.js';
import googleRoutes from './routes/googleRoutes.js';
import calendarRoutes from './routes/calendarRoutes.js';
import plannerRoutes from './routes/plannerRoutes.js';
import therapistRoutes from './routes/therapistRoutes.js';
app.use('/api/auth', authRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/journals', journalRoutes);
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/api/blogs', blogRoutes);
app.use('/api/google', googleRoutes);
app.use('/api/v1/calendar', calendarRoutes);
app.use('/api/planner', plannerRoutes);
app.use('/api/therapists', therapistRoutes);

app.post('/api/voice/process', requireAuth, async (req, res) => {
  try {
    const { audioBase64, mimeType } = req.body || {};
    const userId = req.userId || 'unknown';
    if (!audioBase64 || typeof audioBase64 !== 'string') {
      return res.status(400).json({ error: 'audioBase64 is required' });
    }

    let audioBuffer;
    try {
      audioBuffer = Buffer.from(audioBase64, 'base64');
    } catch {
      return res.status(400).json({ error: 'Invalid base64 audio payload' });
    }
    if (!audioBuffer?.length) {
      return res.status(400).json({ error: 'Decoded audio is empty' });
    }
    console.log(`[voice] Received audio payload: ${audioBuffer.length} bytes (userId: ${userId}, mime: ${mimeType || 'application/octet-stream'})`);

    const voiceApiUrl = process.env.FLASK_VOICE_URL || 'http://localhost:5002';

    const voiceResp = await fetch(`${voiceApiUrl}/analyze-audio`, {
      method: 'POST',
      headers: {
        'Content-Type': typeof mimeType === 'string' && mimeType.trim() ? mimeType : 'application/octet-stream',
      },
      body: audioBuffer,
    });

    if (!voiceResp.ok) {
      const errText = await voiceResp.text().catch(() => '');
      return res.status(502).json({ error: `Voice model failed: ${errText || voiceResp.statusText}` });
    }

    const voiceData = await voiceResp.json();
    const transcript = String(voiceData.transcript || '').trim();
    const language = voiceData.language || 'unknown';
    const emotion = voiceData.emotion || 'neutral';
    const reply = String(voiceData.reply || '').trim();
    const source = voiceData.source || 'voice';
    console.log(`[voice] Transcript: "${transcript.slice(0, 180)}" (lang: ${language}, emotion: ${emotion}, userId: ${userId})`);

    if (!transcript) {
      console.log(`[voice] Empty transcript returned by voice model (userId: ${userId})`);
      return res.json({
        transcript: '',
        language,
        emotion,
        reply,
        source: 'voice_empty',
      });
    }
    console.log(`[voice] AI reply: "${reply.slice(0, 180)}" (source: ${source}, userId: ${userId})`);
    return res.json({
      transcript,
      language,
      emotion,
      reply,
      source,
    });
  } catch (error) {
    console.error('voice process route error:', error);
    return res.status(500).json({ error: 'Voice processing failed' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
const PORT = process.env.PORT || 5000;
http.createServer(app).listen(PORT, () => console.log(`Server running on port ${PORT}`));
