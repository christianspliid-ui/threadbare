#!/usr/bin/env python3
"""
Hex Tile Generator Pipeline
Generates terrain art via Imagen API → applies hexagonal mask → saves to game assets.

Usage:
  # Single biome:
  python scripts/generate-hex-tile.py --biome "dense forest" --color "#2a3a20"

  # All built-in biomes at once:
  python scripts/generate-hex-tile.py --batch

  # Custom prompt:
  python scripts/generate-hex-tile.py --prompt "custom prompt here" --output Assets/biomes/custom.png
"""

import argparse
import base64
import io
import math
import os
import sys
import time
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# Default output size (square, will be hex-masked)
TILE_SIZE = 1024

# How much of the image the hex inscribes (0.0-1.0)
# 1.0 = hex touches edges, 0.95 = small margin for anti-aliasing
HEX_INSET = 0.98

# Feather radius in pixels for soft hex edge
FEATHER_PX = 6

# API config
MODEL = "gemini-3.1-flash-image-preview"
API_KEY_ENV = "NANOBANANANA_API_KEY"

# ---------------------------------------------------------------------------
# Biome registry — single source of truth for batch mode
# ---------------------------------------------------------------------------

BIOME_REGISTRY = {
    "dense forest":   {"color": "#2a3a20", "features": "Ancient broadleaf and conifer trees with visible trunks and rich canopy, rocky outcrops peeking through gaps between the trees."},
    "open grassland": {"color": "#4a4a2a", "features": "A low rocky rise with scattered dark boulders and clumps of dry scrub brush on bare golden-brown earth. Tufts of tall grass grow between the rocks. No trees."},
    "mountain":       {"color": "#3a3a3a", "features": "Jagged grey-brown rock ridges and dark ravines. Patches of scree and shadow-filled crevices. Snow dusts the highest points."},
    "desert":         {"color": "#5a4a2a", "features": "Rolling sand dunes in burnt umber and dark amber. Wind-carved ripple patterns. Scattered dark rocky outcrops break through the sand."},
    "tundra":         {"color": "#3a4a5a", "features": "Frozen ground with dark lichen patches and frost-heaved stones. Muted grey-blue tones. Low scrub bushes in dark clusters."},
    "swamp":          {"color": "#2a3a1a", "features": "Dark waterlogged terrain with twisted dead trees and murky pools. Moss-covered hummocks. Deep olive-brown palette throughout."},
    "volcanic":       {"color": "#3a2020", "features": "Cracked obsidian plains with dark ash dunes. Hardened lava flows create dark ridged patterns. Faint orange-red glow in deep cracks."},
    "glacier":        {"color": "#2a3a4a", "features": "Blue-white ice sheets with dark crevasses cutting through. Pressure ridges create shadow patterns. Scattered dark rocks frozen into the surface."},
    "coast":          {"color": "#3a3a2a", "features": "Dark sandy shore meeting deep grey-blue water. Scattered dark rocks and tidal pools. Kelp beds visible as dark patches in shallow water."},
}

# ---------------------------------------------------------------------------
# Hex mask generation
# ---------------------------------------------------------------------------

def make_hex_mask(size: int, inset: float = HEX_INSET, feather: int = FEATHER_PX) -> Image.Image:
    """
    Create a flat-top hexagonal alpha mask.
    Returns an 'L' mode image: white inside hex, black outside, feathered edge.
    """
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)

    cx, cy = size / 2, size / 2
    # Flat-top hex: vertex at 0°, 60°, 120°, etc.
    r = (size / 2) * inset
    points = []
    for i in range(6):
        angle_deg = 60 * i  # flat-top orientation
        angle_rad = math.radians(angle_deg)
        px = cx + r * math.cos(angle_rad)
        py = cy + r * math.sin(angle_rad)
        points.append((px, py))

    draw.polygon(points, fill=255)

    # Feather the edges with a slight blur
    if feather > 0:
        mask = mask.filter(ImageFilter.GaussianBlur(radius=feather))
        # Re-threshold to keep interior fully opaque
        # Pixels > 200 → 255, below 50 → 0, between → gradient
        mask = mask.point(lambda p: min(255, max(0, int((p - 50) * 255 / 150))))

    return mask


