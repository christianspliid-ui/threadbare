# Handover Notes

> Written by Cowork sessions for Claude Code to pick up. Read this at session start.
>
> **Format:** Each entry has a date, context (what was discussed/decided), and action items.
> **Lifecycle:** Claude Code acts on entries, then moves them to the "Completed" section below.
>
> **IMPORTANT:** When you complete a handover entry, you MUST also update the item's state in `.planning/BACKLOG.md` to `✅`. BACKLOG.md is the single source of truth — see `Docs/cowork-ways-of-working.md` → "Unified Kanban".

---

### 2026-03-26: URGENT — Restore Truncated orchestrator.ts

**Context:** Cowork VM filesystem corruption has truncated `src/engine/orchestrator.ts` from 1196 lines to 1119. The file is cut mid-word at `phaseInflue` on line 1119. This is almost certainly causing the game instability the user reported — without the return statement, `runTick()` returns `undefined`, and 7 phases plus visibility recalculation, event merging, and trace emission are all missing.

**Fix:** Restore from git HEAD:

```bash
git checkout HEAD -- src/engine/orchestrator.ts
```

Then verify: `wc -l src/engine/orchestrator.ts` should show 1196. Run `npx tsc --noEmit` and `npm test` to confirm nothing else was corrupted.

**Action items for Claude Code:**
- [ ] Restore `src/engine/orchestrator.ts` from git HEAD
- [ ] Run `npx tsc --noEmit` — verify type-check clean
- [ ] Run `npm test` — verify all tests pass
- [ ] Run `npx vite build` — verify prod build succeeds
- [ ] Check other large files for truncation (`git diff --stat` to see if anything else diverges from HEAD)

---

### 2026-03-26: TB-057 — Tick Health Monitor & Crash Log

**Context:** The orchestrator truncation went undetected because there's no runtime validation of tick output. The tick loop has no try/catch, so phase failures are silent. Additionally, several GameState arrays grow without bound over long sessions. This ticket adds a lightweight tick health monitor that catches silent degradation, plus cleanup for unbounded state growth.

**Design — Three components:**

#### Component 1: Tick Health Validator (`src/engine/tickHealthMonitor.ts`)

A pure function `validateTickOutput(prev: GameState, next: GameState): TickHealthReport` that runs after every `runTick()` call and catches structural problems before they propagate. This is NOT the trace system (which records what happened) — this catches things that *shouldn't* happen.

**Checks:**

| Check | Condition | Severity |
|-------|-----------|----------|
| `tick_advanced` | `next.tick === prev.tick + 1` | critical |
| `state_defined` | `next !== undefined && next !== null` | critical |
| `graph_intact` | `next.graph` exists and has >0 nodes | critical |
| `agents_present` | At least 1 agent node in graph | error |
| `events_produced` | `next.tickEvents.length > 0` (warning only — some ticks may legitimately be empty) | warning |
| `recent_events_bounded` | `next.recentEvents.length <= MAX_RECENT_EVENTS + 10` | error |
| `encounter_notifications_bounded` | `(next.encounterNotifications?.length ?? 0) < 500` | warning |
| `unified_actions_bounded` | `(next.unifiedActions?.length ?? 0) < 1000` | warning |
| `control_effects_bounded` | `(next.controlEffects?.length ?? 0) < 200` | warning |
| `doom_not_negative` | `next.doomClock.currentProgress >= 0` | error |
| `essence_not_nan` | No NaN values in `next.essencePool` | critical |
| `no_duplicate_agents` | Agent node IDs are unique | error |

**Output type:**
```typescript
interface TickHealthReport {
  tick: number;
  timestamp: number;
  healthy: boolean;           // true if no critical/error findings
  findings: TickHealthFinding[];
}

interface TickHealthFinding {
  check: string;              // check name from table above
  severity: 'critical' | 'error' | 'warning';
  message: string;            // human-readable description
  detail?: unknown;           // optional diagnostic payload (e.g. actual vs expected tick)
}
```

**Constants table:**
| Constant | Default | Purpose |
|----------|---------|---------|
| `ENCOUNTER_NOTIFICATION_WARN_THRESHOLD` | 500 | Warn when notifications exceed this |
| `UNIFIED_ACTIONS_WARN_THRESHOLD` | 1000 | Warn when actions exceed this |
| `CONTROL_EFFECTS_WARN_THRESHOLD` | 200 | Warn when effects exceed this |
| `HEALTH_LOG_BUFFER_SIZE` | 100 | Rolling buffer of health reports |

**Tracing:** Emits a new `tick_health` trace category when any finding has severity `error` or `critical`.

**Fail-soft table:**
| Failure case | Fallback |
|---|---|
| `validateTickOutput` itself throws | Catch internally, log `console.error`, return `{ healthy: false, findings: [{ check: 'validator_error', severity: 'critical' }] }` |
| `prev` state undefined (first tick) | Skip delta checks (tick_advanced), run structural checks only |

**PRNG:** None needed — purely deterministic structural validation.

#### Component 2: Tick Loop Hardening (in orchestrator.ts)

Wrap the `runTick` function body in a try/catch that:
1. Catches any thrown error
2. Logs it to a new `crashLog` array on window (dev only, via debug-bridge)
3. Returns the *previous* state unchanged (fail-soft: a crashed tick is a no-op, not a corruption)
4. Emits a `tick_crash` trace with the error message and stack

```typescript
// In runTick:
try {
  // ... all existing phase code ...
  const report = validateTickOutput(state, s);
  if (!report.healthy) {
    appendCrashLog({ type: 'health_check_failed', tick: s.tick, findings: report.findings });
  }
  return s;
} catch (err) {
  const entry = {
    type: 'tick_exception' as const,
    tick: state.tick,
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
    timestamp: Date.now(),
  };
  appendCrashLog(entry);
  emitTrace({ tick: state.tick, category: 'tick_crash', summary: entry.error, ...entry });
  console.error('[Orchestrator] Tick crashed, returning previous state:', err);
  return state; // fail-soft: return unchanged state
}
```

#### Component 3: State Cleanup (in orchestrator.ts phases)

Fix the three unbounded arrays:

1. **`encounterNotifications`** — Add a trim after the encounter visibility phase. Keep only notifications from the last 50 ticks:
```typescript
encounterNotifications: (s.encounterNotifications ?? []).filter(n => n.tick >= s.tick - 50)
```
(Requires `tick` field on `EncounterNotification` — if not present, add it as an additive field with `?? s.tick` default.)

2. **`unifiedActions`** — After the unified actions phase, prune completed/abandoned actions older than 100 ticks:
```typescript
unifiedActions: s.unifiedActions.filter(a =>
  a.status === 'active' || a.completedAtTick == null || s.tick - a.completedAtTick < 100
)
```
(Requires `completedAtTick` field — add it, set when status changes to completed/abandoned.)

3. **`controlEffects`** — Already has lifecycle management (lapse). Just add the bounded check in the health monitor (already in table above). If it ever hits the threshold, it's a real design issue, not just accumulation.

**Debug bridge extension:**

Extend `window.__DEBUG` with:
```typescript
getCrashLog: () => import('./engine/tickHealthMonitor').then(m => m.getCrashLog()),
clearCrashLog: () => import('./engine/tickHealthMonitor').then(m => m.clearCrashLog()),
getHealthReport: () => import('./engine/tickHealthMonitor').then(m => m.getLatestReport()),
exportDiagnostics: () => import('./engine/tickHealthMonitor').then(m => m.exportDiagnostics()),
```

`exportDiagnostics()` returns a JSON blob containing: last 100 health reports, crash log entries, current GameState size metrics (array lengths for all monitored fields), trace buffer snapshot, and WebGL diagnostics if available. This is the "crash log" the user can export when something feels wrong.

**Wiring (per wiring-checklist.md):**

| Surface | Connection |
|---------|-----------|
| **Orchestrator** | `validateTickOutput()` called at end of `runTick`, inside the new try/catch. No new phase. |
| **UI rendering** | No new UI component in v1. Diagnostics accessible via `window.__DEBUG.exportDiagnostics()` in console. Future: health indicator icon in debug panel. |
| **GameState flow** | Reads all fields (validation). Writes nothing to GameState (health reports stored in module-level buffer). |
| **Traces** | New categories: `tick_health` (warning/error findings), `tick_crash` (unhandled exception). |
| **Debug visibility** | `window.__DEBUG` extensions. Console-accessible. |
| **Prose pipeline** | None. |
| **Player controls** | None in v1. Export via console only. |

