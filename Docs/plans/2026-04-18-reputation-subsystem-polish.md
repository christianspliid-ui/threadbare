# Reputation Subsystem Polish — THR-34 / THR-35 / THR-41 / THR-167

**Date:** 2026-04-18
**Project:** Social Systems Expansion
**Scope:** Four polish issues against the already-shipped reputation subsystem. No new subsystems — each issue closes a specific gap in existing engine surfaces.
**Status:** Design — ready for Linear handoff.

---

## 1. Why one doc

All four issues touch the reputation subsystem's shipped code, and they cross-reference each other:

- THR-34 (bond shift) consumes `reputation_trait.reactions[]` data that THR-35 (faction aggregation) produces at faction level.
- THR-41 (aura hostility) needs a stable faction-identity resolution path that THR-167's cleanup sharpens.
- THR-167 (dead-tally loophole) exposes a new `faction_reputation_gain` effect kind that upcoming faction prose (THR-31 Phase 2) will consume.

Treating them as one coordinated pass prevents four separate drift vectors. Each issue still ships as its own PR — sequencing in §7.

## 2. Shipped surfaces (verified 2026-04-18)

| Surface | File:line | Role |
|---|---|---|
| `computeBondModifier` | `src/engine/socialEncounterGeneration.ts:261` | Social encounter scoring; reads trust edge, returns ±modifier. Called from `encounterScoring.ts:876`. |
| `REACH_DOMAINS` loop | `src/engine/phaseReputationTraits.ts:235,265` | Iterates the 8 reaches × 2 polarities for actor-level trait promotion. Runs per tick. |
| `effectAura.ts` TODOs | `src/engine/effectAura.ts:181,185` | `allies`/`enemies` aura target filters fall through to apply-to-all because faction resolution is stubbed. |
| `reputation_tally` aftermath | `src/engine/encounterAftermath.ts:377–400` | Writes `effect.key` into `node.properties.reputationTallies` with no key validation. Tally is inert unless key matches `${ReachDomain}.${polarity}`. |
| `ReputationTallyKey` | `src/types/agent.ts:70` | Template-literal type `` `${ReachDomain}.${'positive' \| 'negative'}` `` — advisory only; not enforced at aftermath write time. |
| `applyFactionReputationGain` | `src/engine/factionReputation.ts:40` | The canonical way to grow rank on a `member_of` edge. Not exposed as an effect kind; only callable from code. |
| `computeRankFromReputation` | `src/types/faction.ts` (imported in `factionReputation.ts:14`) | Maps `member_of.reputation` (0.0–1.0) to faction rank tier. **This is the per-faction standing ladder — already shipped.** |

## 3. THR-34 · Social Bond Shift from Reputation Reactions

### Current state
`computeBondModifier` (above) reads only the trust-edge value and an Eye-capability check. It ignores the target's reputation traits entirely — a feared warlord and a beloved healer produce identical bond modifiers when trust is zero.

### Proposed change
Add `computeReputationBondShift(graph, sourceAgentId, targetAgentId): number` in `socialEncounterGeneration.ts`. It reads the target's active reputation traits (via `getTraitsForNode`), collects any `reactions[]` entries the content data declares, and returns a summed bond delta clamped to `[-MAX_REPUTATION_BOND_SHIFT, +MAX_REPUTATION_BOND_SHIFT]`. Plug into `computeBondModifier` as an additive post-term **before** clamping:

```
base = existing logic (trust bands + stranger curiosity)
repShift = computeReputationBondShift(graph, agentId, targetAgentId)
return clamp(base + repShift, BOND_MODIFIER_MIN, BOND_MODIFIER_MAX)
```

Reaction data lives on reputation trait definitions in `src/data/reputation-trait-content.ts` (already imported by `factionReputation.ts`). Add an optional `reactions?: ReputationReaction[]` field on the trait definition shape, where `ReputationReaction = { viewerTraitId?: string; bondShift: number; reason: string }`. Empty `viewerTraitId` means "applies to any viewer"; a set `viewerTraitId` means "only when the source has that trait" (e.g. a Shadow-positive agent reacts differently to an Infamous target than a Hearth-positive agent).

