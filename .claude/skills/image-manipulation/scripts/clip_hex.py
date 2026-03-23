#!/usr/bin/env python3
"""
Hex Clip Pipeline — Clip rectangular PNGs to hexagonal shape with transparent background.

Usage:
    python clip_hex.py <input> <output> [options]
    python clip_hex.py --batch <input_dir> <output_dir> [options]

Examples:
    # Single file — flat-top hex with border removal (defaults)
    python clip_hex.py ocean.png ocean_hex.png

    # Batch process all PNGs in a directory
    python clip_hex.py --batch ./source_pngs/ ./clipped/ --validate

    # Custom hex geometry
    python clip_hex.py tile.png tile_hex.png --radius 54 --inset 4

Options:
    --radius R       Hex radius in pixels (default: auto-detect from image width)
    --rotation DEG   Rotation in degrees: 0=flat-top (default), 30=pointy-top.
                     IMPORTANT: In Pillow, rotation=0 means flat edge at top.
    --inset PX       Pixels to shrink inward to exclude borders (default: 4)
    --aa-scale N     Supersampling factor for anti-aliased edges (default: 2)
    --batch          Process all PNGs in input directory
    --validate       Run validation checks on output
    --suffix S       Suffix for batch output files (default: _hex)
"""

import argparse
import glob
import math
import os
import sys
import numpy as np
from PIL import Image, ImageDraw


def create_hex_mask(width, height, center=None, radius=None, rotation=0, inset=0, aa_scale=2):
    """
    Create a hexagonal alpha mask.

    Args:
        width, height: Image dimensions
        center: (cx, cy) or None for image center
        radius: Hex radius or None for auto (half of width)
        rotation: 0 for flat-top (default), 30 for pointy-top.
                  Pillow convention: rotation=0 puts first vertex at right (3 o'clock),
                  giving flat edges at top and bottom = flat-top hex.
        inset: Pixels to shrink polygon inward
        aa_scale: Supersampling factor (2 or 4)

    Returns:
        PIL Image in mode "L" (grayscale mask)
    """
    if center is None:
        center = (width / 2, height / 2)
    if radius is None:
        radius = width / 2

    cx, cy = center
    r = radius - inset

    # Draw at higher resolution for anti-aliased edges
    mask_hires = Image.new("L", (width * aa_scale, height * aa_scale), 0)
    draw = ImageDraw.Draw(mask_hires)
    draw.regular_polygon(
        (cx * aa_scale, cy * aa_scale, r * aa_scale),
        6,
        rotation=rotation,
        fill=255
    )

    # Downscale with LANCZOS for smooth edges
    mask = mask_hires.resize((width, height), Image.LANCZOS)
    return mask


def clip_to_hex(source_path, output_path, center=None, radius=None, rotation=0, inset=4, aa_scale=2):
    """
    Clip an image to a hexagonal shape with transparent background.

    Args:
        rotation: 0 for flat-top (default), 30 for pointy-top
        inset: Border inset in pixels (default: 4 to exclude typical hex borders)

    Returns the clipped PIL Image.
    """
    img = Image.open(source_path).convert("RGBA")
    w, h = img.size

    mask = create_hex_mask(w, h, center=center, radius=radius, rotation=rotation, inset=inset, aa_scale=aa_scale)

    result = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    result.paste(img, (0, 0), mask)
    result.save(output_path)
    return result