**NFP Compliance:**

| Priority | Verdict |
|----------|---------|
| 1. Tunability | PASS — All thresholds are named constants |
| 2. Inspectability | PASS — Health reports + crash log + exportDiagnostics |
| 3. Determinism | PASS — Validator is pure; no PRNG needed |
| 4. Fail-soft | PASS — Validator catches its own errors; crashed ticks return previous state |
| 5. Narrative | N/A |
| 6. Additive | PASS — No existing fields/functions modified (except try/catch wrap and array trims) |
| 7. Performance | PASS with note — validateTickOutput runs per-tick but checks are O(1) or O(n) over small arrays |

**Implementation order:**
1. Restore truncated orchestrator.ts first (see URGENT entry above)
2. `tickHealthMonitor.ts` — types, validate function, crash log buffer, export function + unit tests
3. Orchestrator try/catch wrap + validateTickOutput call
4. State cleanup: encounterNotifications trim, unifiedActions prune (add `completedAtTick` field)
5. Debug bridge extensions
6. Contract test: run 200 ticks, verify health reports are all healthy, verify crash log is empty
7. Fault injection test: mock a phase to throw, verify fail-soft returns previous state and crash log captures it

**Action items for Claude Code:**
- [ ] FIRST: Restore `orchestrator.ts` from git HEAD (see URGENT entry)
- [ ] Read this design
- [ ] Implement steps 2–7 in order
- [ ] Pre-commit verification: `npm test`, `npx tsc --noEmit`, `npx vite build`
- [ ] Update wiring checklist with new trace categories
- [ ] Update BACKLOG.md: add TB-057 as ✅

---

### 2026-03-26: TB-056 — Agent Encounter Tuning (Idle Death Spiral Fix)

**Context:** User exported encounter logs for all 8 agents over 72 ticks (seed 42). Results: ~95% of all agent-ticks are IDLE. Only 2 encounter steps passed across the entire run (Dara and Isolde each passed one step 1, both failed step 2). Every encounter attempt shows `prob=0.05` (the floor clamp) and `score=0.00`. Three compounding bugs create a death spiral where agents can never do anything meaningful.

**Diagnosis — three root causes:**

**1. Vestigial `domainCapabilities` — agents start effectively powerless.**
`worldSeed.ts` generates `domainCapabilities` scores of 10–40 per reach domain per agent, but `computeRawScore()` in `domainCapability.ts` never reads them. It only sums trait/artifact/resource edge contributions, which at game start total ~0–2 raw score. Through the sigmoid (midpoint=10, k=0.4), that gives capability values of 0.02–0.06. The log confirms: `cap=2`, `cap=3`, `cap=4`, `cap=6` (displayed as ×100 percentages).

**2. Floor-clamped probabilities cascade into zero scores.**
With capability ~0.03 and `DIFFICULTY_BASE=35` (i.e. 0.35 normalized), per-step probability = `0.03 - 0.35 + STEP_PROBABILITY_OFFSET(0.6)` = 0.28 in the scoring estimate, but actual resolution uses `capability + modifiers - difficulty/100` without the offset, giving `0.03 + 0 - 0.35 = -0.32 → clamped to 0.05`. For 2-step encounters: `0.05 × 0.05 = 0.0025` completion probability. Score = tiny completionProb × reward / cost → well under `IDLE_SCORE_THRESHOLD=0.001`.

**3. Filter pipeline starves some locations of all candidates.**
Kael (Ironguard), Thorne (start hex), Dara (Barrow Hollow after tick 8), Hestia (New Raventon / Forge of Sorrow) all get `no_candidates_after_filter` for 100% of their ticks. The awareness filter (`AWARENESS_THRESHOLD=0.05`, `BASE_AWARENESS_HOPS=1`) or threat tolerance filter (`THREAT_FLOOR_FILTER=true`) eliminates everything at their locations. With near-zero capabilities, the threat filter treats every encounter as too dangerous.

**Resulting pathologies visible in logs:**
- Varn: idle at Forge of Sorrow for 66/72 ticks, retries `market_day_festival` every ~22 ticks (cooldown=20), always fails step 1 at 95%
- Kael: 100% idle at Ironguard — zero candidates ever pass filter
- Thorne: 100% idle — zero candidates ever pass filter
- Ashara: ping-pongs between Black Windwatch and Free Widegate every tick (drift loop), attempts same 2 encounters every ~22 ticks, always fails
- Hestia: same drift loop between New Raventon and Forge of Sorrow, zero candidates pass filter
- Brynn: idle at Frost Camp, retries `toll_bridge` every ~22 ticks, always fails
- Dara: one partial success at Fair Windtown (tick 4), then travels to Barrow Hollow and is permanently stuck with zero candidates
- Isolde: best agent — cycles through 4-5 encounter types at Ironbridge, one step pass at tick 51, but still fails ~95% of attempts

**Fix — Layer A (root cause):**

In `src/engine/domainCapability.ts`, `computeRawScore()` should include the agent's stored `domainCapabilities[domain]` as a base term before summing trait contributions. This shifts starting raw scores from ~0–2 to ~10–40, giving sigmoid capabilities of ~0.50–0.95. This is almost certainly the original design intent — the initialization code carefully generates these values with boost logic but nothing reads them.

**Fix — Layer B (tuning constants for better feel):**

| Constant | File | Current | Recommended | Rationale |
|----------|------|---------|-------------|-----------|
| `DIFFICULTY_BASE` | `encounter-content.ts` | 35 | 25 | First encounter steps should be accessible for starting agents |
| `IDLE_SCORE_THRESHOLD` | `agent-behavior-constants.ts` | 0.001 | 0.0001 | Agents should attempt marginal encounters rather than idle endlessly |
| `ENCOUNTER_ABANDON_COOLDOWN` | `types/encounter.ts` | 20 | 8 | Match completion cooldown — 20 ticks lockout is too punishing |
| `IDLE_TRIVIAL_PREFERENCE` | `agent-behavior-constants.ts` | 0.8 | 0.5 | More movement variety when idle — drift should happen more often |
| `THREAT_FLOOR_FILTER` | `encounterFilterPipeline.ts` | true | false | At low capabilities this eliminates everything — let scoring handle threat avoidance instead |

**Implementation order:**
1. Layer A fix in `domainCapability.ts` — add `domainCapabilities` base term
2. Layer B constant tweaks (all 5 values)
3. Run `npm test` — fix any tests that assert on old constant values or old capability calculations
4. Run seed-42 encounter log export again with the fixes and compare idle rates
5. Visual verification at `?view=game` — agents should move around and attempt encounters regularly

**Action items for Claude Code:**
- [ ] Read `src/engine/domainCapability.ts` — understand `computeRawScore()` and where to add base capabilities
- [ ] Read `src/engine/worldSeed.ts` — verify `domainCapabilities` is stored on agent graph nodes
- [ ] Implement Layer A: add `domainCapabilities[domain]` base term to `computeRawScore()`
- [ ] Implement Layer B: update 5 constants per table above
- [ ] Run tests, fix assertions broken by new values
- [ ] Re-export encounter logs at seed 42 (or run orchestrator integration test) to verify improvement
- [ ] Pre-commit verification: `npm test`, `npx tsc --noEmit`, `npx vite build`

---

### 2026-03-26: TB-055 — Tiered Encounter Modal (Chronicle Narrator)

**Context:** The current `EncounterVignetteModal` is a passive read-and-close modal: it shows labeled sections (Scene / Lens / Stakes / Forecast), has no intervention choices, and treats all encounters identically regardless of thread tier. A Cowork design session produced a comprehensive React prototype (`encounter-modal-prototype.jsx` in repo root) for a new encounter modal that replaces it. The prototype was iterated through 4+ rounds of user feedback and is considered design-final.

**Prototype location:** `encounter-modal-prototype.jsx` (repo root)

**What the new modal does — overview:**

The modal is a tiered, multi-step encounter viewer with intervention controls. The player navigates between encounter steps (past, current, future), reads flowing chronicle-style prose at a depth determined by thread tier, and makes intervention choices on the current step.

**Thread tiers (replaces court position terminology in the UI):**

