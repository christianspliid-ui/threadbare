# THR-112 — Hidden Mark Revelation Pathway

**Linear issue:** THR-112
**Project:** Encounter Format Migration
**Phase:** Phase 0, Group A (Loop closers)
**Priority:** Urgent
**Effort size:** L (1–2 weeks, solo-agent focused)
**Status:** Implementation Planning
**Parent design:** `Docs/plans/2026-04-16-encounter-template-migration.md` → "Phase 0 Engine prerequisites → Group A: Loop closers", item 1.

## Problem

`applyEncounterAftermathReaction()` in `src/engine/encounterAftermath.ts` (case `'hidden_mark'`, lines ~242–290) writes `HiddenMark` records into `GameState.hiddenMarks[]` with a `revealFamilies: string[]` field that is supposed to cause those marks to surface during future encounters. Today:

- `src/engine/hiddenMarks.ts` provides `checkMarkReveals()`, `revealHiddenMark()`, and `removeHiddenMark()` helpers that are called **only from tests**.
- No encounter scoring, selection, filtering, or resolution code path reads `state.hiddenMarks`.
- Marks are therefore write-only: authors can plant them, but nothing observable ever happens as a result. Migrating 115 templates while this loop remains open means asking authors to write into a void — exactly the "flat/non-living" content pattern the narrative tiebreaker rejects.

The `hidden_mark_placed` and `hidden_mark_revealed` trace categories already exist in `src/types/trace.ts` (lines 881, 894); `hidden_mark_placed` is emitted from `encounterAftermath.ts`; `hidden_mark_revealed` is emitted only from `revealHiddenMark()` in `hiddenMarks.ts` — which, as above, no non-test caller invokes.

## Goal

Close the loop. A hidden mark planted on an agent, with `revealFamilies: ['investigation']`, must cause the engine to produce observable consequences when that agent participates in an encounter whose `templateId` begins with `investigation.` — at minimum a chronicle event, optionally an encounter-scoring boost, and the mark must be marked as revealed (consumed + traced).

**Non-goals for v1:**
- No new player-facing modal. Reveal surfaces through the existing `recent_event` / chronicle pipeline plus traces.
- No authored "revelation prose" on the mark itself. Reveal prose is generic for v1 (`"A buried truth surfaces: {label}"`). Authored revelation prose is deferred (see Deferrals).
- No mark-to-mark interaction (cascading reveals). One mark → one reveal event.

## Design decisions (load-bearing)

### D1. Where revelation fires: at encounter **selection**, not at encounter **resolution**.

The wiring question is "when do we check `revealFamilies` against a real encounter?" Three candidates surfaced:

1. **At aftermath time** — check if *this* encounter's family matches any existing mark on the actor, fire revelation inside `applyEncounterAftermathReaction()`.
2. **At scoring time** — when the agent is deciding which encounter to engage, check marks against each candidate; matching candidates get a scoring boost *and* a pending-reveal flag.
3. **At resolution time** — after the encounter resolves successfully, check marks against the completed encounter's templateId.

**Selected: 2 (scoring-time boost) + 3 (resolution-time consumption).** A matching encounter gets a scoring nudge so the *right* encounter fires preferentially (marks make revelation-encounters more attractive to the investigator), and the actual mark consumption + trace + chronicle event happens when that encounter resolves successfully. This is the only option that couples planting to surfacing in a way the narrative tiebreaker accepts — an investigation encounter appearing in an agent's option set because they carry a mark, then consuming the mark when the investigation completes, is a causally legible loop.

Rejected: Option 1 alone (pure aftermath-time check) — too late; marks and the encounter that would reveal them never get into causal contact because nothing influences which encounter the agent picked. Option 3 alone — correct but toothless; the agent's decision engine ignores marks, so reveals only happen by coincidence.

### D2. Matching: **prefix match on templateId**, consistent with the existing seed family convention.

