# Skill Split Design — hexmap-developer + prose-resolver

**Date:** 2026-04-01
**Motivation:** Both skills are monoliths (570 and 493 lines) that load full-system context into every agent session regardless of task scope. Empirical analysis of 40 recent commits, 5 design docs, and impediment history shows clear natural seams that match how agents actually work.

## Evidence Summary

**hexmap-developer:** 85% of commits touch a single visual layer (signifiers, agent sprites, labels, selection). 15% touch infrastructure (zoom, camera, scene lifecycle). Infrastructure bugs are blocking (impediments #2, #3, #12) but rare. An agent fixing label overlap doesn't need 100+ lines of coastline/coordinate math.

**prose-resolver:** 80% of prose work is additive content to existing systems — primarily encounter templates (150+ in recent commits). Resolver architecture and enrichment infrastructure are touched rarely but have high blast radius. Vignette authoring and enrichment placeholders require a different mental model than template table writing.

## Split Plan

### hexmap-developer (570 lines) → 2 skills

#### `hexmap-core` (~280 lines)

Everything an agent needs to understand the HexMapV2 system before touching any code. The "read this first" foundation.

**Content (current sections):**
- Section 1: Technology stack
- Section 2: Architecture overview (component ownership, props/handle contract, key entry points)
- Section 4: Coordinate system (flat-top odd-q, Y-flip, neighbors/distance)
- Section 5: Render layer system (13 named layers, stencil clipping strategy, adding a new layer)
- Section 6: Zoom system (4-tier zoom, visibility matrix, d3-zoom integration)
- Section 7: Coastline summary (3-line summary + pointer to `coastline-system.md`)
- Section 8: Color system (terrain palette, water classification, depth bands, renderer color config)
- Section 14: Configuration & constants (named constant objects table)
- Section 15: Performance considerations
- Section 16: Lessons learned (d3-zoom, Three.js color, coordinate, InstancedMesh, build/deploy)
- Section 19: NFP compliance checklist

**Trigger words:** "hex map", "HexMapV2", "Three.js", "WebGL", "hex renderer", "d3-zoom", "hex coordinate", "hex grid", "coordinate system", "zoom tier", "render layer", "stencil", "InstancedMesh", "terrain palette"

**When to load:** Always — before any HexMapV2 code work. This is the foundational skill that hexmap-layers depends on.

#### `hexmap-layers` (~290 lines)

Feature-level reference for working on individual visual layers, testing, and debugging. Load alongside `hexmap-core` when doing hands-on layer work.

**Content (current sections):**
- Section 3: Directory structure (pointer to `directory-structure.md`)
- Section 9: Signifier system (registry, deterministic selection, adding new art)
- Section 10: Agent rendering (3-tier sprite system, multi-agent layout, portrait textures)
- Section 11: Fog-of-war (three visibility states, implementation)
- Section 12: Testing strategy (vitest + jsdom, what to test per module, jsdom gotchas, running tests)
- Section 13: Visual verification (Playwright vs Chrome in Chrome, dev URLs, screenshot tips)
- Section 17: Debugging toolkit (WebGL diagnostics, browser devtools, common debug scenarios table)
- Section 18: Integration points (data flow engine → renderer, events out)

**Trigger words:** "signifier", "terrain art", "agent sprite", "portrait", "fog of war", "hex test", "WebGL debug", "visual verification", "hex click", "hex hover", "hex tooltip", "movement trail", "location icon", "border mesh", "river mesh", "road mesh", "label overlay"

**When to load:** When actively building/modifying/testing/debugging a specific visual layer in HexMapV2.

---

### prose-resolver (493 lines) → 3 skills

#### `prose-pipeline` (~150 lines)

How the prose generator works: resolver architecture, ProseLayer interface, composition, and how to write a new resolver. The "how it works + how to extend" skill.

**Content (current sections):**
- Architecture overview (4-system pipeline diagram)
- System 1: Graph-walking prose generator — full section:
  - How it works (generateEntityProse API)
  - Resolver registry tables (10 location resolvers, 6 actor resolvers, 1 faction resolver)
  - ProseLayer interface
  - Composition constants
  - Prose cache
  - How to write a new resolver (4-step guide)
  - Template placeholder syntax
- Writing guidelines (Threadbare aesthetic)
- Content authoring checklist
- PRNG seed offset convention + table

**Trigger words:** "new resolver", "prose generator", "ProseLayer", "prose composer", "prose pipeline", "prose architecture", "graph-walking", "resolver registry"

**When to load:** When implementing a new resolver, modifying the prose pipeline architecture, or understanding how entity descriptions are generated. NOT needed for adding content to existing systems.

#### `prose-content-systems` (~200 lines)

Content tables, encounter templates, and existing systems you add prose to. The "add content here" skill.

**Content (current sections):**
- System 2: Narrative engine (three-tier model, sphere vocabulary, cultural prose integration, value flavors)
- System 7: Generic effect system (spell templates, effect tiers, backlash narrativeTemplate)
- System 8: Encounter content packages (template structure, 10 faction files, difficulty tiers)
- System 9: Faction reputation system (prose impact, reputation constants)
- System 10: Movement content (terrain/location taxes — prose relevance)
- Content tables reference (pointer to `content-files-reference.md`)

**Trigger words:** "encounter content", "encounter template", "faction encounter", "narrative content", "sphere vocabulary", "cultural prose", "spell flavor", "effect prose", "movement content", "content table", "write prose"

**When to load:** When adding encounter templates, writing narrative event prose, authoring faction-specific content, adding spell flavor text, or populating content tables. This is the high-volume, day-to-day prose work.

#### `prose-vignettes-and-enrichment` (~140 lines)

Dynamic prose systems that run at generation time: vignettes, enrichment placeholders, encounter history, backstory. The "dynamic prose infrastructure" skill.

**Content (current sections):**
- System 3: Vignette prose (four-part structure, forecast tiers, constants)
- System 4: Prose enrichment (placeholder syntax table, NarrativeContext interface, enrichment constants)
- System 5: Encounter event nodes (history persistence, how history feeds prose, biography categories, constants)
- System 6: Backstory system (stratum model, backstory constants)

**Trigger words:** "vignette", "enrichment", "placeholder", "NarrativeContext", "backstory", "encounter history", "biography", "forecast tier", "prose enrichment", "{name}", "{artifact}", "{ally}", "conditional block"

**When to load:** When implementing enrichment placeholders, authoring vignettes, modifying the backstory strata, or working on encounter history → prose integration.

---

## CLAUDE.md Domain Skills Table Update

Replace the two existing rows with:

| Domain | Skill | When to load |
|--------|-------|-------------|
| Hex map — architecture | `hexmap-core` | Always before any HexMapV2 work. Coordinates, zoom, render layers, camera, Three.js color, performance, lessons learned. |
| Hex map — features | `hexmap-layers` | Building/modifying/testing/debugging signifiers, agents, fog, labels, click handlers, trails. Load alongside `hexmap-core`. |
| Hex map — quick reference | `hexmap-renderer` | (unchanged) Quick reference for settled renderer decisions and patterns. Lighter than `hexmap-core`. |
| Prose — resolver architecture | `prose-pipeline` | Implementing new resolvers, modifying the prose pipeline, understanding graph-walking prose generation. |
| Prose — content authoring | `prose-content-systems` | Adding encounter templates, narrative event prose, faction content, spell flavor, content tables. High-volume daily work. |
| Prose — dynamic systems | `prose-vignettes-and-enrichment` | Enrichment placeholders, vignette authoring, backstory strata, encounter history → prose. |

## Migration Notes

- Existing resource files (`coastline-system.md`, `directory-structure.md`, `content-files-reference.md`) stay with their new parent skill
- `hexmap-renderer` (93 lines) is unchanged — it's already a lightweight quick-reference
- No content is deleted — only moved between skills
- Each new skill's frontmatter `description` includes trigger words so agents auto-load the right one