def validate_hex(image_path):
    """
    Validate that an image was correctly clipped to hexagonal shape.
    Returns (passed: bool, details: dict).
    """
    img = Image.open(image_path).convert("RGBA")
    arr = np.array(img)
    w, h = img.size
    total = w * h

    checks = {}

    # Corners must be transparent
    corners = {
        "TL": int(arr[0, 0, 3]),
        "TR": int(arr[0, w-1, 3]),
        "BL": int(arr[h-1, 0, 3]),
        "BR": int(arr[h-1, w-1, 3]),
    }
    checks["corners_transparent"] = all(v == 0 for v in corners.values())

    # Center must be opaque
    checks["center_opaque"] = int(arr[h//2, w//2, 3]) == 255

    # Transparency ratio (hexagon in rectangle ≈ 39-45% transparent)
    transparent_pct = np.sum(arr[:,:,3] == 0) / total * 100
    checks["transparent_pct"] = round(transparent_pct, 1)
    checks["ratio_ok"] = 35 < transparent_pct < 50

    # No PURE white artifacts near edges (background remnants)
    margin_x, margin_y = max(1, w // 10), max(1, h // 10)
    edge_mask = np.ones((h, w), dtype=bool)
    edge_mask[margin_y:-margin_y, margin_x:-margin_x] = False
    edge_opaque = edge_mask & (arr[:,:,3] > 200)
    if edge_opaque.any():
        edge_rgb = arr[edge_opaque][:, :3]
        # Pure white = all channels == 255 (exact #ffffff background)
        pure_white = np.all(edge_rgb == 255, axis=1)
        white_count = int(pure_white.sum())
    else:
        white_count = 0
    checks["white_edge_artifacts"] = white_count

    passed = (
        checks["corners_transparent"] and
        checks["center_opaque"] and
        checks["ratio_ok"] and
        white_count == 0
    )

    return passed, checks


def main():
    parser = argparse.ArgumentParser(description="Clip images to hexagonal shape")
    parser.add_argument("input", help="Input file or directory (with --batch)")
    parser.add_argument("output", help="Output file or directory (with --batch)")
    parser.add_argument("--radius", type=float, default=None, help="Hex radius (default: auto)")
    parser.add_argument("--rotation", type=float, default=0, help="Rotation degrees: 0=flat-top (default), 30=pointy-top")
    parser.add_argument("--inset", type=float, default=4, help="Border inset pixels (default: 4)")
    parser.add_argument("--aa-scale", type=int, default=2, help="Anti-alias supersampling")
    parser.add_argument("--batch", action="store_true", help="Batch process directory")
    parser.add_argument("--validate", action="store_true", help="Validate output")
    parser.add_argument("--suffix", default="_hex", help="Batch output suffix")

    args = parser.parse_args()

    if args.batch:
        os.makedirs(args.output, exist_ok=True)
        pngs = sorted(glob.glob(os.path.join(args.input, "*.png")))
        print(f"Processing {len(pngs)} PNGs...")

        passed = 0
        failed = 0
        for png in pngs:
            name = os.path.splitext(os.path.basename(png))[0]
            out = os.path.join(args.output, f"{name}{args.suffix}.png")
            clip_to_hex(png, out, radius=args.radius, rotation=args.rotation,
                       inset=args.inset, aa_scale=args.aa_scale)

            if args.validate:
                ok, checks = validate_hex(out)
                status = "PASS" if ok else "FAIL"
                if ok:
                    passed += 1
                else:
                    failed += 1
                    reasons = []
                    if not checks["corners_transparent"]: reasons.append("opaque corners")
                    if not checks["center_opaque"]: reasons.append("center not opaque")
                    if not checks["ratio_ok"]: reasons.append(f"transparency {checks['transparent_pct']}%")
                    if checks["white_edge_artifacts"]: reasons.append(f"{checks['white_edge_artifacts']} white edge px")
                    print(f"  {status} {name}: {'; '.join(reasons)}")
            else:
                print(f"  {name}")

        if args.validate:
            print(f"\nResults: {passed} passed, {failed} failed out of {len(pngs)}")
    else:
        clip_to_hex(args.input, args.output, radius=args.radius, rotation=args.rotation,
                   inset=args.inset, aa_scale=args.aa_scale)
        print(f"Clipped: {args.input} → {args.output}")

        if args.validate:
            ok, checks = validate_hex(args.output)
            print(f"Validation: {'PASS' if ok else 'FAIL'}")
            for k, v in checks.items():
                print(f"  {k}: {v}")


if __name__ == "__main__":
    main()
