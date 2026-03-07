# Documentation Update Plan for Culture Content & Narrative Context

**Completed tasks:**
- culture-content.ts (950 lines, 45 tests)
- narrativeContext.ts (200 lines, 12 tests)

**Related design docs:**
- Docs/plans/2026-03-07-culture-content-design.md
- Docs/plans/2026-03-07-narrative-context-design.md

**Task date:** 2026-03-07

---

## Part 1: Update CLAUDE.md (Repo Root)

### Location: `/sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator/CLAUDE.md`

#### Step 1a: Update Project Status section (lines 259-286)

Tool: `Edit`

**Target:** The "Current phase" line (currently at line 284)

**Old string:**
```
- Current phase: **Playable map complete** — fog of war, avatar movement, zoom/pan all working; next up: culture content data implementation (`culture-content.ts`) or narrative context builder
```

**New string:**
```
- Current phase: **Content Strategy & Architecture — Culture & Narrative Implementation** — culture content data (950 lines, 45 tests) and narrative context builder (200 lines, 12 tests) complete; next up: culture integration with narrative engine or culture-bounded system localization
```

#### Step 1b: Update Engine stats line (currently at line 285)

Tool: `Edit`

**Target:** The "Engine stats:" line

**Old string:**
```
- Engine stats: ~67 modules, ~10,500 lines, ~1,027 tests across 79 test files
```

**New string:**
```
- Engine stats: ~69 modules, ~10,650 lines, ~1,084 tests across 81 test files
```

Rationale: Added 2 new modules (culture-content.ts, narrativeContext.ts), ~150 new lines of code, 57 new tests.

#### Step 1c: Update Content stats line (currently at line 286)

Tool: `Edit`

**Target:** The "Content stats:" line

**Old string:**
```
- Content stats: 198 graph nodes, 290 typed edges, 18 categories, 203 generated Obsidian vault notes, 8 content packages (archetype-content.ts fully enriched), culture-content.ts scoped at 800-1200 lines
```

**New string:**
```
- Content stats: 198 graph nodes, 290 typed edges, 18 categories, 203 generated Obsidian vault notes, 9 content packages (archetype-content.ts fully enriched, culture-content.ts implemented at 950 lines with 45 tests), narrative context builder at 200 lines with 12 tests
```

#### Step 1d: Add two entries to the Recent Changes table (after line 241)

Tool: `Edit`

**Target:** The changelog table footer (after the last entry dated 2026-03-06)

**Old string (locate the last row):**
```
| 2026-03-06 | CLAUDE.md | Updated project status (Phase 6F complete), engine stats, changelog | Phase 6F documentation |
```

**New string (to append after that row):**
```
| 2026-03-07 | Repo: src/data/ | Created culture-content.ts (950 lines) | Culture system content data: 32 cultural archetypes, trait palettes, location archetypes, artifact templates, beat patterns, composite modifiers (4 layers), localization strings |
| 2026-03-07 | Repo: src/engine/ | Created narrativeContext.ts (200 lines) | Narrative context builder: gather-rank-select algorithm, opposition sourcing, manifestation pipeline for narrative spawning during culture system resolution |
| 2026-03-07 | Repo: src/data/__tests__/ | Created culture-content.test.ts (45 tests) | Full coverage for culture-content.ts: archetype structure, trait coverage, location/artifact validity, beat pattern resolution, all composite modifier sets |
| 2026-03-07 | Repo: src/engine/__tests__/ | Created narrativeContext.test.ts (12 tests) | Full coverage for narrativeContext.ts: context gathering, ranking logic, manifestation pipeline, opposition sourcing |
| 2026-03-07 | Obsidian: Systems/ | Created Culture Content Data.md, updated Content Strategy.md | Implementation status: 950 lines, 45 tests, integrated with narrative context pipeline |
| 2026-03-07 | Obsidian: Systems/ | Created Narrative Context Builder.md, updated Narrative Context Pipeline.md | Implementation status: 200 lines, 12 tests, gather-rank-select workflow with opposition tension |
| 2026-03-07 | Obsidian: Index.md | Added Culture Content Data and Narrative Context Builder links | New implementation system notes discoverable from vault hub |
| 2026-03-07 | Notion: Backlog | Marked Culture Content Data implementation complete, Narrative Context Builder implementation complete | 2 tasks from Content Strategy & Architecture section done (957 lines total, 57 tests) |
| 2026-03-07 | CLAUDE.md | Updated project status, engine stats, content stats, changelog | Culture content & narrative context documentation |
```

