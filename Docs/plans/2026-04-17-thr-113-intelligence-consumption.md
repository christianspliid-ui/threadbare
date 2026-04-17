# THR-113 — Intelligence Consumption Pathway

**Linear issue:** THR-113
**Project:** Encounter Format Migration
**Phase:** Phase 0, Group A (Loop closers)
**Priority:** Urgent
**Effort size:** M (2–4 days, solo-agent focused)
**Status:** Implementation Planning
**Parent design:** `Docs/plans/2026-04-16-encounter-template-migration.md` → "Phase 0 Engine prerequisites → Group A: Loop closers", item 2.

## Problem

`applyEncounterAftermathReaction()` in `src/engine/encounterAftermath.ts` (case `'intelligence'`, lines ~292–341) writes `IntelligenceRecord` entries into `GameState.intelligenceRecords[]` with structured fields (`category`, `label`, `detail`, `targetRegion`, `targetEntityId`, `reliability`). Today:

- `src/engine/intelligence.ts` provides query helpers (`getAgentIntelligence`, `hasIntelligenceAbout`, `getRegionIntelligence`, etc.) that are called **only from tests**.
- No encounter selection, filtering, scoring, or prose code path reads `state.intelligenceRecords`.
- Intelligence is write-only. The `TickEvent` with `"Intelligence acquired: {label}"` is the player's only indication that anything happened — and nothing downstream *does* anything with the knowledge.

The `intelligence_granted` trace category exists and is emitted (`src/types/trace.ts:904`, emitted from `encounterAftermath.ts` at the case branch). That half of the loop is fine. The missing half: no `intelligence_consumed` / `intelligence_referenced` trace, and no engine code references records to change outcomes.

## Goal

Close the loop. Intelligence records must produce at least one observable effect in each of three consumption hooks:

1. **Encounter visibility/scoring** — knowing a shrine's location surfaces shrine encounters (awareness/scoring boost).
2. **Prose enrichment** — `{intel:category}` placeholders resolve to the record's `label`, and `{?knows_X}...{/knows_X}` conditional blocks let authored prose branch on intelligence possession.
3. **Resolution narrative** — successfully resolving an encounter whose `targetEntityId` matches an intel record should mark that record as "referenced" (trace emission), without removing it.

**Non-goals for v1:**
- No reliability-decay tick phase. (Deferred — see Deferrals.) Reliability is a consumption-time filter, not a fading score.
- No consumption = removal. Intelligence is persistent knowledge, not a depletable resource. Once known, always known (until decay lands).
- No difficulty bonus from intelligence in v1. Intelligence affects *visibility* (which encounters appear) but not resolution difficulty. Difficulty-modification is a Deferral.
- No authored "used intelligence" prose variants — just the placeholder/conditional surface.

## Design decisions (load-bearing)

### D1. Primary consumption hook: **prose enrichment** — most author-visible, lowest risk.

The three consumption hooks the design doc proposes — (a) encounter visibility/scoring, (b) prose enrichment, (c) enrichment conditionals — were all cited. I'm implementing all three in THR-113, but the **load-bearing** one is prose enrichment. It's:

- The most direct way to make intelligence *visible* in the game (player reads "I know where the shrine is — north, beyond the river").
- The least risky to wire — `proseEnrichment.ts` is already a pure function with clear inputs/outputs.
- The hook that scales best to Phase 1+ content authors.

Visibility/scoring is secondary; resolution-time trace is tertiary. Shipping all three together is fine because they're independent and all small.

### D2. Scoring boost: **binary, template-level, not per-record.**

For each encounter candidate, if **any** intelligence record held by the agent matches `(candidate.locationId, candidate.targetAgentId, templateId-prefix)`, apply a single flat scoring boost `INTEL_SCORING_BONUS`. Do not stack (unlike `hidden_marks`). Do not scale by reliability in v1.

Rationale: Intelligence is "I know something useful about this encounter". Either the agent has actionable intel on this encounter or not — it's a yes/no. Scaling by reliability has no clean author-visible surface today; we'd be adding a knob authors can't calibrate against. Defer scaling to after Phase 1 feedback.

