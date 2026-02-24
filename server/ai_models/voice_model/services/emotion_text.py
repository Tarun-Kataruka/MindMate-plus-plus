from transformers import pipeline

_zsc = pipeline(
    "zero-shot-classification",
    model="MoritzLaurer/multilingual-MiniLMv2-L6-mnli-xnli",
)

_CANDIDATE_LABELS = [
    "joy", "love", "sadness", "anger", "fear",
    "anxiety", "surprise", "disgust", "neutral",
]

# Suicidal keywords (English + Hindi + Kannada) 
SUICIDAL_KEYWORDS = {
    # English
    "suicide", "dying", "suicidal", "kill myself", "end my life",
    "end it all", "don't want to live", "don't want to be alive",
    "don't feel like living", "want to die", "wanna die",
    "no reason to live", "better off dead", "not worth living",
    "take my own life", "self-harm", "self harm", "hurt myself",
    "cutting myself",
    # Hindi
    "आत्महत्या", "मरना चाहता हूँ", "मरना चाहती हूँ",
    "जीना नहीं चाहता", "जीना नहीं चाहती", "मर जाना चाहता हूँ",
    "मर जाना चाहती हूँ", "खुद को मारना", "जीने का कोई कारण नहीं",
    "मौत चाहिए", "खुद को नुकसान", "जिंदगी खत्म",
    # Kannada
    "ಆತ್ಮಹತ್ಯೆ", "ಸಾಯಬೇಕು", "ಬದುಕಲು ಇಷ್ಟವಿಲ್ಲ",
    "ನನ್ನನ್ನು ಕೊಲ್ಲಬೇಕು", "ಬದುಕು ಬೇಡ",
}

# Despair phrases (English + Hindi + Kannada)
DESPAIR_PHRASES = {
    # English
    "no hope", "give up", "can't go on", "pointless",
    "worthless", "hopeless",
    # Hindi
    "कोई उम्मीद नहीं", "हार मान", "बेकार", "निराशा",
    "कोई आशा नहीं", "जीवन व्यर्थ",
    # Kannada
    "ನಿರಾಶೆ", "ಯಾವುದೇ ಭರವಸೆ ಇಲ್ಲ", "ಬಿಟ್ಟುಬಿಡು",
}

# Loss keywords (English + Hindi + Kannada) 
LOSS_KEYWORDS = {
    # English
    "died", "death", "passed away", "passed-on", "passed on",
    "funeral", "loss", "grief", "lost my", "heartbroken", "bereavement",
    # Hindi
    "मृत्यु", "गुजर गए", "गुजर गयी", "अंतिम संस्कार",
    "खो दिया", "दुख", "शोक", "दिल टूट गया",
    # Kannada
    "ಮರಣ", "ಸತ್ತರು", "ಕಳೆದುಕೊಂಡೆ", "ದುಃಖ", "ಅಂತ್ಯಸಂಸ್ಕಾರ",
}


def classify_emotion(text: str) -> str:
    """Return a coarse emotion label; works on Hindi, Kannada, English, etc."""
    if not text or not text.strip():
        return "Neutral"

    text_l = text.lower()

    # Suicidal detection (highest priority) 
    if any(kw in text_l for kw in SUICIDAL_KEYWORDS):
        return "Suicidal"

    #  Zero-shot multilingual emotion classification
    result = _zsc(text, _CANDIDATE_LABELS, multi_label=False)
    label_scores = dict(zip(result["labels"], result["scores"]))

    best_label = result["labels"][0]
    best_score = result["scores"][0]

    # Very high sadness + despair phrasing → Suicidal
    if best_label == "sadness" and best_score >= 0.75:
        if any(p in text_l for p in DESPAIR_PHRASES):
            return "Suicidal"

    # Strong sadness → Depressed
    if best_label == "sadness" and best_score >= 0.55:
        return "Depressed"

    # Loss-related keywords → sad
    if any(kw in text_l for kw in LOSS_KEYWORDS):
        return "sad"

    # Negative emotions above threshold → sad
    for lbl in ("sadness", "disgust", "anger", "fear", "anxiety"):
        if label_scores.get(lbl, 0) >= 0.35:
            return "sad"

    emotion_map = {
        "joy": "happy",
        "love": "happy",
        "neutral": "neutral",
        "sadness": "sad",
        "disgust": "sad",
        "anger": "sad",
        "fear": "sad",
        "anxiety": "sad",
        "surprise": "sad",
    }

    return emotion_map.get(best_label, "neutral")
