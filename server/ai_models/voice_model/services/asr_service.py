import whisper
import tempfile
import os

model = whisper.load_model("small")


def _infer_suffix(audio_bytes: bytes) -> str:
    """Infer a likely container extension from magic bytes."""
    if len(audio_bytes) >= 12 and audio_bytes[:4] == b"RIFF" and audio_bytes[8:12] == b"WAVE":
        return ".wav"
    if audio_bytes.startswith(b"\x1aE\xdf\xa3"):
        return ".webm"
    if len(audio_bytes) >= 8 and audio_bytes[4:8] == b"ftyp":
        return ".m4a"
    if audio_bytes.startswith(b"ID3") or audio_bytes[:2] == b"\xff\xfb":
        return ".mp3"
    if audio_bytes.startswith(b"OggS"):
        return ".ogg"
    return ".bin"

def transcribe_audio(audio_bytes: bytes) -> dict:
    """Transcribe audio in its original language (no translation).

    Returns a dict with keys:
        text     – transcribed text in the spoken language
        language – ISO-639-1 code detected by Whisper (e.g. 'Hindi', 'Kannada', 'English')
    """
    suffix = _infer_suffix(audio_bytes)
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as f:
        f.write(audio_bytes)
        temp_path = f.name

    try:
        # task="transcribe" keeps original language – faster than translating
        result = model.transcribe(temp_path, task="transcribe")
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

    return {"text": result["text"], "language": result.get("language", "en")}
