# THR-137 — Intelligence Reliability Decay Tick Phase

**Linear issue:** THR-137
**Project:** Encounter Format Migration
**Parent issue:** THR-113 (intelligence consumption pathway, shipped)
**Priority:** Medium
**Effort size:** M (1 phase file + constants + trace + chronicle prose + tests + wiring)
**Status (design):** Complete — ready for dev

---

## Problem

`IntelligenceRecord.reliability` is set at grant time (via the `'intelligence'` case of `applyEncounterAftermathReaction()` in `src/engine/encounterAftermath.ts`) and is never touched again. Three downstream consumers read it:

1. `encounterScoring.ts` — boosts candidate score when any held record matches the candidate. Intel is currently binary (any record present → boost); reliability is *not* used to scale the boost but it is checked for presence via `INTEL_SCORING_BONUS`.
2. `proseEnrichment.ts` / `intelligence.ts` — exposes a compact per-category view to prose templates. The `{intel:X.reliability}` placeholder and the `reliable` / `uncertain` / `dubious` descriptor are derived by thresholding `RELIABILITY_THRESHOLD_RELIABLE = 0.7` and `RELIABILITY_THRESHOLD_UNCERTAIN = 0.4` (in `src/engine/intelligence.ts`).
3. `GameView.tsx` — passive resolution-match trace.

Because reliability never falls, (a) the pool of `reliable`-descriptor records grows without bound, (b) the prose tier skews toward confident language across a long session, and (c) the scoring-bonus surface still appears "trustworthy" to authors even though intel acquired 400 ticks ago is narratively stale. Long playthroughs silently drift from the design intent (intel is a *fading rumor*, not a permanent truth).

## Goal

Add a new per-tick phase that linearly decays `reliability` on every `IntelligenceRecord`, clamps at a configurable floor, emits an `intelligence_decayed` trace, and — when a record crosses a descriptor threshold — emits a low-significance `TickEvent` and a per-transition prose line so the player can observe that stale knowledge is fading.

**Non-goals for v1:**
- No pruning. Records persist at floor reliability; they can still satisfy `{?knows_X}` conditionals (design choice: "rumour" knowledge is still knowledge).
- No difficulty bonus scaling — that's THR-140's scope.
- No category-specific decay rates — v1 uses a single rate across all categories. Per-category tuning is a follow-on if playtesting shows some categories staling faster than others.
- No acquired-time grace period differentiated by category. A single grace window matches the hidden-mark precedent.

---

## Three-Pillar Overview

| Pillar | What changes |
|--------|-------------|
| **Engine** | New `phaseIntelligenceDecay` phase, new constants in `intelligence.ts`, new `intelligence_decayed` trace, low-sig chronicle event on threshold-cross |
| **Content** | Per-transition prose table (reliable→uncertain, uncertain→dubious) — small, category-agnostic for v1 |
| **UI** | DebugPanel surfaces `intelligence_decayed` traces; Chronicle surfaces the threshold-cross events; Agent Intelligence Panel (THR-141) already displays `reliability` — no new UI component needed |

---

## Engine Pillar

### New module: `src/engine/phaseIntelligenceDecay.ts`

Mirror the `phaseHiddenMarkDecay.ts` pattern (56 lines, clean). The phase is pure arithmetic, no PRNG, no graph access — maximally fail-soft.

**Shape:**

