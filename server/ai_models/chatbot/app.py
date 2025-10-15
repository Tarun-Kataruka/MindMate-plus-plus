from flask import Flask, request, jsonify
import google.generativeai as genai
import os
import sys
import codecs
from dotenv import load_dotenv
from flask_cors import CORS

# Fix Windows console encoding (for Windows terminal output)
if sys.platform == "win32":
    sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())
    sys.stderr = codecs.getwriter("utf-8")(sys.stderr.detach())

# Load environment variables from parent .env
env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
load_dotenv(dotenv_path=env_path)
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("⚠️  GEMINI_API_KEY not found — running in fallback mode.")
    model = None
else:
    try:
        genai.configure(api_key=api_key.strip())
        model_name = "gemini-2.0-flash-lite"
        model = genai.GenerativeModel(model_name)
        print(f"✅ Gemini model '{model_name}' initialized successfully.")
    except Exception as e:
        print(f"❌ Error initializing Gemini model: {e}")
        model = None

# Initialize Flask app
app = Flask(__name__)
CORS(app, origins=[
    "http://localhost:3000", 
    "http://localhost:8081", 
    "http://localhost:19006", 
    "http://localhost:5000"
])

SYSTEM_PROMPT = """
You are MindMate++, a warm, empathetic, and encouraging mental wellness friend.

Your goal is to help the user feel heard and supported through friendly, non-clinical conversation.

Guidelines:
- Tone: gentle, friendly, and reassuring.
- Responses: short and natural, like talking to a close friend.
- Ask open-ended questions to invite sharing.
- Validate feelings (e.g., “That sounds really tough.”)
- Never give medical or diagnostic advice.
"""

def fallback_reply(user_text):
    """Rule-based fallback when AI model isn't available."""
    lowered = user_text.lower()
    if any(w in lowered for w in ["hi", "hello", "hey", "good morning", "good afternoon", "good evening", "start"]):
        return "Hello! I'm Mate — your gentle companion here at MindMate++. What's on your mind today?"
    if any(k in lowered for k in ["anxious", "worry", "panic"]):
        return "That sounds really tough. Try a few slow breaths with me — inhale 4, hold 4, exhale 6. What’s on your mind right now?"
    if any(k in lowered for k in ["sad", "lonely", "depressed"]):
        return "I'm sorry you're going through that. Your feelings make sense. Want to tell me what’s been hardest lately?"
    if any(k in lowered for k in ["angry", "frustrated", "mad", "annoyed"]):
        return "It’s okay to feel angry. Emotions have messages. What do you think your anger is trying to tell you?"
    if any(k in lowered for k in ["stress", "pressure", "burnout", "overwhelmed"]):
        return "That sounds stressful. What’s been weighing on you the most lately?"
    if any(k in lowered for k in ["tired", "fatigue", "drained"]):
        return "You sound really tired. Rest is important — have you had any quiet moments for yourself today?"
    if any(k in lowered for k in ["help", "support", "advice"]):
        return "I’m here for you. Sometimes just talking helps. What would you like to share with me?"
    return "I hear you. I’m here for you. Would you like to tell me a bit more about what’s on your mind?"

@app.route("/")
def home():
    return jsonify({
        "message": "🧘 MindMate++ Chatbot API is running!",
        "status": "ok",
        "version": "1.0.0",
        "ai_enabled": model is not None,
        "endpoints": { "health": "/health", "chat": "/chat (POST)" }
    })

@app.route("/health")
def health():
    return jsonify({
        "status": "healthy",
        "ai_enabled": model is not None,
        "service": "MindMate++ Chatbot",
        "note": "Using fallback mode" if model is None else "AI mode active"
    })

@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()
        user_message = data.get("message", "").strip() if data else ""
        if not user_message:
            return jsonify({"error": "Message cannot be empty"}), 400

        if model:
            try:
                prompt = f"{SYSTEM_PROMPT}\n\nUser: {user_message}\n\nMindMate++:"
                response = model.generate_content(prompt)
                if hasattr(response, "text") and response.text:
                    return jsonify({"reply": response.text.strip(), "source": "ai"})
            except Exception as e:
                print(f"❌ Gemini response error: {e}")

        # Fallback if AI not available or fails
        return jsonify({"reply": fallback_reply(user_message), "source": "fallback"})

    except Exception as e:
        print(f"❌ Chat endpoint error: {e}")
        return jsonify({
            "reply": "I'm here with you. I’m having a small hiccup right now, but I’m listening.",
            "source": "error"
        }), 500

@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Endpoint not found", "available_endpoints": ["/", "/health", "/chat"]}), 404

@app.errorhandler(500)
def internal_error(e):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == "__main__":
    port = int(os.environ.get("FLASK_PORT", 5001))
    debug_mode = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    app.run(host="0.0.0.0", port=port, debug=debug_mode)
