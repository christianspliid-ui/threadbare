# Visual Asset Strategy & Recommendations

**Date:** 2026-03-10
**Status:** Proposal
**Depends on:** `2026-03-05-asset-pipeline-overview.md`, `STYLE.md`

## Current State Assessment

### What We Have (Strong Foundation)

The infrastructure side is in excellent shape:

- **STYLE.md** (471 lines) — Comprehensive visual bible covering palette, form language for all 12 spheres, hex prompt templates, content-type art direction, and exclusion rules. This is genuinely production-quality art direction.
- **Hex tile pipeline** — `generate-hex-tile.py` automates Gemini API → center-crop → hex alpha mask → transparent PNG. Batch mode works. 13 built-in biome presets.
- **61 production hex tiles** — 41 terrain bases + 19 location overlays + broken-lands. The core hex map has real art.
- **Asset mapping code** — `hex-tile-assets.ts` cleanly maps 49 terrain types and 20 location subtypes to PNG files, with helper functions for URL generation.
- **12 art direction packages** — Actors (3), artifacts (3), factions (3), locations (3), doom (3+index) with detailed mood, palette, and composition specs.
- **Design reference tooling** — `style-tile.html`, contact sheets, comparison pages for QA review.

### What's Missing (The Gaps)

| Category | Count Needed | Current State | Impact |
|----------|-------------|---------------|--------|
| Sphere icons | 12 | Emoji placeholders (⚡🪨🔥🌿🧠👻⏳🌀) | Appears in every panel — highest visual ROI |
| Magic overlays | 12 | Code mapped, zero files | Sphere magic invisible on hex map |
| Key screen paintings | 5-7 | None | No proof of Threadbare identity |
| UI textures/chrome | ~8 tileable | Flat Tailwind colors | Panels feel generic, not dark fantasy |
| Divine Toolkit icons | 9 | Emoji glyphs in SVG wheel | Player-facing intervention UI looks placeholder |
| Character portraits | 30-50 | Zero produced (3 packages ready) | Agents/rivals are faceless |
| Doom visuals | 7 icon + 7 overlay | Concept packages only | Doom system has no visual weight |
| Terrain gap fills | ~9 | 8KB placeholder clear-* tiles | Some hexes visually broken |

### Grade Card

| Dimension | Grade | Notes |
|-----------|-------|-------|
| Art direction / style guide | **A** | STYLE.md is thorough, opinionated, and consistent |
| Asset pipeline tooling | **A-** | Hex pipeline works; no batch pipeline for non-hex art yet |
| Terrain hex tiles | **B+** | 41 real tiles, but ~9 placeholders and no magic overlays |
| Location overlays | **A-** | 19 well-styled overlays covering all settlement/structure types |
| Icons & symbols | **F** | Everything is emoji. Zero custom icons produced. |
| Key illustrations | **F** | No screen paintings, no mood art, no visual identity proof |
| UI textures | **D** | Frosted glass CSS looks decent but no actual dark-fantasy chrome |
| Character/entity art | **F** | Art direction packages exist but zero final art |

**Summary:** Excellent art direction infrastructure, strong hex terrain pipeline, but almost zero "final mile" asset production outside terrain tiles. The game's visual identity exists on paper (STYLE.md) but not on screen.

---

## Recommended Way Forward

### Strategy: "Three Sprints, Biggest Bang First"

Rather than trying to produce everything at once, attack assets in three focused sprints targeting the highest-visibility gaps first. Each sprint can be done in a single Cowork session using the MCP image generation tools.

### Sprint 1: "The Identity Sprint" (DO FIRST)

**Goal:** Make the game *look* like Threadbare in 30 minutes of generation work.

| Item | Count | Tool | Time Est. |
|------|-------|------|-----------|
| ART-01: Sphere icons | 12 | MCP `generate_image`, 1:1, 64px | 15 min |
| ART-06: Hex map background fix | 1 | CSS one-liner | 1 min |
| ART-03: Title screen painting | 1 | MCP `generate_image`, 16:9, quality | 5 min |
| ART-05: Clear-tile gap fills | 7 | `generate-hex-tile.py --batch` | 10 min |

**Why this order:**
1. Sphere icons appear in *every* panel — EssencePanel, SphereSliders, ArchetypeCards, the Divine Toolkit wheel. Replacing emoji with proper icons transforms the entire UI in one stroke.
2. The hex map background is a one-line CSS change that immediately makes the map feel dark and atmospheric instead of washed out.
3. A single title screen painting proves the Threadbare aesthetic is real. It becomes the emotional anchor for the whole project.
4. The clear-tile placeholders (8KB each) are visually broken hexes. Proper tiles close the terrain coverage gap.

