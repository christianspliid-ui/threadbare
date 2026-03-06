#!/usr/bin/env python3
"""
Hex Tile Generator Pipeline
Generates terrain art via Imagen API → applies hexagonal mask → saves to game assets.

Usage:
  python scripts/generate-hex-tile.py --biome "dense forest" --color "#2a3a20" --output Assets/biomes/dense-forest.png
  python scripts/generate-hex-tile.py --biome "volcanic waste" --color "#3a2020" --features "cracked obsidian, lava-crusted ridges, ash dunes"
  python scripts/generate-hex-tile.py --prompt "custom prompt here" --output Assets/biomes/custom.png
"""

import argparse
import base64
import io
import math
import os
import sys
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

DEFAULT_FEATURES = {
    "dense forest": "Ancient broadleaf and conifer trees with visible trunks and rich canopy, rocky outcrops peeking through gaps between the trees.",
    "open grassland": "Windswept grass plains with subtle ridge lines and scattered dark boulders. Faint animal trails curve through tall grass. Dry golden-brown tones.",
    "mountain": "Jagged grey-brown rock ridges and dark ravines. Patches of scree and shadow-filled crevices. Snow dusts the highest points.",
    "desert": "Rolling sand dunes in burnt umber and dark amber. Wind-carved ripple patterns. Scattered dark rocky outcrops break through the sand.",
    "tundra": "Frozen ground with dark lichen patches and frost-heaved stones. Muted grey-blue tones. Low scrub bushes in dark clusters.",
    "swamp": "Dark waterlogged terrain with twisted dead trees and murky pools. Moss-covered hummocks. Deep olive-brown palette throughout.",
    "volcanic": "Cracked obsidian plains with dark ash dunes. Hardened lava flows create dark ridged patterns. Faint orange-red glow in deep cracks.",
    "glacier": "Blue-white ice sheets with dark crevasses cutting through. Pressure ridges create shadow patterns. Scattered dark rocks frozen into the surface.",
    "coast": "Dark sandy shore meeting deep grey-blue water. Scattered dark rocks and tidal pools. Kelp beds visible as dark patches in shallow water.",
}

def build_prompt(biome: str, bg_color: str, features: str | None = None) -> str:
    """Build the hex terrain prompt using hexagonal composition with painterly depth."""
    feat = features or DEFAULT_FEATURES.get(biome.lower(), f"Naturalistic {biome} terrain features.")

    return f"""A single hexagonal tile of {biome} terrain, painted in dark fantasy oil painting style. {feat} The terrain forms a dense hexagonal cluster in the center of the composition. The surrounding background is flat, featureless ground in the biome's base color ({bg_color}). The terrain features fill the center but fade to bare ground before reaching the edges.

Slightly elevated three-quarter view, painterly depth with visible tree trunks and terrain texture. Rich dimensional brushwork, thick impasto oil paint. Dark moody atmosphere, dim overcast lighting. Muted desaturated palette.

No magic, no glowing elements, no luminous effects. No text, no UI, no labels, no drawn hex borders or outlines, no modern elements. No rivers, no streams, no water features that would need to connect across tile boundaries. No paths or roads that lead to edges."""


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
# Main pipeline
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Generate hex-masked terrain tiles")
    parser.add_argument("--biome", type=str, help="Biome name (e.g. 'dense forest')")
    parser.add_argument("--color", type=str, default="#2a3a20", help="Background hex color")
    parser.add_argument("--features", type=str, help="Custom terrain feature description")
    parser.add_argument("--prompt", type=str, help="Full custom prompt (overrides biome/features)")
    parser.add_argument("--output", type=str, help="Output path (default: Assets/biomes/<biome>.png)")
    parser.add_argument("--size", type=int, default=TILE_SIZE, help="Output image size in px")
    parser.add_argument("--no-mask", action="store_true", help="Skip hex masking (save square)")
    parser.add_argument("--raw-also", action="store_true", help="Also save the raw unmasked image")

    args = parser.parse_args()

    # Validate
    if not args.biome and not args.prompt:
        parser.error("Provide either --biome or --prompt")

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

    # Build prompt
    if args.prompt:
        prompt = args.prompt
        biome_slug = "custom"
    else:
        prompt = build_prompt(args.biome, args.color, args.features)
        biome_slug = args.biome.lower().replace(" ", "-")

    # Output path
    if args.output:
        out_path = Path(args.output)
    else:
        out_path = Path(__file__).parent.parent / "Assets" / "biomes" / f"{biome_slug}.png"

    out_path.parent.mkdir(parents=True, exist_ok=True)

    print(f"Generating: {args.biome or 'custom'}")
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
    if raw_img.size != (args.size, args.size):
        raw_img = raw_img.resize((args.size, args.size), Image.LANCZOS)

    # Save raw if requested
    if args.raw_also:
        raw_path = out_path.with_stem(out_path.stem + "-raw")
        raw_img.save(raw_path, "PNG")
        print(f"  Raw saved: {raw_path}")

    # Apply hex mask
    if not args.no_mask:
        print("Applying hex mask...")
        mask = make_hex_mask(args.size)
        result = apply_hex_mask(raw_img, mask)
    else:
        result = raw_img

    # Save
    result.save(out_path, "PNG")
    print(f"  Saved: {out_path}")
    print("Done!")

    return str(out_path)


if __name__ == "__main__":
    main()
