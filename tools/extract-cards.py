#!/usr/bin/env python3
"""Regenerate assets/cards/*.webp from your own copy of the Fabula for Kids DIY card PDF.

The card art is Sefirot's and is not committed to this repository (see CLAUDE.md §11).
Run this once, against the PDF you own, before the app will show card faces.

    pip install pypdf pillow
    python3 tools/extract-cards.py path/to/EN_FabulaforKids_DigitalCards.pdf

Emits 34 WebP faces at 760px wide, ids per docs/card-inventory.md.
"""
import sys, os
from pypdf import PdfReader
from PIL import Image
import io

# page_imageindex -> stable asset id
MAP = {
    "p1_0": "divider-prompts", "p1_1": "prompt-s",  "p1_2": "idea",       "p1_3": "prompt-p",
    "p2_0": "prompt-n",        "p2_1": "prompt-q",  "p2_2": "prompt-g",   "p2_3": "prompt-m",
    "p3_0": "ing-hero",        "p3_1": "ing-world", "p3_2": "divider-ingredients", "p3_3": "ing-villain",
    "p4_0": "divider-structure", "p4_1": "beat-2",  "p4_2": "ing-event",  "p4_3": "beat-1",
    "p5_0": "beat-4",          "p5_1": "beat-6",    "p5_2": "beat-3",     "p5_3": "beat-5",
    "p6_0": "beat-8",          "p6_1": "divider-boosts", "p6_2": "beat-7", "p6_3": "beat-9",
    "p7_0": "boost-narrator",  "p7_1": "boost-despair",  "p7_2": "boost-too-easy", "p7_3": "boost-care",
    "p8_0": "boost-help",      "p8_1": "boost-background", "p8_2": "boost-twist",  "p8_3": "boost-learn",
    "p9_0": "boost-faults",    "p9_1": "boost-why-villain",
}
WIDTH = 760
QUALITY = 80
OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "cards")


def main(pdf_path):
    os.makedirs(OUT, exist_ok=True)
    reader = PdfReader(pdf_path)
    written = 0
    for page_no, page in enumerate(reader.pages, start=1):
        for idx, image in enumerate(page.images):
            key = f"p{page_no}_{idx}"
            name = MAP.get(key)
            if not name:
                print(f"  skip {key}: not in the id map", file=sys.stderr)
                continue
            im = Image.open(io.BytesIO(image.data)).convert("RGB")
            im = im.resize((WIDTH, round(im.height * WIDTH / im.width)), Image.LANCZOS)
            im.save(os.path.join(OUT, f"{name}.webp"), "WEBP", quality=QUALITY, method=6)
            written += 1
    missing = set(MAP.values()) - {f[:-5] for f in os.listdir(OUT) if f.endswith(".webp")}
    if missing:
        sys.exit(f"missing {len(missing)} faces: {sorted(missing)}")
    print(f"wrote {written} faces to assets/cards/")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
