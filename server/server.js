import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import connectDB from './config/db.js';

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Create HTTP server and attach WebSocket for voice streaming
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/audio' });

wss.on('connection', (ws, req) => {
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const token = url.searchParams.get('token');
  if (!token || !process.env.JWT_SECRET) {
    console.log('[voice] Rejected: no token or JWT_SECRET');
    ws.close(4001, 'Unauthorized');
    return;
  }
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (e) {
    console.log('[voice] Rejected: invalid token');
    ws.close(4001, 'Invalid token');
    return;
  }

  let chunkCount = 0;
  const userId = decoded.sub || 'unknown';
  console.log(`[voice] Client connected (userId: ${userId})`);

  ws.on('message', (data) => {
    if (Buffer.isBuffer(data) && data.length > 0) {
      chunkCount += 1;
      console.log(`[voice] Chunk #${chunkCount} received, size: ${data.length} bytes (userId: ${userId})`);
      // TODO: pipe to speech-to-text (Whisper, Deepgram, etc.) or store
    }
  });

  ws.on('close', () => {
    console.log(`[voice] Client disconnected, total chunks received: ${chunkCount} (userId: ${userId})`);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT} (HTTP + WebSocket /audio)`));