```ts
export function phaseIntelligenceDecay(state: GameState): Partial<GameState> {
  const records = state.intelligenceRecords;
  if (!records || records.length === 0) return {};

  const tick = state.tick;
  const nextRecords: IntelligenceRecord[] = [];
  const decayEvents: TickEvent[] = [];
  let changed = false;

  for (const record of records) {
    const age = tick - record.acquiredTick;

    // Grace period — fresh intel doesn't decay
    if (age < INTEL_RELIABILITY_GRACE_TICKS) {
      nextRecords.push(record);
      continue;
    }

    const oldReliability = record.reliability;
    const decayedReliability = Math.max(
      INTEL_RELIABILITY_FLOOR,
      oldReliability - INTEL_RELIABILITY_DECAY_PER_TICK
    );

    // No change — record already at floor
    if (decayedReliability === oldReliability) {
      nextRecords.push(record);
      continue;
    }

    changed = true;

    // Descriptor-threshold crossing? → low-sig chronicle event + prose
    const oldBand = reliabilityBand(oldReliability);
    const newBand = reliabilityBand(decayedReliability);
    if (oldBand !== newBand) {
      decayEvents.push(buildStalenessEvent(state, record, oldBand, newBand));
    }

    // Emit trace (inspectability)
    emitTrace({
      tick,
      category: 'intelligence_decayed',
      recordId: record.recordId,
      agentId: record.agentId,
      intelCategory: record.category,
      reliabilityBefore: oldReliability,
      reliabilityAfter: decayedReliability,
      delta: oldReliability - decayedReliability,
      crossedThreshold: oldBand !== newBand ? newBand : undefined,
    });

    // Replace with a new readonly record (the type is readonly)
    nextRecords.push({ ...record, reliability: decayedReliability });
  }

  if (!changed) return {};

  return {
    intelligenceRecords: nextRecords,
    tickEvents: decayEvents.length > 0
      ? [...(state.tickEvents ?? []), ...decayEvents].slice(-MAX_RECENT_EVENTS)
      : state.tickEvents,
  };
}
```

### Orchestrator insertion

Insert new phase **6.71** between **6.7 `phaseHiddenMarkDecay`** and **6.7a `phaseEmittedOmenDecay`** in `src/engine/orchestrator.ts`. Rationale: the three decay phases form a cluster (marks, intel, omens) operating on parallel append-only stateful arrays; keeping them adjacent is easier to reason about and matches the mental model "all knowledge-class state decays in this window."

```ts
// Phase 6.71: Intelligence Reliability Decay (THR-137)
s = { ...s, ...phaseIntelligenceDecay(s) };
phaseEventCounts['intelligence_decay'] = s.tickEvents.length - prevEventCount;
prevEventCount = s.tickEvents.length;
```

### Reliability band helper (shared between decay, prose, UI)

Extract a single function so the decay phase, `proseEnrichment.ts`, and any UI display use identical thresholds:

```ts
// src/engine/intelligence.ts
export type ReliabilityBand = 'reliable' | 'uncertain' | 'dubious';

export function reliabilityBand(reliability: number): ReliabilityBand {
  if (reliability >= RELIABILITY_THRESHOLD_RELIABLE) return 'reliable';
  if (reliability >= RELIABILITY_THRESHOLD_UNCERTAIN) return 'uncertain';
  return 'dubious';
}
```

If `proseEnrichment.ts` already has an inline ternary for this, migrate it. Contract test: the placeholder descriptor and the decay-phase band MUST agree.

### Constants table (NFP #1 — Tunability)

All constants live in `src/engine/intelligence.ts` next to `RELIABILITY_THRESHOLD_*`.

| Constant | Default | Purpose | Range |
|----------|---------|---------|-------|
| `INTEL_RELIABILITY_DECAY_PER_TICK` | `0.001` | Linear reliability drop per tick past grace window. ~0.1%/tick. At a tick rate of ~10 ticks/game day, full decay (0.7 → 0.0) takes ~700 ticks / ~70 game days. | 0.0005–0.005 |
| `INTEL_RELIABILITY_FLOOR` | `0.0` | Lower bound; records persist below floor (dubious-band intel is still queryable). | 0.0–0.2 |
| `INTEL_RELIABILITY_GRACE_TICKS` | `20` | Grace period after `acquiredTick` before decay begins. Matches `MARK_DECAY_GRACE_TICKS` default — keeps decay phases in the same narrative cadence. | 10–60 |
| `INTEL_DECAY_EVENT_SIGNIFICANCE` | `0.25` | Chronicle event significance on threshold crossing. Lower than hidden-mark decay (0.3) — intel is less load-bearing. | 0.1–0.4 |

All four must be `export const` at module scope with JSDoc `@range` annotation (same pattern as hidden-mark constants in `src/engine/hiddenMarks.ts`).

### Tracing (NFP #2 — Inspectability)

Add a new trace type to `src/types/trace.ts`:

```ts
/** Trace: intelligence record reliability decayed this tick (THR-137) */
export interface IntelligenceDecayedTrace extends TraceBase {
  category: 'intelligence_decayed';
  recordId: string;
  agentId: string;
  intelCategory: IntelligenceCategory;
  reliabilityBefore: number;
  reliabilityAfter: number;
  delta: number;
  /** Non-undefined only when the decay crossed a descriptor boundary. */
  crossedThreshold?: ReliabilityBand;
}
```

Extend the `TickTrace` union to include it (pattern: same as `IntelligenceGrantedTrace` / `IntelligenceReferencedTrace`).

**Emission rule:** emit one trace per record that actually changed reliability this tick. Skip records in grace, skip records already at floor. This keeps trace volume bounded: at most one trace per active record per tick.

### Determinism (NFP #3)

Phase is a pure `Math.max` + subtract + readonly-record replacement. No PRNG reads. No graph calls. Same `(state.intelligenceRecords, state.tick)` → same output — verifiable in a contract test.

The threshold-crossing prose pick (see Content section) is either (a) deterministic via a (seed ^ tick ^ recordId) hash into the table, matching the `hiddenMarkProse.ts` precedent, or (b) simply indexed by `recordId.length % table.length`. Either is deterministic and avoids touching the main PRNG stream.

### Fail-soft (NFP #4)

| Case | Behaviour |
|------|-----------|
| `state.intelligenceRecords` is `undefined` | Return `{}` — no-op. |
| Records array is empty | Return `{}` — no-op. |
| Record lacks `acquiredTick` (legacy data) | Treat as age = 0 → grace → skip. Emit one-time `console.warn` guarded by a module-level flag so it doesn't spam per-tick. |
| `record.reliability` is `NaN` or missing | Coerce to `INTEL_RELIABILITY_FLOOR`, emit the standard trace with `delta` = the implied jump. |
| `tickEvents` array missing | Initialize from `[]`, append, apply `MAX_RECENT_EVENTS` slice. |
| Trace emit throws | Wrap each `emitTrace` in `try/catch`; a failed trace must not skip the reliability update. |

No thrown exceptions escape the phase. The tick loop never crashes.

### NFP Compliance (full 7)

| NFP | Status | Note |
|-----|--------|------|
| 1 Tunability | PASS | 4 named constants, all `@range`-annotated |
| 2 Inspectability | PASS | `intelligence_decayed` trace with before/after/delta, threshold-cross event |
| 3 Determinism | PASS | Pure arithmetic, no PRNG, deterministic prose pick |
| 4 Fail-soft | PASS | See fail-soft table |
| 5 Narrative over mechanical | PASS — threshold-cross chronicle event keeps fade visible; no dead air |
| 6 Additive | PASS — new phase, new trace, new constants; no existing-shape changes |
| 7 Perf budget | PASS — O(records) per tick, no graph walks; volume bounded (records typically <50 per mid-game session) |

---

## Content Pillar

### Threshold-cross prose table — `src/data/intelligence-staleness-prose.ts` (new file)

Two transitions, 3 lines each. Category-agnostic for v1. The phase consults this table when `oldBand !== newBand`.

```ts
export const STALENESS_PROSE_RELIABLE_TO_UNCERTAIN: readonly string[] = [
  "What {agent.name} knew about {intel.label} grows less certain. Details slip. The shape persists.",
  "The memory of {intel.label} softens at its edges for {agent.name}.",
  "{agent.name}'s grip on {intel.label} loosens — still knowledge, but knowledge that could lie.",
];

export const STALENESS_PROSE_UNCERTAIN_TO_DUBIOUS: readonly string[] = [
  "{intel.label} is, for {agent.name}, now rumour more than record.",
  "{agent.name} can no longer swear to {intel.label}. Only that there was, once, something.",
  "What {intel.label} meant for {agent.name} has worn down to a half-truth.",
];
```

Enrichment placeholders: `{agent.name}` resolved via standard narrative context, `{intel.label}` via the record's `label` field. Pipeline passes both explicitly from the phase (no full `gatherNarrativeContext` call needed — we only need two values).