| Tier | Internal ID | Prose depth | Choices | Auto-interrupt | Special UI |
|------|------------|-------------|---------|----------------|------------|
| Strongly Threaded | `strong` | `full` (3+ paragraphs) | 3 (supportive/coercive/withdrawn) | Yes (pauses game) | God-voice quote on selection |
| Lightly Threaded | `light` | `medium` (1-2 paragraphs) | 2 (supportive/withdrawn) | No | Auto-resolve countdown bar |
| Watched | `watched` | `peek` (1 sentence) | 0 (essence boost only) | No | Peek gate (1 essence to open), boost slider |

**Key design decisions:**

1. **Chronicle narrator prose** — No section labels (Scene/Lens/Stakes/Forecast are gone). Prose flows as a story with drop-cap first letters, italic serif font (`var(--font-prose)`), and gold left-border for divine outcome text. This mirrors `HexChronicle.tsx` rendering style.

2. **Multi-step navigation** — All tiers support step navigation via clickable dots + ‹ › arrows. Past steps are read-only and show the resolved outcome woven into the prose. Current step shows live intervention choices. Future steps are locked (dimmed dots, not clickable).

3. **Action icons** — Each intervention choice has a small square icon showing its type at a glance: shield+plus (supportive), lightning bolt (coercive), circle+slash (withdrawn). Fallback is diamond pips based on cost.

4. **TTS Narrate button** — In the header next to Reach/Threat badges. Reads all `.chronicle-prose` elements from a `proseContainerRef` using the same pattern as `HexChronicle` → `useNarration()` → `narrateChronicle(containerEl)`. In production, call the real `speakSections()`.

5. **Optional 16:9 scene image** — Slot above the prose body, shown when available. Currently a procedural SVG placeholder; production would use generated hex tile art or encounter-specific imagery.

6. **God-voice** — When the player selects a Strongly Threaded intervention, a gold-accented italic quote appears below the choice: the god's internal voice reacting to their decision.

**How this connects to the notification system:**

The existing notification flow (`phaseEncounterVisibility` → `encounterNotifications[]` on GameState → `useEncounterNotifications` hook → `ToastStack`) currently creates a toast per encounter notification. Clicking the toast should open this new modal instead of the current `EncounterVignetteModal`. The connection points:

1. **Toast → Modal trigger:** `useEncounterNotifications` currently creates `ToastItem` objects but has no `onClick` handler. Add an `onClick` callback to each toast that calls a new `handleEncounterNotificationClick(notification)` in GameView, which sets the modal state.

2. **EncounterLog card → Modal trigger:** `EncounterLog` already has an `onClick` prop. The `handleEncounterClick` handler in GameView (line ~518) currently opens `EncounterVignetteModal` via `setVignetteEncounter()`. Rewire this to open the new modal instead.

3. **RetinuePanel per-agent encounter badge → Modal trigger:** Retinue agents with active encounters should also be clickable to open this modal for that agent's encounter.

4. **Auto-interrupt for Strongly Threaded:** When `phaseEncounterVisibility` emits a notification for a `the_first` (Strongly Threaded) agent, the game should auto-pause and open this modal immediately — not wait for the player to click a toast. This mirrors how `JourneyVignetteModal` auto-opens for The First's journey beats.

5. **Thread tier mapping:** The engine uses `CourtPosition` (`the_first` / `retinue` / `watched`). The modal uses `threadTier` (`strong` / `light` / `watched`). Map at the boundary: `the_first → strong`, `retinue → light`, `watched → watched`.

**What this replaces:**

- `EncounterVignetteModal.tsx` — The new modal is a superset. The old modal becomes dead code once this ships. Delete it and its import from GameView.
- The encounter notification → toast flow remains, but toasts gain click-to-open-modal behavior.

**Integration wiring (per wiring-checklist.md):**

| Surface | Connection |
|---------|-----------|
| **Orchestrator** | No new phases. Consumes existing output from `phaseEncounterVisibility` (phase 2a.6) and `phaseEncounterProgressionV2` (phase 2a.3). |
| **GameView rendering** | New `<TieredEncounterModal />` replaces `<EncounterVignetteModal />` in JSX. Same conditional slot. |
| **GameState flow** | Reads: `encounterNotifications`, `encounterProgress`, `graph`. Writes: intervention choice → dispatch to encounter resolution engine. |
| **Traces** | Emits existing `encounter_intervention` trace type (already defined in `encounterVisibility.ts`). |
| **Debug visibility** | Existing `encounters` tab in DebugPanel already shows cache/notifications. No new tab needed. |
| **Prose pipeline** | Prose paragraphs come from encounter templates → `enrichProse()`. The modal renders them via ChronicleNarrator component. Must call `enrichProse()` before display. |
| **Player controls** | Toast click, EncounterLog click, RetinuePanel agent badge click, auto-interrupt for Strongly Threaded. |
| **Narration** | `useNarration()` hook for TTS. Button in header reads `.chronicle-prose` elements. |

**Engine type changes needed:**

1. `EncounterNotification` needs per-step prose at each depth tier (currently has a single `prose: string`). Either:
   - Expand `EncounterNotification` to carry `steps[]` with `prose: { full, medium, peek }` per step, OR
   - Keep notification lightweight and look up step prose from `EncounterProgress` + `EncounterTemplate` at render time (preferred — avoids duplicating data on GameState).

2. `EncounterInterventionChoice` already has `interventionType`, `essenceCost`, `probabilityBoost`, `godVoice` — these map directly to the prototype's `ChoiceButton` props.

3. `ToastItem` needs an optional `onClick` callback so encounter toasts can open the modal.

**Implementation order:**

1. **New component file:** `src/components/Game/TieredEncounterModal.tsx` — port the prototype's components (ChronicleNarrator, DropCap, StepNav, ChoiceButton, ActionIcon, BoostSlider, AutoResolveBar, PeekGate, NarrateButton) into production TypeScript. Use existing design system CSS vars instead of hardcoded tokens. Use the shared `Modal` primitive for the outer shell.

2. **Thread tier mapping utility:** Small function in `encounterVisibility.ts`: `courtPositionToThreadTier(pos: CourtPosition): 'strong' | 'light' | 'watched'`.

3. **Toast onClick:** Extend `ToastItem` with optional `onClick`. Update `useEncounterNotifications` to pass `onClick` that sets encounter modal state. Update `ToastStack` to call `onClick` when a toast is clicked.

4. **GameView rewiring:** Replace `vignetteEncounter` state with `tieredEncounterState` (holding agentId, encounterId, threadTier). Wire `handleEncounterClick`, `handleEncounterNotificationClick`, and auto-interrupt logic. Remove `EncounterVignetteModal` import and JSX.

5. **Intervention dispatch:** When the player clicks "Intervene" or "Commit", dispatch the choice to the encounter resolution engine. This should update `GameState.encounterProgress` and emit an `encounter_intervention` trace.

6. **TTS integration:** Wire `NarrateButton` to real `useNarration()` hook. Ensure `.chronicle-prose` className is on all prose paragraphs.

7. **Tests:** Unit tests for new components, contract test for notification → modal data flow, visual verification at `?view=game`.

8. **Cleanup:** Delete `EncounterVignetteModal.tsx`, remove its import from GameView, update wiring checklist.

**Action items for Claude Code:**
- [x] Read this handover + the prototype file `encounter-modal-prototype.jsx` ✅
- [x] Read encounter visibility types and GameView wiring for context ✅
- [x] Implement steps 1–8: TieredEncounterModal.tsx, thread tier mapping, toast onClick, GameView rewiring, intervention dispatch, TTS, cleanup ✅
- [x] Run full pre-commit verification (tests, tsc, vite build) ✅
- [x] Delete `encounter-modal-prototype.jsx` from repo root ✅
- [x] Update changelog, project-status, project-history, backlog ✅

---

### 2026-03-26: TB-054 — Avatar Portrait & Hex Map Visibility

**Context:** User noticed their ascendant's avatar is invisible on HexMapV2. Investigation found three missing pieces: (1) avatar actor has no `narrativeArchetype` so no portrait loads, (2) `AgentRenderData` has no `isAvatar` flag, (3) `AgentSpriteMesh` has no avatar-specific visual treatment (V1 SVG had pulsing sphere ring but it was never ported to V2).

