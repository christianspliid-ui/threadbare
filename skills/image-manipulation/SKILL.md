---
name: image-manipulation
description: |
  Techniques for manipulating images with Python Pillow — clipping to shapes (hexagons, circles, polygons), creating and applying alpha masks, layer compositing, and validating transparency. Use this skill whenever a task involves cutting an image to a non-rectangular shape, removing backgrounds, applying clipping masks, compositing layers, working with alpha channels, or verifying that image transparency is correct. Also trigger when the user mentions hex tiles, hexagonal cropping, polygon masking, transparent backgrounds, alpha compositing, or layer-based image editing. If the task involves programmatic image manipulation beyond simple resize/crop, this skill likely applies.
---

# Image Manipulation with Pillow

This skill covers the core techniques for programmatic image manipulation using Python's Pillow (PIL) library. The focus is on **geometric clipping**, **alpha masks**, **layer compositing**, and **validation** — the building blocks that let you cut images to shapes, combine layers, and verify the results are correct.

## Core Concepts

### The Alpha Channel

Every pixel in an RGBA image has four values: Red, Green, Blue, and Alpha. Alpha controls transparency:

- **255** = fully opaque (pixel is visible)
- **0** = fully transparent (pixel is invisible)
- **1-254** = semi-transparent (used for anti-aliased edges)

The alpha channel is essentially a grayscale "visibility map" for the image. This is the foundation everything else builds on.

### Masks

A **mask** is a grayscale image (mode "L") that controls which pixels survive an operation. White (255) = keep, black (0) = discard, gray = partial.

You create a mask by drawing shapes on a blank grayscale image, then apply it to your source image. This is how clipping works — the mask defines the shape, and everything outside becomes transparent.

### Layers and Compositing

**Compositing** means combining two images where the alpha channel of one (or a separate mask) controls how they blend. Pillow provides three main approaches:

| Method | Use case |
|--------|----------|
| `Image.paste(img, pos, mask)` | Paste one image onto another, using mask for shape |
| `Image.composite(img1, img2, mask)` | Blend two images together using mask for weighting |
| `Image.alpha_composite(base, overlay)` | Stack overlay on base, using overlay's own alpha |

The most common pattern for clipping: create a transparent canvas, then `paste` the source image onto it using a shape mask.

## Technique: Geometric Clipping (Polygon Mask)

This is the reliable way to clip an image to any regular shape — hexagons, circles, octagons, etc. No color detection, no flood fills, no guessing.

### The Pattern

```python
from PIL import Image, ImageDraw

def clip_to_polygon(source_path, output_path, n_sides, center, radius, rotation=0, inset=4, aa_scale=2):
    """
    Clip an image to a regular polygon shape.

    Args:
        source_path: Input image path
        output_path: Output image path (must be PNG for transparency)
        n_sides: Number of polygon sides (6=hexagon, 8=octagon, etc.)
        center: (cx, cy) center point of the polygon
        radius: Distance from center to vertex
        rotation: Rotation in degrees. IMPORTANT for Pillow's convention:
                  0 = flat-top hex (default) — flat edge at top and bottom
                  30 = pointy-top hex — vertex at top and bottom
                  Most game hex tiles are flat-top → use rotation=0.
        inset: Pixels to shrink the polygon inward (to exclude borders).
               Default 4 excludes typical 3-4px hex tile borders.
        aa_scale: Supersampling factor for anti-aliased edges (2 or 4)
    """
    img = Image.open(source_path).convert("RGBA")
    w, h = img.size
    cx, cy = center
    r = radius - inset

    # Create mask at higher resolution for anti-aliased edges
    mask_hires = Image.new("L", (w * aa_scale, h * aa_scale), 0)
    draw = ImageDraw.Draw(mask_hires)
    draw.regular_polygon(
        (cx * aa_scale, cy * aa_scale, r * aa_scale),
        n_sides,
        rotation=rotation,
        fill=255
    )

    # Downscale with LANCZOS — this creates smooth anti-aliased edges
    mask = mask_hires.resize((w, h), Image.LANCZOS)

    # Apply: transparent canvas + paste through mask
    result = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    result.paste(img, (0, 0), mask)
    result.save(output_path)
    return result
```