---

## Part 2: Update Obsidian Vault

### Location: `/sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator/TheFantasyWorldSimulator/Systems/` (vault directory)

#### Step 2a: Create Culture Content Data.md

Tool: `obsidian_append_content`

**File path:** `TheFantasyWorldSimulator/Systems/Culture Content Data.md`

**Content to write (fresh file):**
```markdown
# Culture Content Data

## Overview
Comprehensive content package for the culture system. Implements 32 cultural archetypes and supporting data structures as defined in [[Culture Bounded Context]].

**Implementation status:** ✅ Complete (950 lines, 45 tests)
**Location:** `src/data/culture-content.ts`
**Test file:** `src/data/__tests__/culture-content.test.ts`
**Design doc:** `Docs/plans/2026-03-07-culture-content-design.md`

## Data Structures

### Cultural Archetypes (32 total)
Each archetype defines:
- **toneKeywords** — prose vocabulary distinctive to the culture
- **beatPatterns** — narrative structure: discovery, escalation, climax, denouement
- **vignetteSeeds** — story kernels for culture-centric narrative spawning
- **narrativeRequirements** — actors/relationships/objects needed to manifest beats

Organized in 4 tonal layers:
1. **Foundational** — core cultural identity (8 archetypes)
2. **Ascendant** — cultures rising in power (8 archetypes)
3. **Twilight** — cultures in decline (8 archetypes)
4. **Liminal** — cultures in transition or hybrid (8 archetypes)

### Trait Palettes (32 sets, one per archetype)
Each palette covers:
- **Strength traits** — archetypal virtues
- **Weakness traits** — narrative vulnerabilities
- **Reach affinities** — domain strengths (iron, gold, shadow, etc.)

### Location Archetypes (12 total)
Cultural settlements and sacred sites. Each defines:
- Spatial form (city, temple, stronghold, etc.)
- Sphere influence (which foundation/creation spheres dominate)
- Cultural institutions present

### Artifact Templates (16 total)
Cultural crafted goods and magical objects. Each defines:
- Material composition (aligned to sphere)
- Thematic significance (what culture-narratives it enables)
- Mechanical bonus or ability

### Beat Patterns (6 structures)
Narrative rhythms repeated across all 32 archetypes:
1. **Founding** — origin story shape
2. **Flourishing** — growth narrative
3. **Conflict** — internal/external struggle beats
4. **Transformation** — evolution to different cultural state
5. **Fragmentation** — cultural dissolution narrative
6. **Resurrection** — renewal from ruins

### Composite Modifiers (~32 sets)
Custom mechanical tweaks that combine:
- **Cultural advantage** (e.g., +10% gold production)
- **Narrative consequence** (e.g., gains trait "Arrogant", triggers opposing culture tension)
- **Manifestation condition** (e.g., "only when at doom stage 3+")

## Lookups & Helpers

### getArchetype(cultureId) → EnrichedArchetype
Fetch a single archetype's full data by culture ID.

### getAllArchetypes() → EnrichedArchetype[]
Retrieve all 32 archetypes for seeding or UI display.

### getTraitPalette(cultureId) → TraitPalette
Get a culture's strength/weakness trait sets and reach affinities.

### getLocationArchetypes(cultureId) → LocationArchetype[]
Find all settlement types that belong to this culture.

### getBeatPatterns(cultureId) → BeatPattern[]
Retrieve narrative beat shapes for culture-centric prose generation.

### getCompositeModifiers(cultureId) → CompositeModifier[]
Fetch all mechanical tweaks that apply to this culture.

## Integration Points

- **Narrative Context Builder** ([[Narrative Context Builder]]) — uses vignette seeds and beat patterns to spawn culture-centric narrative events
- **Content Strategy** ([[Content Strategy]]) — cultural archetypes are one of 19 content packages in the layered prose engine
- **Narrative Archetypes** ([[Narrative Archetypes]]) — character archetypes can carry cultural identity (e.g., "The Zealot" bound to a theocratic culture)
- **World-Soul** ([[World-Soul]]) — culture system resonance fragments persist across cycles; fundament coefficients can amplify/dampen specific cultures

## Test Coverage

45 tests covering:
- **Structural validation** — all 32 archetypes have required fields
- **Content quality** — toneKeywords are diverse, beats form valid narrative arcs
- **Lookup functions** — correctly retrieve by ID, filter by type, resolve relationships
- **Composite modifiers** — all ~32 sets resolve without circular references
- **Integration** — archetypes link correctly to trait palettes, location sets, artifact templates

## Known Limitations & Future Directions

- **Localization:** All prose currently in English. Culture-content can be extended with i18n maps (tone keywords per language, translated vignette seeds).
- **Dynamic evolution:** Current archetypes are static. Future: allow cultures to mutate archetypes mid-run as they transition between tonal layers.
- **Player seeding:** Can player customize cultural archetypes at game start? Design doc defers this; future iteration.

*(updated 2026-03-07 — created during Content Strategy & Architecture implementation phase)*
```