Matching predicates:
- `record.targetEntityId === candidate.locationId` (agent knows about this specific location)
- `record.targetEntityId === candidate.targetAgentId` (agent knows about this specific target)
- `record.targetRegion === candidate.region` (if encounter has a region field — fallback)
- `record.category` match against a curated `TEMPLATE_CATEGORY_MAP` — e.g. an `'shrine_location'` record matches shrine-themed templateIds (`templateId.includes('shrine')`, `templateId.startsWith('action.veil.consecrate')`, etc.)

### D3. Enrichment placeholders: extend `NarrativeContext` with a **compact intelligence view**, not the raw record array.

Add to `NarrativeContext`:

```ts
intelligence: {
  /** Per-category label lookup for placeholder resolution. Only most-recent per category. */
  byCategory: Partial<Record<IntelligenceCategory, { label: string; detail: string; reliability: number }>>;
  /** Boolean flags for conditional blocks. */
  flags: Partial<Record<IntelligenceCategory, boolean>>;
};
```

Placeholders added to `enrichProse()`:

- `{intel:shrine_location}` → `ctx.intelligence.byCategory.shrine_location?.label ?? ''` (silent empty-string fallback, same pattern as omen/doom vocabulary today).
- `{intel:shrine_location.detail}` → `...detail`.
- `{intel:shrine_location.reliability}` → formatted reliability (`'reliable'` / `'uncertain'` / `'dubious'`, thresholded — see constants below).

Conditional blocks added to `resolveConditionals()`:

- `{?knows_shrine_location}...{/knows_shrine_location}` → renders if `flags.shrine_location === true`.
- `{?no_shrine_location}...{/no_shrine_location}` → inverse.
- Generate one pair per `IntelligenceCategory` (8 categories — generates 16 conditional keys). Kept parallel to existing `has_artifact`/`no_artifact` convention.

Gathered in `gatherNarrativeContext()` by calling new helper `buildIntelligenceView(state, agentId)`.

**Rejected:** exposing the raw `IntelligenceRecord[]` to prose templates. Authors would have to reason about arrays in a template DSL that only supports flat placeholders; the compact view is the author-friendly shape.

### D4. Reliability surfaces as **descriptor**, not number, in prose.

`record.reliability` is a 0–1 float. In prose, authors want `'reliable' / 'uncertain' / 'dubious'`. Translation via three thresholds (constants below). A record with reliability 0.85 renders as "reliable"; 0.5 as "uncertain"; 0.2 as "dubious". Numeric value stays accessible via traces.

### D5. Consumption ≠ removal. Intelligence **persists**.

Records are never removed by consumption. They are only removed by an explicit future decay phase (deferred) or by authored graph-op (not in this issue). Every time a record is "used" (placeholder hit, scoring boost applied, resolution match), emit `intelligence_referenced` trace — a new category.

### D6. New trace: `intelligence_referenced` (vs. existing `intelligence_granted`).

`intelligence_granted` = when knowledge was *acquired*. (Already exists.)
`intelligence_referenced` = when knowledge was *used* to change an outcome. (New.)

This distinction closes the write-only loop explicitly: migration readers can grep for `intelligence_referenced` and see non-zero counts to verify the consumption loop works. Without this distinction, the best we can say is "intelligence exists in state" — identical to today.

Emission sites: three places — scoring boost applied, placeholder resolved, resolution-match detected. Keep site-specific `referencedBy` field to distinguish.

### D7. Resolution-time reference is **passive observation**.

At encounter resolution, if `record.targetEntityId` matches any completed encounter's `locationId` or `targetAgentId`, emit `intelligence_referenced` with `referencedBy: 'resolution_match'`. Do not modify state. This is purely a trace for inspectability — "the intel the agent had was relevant to what just happened." Enables migration-verification queries like "did any of the intel we plant in thieves-guild content ever get referenced in subsequent encounters?"

---

## Engine pillar

### E1. New helper file section: intelligence view construction

In `src/engine/intelligence.ts`, add:

