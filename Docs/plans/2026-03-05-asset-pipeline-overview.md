# Asset & Content Pipeline Overview

**Date:** 2026-03-05
**Purpose:** Map all visual asset needs against current implementation status, and propose a phased production plan.

---

## Where We Are

Phases 1–5B are complete: the full engine (graph, agents, resolution, doom, rivals, narrative, world-soul, echoes, chronicle) and a first-pass UI (GameView, DoomBar, NarrativeFeed, RivalPanel, HarvestScreen, EssencePanel, AgentWheel, StrandView, HexMap). The vertical slice runs end-to-end — world seeds, ticks advance, agents act, doom escalates, cycles end.

**Phase 6 (Player Interaction Layer)** is the next code milestone: Divine Toolkit UI, agent detail panel, mandate tracker, location detail. This is currently in the design stage.

Visually, everything is **functional but placeholder**. UI is Tailwind CSS with emoji icons, flat color bars, and CSS-only glows. No illustrated assets, no painted textures, no portraits. The Threadbare style (STYLE.md) is fully defined but not yet applied to the game.

---

## Asset Categories

Seven categories of visual work, ordered from foundational to polish.

### 1. Sphere Icon Set (12 icons)

**What:** One icon per sphere — 4 Foundation + 8 Creation — each using the sphere's color AND form language from STYLE.md. Used everywhere: EssencePanel bars, ArchetypeCards, SphereSliders, CosmologyPanel, echo cards, narrative accents.

**Currently:** Emoji placeholders (⚡🪨🔥🌿🧠👻⏳🌀 etc.)

**Spec per icon:**
- Size: 64×64px master, export at 24/32/48/64
- Style: Dark background, single sphere's magic threads in characteristic form
- Must be identifiable by silhouette alone (form language), not just color

| Sphere | Color | Form Language |
|--------|-------|---------------|
| Chaos | `#8a2be2` | Fractals, turbulent swirls |
| Order | `#d4af37` | Geometric grids, tessellations |
| Light | `#ffeb99` | Expanding aureoles, radiant beams |
| Darkness | `#4a3a8a` | Absorbing voids, rim-glow |
| Force | `#ff4444` | Sharp directional streaks, impact radiants |
| Matter | `#c4956a` | Crystalline lattices, hexagonal facets |
| Energy | `#ffd700` | Radiating spikes, star-burst coronas |
| Life | `#00cc55` | Organic branching, veins, mycelium |
| Mind | `#2288ff` | Neural dendrites, concentric rings |
| Spirit | `#aa44dd` | Ascending wisps, ethereal ribbons |
| Time | `#ff9933` | Concentric ripples, overlapping echoes |
| Entropy | `#5a7a8a` | Fracturing patterns, scattering particles |

**Dependency:** None — can start now. These icons plug into every screen.

---

### 2. Divine Toolkit Icons (9 icons)

**What:** One icon per intervention type. Used in AgentWheel (radial menu) and future Divine Toolkit UI panel.

**Currently:** Emoji glyphs in SVG wheel slots.

| Intervention | Current Emoji | Suggested Form |
|-------------|---------------|----------------|
| Scry | 👁️ | Eye with thread-veins radiating outward |
| Dream | 💭 | Sleeping silhouette with swirling threads above |
| Persuade | 💬 | Open hand with golden threads flowing outward |
| Deceive | 🎭 | Split mask with shadow threads behind |
| Intimidate | 💀 | Dark presence with descending pressure threads |
| Inspire | ✨ | Ascending figure with upward-rising threads |
| Coincidence | 🎲 | Intersecting thread paths, a knot of convergence |
| Omen | 🌙 | Celestial sign with trailing thread filaments |
| Afflict/Bless | ⚡ | Dual icon — withering threads (afflict) / blooming threads (bless) |

**Spec:** 48×48px master, Threadbare dark style, gold-amber primary with sphere-tinted variants.

**Dependency:** Sphere icons (category 1) inform the visual language. Can start once sphere icons establish the thread aesthetic.

---

### 3. Terrain Tile Art (22 biomes)

**What:** Painted hex tile textures for the world map, replacing emoji terrain markers. Each biome needs a distinct visual at the HexTile level.

**Currently:** Flat biome colors + emoji centers (🌊🏔️🌲 etc.). Map background is `#f4e8c1` (light tan — wrong, should be dark).

