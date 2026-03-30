# Encounter Log Exporter — Debug Tool for Tuning Encounters

> **Date:** 2026-03-26
> **Status:** 📐 Plan
> **Backlog:** TB-053
> **Purpose:** Export a per-tick, per-agent encounter lifecycle log from the debug panel — decisions, movement, encounter tests, and outcomes — for human review and AI analysis between games.

---

## Problem

There is no way to export a structured record of what an agent *did* across a game session. The debug panel shows live state but nothing persists after the tab closes. To tune encounter difficulty, scoring weights, or travel costs, we need a reviewable log showing the full decision→travel→encounter→outcome chain tick by tick.

---

## Design

### 1. Encounter Timeline Accumulator (new module)

**Why not just read the trace buffer?** The trace buffer is a 500-entry ring buffer (`traceBuffer.ts`, `BUFFER_SIZE = 500`). A 10-agent game running 150 ticks generates far more than 500 traces — early-game data is evicted before the player can export. We need a separate, unbounded, agent-keyed accumulator that records only encounter-lifecycle events.

**Module:** `src/engine/encounterTimeline.ts`

The accumulator listens to the same emission points as the trace buffer but stores a compact, typed event per agent. It is **append-only** and **never evicts**. Memory budget is small — each event is ~200 bytes, and a 200-tick game with 10 agents produces at most ~4,000 events (~800 KB).

```typescript
/** A single line in the encounter timeline */
export type TimelineEvent =
  | { phase: 'DECIDE'; tick: number; targetEncounter: string; targetLocation: string; targetHex: [number, number]; score: number; travelCost: number; completionProb: number }
  | { phase: 'IDLE'; tick: number; reason: string; idleAction: string; driftTarget?: string }
  | { phase: 'MOVE'; tick: number; fromHex: [number, number]; toHex: [number, number]; cost: string; road?: string }
  | { phase: 'ARRIVE'; tick: number; location: string; hex: [number, number] }
  | { phase: 'ENCOUNTER_START'; tick: number; encounter: string; steps: number; threat: number; reach: string }
  | { phase: 'ENCOUNTER_STEP'; tick: number; step: string; reach: string; diff: number; cap: number; prob: number; roll: number; result: 'PASS' | 'FAIL' }
  | { phase: 'ENCOUNTER_END'; tick: number; encounter: string; status: string; reward?: string }
  | { phase: 'REROUTE'; tick: number; oldTarget: string; newTarget: string; reason: string };

/** Per-agent timeline store */
const timelines = new Map<string, TimelineEvent[]>();

export function appendEvent(agentId: string, event: TimelineEvent): void;
export function getTimeline(agentId: string): readonly TimelineEvent[];
export function clearTimelines(): void;
export function getTrackedAgentIds(): string[];
```

**Constants table:**

| Constant | Default | Purpose |
|----------|---------|---------|
| `MAX_EVENTS_PER_AGENT` | `5000` | Safety cap — drop oldest if exceeded (unlikely in normal play) |

**Tracing:** This module does *not* emit traces itself — it *consumes* data from existing trace emission points. No new trace categories needed.

**PRNG:** Not applicable — pure recording, no randomness.

**Fail-soft:**

| Failure case | Fallback |
|---|---|
| `appendEvent` called with unknown agentId | Auto-create empty timeline array, append normally |
| `MAX_EVENTS_PER_AGENT` exceeded | Evict oldest events (FIFO), log warning to console |
| Export called with empty timeline | Produce header-only file with `# (no events recorded)` comment |
| Agent has no name in graph | Use `agentId` as fallback display name |

### 2. Emission Points (wiring into existing phases)

Each emission point calls `appendEvent` alongside the existing `emitTrace` call. No new engine phases needed — we hook into existing code.