```ts
export interface IntelligenceView {
  /** Most recent (by acquiredTick) record per category. */
  readonly byCategory: Partial<Record<IntelligenceCategory, IntelligenceRecord>>;
  /** Boolean presence flag per category — true iff agent has any record in that category. */
  readonly flags: Partial<Record<IntelligenceCategory, boolean>>;
  /** All records for the agent, pre-sorted desc by acquiredTick. */
  readonly all: readonly IntelligenceRecord[];
}

/**
 * Build a compact view of an agent's intelligence suitable for prose enrichment
 * and scoring queries. Pure function; no mutations.
 */
export function buildIntelligenceView(state: GameState, agentId: string): IntelligenceView;

/**
 * Check whether any record held by agent is "actionable" for a given encounter candidate.
 * Matching rules documented in D2 above. Returns first matching record or undefined.
 */
export function findActionableIntelligence(
  state: GameState,
  agentId: string,
  candidate: {
    readonly templateId: string;
    readonly locationId: string;
    readonly targetAgentId?: string;
    readonly region?: string;
  },
): IntelligenceRecord | undefined;

/**
 * Reliability descriptor mapping for prose enrichment.
 */
export function reliabilityDescriptor(r: number): 'reliable' | 'uncertain' | 'dubious';

/**
 * Category-to-templateId match table — used by findActionableIntelligence for
 * category-level match (in addition to specific entity/region match).
 */
export const TEMPLATE_CATEGORY_MATCHERS: Readonly<Record<IntelligenceCategory, readonly string[]>>;
```

### E2. Scoring integration: `encounterScoring.ts`

In `scoreAndSelect()`, during the per-entry loop (line ~820), add after reputation-bonus/ambition-boost and before final-score assembly:

```ts
// Intelligence bonus — agent has actionable intel about this encounter
const intelRecord = findActionableIntelligence(state, agentId, {
  templateId: entry.templateId,
  locationId: entry.locationId,
  targetAgentId: entry.targetAgentId,
});
const intelBonus = intelRecord ? INTEL_SCORING_BONUS : 0;
if (intelRecord) {
  emitTrace({
    tick,
    category: 'intelligence_referenced',
    agentId,
    recordId: intelRecord.recordId,
    referencedBy: 'scoring_boost',
    templateId: entry.templateId,
    summary: `Intelligence "${intelRecord.label}" boosted scoring of ${entry.templateId} for ${agentId}`,
  });
}
```

Signature impact: same as THR-112 — `scoreAndSelect()` needs either the full `state` or an explicit `intelligenceRecords` parameter. Prefer threading full `state` (or a minimal `{ hiddenMarks, intelligenceRecords }` struct) since THR-112 already requires this thread. Coordinate with THR-112 implementation (mutex on the scoring signature change; see Linear coordination block at end).

Include `intelBonus` as additive component on `finalScore`. Add to `ScoredCandidate` + `ScoringTrace` interfaces.

### E3. Visibility/filtering: `encounterFilterPipeline.ts` (optional for v1)

`encounterFilterPipeline.ts` stage 2 filters by `visibleTo`. Intelligence could *add* candidates to the filter (i.e. an encounter normally hidden from the agent becomes visible because they have actionable intel). This is more invasive and harder to reason about.

**Decision: scoring boost only for v1.** The scoring boost already delivers "this encounter surfaces in the agent's top picks because they know about it". Adding intelligence as a visibility-gate bypass opens questions about what other visibility rules it should override. Defer to a follow-up if scoring boost alone proves too weak.

### E4. Prose enrichment integration: `proseEnrichment.ts`

Modify `NarrativeContext` interface to include `intelligence?: IntelligenceView` (optional for backward compatibility).

Modify `gatherNarrativeContext()` signature to optionally accept `state: GameState`. If provided, populate `intelligence` via `buildIntelligenceView(state, agentId)`. If omitted, `intelligence` is undefined and placeholders silent-fallback to `''`.

Modify `enrichProse()`:

```ts
// Intelligence placeholders (THR-113)
if (ctx.intelligence) {
  const categories: IntelligenceCategory[] = [
    'shrine_location', 'agent_network', 'trade_route',
    'military_position', 'political_secret', 'cultural_knowledge',
  ];
  for (const cat of categories) {
    const rec = ctx.intelligence.byCategory[cat];
    const label = rec?.label ?? '';
    result = result.replace(new RegExp(`\\{intel:${cat}\\}`, 'g'), label);
    result = result.replace(new RegExp(`\\{intel:${cat}\\.detail\\}`, 'g'), rec?.detail ?? '');
    result = result.replace(
      new RegExp(`\\{intel:${cat}\\.reliability\\}`, 'g'),
      rec ? reliabilityDescriptor(rec.reliability) : '',
    );
    if (rec) {
      emitIntelligenceReferenced(ctx.agentId, rec.recordId, 'prose_enrichment', cat);
    }
  }
}
```

