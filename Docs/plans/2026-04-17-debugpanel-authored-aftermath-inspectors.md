# DebugPanel Inspectors — Hidden Marks + Pending Encounter Seeds

**Issue:** THR-136 (Deferral from THR-135, project *Encounter Format Migration*)
**Date:** 2026-04-17
**Author:** Cowork PM/design
**Status:** Ready for Dev
**Scale:** Small UI addition — two new DebugPanel tabs, no engine/content work.

## Problem

`GameState.hiddenMarks` and `GameState.pendingEncounterSeeds` are two authored-aftermath primitives introduced by the unified encounter template format (project *Encounter Format Migration*). Both have live placement/reveal/evaluate/decay paths, emit traces, and drive player-facing chronicle events — but neither has a dedicated DebugPanel inspector.

`Docs/plans/wiring-checklist.md` rows for both surfaces currently read `Debug visibility: N/A — tracked in THR-136 (no dedicated DebugPanel inspector yet; traces are visible in the feed tab)`. That's a direct NFP #2 (Inspectability) violation. Content authors migrating encounters to the unified format are authoring `hidden_mark` and `encounter_seed` aftermath effects right now and need a way to confirm placements, queue lengths, decay behaviour, and eligibility at a glance without trawling the trace feed.

## Non-Goals

* No engine changes. No trace changes. No new aftermath kinds.
* No player-facing UI surface. Debug-only.
* No mutation from the panel (no "force reveal", no "clear seed"). Read-only inspectors. Future enhancement once the shape settles.
* No prose upgrade for hidden-mark chronicle events — that's tracked in THR-132.

## Three-Pillar Coverage

| Pillar | Scope |
|--------|-------|
| **Engine** | **N/A** — data already lives on `GameState.hiddenMarks` and `GameState.pendingEncounterSeeds` (`src/types/gameState.ts:206,210`). No writes, no new phases, no trace additions. |
| **Content** | **N/A** — no templates, prose tables, or data-table edits. |
| **UI** | Primary. Two new DebugPanel `ViewMode` tabs + two small presentational components + two new `DebugPanelProps` fields + one-line wiring in `GameView.tsx`. |

## UI Design

### Tabs

Add two new `ViewMode` entries to `src/components/Game/debug/DebugTabContent.tsx`:

```ts
export type ViewMode =
  | 'feed' | 'agent-follow' | 'tick-inspector' | 'social' | 'encounters' | 'journey'
  | 'webgl' | 'factions' | 'spheres' | 'revelation-log' | 'knowledge-gaps'
  | 'armies' | 'cli' | 'strategic' | 'omens'
  | 'hidden-marks'       // NEW
  | 'encounter-seeds';   // NEW
```

Add corresponding rows to the `TABS` array, inserted after `'encounters'` so authored-aftermath inspectors cluster together visually:

```ts
{ id: 'encounters', label: 'Encounters' },
{ id: 'encounter-seeds', label: 'Seeds' },      // NEW
{ id: 'hidden-marks', label: 'Marks' },         // NEW
{ id: 'journey', label: 'Journey' },
// …
```

Short labels ("Seeds", "Marks") match the existing tab-bar density. If space is a concern at narrow debug-panel widths, we already tolerate horizontal overflow in the tab bar (`TAB_BAR_STYLE` wraps).

### Hidden Marks tab (`HiddenMarksTab.tsx`)

**Filter behaviour**

* When `effectiveAgentId` is set (agent is being followed or override-selected), show only marks where `targetAgentId === effectiveAgentId` at the top of the view, then below that render a collapsed "all other agents" group count.
* When no agent is selected, show all marks grouped by `targetAgentId`, newest (highest `placedTick`) first per group.

**Row fields** (one line per mark, wrapped where needed):