#### Step 2b: Create Narrative Context Builder.md

Tool: `obsidian_append_content`

**File path:** `TheFantasyWorldSimulator/Systems/Narrative Context Builder.md`

**Content to write (fresh file):**
```markdown
# Narrative Context Builder

## Overview
Engine for sourcing and ranking narrative context during prose generation. Implements the gather-rank-select pipeline that feeds opposition sourcing and manifestation for culture-centric and world-state-aware narrative events.

**Implementation status:** ✅ Complete (200 lines, 12 tests)
**Location:** `src/engine/narrativeContext.ts`
**Test file:** `src/engine/__tests__/narrativeContext.test.ts`
**Design doc:** `Docs/plans/2026-03-07-narrative-context-design.md`

## Core Algorithm: Gather-Rank-Select

### Gather Phase
Harvest all available narrative anchors from current game state:
- **Recent agent actions** — what just happened to whom
- **Active mandates** — what cultures/agents are seeking
- **World-Soul resonance** — what echoes persist from past cycles
- **Sphere influences** — which cosmic forces dominate current hex/location
- **Agent relationships** — tensions, bonds, hierarchies
- **Unmet narrative requirements** — which story beats need fulfillment

Result: **candidate pool** (10-50 anchors, depending on tick and spotlight tier)

### Rank Phase
Score each candidate by:
1. **Recency weight** — recent actions ranked higher than stale state
2. **Thematic coherence** — does this anchor fit current narrative tone (archetype beat pattern)?
3. **Opposition tension** — how much friction does this create with other active narratives?
4. **Manifestation readiness** — do we have sufficient actors/objects to spawn this event?

Result: **ranked list** (top 5-10 candidates by score)

### Select Phase
Pick the highest-scoring anchor(s), then:
1. **Resolve manifestation** — does the anchor's narrative requirement resolve successfully?
2. **Spawn vignette** — feed selected anchor to narrative prose engine
3. **Record event** — log to narrative event trail for later replay/chronicle assembly

Result: **narrative event** (prose body, affected agents, mechanical consequences)

## Opposition Sourcing

When an anchor creates narrative tension (e.g., a mandate conflict), the builder:
1. Identifies the **opposing actor(s)** — who resists this narrative
2. Scores opposition **coherence** — does this opposition fit current sphere influences?
3. Materializes a **counter-event** or **complication** — secondary narrative to heighten drama

Used by:
- [[Mandate Tracker]] — when two mandates conflict, opposition sourcing creates narrative drama around the conflict
- [[Scry Court]] — when assigning agents to positions, opposition tension scores whether escalation will happen
- [[Culture System]] — cultures with opposing sphere alignments generate natural opposition sourcing

## Manifestation Pipeline

For each selected anchor:
1. **Check actor availability** — required agents exist and are in correct location
2. **Verify object requirements** — needed artifacts/locations are accessible
3. **Validate temporal constraints** — is the timing right (doom stage, world-soul phase, etc.)?
4. **Evaluate mechanical consequences** — what happens if this event triggers?

If any check fails:
- **Graceful fallback** — return placeholder prose ("The gardens are quiet today...") rather than crashing
- **Log failure** — record why manifestation failed, for debugging and future iteration

If all checks pass:
- **Feed to prose engine** — send anchor + resolved context to narrative.ts for prose generation
- **Commit state changes** — apply mechanical consequences (essence costs, trait shifts, etc.)

## Lookups & Helpers

### gatherContext(gameState) → NarrativeAnchor[]
Harvest all available anchors from current game state. Returns unranked candidate pool.

### rankAnchors(anchors, context) → RankedAnchor[]
Score and sort anchors by recency, coherence, opposition tension, manifestation readiness.

### selectManifestable(ranked) → NarrativeAnchor | null
Pick the highest-scoring anchor that passes all manifestation checks. Returns null if no viable anchor.

### sourceOpposition(anchor) → OppositionContext
Identify and score opposing forces for the given anchor.

### evaluateManifestability(anchor) → { passes: bool; reason: string }
Check if anchor can be manifested given current state. Returns pass/fail + diagnostic reason.

## Integration Points

- **Narrative Prose Engine** ([[Narrative Engine]]) — receives ranked anchors and spawns prose via archetype beat patterns
- **Culture System** ([[Culture Content Data]]) — vignette seeds from archetypes feed the candidate pool; beats shape manifestation conditions
- **Orchestrator Tick Loop** ([[Orchestrator]]) — called once per tick during narrative event resolution phase
- **Mandate Tracker** ([[Mandate Tracker]]) — uses opposition sourcing to create narrative complications when mandates conflict
- **World-Soul** ([[World-Soul]]) — reads resonance fragments to weight anchors toward historically significant narratives

## Test Coverage

12 tests covering:
- **Gather phase** — correctly harvests all anchor types; no duplicates
- **Rank algorithm** — anchors sorted by composite score; ties break predictably
- **Select & manifestation** — highest-scoring viable anchor selected; failed manifestations handled gracefully
- **Opposition sourcing** — opposing actors identified; opposition tension scored correctly
- **Fallback prose** — when manifestation fails, placeholder prose generated without errors
- **Integration flow** — full gather→rank→select→manifest pipeline works end-to-end

## Known Limitations & Future Directions

- **Anchor freshness:** Current implementation ranks by tick age. Future: weighted toward "narrative velocity" (how many events recently touched this anchor).
- **Semantic clustering:** Candidates are evaluated independently. Future: cluster similar anchors and pick cluster representative (avoid narrative monotony).
- **Human-readable scoring:** Opposition scores and coherence weights are opaque. Future: expose scoring breakdown to UI for player visibility.
- **Cultural contamination:** Narratives from one culture can bleed into another without explicit gating. Design doc defers culture-isolation decision.

*(updated 2026-03-07 — created during Content Strategy & Architecture implementation phase)*
```

