import json
import subprocess
from pathlib import Path

import whisperx
import torch


YOUTUBE_URL = "https://www.youtube.com/watch?v=Jqt2yvDEgFE"

# -----------------------------
# 1. Download audio as mp3
# -----------------------------

video_id = YOUTUBE_URL.split("v=")[-1].split("&")[0]
output_dir = Path(__file__).parent / "songs" / video_id
output_dir.mkdir(exist_ok=True)

audio_path = output_dir / "audio.m4a"

download_cmd = [
    "yt-dlp",
    "-x",
    "--audio-format",
    "m4a",
    "--audio-quality",
    "0",
    "-o",
    str(output_dir / "audio.%(ext)s"),
    YOUTUBE_URL,
]

if not audio_path.exists():
    subprocess.run(download_cmd, check=True)
    print(f"Downloaded audio to: {audio_path}")
else:
    print(f"Audio already exists, skipping download: {audio_path}")


# -----------------------------
# 2. Load WhisperX
# -----------------------------

device = "cpu"

batch_size = 16

model = whisperx.load_model(
    "large-v3",
    device,
    compute_type="int8",
)

# -----------------------------
# 3. Transcribe
# -----------------------------

audio = whisperx.load_audio(str(audio_path))

result = model.transcribe(
    audio,
    batch_size=batch_size,
)

print("Detected language:", result["language"])

# -----------------------------
# 4. Word-level alignment
# -----------------------------

model_a, metadata = whisperx.load_align_model(
    language_code=result["language"],
    device=device,
)

aligned_result = whisperx.align(
    result["segments"],
    model_a,
    metadata,
    audio,
    device,
)

# -----------------------------
# 5. Convert to your format
# -----------------------------

words_output = []

word_segments = aligned_result["word_segments"]

for i, word_data in enumerate(word_segments):
    word = word_data.get("word", "").strip()

    if not word:
        continue

    start_ms = int(word_data["start"] * 1000)

    if i < len(word_segments) - 1:
        next_start_ms = int(word_segments[i + 1]["start"] * 1000)
        duration_ms = max(50, next_start_ms - start_ms)
    else:
        duration_ms = int(
            (word_data["end"] - word_data["start"]) * 1000
        )

    words_output.append({
        "word": word.lower(),
        "offset": start_ms,
        "duration": duration_ms,
    })

# -----------------------------
# 6. Final JSON
# -----------------------------

final_output = {
    "title": "Generated Song",
    "spotifyTrackId": "",
    "words": words_output,
}

output_file = output_dir / "lyrics.json"

with open(output_file, "w", encoding="utf-8") as f:
    json.dump(final_output, f, indent=2)

print(f"\nSaved aligned lyrics to:\n{output_file}")
