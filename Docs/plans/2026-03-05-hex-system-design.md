# Hex Visual System Design

**Date:** 2026-03-05
**Status:** Approved
**Context:** Feedback on initial biome hex icons revealed two architectural issues: (1) hexes looked like stylized icons rather than miniature landscapes, and (2) magic baked into terrain tiles prevents dynamic sphere changes.

## Decision

Replace single-layer hex icons with a **three-component compositable system**.

## The Three Components

### Component A — Terrain Tile (Base)

A painterly top-down landscape miniature. **No magic whatsoever.** Represents the physical terrain as seen from god's-eye height.

**Rules:**
- Background color carries biome identity (dark olive for forest, burnt umber for desert, blue-black for glacier)
- Small, repeated, naturalistic terrain features: 3-5 tree clusters for forests, 2-3 ridgelines for mountains, scattered outcrops for hills
- Painted naturally — features should look like terrain from great altitude, not symbols
- No roots, underground structures, or anything not visible from above
- Consistent dim overcast lighting with subtle shadow for depth
- Soft edges — no hard hex border baked into the image
- Designed for 48-96px display; features must read clearly at small sizes
- **Absolutely no glowing threads, sphere colors, or luminous effects**

**Reference:** Atlas of Mystara hex maps (Mark's Known World series) — the way background colors and repeated terrain icons create the impression of a real landscape from above.

### Component B — Terrain Variant Tile (Transformed Base)

Same format as Component A, but depicts a biome physically transformed by decades of sphere saturation. Has its own name, color palette, and terrain features. Replaces Component A when prolonged magical influence has changed the landscape.

**Key distinction:** The transformation is *physical*. A Blightweald (Entropy-transformed forest) has dead trees, grey soil, fungal growths — regardless of whether active Entropy magic is currently present. The damage persists.

**~25-30 named variants across major biome families.** See variant table below.

### Component C — Magic Overlay (Effect Layer)

A semi-transparent compositable image showing active sphere magic. Designed to composite on top of any terrain tile (A or B). 12 total — one per sphere.

**Generated reference images:**
- Semi-transparent PNG on transparent background, 1:1 aspect ratio
- Sphere's form language rendered as concentrated thread patterns
- Threads are bright and saturated; ~10-20% coverage, rest transparent
- Terrain shows through the transparent areas

**Programmatic rules (for runtime implementation):**

| Sphere | Glow Color | Glow Radius | Animation | Particle Behavior |
|--------|-----------|-------------|-----------|-------------------|
| Force | `#ff4444` | Tight, 2-3px | Fast pulse, directional flash | Sharp directional streaks |
| Matter | `#8b6b4a` | Medium, 3-4px | Slow crystalline growth | Faceted geometric expansion |
| Energy | `#ffd700` | Wide, 4-6px | Rapid flicker, corona pulse | Star-burst radiants |
| Life | `#00cc55` | Medium, 3-4px | Organic breathing rhythm | Branching, tendril growth |
| Mind | `#2288ff` | Tight, 2-3px | Neural firing pattern | Dendrite branching, eye-blink |
| Spirit | `#aa44dd` | Soft, 4-5px | Slow upward drift | Rising wisps, dissolving edges |
| Time | `#ff9933` | Medium, 3-4px | Concentric ripple expansion | Echo-afterimage repetition |
| Entropy | `#5a8a7a` | Ragged, 2-4px | Fracturing, scattering | Breaking apart, dispersing motes |
| Chaos | `#8a8a8e` | Unstable, varies | Turbulent, unpredictable | Fractal branching, no pattern |
| Order | `#d4af37` | Clean, 3px | Steady geometric rotation | Tessellation, lattice grid |
| Light | `#ffeb99` | Wide, 5-7px | Expanding aureole | Concentric expanding circles |
| Darkness | `#4a3a8a` | Inverse (absorbing) | Slow contraction | Inward pull, rim-glow only |

## Composition Rules

A hex can display four states:

| State | Components | Example |
|-------|-----------|---------|
| Natural terrain | A only | Untouched forest |
| Natural terrain + active magic | A + C | Forest with Life magic present |
| Transformed terrain | B only | Blightweald (Entropy left its mark, magic moved on) |
| Transformed terrain + active magic | B + C | Blightweald with active Entropy threads |

Magic overlays are sphere-generic — any overlay composites on any tile. A jungle can show Entropy magic; a glacier can show Life magic. The overlay doesn't care about the base.

## Biome Variant Table

### Dense Forest / Deciduous Forest

| Sphere | Variant Name | Visual Transformation | Palette Shift |
|--------|-------------|----------------------|---------------|
| Entropy | **Blightweald** | Dead bone-white trunks, grey fungal growths, ash soil, no canopy | Grey-brown, ash-white, fungal grey-green |
| Life | **Deepthicket** | Hyper-overgrown mega-canopy, no ground visible, vine-choked | Ultra-dark green, almost black canopy |
| Spirit | **Ghostwood** | Pale translucent trees, perpetual mist, visible afterimages | Washed-out grey-blue, fog-white |
| Mind | **Whisperweald** | Trees grow in neural-branching patterns, unnatural symmetry | Blue-tinged dark green, eerie |
| Energy | **Emberwood** | Perpetually smoldering, blackened trunks with ember-glow cores | Charcoal black, ember orange-red |
| Time | **Stillwood** | Petrified mid-motion, leaves frozen mid-fall, amber preservation | Amber-brown, fossil-grey |

### Grassland / Steppe

| Sphere | Variant Name | Visual Transformation | Palette Shift |
|--------|-------------|----------------------|---------------|
| Energy | **Stormplain** | Scorched earth, perpetual static, blackened grass with ember tips | Black-char, lightning-gold |
| Chaos | **Shimmerfield** | Grass shifts color unpredictably, terrain ripples, nothing stays | Shifting grey-tinged, unstable |
| Order | **Gridlands** | Perfectly geometric grass patterns, unnatural regularity | Clean gold-green, tessellated |
| Force | **Scarfield** | Impact craters, shockwave-flattened zones, upturned earth | Crimson-brown, churned |

### Mountains / Hills

| Sphere | Variant Name | Visual Transformation | Palette Shift |
|--------|-------------|----------------------|---------------|
| Matter | **Crystalpeak** | Crystal growths replacing rock, faceted mineral formations | Deep brown mineral, faceted glint |
| Darkness | **Hollowmount** | Mountains look hollowed out, void-dark caves, rim-lit edges | Near-black, indigo rim |
| Force | **Shatterspine** | Fractured ridgelines, perpetual rockslide, impact-scarred | Crimson-veined grey |

### Swamp / Bog

| Sphere | Variant Name | Visual Transformation | Palette Shift |
|--------|-------------|----------------------|---------------|
| Spirit | **Ghostfen** | Pale mist, translucent water, spectral vegetation | Washed violet-grey |
| Life | **Festermire** | Hyper-fecund, bubbling with excess growth, dangerous vitality | Vivid toxic green |
| Entropy | **Dryrot** | Drained, cracked mud, collapsed vegetation, desiccated | Dried brown, ghostly grey-green |

### Desert / Badlands

| Sphere | Variant Name | Visual Transformation | Palette Shift |
|--------|-------------|----------------------|---------------|
| Time | **Echolands** | Layered temporal ruins visible through sand, multiple eras | Amber-orange, ghostly |
| Matter | **Glasswaste** | Sand fused into dark glass plains, crystalline formations | Dark obsidian, deep brown facets |
| Light | **Brightdunes** | Only biome that gets brighter — radiating pale gold warmth | Warm pale gold (exception to dark rule) |

### Glacier / Tundra

| Sphere | Variant Name | Visual Transformation | Palette Shift |
|--------|-------------|----------------------|---------------|
| Entropy | **Thawfield** | Collapsing ice, fracturing permafrost, accelerated decay | Steel-blue fragments, grey-green melt |
| Darkness | **Voidice** | Ice becomes near-black, absorbs light, terrifying | Pure black with faint indigo rim |
| Life | **Bloomfrost** | Impossible flowers growing through ice, vibrant against white | Bright green-on-white (striking) |

### Ocean / Water

| Sphere | Variant Name | Visual Transformation | Palette Shift |
|--------|-------------|----------------------|---------------|
| Mind | **Dreamsea** | Water becomes mirror-still, reflects things that aren't there | Deep blue, mirror-silver |
| Chaos | **Maelstrom** | Perpetual turbulence, whirlpools, unpredictable currents | Dark grey-blue, froth-white |
| Spirit | **Ghostwater** | Translucent to impossible depth, shipwrecks visible, voices | Pale blue-grey, eerie clarity |

## Color Changes (2026-03-05)

Three sphere color updates approved alongside this design:

| Sphere | Old | New | Bright Old | Bright New | Rationale |
|--------|-----|-----|-----------|-----------|-----------|
| **Entropy** | `#5a7a8a` | `#5a8a7a` | `#7a9aaa` | `#7aaa9a` | Ghostly sea-green — what Life looks like after it drains away |
| **Chaos** | `#8a2be2` | `#8a8a8e` | (none listed) | `#aaaab0` | Neutral grey — the unsorted mix of all opposites, visual static |
| **Matter** | `#c4956a` | `#8b6b4a` | `#dab088` | `#a8886a` | Deep umber brown — denser, heavier, more mineral |

## Prompt Template: Terrain Tile

```
[Biome name] terrain seen from directly above at great height, god's-eye view.
[2-3 sentences describing terrain features: tree clusters, ridgelines, water, etc.]
Background color: [biome hex color]. Dim overcast lighting, subtle shadows for depth.
Dark fantasy painterly style, visible brushstrokes, textural.
No magic, no glowing elements, no sphere colors, no luminous effects.
No text, no UI, no labels, no hex borders, no modern elements.
Designed for small display (48-96px). Bold shapes, clear silhouettes.
```

## Prompt Template: Magic Overlay

```
Semi-transparent magic effect on black/transparent background.
[Sphere name] sphere magic: [sphere color hex] threads in [form language description].
Concentrated, bright, covering only 10-20% of the image area.
Rest of image is transparent/black. Threads are intensely bright and saturated.
No terrain, no landscape, no background scenery — pure magic effect only.
```
