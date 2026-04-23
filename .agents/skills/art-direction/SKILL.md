---
name: art-direction
description: >
  Use when generating hex tile art, constructing image prompts, working with STYLE.md,
  updating the style tile, or making any visual asset decisions. Triggers on "hex tile",
  "art direction", "Threadbare", "STYLE.md", "style tile", "prompt construction",
  "color palette", "sphere color", "lighting", "visual asset", "terrain tile",
  or when generating or evaluating game artwork.
---

# Art Direction — Domain Context

This skill provides visual style and asset pipeline context. Load this before generating art, modifying STYLE.md, or working on the hex tile system.

## Threadbare Aesthetic

The visual identity is called **Threadbare** — dark world, hidden magic, threads that break through. Key qualities:
- Dark, muted base palette
- Luminous accents from sphere-associated colors
- Texture-heavy, worn surfaces
- Magic expressed as glowing threads, fractures, or emanations — not flashy particle effects

## Source of Truth Files

### STYLE.md
The authoritative source for all visual style decisions:
- Color definitions (hex values, usage rules)
- Sphere form language (how each sphere's influence looks visually)
- Art direction principles
- Lighting rules
- Prompt construction guidelines (what to include, how to structure)
- Exclusions (what the visual style explicitly avoids)

**Always read STYLE.md before constructing any image prompt.**

### Design/style-tile.html
HTML visualization of STYLE.md:
- Color swatches and gradients
- UI chrome samples
- **Master registry of all hex tile assets** — terrain tiles, clear fills, overlay icons, size tiers, active/reserve status

**Coupling rule:** Style tile must always reflect STYLE.md. Update both in the same session. Never leave them diverged.

**Asset existence rule:** If an asset isn't in the style tile's "Hex Asset Legend" section, it doesn't exist in the game. Register new assets there when creating them.

## Hex Tile Pipeline

Use the `image-manipulation` skill for the technical pipeline (geometric clipping, alpha masks, bundled scripts). This skill covers the *art direction* layer:

- Terrain types have associated color palettes from STYLE.md
- Sphere influence overlays use the sphere's signature color
- Size tiers define resolution and detail level
- All tiles must pass the Threadbare aesthetic check: dark base, luminous accents, textured

## Prompt Construction

When building prompts for image generation:
1. Start with the structural description (what the tile depicts)
2. Add Threadbare aesthetic modifiers from STYLE.md
3. Include sphere-specific form language if applicable
4. Apply lighting rules from STYLE.md
5. Include exclusions (what to avoid)
6. Use the `image-generation` platform skill for the actual API call

## Color System

Sphere colors are defined in STYLE.md and must be used consistently across:
- Hex tile overlays
- UI elements (see `frontend-ui` skill)
- Prose flavor text markers
- Any visual representation of sphere influence

When changing a sphere color, update: STYLE.md → style-tile.html → any affected UI components → changelog. Same session.
