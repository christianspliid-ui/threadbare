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

### 2026-03-29: TB-078 — Ascendant Sheet QA Fixes (Tooltip z-index + bugs + polish)

**Context:** Cowork UI/UX audit of the new AscendantSheet.tsx found 4 bugs, 4 parity gaps vs AgentProfileModal, 3 accessibility issues, and 5 improvement proposals. The most impactful bug affects all tooltips inside all modals globally (z-index conflict).

**Priority order — do all bugs first, then a11y, then improvements if time allows:**

#### Bugs (must fix)

**B1. Tooltip z-index behind modals (SYSTEMIC — affects all modals)**
- **Root cause:** `Tooltip.tsx` portals to `document.body` at `zIndex: 50 + depth`. `Modal.tsx` backdrop is `zIndex: 60`. Every `<Tooltip>` inside any modal paints behind the overlay.
- **Fix:** In `src/components/shared/Tooltip.tsx`, change the base z-index from `50` to `70` in the `outerStyle` calculation (~line 348). This makes it `70 + depth`. Tooltips should always be the topmost layer.
- **Verify:** Open AgentProfileModal, hover the sphere name in the header → tooltip should appear above the modal. Same for AscendantSheet sphere/reach tooltips.
- **Scope:** Fixes AscendantSheet, AgentProfileModal (line 164), ProwessTab (lines 172, 236), OverviewTab (lines 75, 93), BondsTab (line 164), and all other in-modal tooltips.

**B2. `sphere.order` tooltip resolves to nothing**
- The tooltip resolver looks for `foundation.order` or `creation.order` in `world-model.json` — neither exists.
- **Fix:** Add a `foundation.order` node to `world-model.json` with name "Order" and a description matching the other foundation spheres. The `SPHERE_TOOLTIPS` in `src/data/sphereTooltips.ts` already has an entry for `order`, so only the world-model node is missing.
- **Verify:** In AscendantSheet with primary sphere = order, hover the sphere name → tooltip should appear.

**B3. `ProseKeyword` `SPHERE_NAMES_SET` missing 4 foundation spheres**
- In `src/components/ProseKeyword.tsx` line 117, `SPHERE_NAMES_SET` only has the 8 creation spheres. The 4 foundation spheres (chaos, order, light, darkness) are missing.
- **Fix:** Add `'chaos', 'order', 'light', 'darkness'` to the Set. These are valid `SphereName` values and have entries in `SPHERE_TOOLTIPS`.
- **Impact:** `renderProseWithIPK()` will now render foundation sphere names as interactive keywords instead of plain `<strong>` tags.

**B4. Close button undersized — no minimum touch target**
- The AscendantSheet close button (line 177-183) is a raw `<button>` with a ✕ character, no padding, no explicit size. Design system requires 32×32px minimum for close buttons.
- **Fix:** Replace with `<IconButton icon={<span>✕</span>} variant="close" size="sm" aria-label="Close ascendant sheet" onClick={onClose} />` from `src/components/shared/IconButton`. This matches the Modal.Header pattern and gives consistent sizing, hover state, and focus-visible ring.
- **Note:** AgentProfileModal has the same raw ✕ button pattern (line 84-89). Fix both for consistency.

#### Accessibility (should fix)

**A1. No `aria-labelledby` on the modal dialog**
- The `<Modal>` renders `role="dialog" aria-modal="true"` but has no label. Add an `id` to the `<h1>` (e.g. `id="ascendant-sheet-title"`) and consider adding an `ariaLabelledBy` prop to `<Modal>` that passes through to the dialog div.
- If Modal doesn't support this prop yet, the simplest fix is adding `aria-label="Ascendant character sheet"` to the Modal's dialog div. Consider whether this needs a Modal-level change or just an AscendantSheet-level one.

**A2. Essence list needs semantic structure**
- Wrap the essence rows in `<ul>` / `<li>` instead of `<div>` so screen readers announce "list of N items".

**A3. ProseKeyword tooltip can clip at scroll boundary**
- ProseKeyword uses absolute positioning (`position: relative` parent + `position: absolute` tooltip) instead of portalling. Inside the modal's `overflow-y: auto` body, tooltips near the top of the scroll area get clipped.
- **Fix options (pick one):**
  - (a) Switch ProseKeyword to use the shared `<Tooltip>` component (now that B1 fixes the z-index). Pass `label` as the prose tooltip text. This is the cleanest long-term fix.
  - (b) Add `overflow: visible` to the ProseKeyword wrapper — but this risks breaking the modal scroll.
  - Recommended: option (a).