### Why Supersampling for Anti-Aliasing

Pillow's `ImageDraw` doesn't anti-alias polygon edges natively — you get jagged staircasing. The workaround: draw the mask at 2x (or 4x) resolution, then downscale with `Image.LANCZOS`. The downscaling naturally blends the edge pixels into smooth partial-transparency values. This is the same technique used in graphics rendering (SSAA — supersampled anti-aliasing).

- **2x** is sufficient for most cases
- **4x** gives smoother edges at the cost of more memory
- Higher than 4x gives diminishing returns

### ⚠️ CRITICAL: Hex Orientation (Flat-Top vs Pointy-Top)

**Most game hex tiles are flat-top orientation.** Getting rotation wrong is the #1 mistake — the mask shape won't match the hex content, and validation may still pass because the checks are orientation-agnostic.

**How to tell which orientation your hex is:**
- Look at the top edge of the hex content (the colored part, NOT the mask)
- If the top edge is a **flat horizontal line** → it's **flat-top** → use `rotation=0`
- If the top edge comes to a **point/vertex** → it's **pointy-top** → use `rotation=30`

**Pillow's `ImageDraw.regular_polygon()` rotation parameter:**
- `rotation=0` → flat edge at top (flat-top) ← **this is the default and what most hex tiles need**
- `rotation=30` → vertex at top (pointy-top)

**Why this is counterintuitive:** Pillow's rotation=0 places the first polygon vertex at the RIGHT (3 o'clock position). For a hexagon, this puts flat edges at top and bottom — which is flat-top. Adding rotation=30 rotates a vertex to the top — making it pointy-top.

### Hexagon Geometry Reference

Hexagons come in two orientations:

- **Flat-top**: `rotation=0` — horizontal edges at top and bottom
- **Pointy-top**: `rotation=30` — vertices at top and bottom

For a flat-top hexagon:
- **Width** = 2 × radius
- **Height** = √3 × radius ≈ 1.732 × radius

For a pointy-top hexagon:
- **Width** = √3 × radius
- **Height** = 2 × radius

To find the right radius for an existing hex image, measure the hex and compute:
```python
import math
# If you know the hex width (flat-top):
radius = hex_width / 2
# If you know the hex height (flat-top):
radius = hex_height / math.sqrt(3)
```

### The Inset Parameter

When your source image has a visible border around the shape (like a black hex outline), you **must** inset the mask polygon so it clips *inside* the border, not on it. **Default inset=4 is correct for most hex tiles with borders.**

The inset value should match or slightly exceed the border width in pixels:
1. Measure the border width visually or by sampling pixels (typically 3-4px for game art borders)
2. Set `inset` to that value — **default 4px works for most hex tiles**
3. Verify by checking that no dark border pixels remain in the output

**Do NOT use `inset=0` if the source image has a visible border** — you will get black border remnants in the output. Start with `inset=4` and adjust from there.

## Technique: Custom Polygon Clipping

For non-regular polygons, use explicit vertex coordinates:

```python
from PIL import Image, ImageDraw

def clip_to_custom_polygon(source_path, output_path, vertices, aa_scale=2):
    """
    Clip an image to an arbitrary polygon defined by vertex coordinates.

    Args:
        vertices: List of (x, y) tuples defining the polygon
    """
    img = Image.open(source_path).convert("RGBA")
    w, h = img.size

    # Scale vertices for supersampling
    scaled_verts = [(x * aa_scale, y * aa_scale) for x, y in vertices]

    mask_hires = Image.new("L", (w * aa_scale, h * aa_scale), 0)
    draw = ImageDraw.Draw(mask_hires)
    draw.polygon(scaled_verts, fill=255)

    mask = mask_hires.resize((w, h), Image.LANCZOS)

    result = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    result.paste(img, (0, 0), mask)
    result.save(output_path)
    return result
```

## Technique: Layer Compositing

### Stacking Layers (Alpha Composite)

