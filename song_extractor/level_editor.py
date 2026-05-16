import json
import sys
from pathlib import Path


def set_durations(input_path: Path, duration: int = 1000) -> None:
    with open(input_path, encoding="utf-8") as f:
        data = json.load(f)

    for word in data["words"]:
        word["duration"] = duration

    output_path = input_path.parent / "lyrics_fixed.json"

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

    print(f"Saved to: {output_path}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python level_editor.py <path/to/lyrics.json> [duration_ms]")
        sys.exit(1)

    input_file = Path(sys.argv[1])
    duration_ms = int(sys.argv[2]) if len(sys.argv) > 2 else 1000

    set_durations(input_file, duration_ms)