#### Step 2c: Update Content Strategy.md

Tool: `obsidian_patch_content`

**File path:** `TheFantasyWorldSimulator/Systems/Content Strategy.md`

**Target type:** `heading`

**Target:** `## Integration Points` (or the end of the document if no such section exists)

**Operation:** `append`

**Content to append:**
```markdown

### Culture Content Data (950 lines, 45 tests) ✅ Implemented 2026-03-07
- 32 cultural archetypes across 4 tonal layers (Foundational, Ascendant, Twilight, Liminal)
- Trait palettes, location archetypes, artifact templates per culture
- 6 beat patterns (Founding, Flourishing, Conflict, Transformation, Fragmentation, Resurrection)
- ~32 composite modifier sets (cultural advantages + narrative consequences + manifestation conditions)
- Full test coverage: structural validation, content quality, lookup functions, modifier resolution

### Narrative Context Builder (200 lines, 12 tests) ✅ Implemented 2026-03-07
- Gather-rank-select pipeline for sourcing narrative context during prose generation
- Opposition sourcing for mandate conflicts and cultural tensions
- Manifestation validation: actor availability, object requirements, temporal constraints
- Graceful fallback to placeholder prose if manifestation fails
- Integration with narrative prose engine, culture system, mandate tracker, world-soul

```

