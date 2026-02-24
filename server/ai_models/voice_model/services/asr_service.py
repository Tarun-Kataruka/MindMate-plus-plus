import whisper
import tempfile
import os

model = whisper.load_model("small")

def transcribe_audio(audio_bytes: bytes) -> dict:
    """Transcribe audio in its original language (no translation).

    Returns a dict with keys:
        text     – transcribed text in the spoken language
        language – ISO-639-1 code detected by Whisper (e.g. 'Hindi', 'Kannada', 'English')
    """
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as f:
        f.write(audio_bytes)
        temp_path = f.name

    # task="transcribe" keeps original language – faster than translating
    result = model.transcribe(temp_path, task="transcribe")
    os.remove(temp_path)

    return {"text": result["text"], "language": result.get("language", "en")}