def apply_hex_mask(img: Image.Image, mask: Image.Image) -> Image.Image:
    """Apply hex mask to image, returning RGBA with transparent outside."""
    img = img.convert("RGBA")
    # Resize mask to match image if needed
    if mask.size != img.size:
        mask = mask.resize(img.size, Image.LANCZOS)
    img.putalpha(mask)
    return img


# ---------------------------------------------------------------------------
# Prompt construction
# ---------------------------------------------------------------------------

def build_prompt(biome: str, bg_color: str, features: str | None = None) -> str:
    """Build the hex terrain prompt using circular composition with painterly depth."""
    feat = features or BIOME_REGISTRY.get(biome.lower(), {}).get("features", f"Naturalistic {biome} terrain features.")

    return f"""A circular island of {biome} terrain in the center of the image, painted in dark fantasy oil painting style. {feat} The terrain forms a dense round cluster in the center of the composition, roughly circular in shape. The surrounding area is flat, featureless ground in the biome's base color ({bg_color}), filling the rest of the image. The terrain features are concentrated in the center and fade to bare ground well before reaching the image edges.

Slightly elevated three-quarter view, painterly depth with visible tree trunks and terrain texture. Rich dimensional brushwork, thick impasto oil paint. Dark moody atmosphere, dim overcast lighting. Muted desaturated palette.

No magic, no glowing elements, no luminous effects. No text, no UI, no labels, no hexagonal shapes or hex borders, no modern elements. No rivers, no streams, no water features that would need to connect across tile boundaries. No paths or roads that lead to edges."""


# ---------------------------------------------------------------------------
# Image generation via Gemini API
# ---------------------------------------------------------------------------

def generate_image(prompt: str, api_key: str) -> Image.Image:
    """Call Gemini API to generate an image, return as PIL Image."""
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)

    response = client.models.generate_content(
        model=MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_modalities=["IMAGE", "TEXT"],
        ),
    )

    # Extract image from response
    for part in response.candidates[0].content.parts:
        if part.inline_data is not None:
            img_bytes = part.inline_data.data
            return Image.open(io.BytesIO(img_bytes))

    raise RuntimeError("No image returned from API. Response: " + str(response))


# ---------------------------------------------------------------------------
# Single tile pipeline
# ---------------------------------------------------------------------------