`HiddenMark.revealFamilies` is already a `readonly string[]` of family prefixes. The convention elsewhere (`PendingEncounterSeed.encounterFamily`, `encounterSeeding.ts`) matches by `templateId.startsWith(family)`. The existing helper `checkMarkReveals()` already uses `encounterFamily.startsWith(f)` — we flip the relationship (test each candidate templateId against each mark's revealFamilies) but keep the prefix semantics.

### D3. Severity gates probability; **reveal is not deterministic**.

A severity-0.2 mark should not auto-trigger every time a matching encounter resolves. Severity acts as a probability gate on consumption: `rng() < severity * REVEAL_PROBABILITY_MULT`. For severity 1.0, reveal is near-certain; for 0.2, roughly 1-in-5 matching encounters will consume the mark. This lets authors plant "light" marks without guaranteeing reveal.

Scoring nudge is **not** gated by severity — any matching candidate gets the full bonus, because the intent of scoring nudge is to *make the right encounter appear*. Probability gating at consumption prevents tiny marks from being over-weight.

### D4. Decay: marks fade but never silently disappear.

Marks over `MARK_DECAY_GRACE_TICKS` old tick their `severity` down by `MARK_DECAY_PER_TICK` per tick. When severity falls below `MARK_DECAY_FLOOR` (currently `0.05`), the mark is removed with a `hidden_mark_revealed` trace variant `revealedBy: 'decay'` — so decay is observable in traces.

This lives in a new `phaseHiddenMarkDecay` tick phase (see Wiring). Decay is independent of revelation — a mark can decay to oblivion without ever being matched.

### D5. Revelation does **not** modify `reputationScore` or `reputationTally` in v1.

The design doc question "Does mark revelation feed the reputation system?" — for v1, **no**. Reveal generates a `recent_event` with elevated significance (`0.7`), emits the `hidden_mark_revealed` trace, and removes the mark. Reputation-facing consequences are authored via *follow-on* encounter-seeds planted by the revealing encounter's own aftermath. Wiring marks directly into reputation would force revelation semantics into a system that currently has no author-visible lever for "revealed marks matter more than other encounters" — and we don't want to design that lever in this issue.

Deferred: THR-TBD "Reputation impact of mark revelation" — opens once authors have enough revelation-encounter content to need it.

### D6. The mark list is **queryable by intelligence systems too**, but that integration lives in THR-113.

This issue ships the mark-reveal loop end-to-end for encounter-driven revelation. Cross-system queries (an investigator's `intelligence` record surfacing someone else's marks) are out-of-scope here and tracked under THR-113's intelligence-consumption design.

---

## Engine pillar

### E1. New tick phase: `phaseHiddenMarkDecay` (position 7.3)

Location: new file `src/engine/phaseHiddenMarkDecay.ts`, imported and called from `src/engine/orchestrator.ts` between `phaseReputationDecay` (7.1) and `phaseDivineInfluenceDecay` (7.2) — slot 7.3 (numbering respects the existing decay-group convention).

Responsibilities:
1. Iterate `state.hiddenMarks ?? []`.
2. For each mark where `tick - placedTick >= MARK_DECAY_GRACE_TICKS`:
   - Multiply `severity *= (1 - MARK_DECAY_PER_TICK)` (recomputed each tick; `severity` becomes mutable through a replacement pattern since `HiddenMark` is `readonly`).
   - If `severity < MARK_DECAY_FLOOR`, drop the mark, emit `hidden_mark_revealed` with `revealedBy: 'decay'` and `ticksSincePlacement: tick - placedTick`.
3. Return `Partial<GameState>` with the new `hiddenMarks` list.

Pure function, deterministic, PRNG-free.

### E2. Reveal-check helper: `evaluateMarkReveals()` in `src/engine/hiddenMarks.ts`

New pure function, additive (existing helpers stay):

```ts
export interface MarkRevealCandidate {
  readonly mark: HiddenMark;
  readonly templateId: string;
  /** Probability of consumption at resolution: severity * REVEAL_PROBABILITY_MULT clamped to [0,1] */
  readonly revealProbability: number;
}

/**
 * For a given agent and encounter templateId, returns all marks whose revealFamilies
 * match the templateId by prefix. Does NOT consume the mark — pure query.
 *
 * Used at: scoring time (to boost matching candidates) and resolution time
 * (to probabilistically consume matched marks).
 */
export function evaluateMarkReveals(
  state: GameState,
  agentId: string,
  templateId: string,
): readonly MarkRevealCandidate[];
```

Matching rule: `mark.targetAgentId === agentId AND mark.revealFamilies?.some(f => templateId.startsWith(f))`.

### E3. Scoring-time integration: `encounterScoring.ts` scoring boost

In `scoreAndSelect()` (around line 716 and the per-entry scoring loop at line ~820–907 in `src/engine/encounterScoring.ts`), after the existing `chainBonus`, `resonance`, `ambitionBoost` etc. are computed and before `finalScore` is assembled, add:

```ts
// Mark reveal bonus — encounters matching an agent's hidden marks score higher
// so investigation-style content surfaces preferentially when the agent is marked.
const markRevealMatches = evaluateMarkReveals(state, agentId, entry.templateId);
const markRevealBonus = markRevealMatches.reduce(
  (sum, m) => sum + MARK_REVEAL_SCORING_BONUS * m.mark.severity,
  0,
);
```

Then include `markRevealBonus` as a fixed additive component on `finalScore` alongside `explorationBonus`, `chainBonus`, etc. (line ~906). Add `markRevealBonus` to the `ScoredCandidate` interface and trace output (`ScoringTrace.topCandidates[].markRevealBonus?: number`).

**Signature impact:** `scoreAndSelect()` does not currently receive `state: GameState` directly — it receives `graph`, `agentId`, `candidates`, etc. The minimum-impact change is to thread `hiddenMarks` (or the full state) through — prefer adding `hiddenMarks: readonly HiddenMark[]` as a new explicit parameter (ADR-style: keep the function dependency-minimal). Fail-soft: if omitted, bonus is 0, no behavior change from today.

### E4. Resolution-time consumption hook

In `src/components/Game/GameView.tsx` at line 1919 (the single existing call site of `applyEncounterAftermathReaction`), wrap the aftermath call:

```ts
const nextState = applyEncounterAftermathReaction(prev, activeAction, reaction, prev.tick);
const finalState = consumeMatchingMarks(
  nextState,
  activeAction?.actorId,
  activeAction?.templateId,
  prev.tick,
  prev.prngSeed ?? 'fallback',
);
```

New helper `consumeMatchingMarks()` in `hiddenMarks.ts`:

```ts
/**
 * At encounter resolution, probabilistically consume any marks on the actor
 * whose revealFamilies match the resolved template. Each matched mark rolls
 * rng() < severity * REVEAL_PROBABILITY_MULT; on hit the mark is removed,
 * hidden_mark_revealed is traced, and a chronicle ripple_consequence event
 * is appended.
 *
 * Uses seeded rng derived from (prngSeed, tick, markId) for determinism.
 */
export function consumeMatchingMarks(
  state: GameState,
  agentId: string | undefined,
  templateId: string | undefined,
  tick: number,
  prngSeed: string,
): GameState;
```

Why in GameView, not in `applyEncounterAftermathReaction` itself? Because only some reactions represent "successful encounter completion" — aftermath reactions fire on *any* player choice, including "walk away". Marks should consume on *resolution*, which in the unified action pipeline is the moment the player selects a reaction. This matches the semantic the design doc wants.

Alternative considered and rejected: fire consumption inside `applyEncounterAftermathReaction` with a new `revealsMarksOnCompletion: boolean` field on the reaction. Rejected because it forces every authored reaction to opt in, and reveal should be an engine-level behavior not a template-level flag.

### E5. Determinism: seeded rng for consumption rolls

Consumption is probabilistic, so it must use seeded PRNG. Source: derive a seed from `gameState.prngSeed` (if present) + `tick` + `markId`. Construction via existing `src/engine/rng.ts` `createSeededRng(seedString)` helper. Each `markId` gets its own rng stream so mark A's roll doesn't affect mark B's roll.

**If `state.prngSeed` does not exist on current `GameState`:** fall back to `'fallback-mark-reveal'` literal. Fail-soft per NFP #4; document in impediment log and file a deferral issue ("Make prngSeed canonical in GameState") if we discover it's missing.

### E6. Mark decay produces observable traces

Decay emits `hidden_mark_revealed` with a sentinel `revealedBy: 'decay:severity_floor'`. This is a *type-of-reveal* variant, still fits the interface. Alternatively, introduce a `hidden_mark_expired` category — rejected because it would proliferate categories for a distinction that's easily captured in the `revealedBy` field and filterable from the existing category.

---

## Content pillar

### C1. No new content required for THR-112 to land.

The test template `broker.quest.rival_shrine_betrayal` already plants a mark with `revealFamilies: ['investigation']`. We will **not** ship a dedicated revelation encounter template with THR-112. The loop works as soon as any investigation-prefixed encounter exists in the cache for an agent carrying an investigation-family mark. Phase 1's thieves-guild migration (which ships investigation-flavor encounters) will naturally exercise the loop.

### C2. Wire the systemic wiring guide

Update `Docs/plans/2026-04-16-systemic-wiring-guide.md` per the design doc's Phase 0 correction pass line 771: add a "Hidden-mark revelation" section reflecting the shipped behavior (scoring boost + probabilistic consumption + decay). Mark the capability with a 🟢 readiness marker. This is part of THR-112's Definition of Done, not separate work.

### C3. Author-facing documentation snippet

Add to the wiring guide (and cross-reference from prose skill READMEs):

> **Hidden marks make matching encounters more attractive.** A mark with `revealFamilies: ['investigation']` on an agent boosts every `investigation.*` encounter's scoring value proportional to severity. When such an encounter resolves successfully, the mark rolls (probability = severity × 0.9) to be consumed and surface as a chronicle event `"A buried truth surfaces: {label}"`. Marks over 20 ticks old decay; marks below severity 0.05 vanish silently (traced as `hidden_mark_revealed` / `revealedBy: decay`).

### C4. Authored revelation prose (DEFERRED)

Future work, not in THR-112: allow reactions on revelation encounters to carry `revealedMarkProse: string` or `revealedMarkCallback` placeholders. Today the chronicle event is generic. This is cheap to layer on later — file as a deferral labeled `Deferral` in the migration project.

---

## UI pillar

### U1. No new player-facing components.

Reveals surface through existing channels:

| Channel | What the player sees | Existing component |
|--|--|--|
| NarrativeLog | "A buried truth surfaces: Caught reaching for the wrong purse." | `NarrativeLog.tsx` (already consumes `recentEvents`) |
| ToastStack | Toast if `significance >= 0.7` | `ToastStack` via `useRecentEventToasts` |
| Scene So Far (encounter result pane) | Optional inline paragraph if the active encounter's resolution revealed a mark | `EncounterResultPane` — zero code change; the event is already in `recentEvents` |

### U2. DebugPanel trace visibility

The `hidden_mark_placed` and `hidden_mark_revealed` trace categories already appear in `TRACE_CATEGORIES` (line 124–126 of `src/types/trace.ts`). Verify in DebugPanel that filtering by these two categories works. No code change expected — this is a smoke-test deliverable.

Add a small DebugPanel **enhancement** (optional, but cheap): on the tick-inspector tab, show `state.hiddenMarks.length` in the same row as `state.pendingEncounterSeeds.length`. Keeps the hidden-mark state inspectable without opening the eval sidebar.

### U3. No HexMap signifier.

Marks are, by design, hidden. No tile overlay. No agent-node halo. The whole point of the system is that consequences are invisible until they surface. Narrative log on reveal is sufficient.

---

## Wiring

Per `Docs/plans/wiring-checklist.md` integration surfaces:

| Surface | Connection |
|---|---|
| **1. Orchestrator tick loop** | NEW phase `phaseHiddenMarkDecay` inserted at position **7.3** in `runTick()`, between `phaseReputationDecay` (7.1) and `phaseDivineInfluenceDecay` (7.2). |
| **2. GameView modal/overlay** | No new modal. Revelations reuse the existing `recentEvents` → `NarrativeLog` / `ToastStack` path. |
| **3. GameState consumption** | `state.hiddenMarks` (already defined at `gameState.ts:208`) gains a new reader: `evaluateMarkReveals()` called from `encounterScoring.ts` and `consumeMatchingMarks()` called from `GameView.tsx` aftermath handler. Writer remains `encounterAftermath.ts` case `'hidden_mark'`. |
| **4. Trace emission** | `hidden_mark_revealed` (already in types) gains first non-test emitter: `consumeMatchingMarks()` in `hiddenMarks.ts` and `phaseHiddenMarkDecay`. Verification: `grep "category: 'hidden_mark_revealed'" src/engine/` must have ≥2 non-test hits (consumption + decay). |
| **5. DebugPanel** | Existing tabs. Add mark-count line item on tick-inspector (U2). |
| **6. Prose pipeline** | Chronicle event message is a fixed-string literal for v1 (`"A buried truth surfaces: ${mark.label}"`). `enrichProse()` not called — no placeholders. |
| **7. Player controls** | None. Marks are invisible to players by design. |
| **8. Prerequisite health** | Requires `applyEncounterAftermathReaction()` case `'hidden_mark'` to be producing marks (already verified — THR-111 trace instrumentation confirms). Requires scoring pipeline to see non-trivial candidates (confirmed via existing `encounter-liveness.contract.test.ts`). |

### Throughput expectation

| Declaration | Value |
|--|--|
| Upstream dependency | At least one template with a `hidden_mark` aftermath effect must resolve on a simulated game (today: `broker.quest.rival_shrine_betrayal` — Phase 1 will add more). |
| Expected throughput | On a 500-tick `cli run` seeded simulation, expect ≥1 `hidden_mark_placed` trace and ≥1 `hidden_mark_revealed` trace (either consumption or decay). |
| Verification method | New contract test `src/engine/__tests__/contracts/mark-reveal-liveness.contract.test.ts` asserting both traces appear end-to-end on a fixture world. |

---

## Constants table (NFP #1)

All tunables named, declared in a new block in `src/data/agent-behavior-constants.ts` (preferred — central tuning file) or `src/engine/hiddenMarks.ts` if tied to internal decay semantics. Default values inline below.

| Constant | Default | Where declared | Purpose |
|---|---|---|---|
| `MARK_REVEAL_SCORING_BONUS` | `0.3` | `agent-behavior-constants.ts` | Per-matching-mark scaled scoring boost on the encounter candidate. Multiplied by `mark.severity`. |
| `MARK_REVEAL_SCORING_CAP` | `0.9` | `agent-behavior-constants.ts` | Maximum additive boost from all matching marks on a single candidate (prevents stacking above this). |
| `REVEAL_PROBABILITY_MULT` | `0.9` | `hiddenMarks.ts` | Multiplier on severity when rolling consumption. At severity 1.0 → 0.9 probability; at severity 0.5 → 0.45. |
| `MARK_DECAY_GRACE_TICKS` | `20` | `hiddenMarks.ts` | Ticks after `placedTick` before decay begins. Gives gameplay time for natural reveal. |
| `MARK_DECAY_PER_TICK` | `0.02` | `hiddenMarks.ts` | Fraction of current severity lost per tick, once grace expires (exponential decay). |
| `MARK_DECAY_FLOOR` | `0.05` | `hiddenMarks.ts` | Severity threshold below which the mark is dropped. |
| `REVEAL_EVENT_SIGNIFICANCE` | `0.7` | `hiddenMarks.ts` | Chronicle `recent_event.significance` on successful revelation (high enough to toast). |
| `REVEAL_EVENT_TYPE` | `'ripple_consequence'` | `hiddenMarks.ts` | TickEvent.type for the chronicle event. Reuses existing ripple plumbing. |

---

## Tracing (NFP #2)

### Existing trace types (already defined, already emitted from non-test code? check)

- `HiddenMarkPlacedTrace` (`src/types/trace.ts:881`) — **emitted** from `encounterAftermath.ts`. No change.
- `HiddenMarkRevealedTrace` (`src/types/trace.ts:894`) — defined, **emitted only from `revealHiddenMark()` in `hiddenMarks.ts`**, which today has zero non-test callers. **This plan adds two non-test callers**: `consumeMatchingMarks()` (encounter resolution) and `phaseHiddenMarkDecay` (decay).

### Interface re-spec

```ts
// Already defined in src/types/trace.ts — confirm no schema change needed
export interface HiddenMarkRevealedTrace extends TraceBase {
  category: 'hidden_mark_revealed';
  markId: string;
  actorId: string;
  /**
   * templateId of the encounter/action that matched revealFamilies,
   * OR sentinel 'decay:severity_floor' when dropped by decay.
   */
  revealedBy: string;
  ticksSincePlacement: number;
}
```

**Schema addition needed?** No. The existing interface's `revealedBy: string` field absorbs the decay-sentinel variant without change.

### Trace emission sites after THR-112

| Category | Site | Trigger |
|---|---|---|
| `hidden_mark_placed` | `encounterAftermath.ts` case `'hidden_mark'` | Aftermath reaction plants a mark (unchanged from today) |
| `hidden_mark_revealed` (consumption) | `consumeMatchingMarks()` in `hiddenMarks.ts` called from `GameView.tsx` aftermath handler | Encounter resolved, rng roll succeeded |
| `hidden_mark_revealed` (decay) | `phaseHiddenMarkDecay.ts` | Severity fell below `MARK_DECAY_FLOOR` |

**Verification grep:**
```
grep -rn "category: 'hidden_mark_revealed'" src/engine
# expect: ≥3 hits (revealHiddenMark + consumeMatchingMarks + phaseHiddenMarkDecay)
# of which ≥2 are non-test.
```

---

## Fail-soft table (NFP #4)

| Failure case | Fallback | Where handled |
|---|---|---|
| `state.hiddenMarks` undefined | Treat as empty array (existing pattern `?? []` in helpers) | All helpers |
| `mark.revealFamilies` undefined/empty | Mark never matches; decays normally | `evaluateMarkReveals()` |
| `activeAction.templateId` undefined at resolution | No consumption attempted; marks remain. No crash. | `consumeMatchingMarks()` |
| `activeAction.actorId` undefined | No consumption (no target agent). | `consumeMatchingMarks()` |
| `state.prngSeed` missing | Fall back to `'fallback-mark-reveal'` seed; log once via `console.warn` at runtime, file Deferral impediment | `consumeMatchingMarks()` |
| Scoring call with `hiddenMarks` param omitted | `markRevealBonus = 0`; no scoring change | `scoreAndSelect()` |
| `emitTrace` throws (defensive) | Catch, swallow, never block aftermath (NFP #4 absolute rule — tick loop never crashes) | Each call site |
| `phaseHiddenMarkDecay` throws | Orchestrator try/catch (existing pattern) returns `{}`, tick proceeds, `tick_crash` trace emitted | `orchestrator.ts` per-phase guard |
| Decay processes empty `hiddenMarks` | Fast-path return `{}` — no state mutation | `phaseHiddenMarkDecay.ts` |

---

## Testing

### New tests

1. `src/engine/__tests__/hiddenMarkReveal.test.ts` — unit tests for:
   - `evaluateMarkReveals()` match/no-match semantics
   - `consumeMatchingMarks()` determinism (same seed → same consumption set)
   - `consumeMatchingMarks()` probability scaling (severity 1.0 → always fires over 100 iterations seeded; severity 0.1 → fires on expected subset)
   - Mark decay: grace period → no decay; post-grace → severity decreases; below floor → removed + traced.

2. `src/engine/__tests__/phaseHiddenMarkDecay.test.ts` — phase behavior, empty-state fast path, trace emission on floor crossing.

3. `src/engine/__tests__/contracts/mark-reveal-liveness.contract.test.ts` — end-to-end: plant a mark, run 30 ticks with an investigation encounter available to the agent, assert at least one `hidden_mark_revealed` trace fires (consumption OR decay).

4. Extend `src/engine/__tests__/encounterScoring.test.ts` — add case: candidate matching a planted mark scores higher than the same candidate without a mark, by `MARK_REVEAL_SCORING_BONUS * severity` (± floating tolerance).

### Existing tests to audit

- `src/engine/__tests__/hiddenMarks.test.ts` — should still pass; no behavior change to existing helpers.
- `src/engine/__tests__/encounterAftermath.test.ts` — no change; aftermath-side of mark placement is untouched.

---

## Implementation sequence (recommended for coding sub-agent)

1. **Constants & types first.** Declare the eight constants in `agent-behavior-constants.ts` / `hiddenMarks.ts`. Confirm `HiddenMarkRevealedTrace` in `src/types/trace.ts` needs no schema change.
2. **`evaluateMarkReveals()` helper + unit tests** — pure function, easiest win.
3. **`consumeMatchingMarks()` helper + unit tests** — seeded rng, probability rolls, trace emission.
4. **`phaseHiddenMarkDecay` phase + tests** — decay math, sentinel trace variant.
5. **Wire `phaseHiddenMarkDecay` into orchestrator at position 7.3.** Full-sim smoke test (`npm run cli -- --seed 42` → run 100 ticks → verify no regressions).
6. **Scoring integration** — thread `hiddenMarks` parameter into `scoreAndSelect()`, compute `markRevealBonus`, surface in `ScoredCandidate` and `ScoringTrace`. Update `encounterScoring.test.ts`.
7. **Resolution integration** — wrap `applyEncounterAftermathReaction()` call in `GameView.tsx` with `consumeMatchingMarks()`. Verify the `activeAction` is available (it is — line 1909–1917).
8. **Contract test** — mark-reveal-liveness.
9. **Update wiring-checklist.md** — add phase 7.3 row + updated trace-emitter table.
10. **Update wiring guide** (`Docs/plans/2026-04-16-systemic-wiring-guide.md`) — hidden-mark revelation section, 🟢 marker.
11. **Pre-commit verification** — `npm test`, `npx tsc --noEmit`, `npx vite build`, CLI sim 30 ticks + `traces` confirm `hidden_mark_revealed` fires.
12. **Done-definition** — commit with `Fixes THR-112` in message body, push, update project-status.md / project-history.md / changelog.md.

---

## Deferrals

File each as a Linear `Deferral` issue in the Encounter Format Migration project when THR-112 closes:

- **Authored revelation prose** — allow reactions on revealing encounters to include `revealedMarkProse: string` that interpolates `{mark.label}` and runs through `enrichProse()`. Low effort (S).
- **Reputation consequence of reveal** — connect successful mark revelation to reputation score/tally effects. Author-visible lever needed (M).
- **Cross-agent mark visibility via intelligence** — allow an intelligence-holder to see marks on another agent (enables investigator-NPC gameplay). Coupled to THR-113 (M/L).
- **`state.prngSeed` canonicalization** — if missing, formalize it on `GameState`. Impediment-logged if discovered during implementation.

---

## NFP Compliance

| # | NFP | Status | Notes |
|---|---|---|---|
| 1 | Tunability | PASS | Eight named constants in constants table, no magic numbers in runtime code. |
| 2 | Inspectability | PASS | `hidden_mark_revealed` gains two non-test emitters (consumption + decay), closing the "write-only" loop the migration doc flagged. |
| 3 | Determinism | PASS | Consumption rolls use seeded rng derived from (prngSeed, tick, markId). Decay is deterministic arithmetic. |
| 4 | Fail-soft | PASS | All eight fail-soft cases enumerated; orchestrator's per-phase guard wraps the new decay phase; missing prngSeed falls back to literal. |
| 5 | Narrative over mechanical | PASS | Scoring nudge ensures the right encounter surfaces to the investigator; consumption produces a chronicle event with elevated significance. The loop is narratively legible. |
| 6 | Additive over destructive | PASS | No change to existing mark-placement logic, aftermath dispatch, or scoring architecture. New phase, new helpers, new parameter on one scoring function. |
| 7 | Performance budget | PASS | Decay phase: O(marks). Scoring check: O(marks per agent × candidates). On a world with <100 marks and <40 candidates per agent, both are negligible. Fast-path on empty. |