To place one transparent image on top of another:

```python
base = Image.open("background.png").convert("RGBA")
overlay = Image.open("foreground.png").convert("RGBA")

# overlay's alpha channel controls blending
result = Image.alpha_composite(base, overlay)
result.save("combined.png")
```

### Compositing with a Separate Mask

When you want to control blending with an external mask rather than the image's own alpha:

```python
from PIL import ImageFilter

mask = Image.new("L", img1.size, 0)
draw = ImageDraw.Draw(mask)
draw.ellipse((50, 50, 200, 200), fill=255)

# Optional: blur mask for soft edges
mask = mask.filter(ImageFilter.GaussianBlur(5))

result = Image.composite(img1, img2, mask)
```

### Channel Manipulation

For fine-grained control, split into individual channels:

```python
import numpy as np

img = Image.open("source.png").convert("RGBA")
arr = np.array(img)

r, g, b, a = arr[:,:,0], arr[:,:,1], arr[:,:,2], arr[:,:,3]

# Example: make all red pixels semi-transparent
red_mask = (r > 200) & (g < 100) & (b < 100)
a[red_mask] = 128

result = Image.fromarray(np.stack([r, g, b, a], axis=2))
result.save("modified.png")
```

## Validation

Always validate the output after manipulation. Visual inspection alone is unreliable — a hex might *look* clean but still have border artifacts or incorrect alpha values.

### Automated Validation Checks

```python
import numpy as np
from PIL import Image

def validate_clipped_image(image_path, expected_shape="hexagon"):
    """
    Validate that an image was correctly clipped to shape.
    Returns dict of check results.
    """
    img = Image.open(image_path).convert("RGBA")
    arr = np.array(img)
    w, h = img.size
    total = w * h

    checks = {}

    # 1. Format check — must be RGBA PNG
    checks["has_alpha"] = img.mode == "RGBA"

    # 2. Corner transparency — all four corners must be fully transparent
    corners = {
        "top_left": arr[0, 0, 3],
        "top_right": arr[0, w-1, 3],
        "bottom_left": arr[h-1, 0, 3],
        "bottom_right": arr[h-1, w-1, 3],
    }
    checks["corners_transparent"] = all(v == 0 for v in corners.values())
    checks["corner_values"] = corners

    # 3. Center opacity — center pixel must be opaque
    checks["center_opaque"] = arr[h//2, w//2, 3] == 255

    # 4. Transparency ratio — should be in expected range for shape
    transparent = np.sum(arr[:,:,3] == 0)
    opaque = np.sum(arr[:,:,3] == 255)
    semi = total - transparent - opaque
    checks["transparent_pct"] = transparent / total * 100
    checks["opaque_pct"] = opaque / total * 100
    checks["antialiased_pixels"] = semi

    # For a hexagon inscribed in a rectangle, ~39-45% of pixels
    # should be transparent (the corners outside the hex)
    if expected_shape == "hexagon":
        checks["ratio_in_range"] = 35 < checks["transparent_pct"] < 50

    # 5. No fully-white opaque pixels near edges (background remnants)
    # Sample the outer 10% ring of pixels
    margin_x, margin_y = max(1, w // 10), max(1, h // 10)
    edge_region = arr.copy()
    edge_region[margin_y:-margin_y, margin_x:-margin_x, :] = 0  # zero out interior
    edge_opaque = (edge_region[:,:,3] > 200)
    if edge_opaque.any():
        edge_rgb = edge_region[edge_opaque][:, :3]
        # Only flag exact #ffffff — off-white content (snow, foam) is legitimate
        pure_white = np.all(edge_rgb == 255, axis=1)
        checks["no_white_edge_artifacts"] = pure_white.sum() == 0
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


def validate_batch(image_paths, expected_shape="hexagon"):
    """Validate a batch of clipped images and print summary."""
    results = {}
    failures = []

    for path in image_paths:
        name = path.split("/")[-1]
        checks = validate_clipped_image(path, expected_shape)
        results[name] = checks
        if not checks["pass"]:
            failures.append((name, checks))

    print(f"Validated {len(image_paths)} images: "
          f"{len(image_paths) - len(failures)} passed, {len(failures)} failed")

    for name, checks in failures:
        reasons = []
        if not checks["has_alpha"]: reasons.append("no alpha channel")
        if not checks["corners_transparent"]: reasons.append(f"opaque corners: {checks['corner_values']}")
        if not checks["center_opaque"]: reasons.append("center not opaque")
        if not checks.get("ratio_in_range", True): reasons.append(f"transparency {checks['transparent_pct']:.1f}% out of range")
        if not checks["no_white_edge_artifacts"]: reasons.append(f"{checks['white_edge_count']} white edge pixels")
        print(f"  FAIL {name}: {'; '.join(reasons)}")

    return results
```