#### Step 2d: Update Narrative Context Pipeline.md

Tool: `obsidian_patch_content`

**File path:** `TheFantasyWorldSimulator/Systems/Narrative Context Pipeline.md`

**Target type:** `heading`

**Target:** `## Implementation Status` (or end of file if no such section)

**Operation:** `append`

**Content to append:**
```markdown

### Narrative Context Builder Engine (200 lines, 12 tests) ✅ Implemented 2026-03-07
- **Gather phase:** Harvests anchors from agent actions, mandates, resonance, sphere influences, relationships, narrative requirements
- **Rank phase:** Scores by recency, thematic coherence, opposition tension, manifestation readiness
- **Select phase:** Picks highest-scoring viable anchor and spawns narrative event
- **Opposition sourcing:** Identifies opposing forces; used by mandate conflicts and cultural tensions
- **Manifestation pipeline:** Validates actors, objects, timing; graceful fallback to placeholder prose
- Tests: gathering, ranking, selection, opposition, manifestation, fallback prose, full integration flow

```

#### Step 2e: Update Content Packages.md

Tool: `obsidian_patch_content`

**File path:** `TheFantasyWorldSimulator/Systems/Content Packages.md`

**Target type:** `heading`

**Target:** `## Package Status` (or end of file)

**Operation:** `append`

**Content to append:**
```markdown

### 9. culture-content.ts (950 lines, 45 tests) ✅ Implemented 2026-03-07
- **32 cultural archetypes** across 4 tonal layers
- **Trait palettes** per culture (strength/weakness traits, reach affinities)
- **Location archetypes** and **artifact templates** tied to culture
- **Beat patterns** (Founding, Flourishing, Conflict, Transformation, Fragmentation, Resurrection)
- **~32 composite modifiers** combining advantage + narrative consequence + manifestation condition
- Lookup functions: getArchetype, getAllArchetypes, getTraitPalette, getLocationArchetypes, getBeatPatterns, getCompositeModifiers
- Full test suite: 45 tests covering structure, content quality, lookups, modifiers, integration

```

#### Step 2f: Update Index.md

Tool: `obsidian_patch_content`

**File path:** `TheFantasyWorldSimulator/Index.md`

**Target type:** `heading`

**Target:** `## Content Strategy & Architecture` (or appropriate section)

**Operation:** `append`

**Content to append:**
```markdown

### [[Culture Content Data]]
Comprehensive content package for the culture system. Implements 32 cultural archetypes (4 tonal layers), trait palettes, location/artifact templates, beat patterns, composite modifiers. 950 lines, 45 tests. ✅ Complete 2026-03-07.

### [[Narrative Context Builder]]
Engine for sourcing and ranking narrative context via gather-rank-select pipeline. Handles opposition sourcing, manifestation validation, graceful fallback to placeholder prose. 200 lines, 12 tests. ✅ Complete 2026-03-07.

```

---

## Part 3: Update Notion Backlog

### Location: https://www.notion.so/Development-Backlog-3182b241dfb081b9af78c279eef405cf

#### Step 3a: Find and update "Content Strategy & Architecture" section

Tool: `notion-fetch`

**Parameters:**
```json
{
  "id": "https://www.notion.so/Development-Backlog-3182b241dfb081b9af78c279eef405cf"
}
```

