# Content & Worldbuilding Assessment

**Date:** 2026-03-10
**Author:** Content & Worldbuilding Lead
**Purpose:** Landscape audit and prioritized next-step recommendations

---

## 1. Current State Summary

### What Exists

The project has a mature content infrastructure: 23 content packages (~800 KB total), 228 world-model graph nodes across 18 categories, a three-layer prose generation system, and 975+ data tests. Every major engine system (simulation, resolution, narrative, divine interventions, mandates, rivals, echoes, world-soul, chronicle) is implemented and tested.

**Content that players actually experience today:**

| Surface | Content Depth | Repetition Risk |
|---------|--------------|-----------------|
| Hex map (26 terrains, 12 sphere overlays, 13 sublocation icons) | Good | Low |
| Location descriptions (biome + subtype + culture + sphere prose) | Good — 5 variants per key, 8 resolver tables | Medium after ~20 locations |
| Agent summaries (knowledge-gated, archetype-driven) | Good — 19 archetypes × prose fragments | Medium after ~15 agents |
| Encounter templates (64 across 10 types × 20 subtypes) | Excellent | Low |
| Action templates (36: 4 per reach × 9 reaches) | Good structural coverage | Low (actions are mechanical) |
| Narrative feed (routine + notable prose) | Adequate — fixed after Golden Path sprint | **High** — verb/adj/noun pools tiny |
| Intervention agendas (40 templates: 8 types × 5 each) | Adequate | Medium — coincidence/omen thin |
| Agent profiles (Tier 3 scry modal) | Thin — 5 quote templates, 4 origin/middle/closing each | **High** — samey after 3 scry sessions |
| Rival gods (8 personality profiles) | Thin — 50-100% visible per run | **High** |
| Born names | Tiny — 10 entries | **Critical** — cycles in <50 ticks |
| Ascendant titles | Tiny — 3 per sphere (24 total) | **High** — player identity |

### What's Designed but Not Built

These systems have full Obsidian specs but no engine implementation:

1. **Items & Spells** — The Notion backlog lists this as "Next Up." Graph types exist (`artifact`, `artifact_legendary`, `possesses`, `bonded_to`) but no equip/cast/modifier pipeline, no spell taxonomy, no item content packages.
2. **Enchantments** — Designed as magical edge properties (blessing/curse/ward) but no engine code.
3. **Resources** — Designed as economic graph nodes (steady/consumable) but no generation, scarcity, or control mechanics.
4. **Content Feedback Agent** — Designed as a player quality-feedback loop with 3 flag types. Not implemented.
5. **Player Iteration UI** — Regenerate/lock/edit controls for generated content. Not implemented.
6. **LLM Chronicle Tier 3** — The narrative engine spec calls for LLM-generated literary prose for the rarest, most significant events. All prose is currently template-based.

### The Existing Content Backlog (Notion)

The Notion backlog already contains a well-structured content backlog (CB-001 through CB-012, plus 2 deferred items and 5 defect extractions). This is solid and doesn't need replacement — it needs prioritization context and a few additions.

---

## 2. Gap Analysis: Design Intent vs. Player Experience

### A. Prose Variety (THE critical gap)

The simulation ticks every few seconds. Prose surfaces on every tick. The pools feeding that prose are the single biggest repetition bottleneck:

- **Dilemma prose:** 4 verbs, 8 adjectives, 8 nouns — players see repeats within minutes (CB-001)
- **Born names:** 10 entries — full pool cycles in <50 ticks (CB-002)
- **Profile templates:** 5+4+4+4 = 17 total fragments — 3 scry sessions exhaust variety (CB-008)
- **Strand labels:** Single-word descriptors for the psyche system (CB-009)

These are all flagged in the existing backlog. They remain the highest-impact, lowest-effort content work.

### B. Cultural Distinctiveness (designed but disconnected)

The culture system is impressively designed: 12 cultural prose palettes exist in `culture-content.ts`, each with metaphors, honor/shame vocabulary, oath forms, death language, storytelling traditions. But **the narrative engine doesn't consume them** (CB-012). Warrior cultures and scholarly cultures currently produce identical prose. This is the single biggest gap between design ambition and player experience.

### C. Tonal Monotony (missing "wonder" register)

CB-011 identifies this well: every content package skews toward conflict, tension, and decay. The Tonal Bible says "wonder layered over grief" but there are zero wonder beats. No sunrise descriptions, no moments of unexpected grace, no ancient beauty discovered. The world currently feels relentlessly grim rather than darkly beautiful.

### D. Metaprogression Content (exists but thin)

