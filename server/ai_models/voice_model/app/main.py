"""Command-line entry point for the voice analyzer."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

_PACKAGE_ROOT = Path(__file__).resolve().parents[1]
if str(_PACKAGE_ROOT) not in sys.path:
	sys.path.insert(0, str(_PACKAGE_ROOT))

from services.asr_service import transcribe_audio
from services.emotion_text import classify_emotion


def _analyze_file(audio_path: Path) -> tuple[str, str]:
	"""Return the transcript and emotion for the provided audio file."""
	audio_bytes = audio_path.read_bytes()
	transcript = transcribe_audio(audio_bytes).strip()
	emotion = classify_emotion(transcript)
	return transcript, emotion


def _run_for_path(path_str: str) -> bool:
	path = Path(path_str).expanduser()
	if not path.exists():
		print(f"[!] File not found: {path}")
		return False

	print(f"\nAnalyzing {path} ...")
	transcript, emotion = _analyze_file(path)

	if transcript:
		print("Transcript:\n" + transcript)
	else:
		print("Transcript: <empty>")

	print(f"Detected emotion: {emotion}\n")
	return True


def main() -> None:
	parser = argparse.ArgumentParser(
		description="Analyze an audio file and print the transcript + emotion."
	)
	parser.add_argument(
		"audio",
		nargs="?",
		help="Path to the audio file (wav/mp3/m4a). If omitted you will be prompted.",
	)
	args = parser.parse_args()

	try:
		if args.audio:
			if not _run_for_path(args.audio):
				raise SystemExit(1)
			return

		while True:
			try:
				user_input = input("Audio file path (press Enter to quit): ").strip()
			except EOFError:
				print()
				break

			if not user_input:
				break

			_run_for_path(user_input)

	except KeyboardInterrupt:
		print("\nCancelled by user.")


if __name__ == "__main__":
	main()
