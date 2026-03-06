# Art Prompt Model — Design Rationale

**Date:** 2026-03-06

---

## Context

The existing prompt templates in STYLE.md used a one-size-fits-all approach: every image got the same structure (subject + "dark fantasy oil painting" + magic threads + keyword-stacked exclusions). This led to:

- **Too much magic and color** in images that should have been neutral (terrain, locations, events)
- **No camera or composition control** — the model chose random framing and viewpoint
- **Vague lighting** — "chiaroscuro" with no direction, temperature, or spatial logic
- **Keyword stacking instead of narrative** — lists of adjectives instead of cohesive scene descriptions
- **No distinction between content types** — some need magic baked in, others need it as a compositable overlay

This document records the decisions made to fix these problems.

---

## Decision 1: Magic Spectrum

**Problem:** Not all content types should include magic in their base images. Some are meant to be overlaid with sphere effects in-engine; others are fixed, complete assets.

**Solution:** Define a magic spectrum by content type.

| Content Type | Magic Level | Rationale |
|---|---|---|
| **Hex terrain tiles** | None | Magic is a separate compositable overlay (Component C in the UI). Terrain tiles must be re-usable across all sphere combinations. A "cursed swamp" or "sacred forest" effect is applied at runtime, not baked into the base art. |
| **Locations** | None | Locations can appear on any terrain type under any sphere influence. Magic blessing/corruption is shown as an overlay in-engine. The establishing shot shows pure architecture, untouched. |
| **Factions (heraldry)** | None | Factions are mobile — they move agents across locations. Their visual identity is a coat of arms or battle banner, not a place. Magic empowerment (if shown) is an overlay effect. |
| **Actors (game asset)** | Signature thread | One subtle sphere-colored thread in clothing, gear, or skin hints at alignment without dominating the image. This is the "tell" — not a display of power. A Force-aligned warrior has a crimson thread in their armor; a Shadow actor has a dark thread woven through their cloak. |
| **Artifacts (game asset)** | Primary sphere baked | An artifact's resting state already embodies its primary sphere. A Force artifact has crimson threads in the blade; a Veil artifact glimmers with shadow-play. Additional sphere effects (blessing, curse) are overlays. |
| **Events (general)** | None | Base event scenes are neutral in magic tone. Sphere effects applied as overlays for maximum flexibility. The same event structure can look radically different under different sphere influence — a drought looks different blessed by Life versus corrupted by Entropy. |
| **Doom events** | Full | Doom archetypes are fixed per run — no need for compositing. These are dramatic splash art with all magic fully visible and integral. The Breach, The Convergence, The Reckoning each get unique, visually complete art. |

**Impact:** This requires different prompt templates for each tier, with explicit inclusion/exclusion of magic language.

---

## Decision 2: Three-Layer Content Architecture

**Problem:** Asset packages were conflating three different concerns that should have separate owners and workflows:

1. **Creative/narrative** — What is this? What does it look like? What's the story?
2. **Game design** — How does it interact? What rules govern it? What choices does it enable?
3. **Engine/runtime** — What data structure holds it? How is it stored and referenced?

**Solution:** Separate these layers in asset definitions.

| Layer | Responsibility | Owner | Examples |
|---|---|---|---|
| **Content/Creative** | Lore text, art prompts, visual vocabulary, names, personality | Content agent | Narrative description, concept art prompt, vocabulary tags, dialogue style, visual archetype |
| **Game Design** | Actions, mechanical interactions, balance knobs, progression rules | Game design agent | Agent attraction rules, available actions, sphere bias weights, resource costs |
| **Engine/Runtime** | Graph nodes, edges, state properties, serialization, tick updates | Engine code | GraphNode ID, edge types, numeric properties, update functions, persistence |

**Impact:** A designer can write new locations without touching engine code. An engineer can refactor graph logic without rewriting lore. Content can be iterated independently.

---

## Decision 3: Terrain-Neutral Location Art

**Problem:** Locations can appear on any hex terrain type (mountains, forest, grassland, water, etc.). Generating terrain-specific variants would multiply asset count.

**Option A: Terrain-specific variants**
- Generate "Fortress in Jungle," "Fortress in Mountains," "Fortress in Desert," etc.
- Cost: N locations × M terrain types = exponential asset explosion
- Benefit: Ultra-contextualized visuals

