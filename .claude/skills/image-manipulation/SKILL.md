---
name: image-manipulation
description: |
  Techniques for manipulating images with Python Pillow — clipping to shapes (hexagons, circles, polygons), creating and applying alpha masks, layer compositing, and validating transparency. Use this skill whenever a task involves cutting an image to a non-rectangular shape, removing backgrounds, applying clipping masks, compositing layers, working with alpha channels, or verifying that image transparency is correct. Also trigger when the user mentions hex tiles, hexagonal cropping, polygon masking, transparent backgrounds, alpha compositing, or layer-based image editing. If the task involves programmatic image manipulation beyond simple resize/crop, this skill likely applies.
---

# Image Manipulation with Pillow

Geometric clipping, alpha masks, and validation for hex tiles and other shapes. Uses Python's Pillow (PIL) library.

## Bundled Scripts

**Prefer these scripts over writing inline code.** They have correct defaults for flat-top hex tiles.

### `scripts/clip_hex.py` — Clip & Validate Pipeline

```bash
# Single file — flat-top hex with border removal (defaults: rotation=0, inset=4)
python clip_hex.py ocean.png ocean_hex.png

# Batch process all PNGs, validate results
python clip_hex.py --batch ./source_pngs/ ./clipped/ --validate

# Override radius if auto-detect is wrong
python clip_hex.py --batch ./tiles/ ./output/ --radius 54 --validate

# Pointy-top hex (uncommon — verify visually first)
python clip_hex.py tile.png tile_hex.png --rotation 30
```

Key functions: `clip_to_hex()`, `create_hex_mask()`, `validate_hex()`. Read the script header for full API.

### `scripts/validate_hex.py` — Standalone Validation & Comparison

```bash
# Validate a single image
python validate_hex.py ocean_hex.png --verbose

# Batch validate a directory
python validate_hex.py --batch ./clipped/

# Visual comparison: original vs clipped on checkerboard background
python validate_hex.py --compare original.png clipped.png comparison.png
```

Runs 5 automated checks: alpha channel present, corners transparent, center opaque, transparency ratio in range (35-50% for hexagons), no pure-white edge artifacts.

## Hex Orientation (Flat-Top vs Pointy-Top)

**Most game hex tiles are flat-top.** Getting this wrong is the #1 mistake — the mask won't match the content, and validation may still pass.

**How to identify:**
- Top edge is a **flat horizontal line** → **flat-top** → `rotation=0` (default)
- Top edge comes to a **point/vertex** → **pointy-top** → `rotation=30`

**Pillow's convention:** `rotation=0` places the first vertex at 3 o'clock, giving flat edges at top/bottom. `rotation=30` rotates a vertex to the top.

## Hexagon Geometry

| Orientation | Width | Height | Common in |
|-------------|-------|--------|-----------|
| Flat-top (`rotation=0`) | 2 × radius | √3 × radius ≈ 1.732r | Most game tiles |
| Pointy-top (`rotation=30`) | √3 × radius | 2 × radius | Some map tools |

**Radius from image dimensions (flat-top):**
- From width: `radius = width / 2`
- From height: `radius = height / math.sqrt(3)`

## The Inset Parameter

When source images have a visible border (like a black hex outline), the mask must be shrunk inward to clip *inside* the border. **Default `inset=4` handles typical 3-4px game art borders.**

- `inset=0` → border remnants in output (black fringe)
- `inset=4` → correct for most hex tiles (default)
- `inset > 4` → may clip content if border is thin

## Custom Polygon Clipping

For non-hexagonal shapes, use the same supersampled-mask pattern from `clip_hex.py` but with explicit vertices:

1. Create a grayscale mask at `aa_scale` × resolution
2. Draw the polygon with `ImageDraw.polygon(vertices, fill=255)`
3. Downscale with `Image.LANCZOS` for smooth anti-aliased edges
4. Paste source through mask onto transparent canvas

The supersampling is necessary because Pillow's `ImageDraw` doesn't anti-alias polygon edges natively. 2× is sufficient; 4× gives smoother edges at higher memory cost.

## Validation Checklist

When reviewing clipped images, verify:

1. **Corners transparent** — white/colored corner pixels mean the mask doesn't cover them
2. **No border remnants** — dark fringe around edge means inset too small
3. **Content not clipped** — hex fill cut off means inset too large or polygon off-center
4. **Smooth edges** — jagged staircasing means anti-aliasing isn't working (check `aa_scale`)
5. **Consistent shape** — polygon matches expected geometry

Use `validate_hex.py --compare` to generate a checkerboard comparison image for visual spot-checking.

## Common Pitfalls

| Problem | Cause | Fix |
|---------|-------|-----|
| White background visible | Mask doesn't cover corners | Check polygon size covers full image extent |
| Black border in output | Inset too small | Increase `inset` (default 4 handles most tiles) |
| Content cut off | Inset too large or polygon off-center | Decrease `inset`, verify `center` coordinates |
| Jagged edges | No anti-aliasing | Use `aa_scale=2` or higher |
| JPEG output has no transparency | JPEG doesn't support alpha | Always save as PNG |
| Color-threshold clipping fails | Flood-fill confuses light fill with white background | Use geometric clipping — no pixel color dependency |

## Dependencies

- **Pillow** (PIL): `pip install Pillow`
- **NumPy**: `pip install numpy`