Each generated line becomes the `message` of a `TickEvent` with:
- `significance`: `INTEL_DECAY_EVENT_SIGNIFICANCE` (0.25)
- `type`: `'intelligence_decay'` (new TickEvent type; add to the union in `src/types/gameState.ts`)
- `actorIds`: `[record.agentId]`

Authors can expand the table per-category later — the data shape is forward-compatible (just add a category-keyed lookup layer).

### Wiring-guide impact

Per `Docs/plans/2026-04-16-systemic-wiring-guide.md`, intelligence is one of the 7 documented engine capabilities (section "Intelligence"). After this ships, the guide section must note:

- Records decay after a grace period of `INTEL_RELIABILITY_GRACE_TICKS` ticks.
- Reliability floors at `INTEL_RELIABILITY_FLOOR` — records persist indefinitely in v1.
- Threshold-cross events land in the chronicle — authored prose can reference intel knowing it will fade.

Update the guide in the implementation PR (Definition of Done already requires this when engine capabilities change).

---

## UI Pillar

### DebugPanel (inspectability)

`DebugPanel.tsx` already renders intelligence-related traces (`intelligence_granted`, `intelligence_referenced`) in its trace stream. Add `intelligence_decayed` to the category filter and render it with:

- Row summary: `"{agentId} · {intelCategory} · {reliabilityBefore.toFixed(2)} → {reliabilityAfter.toFixed(2)}" + (crossedThreshold ? " ⚠ now " + crossedThreshold : "")`
- Colour treatment: same palette as `intelligence_referenced`, suffixed with the decay arrow glyph (→) for quick visual distinction.

No new tab needed — slot into the existing trace list.

### Chronicle (player-visible)

The threshold-cross `TickEvent` (`type: 'intelligence_decay'`) flows through the existing chronicle pipeline. It inherits the same low-significance rendering treatment as the hidden-mark decay event (THR-132 shipped this pattern). No new component. Just make sure the event type is registered in the chronicle renderer's known-types map — if unknown types already render via a generic fallback, no change is required.

### Agent Intelligence Panel (THR-141 — shipped)

THR-141's panel already displays per-record reliability. Because the panel reads from `state.intelligenceRecords` on every render, reliability values will update automatically as the phase runs. Confirm one thing during implementation: the panel's reliability descriptor (if it renders "reliable" / "uncertain" / "dubious") must call the shared `reliabilityBand()` helper extracted in the engine section. If it has an inline ternary, replace it.

### Hex map signifier