**Option B: Terrain-neutral framing**
- Show only the structure against dark atmospheric sky
- No ground-level terrain visible — terrain context comes from the hex itself
- Cost: Minimal additional assets
- Benefit: Single image works across all biomes

**Chosen: Option B.**

**Rationale:** The single-hex zoom interaction design (see Decision 4) establishes terrain context before the location art is shown. When the player clicks a mountain hex, they already see "mountains." Then they see locations in that hex — and the location art is just the structure, clearly set in a dark fantasy world, with no conflicting terrain underneath.

---

## Decision 4: Single-Hex Zoom (UI Design Change)

**Problem:** The original View Levels design had a "Region Level" that showed multiple hexes grouped together. This required:
- Multi-hex region boundaries that had to be computed and managed
- Location art to work across multiple terrain types (see Decision 3)
- Unclear interaction flow (click region → see what? → drill into location?)

**Solution:** Redesign the Region Level as a single-hex zoom.

**New interaction flow:**
1. Hex map (100-hex world grid)
2. Click a hex → see all locations in that hex (expanded view)
3. Click a location → see location detail panel

**Impact:**
- **Simpler:** No multi-hex region boundaries to manage
- **Location art:** Doesn't need terrain variants (Decision 3)
- **Clearer:** The hex already shows biome context before the location art appears
- **Documentation:** View Levels in Obsidian vault needs updating (World Level → Hex Zoom Level → Location Level instead of World → Region → Location)

---

## Decision 5: Dual-Image Variants for Actors & Artifacts

**Problem:** A single image can't serve both purposes well:
- **In-game UI** needs a dark neutral background (to composite cleanly over panels, status screens, inventory)
- **Codex/lore** needs an evocative scene with environment (for flavor, loading screens, immersion)

**Solution:** Generate two images per actor and artifact.

| Variant | Purpose | Background | Camera | Use |
|---|---|---|---|---|
| **Game asset** | In-game display, panels, status | Dark neutral (near-black, ~15% brightness) | Tight portrait (85mm equivalent), centered | Composites over UI, inventory, status panels |
| **Lore art** | Codex entries, loading screens, story splash | Evocative scene with full environment | Wider framing (50mm equivalent), contextual positioning | Standalone illustration, codex, loading screens, campaign replay cinematics |

**Examples:**
- **Actor variant A (game asset):** Warrior against dark background, clear silhouette, one crimson thread visible, ready for UI overlay
- **Actor variant B (lore art):** Same warrior in a ruined temple, surrounded by broken statues, crimson thread glowing, weathered stone and shadow
- **Artifact variant A (game asset):** Sword centered on dark background, threads clearly visible, perfect for inventory slot
- **Artifact variant B (lore art):** Sword resting on an altar, carvings glowing faintly, candlelight catching the blade, story-ready

**Impact:** Actors and artifacts get two entries in the asset JSON (or a dual-variant structure), increasing asset count but solving both use cases.

---

## Decision 6: Factions as Heraldry

**Problem:** Early concepts treated factions like locations — establishing shots of faction headquarters. But factions are not places; they're mobile groups.

**Solution:** Make faction art a **coat of arms / battle banner** — stylized heraldic design, not an architectural scene.

**Format:**
- **Aspect ratio:** 3:4 (vertical, banner-like)
- **Camera:** Orthographic (flat, no perspective distortion)
- **Subject:** Heraldic device in faction colors, on aged cloth or dark metal
- **Lighting:** Even, dramatic but not theatrical; emphasize the heraldic geometry
- **Magic:** None in base design — empowerment effects (if shown) are overlays

**Rationale:** Factions are armies, merchant guilds, religious orders — mobile entities. Their visual identity is a banner you'd see fluttering above a marching column, not a building you'd visit. Heraldry is modular and recognizable at small scale (crucial for the hex map and agent panels).

---

## Decision 7: Doom as Event Subtype

**Problem:** Doom events were treated as a separate content type. This suggested they'd get the same treatment as regular events (base image + overlays). But doom is special.

**Solution:** Treat doom as a **subtype of events**, not a sibling category. Doom events get **full magic baked in**.