### Named constants
| Name | Default | Purpose |
|---|---|---|
| `MAX_REPUTATION_BOND_SHIFT` | `0.4` | Clamp on summed reaction delta. Prevents a single reaction trait from dominating bond scoring. |
| `REPUTATION_REACTION_MATCH_BONUS` | `1.5` | Multiplier applied when `viewerTraitId` matches an active trait on the source. |
| `BOND_MODIFIER_MIN` | `-1.0` | Existing floor — now exported so post-shift clamp uses the same bound. |
| `BOND_MODIFIER_MAX` | `+1.0` | Existing ceiling — same rationale. |

### Trace
`category: 'social_bond_shift'`, payload `{ sourceAgentId, targetAgentId, traitIds: string[], shift: number, reason: string }`. Emitted only when shift ≠ 0, to keep trace volume bounded.

### Tests
Extend `src/engine/__tests__/socialEncounterGeneration.test.ts`:
1. Target has Infamous (Shadow-negative). Source has no matching trait. Expect negative shift within clamp.
2. Target has Beloved (Hearth-positive). Source has Hearth-positive trait (matching viewer). Expect `bondShift × REPUTATION_REACTION_MATCH_BONUS`.
3. Two reactions sum beyond clamp. Expect clamped value exactly at `MAX_REPUTATION_BOND_SHIFT`.
4. Target has no reputation traits. Expect return 0 and no trace emitted.

### Fail-soft
| Case | Fallback |
|---|---|
| `getTraitsForNode` throws | Catch, return 0, emit `social_bond_shift_error` trace |
| Trait has no `reactions[]` field | Skip silently — legacy traits stay inert |
| Unknown `viewerTraitId` in content | Skip that reaction entry; continue summing others |

## 4. THR-35 · Faction Reputation Aggregation

### Current state
`phaseReputationTraits.ts` loops only over actor nodes. Faction nodes have no reputation traits of their own — a faction whose members have racked up Shadow-negative activity looks unmarked in the graph.

### Proposed change
Add a **second sub-phase** to `phaseReputationTraits.ts` that runs after the per-actor loop:

```
for each faction node:
  scan incoming `member_of` edges (members of this faction)
  for each reach × polarity:
    sum member tallies, weighted by (1 - distance_from_rank_top)
    divide by member count to normalize
  apply same threshold/level logic as actors
  assign faction-level reputation traits via same `syncReputationTrait` helper
```

**Weighting rationale:** a low-ranked member contributes less to faction reputation than a high-ranked one. Use `memberContribution = 1 - (rankIndex / totalRanks × RANK_WEIGHT_FALLOFF)` where a senior has weight 1.0 and a recruit has weight ~0.3. Tunable via constant.

### Named constants
| Name | Default | Purpose |
|---|---|---|
| `FACTION_REP_MIN_MEMBERS_FOR_TRAIT` | `3` | Below this, faction is too small to earn traits. Prevents 1-member factions cloning a leader's reputation. |
| `FACTION_REP_RANK_WEIGHT_FALLOFF` | `0.7` | Slope of member-weight decay with rank distance from top. 0 = all members weighted equally; 1 = only top rank counts. |
| `FACTION_REP_AGGREGATION_INTERVAL_TICKS` | `5` | Run faction aggregation every N ticks (not every tick — keeps orchestrator phase cheap). |
| `FACTION_REP_DECAY_PER_AGGREGATION` | `0.02` | Faction-level tally decay rate. Lower than actor decay because faction reputations are sticky. |

### Trace
`category: 'faction_reputation_trait'`, payload `{ factionId, reach, polarity, level, memberCount, aggregatedTally }`. Emitted on trait assignment, reinforcement, or removal.