N/A — intelligence is invisible on the hex map (it's a per-agent knowledge record, not a world fact). No signifier change.

### Player controls

N/A — decay is automatic, not player-triggered. No action template surfaces this.

---

## Wiring Section

Per `Docs/plans/wiring-checklist.md`:

| Surface | Connection |
|---------|-----------|
| **Orchestrator phase** | Insert `phaseIntelligenceDecay` at 6.71 between `phaseHiddenMarkDecay` (6.7) and `phaseEmittedOmenDecay` (1.7a). Import from `./phaseIntelligenceDecay`. Add `phaseEventCounts['intelligence_decay']` bookkeeping. |
| **GameState field** | Reuses existing `state.intelligenceRecords: IntelligenceRecord[]` — no new field. |
| **Trace category** | New `'intelligence_decayed'` trace added to `src/types/trace.ts`, union, and DebugPanel trace renderer. |
| **TickEvent type** | New `'intelligence_decay'` event type added to `TickEventType` union in `src/types/gameState.ts`. |
| **Prose table** | New file `src/data/intelligence-staleness-prose.ts`. Two constant arrays, 3 lines each. |
| **Shared helper** | Export `reliabilityBand(reliability)` from `src/engine/intelligence.ts`. Migrate inline thresholding in `proseEnrichment.ts` / UI panel to use it. |
| **DebugPanel** | Render `intelligence_decayed` traces in existing intel-trace section. |
| **Chronicle** | `intelligence_decay` TickEvent flows through existing renderer — confirm known-type map. |
| **Wiring-checklist update** | Add row for new phase 6.71 under "Orchestrator Tick Loop". |
| **Systemic wiring guide** | Update the "Intelligence" capability section to document decay behaviour and the new constants. |

No new modals, no new HexMap layers, no new player controls. Pure engine phase + trace + chronicle event surfaced via existing infrastructure.

---

## Testing

New test file `src/engine/__tests__/phaseIntelligenceDecay.test.ts`:

1. **Empty / undefined records** — returns `{}`, state unchanged.
2. **Grace period honoured** — record with `age < GRACE_TICKS` is not decayed.
3. **Monotonic decay** — over N ticks past grace, reliability strictly decreases by `N * DECAY_PER_TICK` until clamped.
4. **Floor respected** — reliability never drops below `INTEL_RELIABILITY_FLOOR`.
5. **Determinism** — same input state + same tick → same output across 10 runs.
6. **Threshold-cross event fires exactly once** — a record that crosses `0.7` once produces exactly one `type: 'intelligence_decay'` event, not repeating on subsequent ticks.
7. **Trace emitted per changed record** — records in grace or at floor emit no trace.
8. **Legacy data (missing acquiredTick)** — treated as age 0, not decayed, no crash.

**Contract test** in `src/engine/__tests__/contracts/intel-decay-band-agreement.contract.test.ts`:

- For 100 random reliabilities in [0,1], assert `reliabilityBand(r)` equals the descriptor that `proseEnrichment.ts` produces for the same reliability. Prevents the two sites drifting.

**Integration test** extension to `intelligenceConsumption.test.ts`:

- Grant a record, advance N ticks past grace, assert (a) scoring bonus still applies, (b) prose descriptor demotes on threshold crossing, (c) chronicle event appears on crossing.

---

## Rollout & Tuning Notes

- `INTEL_RELIABILITY_DECAY_PER_TICK = 0.001` is deliberately slow. Fresh intel (reliability 0.9) takes ~900 ticks to floor — multiple game days. This keeps the decay a *background pressure* rather than a noticeable per-session drain. If playtesting shows intel inflation is still a problem at this rate, the knob is just a constant change.
- If pruning becomes desirable later (e.g. records pile up to thousands), add `INTEL_RELIABILITY_DROP_THRESHOLD` (suggested 0.0 → drop, or 0.05) and extend the phase to filter `nextRecords`. Emit an additional `intelligence_pruned` trace if so. Deferred until we see the actual record volume.
- Per-category decay rates (shrine intel decays faster than relationship intel?) are a natural follow-on — the constant becomes a `Record<IntelligenceCategory, number>` lookup with a default fallback. Defer until a specific category shows calibration issues in playtesting.

---

## Acceptance Checklist

- [ ] `phaseIntelligenceDecay` added, wired at orchestrator 6.71
- [ ] Four constants exported from `intelligence.ts` with `@range` JSDoc
- [ ] `reliabilityBand()` helper extracted; `proseEnrichment.ts` migrated to it
- [ ] `IntelligenceDecayedTrace` added to `src/types/trace.ts` and union
- [ ] `intelligence_decay` TickEvent type added to the union
- [ ] Prose table file committed with 6 lines (2 transitions × 3 variants)
- [ ] DebugPanel renders new trace category
- [ ] All 8 unit tests + 1 contract test + 1 integration extension pass
- [ ] `npm test`, `npx tsc --noEmit`, `npx vite build` clean
- [ ] `Docs/plans/wiring-checklist.md` updated with row for phase 6.71
- [ ] `Docs/plans/2026-04-16-systemic-wiring-guide.md` "Intelligence" section updated
- [ ] `Docs/changelog.md` + `Docs/project-status.md` + `Docs/project-history.md` updated per Definition of Done
- [ ] Commit body includes `Fixes THR-137`

---

## Open Questions for Codex Review

- Should the grace period be per-category? (v1: no — single constant.)
- Should reliability decay rate scale with intel-source context (e.g. rumour sources decay faster than witnessed-events)? (v1: no — source-scaling needs source tagging that doesn't exist yet.)
- Should decay pause while the agent is actively referencing the record (last-referenced-tick > N ago = don't decay)? (v1: no — keeps the model simple; the grace period covers fresh-use.)

All three are low-risk to revisit once the phase ships and we see records at scale.