**Design:** `Docs/plans/2026-03-26-avatar-portrait-and-hex-visibility-design.md`

**Key decisions:**
- Generate 8 sphere-specific avatar portraits via `mcp-image` (one per Creation Sphere, divine figure woven from sphere-colored threads per STYLE.md)
- Avatar gets sphere-colored pulsing ring + 1.3× scale boost + z-bump on HexMapV2
- New `avatar-portrait-assets.ts` registry maps `SphereName → portrait URL`
- `AgentRenderData` extended with `isAvatar` + `avatarSphereColor`

**Action items for Claude Code:**
- [ ] Generate 8 avatar portraits using `mcp-image generate_image` (prompts in design doc)
- [ ] Create `src/data/avatar-portrait-assets.ts`
- [ ] Extend `AgentRenderData` in `agentSpriteTypes.ts` with `isAvatar` + `avatarSphereColor`
- [ ] Update `GameView.tsx` agent adapter to detect avatar and set portrait/flags
- [ ] Update `AgentSpriteMesh.ts` — pulsing ring, scale boost, z-bump
- [ ] Add explicit ascendant actor skip in render loop
- [ ] Tests: unit + contract + visual verification at `?view=game`

---

### 2026-03-26: TB-053 — Encounter Log Exporter

**Context:** User wants a debug tool to export per-agent encounter lifecycle logs for tuning encounters between games. Trace buffer's 500-entry ring buffer is too small — early-game data gets evicted before export. Design introduces a separate, unbounded timeline accumulator alongside a TSV exporter and UI controls in the debug panel.

**Design:** `Docs/plans/2026-03-26-encounter-log-exporter-design.md`

**Key decisions:**
- Separate `encounterTimeline.ts` module (append-only Map, not the ring buffer) to avoid eviction
- TSV format with `#`-prefixed header (seed, agent, date) and tab-separated `TICK | PHASE | DETAIL` columns
- `DETAIL` uses pipe-separated `key=value` pairs — self-documenting, grep-friendly, spreadsheet-importable
- One optional field added to `EncounterResolutionTrace`: `rewardSummary?: string`
- No new orchestrator phases — hooks into existing `phaseAgentDecision`, `phaseMovement`, `phaseEncounterProgressionV2`

**Implementation order:**
1. `encounterTimeline.ts` — types + accumulator + unit tests
2. `encounterLogExporter.ts` — pure formatter + unit tests
3. Emission wiring — `appendEvent` calls in 3 existing phases + `clearTimelines()` on reset
4. `rewardSummary` field on `EncounterResolutionTrace` (additive, optional)
5. UI — agent dropdown + export button in `EncounterCacheView.tsx`, thread props from `DebugPanel.tsx`
6. Contract test — real orchestrator run → exporter → valid TSV

**Action items for Claude Code:**
- [ ] Read the design doc
- [ ] Implement steps 1–6 in order
- [ ] Ensure `clearTimelines()` is called wherever `clearTraces()` is called (game reset, new world)

---

### 2026-03-26: TB-052 — Encounter Reward Wiring

**Context:** User asked whether any encounters award items. Answer: zero. The reward pool engine (`rewardPool.ts`) and attachment type system are complete and tested, but nothing connects them to gameplay. No encounters define `rewardPool` recipes, the orchestrator doesn't call pool assembly, and there's no artifact instantiation (drawing an existing artifact would share it between agents).

**Design:** `Docs/plans/2026-03-26-encounter-reward-wiring-design.md`

**Key architecture decision:** Clone-from-template. `drawFromPool` selects a template node ID, then a new `instantiateReward` function clones it with a unique ID and creates the appropriate edge (possesses for artifacts, has_trait for conditions/bestowed). Template stays unowned and reusable.

**Critical design points (from original attachment brainstorm review):**
- **Failures also produce rewards** — bad rewards (wounds, curses, diseases). The `badOutcomeChance` field drives this. Tier curves shift by resolution outcome quality (crit success → great loot, crit failure → 85% chance of curse/wound).
- **`rewardPool` goes on BOTH `onSuccess` and `onFailure`** — same recipe, different tier curves applied at resolution time.
- **Three drawable categories** — possessions, conditions, and bestowed powers. ~86 templates total.
- **God Nudge window** deferred to v2 — but structure the draw step so nudge can be inserted later.

**Implementation order:**
1. `instantiateReward` function in `rewardPool.ts` + unit tests (handles all 3 edge shapes)
2. `getTierCurveForOutcome` + bad outcome routing + unit tests
3. Orchestrator wiring in `phaseEncounterProgressionV2` + contract test
4. Attachment catalog (`reward-attachment-catalog.ts`, ~86 templates across 3 categories)
5. Content pass — add `rewardPool` to both onSuccess and onFailure on ~30 encounter final steps
6. Event message enrichment — specific attachment name in `summarizeOutcome`
7. Agent possessions UI section (can be separate backlog item)

**Action items for Claude Code:**
- [ ] Read the full design doc — especially tier curve table and bad outcome routing
- [ ] Implement steps 1–6 in order
- [ ] Step 7 (attachment UI) can be deferred to a separate ticket if needed

---

### 2026-03-26: Agent Portrait Stretch Bug — Cover Crop Fix

**Context:** Agent portraits on the hex map appear stretched/squished. Root cause identified: all portrait source images are **896×1200** (3:4 aspect ratio), but `loadPortraitTexture()` in `agentPortraitTextures.ts` draws the full non-square image into a square canvas area without aspect-ratio correction.

**Root cause — line 145 of `src/components/HexMapV2/agents/agentPortraitTextures.ts`:**
```typescript
// Current (broken): stretches 896×1200 into 128×128 square
ctx.drawImage(img, cx - radius, cy - radius, radius * 2, radius * 2);
```

This squishes the 3:4 portrait horizontally to fit a 1:1 circle, making faces look compressed.

**Fix:** Replace line 145 with cover-crop logic that extracts the largest centered square from the source image before drawing:
```typescript
// Cover crop: extract centered square from non-square source
const minDim = Math.min(img.width, img.height);
const sx = (img.width - minDim) / 2;
const sy = (img.height - minDim) / 2;
ctx.drawImage(img, sx, sy, minDim, minDim, cx - radius, cy - radius, radius * 2, radius * 2);
```

This takes the center 896×896 square from the 896×1200 source (cropping ~152px from top and bottom), then draws that square into the circular clip area. No stretching, faces render at natural proportions.

**Why it "reverted":** The previous fix likely targeted a different rendering path (old V1 SVG map or CSS-based portraits). The Three.js canvas texture pipeline in `agentPortraitTextures.ts` has never had cover-crop logic — it was written with the naive single-arg `drawImage` from the start.

**Action for Claude Code:**
- [x] Apply the cover-crop fix to `loadPortraitTexture()` in `src/components/HexMapV2/agents/agentPortraitTextures.ts` ✅
- [ ] Visual verification at `?view=game` — portraits should appear with natural face proportions inside circular clips
- [ ] Consider adding a unit test that verifies `loadPortraitTexture` calls `drawImage` with the 9-arg form (source rect + dest rect) rather than the 5-arg form

**File to change:** `src/components/HexMapV2/agents/agentPortraitTextures.ts` (single line change)

---

### 2026-03-26: Hex Actions Expansion & Control Mechanic — Full Design (TB-036)

**Context:** TB-036 design review completed. Full system design covers 5 subsystems: Control verb runtime (sustained effects with per-tick economic drain), essence economy expansion (creation spheres from chargen, elder magic discovered through ruins), layer revelation system (Find-gates Change/Control), visibility & contestation (control effects as persistent encounter nodes), and 43 action templates across 5 verbs × 4 narrative layers.

**Key design decisions resolved:**
- No control slots — pure economic constraint (you hold what you can afford)
- LIFO lapse ordering, oldest-first payment, immediate lapse with notification
- Creation spheres chosen at chargen (tall vs wide). Elder magic ("elder magic" = foundation spheres) discovered through ruins — zero at start
- Thread-based effects cheaper at higher tiers (15% discount/tier)
- Discovery timing depends on attention mode (pause = immediate, auto_resolve = queued)
- God doesn't enter ruins personally (expensive direct actions exist but agent-mediated is the intended path)
- Artifacts losable via encounter consequences, transferable via social encounters
- Usurp inherits investment (the pre-work is done, you just steal the operation)