The echo system, world-soul, and chronicle assembly are all implemented, but the content feeding them is minimal:
- 12 fundament descriptions + 8 resonance fragments (worldsoul-content.ts)
- Chronicler vignettes exist but the Great Chronicle's literary ambition (Volumes → Chapters → Echo Threads) is bottlenecked by template-only prose

### E. Items & Spells (designed, queued, not urgent for content)

The Notion backlog correctly queues this as "Next Up" for engineering. From a content perspective, this system needs a content design pass before implementation: item taxonomy, spell taxonomy, lore frameworks. But it shouldn't block the content-quality work above.

---

## 3. Recommendations: Prioritized Next Steps

### Tier 0 — Quick Wins (1-2 hours total, massive impact on playtest feel)

Do these first. They're all extraction + expansion tasks that directly reduce the most visible repetition.

| # | Task | Effort | Notion Ref | Notes |
|---|------|--------|-----------|-------|
| 1 | Extract + expand dilemma verb/adj/noun pools | 10 min | DEF-005 → CB-001 | 4→15 verbs. Single most impactful change per minute spent. |
| 2 | Extract + expand born names | 10 min | DEF-004 → CB-002 | 10→30+ names. Culture-flavored. |
| 3 | Expand coincidence agendas | 15 min | CB-003 | 4→8 templates. Coincidence is the most-used intervention. |
| 4 | Expand omen agendas | 15 min | CB-007 | 5→8 templates. |
| 5 | Expand scry weakness pool | 20 min | CB-004 | 8→16 weaknesses. |

**Estimated total: ~70 minutes. Expected outcome: playtest prose feels noticeably less repetitive.**

### Tier 1 — Content Depth (4-6 hours total, transforms character experience)

These make characters feel like individuals rather than archetype slots.

| # | Task | Effort | Notion Ref | Notes |
|---|------|--------|-----------|-------|
| 6 | Extract + expand profile generator templates | 30 min | DEF-003 → CB-008 | Quote 5→12, Origin 4→10, Middle/Closing 4→8. Add sphere-structural variants. |
| 7 | Expand ascendant archetype titles | 30 min | DEF-002 → CB-005 | 3→8 per sphere (24→64 total). Player identity for the run. |
| 8 | Expand rival personality profiles | 30 min | CB-006 | 8→16 profiles. Mix subtle/aggressive, specialist/generalist. |
| 9 | Extract + expand strand content | 45 min | DEF-001 → CB-009 | Intensity-scaled labels (mild/moderate/extreme per value pair). |
| 10 | Fill sublocation template biome gaps | 30 min | CB-010 | Cover 8 missing biomes (cavern, glacier, tundra, volcanic, etc.). |

### Tier 2 — Systemic Content Wiring (1-2 days, transforms world feel)

These require engine integration, not just data expansion.

| # | Task | Effort | Notes |
|---|------|--------|-------|
| 11 | Wire cultural prose palettes into narrative engine | 1-2 hrs | CB-012. 12 palettes already authored. Narrative.ts needs culture lookup + palette-weighted template selection. |
| 12 | Add wonder content layer | 1-2 hrs | CB-011. New beat type alongside routine/notable. Templates for beauty, awe, unexpected grace. |
| 13 | Seasonal prose variation | 2-3 hrs | CB-DEFERRED-002. SEASONAL_VOCABULARY exists (4 seasons). Wire into narrative context so prose reflects time-of-year. May need temporal system review. |

### Tier 3 — New Content Systems (multi-day, adds game depth)

These are new system implementations that add content categories.

| # | Task | Effort | Notes |
|---|------|--------|-------|
| 14 | Item & Spell content design pass | 2-3 hrs (design only) | Content taxonomy, lore framework, and template structures BEFORE engineering builds the system. Item categories (weapons, armor, artifacts, consumables, spell components). Spell categories (reach-based, sphere-typed). |
| 15 | Enchantment content design pass | 1-2 hrs (design only) | Blessing/curse/ward templates. Sphere × foundation flavor matrix. |
| 16 | Resource content design pass | 1-2 hrs (design only) | Steady vs. consumable. Biome distribution. Cultural significance. |
| 17 | Death/destruction prose templates | 2-3 hrs | CB-DEFERRED-001. Lifecycle system may need redesign first. Death is the biggest narrative moment — 4 templates is insufficient. |

### Tier 4 — Aspirational (future phases)

| # | Task | Notes |
|---|------|-------|
| 18 | LLM Chronicle Tier 3 | Literary-quality prose for the rarest events. Needs API integration, prompt engineering, tone guardrails. |
| 19 | Content Feedback Agent | Player quality-feedback loop. Needs UI (flag button), triage engine, constraint-gap detection. |
| 20 | Player Iteration UI | Regenerate/lock/edit controls. Needs design pass on which content surfaces allow iteration. |
| 21 | Great Chronicle literary assembly | Cross-cycle Echo Threads, Volume titling from doom archetype, interlude compression. Currently basic. |