| Field | Display |
|-------|--------|
| `markId` | Monospace, truncated to last 8 chars with full ID on hover title. |
| `category` | Colour pill using the existing `TRACE_CATEGORY_COLORS` palette — reuse `hidden_mark_placed` hue. |
| `label` | Full text, primary colour. |
| `severity` | Bar visual (width = severity × 100%) + numeric (`0.74`). Below `SEVERITY_FLOOR` should tint warning (near-decay) so authors can see which marks are about to drop. |
| `placedTick` | `tick 342 (→ 40t ago)` relative to `currentTick`. |
| `revealFamilies` | Chip list; empty state → dim em-dash. |
| `sourceEncounterId` | Monospace, truncated, hover title with full ID. |

Agent headers show `{agent display name} — {N marks}` using the existing retinue resolver pattern from `agent-follow` (pull from `retinueAgents` prop already threaded through `DebugTabContent`).

**Empty state:** `No hidden marks placed yet.` using `EMPTY_STATE_STYLE`.

### Pending Encounter Seeds tab (`EncounterSeedsTab.tsx`)

**Filter behaviour**

* Always render the entire `pendingEncounterSeeds` queue — per the issue body, the queue is typically small.
* Sort: `eligibleAfterTick` ascending (next-to-fire first); ties broken by `-priority` then `plantedTick`.
* Optional lightweight filter chip row: "All | Ready now | Waiting" driven by comparison against `currentTick`.

**Row fields**:

| Field | Display |
|-------|--------|
| `seedId` | Monospace, truncated, hover full. |
| `seedLabel` | Primary, full text. |
| `targetAgentId` | Resolved to agent name via `retinueAgents` when possible; fall back to truncated id. |
| `templateId` \| `encounterFamily` | Whichever is present; mark the other as `—`. Templates get a different pill colour than families so authors see at a glance whether a seed is deterministic or narrative. |
| `eligibleAfterTick` | `tick 420 (+12t)` where the parenthetical is delta from `currentTick`; turn green when `≤ currentTick`. |
| `plantedTick` | `tick 408 (24t ago)`. |
| `priority` | Numeric, right-aligned. |
| `sourceEncounterId` / `sourceReactionId` | Monospace pair on a second indented line. |

**Empty state:** `Seed queue empty.`

### Visual language

Reuse existing style tokens — `EMPTY_STATE_STYLE`, `PANEL_STYLES`, `TAB_BUTTON_ACTIVE`, `SCROLL_AREA_STYLE`. No new colour tokens; reuse trace-category colours (`hidden_mark_placed`, `hidden_mark_revealed`, `encounter_seed_planted`, `encounter_seed_triggered`) where they already exist in `TRACE_CATEGORY_COLORS`. Debug panel palette is already unambiguous and we do not need a design-system review for a dev-only surface.

### DebugPanel props wiring

Add two optional fields to `DebugPanelProps` (`src/components/Game/DebugPanel.tsx`) and forward to `DebugTabContent`:

```ts
// DebugPanelProps (additions)
hiddenMarks?: readonly HiddenMark[];
pendingEncounterSeeds?: readonly PendingEncounterSeed[];
```

In `GameView.tsx:2965` pass:

```tsx
hiddenMarks={gameState.hiddenMarks}
pendingEncounterSeeds={gameState.pendingEncounterSeeds}
```

Passing the arrays directly (not via `worldVersion`) is sufficient: both collections are produced via immutable update in `encounterAftermath.ts`, so their reference identity changes whenever placements happen. Re-renders flow naturally through React without an explicit version bump.