### Tests
New file `src/engine/__tests__/factionReputationAggregation.test.ts`:
1. Faction with 5 members, 3 have Shadow-negative encounters totaling > threshold. Expect faction gains Shadow-negative trait.
2. Faction has 1 member (below min). Expect no trait even if tally would qualify.
3. Senior member contributes more than recruit — test by comparing two configurations with same total tally but different rank distributions.
4. Aggregation interval: run 4 ticks, expect no faction recompute; tick 5 triggers.
5. Decay: faction trait tally drops over consecutive aggregations with no new member activity.

### Fail-soft
| Case | Fallback |
|---|---|
| Faction node missing definition | Skip faction; emit `faction_aggregation_skipped` trace |
| Member actor missing | Skip that member in sum; don't count in denominator |
| No `member_of` edges | Leave faction without traits; no trace needed |

### UI pillar
No new modal. Faction-level traits surface in `FactionDebugContent.tsx` (existing debug panel) as a new "Reputation" row. Agent-facing UI inherits via existing trait rendering — when players view a faction card, they see the traits with the same pill styling as actor traits. Chronicle auto-catches trait assignment via existing prose pipeline (`trait_assigned` event already has prose handlers).

## 5. THR-41 · Faction hostility in aura filtering

### Current state
Two TODOs at `effectAura.ts:181,185`:
```ts
if (aura.targetFilter === 'allies') {
  if (targetPos.factionId !== aura.sourceAgentId) {
    // TODO(THR-41): resolve source agent's faction from aura entry
  }
}
if (aura.targetFilter === 'enemies') {
  // TODO(THR-41): faction hostility check
}
```
Both branches currently fall through to apply-aura-to-all, making `allies`/`enemies` filters effectively `all`. This is a correctness bug, not a feature gap.

### Proposed change