**Action:** Fetch the backlog page to locate the "Content Strategy & Architecture" section and identify the rows for:
- Culture Content Data implementation
- Narrative Context Builder implementation

#### Step 3b: Update Culture Content Data task row

Tool: `notion-update-page`

**Parameters:**
```json
{
  "page_id": "[fetch the database ID from the backlog; then locate the row for 'Culture Content Data implementation']",
  "command": "update_properties",
  "properties": {
    "Status": "Complete",
    "Notes": "✅ 950 lines, 45 tests. 32 cultural archetypes (4 tonal layers), trait palettes, location/artifact templates, beat patterns, ~32 composite modifiers. Design doc: 2026-03-07-culture-content-design.md. Vault: Culture Content Data.md. Tests: culture-content.test.ts.",
    "Completed Date": "2026-03-07"
  }
}
```

Note: Exact property names and values depend on Notion page structure; adjust field names as needed.

#### Step 3c: Update Narrative Context Builder task row

Tool: `notion-update-page`

**Parameters:**
```json
{
  "page_id": "[fetch the database ID from the backlog; then locate the row for 'Narrative Context Builder implementation']",
  "command": "update_properties",
  "properties": {
    "Status": "Complete",
    "Notes": "✅ 200 lines, 12 tests. Gather-rank-select pipeline, opposition sourcing, manifestation validation, graceful fallback. Design doc: 2026-03-07-narrative-context-design.md. Vault: Narrative Context Builder.md. Tests: narrativeContext.test.ts.",
    "Completed Date": "2026-03-07"
  }
}
```

#### Step 3d: Add rollup/summary to Content Strategy & Architecture section (if applicable)

Tool: `notion-update-page` (or inline edit if section has summary field)

**Action:** Update any summary or status line for the Content Strategy & Architecture section to reflect that:
- Culture Content Data: ✅ Complete (950 lines, 45 tests)
- Narrative Context Builder: ✅ Complete (200 lines, 12 tests)
- Total new content: 1,150 lines, 57 tests

---

## Summary of Changes

| Location | Changes | Count |
|----------|---------|-------|
| **CLAUDE.md** | Updated current phase, engine stats, content stats; added 8 changelog rows | 11 edits |
| **Obsidian: Systems/** | Created Culture Content Data.md, Narrative Context Builder.md; updated 4 existing system notes (Content Strategy, Narrative Context Pipeline, Content Packages, Index) | 6 new files + 4 updates |
| **Notion Backlog** | Updated 2 task rows (Culture Content Data, Narrative Context Builder) to Complete status | 2 updates |
| **Design Docs** | Already exist; no changes needed (2026-03-07-culture-content-design.md, 2026-03-07-narrative-context-design.md) | 0 changes |

**Total new lines of documentation:** ~2,000 lines (2 new system notes at ~800 lines each + changelog + updates to existing notes)

**Total touched files:** 13 (1 in repo root, 10 in Obsidian vault, 2 in Notion, 0 design docs)

---

## Execution Notes

1. **Tool ordering:** Complete all CLAUDE.md edits first, then Obsidian vault updates, then Notion updates. This follows the "repo → vault → backlog" documentation hierarchy.

2. **Obsidian wikilinks:** When creating new .md files and linking to existing system notes, use `[[System Name]]` syntax. This auto-creates backlinks in the vault.

3. **Changelog dates:** All entries should be dated 2026-03-07 (today).

4. **Design docs:** Assume 2026-03-07-culture-content-design.md and 2026-03-07-narrative-context-design.md already exist in Docs/plans/ (not created in this plan).

5. **Notion structure:** The exact field names and structure for Notion tasks depends on the backlog's column layout. Adjust property names (Status, Notes, Completed Date) to match actual Notion schema.

6. **Audit trail:** Each new Obsidian note includes a footer timestamp comment "(updated 2026-03-07 — ...)" as per project audit trail conventions.

7. **Stats validation:** New engine stats should be verified by running `npm test` to confirm actual test count; counts here are estimates based on task description.