def generate_tile(biome: str, color: str, features: str | None, prompt_override: str | None,
                  output: Path | None, size: int, no_mask: bool, raw_also: bool, api_key: str) -> str:
    """Generate a single hex tile. Returns output path."""

    # Build prompt
    if prompt_override:
        prompt = prompt_override
        biome_slug = "custom"
    else:
        prompt = build_prompt(biome, color, features)
        biome_slug = biome.lower().replace(" ", "-")

    # Output path
    if output:
        out_path = Path(output)
    else:
        out_path = Path(__file__).parent.parent / "Assets" / "biomes" / f"{biome_slug}.png"

    out_path.parent.mkdir(parents=True, exist_ok=True)

    print(f"Generating: {biome or 'custom'}")
    print(f"Prompt ({len(prompt)} chars):")
    print(f"  {prompt[:120]}...")
    print()

    # Generate
    print("Calling Imagen API...")
    raw_img = generate_image(prompt, api_key)
    print(f"  Got {raw_img.size[0]}x{raw_img.size[1]} image")

    # Center-crop to square, then resize to target
    w, h = raw_img.size
    if w != h:
        side = min(w, h)
        left = (w - side) // 2
        top = (h - side) // 2
        raw_img = raw_img.crop((left, top, left + side, top + side))
        print(f"  Cropped to {side}x{side} (center)")
    if raw_img.size != (size, size):
        raw_img = raw_img.resize((size, size), Image.LANCZOS)

    # Save raw if requested
    if raw_also:
        raw_path = out_path.with_stem(out_path.stem + "-raw")
        raw_img.save(raw_path, "PNG")
        print(f"  Raw saved: {raw_path}")

    # Apply hex mask
    if not no_mask:
        print("Applying hex mask...")
        mask = make_hex_mask(size)
        result = apply_hex_mask(raw_img, mask)
    else:
        result = raw_img

    # Save
    result.save(out_path, "PNG")
    print(f"  Saved: {out_path}")
    print("Done!")
    print()

    return str(out_path)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Generate hex-masked terrain tiles")
    parser.add_argument("--biome", type=str, help="Biome name (e.g. 'dense forest')")
    parser.add_argument("--color", type=str, default=None, help="Background hex color (default: from registry)")
    parser.add_argument("--features", type=str, help="Custom terrain feature description")
    parser.add_argument("--prompt", type=str, help="Full custom prompt (overrides biome/features)")
    parser.add_argument("--output", type=str, help="Output path (default: Assets/biomes/<biome>.png)")
    parser.add_argument("--size", type=int, default=TILE_SIZE, help="Output image size in px")
    parser.add_argument("--no-mask", action="store_true", help="Skip hex masking (save square)")
    parser.add_argument("--raw-also", action="store_true", help="Also save the raw unmasked image")
    parser.add_argument("--batch", action="store_true", help="Generate all built-in biomes")
    parser.add_argument("--batch-delay", type=float, default=5.0, help="Seconds between API calls in batch mode (default: 5)")

    args = parser.parse_args()

    # Validate
    if not args.batch and not args.biome and not args.prompt:
        parser.error("Provide --biome, --prompt, or --batch")

    # API key
    api_key = os.environ.get(API_KEY_ENV)
    if not api_key:
        # Try loading from .env
        env_path = Path(__file__).parent.parent / ".env"
        if env_path.exists():
            for line in env_path.read_text().splitlines():
                if line.startswith(API_KEY_ENV):
                    api_key = line.split("=", 1)[1].strip()
                    break
    if not api_key:
        print(f"Error: {API_KEY_ENV} not found in environment or .env", file=sys.stderr)
        sys.exit(1)

    if args.batch:
        # Batch mode — generate all biomes
        biomes = list(BIOME_REGISTRY.keys())
        total = len(biomes)
        print(f"=== BATCH MODE: generating {total} biomes ===")
        print(f"Delay between API calls: {args.batch_delay}s")
        print()

        results = []
        failures = []

        for i, biome in enumerate(biomes, 1):
            info = BIOME_REGISTRY[biome]
            print(f"--- [{i}/{total}] {biome} ---")

            try:
                path = generate_tile(
                    biome=biome,
                    color=info["color"],
                    features=info["features"],
                    prompt_override=None,
                    output=None,
                    size=args.size,
                    no_mask=args.no_mask,
                    raw_also=args.raw_also,
                    api_key=api_key,
                )
                results.append((biome, path))
            except Exception as e:
                print(f"  ERROR: {e}")
                failures.append((biome, str(e)))

            # Delay between calls to avoid rate limits
            if i < total:
                print(f"  Waiting {args.batch_delay}s before next biome...")
                time.sleep(args.batch_delay)

        # Summary
        print()
        print(f"=== BATCH COMPLETE ===")
        print(f"  Success: {len(results)}/{total}")
        for biome, path in results:
            print(f"    ✓ {biome} → {path}")
        if failures:
            print(f"  Failed: {len(failures)}/{total}")
            for biome, err in failures:
                print(f"    ✗ {biome}: {err}")

    else:
        # Single mode
        color = args.color or BIOME_REGISTRY.get(args.biome, {}).get("color", "#2a3a20")
        generate_tile(
            biome=args.biome,
            color=color,
            features=args.features,
            prompt_override=args.prompt,
            output=args.output,
            size=args.size,
            no_mask=args.no_mask,
            raw_also=args.raw_also,
            api_key=api_key,
        )


if __name__ == "__main__":
    main()