**Step 1** — `AuraEntry` already has `sourceAgentId` but not `sourceFactionId`. Extend `collectAuraEffects()` (line 117) to also stamp `sourceFactionId: pos.factionId` onto each entry (it's already resolved in `resolveAgentPosition` at line 96). Update `AuraEntry` type in `src/types/effects.ts`.

**Step 2** — Replace the two TODO branches:
```ts
if (aura.targetFilter === 'allies') {
  if (aura.sourceFactionId === undefined || targetPos.factionId === undefined) continue;
  if (aura.sourceFactionId !== targetPos.factionId) continue;
}
if (aura.targetFilter === 'enemies') {
  if (aura.sourceFactionId === undefined || targetPos.factionId === undefined) continue;
  if (aura.sourceFactionId === targetPos.factionId) continue;
  if (!areFactionsHostile(graph, aura.sourceFactionId, targetPos.factionId)) continue;
}
```

**Step 3** — Add `areFactionsHostile(graph, factionA, factionB): boolean` in `factionNetwork.ts` (where `member_of` is already imported). Checks for a `hostile_to` edge between the two faction nodes in either direction. If no edge, return `false` (neutral, not hostile). Edge type already exists — no new schema.

### Named constants
None required — this is a pure correctness fix. Edge presence is the signal.

### Trace
Extend existing `aura_applied` trace with `filterPassed: 'allies' | 'enemies' | 'all'` and `sourceFactionId` / `targetFactionId` fields. Emits only on a pass; skipped applications don't need to trace (volume).

### Tests
Extend `src/engine/__tests__/effectAura.test.ts` (confirm exists; create if missing):
1. Allies filter + same faction → aura applies.
2. Allies filter + different faction → aura skips.
3. Enemies filter + hostile edge present → aura applies.
4. Enemies filter + no hostile edge → aura skips.
5. Either faction unknown → aura skips (fail-closed — no side-effects on missing data).
6. Self-aura (source agent is target) — covered by existing test at line 167.

### Fail-soft
| Case | Fallback |
|---|---|
| Source agent has no faction | Skip entry for `allies`/`enemies` filters; apply for `all` |
| Target has no faction | Same — skip `allies`/`enemies`, apply `all` |
| `areFactionsHostile` throws | Log once per tick; skip the entry |

### Pre-existing code smell (not in scope)
`factionId` is stored as a **property** on actor nodes, not as a `member_of` edge traversal. Memory log flags this as a violation of "relationships = edges, not properties." THR-41 **respects the existing convention** — fixing the property/edge split is a cross-cutting refactor outside this polish issue's remit. Log as a follow-up under a new issue if it becomes a blocker.

## 6. THR-167 · Close the dead-tally loophole

### Reframe from the original issue
The issue description proposes "design a per-faction standing system." **That system already ships** — `member_of.reputation` (0.0–1.0) with `computeRankFromReputation` tiers. The real gap: off-axis `reputation_tally` effects in content files write to dead keys because `phaseReputationTraits.ts` only promotes traits for `${ReachDomain}.${polarity}` keys.

Known dead keys in production content:
- `bf.craft_work`, `bf.construction_work`, `bf.fellowship_work`, `bf.master_craft` (Builders Fellowship)
- `cg.watch_work`, `cg.checkpoint_work`, `cg.senior_work` (Civic Guard)
- `gate_duty.witness_story_followed`, `gate_duty.captain_marked`, `gate_duty.left_to_settle` (Gate Duty)

### Proposed change — three parts

**Part 1 · Add a `faction_reputation_gain` aftermath effect kind.** In `encounterAftermath.ts`, next to the existing `reputation_tally` case (line 377), add a new case that accepts `{ factionId: string; amount: number; cause: FactionReputationCause }` and calls `applyFactionReputationGain`. This gives content authors a direct, type-safe way to grow `member_of.reputation` (and therefore rank) as an encounter aftermath.

**Part 2 · Validate tally keys at write time.** Before the `tallies[effect.key] = ...` assignment, check `isValidReputationTallyKey(effect.key)`:
```ts
const VALID_TALLY_KEYS = new Set(
  REACH_DOMAINS.flatMap(d => [`${d}.positive`, `${d}.negative`]),
);
function isValidReputationTallyKey(k: string): boolean {
  return VALID_TALLY_KEYS.has(k);
}
```
On miss, emit `aftermath_invalid_tally_key` trace with `{ key, encounterId, actionId, reactionId, suggestedReplacement }` and **do not** write the tally. `suggestedReplacement` is a best-effort heuristic — e.g. `bf.master_craft` → `stone.positive` based on a curated map in the trace helper (not a fallback write; just a hint for the author).

**Part 3 · Migrate known off-axis writes.** For each known dead-key call site:
- BF tallies → convert to `faction_reputation_gain` against `faction.builders-fellowship` (authorial intent was clearly rank progression, not cross-world reputation).
- CG tallies → same, against `faction.civic-guard`.
- Gate Duty → case-by-case; `witness_story_followed` probably wants `hearth.positive`, `captain_marked` wants `faction_reputation_gain` against `faction.civic-guard`, `left_to_settle` probably wants a new `settlement_history` mark (hidden_mark, not reputation).

Part 3 content changes coordinate with THR-31 Phase 2 faction migrations — same files, same review surface. Sequence so Part 1+2 ship first (give authors the new effect kind), then THR-31 Phase 2 PRs can use it.

### Named constants
| Name | Default | Purpose |
|---|---|---|
| `INVALID_TALLY_KEY_TRACE_RATE_LIMIT` | `50` | Max `aftermath_invalid_tally_key` traces per tick. Prevents a runaway content bug from flooding the trace buffer. |

### Trace
- `aftermath_invalid_tally_key` — new category. Payload `{ key, encounterId, actionId, reactionId, suggestedReplacement?: string }`.
- `encounter_aftermath_effect` — extend existing to include `effectKind: 'faction_reputation_gain'` with `{ factionId, amount, newReputation, rankChanged, newRank }`.

### Tests
New file `src/engine/__tests__/aftermathFactionReputation.test.ts`:
1. `faction_reputation_gain` effect grows `member_of.reputation`, fires `faction_reputation` trace.
2. Gain that crosses a rank tier sets `promotionPending: true` on the edge.
3. Invalid tally key emits `aftermath_invalid_tally_key` and does **not** mutate `reputationTallies`.
4. Valid tally key still writes through (no regression on existing content).
5. Rate limit: 51st invalid key in one tick emits a "rate limited" summary trace but no per-key trace.

### Fail-soft
| Case | Fallback |
|---|---|
| `faction_reputation_gain` targets faction that doesn't exist | Emit `faction_reputation_gain_error`; skip |
| Agent has no `member_of` edge to target faction | Skip silently — `applyFactionReputationGain` already handles this (returns `{newReputation: 0, …}`); just don't trace as error |
| `amount` is NaN / negative beyond floor | Clamp to `[−1.0, +1.0]`; emit truncation trace |

### UI pillar
No new modal. Faction rank changes already render in `FactionDebugContent.tsx` via existing `faction_reputation` trace consumption. The new `aftermath_invalid_tally_key` traces surface in the DebugPanel's Trace tab under a new "Content Lint" filter — authors debugging prose enrichment (THR-31) rely on this signal to catch dead writes during migration.

## 7. Sequencing

Hard order (must follow):
1. **THR-167 Parts 1+2** — new `faction_reputation_gain` effect kind + tally validation. Merge first. Unblocks THR-31 Phase 2 and provides the validation signal the other issues depend on.
2. **THR-41** — aura hostility. Independent of THR-167 mechanically but benefits from the `faction_reputation_gain` trace catching any hostile-edge inconsistency. Second PR.
3. **THR-35** — faction reputation aggregation. Adds faction-level traits that THR-34 can then consume. Third PR.
4. **THR-34** — bond shift from reactions. Ships **after** THR-35 so faction-level traits can contribute `reactions[]` to the bond shift. Fourth PR.
5. **THR-167 Part 3** — content migration of BF / CG / Gate Duty. Ships as a sub-PR of THR-31 Phase 2 (same files, same reviewer). Do not block THR-167 Parts 1+2 on this.

Parallel-safe: all four issues are safe to **design-sequence** in one session (this doc). Implementation-wise, 41 + 35 are parallel-safe with each other (different files). 34 ↔ 35 are sequential (34 consumes 35's output). 167 Parts 1+2 must merge before anyone touches the aftermath validation path.

## 8. NFP Compliance

| NFP | Status | Note |
|---|---|---|
| 1. Tunability | PASS | All thresholds named (§3, §4, §6 constants tables). No magic numbers introduced. |
| 2. Inspectability | PASS | New trace categories: `social_bond_shift`, `faction_reputation_trait`, `aftermath_invalid_tally_key`. Existing `aura_applied` and `encounter_aftermath_effect` extended. |
| 3. Determinism | PASS | No PRNG calls added. Aggregation is sum-of-inputs, order-independent. |
| 4. Fail-soft | PASS | Each §3/§4/§5/§6 has a Fail-soft table. No thrown exceptions in engine path. |
| 5. Narrative over mechanical | PASS | Bond shift drives encounter variety (beloved healer ≠ feared warlord). Faction traits feed prose (THR-31). Dead-tally fix directly unblocks authors. |
| 6. Additive over destructive | PASS | All four are additions to existing files. No schema rewrites. `ReputationTallyKey` type stays as advisory; validation is runtime, not breaking. |
| 7. Performance | PASS with note | THR-35 aggregation runs every N=5 ticks (tunable). Faction count is bounded (~20 for current scenarios). Member scan is O(members per faction) per aggregation. No new caches. |

## 9. Three-pillar coverage

**Engine:** Four targeted changes across `socialEncounterGeneration.ts`, `phaseReputationTraits.ts`, `effectAura.ts`, `encounterAftermath.ts`, `factionNetwork.ts`. One new effect kind, one new phase-internal sub-loop, three new trace categories.

**Content:** Reputation trait definitions gain optional `reactions[]` field. Known dead-key content (BF / CG / Gate Duty) migrates to `faction_reputation_gain` via THR-31 Phase 2. No new content files required for THR-34/35/41/167 Parts 1+2.

**UI:** No new modals. Faction-level traits render through existing actor-trait pill components (DRY via shared `<TraitPill>`). `FactionDebugContent.tsx` adds one "Reputation" row. DebugPanel Trace tab adds "Content Lint" filter for `aftermath_invalid_tally_key`. AgentInfoCard and Chronicle inherit via existing trait-rendering and prose-enrichment paths — no changes needed at those surfaces.

## 10. Wiring checklist (per `Docs/plans/wiring-checklist.md`)

| Module | Orchestrator phase | UI consumer | GameState field | Traces | Debug visibility | Prose | Player control |
|---|---|---|---|---|---|---|---|
| `computeReputationBondShift` | `phaseEncounterCandidates` (via `computeBondModifier` call) | AgentInfoCard bond rendering (no change) | N/A | `social_bond_shift` | DebugPanel Social Scoring tab | Not prose-facing | N/A |
| Faction rep aggregation | New sub-loop inside `phaseReputationTraits` | `FactionDebugContent.tsx` | `faction_reputation_traits` (reads from graph) | `faction_reputation_trait` | FactionDebug "Reputation" row | Feeds THR-31 conditional blocks on faction traits | N/A |
| Aura hostility | `phaseEffectAura` (no phase change) | None (invisible fix) | N/A | Extended `aura_applied` | DebugPanel Aura tab | N/A | N/A |
| `faction_reputation_gain` effect | `phaseEncounterAftermath` | `FactionDebugContent.tsx` rank display (via existing `faction_reputation` trace) | Graph edge update on `member_of.reputation` | `encounter_aftermath_effect` extended; `faction_reputation` fires via `applyFactionReputationGain` | FactionDebug rank shift | THR-31 prose reads `rankChanged` from aftermath result | N/A |
| Tally key validation | `phaseEncounterAftermath` | DebugPanel Trace tab "Content Lint" | N/A | `aftermath_invalid_tally_key` | Trace tab filter | N/A (it's a dev signal) | N/A |

## 11. Open questions (flagged for CC to confirm during implementation)

1. **THR-35 aggregation cadence** — is N=5 ticks right, or should it scale with faction count? Profile in CLI (`npm run cli -- --seed 42 --map medium`, `run 5` for 50 ticks, inspect tick timings).
2. **THR-34 reaction matrix** — the `reactions[]` content on existing reputation traits is empty. Before shipping, seed 3–5 representative reactions per polarity (Infamous → Shadow-viewer gets +0.3, Hearth-viewer gets −0.3, etc.). Coordinate content with prose team (THR-31 Phase 0).
3. **THR-41 hostile edge bidirectionality** — is `hostile_to` modeled as bidirectional by convention, or do we check both directions? Grep `hostile_to` in content files to confirm, default to checking both.
4. **THR-167 Part 3 Gate Duty** — `gate_duty.left_to_settle` probably wants a hidden_mark, not a reputation tally. Confirm with content review before migrating.

## 12. Test matrix summary

| Issue | New test file | Extends existing | Count |
|---|---|---|---|
| THR-34 | — | `socialEncounterGeneration.test.ts` | +4 cases |
| THR-35 | `factionReputationAggregation.test.ts` | — | 5 cases |
| THR-41 | — | `effectAura.test.ts` (create if missing) | +5 cases (including 1 regression) |
| THR-167 | `aftermathFactionReputation.test.ts` | — | 5 cases |

Total: ~19 new test cases, 2 new test files, 2 extensions.

---

**Cross-refs:**
- Systemic wiring guide: `Docs/plans/2026-04-16-systemic-wiring-guide.md` (§2 enrichment placeholders feed THR-31 from THR-35 faction traits)
- Parent design: `Docs/plans/2026-03-31-social-systems-expansion-design.md`
- THR-110 (enrichProse wiring, prerequisite for THR-31): shipped 2026-04-16
- THR-31 (faction prose enrichment): handed off 2026-04-18, see `Docs/plans/2026-04-18-faction-encounter-prose-enrichment.md`
