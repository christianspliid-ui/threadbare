# Phase 15: Fix Encounter Pipeline — Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix 5 systemic encounter pipeline problems identified in the seed-42 analysis (644 ticks, 8 agents): zero movement, encounter round-robin, no difficulty escalation, score display collapse, and content deserts at 2 locations. The capability growth system and encounter resolution already work — this phase fixes the decision layer above them, expands the content pool, and adds progression pressure.

</domain>

<decisions>
## Implementation Decisions

### Score Display Bug (Quick Fix)
- **Confirmed bug:** `phaseAgentDecision.ts:387` uses `c.templateId` but `ScoredCandidate` has `c.entry.templateId`. This causes ALL logged DECIDE events to show `score=0.0000` and `desire=?`.
- Fix: change `c.templateId` to `c.entry.templateId` in the `.find()` call.
- Once fixed, real scores will appear in logs, enabling proper tuning of all other constants.

### Movement Incentives
- **Primary lever:** Reduce `TRAVEL_COST_WEIGHT` (currently 0.5) so distant encounters can compete with local ones.
- **Personality-driven wanderlust:** Agents with high curiosity/ambition travel sooner; cautious/loyal agents stay put longer. Use existing axiological profile to modulate the travel cost penalty or exploration bonus per agent.
- **Travel range:** Claude's discretion — pick the approach that fits the existing awareness and pathfinding systems. Agents already see encounters at nearby locations via the awareness hop system (BASE_AWARENESS_HOPS=1, MAX_AWARENESS_HOPS=5).

### Difficulty Scaling
- **Target curve:** Gentle — 70%+ success rate at appropriate difficulty tier. Agents mostly succeed, with occasional challenge.
- **Encounter retirement — both layered:**
  1. **Max completions per template per agent** — after N completions of the same encounter, it's removed from that agent's pool entirely.
  2. **Outgrowth lock** — when agent cap exceeds template difficulty by a threshold, the encounter drops from the filter automatically.
  - Either trigger retires the encounter. Creates natural pressure to grow or travel.
- **New difficulty tiers:** New templates should span diff=20 through diff=90, creating clear progression milestones that agents graduate into as easy encounters are retired.

### Round-Robin Breaking
- **Pool expansion:** Target 20+ hand-authored templates per location archetype (up from 5-8). Include templates across difficulty tiers (easy/moderate/hard/deadly).
- **Universal terrain-flavored encounters:** Base activities (forage, rest, study, commune, etc.) available at every location but with terrain-specific flavor text and step variations. Same mechanics, different prose. Guarantees minimum content at every location.
- **Authoring approach:** Hand-authored only (no procedural generation). Full creative control per template. Matches NFP #5 (narrative over mechanical perfection).
- **Cross-location awareness:** Already implemented (encounterAwareness.ts hop system). Will become effective once travel cost weight is reduced.

### Content Desert Fallback
- **Fallback mechanism:** After 10 consecutive idle ticks, agent picks the nearest location with available content and initiates travel (forced travel).
- **Idle threshold:** 10 ticks (named constant: `IDLE_FORCED_TRAVEL_THRESHOLD`).
- Universal terrain-flavored encounters should eliminate most content deserts, making this a safety net rather than a primary mechanism.

### Claude's Discretion
- Exact `TRAVEL_COST_WEIGHT` value after reduction
- How personality maps to wanderlust (which axiological pairs, what multiplier range)
- Max completions threshold for encounter retirement
- Outgrowth lock cap-diff threshold
- Travel range selection algorithm (nearest-interesting vs best-within-awareness)
- How terrain-flavored universal encounters are structured in encounter-content.ts
- DECIDE log format improvements (score component breakdown)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Encounter Pipeline Architecture
- `src/engine/phaseAgentDecision.ts` — Full decision loop: preconditions → candidates → filter → cooldown → score → act. **Contains the score display bug at line 387.**
- `src/engine/encounterFilterPipeline.ts` — 5-stage filter: Awareness → Visibility → Prerequisites → Threat → Cap with Diversity
- `src/engine/encounterScoring.ts` — Score formula, familiarity penalty, exploration bonus, resonance. Already has `computeFamiliarityPenalty()` and `computeExplorationBonus()`.
- `src/engine/encounterAwareness.ts` — Per-reach distance-limited visibility (already supports multi-location awareness)

### Constants and Tuning
- `src/data/agent-behavior-constants.ts` — 56+ tunable constants including `TRAVEL_COST_WEIGHT`, `EXPLORATION_NOVELTY_BONUS`, `FAMILIARITY_DECAY_PER_ATTEMPT`, `IDLE_SCORE_THRESHOLD`

### Content Templates
- `src/data/encounter-content.ts` — 64 location encounter templates across 10 archetypes (expansion target: 20+ per archetype)
- `src/data/social-encounter-content.ts` — 14 social encounter templates
- `src/data/faction-encounter-content.ts` — 10+ faction/quest encounter templates

### Analysis
- `Docs/analysis/2026-03-30-encounter-log-analysis-seed42.md` — Full seed-42 analysis with per-agent breakdowns, metrics, and 9 recommendations

### Timeline and Logging
- `src/engine/encounterTimeline.ts` — Timeline event types (DECIDE uses `desireMultiplier?: number`)
- `src/engine/encounterLogExporter.ts` — TSV export format

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `computeFamiliarityPenalty()` in encounterScoring.ts — Already tracks attempt counts per template. Can be extended to hard-lock after N completions.
- `computeExplorationBonus()` in encounterScoring.ts — Already gives score bonus for unvisited locations with decay. Currently ineffective because travel cost dominates.
- `TRAVEL_COST_WEIGHT` constant — Single constant that controls how much distance penalizes encounter scores. Primary tuning target.
- `resolveIdleBehavior()` in idleBehavior.ts — Existing idle behavior handler. Forced travel fallback should integrate here.
- `filterByAwareness()` in encounterAwareness.ts — Already filters by multi-hop distance. Agents CAN see nearby location encounters — they just don't travel to them.
- `getEffectiveCooldown()` in phaseAgentDecision.ts — Already scales cooldown by pool size. Will interact with pool expansion.

### Established Patterns
- All constants in `agent-behavior-constants.ts` with JSDoc comments and `@range` annotations
- Encounter templates follow a consistent structure in encounter-content.ts with `steps[]`, `difficulty`, `reach`, etc.
- Filter pipeline is stage-based with fail-soft catch per stage
- Scoring is deterministic (no PRNG) — same inputs = same outputs

### Integration Points
- `phaseAgentDecision.ts` orchestrates the full pipeline: filter → cooldown → score → act
- New retirement mechanics (outgrowth lock) would add a filter stage or modify the cooldown filter
- Forced travel fallback integrates into `resolveIdleBehavior()` or a new idle fallback in `phaseAgentDecision.ts`
- Universal encounters need registration in encounter-content.ts and the encounter cache

</code_context>

<specifics>
## Specific Ideas

- Encounter retirement creates natural progression arcs: agents exhaust easy content → forced toward harder encounters or travel → discover new locations → new pool of encounters
- Universal encounters should feel terrain-specific: "forage in forest" vs "forage in desert" — same reach/difficulty structure, different flavor
- The scoring bug fix is prerequisite for all tuning work — without real scores in logs, we can't verify any constant changes

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 15-fix-encounter-pipeline-scoring-movement-difficulty-scaling-round-robin-and-content-deserts*
*Context gathered: 2026-03-30*