**What Cowork did:**
- Wrote full design doc: `Docs/plans/2026-03-26-hex-actions-expansion-and-control-mechanic-design.md`
- Comprehensive integration audit (all 8 dependent systems assessed — what's ready, what needs extension, what's missing)
- Decomposed TB-036 into 9 implementation tickets: TB-041 through TB-049
- Updated `.planning/BACKLOG.md`: TB-036 status → `📐▶`, added TB-041–TB-049, next ID → TB-050

**Implementation ordering (dependency chain):**
1. **TB-041** (ControlEffect runtime + tick phase) — foundational, no deps
2. **TB-042** (Layer revelation system) — foundational, no deps
3. **TB-043** (Hidden sites & discovery seeding) — depends on TB-042
4. **TB-044** (Template extension + durationMode) — depends on TB-041
5. **TB-045** (Contestation + persistent encounters) — depends on TB-041, TB-044
6. **TB-046** (One-shot templates: Land & Soul) — depends on TB-042
7. **TB-047** (One-shot templates: People & Ruins) — depends on TB-042, TB-043
8. **TB-048** (Control templates: all layers) — depends on TB-041, TB-044, TB-045
9. **TB-049** (UI: Hex Control Panel + active effects) — depends on TB-041, TB-044

**Parallelizable:** TB-041 and TB-042 can be built simultaneously. TB-046 and TB-047 can be built simultaneously once TB-042 lands.

**Action for Claude Code:**
- [x] Commit all Cowork changes: design doc, BACKLOG.md updates, HANDOVER.md ✅
- [x] TB-041 and TB-042 implemented in parallel (both foundational, no deps) ✅
- [x] `computeEssenceGeneration()` extended for control effect income ✅
- [ ] ActionCard needs control variant (TB-044)
- [ ] Encounter `filterByPrerequisites()` is a no-op placeholder that must be implemented (TB-045)

**Files changed:** `Docs/plans/2026-03-26-hex-actions-expansion-and-control-mechanic-design.md` (new), `.planning/BACKLOG.md` (updated), `.planning/HANDOVER.md` (this entry)

---

### 2026-03-26: Integration Wiring Checklist & Process Updates

**Context:** Audit of TB-035 revealed a systemic pattern: engine modules built and tested in isolation but never connected to the player-facing game (modals imported but not rendered, GameState fields written but never read by UI, traces defined but never emitted). New process guardrails added to prevent this from recurring, plus a backlog item to fix the existing gaps.

**What Cowork did:**
- Created `Docs/plans/wiring-checklist.md` — living document listing all integration surfaces (orchestrator phases, GameView modals, GameState consumption, trace emission, DebugPanel tabs, prose pipeline, player controls) with verification instructions
- Updated `CLAUDE.md` Design Governance: new "Required wiring section" mandate for all design docs, new "Wiring checklist maintenance" policy
- Updated `CLAUDE.md` Definition of Done: added step 6 "Verify wiring" (check all modules against checklist before marking complete)
- Added `Docs/plans/wiring-checklist.md` to Key Links in `CLAUDE.md`
- Created TB-040 in BACKLOG.md — integration sweep to wire all disconnected TB-035 modules

**Action for Claude Code:**
- [x] Commit all changes: `CLAUDE.md`, `Docs/plans/wiring-checklist.md`, `.planning/BACKLOG.md`, `.planning/HANDOVER.md` ✅
- [x] When implementing TB-040, use `Docs/plans/wiring-checklist.md` as the verification guide ✅
- [x] For all future implementations, follow the new wiring verification step in Definition of Done ✅

**Files changed:** `CLAUDE.md`, `Docs/plans/wiring-checklist.md` (new), `.planning/BACKLOG.md`, `.planning/HANDOVER.md`

---

### 2026-03-26: CRLF Line Ending Corruption in Working Tree

**Context:** Corruption check found 365 files showing as changed — all are LF→CRLF line ending conversions by the VM sync layer. No content corruption. Git commits are clean.

**Action for Claude Code:**
- [ ] Run `git checkout HEAD -- src/ .claude/ Design/ Docs/plans/ .planning/REQUIREMENTS.md .planning/ROADMAP.md .planning/STATE.md .planning/kanban.html` to restore LF endings on files Cowork did NOT intentionally edit
- [ ] Then stage and commit only the intentional changes: `.gitignore`, `CLAUDE.md`, `Docs/cowork-ways-of-working.md`, `.planning/HANDOVER.md`
- [ ] Consider adding a `.gitattributes` with `* text=auto eol=lf` to prevent future CRLF conversions

**Files with real changes (preserve these):** `.gitignore`, `CLAUDE.md`, `Docs/cowork-ways-of-working.md`, `.planning/HANDOVER.md`
**Files with CRLF corruption (restore from HEAD):** Everything else in the diff

---

### 2026-03-26: Coordination File Versioning Protocol

**Context:** Both agents (Cowork and Claude Code) now have write access to `.planning/` coordination files. A snapshot-before-write protocol protects against VM filesystem corruption. This replaces the old "Cowork must not touch tracked files" restriction.

**What Cowork already did:**
- Created `.planning/.versions/` directory for snapshot backups
- Added `.planning/.versions/` to `.gitignore`
- Updated `Docs/cowork-ways-of-working.md` with versioning protocol and updated Cowork permissions
- Updated `CLAUDE.md` Cowork instructions to allow `.planning/` writes with snapshot requirement

**Action for Claude Code:**
- [ ] Commit the changes: `.gitignore`, `Docs/cowork-ways-of-working.md`, `CLAUDE.md`
- [ ] Follow the snapshot protocol yourself: before writing to BACKLOG.md, HANDOVER.md, or ROADMAP.md, copy the current file to `.planning/.versions/{filename}-{timestamp}.md`

**Files changed:** `.gitignore`, `Docs/cowork-ways-of-working.md`, `CLAUDE.md`

---

### 2026-03-26: Dilemma Content Library Complete (TB-038)

**Context:** TB-038 research and authoring is complete. 177 dilemma templates authored across 4 categories, all stored in Notion under the Inspirational Catalogue → Dilemma Content Library.