---

## 4. Content Backlog Additions

Items not in the current Notion backlog that should be added:

### CB-013: Item & Spell Content Design Pass (NEW)
**Priority:** P1 (gates the "Next Up" engineering work)
**Effort:** 2-3 hrs design, separate from implementation
- Item type taxonomy with sphere affinities and reach associations
- Spell type taxonomy with cost/cooldown/range brackets
- Lore framework: how items/spells relate to cultures, history, and the cosmology
- Template structures for content packages (what fields, what variants)
- **Deliverable:** Design doc in `Docs/plans/` + Obsidian vault updates

### CB-014: Enchantment Content Design Pass (NEW)
**Priority:** P2
**Effort:** 1-2 hrs design
- Blessing/curse/ward template structures
- Sphere × foundation flavor combinations (96 possible tints)
- Duration and decay patterns
- **Deliverable:** Design doc + vault updates

### CB-015: Resource Content Design Pass (NEW)
**Priority:** P2
**Effort:** 1-2 hrs design
- Steady vs consumable taxonomy
- Biome → resource type mapping
- Cultural resource significance (sacred groves, ancestral mines)
- **Deliverable:** Design doc + vault updates

### CB-016: Prose Layer Expansion — Agent Full Mode (NEW)
**Priority:** P2
**Effort:** 1-2 hrs
- prose-layer-content.ts has agent resolvers in 'summary' mode only
- Agent 'full' mode prose (for Tier 3 profile modal) would give richer generated backstories
- Needs: archetype full-length templates, culture origin stories, sphere destiny fragments

### CB-017: Encounter Cultural Overlays Activation (NEW)
**Priority:** P2
**Effort:** 1-2 hrs
- encounter-content.ts contains CULTURAL_ENCOUNTER_OVERLAYS but needs verification that the encounter selection pipeline actually applies them
- If not wired: connect culture identity to encounter template variant selection

---

## 5. Strategic Recommendation

**Immediate priority (this week):** Tier 0 quick wins + Tier 1 depth work. This is 6-8 hours of pure content authoring that dramatically improves the feel of every playtest. No engine changes needed — just data expansion in existing content packages.

**Next sprint:** Tier 2 systemic wiring (cultural palettes + wonder layer + seasonal). These are the changes that make the world feel like a living place rather than a conflict engine.

**Parallel with Item/Spell engineering:** CB-013 content design pass. The engineering team shouldn't start building until the content taxonomy is designed. Otherwise we'll get a generic D&D item system rather than something that serves this game's cosmology.

**What NOT to do yet:** LLM integration, content feedback agent, player iteration UI. These are all valuable but they're quality-of-life improvements on top of a content base that needs to be deeper first. Expand the pools, wire the palettes, add the wonder — then consider the meta-systems.

---

## Appendix: Content Package Inventory

| Package | Lines | Purpose | Repetition Risk |
|---------|-------|---------|----------------|
| encounter-content.ts | 3,844 | 64 encounter templates | Low |
| culture-content.ts | 1,789 | Foundation/sphere/biome modifiers, trait seeds, palettes | Low (but palettes unwired) |
| prose-layer-content.ts | 413 | 8 resolver tables for entity descriptions | Medium |
| narrative-content.ts | ~1,500 | Routine/notable prose, sphere vocabulary, born names | **High** (small pools) |
| action-template-content.ts | ~800 | 36 CRUD action templates | Low |
| archetype-content.ts | ~1,200 | 19 archetypes (tone, beats, vignettes) | Low |
| chronicler-content.ts | ~800 | Chronicle vignettes + sublocation flavors | Medium |
| agenda-content.ts | ~500 | 40 agenda templates (8 types × 5) | Medium |
| agenda-consequence-templates.ts | ~600 | 240 consequence templates | Low |
| rival-content.ts | ~650 | 8 rival profiles + name fragments | **High** |
| scry-content.ts | ~400 | Divine court data, weakness pool | **High** |
| intervention-feedback-content.ts | ~200 | 40 constants, consequence templates | Low |
| hex-vignette-content.ts | ~550 | Location flavor prose | Medium |
| profile-content.ts | ~200 | Agent profile templates | **High** |
| worldsoul-content.ts | ~220 | Fundament descriptions, resonance fragments | Low (rare surface) |
| doom-content.ts | ~100 | Stage names (7 × 5) | Low |
| dream-content.ts | ~180 | Intervention definitions | Low |
| strand-content.ts | ~300 | Psyche strand definitions | Medium |
