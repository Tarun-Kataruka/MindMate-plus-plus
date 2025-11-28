import os, json, base64, mimetypes
from datetime import datetime, timedelta, time
from typing import List, Dict, Any, Tuple, Optional
import google.generativeai as genai
from dotenv import load_dotenv

def dt(s: str) -> datetime:
    return datetime.fromisoformat(s.replace("Z", "+00:00"))

def iso(d: datetime) -> str:
    return d.replace(microsecond=0).isoformat()

def parse_hm(hm: str) -> time:
    h, m = hm.split(":")
    return time(int(h), int(m))

def hours_between(start, end):
    s, e = parse_hm(start), parse_hm(end)
    today = datetime.today().date()
    sdt, edt = datetime.combine(today, s), datetime.combine(today, e)
    if edt <= sdt: edt += timedelta(days=1)
    return (edt - sdt).seconds / 3600

def no_overlap(items):
    segs = sorted(((dt(i["startISO"]), dt(i["endISO"])) for i in items))
    return all(a[1] <= b[0] for a, b in zip(segs, segs[1:]))

def hours_per_day_ok(items, cap):
    days = {}
    for it in items:
        if it["type"] == "break": continue
        hrs = (dt(it["endISO"]) - dt(it["startISO"])).total_seconds() / 3600
        day = iso(dt(it["startISO"]))[:10]
        days[day] = days.get(day, 0) + hrs
    return all(h <= cap for h in days.values())


FIXED_BREAKS = [
    ("Lunch Break", 13, 14),
    ("Snack Break", 17, 18),
    ("Dinner Break", 20, 21),
]

def required_breaks(avail):
    days = avail.get("days", 1)
    start = datetime.fromisoformat(avail.get("start_date", iso(datetime.now()))).date()
    day_start_time = parse_hm(avail.get("daily_start", "09:00"))
    day_end_time = parse_hm(avail.get("daily_end", "17:00"))

    out = []
    for i in range(days):
        for title, sh, eh in FIXED_BREAKS:
            day_date = start + timedelta(days=i)
            window_start = datetime.combine(day_date, day_start_time)
            window_end = datetime.combine(day_date, day_end_time)
            if window_end <= window_start:
                window_end += timedelta(days=1)

            brk_start = datetime.combine(day_date, time(sh))
            brk_end = datetime.combine(day_date, time(eh))
            if brk_end <= brk_start:
                brk_end += timedelta(days=1)
            if brk_start < window_start:
                brk_start += timedelta(days=1)
                brk_end += timedelta(days=1)

            if window_start <= brk_start and brk_end <= window_end:
                out.append({
                    "title": title,
                    "start": brk_start,
                    "end": brk_end,
                })
    return out

def fixed_breaks_ok(items, avail):
    need = required_breaks(avail)
    for n in need:
        match = any(
            i["type"]=="break" and
            abs((dt(i["startISO"])-n["start"]).total_seconds())<120
            for i in items
        )
        if not match: return False
    return True


def validate_plan(items, avail):
    for it in items:
        if dt(it["startISO"]) >= dt(it["endISO"]): return False
        if it["type"] not in ("study", "revision", "break"): return False

    if not no_overlap(items): return False
    if not hours_per_day_ok(items, avail["max_hours_per_day"]): return False

    # only 60 or 120 min allowed
    for it in items:
        if it["type"] in ("study", "revision"):
            mins = (dt(it["endISO"]) - dt(it["startISO"])).seconds/60
            if mins not in (60, 120): return False

    if not fixed_breaks_ok(items, avail): return False
    return True

def _get_gemini_model(env_var: str, default_name: str) -> genai.GenerativeModel:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not set; update server/.env or export it before running the planner.")
    genai.configure(api_key=api_key)
    model_name = os.getenv(env_var, default_name)
    return genai.GenerativeModel(model_name)


def build_prompt(subjects, exams, avail, prefs):
    rules = [
        'Return ONLY JSON: {"items":[...]}',
        "Fields: title, subjectName, startISO, endISO, type",
        "Study blocks must be 60 or 120 mins",
        "No overlaps",
        f"Max {avail['max_hours_per_day']} study hrs/day",
        "When the daily window includes them, reserve breaks at 13–14, 17–18, 20–21",
        "Never schedule study or revision during the required breaks",
        "Do not invent additional breaks unless the availability window excludes the fixed ones",
        "All sessions must start and end within the provided daily availability window",
        "Finish each subject ≥2 days before exam",
        "Breaks must have subjectName=''"
    ]

    return (
        "You are a strict study planner.\n"
        f"SUBJECTS: {json.dumps(subjects)}\n"
        f"EXAMS: {json.dumps(exams)}\n"
        f"AVAILABILITY: {json.dumps(avail)}\n"
        f"PREFERENCES: {json.dumps(prefs or {})}\n"
        "Rules:\n- " + "\n- ".join(rules) + "\n"
        "Output only JSON."
    )

