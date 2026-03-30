# Batch Art Generation Pipeline — Design Document

> Extends the hex tile generation script to produce magic sphere overlays, consolidates output paths, and adds asset auditing.

## Problem Statement

The game has complete terrain tiles (27 types) and location overlays (19 types) in `public/hex-tiles/`, but zero magic sphere overlays exist. STYLE.md defines a 3-component compositable hex system (terrain + magic overlay + location overlay), but the magic overlay layer has no generated assets. Additionally, the Python pipeline outputs to `Assets/biomes/` while the game reads from `public/hex-tiles/`, requiring manual copy steps.

## Decision: Extend Existing Pipeline

**Chosen approach:** Add magic overlay generation to the existing `generate-hex-tile.py` script, redirect all output to `public/hex-tiles/`, and add an asset audit command.

**Why this over alternatives:**
- **vs. TypeScript rewrite:** The Python script works. Rewriting it in TS gains language consistency but delivers zero new content. YAGNI.
- **vs. Vite build plugin:** API calls during builds are non-deterministic, expensive, and fragile. Art generation is a manual author-time step, not a build step.
- **Risk profile:** Additive changes to a working script. No existing behavior changes except output path.

## Magic Overlay Registry

12 overlays — one per sphere. Each follows STYLE.md's canonical magic overlay prompt template with sphere-specific color and form language.

### Foundation Spheres (4)

| Sphere | Hex | Form Language | Filename |
|--------|-----|---------------|----------|
| Chaos | `#8a8a8e` | Fractals and turbulent swirls | `magic-chaos.png` |
| Order | `#d4af37` | Geometric grids and tessellations | `magic-order.png` |
| Light | `#ffeb99` | Expanding aureoles and radiant beams | `magic-light.png` |
| Darkness | `#4a3a8a` | Absorbing voids with rim-glow | `magic-darkness.png` |

### Creation Spheres (8)

| Sphere | Hex | Form Language | Filename |
|--------|-----|---------------|----------|
| Force | `#ff4444` | Sharp directional streaks, impact radiants | `magic-force.png` |
| Matter | `#8b6b4a` | Crystalline lattices, hexagonal facets | `magic-matter.png` |
| Energy | `#ffd700` | Radiating spikes, star-burst coronas | `magic-energy.png` |
| Life | `#00cc55` | Organic branching — veins, roots, mycelium | `magic-life.png` |
| Mind | `#2288ff` | Neural dendrites, concentric rings | `magic-mind.png` |
| Spirit | `#aa44dd` | Ascending wisps, ethereal ribbons | `magic-spirit.png` |
| Time | `#ff9933` | Concentric ripples, overlapping echoes | `magic-time.png` |
| Entropy | `#5a8a7a` | Fracturing patterns, scattering particles | `magic-entropy.png` |

## Prompt Template (Magic Overlays)

From STYLE.md's canonical template, expanded for API quality:

```
Semi-transparent [sphere] magic threads on pure black background.
Luminous [hex color] threads in [form language description].
The threads are intensely bright and concentrated against pure black.
10-20% of the image area has visible threads, the rest is pure black.
No terrain, no scenery, no ground, no sky, no figures.
Dark fantasy style, painterly brushwork, bright magical threads on black.
```

The black background becomes transparent after processing: the pipeline converts pure black pixels to transparent alpha, preserving the luminous thread colors.

## Pipeline Changes

### 1. Output Path

All generated assets go directly to `public/hex-tiles/` instead of `Assets/biomes/`. The `--output` flag still works for custom paths. `Assets/biomes/` remains as an archive.

### 2. Category Flag

```bash
python scripts/generate-hex-tile.py --category terrain --batch   # existing biomes
python scripts/generate-hex-tile.py --category magic --batch     # all 12 spheres
python scripts/generate-hex-tile.py --category magic --sphere force  # single sphere
python scripts/generate-hex-tile.py --batch-all                  # everything
```

### 3. Black-to-Transparent Processing

Magic overlays are generated on black backgrounds (easier for AI models to produce clean results). Post-processing converts near-black pixels (brightness < 15) to fully transparent, preserving bright thread colors with their original alpha.

### 4. Asset Audit

```bash
python scripts/generate-hex-tile.py --audit
```

Compares BIOME_REGISTRY + MAGIC_REGISTRY against `public/hex-tiles/`:
- **Missing:** In registry but no PNG exists
- **Orphaned:** PNG exists but not in any registry
- **Size mismatch:** Wrong dimensions (not 1024×1024)

### 5. npm Script Updates

```json
{
  "generate-hex": "python scripts/generate-hex-tile.py",
  "generate-hex:terrain": "python scripts/generate-hex-tile.py --category terrain --batch",
  "generate-hex:magic": "python scripts/generate-hex-tile.py --category magic --batch",
  "generate-hex:audit": "python scripts/generate-hex-tile.py --audit",
  "generate-hex:all": "python scripts/generate-hex-tile.py --batch-all"
}
```

## Game Code Integration (Follow-up)

After magic overlay PNGs are generated, a small follow-up adds them to the renderer:

1. Add `MAGIC_OVERLAY_MAP: Record<SphereName, string>` to `hex-tile-assets.ts`
2. Add `getMagicOverlayUrl(sphere: SphereName): string` helper
3. HexTile component conditionally renders magic overlay `<image>` on top of terrain

This is a separate task — the pipeline generates assets, the renderer consumes them.

## Testing Strategy

- **Prompt builder:** Unit test that each sphere produces the expected prompt string (deterministic)
- **Black-to-transparent:** Unit test with a fixture image (black + colored pixels → transparent + colored)
- **Audit logic:** Unit test with a temp directory containing known files
- **No API tests:** External dependency, tested by manual runs
- **Visual QA:** User runs on their machine, inspects results in the style tile

## Success Criteria

1. `--category magic --batch` generates all 12 magic sphere overlay PNGs to `public/hex-tiles/`
2. Magic overlays are semi-transparent PNGs (black converted to transparent) with hex masking
3. `--audit` correctly reports missing, orphaned, and size-mismatched assets
4. Existing terrain generation redirected to `public/hex-tiles/`, no behavior changes
5. Each magic overlay visually matches its sphere's form language from STYLE.md
