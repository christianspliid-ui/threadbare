# Phase 10: Sphere Affinity — Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Universal per-entity sphere affinity system. Every entity in the world graph (hexes, agents, artifacts, locations, factions, cultures) tracks its relationship to all 8 creation spheres as integer scores on the triangle number scale. Sphere pressure from actions, control effects, encounters, doom, and rivals builds up or erodes these scores. The global World-Soul is the emergent aggregate. Magic is sphere fluency — no separate magic system. All communicated to the player through narrative prose with IPK (Interactive Prose Keywords), never numbers.

This is M1 of the Living World Systems roadmap. It provides the foundational data model and pressure engine that M2 (Conflict) and M3 (Economy) will build on.

**In scope:**
- `SphereAffinity` data model on all entity graph nodes
- Starting sphere scores from terrain/archetype/type tables
- Sphere pressure accumulator and resolution engine (opposition cancellation, allied defense, threshold erosion, cumulative construction)
- Orchestrator phases: `phaseSpherePressure` (9.5), `phaseSphereAggregation` (9.6)
- Upstream wiring: 6 existing phases push `SpherePressureEvent`s
- Downstream modifiers: prosperity, encounter scoring, agent decision
- IPK component (`ProseKeyword`) and concept tooltip registry
- WorldSoulIndicator (prose status in top bar)
- HexChronicle Soul layer (per-hex sphere prose)
- Action preview prose (sphere consequences)
- Debug panel Sphere State tab
- Magic power calculation with overchannel
- Agent presence as temporary hex buffer

**Out of scope:**
- Army/NPC/monster sphere affinity (future entity types — M2/TB-069)
- Terrain drift from sphere imbalance (stretch goal, not M1)
- Spell lists or mana pools (magic IS sphere fluency, no separate system)
- Foundation axes as per-entity properties (global-only, derived from aggregate)

</domain>

<decisions>
## Implementation Decisions

### Data model
- `SphereAffinity` = `{ scores: Record<CreationSphereName, number>, progress: Record<CreationSphereName, number> }` on every entity graph node's properties
- 8 creation spheres: force, matter, energy, life, mind, spirit, time, entropy
- Triangle number scale: level N costs N cumulative investment from level N−1. Max score 10.
- All entities use same structure, same rules — no special cases

### Pressure system
- **Tick pressure accumulator** — upstream phases push `SpherePressureEvent`s to `tickContext.spherePressures` during their execution. `phaseSpherePressure` at position 9.5 consumes all at once.
- **Opposition cancellation** — 4 pairs (Force↔Energy, Life↔Entropy, Mind↔Time, Spirit↔Matter) cancel before comparing against threshold
- **Allied defense** — 50% of allied sphere permanent score (rounded down) adds to defense threshold
- **Erosion** — pressure exceeding threshold erodes permanent score by excess. Progress resets on erosion.
- **Construction** — net constructive pressure accumulates in `progress`. When progress reaches `TRIANGLE_COST(currentLevel + 1)`, level up.
- No opposition echo — boosting Force does NOT directly penalize Energy. Homeostasis, not runaway.

### Agent presence
- Agent sphere scores create temporary buffer on hex defense while present — walking shields
- Does NOT permanently alter hex. Permanent change requires intentional sphere actions.

### Magic
- Power = caster_score + location_contribution − location_opposition
- **No cap on location draw** — overchannel damages caster permanently
- Overchannel cost = max(0, location_contribution − caster_score) applied as self-pressure via standard rules
- The overchannel decision is always agent choice (or player via divine intervention), never forced
- Reaches determine application domain, spheres determine power source

### UI communication
- All sphere information shown through narrative prose with IPK keywords
- IPK = bold + underline + sphere-colored text, tooltippable with narrative descriptions
- Numbers are for developers only (debug panel)
- Full IPK spec: `Docs/ui-patterns.md § 19`

### Global World-Soul
- Derived aggregate of all entity scores, not independently maintained
- `FundamentState.sphereWeights` populated from normalized aggregate for backward compatibility
- Foundation axes (chaos↔order, light↔darkness) = global-only, computed from aggregate sphere balance

### Claude's Discretion
- Exact tick pressure accumulator implementation (array on TickContext, or separate accumulator object)
- Graph node property storage strategy (new top-level property vs nested in `properties`)
- Caching strategy for aggregate computation (incremental vs full recompute per tick)
- IPK component implementation details (portal tooltips vs inline, animation)
- Debug panel Sphere State tab layout and data presentation

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design specification
- `Docs/plans/2026-03-28-world-soul-connection-design.md` — Full design doc with all 5 phases, constants tables, trace schemas, fail-soft tables, wiring section, NFP compliance. **This is the primary reference.**
- `brainstorm-sphere-affinity-system.md` — Design exploration with resolved questions and remaining open questions
- `Design/sphere-relationships.html` — Interactive visualization of sphere opposition and alliance pairs

### Cosmology model (existing code)
- `src/engine/cosmology.ts` — `SPHERE_ALLIES`, `SPHERE_OPPOSITES`, `adjustSphere()`, `normalizeCosmology()`
- `src/types/worldSoul.ts` — `FundamentState`, `FundamentShift`, `ResonanceMemory`, `WorldSoulState`
- `src/engine/worldSoul.ts` — 24 pure functions (Fundament, Resonance, Twilight, Harvest). Built and tested but NOT wired into orchestrator.

### Orchestrator and tick loop
- `src/engine/orchestrator.ts` — 33 phases. New phases insert at 9.5 and 9.6.
- `Docs/plans/wiring-checklist.md` — 7 integration surfaces. Must be updated when new phases/components added.

### Graph node system
- `src/types/graph.ts` — `GraphNode` with `properties: Record<string, unknown>`. `SphereAffinity` goes into properties.

### Downstream systems to inject into
- `src/engine/phaseProsperity.ts` — `computeEquilibriumTarget()`. Sphere modifier injection point.
- `src/engine/encounterScoring.ts` — `scoreAndSelect()`. Sphere resonance injection point.
- `src/engine/phaseAgentDecision.ts` — `resolveProfile()`. Sphere-derived axiological shift.

### Upstream phases that will push pressure events
- `src/engine/phaseUnifiedActionProgress.ts` — action resolution (burst pressure)
- `src/engine/phaseEncounterProgressionV2.ts` — encounter step resolution (burst)
- `src/engine/phaseDoom.ts` — doom tier escalation (entropy burst)
- `src/engine/phaseRivalActions.ts` — rival actions (burst)
- `src/engine/phaseControlEffects.ts` — sustained control effects (per-tick)
- `src/engine/phaseMandate.ts` — mandate milestones (burst)

### UI patterns and design system
- `Docs/ui-patterns.md § 19` — IPK (Interactive Prose Keywords) specification
- `Docs/design-system/tokens.md` — Sphere colors (8 creation + 4 foundation)
- `Docs/design-system/interactions.md` — Hover, focus, keyboard patterns

### Project constraints
- `CLAUDE.md` — NFP priorities, pre-commit checklist, testing anti-patterns, contract test requirements

</canonical_refs>
