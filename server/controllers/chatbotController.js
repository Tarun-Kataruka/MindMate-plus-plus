import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function getChatbotReply(req, res) {
  try {
    const { message } = req.body || {};
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'message is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        reply: "I'm here with you. Configure GEMINI_API_KEY to enable AI replies."
      });
    }

    const pythonPath = path.join(__dirname, '..', 'venv', 'bin', 'python');
    const chatbotDir = path.join(__dirname, '..', 'ai_models', 'chatbot');
    const scriptPath = path.join(chatbotDir, 'inference.py');

    const env = {
      ...process.env,
      PYTHONUNBUFFERED: '1',
    };

    const py = spawn(pythonPath, [scriptPath], {
      cwd: chatbotDir,
      env,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';
    py.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    py.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error('Python stderr:', data.toString());
    });

    py.on('error', (err) => {
      console.error('Failed to start Python process:', err);
      return res.json({
        reply: "I'm here with you. I’m having trouble responding right now."
      });
    });

    py.on('close', (code) => {
      console.log('Python exited with code', code);

      if (!stdout.trim()) {
        console.error('No output from Python. Stderr:', stderr);
        return res.json({
          reply: "I'm here with you. I’m having trouble responding right now."
        });
      }

      try {
        const lines = stdout.trim().split('\n');
        const lastLine = lines[lines.length - 1];
        const parsed = JSON.parse(lastLine);

        if (parsed.error) {
          console.error('Python reported error:', parsed.error);
          return res.json({
            reply: "I'm here with you. Let's try again in a moment."
          });
        }

        if (!parsed.reply) {
          return res.json({
            reply: "I'm here with you. I’m having trouble responding right now."
          });
        }

        return res.json({ reply: parsed.reply });
      } catch (e) {
        console.error('Failed to parse Python output as JSON:', e);
        console.error('Raw stdout:', stdout);
        return res.json({
          reply: "I'm here with you. I’m having trouble responding right now."
        });
      }
    });
    py.stdin.write(JSON.stringify({ message }));
    py.stdin.end();

  } catch (e) {
    console.error('Unexpected server error:', e);
    return res.json({
      reply: "I'm here with you. I’m having trouble responding right now."
    });
  }
}
