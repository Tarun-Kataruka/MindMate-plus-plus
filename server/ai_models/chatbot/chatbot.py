import google.generativeai as genai
import os
from dotenv import load_dotenv


env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path=env_path)
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

model = genai.GenerativeModel("gemini-1.5-flash") if api_key else None

system_prompt = """
You are MindMate++, a compassionate and emotionally intelligent mental wellness companion.
Your goal is to create a safe, non-judgmental space where users can share what’s on their mind.
You listen deeply, validate feelings, and respond like a supportive friend who genuinely cares.

Your tone is warm, calm, and hopeful — always human and natural.
Keep your replies short (2 to 4 sentences), conversational, and emotionally aware.
Use everyday language, not formal or clinical terms.

Guidelines:
- Show empathy first: acknowledge and validate what the user feels.
- Offer gentle reflections or small, practical coping ideas (like pausing, journaling, or deep breathing).
- Encourage self-kindness and small steps toward calm or clarity.
- Never give medical or diagnostic advice.
- If a message shows deep distress, respond compassionately and encourage reaching out to someone trustworthy or a professional helpline.

Your goal is to sound like a caring friend who helps users feel seen, supported, and a little lighter after talking.
"""


def generate_reply(user_input: str, history: list | None = None) -> str:
    history = history or []
    prompt = system_prompt + "\n\nConversation:\n"
    for msg in history[-5:]:
        prompt += f"User: {msg['user']}\nMindMate++: {msg['bot']}\n"
    prompt += f"User: {user_input}\nMindMate++:"

    if not model:
        return "I’m here with you. Configure GEMINI_API_KEY to enable AI replies."

    response = model.generate_content(prompt)
    return (getattr(response, 'text', None) or '').strip()


if __name__ == '__main__':
    print("Welcome to MindMate++ — your mental wellness companion")
    print("Type 'exit' anytime to end the chat.\n")

    chat_history = []
    while True:
        user_input = input("You: ").strip()
        if user_input.lower() in ["exit", "quit", "bye"]:
            print("MindMate++: Take care of yourself ❤️  Remember, small steps matter.\n")
            break
        try:
            reply = generate_reply(user_input, chat_history)
            print("MindMate++:", reply, "\n")
            chat_history.append({"user": user_input, "bot": reply})
        except Exception:
            print("MindMate++: Don't worry, I'm having trouble responding right now.")
        
