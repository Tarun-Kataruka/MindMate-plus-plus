from flask import Flask, request, jsonify
import google.generativeai as genai
import os
import sys
import codecs
from datetime import datetime
from dotenv import load_dotenv
from flask_cors import CORS

from studyplanner import (
    generate_plan,
    extract_exams_from_image,
    iso,
    hours_between,
)

# Fix Windows console encoding (for Windows terminal output)
if sys.platform == "win32":
    sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())
    sys.stderr = codecs.getwriter("utf-8")(sys.stderr.detach())

# Load environment variables from parent .env
env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
load_dotenv(dotenv_path=env_path)
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("GEMINI_API_KEY not found — running in fallback mode.")
    model = None
else:
    try:
        genai.configure(api_key=api_key.strip())
        model_name = "gemini-2.5-flash"
        model = genai.GenerativeModel(model_name)
        print(f" Gemini model '{model_name}' initialized successfully.")
    except Exception as e:
        print(f"Error initializing Gemini model: {e}")
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
also keep the answers short and convesational.
also keep in mind you are interacting to a person living in india
"""


def _json_error(message, status_code=400):
    return jsonify({"ok": False, "error": message}), status_code

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
        "message": "MindMate++ Chatbot API is running!",
        "status": "ok",
        "version": "1.0.0",
        "ai_enabled": model is not None,
        "endpoints": {
            "health": "/health",
            "chat": "/chat (POST)",
            "study_plan": "/studyplan (POST)"
        }
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
                print(f" Gemini response error: {e}")

        # Fallback if AI not available or fails
        return jsonify({"reply": fallback_reply(user_message), "source": "fallback"})

    except Exception as e:
        print(f"❌ Chat endpoint error: {e}")
        return jsonify({
            "reply": "I'm here with you. I’m having a small hiccup right now, but I’m listening.",
            "source": "error"
        }), 500


@app.route("/studyplan", methods=["POST"])
def study_plan():
    data = request.get_json(silent=True)
    if not data:
        return _json_error("Invalid or missing JSON body.")

    raw_subjects = data.get("subjects")
    if not isinstance(raw_subjects, list) or not raw_subjects:
        return _json_error("'subjects' must be a non-empty list of names or subject objects.")

    subjects = []
    for entry in raw_subjects:
        if isinstance(entry, str):
            name = entry.strip()
            if name:
                subjects.append({"name": name})
        elif isinstance(entry, dict) and entry.get("name"):
            subjects.append(entry)
    if not subjects:
        return _json_error("Each subject entry must include a 'name'.")

    availability = data.get("availability") or {}
    for key in ("daily_start", "daily_end"):
        if key not in availability:
            return _json_error(f"availability.{key} is required.")
    try:
        days_value = int(availability.get("days", 1))
    except (TypeError, ValueError):
        days_value = 1
    availability["days"] = max(1, days_value)
    availability.setdefault("start_date", iso(datetime.now()))

    try:
        hours_cap = min(8.0, hours_between(availability["daily_start"], availability["daily_end"]))
    except ValueError:
        return _json_error("availability daily_start/daily_end must be HH:MM (24h) strings.")
    try:
        provided_cap = float(availability.get("max_hours_per_day", hours_cap))
    except (TypeError, ValueError):
        provided_cap = hours_cap
    availability["max_hours_per_day"] = min(hours_cap, provided_cap)

    preferences = data.get("preferences") or {}

    exams = data.get("exams")
    if exams is not None and not isinstance(exams, list):
        return _json_error("'exams' must be a list when provided.")
    if exams is None:
        exam_image_path = data.get("exam_image_path")
        if exam_image_path:
            try:
                exams = extract_exams_from_image(exam_image_path)
            except FileNotFoundError:
                return _json_error("Exam datesheet image not found.", 404)
            except Exception as exc:
                print(f" Exam extraction error: {exc}")
                return _json_error("Failed to extract exams from the provided image.", 422)
        else:
            exams = []

    try:
        items = generate_plan(subjects, exams, availability, preferences)
    except RuntimeError as exc:
        return _json_error(str(exc), 422)
    except Exception as exc:
        print(f" Study plan generation error: {exc}")
        return _json_error("Unexpected error while generating the study plan.", 500)

    return jsonify({
        "ok": True,
        "items": items,
        "exams": exams,
        "availability": availability,
        "preferences": preferences,
    })

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