Verify paused-tick behaviour by inspecting after calling `window.__DEBUG.gotoAgent` on an agent with known marks while the sim is paused — the panel must show the existing marks rather than empty (the reference is stable but present, and re-renders occur because GameView's gameState itself re-renders when the panel opens and on panel tab switch).

### DebugTabContent dispatch

In `DebugTabContent.tsx` add two branches, mirroring the `encounters` / `webgl` shape:

```ts
if (viewMode === 'hidden-marks') {
  return <HiddenMarksTab
    marks={hiddenMarks ?? []}
    currentTick={currentTick}
    focusedAgentId={effectiveAgentId}
    retinueAgents={retinueAgents}
  />;
}
if (viewMode === 'encounter-seeds') {
  return <EncounterSeedsTab
    seeds={pendingEncounterSeeds ?? []}
    currentTick={currentTick}
    retinueAgents={retinueAgents}
  />;
}
```

## Wiring Checklist Updates

`Docs/plans/wiring-checklist.md` rows for `hidden_mark` and `encounter_seed` (authored aftermath surfaces — lines 98–101): replace the `Debug visibility` column text:

* `hidden_mark` → `"DebugPanel → Marks tab (filtered by followed agent when set). Source: HiddenMarksTab.tsx."`
* `encounter_seed` → `"DebugPanel → Seeds tab (full queue with ready/waiting filter). Source: EncounterSeedsTab.tsx."`

## Files to Touch

| File | Change |
|------|--------|
| `src/components/Game/debug/DebugTabContent.tsx` | Add `'hidden-marks'`, `'encounter-seeds'` to `ViewMode`; two entries in `TABS`; two dispatch branches; extend props type with `hiddenMarks`, `pendingEncounterSeeds`, `retinueAgents` (already present). |
| `src/components/Game/debug/HiddenMarksTab.tsx` | **New.** Presentational component. |
| `src/components/Game/debug/EncounterSeedsTab.tsx` | **New.** Presentational component with ready/waiting filter chips. |
| `src/components/Game/DebugPanel.tsx` | Add two optional props; forward to `DebugTabContent`. |
| `src/components/Game/GameView.tsx` (~line 2965) | Pass `hiddenMarks` and `pendingEncounterSeeds` from `gameState`. |
| `Docs/plans/wiring-checklist.md` | Replace `N/A — tracked in THR-136` placeholders. |
| `src/components/Game/debug/__tests__/HiddenMarksTab.test.tsx` | **New.** Smoke + empty state + focused-agent filter. |
| `src/components/Game/debug/__tests__/EncounterSeedsTab.test.tsx` | **New.** Smoke + empty state + ready/waiting filter. |

## Constants Table

| Constant | Default | Purpose |
|----------|---------|---------|
| `HIDDEN_MARK_NEAR_DECAY_THRESHOLD` | `0.15` | Severity below which the row tints warning in the Marks tab. Read directly from the existing `SEVERITY_FLOOR` in `hiddenMarks.ts` — **do not duplicate**; import or re-export. |
| `ENCOUNTER_SEED_READY_LOOKAHEAD` | `0` | Ticks of slack to consider a seed "ready" in the filter chips. Default 0 (only fires exactly when `eligibleAfterTick ≤ currentTick`). Tunable in the component; not wired to a config yet. |

No new game-tuning constants. NFP #1 satisfied by reuse.

## Tracing

**No new trace categories.** This feature is a pure read surface over existing state. The tabs visualise the outcomes of `hidden_mark_placed`, `hidden_mark_revealed`, `encounter_seed_planted`, and `encounter_seed_triggered` traces that already exist and already flow through the Feed tab.

## Fail-Soft Table

| Failure case | Fallback |
|--------------|----------|
| `state.hiddenMarks` is `undefined` (pre-migration save or early game state) | Treat as `[]`. Render empty state. |
| `state.pendingEncounterSeeds` is `undefined` | Treat as `[]`. Render empty state. |
| A mark's `targetAgentId` no longer maps to any retinue agent (agent died, NPC mark) | Render the raw ID with a `(unresolved)` suffix. Never throw. |
| A seed's `targetAgentId` unresolvable | Same pattern. |
| `retinueAgents` prop missing | Skip name resolution, render raw IDs. |
| `severity` is NaN or outside `[0,1]` | Clamp for display (`Math.max(0, Math.min(1, severity || 0))`). Log once via `console.warn` and continue — do not throw. |
| Thousands of marks on a single agent | Virtualise if count > 200 via simple slice + "Showing N of M" footer. Performance budget: render should stay under 16ms at 500 marks without virtualisation; profile before adding it. |

## NFP Compliance Summary

| NFP | Status | Notes |
|-----|--------|-------|
| 1. Tunability | PASS | No new magic numbers; decay threshold reuses existing `SEVERITY_FLOOR`. |
| 2. Inspectability | **PASS — this feature directly fulfils NFP #2** for two authored-aftermath primitives. |
| 3. Determinism | PASS | Read-only; no RNG. |
| 4. Fail-soft | PASS | Missing data falls through to empty states; unresolved IDs render gracefully. |
| 5. Narrative over mechanical perfection | N/A | Dev-only surface. |
| 6. Additive over destructive | PASS | Two new files, two new `ViewMode` enum entries, two new props, two new component dispatches. No refactors. |
| 7. Performance budget, not premature optimization | PASS | Virtualisation only added if profiling shows it's needed. |

## Testing

### Unit tests (new)

* `HiddenMarksTab.test.tsx`
  * Renders empty state when `marks=[]`.
  * Renders a single mark with all fields populated.
  * Applies near-decay warning tint when severity below `SEVERITY_FLOOR`.
  * Filters to focused agent when `focusedAgentId` supplied.
  * Resolves `targetAgentId` to agent name via `retinueAgents`.
  * Unresolved `targetAgentId` renders `(unresolved)` without throwing.
* `EncounterSeedsTab.test.tsx`
  * Renders empty state when `seeds=[]`.
  * Sorts by `eligibleAfterTick` ascending.
  * "Ready now" filter hides seeds with `eligibleAfterTick > currentTick`.
  * "Waiting" filter hides seeds with `eligibleAfterTick <= currentTick`.
  * Template-only seed shows template pill; family-only seed shows family pill.

### Manual smoke (CLI)

The CLI can seed both surfaces:

```bash
npm run cli
fws> spawn attachment @hero trait.betrayal_mark --tick 10    # proxy placement
fws> tick 5
fws> eval state.hiddenMarks
fws> eval state.pendingEncounterSeeds
```

Then in-browser at `?view=game&seeded`:

1. Open DebugPanel (`` ` `` or F1).
2. Switch to **Marks** tab — confirm the mark renders with correct severity bar, category pill, and "40t ago" relative tick.
3. Switch to **Seeds** tab — confirm sorted queue, "Ready now"/"Waiting" chips correctly partition.
4. Follow an agent (click on hex) — Marks tab should filter to that agent.
5. Pause the sim — both tabs must continue to show the last observed state (not go blank).

### Pre-commit minimum (project standard)

1. `npm test` — all tests pass.
2. `npx tsc --noEmit` — clean.
3. `npx vite build` — builds.

## Implementation Notes for CC

* **WIP limit & mutex:** This issue touches `DebugPanel.tsx` and `DebugTabContent.tsx`. If another in-flight issue also edits either file, finish this one first or explicitly rebase on it.
* **Retinue agents are already plumbed through** `DebugTabContent` — no new prop threading for name resolution; reuse the existing `retinueAgents` prop.
* **Trace categories already coloured** in `data/uiColorPalette.ts` → `TRACE_CATEGORY_COLORS`. Reuse directly; do not introduce new colours.
* **Do not add mutation controls** in this pass. Read-only inspectors are the scope. Force-reveal / clear-seed is a separate deferral if content authors request it.
* **Default tab when opening** remains `'feed'`. Do not change the initial `useState<ViewMode>('feed')`.

## Acceptance Criteria (from Linear issue, restated)

* [ ] DebugPanel exposes hidden marks for at least the currently-inspected agent.
* [ ] DebugPanel exposes the full `pendingEncounterSeeds` queue (it's typically small).
* [ ] `Docs/plans/wiring-checklist.md` rows for `hidden_mark` and `encounter_seed` updated to reference the real tab name (remove the `N/A — tracked in THR-136` placeholder).
* [ ] Commit message body includes `Fixes THR-136`.

## Coordination

* **Suggested model:** `sonnet` — UI plumbing + two small presentational components. Not engine reasoning, not subtle. Sonnet is right-sized.
* **Parallel-safe with:** any non-DebugPanel issue (e.g. `THR-86`, `THR-133`, `THR-115`, `THR-116`, `THR-30`).
* **Mutex with:** any concurrent edits to `src/components/Game/DebugPanel.tsx` or `src/components/Game/debug/DebugTabContent.tsx`.
* **Codex review:** `no` — small, read-only, UI-only. Tests + `tsc` + `vite build` are sufficient gates.
