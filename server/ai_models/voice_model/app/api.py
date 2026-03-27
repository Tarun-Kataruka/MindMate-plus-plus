from __future__ import annotations

import os
import sys
from pathlib import Path

from flask import Flask, jsonify, request
from flask_cors import CORS
import shutil
import google.generativeai as genai
from dotenv import load_dotenv

_PACKAGE_ROOT = Path(__file__).resolve().parents[1]
if str(_PACKAGE_ROOT) not in sys.path:
    sys.path.insert(0, str(_PACKAGE_ROOT))

from services.asr_service import transcribe_audio
from services.emotion_text import classify_emotion

app = Flask(__name__)
CORS(app)

env_path = os.path.join(_PACKAGE_ROOT.parent, ".env")
load_dotenv(dotenv_path=env_path)
_api_key = (os.getenv("VOICE_GEMINI_API_KEY") or os.getenv("GEMINI_API_KEY") or "").strip()
_voice_model_name = (os.getenv("VOICE_GEMINI_MODEL") or "gemini-2.5-flash").strip()
_voice_chat_model = None
if _api_key:
    try:
        genai.configure(api_key=_api_key)
        _voice_chat_model = genai.GenerativeModel(_voice_model_name)
    except Exception:
        _voice_chat_model = None

VOICE_SYSTEM_PROMPT = (
    "You are MindMate++ voice companion. Reply in 1-3 short, empathetic sentences. "
    "Keep it conversational and supportive for users in India. "
    "Do not provide medical diagnosis."
)


def _fallback_voice_reply(transcript: str, emotion: str) -> str:
    t = (transcript or "").lower()
    if any(k in t for k in ["anxious", "panic", "worry", "nervous"]):
        return "I hear you. Let's slow down together with one deep breath. What feels most overwhelming right now?"
    if any(k in t for k in ["sad", "lonely", "down", "upset"]):
        return "I'm here with you. That sounds heavy, and your feelings make sense. Want to share what happened today?"
    if any(k in t for k in ["angry", "frustrated", "mad"]):
        return "That sounds frustrating. It's okay to feel this way. What triggered this feeling most?"
    if emotion == "neutral":
        return "I'm listening. Tell me a little more so I can support you better."
    return "Thank you for sharing. I'm here with you."


def _generate_voice_reply(transcript: str, emotion: str) -> tuple[str, str]:
    if not transcript:
        return "", "voice_empty"
    if _voice_chat_model is None:
        return _fallback_voice_reply(transcript, emotion), "voice_fallback"
    prompt = (
        f"{VOICE_SYSTEM_PROMPT}\n\n"
        f"Detected emotion: {emotion}\n"
        f"User said: {transcript}\n\n"
        "MindMate++:"
    )
    try:
        response = _voice_chat_model.generate_content(prompt)
        text = (getattr(response, "text", None) or "").strip()
        if text:
            return text, "voice_ai"
    except Exception:
        pass
    return _fallback_voice_reply(transcript, emotion), "voice_fallback"


@app.get("/health")
def health():
    return jsonify({"status": "healthy", "service": "voice-model"})


@app.post("/analyze-audio")
def analyze_audio():
    audio_bytes = request.get_data(cache=False, as_text=False)
    if not audio_bytes:
        return jsonify({"error": "Empty audio payload"}), 400
    if shutil.which("ffmpeg") is None:
        return (
            jsonify(
                {
                    "error": "ffmpeg is required for Whisper audio decoding. Install ffmpeg and restart voice service."
                }
            ),
            500,
        )

    try:
        result = transcribe_audio(audio_bytes)
        transcript = (result.get("text") or "").strip()
        language = result.get("language", "unknown")
        emotion = classify_emotion(transcript) if transcript else "neutral"
        reply, source = _generate_voice_reply(transcript, emotion)
        return jsonify(
            {
                "transcript": transcript,
                "language": language,
                "emotion": emotion,
                "reply": reply,
                "source": source,
            }
        )
    except FileNotFoundError as exc:
        if "ffmpeg" in str(exc).lower():
            return (
                jsonify(
                    {
                        "error": "ffmpeg not found. Install ffmpeg on the host and restart voice service."
                    }
                ),
                500,
            )
        return jsonify({"error": f"Audio processing failed: {exc}"}), 500
    except Exception as exc:
        error_text = str(exc)
        lowered = error_text.lower()
        if "failed to load audio" in lowered or "invalid data found" in lowered:
            # Treat undecodable/partial audio as empty utterance instead of hard failure.
            return jsonify({"transcript": "", "language": "unknown", "emotion": "neutral"}), 200
        return jsonify({"error": f"Audio processing failed: {exc}"}), 500


if __name__ == "__main__":
    port = int(os.environ.get("FLASK_VOICE_PORT", 5002))
    debug_mode = os.environ.get("FLASK_VOICE_DEBUG", "false").lower() == "true"
    app.run(host="0.0.0.0", port=port, debug=debug_mode)
