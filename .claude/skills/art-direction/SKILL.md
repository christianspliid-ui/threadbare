---
name: art-direction
description: >
  Use when generating hex tile art, constructing image prompts, working with STYLE.md,
  or making any visual asset decisions. Triggers on "hex tile",
  "art direction", "STYLE.md", "prompt construction",
  "color palette", "sphere color", "lighting", "visual asset", "terrain tile",
  or when generating or evaluating game artwork.
last_validated_against: 2026-08-29
---

# Art Direction — Domain Context

This skill provides visual style and asset pipeline context. Load this before generating art, modifying STYLE.md, or working on the hex tile system.

## Dark Tapestry Aesthetic

The game is **Threadbearer**; its design system is called **Dark Tapestry** — dark world, hidden magic, threads that break through. ("Threadbare" is the repo codename only and must never appear in art or player-facing surfaces.) Key qualities:
- Dark, muted base palette — the world sits at **10–40% brightness** (charcoal, burnt umber, cold slate); no bright daylight, ever
- Magic is the only strong color: **concentrated, threadlike, networked** — 5–15% of image area at 70–100% brightness, never ambient glow or color wash
- Texture-heavy, worn surfaces; painterly oil, not photoreal
- Each of the 12 spheres has a **color AND a form language** (STYLE.md's sphere table) — always specify both; each of the Eight Reaches has a scene tint (STYLE.md § Eight Reaches)
- The ONLY text ever allowed in generated art is the game title **"Threadbearer"** — most images carry no text at all

## Source of Truth Files

### STYLE.md
The authoritative source for all visual style decisions:
- Color definitions (hex values, usage rules) and the sphere color + form-language table
- Art direction principles, lighting rules, magic-spectrum-by-content-type
- **The canonical hex prompt template** (§ Hex Prompt Template) — do not deviate from its structure
- Prompt construction guidelines and exclusions

**Always read STYLE.md before constructing any image prompt.**

### Asset registries
- **`src/data/hex-tile-assets.ts`** — the authoritative registry of every hex terrain tile, clear fill, and location overlay icon. **Asset existence rule:** if an asset isn't mapped there, it doesn't exist in the game; register new assets there when creating them.
- **`?view=styleguide`** — the living visual reference for shared UI components (UI Law 29).

*(The rendered style tile `Design/style-tile.html` was retired 2026-08-29 (THR-1354) — it lived untracked outside git and was lost. The code registry above was already the ground truth and is now the only one.)*

## Hex Tile Pipeline

Use the `image-manipulation` skill for the technical pipeline (geometric clipping, alpha masks, bundled scripts). This skill covers the *art direction* layer:

- Terrain types have associated color palettes from STYLE.md
- Sphere influence overlays use the sphere's signature color + form language
- Size tiers define resolution and detail level
- All tiles must pass the Dark Tapestry check: dark base (10–40%), luminous concentrated accents, textured

## Prompt Construction

When building prompts for image generation:
1. Start with the structural description (what the tile depicts)
2. Apply STYLE.md's prompt structure (§ Prompt Construction Guide) — narrative-first, elements ordered by importance
3. Include sphere-specific color **and form language** if applicable
4. Apply lighting rules from STYLE.md (magic is the light source; concentrated, never ambient)
5. Include exclusions (no text, no UI, no modern elements — plus the content-type's known failure modes)
6. Use the `image-generation` platform skill for the actual API call

## Color System

Sphere colors are defined in STYLE.md and must be used consistently across:
- Hex tile overlays
- UI elements (tokens in `src/index.css` + `src/data/sphereColors.ts` — see `frontend-ui` skill; never hardcode sphere hexes in components, UI Law 30)
- Prose flavor text markers
- Any visual representation of sphere influence

When changing a sphere color, update: STYLE.md → `src/index.css` sphere tokens + `src/data/sphereColors.ts` → any affected UI components → changelog. Same session.
