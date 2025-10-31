import fetch from 'node-fetch';
import ChatMessage from '../models/ChatMessage.js';

export async function getChatbotReply(req, res) {
  try {
    const { message } = req.body || {};
    if (!message || typeof message !== 'string' || !message.trim()) {
      console.log('Invalid message:', message);
      return res.status(400).json({ 
        error: 'Message is required and must be a non-empty string' 
      });
    }

    const flaskUrl = process.env.FLASK_CHATBOT_URL || 'http://localhost:5001';
    
    try {
      // Try to communicate with Flask service
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const flaskResponse = await fetch(`${flaskUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: message.trim() }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (flaskResponse.ok) {
        const data = await flaskResponse.json();
        if (req.userId) {
          try {
            const userMood = inferMoodFromText(message);
            await ChatMessage.create({ userId: req.userId, role: 'user', content: message.trim(), mood: userMood });
            await ChatMessage.create({ userId: req.userId, role: 'assistant', content: data.reply, mood: 'neutral' });
          } catch (persistErr) {
            console.error('Failed to persist chat messages:', persistErr?.message);
          }
        }
        return res.json({
          reply: data.reply,
          source: data.source || 'flask',
          ai_enabled: data.source === 'ai'
        });
      } else {
        console.error(`Flask returned error: ${flaskResponse.status} ${flaskResponse.statusText}`);
        const errorData = await flaskResponse.json().catch(() => ({}));
        throw new Error(`Flask service returned ${flaskResponse.status}: ${errorData.error || 'Unknown error'}`);
      }
    } catch (flaskError) {
      if (flaskError.name === 'AbortError') {
        console.error('Flask service timeout');
      } else {
        console.error('Flask service unavailable:', flaskError.message);
      }
      
      // Fallback to simple responses if Flask is unavailable
      const fallbackReply = getFallbackReply(message);
      console.log(`🔄 Using Node.js fallback: "${fallbackReply}"`);
      if (req.userId) {
        try {
          const userMood = inferMoodFromText(message);
          await ChatMessage.create({ userId: req.userId, role: 'user', content: message.trim(), mood: userMood });
          await ChatMessage.create({ userId: req.userId, role: 'assistant', content: fallbackReply, mood: 'neutral' });
        } catch (persistErr) {
          console.error('Failed to persist chat messages (fallback):', persistErr?.message);
        }
      }

      return res.json({
        reply: fallbackReply,
        source: 'node_fallback',
        ai_enabled: false,
        note: 'Flask service unavailable, using fallback responses'
      });
    }

  } catch (error) {
    console.error(' Chatbot controller error:', error);
    return res.status(500).json({
      reply: "I'm here with you. I'm having trouble responding right now, but I'm listening.",
      source: 'error',
      ai_enabled: false
    });
  }
}

function getFallbackReply(userText) {
  const lowered = userText.toLowerCase();
  
  // Greeting responses
  const greetingWords = ["hi", "hello", "hey", "good morning", "good afternoon", "good evening"];
  if (greetingWords.some(word => lowered.includes(word)) && userText.split(' ').length <= 3) {
    return "Hello! I'm Mate — your gentle companion here at MindMate++. What's on your mind today?";
  }
  
  // Emotional keywords
  if (lowered.includes('anxious') || lowered.includes('anxiety') || lowered.includes('nervous')) {
    return "That sounds really tough. Try taking a few deep breaths with me. What's making you feel this way?";
  }
  
  if (lowered.includes('sad') || lowered.includes('down') || lowered.includes('upset') || lowered.includes('lonely')) {
    return "I'm sorry you're going through that. Your feelings are valid. Want to share what's on your mind?";
  }
  
  if (lowered.includes('angry') || lowered.includes('frustrated') || lowered.includes('mad')) {
    return "I can hear that you're feeling frustrated. Sometimes naming our emotions helps. What happened?";
  }
  
  if (lowered.includes('stressed') || lowered.includes('overwhelmed') || lowered.includes('pressure')) {
    return "That sounds like a lot to handle. Stress can be really overwhelming. What's weighing on you most?";
  }
  
  if (lowered.includes('tired') || lowered.includes('exhausted') || lowered.includes('drained')) {
    return "It sounds like you're really tired. Rest is so important. Have you been able to take care of yourself today?";
  }
  
  // General supportive response
  return "I'm here to listen. What would you like to talk about today?";
}

// Simple keyword-based mood inference for analytics; not clinical-grade.
function inferMoodFromText(text) {
  const t = String(text || '').toLowerCase();
  if (!t.trim()) return 'unknown';
  if (/(anxious|anxiety|nervous|panic)/.test(t)) return 'anxious';
  if (/(sad|down|upset|lonely|depressed|unhappy)/.test(t)) return 'sad';
  if (/(angry|frustrated|mad|irritated|annoyed|furious)/.test(t)) return 'angry';
  if (/(stressed|overwhelmed|pressure|burned out|burnt out)/.test(t)) return 'stressed';
  if (/(tired|exhausted|drained|sleepy|fatigued)/.test(t)) return 'tired';
  if (/(great|good|happy|calm|relaxed|okay|fine)/.test(t)) return 'positive';
  return 'neutral';
}

// GET /api/chatbot/history (auth required): return last 7 days chat in ascending time
export async function getChatHistory(req, res) {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const docs = await ChatMessage.find({ userId: req.userId, createdAt: { $gte: since } })
      .sort({ createdAt: 1 })
      .lean();
    return res.json({ messages: docs.map(d => ({ id: d._id, role: d.role, text: d.content, mood: d.mood, createdAt: d.createdAt })) });
  } catch (err) {
    console.error('getChatHistory error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// GET /api/chatbot/analytics (auth required): basic mood counts and daily totals
export async function getChatAnalytics(req, res) {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [moodCounts, dailyCounts] = await Promise.all([
      ChatMessage.aggregate([
        { $match: { userId: new ChatMessage.db.Types.ObjectId(req.userId), role: 'user', createdAt: { $gte: since } } },
        { $group: { _id: '$mood', count: { $sum: 1 } } },
      ]),
      ChatMessage.aggregate([
        { $match: { userId: new ChatMessage.db.Types.ObjectId(req.userId), createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, messages: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const moodMap = {};
    for (const m of moodCounts) moodMap[m._id || 'unknown'] = m.count;
    return res.json({
      rangeStart: since,
      moods: moodMap,
      daily: dailyCounts.map(d => ({ date: d._id, messages: d.messages })),
    });
  } catch (err) {
    console.error('getChatAnalytics error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}