### Visual Spot-Check

For visual verification, create a comparison image with a checkerboard background so transparency is visible:

```python
def create_checker_comparison(original_path, clipped_path, output_path, tile_size=8):
    """Side-by-side comparison: original vs clipped on checkerboard."""
    original = Image.open(original_path).convert("RGBA")
    clipped = Image.open(clipped_path).convert("RGBA")
    w, h = original.size

    # Create checkerboard
    checker = Image.new("RGBA", (w, h))
    for y in range(0, h, tile_size):
        for x in range(0, w, tile_size):
            color = (200, 200, 200, 255) if (x // tile_size + y // tile_size) % 2 == 0 else (240, 240, 240, 255)
            for dy in range(min(tile_size, h - y)):
                for dx in range(min(tile_size, w - x)):
                    checker.putpixel((x + dx, y + dy), color)

    # Composite clipped onto checkerboard
    preview = Image.alpha_composite(checker, clipped)

    # Side by side
    combined = Image.new("RGBA", (w * 2 + 10, h), (40, 40, 40, 255))
    combined.paste(original, (0, 0))
    combined.paste(preview, (w + 10, 0))
    combined.save(output_path)
```

### What to Look For

When reviewing clipped images, check these things:

1. **Corners are transparent** — if you see white or colored pixels in the corners, the mask isn't covering them
2. **No border remnants** — dark fringe around the hex edge means the inset is too small
3. **Content not clipped** — if the hex fill is cut off, the inset is too large or the polygon isn't centered
4. **Smooth edges** — jagged staircasing means anti-aliasing isn't working (check aa_scale)
5. **Consistent shape** — the clipped polygon should match the expected geometry exactly

## Bundled Script: Hex Clip Pipeline

The `scripts/clip_hex.py` script provides a ready-to-use pipeline for batch-clipping hex tiles. **Prefer using this script over writing your own code** — it has correct defaults for flat-top hex tiles (rotation=0, inset=4).

```bash
# Single file — defaults handle flat-top hex with border
python clip_hex.py ocean.png ocean_clipped.png

# Batch — processes all PNGs, validates results
python clip_hex.py --batch ./source_pngs/ ./clipped/ --validate

# Override radius if auto-detect is wrong
python clip_hex.py --batch ./tiles/ ./output/ --radius 54 --validate
```

See the script header for full usage documentation.

## Common Pitfalls

| Problem | Cause | Fix |
|---------|-------|-----|
| White background visible | Mask doesn't cover corners | Check polygon size covers full image extent |
| Black border in output | Inset too small | Increase `inset` parameter |
| Content cut off | Inset too large or polygon off-center | Decrease `inset`, verify `center` coordinates |
| Jagged edges | No anti-aliasing | Use `aa_scale=2` or higher |
| Blurry edges | GaussianBlur radius too high | Use supersampling instead of blur, or reduce blur radius |
| JPEG output has no transparency | JPEG doesn't support alpha | Always save as PNG |
| Color-threshold clipping fails on light images | Flood-fill confuses light fill with white background | Use geometric clipping instead — it doesn't depend on pixel colors at all |

## Dependencies

- **Pillow** (PIL): `pip install Pillow` — image loading, drawing, compositing
- **NumPy**: `pip install numpy` — fast pixel-level validation and channel manipulation

Both are pre-installed in most Python environments.
