import os
import sys
import json
import google.generativeai as genai
from dotenv import load_dotenv
from chatbot import generate_reply as model_generate_reply

env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path=env_path)

def _fallback_reply(user_text: str) -> str:
    lowered = user_text.lower()
    if any(k in lowered for k in ["anxious", "anxiety", "nervous"]):
        return "That sounds really tough. Try a few slow breaths with me—inhale 4, hold 4, exhale 6. What do you feel in your body right now?"
    if any(k in lowered for k in ["sad", "down", "upset", "lonely"]):
        return "I’m sorry you’re going through that. Your feelings make sense. If it helps, could you share what’s weighing on you most today?"
    if any(k in lowered for k in ["angry", "frustrated", "overwhelmed"]):
        return "Thanks for sharing that with me. When emotions run high, even naming them can help. What happened right before you felt this way?"
    return "I hear you. I’m here for you. Would you like to tell me a bit more about what’s on your mind right now?"


def main():
    try:
        data_raw = sys.stdin.read().strip()
        payload = json.loads(data_raw) if data_raw else {}
        message = (payload.get("message") or "").strip()
        if not message:
            print(json.dumps({"reply": "I’m here with you. What would you like to share?"}))
            return

        lowered = message.lower()
        greeting_triggers = {
            "hi", "hello", "hey", "heya", "hiya", "yo", "sup", "hola", "namaste",
            "good morning", "good afternoon", "good evening"
        }
        def _is_greeting(text: str) -> bool:
            t = text.strip().lower()
            if t in greeting_triggers:
                return True
            # startswith variants and short polite greetings
            starts = ("hi ", "hello ", "hey ", "good morning", "good afternoon", "good evening")
            return any(t.startswith(s) for s in starts)

        if _is_greeting(lowered):
            print(json.dumps({
                "reply": "Hello! I’m Mate — your gentle companion here at MindMate++. What’s on your mind today?"
            }))
            return

        try:
            # Prefer the shared chatbot module implementation for consistency
            reply = (model_generate_reply(message) or "").strip()
            if not reply:
                reply = _fallback_reply(message)
            print(json.dumps({"reply": reply}))
        except Exception:
            # Fall back to local generation if import/model fails
            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                print(json.dumps({"reply": _fallback_reply(message)}))
                return
            try:
                genai.configure(api_key=api_key)
                model = genai.GenerativeModel("gemini-1.5-flash")
                system_prompt = (
                    "You are MindMate++, a compassionate and emotionally intelligent mental wellness companion. "
                    "Keep replies short, natural, and empathetic (2–4 sentences). No medical advice."
                )
                prompt = f"{system_prompt}\nUser: {message}\nMindMate++:"
                response = model.generate_content(prompt)
                reply = (getattr(response, "text", None) or "").strip()
                if not reply:
                    try:
                        cand = response.candidates[0].content.parts[0].text
                        reply = (cand or "").strip()
                    except Exception:
                        reply = ""
                if not reply:
                    reply = _fallback_reply(message)
                print(json.dumps({"reply": reply}))
            except Exception:
                print(json.dumps({"reply": _fallback_reply(message)}))
    except Exception:
        print(json.dumps({"reply": "I’m here with you. Could you share a bit more?"}))

if __name__ == "__main__":
    main()