def extract_exams_from_image(path: str):
    mime, _ = mimetypes.guess_type(path)
    if not mime: mime = "image/png"

    with open(path, "rb") as f:
        encoded = base64.b64encode(f.read()).decode()

    model = _get_gemini_model("GEMINI_VISION_MODEL", "gemini-2.5-flash")

    prompt = (
        'Extract exam dates as {"exams":[{"subject":"...","date":"YYYY-MM-DD"}]} ONLY.'
    )
    content = [{"text": prompt}, {"inline_data": {"mime_type": mime, "data": encoded}}]

    resp = model.generate_content(content)
    txt = resp.text

    s, e = txt.find("{"), txt.rfind("}")
    return json.loads(txt[s:e+1])["exams"]


def generate_plan(subjects, exams, avail, prefs=None, max_attempts: int = 3):
    model = _get_gemini_model("GEMINI_MODEL", "gemini-2.5-flash")
    prompt = build_prompt(subjects, exams, avail, prefs)

    last_error = None
    for attempt in range(1, max_attempts + 1):
        resp = model.generate_content(prompt)
        txt = resp.text
        s, e = txt.find("{"), txt.rfind("}")
        items = json.loads(txt[s:e+1])["items"]

        if validate_plan(items, avail):
            return items

        last_error = f"Attempt {attempt} failed validation"
        print(f"Warning: {last_error}; asking Gemini to regenerate.")
        prompt += "\nThe last plan violated the rules above. Regenerate strictly following every rule and output ONLY JSON."

    raise RuntimeError(
        "Gemini could not produce a valid schedule after "
        f"{max_attempts} attempts. Please tweak the inputs or try again."
    )


def _prompt_list(prompt: str) -> List[Dict[str, str]]:
    while True:
        raw = input(prompt).strip()
        parts = [p.strip() for p in raw.split(",") if p.strip()]
        if parts:
            return [{"name": p} for p in parts]
        print("Please enter at least one subject (comma separated).")


def _prompt_availability() -> Dict[str, Any]:
    wake = input("Daily start time (HH:MM, default 09:00): ").strip() or "09:00"
    sleep = input("Daily end time (HH:MM, default 17:00): ").strip() or "17:00"
    days_raw = input("How many days to plan? (default 1): ").strip()
    try:
        days = max(1, int(days_raw)) if days_raw else 1
    except ValueError:
        days = 1
    start_raw = input("Start date YYYY-MM-DD (default today): ").strip()
    if start_raw:
        start_iso = f"{start_raw}T00:00:00"
    else:
        start_iso = iso(datetime.now())
    max_hours = min(8.0, hours_between(wake, sleep))
    return {
        "days": days,
        "daily_start": wake,
        "daily_end": sleep,
        "start_date": start_iso,
        "max_hours_per_day": max_hours,
    }


def _prompt_exam_image() -> Optional[str]:
    path = input("Exam datesheet image path (press Enter to skip): ").strip()
    return path or None


def prompt_user_inputs() -> Tuple[List[Dict[str, str]], Dict[str, Any], Optional[str]]:
    subjects = _prompt_list("Subjects (comma separated): ")
    availability = _prompt_availability()
    exam_image = _prompt_exam_image()
    return subjects, availability, exam_image


def main():
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
    import argparse

    p = argparse.ArgumentParser(description="Gemini study planner")
    p.add_argument("--subjects", help='JSON list e.g. [{"name":"Math"}]')
    p.add_argument("--availability", help="JSON availability object")
    p.add_argument("--exam-image", help="Path to exam datesheet image (optional)")
    p.add_argument("--preferences", default="{}", help="JSON preferences")
    p.add_argument("--non-interactive", action="store_true", help="Require CLI args instead of prompting")
    args = p.parse_args()

    if args.subjects and args.availability:
        subjects = json.loads(args.subjects)
        availability = json.loads(args.availability)
        exam_image = args.exam_image
    elif args.non_interactive:
        p.error("--subjects and --availability are required in non-interactive mode")
    else:
        subjects, availability, exam_image = prompt_user_inputs()

    preferences = json.loads(args.preferences)

    if "start_date" not in availability:
        availability["start_date"] = iso(datetime.now())
    if "max_hours_per_day" not in availability:
        availability["max_hours_per_day"] = hours_between(
            availability["daily_start"],
            availability["daily_end"],
        )

    if exam_image:
        print("Extracting exams from image...")
        exams = extract_exams_from_image(exam_image)
    else:
        print("No exam datesheet supplied; continuing without exam constraints.")
        exams = []

    print("Generating plan...")
    items = generate_plan(subjects, exams, availability, preferences)

    print(json.dumps({"ok": True, "items": items}, indent=2))


if __name__ == "__main__":
    main()
