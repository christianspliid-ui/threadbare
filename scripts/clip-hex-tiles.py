#!/usr/bin/env python3
"""
Clip hex tile PNGs to hexagon shape with transparent background.
- Input: 120x104 PNG files with white corners and black border
- Output: Clipped hexagon with transparent background
"""

import os
import sys
import json
import time
from pathlib import Path
from PIL import Image, ImageDraw
import math

# Configuration
INPUT_DIR = "/sessions/kind-sharp-knuth/mnt/TheFantasyWorldSimulator/Design/hex-crops-v2/"
OUTPUT_DIR = "/sessions/kind-sharp-knuth/mnt/TheFantasyWorldSimulator/skills/image-manipulation-workspace/iteration-2/batch-hex-clip/without_skill/outputs/"
TIMING_FILE = "/sessions/kind-sharp-knuth/mnt/TheFantasyWorldSimulator/skills/image-manipulation-workspace/iteration-2/batch-hex-clip/without_skill/timing.json"

# Hex dimensions
HEX_WIDTH = 120
HEX_HEIGHT = 104

def create_hexagon_mask(width, height):
    """
    Create a hexagon mask for flat-top hexagon.
    For a 120x104 flat-top hex:
    - Width: 120
    - Height: 104
    - Center: (60, 52)
    - Vertices form a flat-top hexagon
    """
    mask = Image.new('L', (width, height), 0)
    draw = ImageDraw.Draw(mask)

    # Center point
    cx = width / 2
    cy = height / 2

    # For a flat-top hexagon:
    # - Top and bottom edges are flat
    # - There are 6 vertices
    # Calculate vertices based on the 120x104 bounding box

    # Flat-top hexagon vertices (clockwise from top-left)
    # The hexagon should fill the space efficiently
    w = width / 2
    h = height / 2

    # For flat-top: sides are at angles 0°, 60°, 120°, 180°, 240°, 300°
    # Starting from top-right, going clockwise
    vertices = [
        (cx + w * 0.5, cy - h),          # Top-right
        (cx + w, cy - h * 0.5),          # Right-top
        (cx + w, cy + h * 0.5),          # Right-bottom
        (cx + w * 0.5, cy + h),          # Bottom-right
        (cx - w * 0.5, cy + h),          # Bottom-left
        (cx - w, cy + h * 0.5),          # Left-bottom
        (cx - w, cy - h * 0.5),          # Left-top
        (cx - w * 0.5, cy - h),          # Top-left
    ]

    draw.polygon(vertices, fill=255)
    return mask

def process_hex_tile(input_path, output_path):
    """
    Load PNG, create hexagon mask, apply mask, save with transparency.
    Returns (success: bool, error: str or None)
    """
    try:
        # Load image
        img = Image.open(input_path)

        # Convert to RGBA if needed
        if img.mode != 'RGBA':
            img = img.convert('RGBA')

        # Create hexagon mask
        mask = create_hexagon_mask(img.width, img.height)

        # Apply mask to alpha channel
        img.putalpha(mask)

        # Save result
        img.save(output_path, 'PNG')

        return True, None
    except Exception as e:
        return False, str(e)

def main():
    start_time = time.time()

    # Find all PNG files
    png_files = sorted([f for f in os.listdir(INPUT_DIR) if f.endswith('.png')])

    print(f"Found {len(png_files)} PNG files to process")

    success_count = 0
    error_count = 0
    errors = []

    for i, filename in enumerate(png_files, 1):
        input_path = os.path.join(INPUT_DIR, filename)
        output_path = os.path.join(OUTPUT_DIR, filename)

        success, error = process_hex_tile(input_path, output_path)

        if success:
            success_count += 1
            print(f"[{i:2d}/{len(png_files)}] ✓ {filename}")
        else:
            error_count += 1
            errors.append({"file": filename, "error": error})
            print(f"[{i:2d}/{len(png_files)}] ✗ {filename}: {error}")

    duration_ms = (time.time() - start_time) * 1000

    print("\n" + "=" * 60)
    print(f"Processing complete: {success_count} succeeded, {error_count} failed")
    print(f"Total time: {duration_ms:.1f}ms ({duration_ms/1000:.2f}s)")

    # Write timing file
    timing_data = {
        "total_tokens": 0,
        "duration_ms": round(duration_ms, 1),
        "total_duration_seconds": round(duration_ms / 1000, 2),
        "files_processed": success_count,
        "files_failed": error_count,
        "errors": errors if errors else []
    }

    os.makedirs(os.path.dirname(TIMING_FILE), exist_ok=True)
    with open(TIMING_FILE, 'w') as f:
        json.dump(timing_data, f, indent=2)

    print(f"Timing written to {TIMING_FILE}")

    # Validate outputs
    print("\nValidating outputs...")
    validation_errors = []
    for filename in png_files:
        output_path = os.path.join(OUTPUT_DIR, filename)
        if not os.path.exists(output_path):
            validation_errors.append(f"Missing: {filename}")
        else:
            try:
                img = Image.open(output_path)
                if img.mode != 'RGBA':
                    validation_errors.append(f"{filename}: Not RGBA mode")
                elif img.size != (HEX_WIDTH, HEX_HEIGHT):
                    validation_errors.append(f"{filename}: Wrong dimensions {img.size}")
            except Exception as e:
                validation_errors.append(f"{filename}: {str(e)}")

    if validation_errors:
        print(f"Validation issues found ({len(validation_errors)}):")
        for err in validation_errors[:10]:  # Show first 10
            print(f"  - {err}")
        if len(validation_errors) > 10:
            print(f"  ... and {len(validation_errors) - 10} more")
    else:
        print(f"✓ All {success_count} outputs validated successfully")

    return 0 if error_count == 0 else 1

if __name__ == '__main__':
    sys.exit(main())