**Biome list (from terrain generation system):**

| Category | Biomes |
|----------|--------|
| Water | Ocean, Coastal Shallows, Lake, River |
| Lowlands | Grassland, Farmland, Savanna, Steppe |
| Forest | Deciduous Forest, Dense Forest, Taiga, Jungle |
| Wet | Swamp, Bog |
| Elevated | Hills, Mountains, Plateau, Badlands |
| Extreme | Desert, Tundra, Glacier, Volcanic |

**Spec:** Hex-shaped painterly tiles, dark Threadbare palette (10–40% brightness), distinguishable at small size (~60px across). Magic thread overlays rendered separately by code, not baked into tiles.

**Dependency:** Blocks on nothing — but most impactful when the HexMap background is also darkened (a code change, not an art task).

---

### 4. Key Screen Illustrations (5–7 paintings)

**What:** Large atmospheric concept art for the game's major screens and moments. These set the emotional tone and prove out the Threadbare visual identity at scale.

| Screen | Subject | Ratio | Priority |
|--------|---------|-------|----------|
| **Title screen** | Dark landscape with magic threads breaking through — the Threadbare identity image | 16:9 | High |
| **Ascendant selection** | Cosmic void with converging sphere-colored threads forming a divine figure | 16:9 | High |
| **Harvest — Triumphant** | Golden World-Soul pulsing, echoes ascending, warm light | 16:9 | Medium |
| **Harvest — Somber** | Fading world, cold threads dimming, quiet dissolution | 16:9 | Medium |
| **The Unmaking** | World fracturing, all sphere colors tearing free, apocalyptic beauty | 16:9 | Medium |
| **World-Soul** | The cosmic sphere itself — all 8 Creation colors interwoven in a luminous orb | 1:1 | Medium |
| **Loading/transition** | Abstract thread patterns — could be procedural or painted | 16:9 | Low |

**Dependency:** STYLE.md is complete. These can start now — they're the highest-value proof-of-concept for the visual identity.

---

### 5. UI Chrome & Panel Backgrounds

**What:** Dark textured backgrounds, ornamental borders, panel frames, and decorative elements that replace flat Tailwind backgrounds with Threadbare-flavored chrome.

**Components that need treatment:**
- GameView main container (currently `bg-stone-900`)
- EssencePanel sidebar
- RivalPanel sidebar
- NarrativeFeed log area
- DoomBar header strip
- StrandView modal
- HarvestScreen overlay
- AgentWheel ring

**Style direction:** Dark weathered stone textures, subtle thread-vein patterns in borders, gold-amber accent lines. Think aged book covers, dark metal frames, stone tablet edges. Not busy — atmospheric.

**Spec:** Tileable textures (256×256 or 512×512), border/corner SVG elements, panel header treatments.

**Dependency:** Can start now for general texture work. Panel-specific treatments should follow the Phase 6 UI design (layout may change).

---

### 6. Character & Entity Art

**What:** Portraits and visual representations for actors, rival gods, and the player's Ascendant.

**Sub-categories:**

| Type | Count | Size | Use |
|------|-------|------|-----|
| **Rival god portraits** | 8–12 variations | 80×80px | RivalPanel sidebar cards |
| **Agent portraits** | 20–30 archetypes | 32×32px | RetinuePanel, StrandView, Dream Interface |
| **Ascendant forms** | 4–6 archetype variants | 120×120px | AscendantSelection, in-game identity |
| **Faction symbols** | 10–15 | 24×24px | RetinuePanel badges, map markers |

**Style:** Threadbare dark fantasy — figures partially woven from magic threads, not fully rendered photorealistic characters. Rivals should be imposing and alien. Agents should be recognizable archetypes (warrior, scholar, merchant, priest, etc.).

**Dependency:** Heavy dependency on Phase 6 design decisions. Agent detail panel and Dream Interface UI will dictate portrait sizes, placement, and how many variants are needed. **Wait for Phase 6 design before producing final portraits.**

---

### 7. Doom Archetype Visuals (7 sets)

**What:** Visual vocabulary for each doom clock archetype — used in DoomBar, Unmaking sequence, and Great Chronicle volume covers.