**Prompt approach for sphere icons:**
Use STYLE.md's form language definitions directly. Each icon should be a glowing sphere-colored symbol on a dark charcoal background, rendered in the painterly oil style. Example for Force: "A sharp directional streak of crimson (#ff4444) energy radiating outward, impact lines suggesting kinetic force, on dark charcoal background. Painterly oil style, thick impasto brushwork. 64x64 icon. No text."

### Sprint 2: "The Magic Sprint" (DO SECOND)

**Goal:** Make sphere magic visible on the hex map and give the intervention UI real icons.

| Item | Count | Tool | Time Est. |
|------|-------|------|-----------|
| ART-02: Magic overlay tiles | 12 | MCP `generate_image`, 1:1 | 20 min |
| ART-07: Divine Toolkit icons | 9 | MCP `generate_image`, 1:1, 48px | 10 min |
| ART-04: World-Soul painting | 1 | MCP `generate_image`, 16:9, quality | 5 min |

**Why:** After Sprint 1 establishes identity, Sprint 2 fills the two most player-facing gaps: magic visualization (the core mechanic) and the intervention picker (the core interaction). The World-Soul painting completes the Harvest screen.

**Magic overlay approach:** Follow STYLE.md's overlay template exactly. Semi-transparent effects on black background, sphere-specific form language, 10-20% coverage. These composite on top of any terrain tile — test compositing in `style-tile.html` after generation.

### Sprint 3: "The Atmosphere Sprint" (DO WHEN READY)

**Goal:** Replace flat Tailwind panels with dark fantasy chrome.

| Item | Count | Tool | Time Est. |
|------|-------|------|-----------|
| ART-12: UI textures (tileable) | 4-6 | MCP `generate_image`, 1:1, 256px | 15 min |
| ART-15: Ascendant selection | 1 | MCP `generate_image`, 16:9 | 5 min |
| ART-16: Harvest paintings | 2 | MCP `generate_image`, 16:9 | 10 min |
| ART-17: Loading art | 2 | MCP `generate_image`, 16:9 | 5 min |

**UI texture approach:** Generate tileable dark stone, aged parchment, thread-veined dark surface, and ornamental border patterns. Apply as CSS background-image on panel containers. This transforms the entire UI feel without touching component logic.

### Things to Defer

**Character portraits (ART-08/09/10):** Wait for Phase 6 agent detail panel design. Generating portraits now risks producing art at the wrong size/aspect/style for a UI that doesn't exist yet.

**Doom visuals (ART-13/14):** The doom system works mechanically but the Unmaking visualization needs UI design first. Art direction packages are ready when the time comes.

**Terrain variants (ART-18):** Sphere-saturated terrain transformations are a polish item. The base terrain set needs to be complete and consistent first.

---

## Quality Control Approach

### For Each Generated Asset:

1. **Generate** using MCP with STYLE.md-derived prompts
2. **Review** side-by-side with existing assets in `Design/style-tile.html`
3. **Iterate** if needed — adjust prompt, re-generate (keep canonical template structure)
4. **Process** — hex tiles through `clip-hex-tiles.py`, icons resize to target dimensions
5. **Place** in `/public/hex-tiles/` or new `/public/icons/` or `/public/screens/`
6. **Wire** in code — update `hex-tile-assets.ts` or component imports
7. **Verify** in running game — `npm run dev` on user machine

### Consistency Checks:

- All terrain tiles should use the canonical hex prompt template (STYLE.md §Hex Tile System)
- All sphere-related art must use the exact hex color from STYLE.md's sphere palette
- All paintings share: dark moody atmosphere, dim overcast lighting, painterly oil style, muted palette
- No generated image should contain text, UI elements, or modern objects (STYLE.md exclusions)

---

## Open Questions

1. **Sphere icon style:** Pure abstract form language (thread patterns) vs. representational symbols (a flame for Energy, an eye for Mind)? Recommend abstract — matches the Threadbare aesthetic where magic is *threads*, not classical elements.

2. **Icon format:** PNG with transparency vs. SVG? PNG from generation is easiest. SVG would be better for scaling but requires vectorization step. Recommend PNG at 64px master, export at 24/32/48/64.

3. **Magic overlay opacity:** STYLE.md says 10-20% coverage. Need to test compositing at different opacity levels to find the sweet spot where magic is visible but terrain reads clearly underneath.

4. **UI texture tiling:** Generated textures may have visible seam artifacts when tiled. May need post-processing to create seamless tiles. Test with CSS `background-repeat` before committing.

5. **Batch generation session:** Should we generate all Sprint 1 assets in a single focused session, or iterate one category at a time? Recommend single session — easier to maintain style consistency when generating in sequence.