#### Improvements (nice to have — skip if session runs long)

**I1. Essence visual bars** — Add a subtle sphere-colored background gradient (proportional width) behind each essence row for at-a-glance hierarchy. Keep it very subtle (10-15% opacity).

**I2. Divine Threads — show follower names** — If `threadEdges` connect to named agents, show 2-3 names with click-to-open-profile. Use existing `AgentProfileModal` open handler from GameView.

**I3. Archetype flavor text** — Check `src/data/ascendant-content.ts` for archetype lore blurbs. If available, add 1-2 sentences below the archetype title badge in the header.

**I4. Staggered section fade-in** — Apply `anim-fade-up-enter` with staggered `animation-delay` (50ms per section) for a polished open animation.

**I5. Richer cycle/time metadata** — Expand the "First Cycle" line to include a narrative time phrase like "The world has turned N times since your awakening".

**Pre-commit:** `npm test`, `npx tsc --noEmit`, `npx vite build`

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

### 2026-03-29: TB-073 Conflict & Destruction — 📐▶ READY FOR IMPLEMENTATION PLANNING

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

**Action for Claude Code — WRITE IMPLEMENTATION PLANS, THEN CODE:**

All dependencies are met (TB-072 ✅, Faction ✅, Encounters ✅, HexMapV2 ✅, Movement ✅). Design doc is reviewed and approved. Write implementation plans and begin coding.

**Recommended plan sequence (7 plans):**

1. **M2-01**: Mercenary Company faction vertical slice + faction ambition system. New `FactionDefinition` for merc company. Faction ambition types as `ambition` graph nodes via `pursues` edges. Evolving autonomy model (hired → autonomous). Test: faction develops ambitions through encounters.
2. **M2-02**: Army entity creation. `ArmyState` on `actor` nodes. `commanded_by` edge type. `member_of` edge army→faction. Army spawn encounter gated by Iron + Gold capability. Test: faction raises army through encounter system.
3. **M2-03**: Army movement + Quintessence attrition. Modified pathfinding costs for armies. Per-tick Quintessence degradation (terrain, road, funding). Threshold encounters (supply crisis, desertion, mutiny, disbandment). Test: army marches, degrades, threshold encounters fire.
4. **M2-04**: Battle node + size/modifier model + spotlight encounters. Battle as graph node with `BattleState`, `located_at` hex, `participates_in` edges. Initial momentum from size/modifier calculation. Spotlight child encounters with existing intervention system. IPK keywords in battle prose. Test: two armies meet, battle node created, spotlights fire, momentum resolves.
5. **M2-05**: Siege variant. `battleType: 'siege'` pacing (slow → accelerating → crescendo). Siege as regional encounter generator (call for aid, smuggle supplies, negotiate terms). Fortification multipliers. Test: army besieges settlement, pacing accelerates, regional encounters spawn.
6. **M2-06**: Destruction + aftermath. Scaled destruction (minor/major/total). Sphere pressure flooding. Graph mutations (sublocations destroyed, trade routes severed, settlement tier downgrade, ruins). Commander fate. Refugee encounters. Test: battle resolves, destruction applied, aftermath ripples.
7. **M2-07**: UI + visibility. Army sprites on HexMapV2. Battle modal (background prose + spotlight + aftermath). Thread-based notification tiers. Debug panel "Armies" tab. Integration smoke test. Test: full cycle visible in game view.

**Critical architectural decisions (non-negotiable):**
- Battles are **graph nodes**, not persistent encounters. `located_at` a hex, connected via `participates_in` edges. Agents converge emergently.
- All relationships are **graph edges**, not property fields. `commanded_by`, `member_of`, `participates_in` — not string IDs in property bags. See new CLAUDE.md guardrail.
- `ArmyState` contains only internal data (size, headcount, quintessence, objective, maintenance). No relationship fields.
- Battle prose uses **IPK keywords** extensively for mechanical state (size, fortification, tactics, divine intervention).
- No new orchestrator phase. Battles processed within existing encounter phase.

**Content requirements:** See Obsidian brainstorm → Content Requirements Inventory section for 6 encounter template tables that must be authored during implementation.
**M2.5 (Monsters/TB-051):** Not covered — needs separate brainstorm before implementation.

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

> Archived to `HANDOVER_HISTORY.md` on 2026-03-30. See that file for full history.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               