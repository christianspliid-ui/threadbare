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
    "dense forest": {
        "color": "#2a3a20",
        "desc": "a dense ancient forest",
        "detail": "Gnarled oaks and twisted pines seen from far above, their canopy tops forming a continuous dark mass with shadows between them. Moss-covered boulders dot the forest floor between the trees. The forest extends to all edges of the image — no bare ground, no clearings, just continuous dense forest canopy from edge to edge.",
        "elements": "trees",
    },
    "open grassland": {
        "color": "#4a4a2a",
        "desc": "a vast open grassland stretching to the horizon",
        "detail": "Enormous rolling hills of dry golden-brown grass seen from very far above, with broad dark patches of scrub and scattered boulder fields breaking the golden expanse. Shallow valleys and low ridgelines create subtle texture across the landscape. The grassland extends to all edges of the image — no bare earth, no clearings, just continuous rolling grass plains from edge to edge.",
        "elements": "hills and scrub patches",
    },
    "mountain": {
        "color": "#3a3a3a",
        "desc": "a jagged mountain range",
        "detail": "Grey-brown rock ridges and dark ravines seen from far above, patches of scree and shadow-filled crevices between sharp peaks. Snow dusts the highest points. The mountains extend to all edges of the image — no flat ground, no clearings, just continuous jagged rock and ridges from edge to edge.",
        "elements": "peaks and ridges",
    },
    "desert": {
        "color": "#5a4a2a",
        "desc": "a rolling sand desert",
        "detail": "Burnt umber and dark amber dunes seen from far above, wind-carved ripple patterns across the sand. Scattered dark rocky outcrops break through the dunes. The desert extends to all edges of the image — no bare flat ground, no clearings, just continuous dunes and sand from edge to edge.",
        "elements": "dunes",
    },
    "tundra": {
        "color": "#3a4a5a",
        "desc": "a vast frozen tundra wasteland stretching endlessly",
        "detail": "Broad expanses of frozen permafrost seen from very far above, with wide dark lichen fields and large frost-heaved rock formations creating a patchwork across the landscape. Clusters of stunted dead trees dot the terrain like tiny dark specks. Muted grey-blue tones throughout. The tundra extends to all edges of the image — no bare ground, no clearings, just continuous frozen terrain from edge to edge.",
        "elements": "lichen fields and rock formations",
    },
    "swamp": {
        "color": "#2a3a1a",
        "desc": "a dark waterlogged swamp",
        "detail": "Twisted dead trees and murky pools seen from far above, moss-covered hummocks rising between dark water. Deep olive-brown palette throughout. The swamp extends to all edges of the image — no dry ground, no clearings, just continuous swamp from edge to edge.",
        "elements": "trees and hummocks",
    },
    "volcanic": {
        "color": "#3a2020",
        "desc": "a cracked volcanic wasteland",
        "detail": "Obsidian plains and dark ash dunes seen from far above, hardened lava flows creating dark ridged patterns. Faint orange-red glow in deep cracks. The volcanic terrain extends to all edges of the image — no normal ground, no clearings, just continuous cracked rock and ash from edge to edge.",
        "elements": "lava ridges and cracks",
    },
    "glacier": {
        "color": "#2a3a4a",
        "desc": "a vast blue-white glacier",
        "detail": "Ice sheets with dark crevasses cutting through seen from far above, pressure ridges creating shadow patterns. Scattered dark rocks frozen into the surface. The glacier extends to all edges of the image — no bare ground, no clearings, just continuous ice from edge to edge.",
        "elements": "crevasses and ridges",
    },
    "coast": {
        "color": "#3a3a2a",
        "desc": "a vast rocky coastline seen from great height",
        "detail": "A sweeping shoreline seen from very far above, where dark land meets deep grey-blue ocean in a long ragged line. Wide beaches of dark sand, large cliff formations, and broad rocky headlands alternate along the coast. Waves appear as thin white lines against dark water. The coastline extends to all edges of the image — no empty space, just continuous land-meeting-sea from edge to edge.",
        "elements": "headlands and beaches",
    },
    "deciduous forest": {
        "color": "#3a4a2a",
        "desc": "a vast deciduous forest in late autumn",
        "detail": "Dense broad-leafed trees seen from very far above, oaks and elms with wide dark crowns in shades of burnt amber, deep rust, and dark olive. The canopy rolls over gentle hills, thick impasto brushstrokes suggesting each tree crown. Patches where leaves have fallen reveal dark twisted branches beneath. The forest extends to all edges of the image — no bare ground, no clearings, just continuous autumn canopy from edge to edge.",
        "elements": "tree crowns",
    },
    "taiga": {
        "color": "#1a2a1a",
        "desc": "a vast dark boreal taiga stretching endlessly",
        "detail": "Dense ranks of tall dark conifers seen from very far above, spruce and pine forming a near-black carpet of pointed treetops. Patches of snow cling between the trees in long pale streaks. The taiga extends to all edges of the image — no bare ground, no clearings, just continuous dark conifer forest from edge to edge.",
        "elements": "conifer tops",
    },
    "jungle": {
        "color": "#1a3a1a",
        "desc": "a vast steaming tropical rainforest seen from very far above",
        "detail": "Thick tropical canopy seen from very far above, dozens of tall palm trees rising above the broad-leafed canopy like spears, their fronds splayed wide. Huge woody vines snake across the treetops connecting the crowns. Flocks of bright parrots — scarlet, emerald, gold — wheel above the canopy in vivid clusters. Wisps of humid mist hang in the valleys between the hills. The jungle extends to all edges of the image — no bare ground, no clearings, just continuous steaming tropical rainforest from edge to edge.",
        "elements": "palm trees and canopy crowns",
    },
    "hills": {
        "color": "#4a4a3a",
        "desc": "a vast rolling highland of grassy hills",
        "detail": "Broad rounded hills seen from very far above, their slopes covered in dark grass and heather with exposed rock on the ridgelines. Deep shadow pools in the valleys between. The hills extend to all edges of the image — no flat ground, no clearings, just continuous rolling terrain from edge to edge.",
        "elements": "hilltops and valleys",
    },
    "plateau": {
        "color": "#5a4a3a",
        "desc": "a vast flat-topped plateau with sheer edges",
        "detail": "Wide flat highland terrain seen from very far above, dry sparse scrub on weathered brown rock. Deep canyons and sheer cliff edges cut through the plateau in dark jagged lines. The plateau extends to all edges of the image — no lowlands, no clearings, just continuous flat highland and canyon edges from edge to edge.",
        "elements": "mesa tops and canyon edges",
    },
    "badlands": {
        "color": "#5a3a2a",
        "desc": "a vast eroded badlands of canyons and mesas",
        "detail": "Deeply eroded terrain seen from very far above, layered red-brown and dark grey rock formations carved into sharp ridges, narrow canyons, and flat-topped mesas. Wind-sculpted pillars and hoodoos cast long shadows. The badlands extend to all edges of the image — no flat ground, no vegetation, just continuous eroded rock formations from edge to edge.",
        "elements": "mesas and canyons",
    },
    "savanna": {
        "color": "#5a4a2a",
        "desc": "a vast dry savanna with scattered trees",
        "detail": "Wide expanses of dry golden grass seen from very far above, dotted with scattered flat-topped acacia-like trees casting long shadows. Termite mounds appear as tiny dark dots. Broad dry streambeds wind through the landscape. The savanna extends to all edges of the image — no bare earth, no clearings, just continuous dry grassland and scattered trees from edge to edge.",
        "elements": "trees and grass expanses",
    },
    "steppe": {
        "color": "#4a4a3a",
        "desc": "a vast windswept steppe stretching to infinity",
        "detail": "Enormous flat plain seen from very far above, like the savanna but treeless and cold. Broad bands of grey-green and pale gold grass stretch for miles, bent by wind into sweeping wave patterns. Scattered dark boulders and weathered standing stones dot the plain like tiny specks. A few clusters of tiny yurt-like tents huddle near shallow depressions. Herds of wild horses appear as dark dots moving across the grass. The steppe extends to all edges of the image — no bare ground, no features, just continuous flat windswept grassland from edge to edge.",
        "elements": "grass waves and scattered boulders",
    },
    "farmland": {
        "color": "#4a4a2a",
        "desc": "a vast wild medieval countryside with rare scattered farms",
        "detail": "Wide landscape seen from very far above, dominated by dark copses of broadleaf trees, wild flower meadows, and overgrown scrubland. Only one or two tiny irregular fields of grain visible among the wildness. A few thatched cottages cluster near a muddy crossroad. Sheep and cattle graze as tiny pale specks in the meadows. Small dark ponds sit in hollows between the copses. The land is barely tamed — wild growth covers most of it. The countryside extends to all edges of the image — no empty space, just continuous wild rural landscape from edge to edge.",
        "elements": "copses, meadows, and wild scrub",
    },
    "bog": {
        "color": "#2a3a2a",
        "desc": "a vast treeless bog stretching endlessly",
        "detail": "Waterlogged peatland seen from very far above, dark brown and olive-green moss carpets broken by black standing pools of still water. No trees — only low sedge and sphagnum in broad hummock patterns. The bog extends to all edges of the image — no dry ground, no clearings, just continuous waterlogged peatland from edge to edge.",
        "elements": "pools and moss hummocks",
    },
    # --- Water biomes ---
    "ocean": {
        "color": "#1a2a3a",
        "desc": "a vast dark stormy ocean seen from very far above",
        "detail": "Deep open ocean seen from very far above, dark grey-blue water stretching endlessly. Broad rolling swells form long parallel lines across the surface, their crests catching dim light as pale streaks. Occasional whitecaps scatter across the darker troughs. A pod of dark whales surfaces in the distance as tiny shapes trailing pale wakes. The ocean extends to all edges of the image — no land, no shore, just continuous dark churning sea from edge to edge.",
        "elements": "wave crests and swells",
    },
    "tropical ocean": {
        "color": "#1a4a5a",
        "desc": "a vast warm tropical ocean seen from very far above",
        "detail": "Deep tropical ocean seen from very far above, rich azure and deep turquoise water stretching endlessly. Long gentle swells roll lazily across the surface, their crests catching warm light as bright pale lines. The water shifts between deep cobalt in the troughs and vivid blue-green on the crests. A few dark shapes of sea turtles or manta rays drift below the surface as faint shadows. The ocean extends to all edges of the image — no land, no shore, just continuous warm tropical sea from edge to edge.",
        "elements": "gentle swells and color shifts",
    },
    # NOTE: coastal shallows, lake, and river are NOT full-hex tiles.
    # They will be handled as render-time overlays on land tiles (Option D).
    # See future hex map renderer for implementation.
}