| Existing function | Trace it already emits | TimelineEvent to append |
|---|---|---|
| `phaseAgentDecision` → scoring path | `encounter_scoring` | `DECIDE` (from `ScoringTrace` fields) |
| `phaseAgentDecision` → idle path | `idle_decision` | `IDLE` (from `IdleDecisionTrace` fields) |
| `phaseMovement` → road hex step | `road_hex_transition` | `MOVE` (from `RoadHexTransitionTrace`) |
| `phaseMovement` → arrive | `movement` (event='arrive') | `ARRIVE` |
| `phaseMovement` → reroute | `agent_reroute` | `REROUTE` |
| `phaseEncounterProgressionV2` → start | `encounter_resolution` (status='initiated') | `ENCOUNTER_START` |
| `phaseEncounterProgressionV2` → step | `encounter_resolution` | `ENCOUNTER_STEP` |
| `phaseEncounterProgressionV2` → end | `encounter_resolution` (status='completed'/'abandoned') | `ENCOUNTER_END` |

**Gap — reward field:** `EncounterResolutionTrace` records the test outcome but not the reward granted. Two options:

- **Option A (recommended):** Add an optional `rewardSummary?: string` field to `EncounterResolutionTrace`. Populate it in `phaseEncounterProgressionV2` when status is `completed` — pull from the encounter template's `successRewardEstimate` or, once TB-052 lands, from the actual `drawFromPool` result.
- **Option B:** Cross-reference the `action_execution` trace emitted in the same tick. Fragile — depends on trace ordering within a tick.

Go with Option A. Small, additive change to the trace type.

### 3. Log Format — TSV with key=value pairs

**File extension:** `.tsv` (opens in any spreadsheet or text editor)
**Filename pattern:** `encounter-log_<seed>_<agentName>.tsv`

```
# ENCOUNTER LOG
# Seed: 7a3f2b4e
# Agent: Kaelen Ashford (agent_kaelen)
# Exported: 2026-03-26T14:32:00Z
# Ticks: 1–147
TICK	PHASE	DETAIL
12	DECIDE	target=Ruins of Ashenmoor | encounter=ancient_ward_puzzle | score=0.73 | hex=(4,7) | travelCost=3 | prob=0.68
13	MOVE	(3,5)→(3,6) | cost=1/3 | road=trail
14	MOVE	(3,6)→(4,6) | cost=1/3 | road=none
15	MOVE	(4,6)→(4,7) | cost=1/3 | arrived=Ruins of Ashenmoor
15	ENCOUNTER_START	ancient_ward_puzzle | steps=3 | threat=0.6 | reach=Warding
16	ENCOUNTER_STEP	step=1/3 | reach=Warding | diff=45 | cap=62 | prob=0.71 | roll=0.38 | PASS
17	ENCOUNTER_STEP	step=2/3 | reach=Lore | diff=55 | cap=41 | prob=0.34 | roll=0.82 | FAIL
17	ENCOUNTER_END	ancient_ward_puzzle | status=abandoned | reward=none
18	IDLE	reason=no_candidates_after_cooldown | action=drift | driftTarget=Thornwall
```

**Format rules:**
- Header lines start with `#` — metadata for context
- Tab-separated columns: `TICK`, `PHASE`, `DETAIL`
- Within DETAIL: pipe-separated `key=value` pairs
- Hex coordinates always `(col,row)`
- Movement cost shown as `accumulated/total` (e.g., `1/3` = 1 tick spent of 3 needed)
- Encounter steps shown as `current/total` (e.g., `1/3`)
- No blank lines between events — one event per line, chronological

**Why this format:**
- **Human-scannable:** Monospaced columns, grep-friendly phases
- **AI-parseable:** Structured key=value, consistent delimiters, header metadata
- **Spreadsheet-importable:** TSV opens directly in Excel/Sheets; filter by PHASE column
- **Diffable:** Compare two logs from different seeds or tuning runs with standard diff tools

### 4. Exporter Function

**Module:** `src/engine/encounterLogExporter.ts`

```typescript
export interface ExportOptions {
  agentId: string;
  agentName: string;
  seed: string;
  tickRange: [number, number]; // first and last tick in timeline
}

/** Formats the agent's timeline into a TSV string ready for download */
export function formatEncounterLog(
  timeline: readonly TimelineEvent[],
  options: ExportOptions
): string;
```