| Archetype | Visual Theme |
|-----------|-------------|
| Breach | Cosmic tears, fractured reality, void bleeding through |
| Convergence | Colliding sphere energies, fusion, overwhelming power |
| Changing | Shapeshifting landscapes, identity dissolution |
| Sundering | Tectonic fractures, world splitting apart |
| Failing | Entropy spreading, lights dimming, systems stopping |
| Ascension | Transcendence going wrong, too much light, dissolution upward |
| Reckoning | Judgment, weighing, cosmic audit, all threads pulled taut |

**Per archetype:** DoomBar accent icon (32×32), Unmaking screen overlay/background (16:9), Chronicle volume cover (3:4).

**Dependency:** Can start concept work now. Final production assets depend on how the Unmaking is rendered in-game (Phase 6+ territory).

---

## Production Timeline

### What can start NOW (no code dependency)

These asset categories have stable specs and clear placement in the current UI:

1. **Sphere icon set** (12 icons) — plugs into 6+ existing components immediately
2. **Key screen illustrations** (title, selection, harvest) — proves the Threadbare visual identity at scale
3. **Terrain tile art** (22 biomes) — the hex map is built and working, tiles just need to replace emoji
4. **UI chrome textures** (general dark stone/border treatments) — tileable backgrounds and borders

**Estimated scope:** ~45–55 individual assets across these four categories.

### What should wait for Phase 6 design

These depend on UI decisions that haven't been made yet:

5. **Divine Toolkit icons** — layout of the intervention UI will affect icon size, shape, and context
6. **Character & entity portraits** — agent detail panel design dictates portrait requirements
7. **Doom archetype visuals** — Unmaking screen design determines overlay approach

### What should wait for implementation

8. **UI chrome (panel-specific)** — exact panel layouts may change during Phase 6 implementation
9. **Narrative feed styling** — typography and prose rendering approach needs to be finalized in code
10. **Echo/Chronicle visual treatment** — depends on how the Great Chronicle viewer is built

---

## Suggested Workflow

### Wave 1: Foundation Assets (start now)

Focus on assets that define the visual identity and slot into existing UI:

1. Generate sphere icon concepts (all 12) — test form language readability at small sizes
2. Create 2–3 key screen paintings (title screen, ascendant selection, one harvest variant) — validate Threadbare at scale
3. Produce terrain tile set (22 biomes) — transform the hex map from placeholder to atmospheric
4. Develop general UI textures (dark stone, border treatments) — establish the chrome vocabulary

**Exit criteria:** The game LOOKS like Threadbare. Dark world, concentrated magic, painterly atmosphere — even with placeholder portraits and no Divine Toolkit UI yet.

### Wave 2: Interaction Assets (after Phase 6 design)

Once Phase 6 design decisions lock the UI layout:

5. Divine Toolkit icons (9 interventions)
6. Agent portrait archetypes (20–30 small portraits)
7. Rival god portraits (8–12 variations)
8. Ascendant form variants (4–6)
9. Panel-specific chrome treatments

**Exit criteria:** All player-facing interaction screens have proper visual assets. No emoji anywhere.

### Wave 3: Narrative & Polish (after Phase 6 implementation)

Final visual layer, dependent on working code:

10. Doom archetype visual sets (7 × 3 assets each)
11. Great Chronicle viewer styling
12. Echo card templates (3 types)
13. Narrative feed typography and event icons
14. Animations and transitions
15. Sound design (separate pipeline, but timed with visual polish)

**Exit criteria:** Release-quality visual presentation across all game states.

---

## Open Questions

1. **Generation vs. hand-art:** How much of this should be AI-generated (via the image-generation skill) vs. hand-crafted? The sphere icons and terrain tiles might benefit from hand-crafted SVG for crispness at small sizes, while key screen illustrations are ideal for AI generation with STYLE.md prompts.

2. **Procedural vs. static for character portraits:** Should agent portraits be fully procedural (assembled from parts at runtime — hair, face, clothing, sphere tint) or a fixed set of archetype illustrations? Procedural gives variety but is harder to art-direct.

3. **HexMap background fix:** The map background is currently `#f4e8c1` (light tan). This is a 1-line code fix to darken it — should we do this immediately as a quick win before any art production?

4. **Phase 6 design timing:** When do we want to lock the Phase 6 interaction UI design? That's the gate for Wave 2 asset production.
