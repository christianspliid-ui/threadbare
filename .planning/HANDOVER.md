# Handover Notes

> Written by Cowork sessions for Claude Code to pick up. Read this at session start.
>
> **Format:** Each entry has a date, context (what was discussed/decided), and action items.
> **Lifecycle:** Claude Code acts on entries, then moves them to the "Completed" section below.
>
> **IMPORTANT:** When you complete a handover entry, you MUST also update the item's state in `.planning/BACKLOG.md` to `✅`. BACKLOG.md is the single source of truth — see `Docs/cowork-ways-of-working.md` → "Unified Kanban".
>
> **History:** Completed entries older than the current session are archived in `HANDOVER_HISTORY.md`.

---

### 2026-03-29: Ascendant Sheet — ✅ Committed and pushed

Committed `7081f69` — AscendantSheet.tsx added. GameView wiring was already in a prior commit. AvatarHUD was clean (no corruption). All pre-commit checks passed (tsc, vite build, 458 test files).

---

### 2026-03-29: TB-077 — Graph-Native Encounter Lifecycle (Layer 1: Event Nodes)

**Context:** Architecture analysis identified that encounter outcomes vanish from the world state — no graph-queryable history for prose enrichment, location flavor, or agent biography. This is the highest-value, lowest-risk layer: create `event` nodes in the graph when encounters resolve, wire edges to agents and locations.

**Design doc:** `Docs/plans/2026-03-29-graph-native-encounter-lifecycle-design.md`

**Action for Claude Code — Phase 1A: Types + Event Node Creation (~1 session)**

1. **Add 2 new edge types to `src/types/graph.ts`** (after `encounter_at`):
   ```typescript
   | 'participated_in'  // actor → event (encounter history)
   | 'occurred_at'      // event → location (encounter happened here)
   ```

2. **Add edge schemas to `src/types/edgeSchema.ts`** (after `encounter_at` block, before `trades_with`):
   ```typescript
   participated_in: {
     type: 'participated_in',
     sourceNodeType: 'actor',
     targetNodeType: 'event',
     direction: 'directed',
     cardinality: 'many-to-many',
     requiredProperties: [],
     description: 'Actor participated in this encounter outcome. Edge properties: role, outcome, tick.',
   },
   occurred_at: {
     type: 'occurred_at',
     sourceNodeType: 'event',
     targetNodeType: 'location',
     direction: 'directed',
     cardinality: 'many-to-one',
     requiredProperties: [],
     description: 'Encounter outcome occurred at this location. Edge properties: sublocationId, tick.',
   },
   ```

3. **Create `src/engine/encounterEventNodes.ts`** — new file with:
   ```typescript
   export const ENCOUNTER_EVENT_ENABLED = true;
   export const EVENT_NODE_ID_PREFIX = 'evt_';

   export function createEncounterEventNode(
     graph: WorldGraph,
     progress: EncounterProgress,
     result: { success: boolean; outcome: EncounterOutcome; outcomeType: string; growth?: { tierCrossed: boolean }; promotion?: { traitGranted: string } },
     step: EncounterStep,
     template: EncounterTemplate,
     locationId: string,
     tick: number,
   ): string | null
   ```
   - Creates event node: `id = evt_{actorId}_{tick}_{stepIndex}`, `type = 'event'`, `name = template.name + ' — ' + step.name`
   - Properties: `eventType: 'encounter_outcome'`, `templateId`, `templateName`, `encounterType`, `stepIndex`, `stepName`, `outcome` (success/failure/critical_success/critical_failure), `reachTested`, `threatRating`, `sphereAffinity`, `tick`, `tierPromotionOccurred`, `rewardGranted`, `targetAgentId`
   - Adds `participated_in` edge: source=`progress.actorId`, target=event node, properties: `{ role: 'primary', outcome, tick }`
   - If `progress.targetAgentId`: adds second `participated_in` edge with `role: 'target'`
   - Adds `occurred_at` edge: source=event node, target=`locationId`, properties: `{ sublocationId (from progress), tick }`
   - **Fail-soft:** Wrap all in try/catch. On any failure, log warning via `emitTrace` and return `null`. Encounter resolution must never be affected.
   - Returns the event node ID on success, `null` on failure

