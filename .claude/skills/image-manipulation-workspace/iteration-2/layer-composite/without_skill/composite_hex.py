#!/usr/bin/env python3
"""
Composite hex tile with clipping.
1. Load ocean.png (with white bg + black border)
2. Clip to hex shape (flat-top, remove ~4px black border)
3. Composite onto green background (200x200, #2d5a1e)
4. Save output and timing info
"""

import json
import time
from pathlib import Path
from PIL import Image, ImageDraw
import math

def create_hex_mask(size: int, border_px: int = 4) -> Image.Image:
    """
    Create a hex mask image (flat-top orientation).

    Args:
        size: The dimension of the square mask (e.g., 200)
        border_px: pixels to exclude from edges (black border)

    Returns:
        Grayscale mask image with hex shape
    """
    mask = Image.new('L', (size, size), 0)  # Black background
    draw = ImageDraw.Draw(mask)

    # Flat-top hexagon: 6 vertices
    # Center at (size/2, size/2)
    # Radius from center to vertex
    center_x = size / 2
    center_y = size / 2

    # Adjust radius to account for border
    inner_radius = (size / 2) - border_px

    # For flat-top hex, angles are: 0°, 60°, 120°, 180°, 240°, 300°
    vertices = []
    for i in range(6):
        angle = math.radians(i * 60)
        x = center_x + inner_radius * math.cos(angle)
        y = center_y + inner_radius * math.sin(angle)
        vertices.append((x, y))

    # Draw filled polygon (white)
    draw.polygon(vertices, fill=255)

    return mask

def clip_hex_tile(hex_image_path: str, border_px: int = 4) -> Image.Image:
    """
    Load hex image and clip to hex shape, removing white corners and border.

    Args:
        hex_image_path: path to the hex tile (with white bg + black border)
        border_px: black border width to exclude

    Returns:
        RGBA image with hex shape (transparent corners)
    """
    img = Image.open(hex_image_path).convert('RGBA')

    # Resize to square (use larger dimension)
    max_dim = max(img.width, img.height)
    img_square = Image.new('RGBA', (max_dim, max_dim), (0, 0, 0, 0))
    # Center the original image in the square
    x_offset = (max_dim - img.width) // 2
    y_offset = (max_dim - img.height) // 2
    img_square.paste(img, (x_offset, y_offset), img)

    # Create hex mask
    mask = create_hex_mask(max_dim, border_px=border_px)

    # Apply mask: output is RGBA, use mask as alpha channel
    result = Image.new('RGBA', (max_dim, max_dim), (0, 0, 0, 0))
    result.paste(img_square, (0, 0), mask)

    return result

def composite_hex_on_green(hex_clipped: Image.Image, canvas_size: int = 200) -> Image.Image:
    """
    Composite clipped hex tile onto a green background canvas.

    Args:
        hex_clipped: RGBA image of clipped hex
        canvas_size: size of canvas (200x200)

    Returns:
        RGB image (composite result)
    """
    # Create green background canvas
    green_color = (45, 90, 30)  # #2d5a1e
    canvas = Image.new('RGB', (canvas_size, canvas_size), green_color)

    # Center the hex on the canvas
    # Assume hex_clipped is already square; center it
    hex_width, hex_height = hex_clipped.size
    x_offset = (canvas_size - hex_width) // 2
    y_offset = (canvas_size - hex_height) // 2

    # Paste hex onto canvas using its alpha channel
    canvas.paste(hex_clipped, (x_offset, y_offset), hex_clipped)

    return canvas

def main():
    start_time = time.time()

    # Paths
    source_hex = Path("/sessions/kind-sharp-knuth/mnt/TheFantasyWorldSimulator/Design/hex-crops-v2/ocean.png")
    output_dir = Path("/sessions/kind-sharp-knuth/mnt/TheFantasyWorldSimulator/skills/image-manipulation-workspace/iteration-2/layer-composite/without_skill/outputs")
    timing_file = Path("/sessions/kind-sharp-knuth/mnt/TheFantasyWorldSimulator/skills/image-manipulation-workspace/iteration-2/layer-composite/without_skill/timing.json")

    output_dir.mkdir(parents=True, exist_ok=True)
    timing_file.parent.mkdir(parents=True, exist_ok=True)

    # Process
    print(f"Loading hex tile from {source_hex}...")
    hex_clipped = clip_hex_tile(str(source_hex), border_px=4)
    print(f"  Clipped to hex shape: {hex_clipped.size}")

    print(f"Compositing onto green background (200x200, #2d5a1e)...")
    composite = composite_hex_on_green(hex_clipped, canvas_size=200)

    # Save
    output_path = output_dir / "composite.png"
    composite.save(output_path, 'PNG')
    print(f"  Saved to {output_path}")

    # Timing
    duration_ms = (time.time() - start_time) * 1000
    duration_seconds = duration_ms / 1000

    timing_data = {
        "total_tokens": 0,
        "duration_ms": round(duration_ms, 2),
        "total_duration_seconds": round(duration_seconds, 2)
    }

    with open(timing_file, 'w') as f:
        json.dump(timing_data, f, indent=2)

    print(f"\nTiming: {duration_ms:.2f}ms ({duration_seconds:.2f}s)")
    print(f"Timing saved to {timing_file}")

if __name__ == '__main__':
    main()