Pure function — takes timeline data, returns a string. No side effects. Easily unit-testable.

### 5. UI Additions to EncounterCacheView

**Agent dropdown** — added at the top of the encounters debug tab. Populated from the list of agents in the current game (passed via props or derived from graph). Defaults to the currently followed agent if one is set (`followAgentId` prop already exists).

**"Export Encounter Log" button** — next to the dropdown. Calls `formatEncounterLog()` with the selected agent's timeline, constructs a `Blob`, and triggers a browser `<a download>` click.

**New props needed on `EncounterCacheView`:**

```typescript
// Added to existing EncounterCacheViewProps
agents: Array<{ id: string; name: string }>; // all agents in game
seed: string; // world seed for the header
```

**Layout:** Dropdown and button in a flex row above the existing cache summary section. Styled consistently with existing debug tab controls (monospace, `--bg-raised`, `--accent-gold`).

**Behavior:**
- Dropdown shows agent names sorted alphabetically, with `(id)` suffix for disambiguation
- If no agent selected, button is disabled with tooltip "Select an agent"
- If selected agent has empty timeline, export produces the header-only file with a comment
- Download triggers immediately — no modal, no confirmation

---

## Wiring

| Surface | Connection |
|---|---|
| **Orchestrator** | No new phase. `appendEvent` calls added to existing `phaseAgentDecision`, `phaseMovement`, `phaseEncounterProgressionV2` |
| **UI rendering** | Dropdown + button in `EncounterCacheView.tsx`, already rendered in debug panel encounters tab |
| **GameState flow** | No new GameState fields. Timeline lives in module-scoped `Map` in `encounterTimeline.ts` (same pattern as trace buffer) |
| **Traces** | One additive field (`rewardSummary?`) on `EncounterResolutionTrace`. No new categories |
| **Debug visibility** | The export IS the debug visibility — the whole point is inspecting this data |
| **Prose pipeline** | Not applicable |
| **Player controls** | Dropdown + export button in debug panel (dev-only, not player-facing) |

---

## Implementation Order

1. **`encounterTimeline.ts`** — new module with `appendEvent`, `getTimeline`, `clearTimelines`, types. Unit tests for append, eviction cap, clear.
2. **`encounterLogExporter.ts`** — pure `formatEncounterLog` function. Unit tests with hand-built timelines verifying TSV format, header, edge cases (empty timeline, missing fields).
3. **Emission wiring** — add `appendEvent` calls in `phaseAgentDecision`, `phaseMovement`, `phaseEncounterProgressionV2`. Add `clearTimelines()` call in orchestrator reset / new-game flow.
4. **`rewardSummary` field** — add optional field to `EncounterResolutionTrace` in `trace.ts`, populate in encounter resolution. Small, additive.
5. **UI** — agent dropdown + export button in `EncounterCacheView.tsx`. Thread new props from `DebugPanel.tsx`.
6. **Contract test** — verify that real `ScoringTrace` / `MovementTrace` / `EncounterResolutionTrace` output from a multi-tick orchestrator run produces a valid, non-empty encounter log when fed through the exporter.

---

## NFP Compliance Summary

| # | Priority | Verdict |
|---|----------|---------|
| 1 | Tunability | PASS — `MAX_EVENTS_PER_AGENT` is the only tunable; named constant with clear purpose |
| 2 | Inspectability | PASS — this feature *is* inspectability infrastructure |
| 3 | Determinism | PASS — no randomness; recording only. Same seed → same log |
| 4 | Fail-soft | PASS — all failure cases produce graceful fallbacks (see table above) |
| 5 | Narrative over mechanical | N/A — debug tooling |
| 6 | Additive over destructive | PASS — one optional field added to existing trace type; no existing APIs changed |
| 7 | Performance budget | PASS — append-only Map, ~200 bytes/event, <1 MB for a long game. No per-frame cost |
