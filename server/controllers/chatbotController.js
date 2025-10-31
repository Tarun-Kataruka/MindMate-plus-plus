import fetch from 'node-fetch';

export async function getChatbotReply(req, res) {
  console.log('getChatbotReply function called');
  console.log('Request body:', req.body);
  
  try {
    const { message } = req.body || {};
    
    if (!message || typeof message !== 'string' || !message.trim()) {
      console.log('Invalid message:', message);
      return res.status(400).json({ 
        error: 'Message is required and must be a non-empty string' 
      });
    }

    const flaskUrl = process.env.FLASK_CHATBOT_URL || 'http://localhost:5001';
    console.log('Flask URL:', flaskUrl);
    console.log(`Forwarding message to Flask chatbot: "${message}"`);
    
    try {
      // Try to communicate with Flask service
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      console.log('Making fetch request to Flask...');
      const flaskResponse = await fetch(`${flaskUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: message.trim() }),
        signal: controller.signal,
      });

      console.log('Flask response status:', flaskResponse.status);
      clearTimeout(timeoutId);

      if (flaskResponse.ok) {
        const data = await flaskResponse.json();
        console.log(`Flask response received (${data.source || 'unknown'}): "${data.reply}"`);
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