# ---------------------------------------------------------------------------
# Magic overlay registry — sphere-specific thread patterns
# ---------------------------------------------------------------------------

MAGIC_REGISTRY = {
    # Creation Spheres (8)
    "force": {
        "color": "#ff4444",
        "bright": "#ff6b6b",
        "form_language": "sharp directional streaks and impact radiants, lightning-bolt angles, shockwave arcs, arrow-like directional lines, explosive radiants from impact points",
        "desc": "Force",
    },
    "matter": {
        "color": "#8b6b4a",
        "bright": "#a8886a",
        "form_language": "crystalline lattices and hexagonal facets, mineral-like structures, hard-edged tessellating crystal formations, angular geometric nodes",
        "desc": "Matter",
    },
    "energy": {
        "color": "#ffd700",
        "bright": "#ffe44d",
        "form_language": "radiating spikes and star-burst coronas, pulsing outward from bright centers like tiny suns, flickering flame tongues, electric arcs, solar flare shapes",
        "desc": "Energy",
    },
    "life": {
        "color": "#00cc55",
        "bright": "#33ff77",
        "form_language": "organic branching veins roots and mycelium, Fibonacci spirals, tendril curls, capillary networks, cell-like nodes, the most natural-looking patterns",
        "desc": "Life",
    },
    "mind": {
        "color": "#2288ff",
        "bright": "#44aaff",
        "form_language": "neural dendrites and concentric rings, dendrite networks, eye-like nodes, mandala patterns at intersections, precise but complexly branching",
        "desc": "Mind",
    },
    "spirit": {
        "color": "#aa44dd",
        "bright": "#cc66ff",
        "form_language": "ascending wisps and ethereal ribbons, smoke-like trails rising, ghostly flame shapes, dissolving transparent edges, ribbons that partially fade into nothing",
        "desc": "Spirit",
    },
    "time": {
        "color": "#ff9933",
        "bright": "#ffb355",
        "form_language": "concentric ripples and overlapping echoes, clock-arc shapes, time-wave rings expanding from nodes, overlapping afterimages of the same thread visible in multiple moments",
        "desc": "Time",
    },
    "entropy": {
        "color": "#5a8a7a",
        "bright": "#7aaa9a",
        "form_language": "fracturing patterns and scattering particles, cracking and fragmenting at edges, dissolving into scattered motes, erosion lines",
        "desc": "Entropy",
    },
    # Foundation Spheres (4)
    "chaos": {
        "color": "#8a8a8e",
        "bright": "#aaaaae",
        "form_language": "fractals and turbulent swirls, every tendril goes a different direction, no repeating pattern, like fractal lightning or turbulent fluid",
        "desc": "Chaos",
    },
    "order": {
        "color": "#d4af37",
        "bright": "#e4cf57",
        "form_language": "geometric grids and tessellations, clean straight lines, repeating symmetrical patterns, sacred geometry, crystalline lattice structures",
        "desc": "Order",
    },
    "light": {
        "color": "#ffeb99",
        "bright": "#fff5cc",
        "form_language": "expanding aureoles and radiant beams, warm radiance spreading outward from bright center points in concentric circles of illumination",
        "desc": "Light",
    },
    "darkness": {
        "color": "#4a3a8a",
        "bright": "#6a5aaa",
        "form_language": "absorbing voids with rim-glow, deep indigo holes that pull light in, void-like depths edged with faint luminous rims",
        "desc": "Darkness",
    },
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


# Brightness threshold — pixels with max(R,G,B) below this become transparent
BLACK_THRESHOLD = 15

def black_to_transparent(img: Image.Image, threshold: int = BLACK_THRESHOLD) -> Image.Image:
    """Convert near-black pixels to transparent for magic overlay compositing.

    Pixels where max(R,G,B) < threshold get alpha=0.
    All other pixels keep their original color and alpha.
    """
    img = img.convert("RGBA")
    pixels = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if max(r, g, b) < threshold:
                pixels[x, y] = (r, g, b, 0)
    return img


# ---------------------------------------------------------------------------
# Prompt construction
# ---------------------------------------------------------------------------

def build_prompt(biome: str, bg_color: str, features: str | None = None, extra: str | None = None) -> str:
    """Build the hex terrain prompt using steep overhead angle, terrain fills entire frame."""
    reg = BIOME_REGISTRY.get(biome.lower(), {})
    desc = reg.get("desc", biome)
    detail = features or reg.get("detail", f"{biome} terrain extending to all edges of the image.")
    elements = reg.get("elements", "features")
    suffix = f" {extra}" if extra else ""

    return f"""Aerial view looking almost straight down at {desc} that fills the entire image. {detail}

Camera very far above, nearly directly overhead, about 80 degrees from horizontal. Wide shot — individual {elements} are small. Dark fantasy oil painting style. Rich impasto brushwork. Dark moody atmosphere, dim overcast lighting. Muted desaturated palette.

No sky. No horizon. No bare ground. No magic, no glowing elements. No text, no UI, no hexagonal shapes. No rivers, no streams. No paths.{suffix}"""


def build_magic_prompt(sphere: str) -> str:
    """Build prompt for a magic sphere overlay — luminous threads on black."""
    reg = MAGIC_REGISTRY[sphere.lower()]
    color = reg["bright"]
    form = reg["form_language"]
    name = reg["desc"]

    return f"""Semi-transparent {name} magic threads on pure black background. Luminous {color} colored threads in {form}. The threads are intensely bright and saturated against pure black. 10-20% of the image area has visible luminous threads, the rest is pure black.

No terrain, no scenery, no ground, no sky, no figures, no characters.
Dark fantasy style, painterly brushwork, bright magical threads on black.
No text, no UI, no labels. No hexagonal shapes."""


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
                    features=info.get("detail"),
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
            print(f"    OK {biome} -> {path}")
        if failures:
            print(f"  Failed: {len(failures)}/{total}")
            for biome, err in failures:
                print(f"    FAIL {biome}: {err}")

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
