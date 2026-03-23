#!/usr/bin/env python3
"""
Composite hex tile onto green background with hex clipping.

Procedure:
1. Load ocean.png
2. Create a flat-top hex mask (excluding ~4px border)
3. Apply mask to remove white corners and black border
4. Composite onto 200x200 green (#2d5a1e) background, centered
5. Save composite.png + timing.json
"""

import time
import json
import math
from PIL import Image, ImageDraw

def create_hex_polygon(width, height, border_px=4):
    """
    Create a flat-top hexagon polygon coordinates.

    Flat-top hex has vertices at angles: 0°, 60°, 120°, 180°, 240°, 300°.
    We'll use the image bounds minus border to define the hex.

    Args:
        width: image width (pixels)
        height: image height (pixels)
        border_px: border to exclude from edges

    Returns:
        List of (x, y) tuples for hexagon vertices
    """
    # Effective dimensions after border removal
    eff_width = width - (2 * border_px)
    eff_height = height - (2 * border_px)

    # Center in the effective area
    cx = border_px + eff_width / 2
    cy = border_px + eff_height / 2

    # For a flat-top hex:
    # - Horizontal width = distance between leftmost and rightmost vertices
    # - Vertical height = distance between top and bottom vertices
    # We'll scale to fit within the effective dimensions

    # For flat-top hex: width/height ratio ≈ sqrt(3) ≈ 1.732
    # So if we want to fit in eff_width x eff_height:
    radius = min(eff_width / 2, eff_height / math.sqrt(3) / 2)

    # Flat-top hex vertices (6 vertices at 60° intervals starting from 0°)
    angles = [0, 60, 120, 180, 240, 300]
    polygon = []
    for angle_deg in angles:
        angle_rad = math.radians(angle_deg)
        x = cx + radius * math.cos(angle_rad)
        y = cy + radius * math.sin(angle_rad)
        polygon.append((x, y))

    return polygon

def hex_clip_and_composite():
    """Main execution function."""
    start_time = time.time()

    # Load source image
    load_start = time.time()
    source_path = "/sessions/kind-sharp-knuth/mnt/TheFantasyWorldSimulator/Design/hex-crops-v2/ocean.png"
    source_img = Image.open(source_path).convert("RGBA")
    load_time = time.time() - load_start

    src_width, src_height = source_img.size
    print(f"Loaded {source_path}: {src_width}x{src_height}")

    # Create hex mask on source image
    mask_start = time.time()
    mask = Image.new("L", (src_width, src_height), 0)  # Black mask
    mask_draw = ImageDraw.Draw(mask)

    hex_polygon = create_hex_polygon(src_width, src_height, border_px=4)
    mask_draw.polygon(hex_polygon, fill=255)  # White interior = visible
    mask_time = time.time() - mask_start
    print(f"Hex mask created in {mask_time:.3f}s")

    # Apply mask to source (clip to hex)
    clip_start = time.time()
    clipped = Image.new("RGBA", source_img.size, (0, 0, 0, 0))
    clipped.paste(source_img, (0, 0), mask)
    clip_time = time.time() - clip_start
    print(f"Hex clipped in {clip_time:.3f}s")

    # Create 200x200 green background
    bg_start = time.time()
    green_color = (0x2d, 0x5a, 0x1e, 0xff)  # #2d5a1e with full alpha
    background = Image.new("RGBA", (200, 200), green_color)
    bg_time = time.time() - bg_start

    # Calculate centered position for clipped hex on 200x200 canvas
    x_offset = (200 - src_width) // 2
    y_offset = (200 - src_height) // 2

    # Composite clipped hex onto green background
    composite_start = time.time()
    background.paste(clipped, (x_offset, y_offset), clipped)
    composite_time = time.time() - composite_start
    print(f"Composite pasted in {composite_time:.3f}s at offset ({x_offset}, {y_offset})")

    # Save output
    save_start = time.time()
    output_path = "/sessions/kind-sharp-knuth/mnt/TheFantasyWorldSimulator/skills/image-manipulation-workspace/iteration-3/layer-composite/without_skill/outputs/composite.png"
    background.save(output_path, "PNG")
    save_time = time.time() - save_start
    print(f"Saved to {output_path} in {save_time:.3f}s")

    total_time = time.time() - start_time

    # Write timing info
    timing_data = {
        "total_ms": total_time * 1000,
        "breakdown_ms": {
            "load": load_time * 1000,
            "mask": mask_time * 1000,
            "clip": clip_time * 1000,
            "bg_create": bg_time * 1000,
            "composite": composite_time * 1000,
            "save": save_time * 1000
        },
        "source_image": {
            "path": source_path,
            "dimensions": f"{src_width}x{src_height}"
        },
        "output": {
            "path": output_path,
            "dimensions": "200x200",
            "background_color": "#2d5a1e",
            "hex_offset": [x_offset, y_offset]
        }
    }

    timing_path = "/sessions/kind-sharp-knuth/mnt/TheFantasyWorldSimulator/skills/image-manipulation-workspace/iteration-3/layer-composite/without_skill/timing.json"
    with open(timing_path, "w") as f:
        json.dump(timing_data, f, indent=2)
    print(f"Timing written to {timing_path}")

    print(f"\nTotal time: {total_time:.3f}s ({total_time*1000:.1f}ms)")

if __name__ == "__main__":
    hex_clip_and_composite()
