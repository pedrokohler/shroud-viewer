#!/usr/bin/env python3
"""Build og-share.jpg (1200x630) for Open Graph / WhatsApp from the face source image."""

import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "images", "shroud-face-hires.jpg")
OUT = os.path.join(ROOT, "og-share.jpg")
TARGET_W, TARGET_H = 1200, 630


def main():
    if not os.path.isfile(SRC):
        print("Missing:", SRC, file=sys.stderr)
        sys.exit(1)
    ratio = TARGET_W / TARGET_H
    im = Image.open(SRC).convert("RGB")
    w, h = im.size
    src_ratio = w / h
    if src_ratio > ratio:
        new_w = int(h * ratio)
        left = (w - new_w) // 2
        im = im.crop((left, 0, left + new_w, h))
    else:
        new_h = int(w / ratio)
        top = (h - new_h) // 2
        im = im.crop((0, top, w, top + new_h))
    im = im.resize((TARGET_W, TARGET_H), Image.LANCZOS)
    im.save(OUT, "JPEG", quality=82, optimize=True)
    print("Wrote", OUT, os.path.getsize(OUT), "bytes")


if __name__ == "__main__":
    main()