4. **Wire into `src/engine/orchestrator.ts`, `phaseEncounterProgressionV2()`** — insert after line 221 (`advanceEncounter(state, progress, result.success, state.tick);`), before the sphere pressure block (line 223):
   ```typescript
   // ── Encounter event node creation (TB-077) ──
   if (ENCOUNTER_EVENT_ENABLED) {
     const encounter = getAnyEncounterById(progress.encounterId);
     const step = encounter?.steps[progress.currentEncounterIndex - 1]; // -1 because advanceEncounter already incremented
     const locEdges = state.graph.getOutgoingEdges(progress.actorId, 'located_at');
     const locationId = locEdges[0]?.target;
     if (encounter && step && locationId) {
       createEncounterEventNode(
         state.graph, progress, result, step, encounter, locationId, state.tick,
       );
     }
   }
   ```
   **Note on step index:** `advanceEncounter()` mutates `progress.currentEncounterIndex` (increments it), so the step that was just resolved is at `currentEncounterIndex - 1` after the call. If the encounter is now completed/abandoned, `currentEncounterIndex` may equal `steps.length`, so subtract 1 and clamp.

5. **Write tests in `src/engine/__tests__/encounterEventNodes.test.ts`**:
   - Event node created with correct properties after resolveEncounter + advanceEncounter
   - `participated_in` edge from agent to event node
   - `occurred_at` edge from event node to location
   - Social encounter: two `participated_in` edges (primary + target)
   - Fail-soft: missing location → no node, no crash
   - Fail-soft: `ENCOUNTER_EVENT_ENABLED = false` → no node created
   - Event node ID is deterministic (same inputs → same ID)

6. **Pre-commit:** `npm test`, `npx tsc --noEmit`, `npx vite build`
7. Commit, push, update docs per Definition of Done

**Phase 1B (separate session): Graph queries + prose integration**
- Add `getLocationEncounterHistory(graph, locationId, maxResults?)` and `getAgentEncounterHistory(graph, agentId, maxResults?)` to `src/engine/graphQueries.ts`
- Wire into prose resolvers (see design doc Decision 2 for resolver specs)
- Add event node count + recent events to DebugPanel encounters tab

**Grey zones (decided — see design doc for rationale):**
- Per-step granularity (one event node per resolved step, not per completed encounter)
- Single event node for social encounters (two edges, one node)
- No backfill of pre-existing encounter history

---

### 2026-03-29: TB-073 Conflict & Destruction — Full Design Document Ready

**Context:** Cowork brainstorm session produced comprehensive narrative-first design for M2 Conflict & Destruction. Covers army entities, battle/siege resolution, destruction/aftermath, UI/visibility. Malazan-inspired: gods influence wars through proxies, not direct command.

**Key design decisions:**
- Armies are `actor` graph nodes (no new node type) with `ArmyState` property bag — only internal data (size, quintessence, objective, maintenance). All relationships are graph edges
- New edge types: `commanded_by` (army → commander agent), `participates_in` (army/agent → battle node)
- **Battles are graph nodes** — `located_at` a hex, connected to armies via `participates_in` edges. Agents and factions discover battles through normal graph traversal → emergent convergence (assassin sees battle, paths toward it to kill enemy commander)
- Spotlights are regular child encounters using existing intervention system; POV determined by player's threads
- Army vitality = Quintessence score that silently degrades; threshold crossings spawn encounters (supply crisis, desertion, mutiny, disbandment)
- **Size/modifier model**: warband ~100, regiment ~1k, host ~10k. Situational multipliers (prepared defense 3:1, siege walls 10-30:1, tactical brilliance up to 20:1). Initial battle momentum offset from effective size comparison
- Destruction scales with battle outcome (minor/major/total)
- **IPK keywords** used extensively in battle prose to communicate size, fortification, tactical state, divine intervention
- Prerequisite: **mercenary company vertical slice** (second faction after adventuring guild) with evolving autonomy (hired → autonomous warlord state). NOT a general-purpose faction ambition system