**Rationale:**
- **Fixed per run:** The Breach, The Convergence, The Reckoning are specific doom archetypes chosen at run start. No flexibility needed.
- **No compositing:** Each doom has one definitive visual, not a base that gets modified by overlays.
- **Dramatic:** These should be the most visually striking images in the game — full-power splash art, all sphere magic visible and integral.

**Prompt style:** Flat, dramatic splash art. Full saturation on sphere colors. Apocalyptic scale. Direct theatrical lighting.

**Compare:**
- **Regular event:** "Plague spreads through the village" — base shows neutral village scene, spirit overlays show Life/Entropy corruption
- **Doom event:** "The Convergence" — shows the world breaking apart, all spheres tearing through reality, complete in one image

---

## Prompt Engineering Improvements

Based on research into Nano Banana 2 model behavior (see `2026-03-06-nano-banana-prompt-research.md`), several prompt structure changes were made.

### Changed: Prompt Structure Order

**Before:**
```
[Subject] in the style of [medium], [world tone], with [magic effects], [lighting],
[style anchors], [artist refs], [exclusions]
```

**After:**
```
[Subject — full narrative]. Camera: [specific framing]. Lighting: [direction and temperature].
[Magic — if tier allows]. Style: [medium with artist refs]. World: [tone]. [Exclusions — minimal].
```

**Rationale:** NB2 weights earlier elements more heavily in the prompt. By moving camera and lighting earlier (right after subject), we gain better control over framing and illumination. Generic style declarations belong later, as they're refinements.

### Changed: Narrative Over Keywords

**Before:**
```
Painterly brushstrokes, atmospheric depth, dramatic chiaroscuro, rich texture,
oil painting technique, moody palette
```

**After:**
```
This is an ancient warrior with a scar across their left cheek, wearing dented plate armor
streaked with dried blood and dust. A single crimson thread runs through the armor plates,
barely visible in the shadows. They stand alone, breathing heavily, as if they've just
survived something terrible.
```

**Rationale:** Full narrative descriptions ground the model in a coherent scene. Style emerges naturally from the description instead of being keyword-stacked. The model generates more cohesive, less hallucinatory results.

### Changed: Camera Language Added

**Before:** No camera specification in any template. The model chose random framing.

**After:** Content-type-specific camera defaults embedded in every prompt.

**Examples:**
- **Locations:** "85mm architectural photography, centered composition, symmetrical framing" → emphasizes building geometry
- **Actors (game asset):** "85mm portrait, tight framing at shoulders, centered" → ready for UI compositing
- **Artifacts:** "90mm macro photography, slightly overhead angle, centered on the object" → shows detail and sphere threads
- **Terrain:** "55mm wide landscape, horizon at upper third" → shows biome scale and atmosphere
- **Doom:** "45mm wide disaster photography, chaotic composition, multiple focal points" → captures apocalyptic scale

### Changed: Lighting Specificity

**Before:**
```
Magic provides the primary illumination, deep chiaroscuro, rich shadows, mystical glow
```

**After:**
```
Rembrandt lighting from upper-left, warm amber key light breaking through storm clouds,
deep blue-grey shadows pooling in the eastern corners. The only bright element is the
crimson thread, which glows faintly like molten metal.
```

**Rationale:** Named lighting patterns (Rembrandt, butterfly, split) are consistent. Specifying direction, temperature, and key/shadow relationships gives the model clear spatial logic. Magic glows are positioned relative to the scene, not floating.

### Changed: Negative Prompting Strategy

**Before:**
```
Exclusions: No bright colors, no sunny lighting, no cartoon style, no anime,
no smooth textures, no digital painting, no watercolor
```

**After:**
```
The world exists in perpetual deep twilight. Environmental colors sit between 10–40%
brightness. Warm tones are earthy or metallurgical (rust, copper, amber). Cool tones
are deep (slate, indigo, charcoal). No neon. No pastels. No bright greens.
```

Then only 2–3 critical exclusions for known failure modes:
```
Avoid: anime-style proportions, vignette darkening, excessive bloom
```

**Rationale:** Positive descriptions of desired atmosphere (like a lighting spec) are more reliable than a block of "don't do X." The model can't always disambiguate multiple exclusions. A few critical blocks for known failure modes are enough.

### Changed: Content-Type-Specific Artist References

