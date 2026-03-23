#!/usr/bin/env python3
"""
Composite ocean hex tile onto green background.
1. Clip ocean.png to hexagon shape (removing white corners and black border)
2. Create 200x200 green background (#2d5a1e)
3. Center and composite the clipped hex onto the background
4. Validate and save output with timing info
"""

import json
import math
import time
from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np

# Timing tracking
timings = {}

def start_timer(name):
    """Start timing a section."""
    return {"name": name, "start": time.time()}

def end_timer(timer):
    """End timing and record."""
    elapsed = time.time() - timer["start"]
    timings[timer["name"]] = elapsed
    return elapsed

def clip_hex_to_polygon(source_path, inset=4, aa_scale=2):
    """
    Clip hex image to regular hexagon polygon.
    Returns clipped RGBA image.

    Assumptions:
    - source is flat-top hex (rotation=0)
    - source has ~4px black border to exclude
    - source is square (or nearly square)
    """
    timer = start_timer("clip_hex")

    img = Image.open(source_path).convert("RGBA")
    w, h = img.size

    # Center of polygon
    cx, cy = w // 2, h // 2

    # For flat-top hex inscribed in square:
    # radius = min(w, h) / 2
    radius = min(w, h) / 2
    r = radius - inset

    # Create high-res mask for anti-aliased edges
    mask_hires = Image.new("L", (w * aa_scale, h * aa_scale), 0)
    draw = ImageDraw.Draw(mask_hires)

    # rotation=0 for flat-top hex
    draw.regular_polygon(
        (cx * aa_scale, cy * aa_scale, r * aa_scale),
        6,  # hexagon
        rotation=0,  # flat-top
        fill=255
    )

    # Downscale with LANCZOS for smooth anti-aliased edges
    mask = mask_hires.resize((w, h), Image.LANCZOS)

    # Apply mask: paste source onto transparent canvas using mask
    result = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    result.paste(img, (0, 0), mask)

    elapsed = end_timer(timer)
    print(f"✓ Clipped hex to polygon ({w}x{h}) in {elapsed:.3f}s")

    return result

def create_green_background(width, height, color_hex="#2d5a1e"):
    """Create solid green background canvas."""
    timer = start_timer("create_background")

    # Parse hex color
    r = int(color_hex[1:3], 16)
    g = int(color_hex[3:5], 16)
    b = int(color_hex[5:7], 16)
    color = (r, g, b, 255)

    bg = Image.new("RGBA", (width, height), color)

    elapsed = end_timer(timer)
    print(f"✓ Created {width}x{height} green background in {elapsed:.3f}s")

    return bg

def composite_centered(background, overlay):
    """
    Composite overlay image centered on background.
    Uses overlay's alpha channel for transparency.
    """
    timer = start_timer("composite")

    bg_w, bg_h = background.size
    ovr_w, ovr_h = overlay.size

    # Calculate position to center overlay
    x = (bg_w - ovr_w) // 2
    y = (bg_h - ovr_h) // 2

    # Create result starting from background
    result = background.copy()

    # Alpha composite overlay onto result at position
    # Create a temporary canvas the size of result
    overlay_positioned = Image.new("RGBA", result.size, (0, 0, 0, 0))
    overlay_positioned.paste(overlay, (x, y), overlay)

    result = Image.alpha_composite(result, overlay_positioned)

    elapsed = end_timer(timer)
    print(f"✓ Composited overlay centered at ({x}, {y}) in {elapsed:.3f}s")

    return result

def validate_composite(image_path):
    """Validate composite output."""
    timer = start_timer("validate")

    img = Image.open(image_path).convert("RGBA")
    arr = np.array(img)
    w, h = img.size

    checks = {
        "format": img.format,
        "size": (w, h),
        "mode": img.mode,
        "has_alpha": img.mode == "RGBA",
    }

    # Spot check: verify we have opaque center (hex content)
    # and transparent corners (background showing through)
    center_pixel = arr[h // 2, w // 2]
    checks["center_alpha"] = int(center_pixel[3])

    # Check corners are green (not white, not transparent)
    corner_samples = {
        "top_left": tuple(arr[10, 10, :3]),
        "top_right": tuple(arr[10, w - 10, :3]),
        "bottom_left": tuple(arr[h - 10, 10, :3]),
        "bottom_right": tuple(arr[h - 10, w - 10, :3]),
    }
    checks["corner_colors"] = corner_samples

    # Verify green color is present
    green_expected = (45, 90, 30)  # #2d5a1e in RGB
    green_found = any(
        abs(c[0] - green_expected[0]) < 5 and
        abs(c[1] - green_expected[1]) < 5 and
        abs(c[2] - green_expected[2]) < 5
        for c in corner_samples.values()
    )
    checks["green_background_present"] = green_found

    elapsed = end_timer(timer)
    print(f"✓ Validated composite in {elapsed:.3f}s")

    return checks

def main():
    """Main execution."""
    start_time = time.time()

    # Paths
    source = "/sessions/kind-sharp-knuth/mnt/TheFantasyWorldSimulator/Design/hex-crops-v2/ocean.png"
    output = "/sessions/kind-sharp-knuth/mnt/TheFantasyWorldSimulator/skills/image-manipulation-workspace/iteration-3/layer-composite/with_skill/outputs/composite.png"
    timing_file = "/sessions/kind-sharp-knuth/mnt/TheFantasyWorldSimulator/skills/image-manipulation-workspace/iteration-3/layer-composite/with_skill/timing.json"

    print("\n=== Hex Clipping & Compositing ===\n")

    # Step 1: Clip ocean hex to polygon
    clipped_hex = clip_hex_to_polygon(source, inset=4, aa_scale=2)

    # Step 2: Create green background (200x200)
    background = create_green_background(200, 200, "#2d5a1e")

    # Step 3: Composite clipped hex centered on background
    composite = composite_centered(background, clipped_hex)

    # Step 4: Save output
    timer = start_timer("save")
    composite.save(output, "PNG")
    elapsed = end_timer(timer)
    print(f"✓ Saved composite to {output} in {elapsed:.3f}s")

    # Step 5: Validate
    validation = validate_composite(output)
    print(f"\nValidation results:")
    for key, val in validation.items():
        print(f"  {key}: {val}")

    # Step 6: Write timing info
    timer = start_timer("write_timing")
    total_time = time.time() - start_time
    timings["total"] = total_time

    with open(timing_file, "w") as f:
        json.dump(timings, f, indent=2)

    end_timer(timer)
    print(f"\n✓ Timing info written to {timing_file}")
    print(f"\nTotal execution time: {total_time:.3f}s")
    print("=" * 40 + "\n")

if __name__ == "__main__":
    main()
