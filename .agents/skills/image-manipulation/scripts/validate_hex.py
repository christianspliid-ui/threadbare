#!/usr/bin/env python3
"""
Hex Validation & Visual Comparison — Validate clipped hex tiles and create comparison images.

Usage:
    python validate_hex.py <image> [options]
    python validate_hex.py --batch <directory> [options]
    python validate_hex.py --compare <original> <clipped> <output>

Examples:
    # Validate a single clipped hex
    python validate_hex.py ocean_hex.png

    # Batch validate all PNGs in a directory
    python validate_hex.py --batch ./clipped/

    # Create side-by-side comparison on checkerboard background
    python validate_hex.py --compare original.png clipped.png comparison.png

Options:
    --batch          Validate all PNGs in directory
    --compare        Create visual comparison (original vs clipped on checkerboard)
    --shape SHAPE    Expected shape: hexagon (default), circle, octagon
    --tile-size N    Checkerboard tile size for comparison (default: 8)
    --verbose        Print detailed check results for each file
"""

import argparse
import glob
import os
import sys
import numpy as np
from PIL import Image


def validate_clipped_image(image_path, expected_shape="hexagon"):
    """
    Validate that an image was correctly clipped to shape.
    Returns dict of check results with a top-level 'pass' boolean.
    """
    img = Image.open(image_path).convert("RGBA")
    arr = np.array(img)
    w, h = img.size
    total = w * h

    checks = {}

    # 1. Format check
    checks["has_alpha"] = img.mode == "RGBA"

    # 2. Corner transparency
    corners = {
        "top_left": int(arr[0, 0, 3]),
        "top_right": int(arr[0, w-1, 3]),
        "bottom_left": int(arr[h-1, 0, 3]),
        "bottom_right": int(arr[h-1, w-1, 3]),
    }
    checks["corners_transparent"] = all(v == 0 for v in corners.values())
    checks["corner_values"] = corners

    # 3. Center opacity
    checks["center_opaque"] = int(arr[h//2, w//2, 3]) == 255

    # 4. Transparency ratio
    transparent = int(np.sum(arr[:,:,3] == 0))
    opaque = int(np.sum(arr[:,:,3] == 255))
    semi = total - transparent - opaque
    checks["transparent_pct"] = round(transparent / total * 100, 1)
    checks["opaque_pct"] = round(opaque / total * 100, 1)
    checks["antialiased_pixels"] = semi

    # Shape-specific ratio check
    if expected_shape == "hexagon":
        checks["ratio_in_range"] = 35 < checks["transparent_pct"] < 50

    # 5. White edge artifact detection
    margin_x, margin_y = max(1, w // 10), max(1, h // 10)
    edge_region = arr.copy()
    edge_region[margin_y:-margin_y, margin_x:-margin_x, :] = 0
    edge_opaque = (edge_region[:,:,3] > 200)
    if edge_opaque.any():
        edge_rgb = edge_region[edge_opaque][:, :3]
        pure_white = np.all(edge_rgb == 255, axis=1)
        checks["no_white_edge_artifacts"] = int(pure_white.sum()) == 0
        checks["white_edge_count"] = int(pure_white.sum())
    else:
        checks["no_white_edge_artifacts"] = True
        checks["white_edge_count"] = 0

    # 6. Summary
    checks["pass"] = all([
        checks["has_alpha"],
        checks["corners_transparent"],
        checks["center_opaque"],
        checks.get("ratio_in_range", True),
        checks["no_white_edge_artifacts"],
    ])

    return checks


def create_checker_comparison(original_path, clipped_path, output_path, tile_size=8):
    """Side-by-side comparison: original vs clipped on checkerboard background."""
    original = Image.open(original_path).convert("RGBA")
    clipped = Image.open(clipped_path).convert("RGBA")
    w, h = original.size

    # Create checkerboard using numpy (fast)
    checker_arr = np.zeros((h, w, 4), dtype=np.uint8)
    for y in range(h):
        for x in range(w):
            if (x // tile_size + y // tile_size) % 2 == 0:
                checker_arr[y, x] = [200, 200, 200, 255]
            else:
                checker_arr[y, x] = [240, 240, 240, 255]
    checker = Image.fromarray(checker_arr)

    # Composite clipped onto checkerboard
    preview = Image.alpha_composite(checker, clipped)

    # Side by side with dark separator
    combined = Image.new("RGBA", (w * 2 + 10, h), (40, 40, 40, 255))
    combined.paste(original, (0, 0))
    combined.paste(preview, (w + 10, 0))
    combined.save(output_path)
    print(f"Comparison saved: {output_path}")


def main():
    parser = argparse.ArgumentParser(description="Validate hex-clipped images")
    parser.add_argument("input", nargs="?", help="Image file or directory (with --batch)")
    parser.add_argument("--batch", action="store_true", help="Validate all PNGs in directory")
    parser.add_argument("--compare", nargs=3, metavar=("ORIGINAL", "CLIPPED", "OUTPUT"),
                        help="Create visual comparison")
    parser.add_argument("--shape", default="hexagon", help="Expected shape (default: hexagon)")
    parser.add_argument("--tile-size", type=int, default=8, help="Checkerboard tile size")
    parser.add_argument("--verbose", action="store_true", help="Print detailed results")

    args = parser.parse_args()

    if args.compare:
        create_checker_comparison(args.compare[0], args.compare[1], args.compare[2],
                                  tile_size=args.tile_size)
        return

    if not args.input:
        parser.print_help()
        sys.exit(1)

    if args.batch:
        pngs = sorted(glob.glob(os.path.join(args.input, "*.png")))
        passed = 0
        failed = 0
        failures = []

        for png in pngs:
            name = os.path.basename(png)
            checks = validate_clipped_image(png, args.shape)
            if checks["pass"]:
                passed += 1
                if args.verbose:
                    print(f"  PASS {name}: {checks['transparent_pct']}% transparent, "
                          f"{checks['antialiased_pixels']} AA pixels")
            else:
                failed += 1
                reasons = []
                if not checks["has_alpha"]: reasons.append("no alpha channel")
                if not checks["corners_transparent"]: reasons.append(f"opaque corners: {checks['corner_values']}")
                if not checks["center_opaque"]: reasons.append("center not opaque")
                if not checks.get("ratio_in_range", True):
                    reasons.append(f"transparency {checks['transparent_pct']}% out of range")
                if not checks["no_white_edge_artifacts"]:
                    reasons.append(f"{checks['white_edge_count']} white edge pixels")
                failures.append((name, reasons))
                print(f"  FAIL {name}: {'; '.join(reasons)}")

        print(f"\nValidated {len(pngs)} images: {passed} passed, {failed} failed")
    else:
        checks = validate_clipped_image(args.input, args.shape)
        status = "PASS" if checks["pass"] else "FAIL"
        print(f"{status}: {args.input}")
        if args.verbose or not checks["pass"]:
            for k, v in checks.items():
                if k != "pass":
                    print(f"  {k}: {v}")


if __name__ == "__main__":
    main()
