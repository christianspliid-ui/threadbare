#!/usr/bin/env python3
"""
Batch hex tile clipper: removes white corners and black border.
Converts each 120x104 flat-top hexagon PNG to transparent background with just the hexagon.
"""

import os
import sys
import json
from pathlib import Path
from PIL import Image, ImageDraw
import time
import math

def create_hex_mask(width, height):
    """
    Create a flat-top hexagon mask for 120x104 images.
    Flat-top means flat top and bottom edges.
    """
    mask = Image.new('L', (width, height), 0)
    draw = ImageDraw.Draw(mask)

    # For a flat-top hexagon centered in a 120x104 canvas:
    # Calculate the hexagon points
    cx = width / 2
    cy = height / 2

    # For flat-top hexagon: top and bottom are horizontal
    # The hexagon fits reasonably well in the 120x104 space
    # Approximate vertices for a flat-top hexagon
    radius = min(width, height) / 2 * 0.95

    points = []
    for i in range(6):
        # Flat-top: 0° is at top-right, angles go: 0°, 60°, 120°, 180°, 240°, 300°
        # For flat-top: start at 0° (east), go counterclockwise
        angle = i * 60 * math.pi / 180
        x = cx + radius * math.cos(angle)
        y = cy + radius * math.sin(angle)
        points.append((x, y))

    # Draw filled polygon
    draw.polygon(points, fill=255)
    return mask

def clip_hex_tile(input_path, output_path):
    """
    Load a hex tile PNG and clip it to just the hexagon on transparent background.
    """
    try:
        # Open the image
        img = Image.open(input_path)

        # Ensure RGBA mode for transparency
        if img.mode != 'RGBA':
            img = img.convert('RGBA')

        width, height = img.size

        # Create hex mask
        mask = create_hex_mask(width, height)

        # Create new image with transparent background
        result = Image.new('RGBA', (width, height), (0, 0, 0, 0))

        # Apply mask: use the mask as alpha channel
        # Get the image data and mask data
        img_data = img.split()

        # Create new alpha channel by multiplying existing alpha with mask
        if len(img_data) == 4:
            # Already has alpha
            alpha = img_data[3]
        else:
            # No alpha, create one from white/non-white
            alpha = Image.new('L', (width, height), 255)

        # Combine alpha with hexagon mask
        final_alpha = Image.new('L', (width, height), 0)
        final_alpha.paste(Image.new('L', (width, height), 0), (0, 0))

        # Apply mask to alpha channel
        alpha_array = alpha.tobytes()
        mask_array = mask.tobytes()

        # Create new alpha by multiplying
        new_alpha_data = []
        for a, m in zip(alpha_array, mask_array):
            new_alpha_data.append(int(a * (m / 255)))

        new_alpha = Image.new('L', (width, height))
        new_alpha.putdata(new_alpha_data)

        # Paste the RGB data with new alpha
        result.putalpha(new_alpha)

        # Copy RGB data but keep only hexagon area
        rgb_data = img.convert('RGB')
        result.paste(rgb_data, (0, 0), mask)

        # Save the result
        result.save(output_path, 'PNG', optimize=False)
        return True

    except Exception as e:
        print(f"Error processing {input_path}: {e}")
        return False

def main():
    source_dir = "/sessions/kind-sharp-knuth/mnt/TheFantasyWorldSimulator/Design/hex-crops-v2"
    output_dir = "/sessions/kind-sharp-knuth/mnt/TheFantasyWorldSimulator/skills/image-manipulation-workspace/iteration-3/batch-hex-clip/without_skill/outputs"
    timing_file = "/sessions/kind-sharp-knuth/mnt/TheFantasyWorldSimulator/skills/image-manipulation-workspace/iteration-3/batch-hex-clip/without_skill/timing.json"

    # Collect all PNG files
    png_files = sorted([f for f in os.listdir(source_dir) if f.endswith('.png')])

    print(f"Found {len(png_files)} PNG files to process")

    start_time = time.time()
    processed = 0
    failed = 0
    file_timings = {}

    for i, filename in enumerate(png_files, 1):
        input_path = os.path.join(source_dir, filename)
        output_path = os.path.join(output_dir, filename)

        file_start = time.time()
        success = clip_hex_tile(input_path, output_path)
        file_elapsed = time.time() - file_start

        if success:
            processed += 1
            file_timings[filename] = file_elapsed
            status = "✓"
        else:
            failed += 1
            status = "✗"

        print(f"[{i}/{len(png_files)}] {status} {filename} ({file_elapsed:.2f}s)")

    total_time = time.time() - start_time

    # Write timing info
    timing_data = {
        "total_files": len(png_files),
        "processed": processed,
        "failed": failed,
        "total_time_seconds": total_time,
        "average_time_per_file": total_time / len(png_files) if png_files else 0,
        "per_file_timings": file_timings
    }

    os.makedirs(os.path.dirname(timing_file), exist_ok=True)
    with open(timing_file, 'w') as f:
        json.dump(timing_data, f, indent=2)

    print(f"\nProcessing complete!")
    print(f"Total: {processed}/{len(png_files)} files processed in {total_time:.2f}s")
    print(f"Timing info saved to {timing_file}")

    return 0 if failed == 0 else 1

if __name__ == '__main__':
    sys.exit(main())