Modify `resolveConditionals()`:

```ts
if (ctx.intelligence) {
  for (const cat of intelligenceCategories) {
    conditions[`knows_${cat}`] = ctx.intelligence.flags[cat] === true;
    conditions[`no_${cat}`] = !ctx.intelligence.flags[cat];
  }
}
```

Emits `intelligence_referenced` with `referencedBy: 'prose_enrichment'` each time a placeholder resolves to a non-empty string.

### E5. Resolution-time passive observation

In `GameView.tsx` around line 1919 (same site as THR-112's `consumeMatchingMarks` insertion), add:

```ts
const finalState = consumeMatchingMarks(nextState, ...);
observeResolutionIntelligence(finalState, activeAction, reaction, prev.tick);
```

New helper `observeResolutionIntelligence()` in `intelligence.ts`: iterates actor's intel records, emits `intelligence_referenced` with `referencedBy: 'resolution_match'` for any record whose `targetEntityId` matches `activeAction.targetId` or the encounter's locationId. Returns state unchanged (passive).

---

## Content pillar

### C1. No new content required for THR-113 to land.

The existing test fixtures (including `broker.quest.rival_shrine_betrayal`) already grant intelligence records. Phase 1's thieves-guild migration will exercise the consumption loop naturally (intel on target marks → intel on shrine locations → intel on faction structure).

### C2. Wire the systemic wiring guide

Update `Docs/plans/2026-04-16-systemic-wiring-guide.md`:

1. Add an "Intelligence consumption" section (paired with the "Hidden marks revelation" section from THR-112) listing the three consumption hooks and the five placeholder syntaxes.
2. Extend the author-visible placeholder reference table with `{intel:*}`, `{intel:*.detail}`, `{intel:*.reliability}`, `{?knows_*}`, `{?no_*}`.
3. Mark the capability 🟢 ready.
4. Add example: "a `broker.quest.rival_shrine_betrayal` encounter grants `{ category: 'shrine_location', label: 'the shrine north of Vault', targetEntityId: 'loc-123' }`; a later `action.veil.approach_shrine` prose template can render `{?knows_shrine_location}Kael knows this place — {intel:shrine_location}.{/knows_shrine_location}{?no_shrine_location}Kael approaches blind.{/no_shrine_location}`."

### C3. Author-facing prose skill update

Cross-reference the new placeholders in:
- `Docs/plans/prose-placeholder-reference.md` (if exists; otherwise add note to the wiring guide's placeholder section).
- `prose-content-systems` skill's prose-authoring checklist.

### C4. Authored "used intel" prose variants (DEFERRED)

Future work: allow reactions to declare `usedIntelProse: { [category]: string }` that renders only when the agent has matching intel *and* chose this reaction. Cheap to layer on later.

---

## UI pillar

### U1. No new player-facing components.

Intelligence surfaces via prose — already rendered by existing encounter modals (`MeetingEncounterModal`, `JourneyVignetteModal`, `EncounterVignetteModal`, encounter result pane). The author writes `{intel:shrine_location}` in a template; the player reads it in the modal. No new UI.

### U2. DebugPanel intel visibility

Two small additions to the DebugPanel tick-inspector tab (if space allows):

1. `state.intelligenceRecords.length` as a stat row (alongside marks, seeds).
2. "Intel" tab is overkill for v1; filtering by `intelligence_granted` + `intelligence_referenced` on the existing trace feed tab is sufficient.

Verify in `DebugPanel.tsx` that both trace categories filter correctly. `intelligence_referenced` needs to be added to `TRACE_CATEGORIES` array if not already present.

### U3. No HexMap signifier.

Intelligence is agent-internal knowledge, not a world-state artifact. No tile overlay.

### U4. Future UI (DEFERRED)

An "Intelligence" panel on agent detail sidebar — list of known intel with reliability descriptors. Valuable but not THR-113 scope. Defer with explicit `Deferral` Linear issue.

---

## Wiring

| Surface | Connection |
|---|---|
| **1. Orchestrator** | No new phase. No decay phase in v1. Consumption is synchronous at scoring / enrichment / resolution. |
| **2. GameView modal/overlay** | No new modal. Placeholders render via the existing `enrichProse()` caller chain — once the UnifiedAction encounter adapter's enrichProse wiring is fixed (separate Phase 0 item; see migration doc line 766), intel placeholders render automatically. |
| **3. GameState consumption** | `state.intelligenceRecords` gains readers: `buildIntelligenceView()`, `findActionableIntelligence()`, `observeResolutionIntelligence()`. Writer remains `encounterAftermath.ts` case `'intelligence'`. |
| **4. Trace emission** | NEW category `intelligence_referenced` added to `TRACE_CATEGORIES`. Existing `intelligence_granted` unchanged. Verification: `grep "category: 'intelligence_referenced'" src/engine/` must have ≥3 non-test hits (scoring, prose, resolution). |
| **5. DebugPanel** | Intel count row on tick-inspector (U2). No new tab. |
| **6. Prose pipeline** | `enrichProse()` extended with 3 placeholder families × 6 categories = 18 new placeholder patterns, plus 12 new conditional keys. `NarrativeContext` extended with `intelligence?: IntelligenceView`. `gatherNarrativeContext()` optionally accepts `state` to populate it. |
| **7. Player controls** | None. Intelligence is agent-internal. |
| **8. Prerequisite health** | Requires intelligence records to be produced (today: some test templates; Phase 1 guild content will supply more). Requires `enrichProse()` to actually be called from the encounter adapter — this is a separate Phase 0 deliverable (migration doc line 766 "⚠️ CRITICAL"). Without that upstream fix, placeholders render literally and the prose hook is dead. Flag as **upstream dependency**. |

### Throughput expectation

| Declaration | Value |
|--|--|
| Upstream dependency | (a) at least one template grants intelligence via aftermath, (b) the encounter adapter calls `enrichProse()` on narrative fields (Phase 0 fix). |
| Expected throughput | On a 500-tick seeded CLI run with at least 3 intel-granting encounters: ≥1 `intelligence_referenced` trace per 100 ticks post-grant. |
| Verification method | New contract test `src/engine/__tests__/contracts/intel-consumption-liveness.contract.test.ts`: plant record → next encounter resolution of a matching category fires ≥1 `intelligence_referenced`. |

---

## Constants table (NFP #1)

Declared in `src/data/agent-behavior-constants.ts` (preferred central tuning) and `src/engine/intelligence.ts` for internal descriptor thresholds.

| Constant | Default | Where declared | Purpose |
|---|---|---|---|
| `INTEL_SCORING_BONUS` | `0.25` | `agent-behavior-constants.ts` | Flat additive scoring boost when actionable intel matches an encounter candidate. |
| `RELIABILITY_THRESHOLD_RELIABLE` | `0.7` | `intelligence.ts` | Reliability ≥ this → descriptor 'reliable'. |
| `RELIABILITY_THRESHOLD_UNCERTAIN` | `0.4` | `intelligence.ts` | Reliability ≥ this (and below reliable) → 'uncertain'. Below → 'dubious'. |
| `INTEL_RESOLUTION_MATCH_REGIONS` | `true` | `intelligence.ts` | Whether to consider `targetRegion` in resolution-match (not just `targetEntityId`). |
| `INTEL_CATEGORIES` | Derived from `IntelligenceCategory` union | `intelligence.ts` | Single source of truth for category iteration — prevents drift between placeholder enumeration and type. |

Plus the existing (already-defined) `IntelligenceRecord.reliability` default of `0.8` — unchanged by this issue, but noted here as the tunable authors already see.

---

## Tracing (NFP #2)

### New trace type

Add to `src/types/trace.ts`:

```ts
/** Trace: intelligence record referenced/used (non-destructive). */
export interface IntelligenceReferencedTrace extends TraceBase {
  category: 'intelligence_referenced';
  recordId: string;
  agentId: string;
  /** Where the reference happened. */
  referencedBy: 'scoring_boost' | 'prose_enrichment' | 'resolution_match';
  /** Optional: templateId of the encounter involved (scoring/resolution only). */
  templateId?: string;
  /** Optional: intelligence category (prose_enrichment only). */
  intelCategory?: IntelligenceCategory;
}
```

And add `'intelligence_referenced'` to:
- The `TraceCategory` union (around line 68).
- The `TRACE_CATEGORIES` array (around line 126).
- The `Trace` discriminated union at the file's end.

### Trace emission sites after THR-113

| Category | Site | Trigger |
|---|---|---|
| `intelligence_granted` | `encounterAftermath.ts` case `'intelligence'` | Aftermath grants a record (unchanged) |
| `intelligence_referenced` (scoring) | `scoreAndSelect()` in `encounterScoring.ts` | Actionable intel matched a candidate during scoring |
| `intelligence_referenced` (prose) | `enrichProse()` in `proseEnrichment.ts` | `{intel:*}` placeholder resolved to a non-empty label, or a `{?knows_*}` conditional evaluated true |
| `intelligence_referenced` (resolution) | `observeResolutionIntelligence()` in `intelligence.ts`, called from `GameView.tsx` | Resolved encounter's `locationId`/`targetAgentId` matched an existing record |

**Noise note:** placeholder emission can be chatty (one template can resolve multiple `{intel:*}` tokens). Emit **one trace per unique `recordId` per `enrichProse` call**, not one per placeholder-replacement. Deduplication via a `Set` inside the function.

**Verification grep:**
```
grep -rn "category: 'intelligence_referenced'" src/engine
# expect ≥3 non-test hits.
```

---

## Fail-soft table (NFP #4)

| Failure case | Fallback | Where handled |
|---|---|---|
| `state.intelligenceRecords` undefined | Treat as `[]` (existing pattern) | All helpers |
| `IntelligenceCategory` enum extended without updating placeholder list | Untouched placeholders silent-fallback to `''`; conditional keys evaluate false | `enrichProse()`; integration test asserts parity |
| `ctx.intelligence` omitted from `NarrativeContext` | All `{intel:*}` placeholders fall through silently (empty string); all `{?knows_*}` render as false | `enrichProse()` — exactly matches today's omen/doom pattern |
| `findActionableIntelligence` match throws | Catch, return `undefined`, no bonus, no trace | `scoreAndSelect()` scoring loop |
| `emitTrace` throws | Swallow (tick-loop safety) | All emission sites |
| Unknown reliability (negative / NaN) | `reliabilityDescriptor()` returns `'dubious'` (conservative) | `reliabilityDescriptor()` |
| Resolution hook fires for an action with no actorId | Skip observation entirely | `observeResolutionIntelligence()` |
| Intel record with empty `label` | `{intel:*}` resolves to `''` (same as no record) — prevent accidental literal whitespace in prose | `enrichProse()` |

---

## Testing

### New tests

1. `src/engine/__tests__/intelligenceView.test.ts` — `buildIntelligenceView()`, `findActionableIntelligence()`, `reliabilityDescriptor()` unit tests.

2. `src/engine/__tests__/intelligenceConsumption.test.ts` — end-to-end: plant three records (two categories, one non-actionable), score a candidate that should match one of them, assert:
   - `finalScore` increased by exactly `INTEL_SCORING_BONUS`
   - `intelligence_referenced` trace emitted with `referencedBy: 'scoring_boost'`
   - Non-matching candidates do not emit the trace

3. `src/engine/__tests__/proseEnrichment.test.ts` — extend existing file:
   - `{intel:shrine_location}` resolves to record's `label`
   - Missing record → empty string (no crash, no literal "undefined")
   - `{?knows_shrine_location}...{/knows_shrine_location}` renders content when flag is true
   - `{?no_shrine_location}...{/no_shrine_location}` renders content when flag is false
   - Multiple intel placeholders in one template emit a single `intelligence_referenced` trace per unique `recordId`
   - `{intel:shrine_location.reliability}` renders the descriptor string

4. `src/engine/__tests__/contracts/intel-consumption-liveness.contract.test.ts` — the throughput contract test described above.

### Existing tests

- `src/engine/__tests__/intelligence.test.ts` — existing helper tests should still pass.
- `src/engine/__tests__/encounterAftermath.test.ts` — unchanged; aftermath grant side unchanged.
- `src/engine/__tests__/encounterScoring.test.ts` — update baseline expected scores if any test used a fixture agent that incidentally holds intel (unlikely, but check).

---

## Implementation sequence

1. **Trace type** — add `IntelligenceReferencedTrace` to `src/types/trace.ts`, add to unions and `TRACE_CATEGORIES` array. Verify DebugPanel picks it up.
2. **Constants** — declare the four named constants.
3. **`buildIntelligenceView` + `findActionableIntelligence` + `reliabilityDescriptor`** in `intelligence.ts`, plus unit tests.
4. **`observeResolutionIntelligence`** + unit test.
5. **Prose enrichment integration** — extend `NarrativeContext`, `gatherNarrativeContext` (backward-compatible optional param), `enrichProse` and `resolveConditionals`. Deduplication Set for trace emission.
6. **Update `proseEnrichment.test.ts`** with the new placeholder/conditional cases.
7. **Scoring integration** — thread `state` or `intelligenceRecords` into `scoreAndSelect()` (coordinate with THR-112 — this is the same signature change). Add `intelBonus` to `ScoredCandidate`/`ScoringTrace`.
8. **Resolution integration** in `GameView.tsx` — one-line addition calling `observeResolutionIntelligence` after `applyEncounterAftermathReaction`.
9. **Contract test** — intel-consumption-liveness.
10. **Wiring-checklist.md** updates — new trace emitter row.
11. **Wiring guide update** — intelligence consumption section, placeholder table.
12. **Pre-commit verification** — `npm test`, `npx tsc --noEmit`, `npx vite build`, CLI sim + `traces` showing both `intelligence_granted` AND `intelligence_referenced`.
13. **Done-definition** — commit with `Fixes THR-113`, push, update project-status / project-history / changelog.

---

## Coordination with THR-112

Both issues modify `scoreAndSelect()` signature (add state-derived parameter). **Mutex**: do not run both in parallel worktrees. Suggested order:

- **THR-112 first** (larger scope, adds the decay phase and establishes the state-threading pattern in scoring).
- **THR-113 second**, piggybacking on THR-112's signature change.

If running in parallel is required, coordinate a single preparatory commit that threads `state: GameState` into `scoreAndSelect()` before either issue's work begins.

Linear coordination block for Ready-for-Dev handoff:
```
Suggested model: sonnet
Parallel-safe with: (none)
Mutex with: THR-112 (shared signature change in encounterScoring.ts)
Codex review: yes
```

---

## Deferrals

File as Linear `Deferral` issues in Encounter Format Migration project when THR-113 closes:

- **Reliability decay tick phase** — reliability fades over time, low-reliability records eventually drop out. Requires authored content to expose reliability to players first. Effort M.
- **Intelligence visibility gating** — intelligence unlocks normally-hidden encounters (bypass `visibleTo` filter). Requires careful interaction rules with faction visibility. Effort M.
- **Authored "used intel" prose variants** — `usedIntelProse` on reactions. Effort S.
- **Difficulty-bonus from intelligence** — agent with actionable intel gets a resolution-step difficulty reduction. Effort S, depends on the resolution service's hook availability.
- **Agent-detail intelligence panel** — UI list of known intel with reliability descriptors. Effort M.
- **Cross-agent intelligence queries** — an investigator's intel can reveal marks on another agent (bridges THR-112's concern). Coupled with "Cross-agent mark visibility". Effort M.

---

## NFP Compliance

| # | NFP | Status | Notes |
|---|---|---|---|
| 1 | Tunability | PASS | Four named constants, iteration driven by a single category enum. |
| 2 | Inspectability | PASS | New `intelligence_referenced` trace emitted from three distinct consumption sites, with `referencedBy` field distinguishing them. Closes the write-only loop explicitly. |
| 3 | Determinism | PASS | All consumption paths are deterministic — no rng involved. Same state + same candidate → same bonus + same trace. |
| 4 | Fail-soft | PASS | Eight fail-soft cases enumerated; prose placeholder silent-fallback matches existing omen/doom pattern; scoring boost falls back to 0 if param omitted. |
| 5 | Narrative over mechanical | PASS with note | Load-bearing consumption hook is prose enrichment — intelligence is visible to the player as text in the encounter modal. Scoring boost is a quiet background nudge. Note: no authored "used intel" prose variant in v1 — all intel surface is through placeholders, not reaction-level authored alternatives. Deferred. |
| 6 | Additive over destructive | PASS | No existing behavior modified except: `NarrativeContext` interface gains an optional field (non-breaking); `scoreAndSelect()` signature change (shared with THR-112). All helpers new. |
| 7 | Performance budget | PASS | Scoring: O(records) per candidate per agent (records <20 typical). Prose: O(categories) scan per `enrichProse` call (≤8). Both are tiny compared to existing scoring work. Dedup Set per enrichProse call is O(records held). |
