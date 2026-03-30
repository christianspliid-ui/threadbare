#!/usr/bin/env python3
"""
Clip a flat-top hexagonal tile image to a clean hex shape with transparency.

Flat-top hex geometry (for a 120x104px image):
- Width: 120px
- Height: 104px
- Exclude ~4px black border
- Create a perfect flat-top hexagon with alpha transparency outside
"""

import json
import time
from pathlib import Path
from PIL import Image, ImageDraw
import math

def create_flat_top_hex_mask(width, height, border_px=4):
    """
    Create a flat-top hexagon mask.

    A flat-top hexagon has:
    - Flat edges on top and bottom
    - Pointy edges on left and right
    - 6 vertices equally spaced around a circle

    Args:
        width: Image width in pixels
        height: Image height in pixels
        border_px: Border to exclude in pixels

    Returns:
        List of (x, y) tuples forming the hex polygon
    """
    # Center of the image
    cx = width / 2
    cy = height / 2

    # Effective radius (accounting for border)
    # For a 120x104 hex with 4px border, we use inner dimensions
    inner_width = width - (2 * border_px)
    inner_height = height - (2 * border_px)

    # For a flat-top hex:
    # - Width = 2 * radius
    # - Height = radius * sqrt(3)
    # Compute radius from the available space
    radius = min(inner_width / 2, inner_height / math.sqrt(3))

    # Flat-top hex vertices (starting from top-left, going clockwise)
    # Angles: 120°, 60°, 0°, -60°, -120°, 180° (from center)
    angles = [120, 60, 0, -60, -120, 180]

    vertices = []
    for angle in angles:
        rad = math.radians(angle)
        x = cx + radius * math.cos(rad)
        y = cy + radius * math.sin(rad)
        vertices.append((x, y))

    return vertices

def clip_image_to_hex(input_path, output_path, border_px=4):
    """
    Clip an image to a flat-top hexagon shape with transparency outside.

    Args:
        input_path: Path to input image
        output_path: Path to save clipped image
        border_px: Border pixels to exclude

    Returns:
        Dictionary with validation results
    """
    # Load the image
    img = Image.open(input_path).convert('RGBA')
    width, height = img.size

    print(f"Source image: {width}x{height}px")
    print(f"Border to exclude: {border_px}px on each side")

    # Create hex mask
    vertices = create_flat_top_hex_mask(width, height, border_px)
    print(f"Hex vertices computed: {len(vertices)} points")

    # Create alpha mask (transparent background)
    mask = Image.new('L', (width, height), 0)  # Black = transparent
    draw = ImageDraw.Draw(mask)

    # Draw filled polygon on mask (white = opaque)
    draw.polygon(vertices, fill=255)

    # Apply mask to image
    img.putalpha(mask)

    # Save output
    img.save(output_path, 'PNG')

    return {
        'input_path': str(input_path),
        'output_path': str(output_path),
        'input_size': {'width': width, 'height': height},
        'border_excluded_px': border_px,
        'hex_vertices_count': len(vertices),
        'vertices': [(round(x, 2), round(y, 2)) for x, y in vertices],
        'output_format': 'PNG with alpha channel',
        'status': 'success'
    }

if __name__ == '__main__':
    start_time = time.time()

    input_file = Path('/sessions/kind-sharp-knuth/mnt/TheFantasyWorldSimulator/Design/hex-crops-v2/ocean.png')
    output_file = Path('/sessions/kind-sharp-knuth/mnt/TheFantasyWorldSimulator/skills/image-manipulation-workspace/iteration-3/single-hex-clip/without_skill/outputs/ocean_clipped.png')
    validation_file = Path('/sessions/kind-sharp-knuth/mnt/TheFantasyWorldSimulator/skills/image-manipulation-workspace/iteration-3/single-hex-clip/without_skill/outputs/validation.json')
    timing_file = Path('/sessions/kind-sharp-knuth/mnt/TheFantasyWorldSimulator/skills/image-manipulation-workspace/iteration-3/single-hex-clip/without_skill/timing.json')

    print("=" * 60)
    print("FLAT-TOP HEX CLIPPER")
    print("=" * 60)

    # Perform clipping
    result = clip_image_to_hex(input_file, output_file, border_px=4)

    # Save validation results
    with open(validation_file, 'w') as f:
        json.dump(result, f, indent=2)

    # Compute timing
    elapsed = time.time() - start_time
    timing_info = {
        'operation': 'hex_clipping',
        'input_file': str(input_file),
        'output_file': str(output_file),
        'elapsed_seconds': round(elapsed, 4),
        'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
    }

    with open(timing_file, 'w') as f:
        json.dump(timing_info, f, indent=2)

    print("\n" + "=" * 60)
    print("RESULTS")
    print("=" * 60)
    print(f"✓ Input: {input_file}")
    print(f"✓ Output: {output_file}")
    print(f"✓ Validation: {validation_file}")
    print(f"✓ Timing: {timing_file}")
    print(f"\nElapsed: {elapsed:.4f}s")
    print("\nValidation details:")
    for key, value in result.items():
        if key != 'vertices':
            print(f"  {key}: {value}")
    print("\n" + "=" * 60)
