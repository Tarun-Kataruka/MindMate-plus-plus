import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("Error: GEMINI_API_KEY not found in environment variables!")
    print("Please check your .env file.")
    exit(1)

genai.configure(api_key=api_key)
print("API key loaded successfully")

model = genai.GenerativeModel("gemini-2.5-flash")

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

print("🧘 Welcome to MindMate++ — your mental wellness companion 💬")
print("Type 'exit' anytime to end the chat.\n")

chat_history = []

while True:
    user_input = input("You: ").strip()
    if user_input.lower() in ["exit", "quit", "bye"]:
        print("MindMate++: Take care of yourself ❤️  Remember, small steps matter.\n")
        break

    prompt = system_prompt + "\n\nConversation:\n"
    for msg in chat_history[-5:]:  # keep recent 5 exchanges
        prompt += f"User: {msg['user']}\nMindMate++: {msg['bot']}\n"
    prompt += f"User: {user_input}\nMindMate++:"

    try:
        response = model.generate_content(prompt)
        reply = response.text.strip()
        print("MindMate++:", reply, "\n")

        chat_history.append({"user": user_input, "bot": reply})

    except Exception as e:
        print(f"MindMate++: Don't worry I'm here but right now I'm having trouble responding.")
        
