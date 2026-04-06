#!/usr/bin/env python3
"""Generate DZI (Deep Zoom Image) tiles from source images for OpenSeadragon."""

import math
import os
import sys
from PIL import Image

TILE_SIZE = 254
OVERLAP = 1
FORMAT = "jpg"
QUALITY = 85

Image.MAX_IMAGE_PIXELS = None


def generate_dzi(image_path, output_dir):
    name = os.path.splitext(os.path.basename(image_path))[0]
    dzi_dir = os.path.join(output_dir, f"{name}_files")
    dzi_file = os.path.join(output_dir, f"{name}.dzi")

    if os.path.exists(dzi_file):
        print(f"  Skipping {name} (already exists)")
        return

    print(f"  Processing {name}...")
    img = Image.open(image_path)
    if img.mode != "RGB":
        img = img.convert("RGB")
    width, height = img.size
    print(f"    Size: {width}x{height}")

    max_dim = max(width, height)
    max_level = int(math.ceil(math.log2(max_dim)))

    os.makedirs(dzi_dir, exist_ok=True)

    for level in range(max_level + 1):
        level_dir = os.path.join(dzi_dir, str(level))
        os.makedirs(level_dir, exist_ok=True)

        scale = 2 ** (level - max_level)
        level_width = int(math.ceil(width * scale))
        level_height = int(math.ceil(height * scale))

        if level_width < 1:
            level_width = 1
        if level_height < 1:
            level_height = 1

        level_img = img.resize((level_width, level_height), Image.LANCZOS)

        cols = int(math.ceil(level_width / TILE_SIZE))
        rows = int(math.ceil(level_height / TILE_SIZE))

        for col in range(cols):
            for row in range(rows):
                x1 = col * TILE_SIZE - (OVERLAP if col > 0 else 0)
                y1 = row * TILE_SIZE - (OVERLAP if row > 0 else 0)
                x2 = min((col + 1) * TILE_SIZE + OVERLAP, level_width)
                y2 = min((row + 1) * TILE_SIZE + OVERLAP, level_height)

                if x1 < 0:
                    x1 = 0
                if y1 < 0:
                    y1 = 0

                tile = level_img.crop((x1, y1, x2, y2))
                tile_path = os.path.join(level_dir, f"{col}_{row}.{FORMAT}")
                tile.save(tile_path, "JPEG", quality=QUALITY)

        level_img.close()

    dzi_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<Image xmlns="http://schemas.microsoft.com/deepzoom/2008"
       Format="{FORMAT}"
       Overlap="{OVERLAP}"
       TileSize="{TILE_SIZE}">
  <Size Width="{width}" Height="{height}"/>
</Image>"""

    with open(dzi_file, "w") as f:
        f.write(dzi_content)

    print(f"    Generated {max_level + 1} levels")
    img.close()


def main():
    images_dir = os.path.join(os.path.dirname(__file__), "images")
    tiles_dir = os.path.join(os.path.dirname(__file__), "tiles")
    os.makedirs(tiles_dir, exist_ok=True)

    image_files = sorted(
        f
        for f in os.listdir(images_dir)
        if f.lower().endswith((".jpg", ".jpeg", ".png"))
    )

    print(f"Found {len(image_files)} images to tile:\n")
    for img_file in image_files:
        img_path = os.path.join(images_dir, img_file)
        generate_dzi(img_path, tiles_dir)

    print("\nDone! Tiles saved to:", tiles_dir)


if __name__ == "__main__":
    main()