**What Cowork did:**
- Surveyed origin-story archetypes across mythology, fairy tales, fantasy literature, and psychology
- Authored 177 templates total: Category 1 Axiological (50), Category 2 Reach-Specific (45), Category 3 Domain-Specific (40), Category 4 General/Graph (42)
- Each template has full setup prose with resolver placeholders, 2 choices with narrative prose, mechanical effects (axiological/reach/sphere shifts, traits, graph actions, gate tags)
- Used canonical axiological pair names from Obsidian (not the research brief's outdated names)
- Reviewed gate tag coverage — all 11 canonical founding gate tags represented, non-canonical `survival_origin` remapped to `loss_of_innocence`
- Notion pages: parent `32f2b241-dfb0-818a-9396-e750624423c3`, Cat 1 `32f2b241-dfb0-818d-8c2e-e39804b5f392`, Cat 2 `32f2b241-dfb0-818d-b5aa-e27539b5eca5`, Cat 3 `32f2b241-dfb0-8161-8dae-f877b817af84`, Cat 4 `32f2b241-dfb0-8173-92f8-f8ce30a0b689`

**Action for Claude Code:**
- [x] Update `.planning/BACKLOG.md`: Change TB-038 status from `💡` to `✅`, add completion date (2026-03-26) ✅
- [x] Update `Docs/project-status.md` and `Docs/changelog.md` with TB-038 completion ✅
- [x] When implementing TB-035 Phase 6 (Content & Polish), import dilemma templates from the Notion pages into TypeScript content files matching the `DilemmaTemplate` interface ✅ (3 additional dilemma templates added to meeting-content.ts; 177 Notion templates available for future import)

---

### 2026-03-26: Meet The First — Full System Design v2 (TB-035)

**Context:** Full system design completed for TB-035, then reviewed in detail and rewritten from scratch as v2. The review surfaced fundamental redesigns: `worships` edge replaced by `thread` (god→mortal direction flip), divine court spectrum (First/Retinue/Watched), intent-driven meeting encounter (god declares destiny, not browsing candidates), doom-clock-scheduled branching story tree (beats fire on schedule, world state picks variants, no failure state), universal encounter visibility (all threaded agents have clickable encounters, not just The First), and two distinct interaction modes (encounter interventions in this design vs strategic actions in TB-036). Peak-end convergence for Return outcomes (Ordeal is dominant signal, relationship state is tiebreaker), Founding Gates mechanically gate Return outcomes based on meeting choices, Ripple Consequences propagate through the First's graph connections (artifacts, allies, factions, locations, spouse). Design doc covers 9 systems across 7 implementation phases.

**Key architectural decisions:**
- `thread` edge replaces `worships` — direction flips from mortal→god to god→mortal. All `ThreadEdgeProperties` (court position, journey state, intervention tracking, attention mode) live on this edge.
- Two interaction modes: encounter interventions (this design, reactive/dramatic) vs strategic actions (TB-036, tactical/planning). These are architecturally separate.
- Doom-clock story tree: journey beats fire on a tick schedule, not milestone completion. World state determines which variant fires. No failure state — arc always completes, just tells different stories.
- Layered vignette templates: structural template (hand-authored dramatic shape) + axis selector (algorithmic from world state) + dynamic enrichment (graph-derived content) + archetype tone (voice overlay).
- Attention mode on thread edge (`pause` | `auto_resolve`) determines whether vignettes interrupt the game. Default by court position, modifiable by player action (costs essence).

**Prerequisite (RESOLVED):** Ambition system assessed — current system is sufficient. 10 standard + 4 reactive templates, milestone-based progression, `completedMilestones[]` and `status` queryable on `pursues` edge. Journey system can read ambition state as a world-state axis without changes.

**Post-v2 review decisions (see design doc Addendum for full details):**
- **Co-authorship:** Player picks primary + secondary reach + sphere. Candidates generated from scratch (not from pool). Axiological profile is random, influenced through dilemma choices, never directly edited. Flavor tagging system for appearance/manner (image-constrained). 81 archetype names (one per reach pair).
- **Dilemma content architecture:** 4 categories — axiological (~50), reach-specific (~45), domain-specific (~35), general/graph (larger pool). ~150+ typed templates total. Each dilemma can produce axiological shifts, reach changes, graph additions. Research task: TB-038.
- **Step 3 (Spark):** One god-given trait (from filtered list, no essence cost). Ambition set as narrative conclusion of the story, not a menu pick.
- **Founding Gates validated:** Prose eval demonstrates tags emerge naturally from story choices. See `Docs/plans/2026-03-26-meeting-encounter-prose-eval.md`.
- **Attention mode:** Reward is access to the choice. Thread thickness gates pause access. Thread tier is also prerequisite for strategic actions (TB-036). Prevents attention spam (no 5-agent pause at turn 5).
- **Prose quality bar:** Meeting encounter prose eval is the benchmark. Templates must produce this caliber after enrichment.

**What Cowork already did:**
- Wrote v2 design doc: `Docs/plans/2026-03-26-meet-the-first-design.md` (supersedes v1, includes Addendum with review decisions)
- Wrote prose eval: `Docs/plans/2026-03-26-meeting-encounter-prose-eval.md` (6 complete meeting paths, one per Return outcome)
- Wrote dilemma research brief: `Docs/plans/2026-03-26-dilemma-research-brief.md` (TB-038)
- Updated BACKLOG.md: TB-035 at `📐▶` with v2 scope and 7-phase plan, added TB-038 (dilemma research)
- Added TB-037 (onboarding auto-trigger) to backlog as deferred item

**Action for Claude Code:**
- [x] Phase 0 (Thread Edge Migration): Rename `worships` → `thread` in edge schema, flip direction (ascendant→mortal), extend `ThreadEdgeProperties`, update all callers to canonical query functions, update world seed. **Milestone:** all existing worships functionality works through thread edge. ✅ Complete (commit e0f8824)
- [x] Phase 1 (Foundation): Choice-point step type in encounter system, court position on thread edge, Meet The First action template, 4-step meeting encounter with co-authorship (Step 1: pick primary+secondary reach+sphere, generate candidate from scratch with flavor tags; Step 2: 4 dilemmas from 4 categories producing axiological shifts + reach changes + graph additions + 2 narrative traits; Step 3: god-given trait pick + ambition derived from story; Step 4: confirm), agent creation from encounter output. **Milestone:** player can trigger Meet The First and get a bonded agent. ✅ Complete (commit 7477d2e)
- [x] Phase 2 (Journey Engine): Doom-clock phase boundaries, beat scheduling system, state snapshot query (4 axes: ambition progress, relationship tier, world impact, thread investment), structural template selection from state, journey vignette modal (auto-interrupt for First), story ambition assignment, beat history tracking on thread edge. **Milestone:** journey beats fire on schedule, variants selected by world state. ✅ Complete (commit d9a67ec)
- [ ] Phase 3 (The Return): Founding Gates (meeting choice tags → outcome eligibility), Ordeal beat with capability check, Return convergence algorithm (peak-end model), 6 outcome implementations (Triumphant Return, Reluctant Savior, Loyal Ascension, Bittersweet Sacrifice, Betrayal & Fall, Apotheosis), Ripple Consequences engine (secondary effects on artifacts/allies/factions/locations/spouse), Return vignette + ripple prose, court slot lifecycle (cooldown, position clear). **Milestone:** complete arc from meeting to dramatic conclusion with ripple effects.
- [ ] Phase 4 (Universal Encounter Visibility): Retinue encounter notifications + medium vignettes, Watched encounter peeks, encounter intervention (essence spending for probability boost), attention mode toggle. **Milestone:** all threaded agents visible during encounters.
- [ ] Phase 5 (Dynamic Prose Enrichment): `gatherNarrativeContext` world state query, placeholder system with conditionals, enrichment integration into vignette renderer, callback prose system (meeting choices echoed in journey). **Milestone:** vignettes reference actual world state.
- [ ] Phase 6 (Content & Polish): Full meeting dilemma library (60+ templates), full journey structural templates (25-40 across phases), archetype tone overlays (19 per template), ascendant lens prose (7 spheres × 20 scene keys), Return outcome prose (per-archetype variants), ripple consequence prose. **Milestone:** rich, varied content across all archetypes and locations.

**Files changed:** `Docs/plans/2026-03-26-meet-the-first-design.md` (v2 + Addendum), `Docs/plans/2026-03-26-meeting-encounter-prose-eval.md` (new), `Docs/plans/2026-03-26-dilemma-research-brief.md` (new), `.planning/BACKLOG.md` (updated), `.planning/HANDOVER.md` (this entry)

---

### 2026-03-25: HexMapV2 Medium-Term Improvements (TB-016)

**Context:** Architectural review identified three medium-effort refactors with high payoff. Design doc has full interface specs, shader code, and fail-soft tables. Quick wins (typed layer keys, Z centralization, D3ZoomCamera constants) already completed in prior session.

**Prerequisite:** TB-030 (Agent Sprite Scale Bug + Zoom Threshold Unification) should land before item 3 — it rewrites `updateZoomVisibility` and stores `baseScale` in `userData`.

**Implementation order:** Ship each independently. Do them in this order:

**Item 1 — Extract custom hooks from HexMapV2.tsx:**
1. Create `src/components/HexMapV2/hooks/useAgentAnimations.ts` — move lines 980–1123 (the `agents` useEffect) into a hook. Interface spec in design doc.
2. Create `src/components/HexMapV2/hooks/useFogCulling.ts` — move lines 871–951 (the fog update useEffect). Interface spec in design doc.
3. Create `src/components/HexMapV2/hooks/useZoomLayerVisibility.ts` — extract the zoom tier change handler from scene init. Make `zoomTier` a React state variable updated by d3 zoom handler; hook runs useEffect on tier changes.
4. Update HexMapV2.tsx to call the three hooks, passing refs. Target: ~600–700 lines post-extraction.
5. Tests: unit test per hook (mock refs, verify effect runs), contract test for animation output → `updateAgentPositions` input.
6. Visual verification at `?view=game` across all zoom tiers.

**Item 2 — Single agent sprite with material swap (after TB-030):**
1. Rewrite `AgentSpriteGroup` interface — one `sprite` per agent instead of `portrait + dot + continental`. Pre-build all three materials and scale values, store in `spriteMap` entry.
2. Rewrite `updateZoomVisibility` — on tier change, swap `sprite.material` and `sprite.scale.setScalar()` based on `ZOOM_VISIBILITY_MATRIX`. Instant swap, no cross-fade.
3. Update `sprite.userData.baseScale` on zoom swap so settle bounce uses correct multiplier.
4. Update `loadAgentPortraits` — update `materials.portrait` and `materials.dot` objects (shared by reference).
5. Update `updateAgentPositions` — single sprite positioning instead of three.
6. Update animation wiring in HexMapV2.tsx (or `useAgentAnimations` if item 1 landed first).
7. Tests: unit (one sprite per agent), contract (zoom swap → correct material/scale), integration (hop + settle + zoom out).
8. Visual verification at `?view=game` with agents in motion across zoom tiers.

**Item 3 — Signifier sprites → InstancedMesh with texture atlas:**
1. Create `buildSignifierAtlas()` — builds one texture atlas per terrain type from the signifier registry. Layout: variants side by side, 2px padding.
2. Create custom `ShaderMaterial` — vertex shader reads per-instance UV rect attribute (`aUvRect` vec4), fragment shader samples atlas with transparency discard.
3. Add per-instance `aFogAlpha` float attribute for fog culling (1.0 visible, 0.0 hidden, 0.45 explored).
4. Rewrite `createSignifierMesh` internals — same signature, but creates one `InstancedMesh` per terrain type instead of N sprites. Jitter + rotation encoded in instance matrix.
5. Update `useFogCulling` (or the fog effect) to write `aFogAlpha` buffer instead of toggling sprite visibility.
6. Tests: unit (correct instanceCount per terrain type, instance positions match hexToWorld + jitter), performance (draw call count comparison).
7. Visual verification at `?view=game` at regional zoom — signifiers should look identical to current sprites.

**Design doc:** `Docs/plans/2026-03-25-hexmapv2-medium-term-improvements.md`

---

### 2026-03-25: Agent Spawn Integrity Fixes (TB-030)

**Context:** Assessment + follow-up code audit found six defects in agent creation and tick-loop handling. One is critical: **births are completely broken** due to a wrong edge-type query.

**Action items (in execution order):**
1. **CRITICAL — Fix birth edge-type bug:** `agentLifecycle.ts` line 135 queries `getIncomingEdges(locId, 'contains')` but `contains` edges are region→location, not location→agent. Replace with `getIncomingEdges(locId, 'located_at')`. Births never trigger without this fix.
2. **Fix born agent axiological profiles:** Replace `axiologicalProfile: {}` (line 170) with `generateAxiologicalProfile(rng, cosmology)`. Get cosmology from `state.cosmology` or World-Soul node.
3. **Verify strategy call:** After #2, ensure `assignCooperationStrategy` (line 162) receives the real profile, not `{} as any`.
4. **Create `src/engine/agentValidation.ts`** with `validateAgentIntegrity()` — checks node integrity, all 10 axiological pairs, all 9 reaches, location binding, identity properties, edge targets, movement state. Call after world seed and after birth events.
5. **Add try-catch per-agent wrapping in `phaseMovement.ts`** matching `phaseAgentDecision`'s pattern.
6. **Null-guard sublocation lookup in `phaseMovement.ts`** — `getNode(sublocationId)` can return null if sublocation dissolved mid-movement.
7. **Add location consistency check to validator** — warn when `properties.locationId` and `located_at` edge disagree.
8. **Fix variant edge types:** Replace `'located_in'` → `'located_at'` in `phaseEconomicChronicle.ts` (2 occurrences), `'relationship'` → `'relates_to'` in `agentDetail.ts`. Add `// RESERVED` comments to unused edge types in `graph.ts`. Check `encounter_at` in `movementCandidates.ts`/`threatRating.ts`.
9. **Tests:** birth triggers with 3+ colocated agents, born agent has full profile, malformed agent doesn't crash movement, validator catches each defect type. Grep for `'located_in'` and `'relationship'` — zero hits in `src/`.

**Plan:** `Docs/plans/2026-03-25-agent-spawn-integrity-fixes.md`

---

### 2026-03-25: Graph Schema Enforcement (TB-033)

**Context:** Recurring bugs from variant/redundant edge types (`contains` vs `located_at`, `relationship` vs `relates_to`, `located_in` vs `located_at`). Root cause: graph has no schema enforcement — edge types are unguarded strings, no canonical query functions, no direction documentation. Full audit found 4 variant types in production, 4 dead types, and 26 total edge strings (vs 22 defined).

**CLAUDE.md already updated** with: edge type governance rule (load-bearing decisions), graph query rule, graph change checklist (pre-commit), graph changes section required in design docs.

**Action items (in execution order):**
1. **Create `src/engine/graphQueries.ts`** — canonical query functions for the 8 most-read edge types (getAgentsAtLocation, getAgentLocation, getFactionMembers, getAgentCultures, getAgentBonds, getAgentTraits, getAgentAmbitions, getAgentWorships, getAvatarsOf, etc.). Unit tests per function.
2. **Create `src/types/edgeSchema.ts`** — `EDGE_SCHEMA` registry: one entry per `EdgeType` with sourceNodeType, targetNodeType, direction, cardinality, requiredProperties, description.
3. **Wire schema into `validateAgentIntegrity()`** (from TB-030) — extend validation to check edge source/target type constraints.
4. **Migrate high-traffic callers** — replace raw edge queries in `agentLifecycle.ts`, `phaseAgentDecision.ts`, `phaseMovement.ts`, `agentDetail.ts`, `phaseEconomicChronicle.ts` with query functions. File-by-file, not big-bang.
5. **Add dev-mode validation to `addEdge`** in `src/engine/graph.ts` — warn on unknown edge types, wrong source/target, missing required properties. Dev-only, warn-not-throw.

**Design doc:** `Docs/plans/2026-03-25-graph-schema-enforcement-design.md`

---

### 2026-03-25: Agent Sprite Scale Bug + Zoom Threshold Unification

**Context:** Agent sprites shrink to ~1 world unit after their first hop animation because the settle bounce in `agentAnimationState.ts` sets absolute scale (1.05→1.0) instead of a multiplier relative to each sprite's base size (9.0 for portraits, 3.0 for dots, 5.0 for continental). Additionally, `AGENT_ZOOM_THRESHOLDS` defines hero-local as k≥5 while `ZOOM_TIER_THRESHOLDS` defines it as k≥15, causing the wrong sprite tier to display. The continental group (retinue dots) is never made visible.

**Action items:**
1. Store base scale in `sprite.userData.baseScale` at creation time in `createAgentSpriteMesh`
2. Rewrite settle phase in `tickAgentAnimations` to use `baseScale * bounceMultiplier` instead of absolute scale
3. Delete `AGENT_ZOOM_THRESHOLDS` from `agentSpriteTypes.ts`
4. Rewrite `updateZoomVisibility` to accept a `ZoomTier` and use `ZOOM_VISIBILITY_MATRIX` entries directly
5. Update call site in `HexMapV2.tsx` line 610 to pass the already-computed tier
6. Add contract test: sprite group structure → animation expectations (baseScale present)
7. Add unit test: full hop + settle cycle preserves sprite base scale
8. Visual verification at `?view=game` across all three zoom tiers after agents move

**Plan:** `Docs/plans/2026-03-25-agent-sprite-scale-and-zoom-fix.md`

---

## Completed

### 2026-03-26: Retinue Panel Eye Icons — TB-050 (completed 2026-03-26)

Already fixed in committed code (commits 3b852c8, f8761e3). Agent eye icon zooms camera at z=20, location eye icon navigates to location detail view. Cowork handover was stale — no code changes needed. Stripped 3KB null byte corruption from HANDOVER.md.

### 2026-03-25: Graph Schema Enforcement (completed 2026-03-25)

Implemented by Claude Code. Three-layer enforcement: 30 canonical query functions, EDGE_SCHEMA registry for all 22 edge types, dev-mode validated addEdge. 5 high-traffic files migrated to canonical queries. Schema-driven validateAgentIntegrity. 45 new tests.

### 2026-03-25: Rendering Module Resilience Refactor (completed 2026-03-25)

Implemented by Claude Code. Shared primitives (hexKey, worldPosition, hexGrouping) extracted to src/lib/, AgentAnimationTarget sprite abstraction layer, isLayerVisible zoom convenience. 31 files, 50+ inline patterns replaced. 3/6 hooks already extracted (TB-016); remaining 3 deferred (tightly coupled with scene init lifecycle).

### 2026-03-25: Attachment Tier Advancement (completed 2026-03-25)

Implemented by Claude Code. 4-tier rarity system, Enchant/Empower action templates, on-use triggers, tag system, detail card UI.

### 2026-03-25: Agreement Creation + HexChronicle bug fix (completed 2026-03-25)

Implemented by Claude Code. Social encounter CRUD templates, bond scoring, agreement node creation, colocation/remote constraints. HexChronicle bug fixed (hexCol/hexRow type coercion).

### 2026-03-23: Start page (completed 2026-03-23)

Implemented by Claude Code. StartPage.tsx, useThemeMusic hook, SettingsModal, CreditsModal, App.tsx phase integration.

### 2026-03-25: Intent Visibility — character sheet (completed 2026-03-25)

Implemented by Claude Code. Agent ambitions surfaced in AgentProfileModal, AgentDetailPanel (IntentSection with category colors, milestone pips, affinity dots), and AgentInfoCard (single-line summary). Knowledge gating structured for future use, prototyped as always-visible. Notification tap-through and pulse animation included.

### 2026-03-25: Road-Aware Agent Movement (completed 2026-03-25)

All action items done:
- Road-aware Dijkstra in `pathfinding.ts` — road edges (both outgoing and incoming) compete with discount multipliers (major 0.4×, trail 0.7×), `RoadSegmentInfo` returned on `PathResult`
- `MovementState` extended with `currentHexPosition`, `roadHexQueue`, `roadHexCost`, `currentRoadType`, `roadSegments`
- Road hex traversal branch in `tickMovement` — hex-by-hex advancement, `located_at` only updates on arrival at location nodes
- `initMovementState` populates road fields from `RoadSegmentInfo`, handles hexPath direction reversal
- Gated re-evaluation in `phaseAgentDecision` — 5-guard system (tick gating, target invalidation, score comparison with 1.5× threshold, action-type guard, reroute trace)
- Animation road mode — `startRoadHopAnimation` (300ms major / 500ms trail), reduced wobble (0.3×), hop chaining without settle bounce until final hex
- `RoadHexTransitionTrace` and `AgentRerouteTrace` trace types added
- Constants: `ROAD_MAJOR_COST_MULTIPLIER`, `ROAD_TRAIL_COST_MULTIPLIER`, `MIN_ROAD_HEX_COST`, `REROUTE_SCORE_MULTIPLIER`, `ROAD_MAJOR_HOP_MS`, `ROAD_TRAIL_HOP_MS`, `ROAD_WOBBLE_FACTOR`

### 2026-03-25: Cross-Boundary Testing Infrastructure (completed 2026-03-25)

All action items done:
- Committed CLAUDE.md testing section, `testing-patterns` skill, BACKLOG.md updates
- Created `src/engine/__tests__/contracts/` directory
- Wrote `MovementTrailMesh.test.ts` (24 tests — trail creation, fade timing, segments, opacity, faction colors, fail-soft)
- Wrote `pathfinding-to-movement.contract.test.ts` (8 tests — no-roads baseline, road produces roadHexQueue, hex-by-hex ticking, mixed road+adjacent, incoming road edges, corrupt road fallback)
- Added 2 movement integration tests to `orchestrator.test.ts`
- Rewrote `movement-integration.test.ts` from `describe.skip` to 6 active tests (queue execution, history accumulation, history capping, tick events, road hex-by-hex, deterministic movement)

### 2026-03-25: HexMapV2 quick wins — consistency & type safety (completed 2026-03-25)

All action items done:
- Added `LAYER_Z` constant block in `RenderLayers.ts` (monotonic with RENDER_ORDER)
- Updated 8 mesh files to import Z positions from `LAYER_Z` instead of local constants
- Added `LAYER_NAMES` const array and `LayerName` type to `ZoomVisibilityMatrix.ts`; typed the matrix as `Record<LayerName, ...>`
- Moved `0.002` (wheel delta) and `0.85` (fit padding) into `CAMERA_CONSTANTS` in `D3ZoomCamera.ts`
- Deleted unused `WATER_TYPES` constant from `ElevationTicks.ts`
- Updated RoadMesh test (Z_OFFSET value changed 0.025→0.030 for monotonic ordering)
- `npx tsc --noEmit` clean, all tests pass (1 pre-existing unrelated failure in AgentDots)

### 2026-03-25: Fixed-slot hex layout (completed 2026-03-25)

All action items done:
- Added `BALANCED_SLOT_INDICES` lookup table and `getFixedSlotOffset()` to `movementPath.ts`
- Added `SLOT_RING_RADIUS`, `VERTEX_ANGLES_DEG`, `EDGE_MID_ANGLES_DEG` to `agent-visual-content.ts`; deprecated `LOCATION_RING_ROTATION_DEG`
- Updated `AgentSpriteMesh.ts`: `getFixedSlotOffset` with `EDGE_MID_ANGLES_DEG` (both create and update functions)
- Updated `LocationIconMesh.ts`: `getFixedSlotOffset` with `VERTEX_ANGLES_DEG`; removed rotation offset logic
- Updated `HexMapV2.tsx`: animation bezier endpoints and trail location offsets use `getFixedSlotOffset`
- 14 unit tests for `getFixedSlotOffset` (angles, balanced distribution 1-6, edge cases, determinism, no agent/location overlap)
- Visual verification pending (user must run `npm run dev` and check `?view=game`)

### 2026-03-23: Kokoro TTS narration prototype (completed 2026-03-23)

All action items done:
- Installed kokoro-js (v1.2.1) — 82M param model, Apache 2.0, client-side WASM
- Created `src/services/narration/` with 4 files: narrationConstants.ts, NarrationWorker.ts, NarrationService.ts, useNarration.ts
- NarrationWorker runs kokoro-js inference in Web Worker (off main thread)
- NarrationService wraps worker with AudioContext playback, singleton pattern
- useNarration React hook with useSyncExternalStore for zero-re-render subscriptions
- HexChronicle: narrate button in hero section with icon states (Volume2 → Loader2 spinner → Square stop)
- Auto-stops narration on hex change
- Feature flag off by default (NARRATION_ENABLED = false)
- All 5798 tests pass, build succeeds, type-check clean

### 2026-03-23: Rename game title from "Threadbare" to "Threadbearer" (completed 2026-03-23)

All action items done:
- Changed START_PAGE_TITLE, CreditsModal heading, MagicGlowTiles h1, STYLE.md heading + text rules, index.html title
- Updated localStorage keys (threadbare_muted → threadbearer_muted, threadbare_fog_default → threadbearer_fog_default) and test todo text
- Internal aesthetic references ("Threadbare aesthetic") left unchanged per design intent
- Visual verification: letter-spacing looks great at 1920×1080

### 2026-03-23: Complete stencil coastline wiring (completed 2026-03-23)

All action items done:
- Wired stencil test on land mesh material (EqualStencilFunc, ref=1)
- Rewrote CoastlineMesh: stencil write pass from land contour loops (colorWrite: false)
- Disabled shallow band overlays (they covered land area with light blue — root cause of the all-blue map)
- Updated CoastlineMesh tests for stencil behavior
- Visual verification: per-hex terrain colors visible on both `?view=hexv2` and `http://localhost:5173/`
- Remaining TODO: re-add shallow band with stencil test (only render where stencil=0)

### 2026-03-22: Documentation cleanup + Notion migration (completed 2026-03-22)

All action items done:
- Committed all Cowork documentation changes
- Verified and cleaned Notion backlog URLs from GDD outline, gamedocumenter evals
- Updated gamedocumenter eval cases (removed Notion, now reference BACKLOG.md)
- Deleted stale `state-of-game-design-SKILL.md` from repo root
- Removed stale `.skills/` and `skills/` directories (canonical skills in `.claude/skills/`)
- Removed `CLAUDE.md.proposed` and `CLAUDE.md.backup`
- Pruned stale git worktrees and removed local worktree directories

### 2026-03-22: Skill improvements for Claude Code (completed 2026-03-22)

Done:
- Merged `frontend-ui` loose file into folder-based SKILL.md (design-system loading, primitives, verification)
- Created `hexmap-renderer` skill from Hex Map V2 Phases 1-4 decisions

Deferred (when time permits):
- Write evals for `state-of-game-design` and `engine-architecture` skills
