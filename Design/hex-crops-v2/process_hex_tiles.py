#!/usr/bin/env python3
"""
Process hex tile PNGs: clip to hexagon shape on transparent background.
Input: 120x104 flat-top hex PNGs with black border and white corners.
Output: Clipped PNGs with transparent background.
"""

from PIL import Image, ImageDraw
import os
from pathlib import Path

def create_hex_mask(width=120, height=104):
    """
    Create a mask for a flat-top hexagon that fits in a 120x104 bounding box.
    Flat-top hexagon: pointy vertices on left/right, flat edges on top/bottom.
    """
    mask = Image.new('L', (width, height), 0)
    draw = ImageDraw.Draw(mask)

    # For a flat-top hexagon in a 120x104 box:
    # The hexagon should be centered and scaled to fit without waste
    # Vertices (clockwise from top-middle):
    # Top point, top-right, bottom-right, bottom point, bottom-left, top-left

    # Calculate hexagon vertices for flat-top orientation
    # Center the hexagon in the 120x104 canvas
    center_x = width / 2
    center_y = height / 2

    # For a flat-top hex in this aspect ratio:
    # Width spans ~100px, height spans ~104px
    radius = 48  # circumradius for flat-top

    import math
    vertices = []
    for i in range(6):
        angle = math.pi / 3 * i  # 60-degree increments
        x = center_x + radius * math.cos(angle)
        y = center_y + radius * math.sin(angle)
        vertices.append((x, y))

    # Draw filled polygon
    draw.polygon(vertices, fill=255)

    return mask

def process_hex_tile(input_path, output_path):
    """
    Load a hex tile PNG, apply hexagon mask, save with transparent background.
    """
    try:
        # Open the image
        img = Image.open(input_path)

        # Ensure RGBA for transparency
        if img.mode != 'RGBA':
            img = img.convert('RGBA')

        # Create hexagon mask
        mask = create_hex_mask(img.width, img.height)

        # Apply mask to create transparency
        img.putalpha(mask)

        # Save
        img.save(output_path, 'PNG')
        return True
    except Exception as e:
        print(f"Error processing {input_path}: {e}")
        return False

def main():
    input_dir = Path('/sessions/kind-sharp-knuth/mnt/TheFantasyWorldSimulator/Design/hex-crops-v2')
    output_dir = Path('/sessions/kind-sharp-knuth/mnt/TheFantasyWorldSimulator/skills/image-manipulation-workspace/iteration-1/batch-hex-clip/without_skill/outputs')

    # Find all PNG files in input directory
    png_files = sorted(input_dir.glob('*.png'))

    # Filter to only the hex tile PNGs (exclude already-processed files)
    png_files = [f for f in png_files if not any(x in f.name for x in ['_fill', '_icon', '_test', '_tight', '_no_outline', '_nopalette'])]

    print(f"Found {len(png_files)} hex tile PNGs to process")

    success_count = 0
    for i, png_file in enumerate(png_files, 1):
        output_file = output_dir / png_file.name
        if process_hex_tile(str(png_file), str(output_file)):
            success_count += 1
            print(f"[{i}/{len(png_files)}] ✓ {png_file.name}")
        else:
            print(f"[{i}/{len(png_files)}] ✗ {png_file.name}")

    print(f"\nProcessed {success_count}/{len(png_files)} files successfully")

if __name__ == '__main__':
    main()