**What Cowork created:**
- `Docs/plans/2026-03-29-conflict-and-destruction-design.md` — Full design doc with NFP compliance, constants tables, trace schemas, fail-soft tables, wiring section. **Reviewed and revised** with user on 2026-03-29
- Obsidian `TheFantasyWorldSimulator/Brainstorms/brainstorm-conflict-and-destruction.md` — Comprehensive brainstorm with content requirements inventory (6 encounter template tables)
- Updated `BACKLOG.md` — TB-073 promoted to 📐 with design doc link
- Updated `ROADMAP.md` — M2.1–M2.4 marked design complete
- **Added CLAUDE.md guardrail**: "Relationships between entities are graph edges, not property fields" — under Load-Bearing Architectural Decisions

**Action for Claude Code:**
- No immediate implementation needed — TB-072 (sphere affinity) and Phase 11 (character sheet) are current priorities
- When M2 implementation begins, start with **Phase 0: Mercenary Company vertical slice** with faction ambition system — this is a prerequisite for everything else
- Note Quintessence (TB-075) dependency — army attrition model uses Quintessence as vitality score. If TB-075 isn't built yet, use an interim vitality score
- M2.5 (Monster Encounters / TB-051) still needs separate brainstorm — not covered by this design

---

### 2026-03-29: TB-074 — Encounter Tuning Sessions 2-4 (remaining)

**Context:** Session 1 complete (Phase A + E.2 + E.1). Three sessions remain.

**Design doc:** `Docs/plans/2026-03-29-encounter-tuning-and-agent-variety-design.md`

**Remaining sessions:**
- [x] **Session 2 (scoring overhaul):** ✅ Complete — B.1 familiarity discount, B.2 exploration bonus, B.3 travel cost dampening, D.1 personality amplification. Commit `8b15f53`.
- [ ] **Session 3 (spawn + progression):** Phase D.2 (born-later spawn at content locations) + C.1 (difficulty tier escalation — early/mid/late based on tick thresholds, applied during cache rebuild).
- [ ] **Session 4 (encounter chains):** Phase C.2 — `EncounterChain` data type, `chainProgress` agent property, wire into `filterByPrerequisites` (Stage 3 placeholder), 3 starter chains.

**Verification:** After each session, export encounter logs and run the `agent-analyser` skill. Baseline in `agent-analyser/references/baseline-seed42.md`.

---

## Completed

> Recent completions only. Full history in `HANDOVER_HISTORY.md`.

### 2026-03-29: TB-074 Session 1 — Template coverage + score display + dynamic cooldowns ✅
- Phase A: expanded locationTypes on 15 templates — all location types ≥8 matching templates
- Phase E.2: score display .toFixed(2)→.toFixed(4), added desireMultiplier to DECIDE events
- Phase E.1: dynamic cooldowns getEffectiveCooldown() + base 8→6 + COOLDOWN_FULL_POOL_SIZE=15 + COOLDOWN_MINIMUM=2

### 2026-03-29: Wire SoulCard into HexChronicle ✅
Verified on main, pushed, tests pass. Commit `546b99d`.

### 2026-03-29: Ways-of-working overhaul + weekly hygiene ✅
Cowork docs committed (57ce692), duplicate skills deleted, loose files cleaned, test failures fixed (c8c0676).

### 2026-03-29: CLAUDE.md checklist conversion ✅
Converted Session Workflow and Design Governance sections from prose/numbered lists to `- [ ]` checklist format, matching the DoD style. CLAUDE.md 268→223 lines. Design Governance compressed from ~70 lines to ~25 while retaining all requirements (NFP sections, UI phase, wiring, maintenance). No action needed — changes are in CLAUDE.md directly.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     