**Before:**
```
Digital painting style inspired by Diablo, Elden Ring, Warhammer 40K
```

**After:** Each content type has its own reference artists tuned to that subject matter.

**Examples:**
- **Locations (architecture):** Simonetti, Mullins, Malevé — architectural fantasy, weathered grandeur
- **Actors (portrait):** Frazetta, Brom, Elmore — dynamic human figures, dramatic lighting
- **Artifacts (small object):** Barlowe, Beksiński — intricate detail, unsettling beauty, organic forms
- **Terrain (landscape):** Bridgeman, Psmith, David A. Hardy — expansive vistas, atmospheric perspective
- **Doom (apocalyptic):** Zdzisław Beksiński, Junji Ito (concept), Moebius — surreal horror, reality breaking

**Rationale:** Different subjects need different visual vocabularies. A great actor portrait artist isn't necessarily good at architecture. By being specific, we avoid the generic "dark fantasy video game" look.

---

## Prompt Template Structure

Each content type now has a prompt template with these sections (in order):

1. **Subject** (2–4 sentences) — What is this? Narrative, not keyword list.
2. **Camera** (1 sentence) — Focal length, framing, composition rules.
3. **Lighting** (2 sentences) — Direction, temperature, key/shadow relationship.
4. **Magic** (optional, 1–2 sentences) — Only if magic tier allows; describe where magic appears.
5. **Style** (2 sentences) — Medium, artist references, texture / surface language.
6. **World tone** (1 sentence) — Positive atmospheric description.
7. **Exclusions** (1–3 lines) — Only critical blockers.

This replaces the old format (subject + style stack + exclusions) and should produce more coherent, better-controlled images.

---

## Files Updated

- **`STYLE.md`** — "Prompt Construction Guide" section rewritten; new "Content-Type Art Direction" section added with category-specific guidelines and magic tiers
- **`Docs/plans/2026-03-06-nano-banana-prompt-research.md`** — Research document on Nano Banana 2 model behavior and prompt optimization findings
- **Image generation skill** — New content-type-specific templates (implementation in progress)

---

## What's NOT Yet Done

- ❌ Asset packages not yet restructured into three-layer separation (Creative/Design/Engine)
- ❌ Obsidian vault notes not yet updated with single-hex zoom redesign (View Levels doc needs rewrite)
- ❌ Notion backlog not yet updated with downstream tasks (asset restructuring, view level docs, test image generation)
- ❌ Image generation skill fully updated with all content-type templates
- ❌ No test images generated with new prompt templates yet — next session task
- ❌ Location art samples (terrain-neutral framing) not yet validated
- ❌ Actor/artifact dual-variant pipeline not yet implemented

---

## Design Rationale Summary

| Decision | Problem | Solution | Trade-off |
|---|---|---|---|
| **Magic spectrum** | All content treated the same | Tiered magic by content type | More template variation |
| **Three-layer architecture** | Concerns conflated | Separate Creative/Design/Engine | More JSON structure |
| **Terrain-neutral locations** | Explosion of variants | Show structure against sky | Relies on hex context |
| **Single-hex zoom** | Unclear region boundaries | One hex = one view | Fewer hexes visible at once |
| **Dual-image variants** | One image can't serve two purposes | Game asset + lore art | Double asset count for actors/artifacts |
| **Factions as heraldry** | Treating factions like locations | Banner instead of building | Less worldbuilding detail per faction |
| **Doom as subtype** | Doom treated like regular events | Full magic, fixed visuals | Less flexibility, more dramatic |
| **Reordered prompts** | Low control over camera/lighting | Subject → Camera → Lighting → … | Longer prompts, better results |
| **Narrative prompts** | Keyword stacking | Full scene descriptions | More engineering needed per type |
| **Artist references** | Generic "dark fantasy" look | Content-type-specific artists | Requires deeper research per type |

---

## Next Session (Layer 3 Planning)

With the art prompt model design complete, the next work is:

1. **Generate test images** using new prompt templates and validate the magic spectrum
2. **Update Obsidian vault** with View Levels redesign (single-hex zoom)
3. **Update Notion backlog** with downstream tasks (asset restructuring, template validation, etc.)
4. **Implement image generation skill** with full content-type templates
5. **Plan Layer 3** (Dream Interface, detection feedback, essence animations) with new visual language in place
