> **title:** `The incident snapshot — one button on the deployed build that hands an agent the state Christian is looking at — THR-1134`
> **linear_issue:** THR-1134
> **author:** `Claude Code`
> **created:** 2026-09-09
> **three_pillars:** Engine `done` · Content `N/A — diagnostic data only; the two sentences the panel and the toast speak are UI copy, not authored content` · UI `done — a TROUBLE section in the settings popover (record · save · include the world), a crash-time toast, and the download; Playwright at 1920×1080 plus a `vite preview` download proof`

# The incident snapshot — THR-1134

*Christian sees a wrong-looking world on threadbearer.co and can send a screenshot and a sentence. After this he can send a file that names the build, the seed, the tick, the last thousand things that happened, every crash the engine caught with its stack, what he had open, and the neighbourhood of what he was looking at — small enough to attach, honest enough that a cold agent can say which subsystem did it.*

## Why this is load-bearing

The ticket's three findings still hold on `main` `a87e8f24`, re-verified 2026-09-09: there is no serialization of any kind (no `toJSON`, no `serializeGameState`, no `structuredClone` in `src/`); the whole diagnostic bridge is wrapped in `if (import.meta.env.DEV)` at `src/debug-bridge.ts:8`, so on the deployed build `window.__DEBUG` is undefined and every accessor behind it is unreachable; and the one export that exists hands back strings. Two further facts shape the design more than the ticket knew. First, **two accumulators already run in production and cannot be read**: `tickHealthMonitor` is called unconditionally every tick at `src/engine/orchestrator.ts:3930` and keeps the last 100 health reports and the last 100 crash entries *with stacks* (`HEALTH_LOG_BUFFER_SIZE`, `tickHealthMonitor.ts:17`), and `encounterTimeline` appends from `encounter.ts`, `orchestrator.ts:856` and `phaseAgentDecision.ts:448` with no DEV gate at all. Both are collecting in every session Christian plays; neither has a door. Second, **`JSON.stringify(state)` does not throw — it lies.** Measured on seed 42 / medium at tick 100: it returns 1,661,839 bytes of plausible JSON with the entire graph emitted as `{"nodes":{},"edges":{},"outgoing":{},"incoming":{}}` (51 characters standing in for 3,262,388) and every `Map` on the state — `visibilityMap` (768 entries), `effectStates` (119), `agentKnowledge`, `culturalInsightMap`, `clearanceGateStates` — flattened to `{}`. A naive bundle would look complete and contain no world. Four plan docs (`2026-04-17`, `2026-04-18`, `2026-05-11`, `2026-05-12`) claim fields "survive save/load via the existing graph-snapshot serialization"; that serialization has never existed, and `2026-03-04-vertical-slice-design.md:69`'s *"trivial to save/load later (just JSON.stringify)"* is measured false. This plan retires that premise by building the thing those docs assumed.

The decisions the ticket records are taken as settled and not reopened: snapshot only, no replay log; must work on the deployed build; output is a downloaded `.json` file.

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| `tick` — `tickHealthMonitor.ts` (`validateTickOutput`, `appendCrashLog`, `getLatestReport`, `getCrashLog`, `exportDiagnostics(currentState?)`) | 🟢 ACTIVE, **prod-safe, unread in prod** | **activates the reader** — the bundle is the first production consumer of the health log, the crash log and `stateMetrics`; `exportDiagnostics` finally receives the state (`debug-bridge.ts:1711` calls it with none, so `stateMetrics` is always `null`) |
| `trace` — `traceBuffer.ts` (`BUFFER_SIZE` 2000, `enabled = false` at module scope, `enableTracing`, `getTraces`, `isTracingEnabled`) | 🟢 ACTIVE, **off in prod, never switched on** | **connects** — the settings popover gains a prod-reachable *record* toggle that calls `enableTracing()`; the bundle includes the ring only when it was on. The buffer is not edited (358 importers) and stays off by default: its eviction is `shift()` plus a full renumber (`traceBuffer.ts:99-107`), O(n) per evicted entry, and a saturated tick can evict thousands |
| `encounter` — `encounterTimeline.ts` (`MAX_EVENTS_PER_AGENT` 5000, append-only, prod-safe) + `encounterLogExporter.ts` (pure formatter; the UI does the Blob) | 🟢 ACTIVE | **connects** — the bundle carries the timeline for the selected and followed mortals; the formatter/trigger split is the precedent this plan follows, and its inline download idiom (`EncounterCacheView.tsx:174-181` and `:196-203`, duplicated) is extracted into the one helper both use |
| `GameState.recentEvents` (`MAX_RECENT_EVENTS` 100, `gameState.ts:566`; nine writers each re-apply the cap) | 🟢 ACTIVE | **extends** — a second, wider ring is kept beside it by a new prod-safe recorder, because 100 entries is three to five ticks and the cause of a wrong-looking state has usually rolled off by the time it looks wrong |
| `getDebugActiveUIState` / `getDebugOpenModals` (`GameView.tsx:4060-4081`, `:3985`) | 🟢 ACTIVE, **DEV-gated** | **extends** — the same record (view, selection, open modals, camera, running) is the bundle's *what he had open* block; the composer is hoisted out of the `import.meta.env.DEV` guard, which costs one small object allocation |
| `WorldGraph.getAllNodes()` / `getAllEdges()` (`graph.ts:116`, `:258`) | 🟢 ACTIVE | **preserves** — the world tier and the neighbourhood read the public surface; no `toJSON` is added to the class (865 importers) |

**Grep evidence (measured 2026-09-09 on `main` `a87e8f24`).** Zero hits for `toJSON`, `serializeGameState`, `structuredClone` in `src/`. Zero hits for `VITE_VERCEL_GIT_COMMIT_SHA`, `__COMMIT_SHA__`, `define:` in `vite.config.ts` (38 lines; it already loads a local `constantWriter()` plugin, so a `define` block is the one missing line, not a new pattern). `mulberry32` (`src/lib/prng.ts:8`) is constructed fresh per call from `seed`, `tick` and a site hash — there is no advancing generator, so `seed` + `tick` + map size is a complete key for regenerating tick 0 of the same world, and the bundle carries all three. Measured payloads at seed 42 / medium / tick 100: graph 3,262,388 bytes (2674 nodes, 5439 edges), `chapterArchive` 818,162, `unifiedActions` 248,170, `tiles` 149,938 (regenerable from the key), `recentEvents` 26,486, one actor node with its six edges 4,373.

## Engine pillar

### Systems design

Two new leaf modules under `src/engine/`, importing nothing new into the hubs.

**`incidentRecorder.ts` — the prod-safe flight recorder.** A small object created by `createSimulationRuntime` and held as `runtime.incidentRecorder`, so it is owned by the playthrough by construction — the load-bearing decision *engine caches must be owned per session, not stored at module scope* names `SimulationRuntime` as the home for per-session engine state, and a fresh runtime per playthrough means the ring can never carry a previous run's events into a bundle (which would mislead exactly the cold agent the feature serves). `tickHealthMonitor` and `encounterTimeline` are module-scope precedents; this plan does not follow them, because the prescribed home exists and `runTick` already has `runtime` in scope at the tick-end site. No reset call and no edit to `gameInit.ts` are needed. It keeps two rings: `INCIDENT_EVENT_RING_SIZE` tick events (every `TickEvent` the orchestrator appends to `recentEvents`, captured once at the tick-end site beside `validateTickOutput` at `orchestrator.ts:3930`, so the nine `recentEvents` writers are not touched) and `INCIDENT_METRICS_RING_SIZE` per-tick census rows — `{ tick, nodeCount, edgeCount, unifiedActions, encounterNotifications, controlEffects, chronicleEntries, tickMs? }`, the same numbers `exportDiagnostics`'s `stateMetrics` computes, one row per tick. The metrics ring is what answers *why did it drift*: a graph that grew by four hundred nodes in ten ticks is visible as a line, not a guess. Both rings are head-indexed circular buffers (`push` at `head`, wrap), never `shift()`; the append is O(1) and wrapped in `try/catch` so a throwing census can never touch the tick.

**`incidentBundle.ts` — the pure assembler.** `buildIncidentBundle(state, runtime, opts): IncidentBundle` and `serializeIncidentBundle(bundle): string`. No React, no DOM, no side effects — the CLI (which owns a runtime) and a vitest can build one. The bundle has a `version` (`INCIDENT_BUNDLE_VERSION`) and these sections, each built inside its own `try/catch` so a failing section writes `{ error: message }` into its slot and the rest still ships (the `validator_error` shape `tickHealthMonitor.ts:218-234` already uses):

| Section | Contents | Source |
|---|---|---|
| `run` | build SHA, `seed`, `tick`, `cycle`, `phase`, map cols/rows and preset, the full URL with flags, ISO timestamp, `userAgent`, `ascendantIdentity` (scalars and short arrays only), `essencePool`, whether tracing was armed | `__BUILD_SHA__`, `state`, `window.location`, `App` map-size resolution passed in by the caller |
| `health` | the health log and the crash log, verbatim | `tickHealthMonitor` |
| `census` | `exportDiagnostics(state)` — the counts block that has been `null` since the bridge was written — plus the metrics ring | `tickHealthMonitor`, `incidentRecorder` |
| `events` | the event ring (the last `INCIDENT_EVENT_RING_SIZE`), `recentEvents`, this tick's `tickEvents` | `incidentRecorder`, `state` |
| `attention` | `followedAgentIds`, `mutedAgentIds`, `pendingUndertakingMoments`, `playerActionReceipts`, `storyBeatQueue`, `premonitionQueue`, `encounterNotifications`, `activeThreadTugs` | `state` |
| `clocks` | `doomClock`, `mandateState`, `omenState`, `strategicState` (controls, active projects, history tail) | `state` |
| `ui` | the active-UI record: view, selected agent / location / faction / hex, open modals, action drawer, scry, camera hex, running | the hoisted `getActiveUIState` composer |
| `focus` | the selected entity's node, every edge on it, and each neighbour node to `INCIDENT_NEIGHBOURHOOD_DEPTH`, capped at `INCIDENT_NEIGHBOURHOOD_MAX_NODES`; the same for each followed mortal; the encounter timeline for those actors | `graph.getAllEdges()` filtered, `encounterTimeline` |
| `traces` | `getTraces()` if `isTracingEnabled()`, else the sentence *recording was off* | `traceBuffer` |
| `world` | **only with `includeWorld`**: every node and every edge via the public getters, and every `Map` on the state as entries; `tiles` omitted because `run` carries the key that regenerates them | `graph`, `state` |
| `serialization` | a manifest: for every `Map`/`Set` the walker met, its path and entry count; the byte length of each section | the serializer itself |

**The lossy-stringify guard.** `serializeIncidentBundle` stringifies with a replacer that rewrites a `Map` as `{ "__map": [[k, v], …] }` and a `Set` as `{ "__set": [...] }`, and it counts what it rewrote. The `serialization` manifest records every path and count, and the assembler asserts after the fact that the count of `Map` instances it walked equals the count the replacer rewrote — a bundle whose manifest disagrees with its walk is tagged `serialization.incomplete: true` rather than shipped silent. The unit test builds a state with a populated `visibilityMap` and asserts the entries come back, and separately asserts that the naive `JSON.stringify` of the same state yields `{}` for that field, so the test fails against the trap it exists to catch rather than against a fixture that never had the problem.

**Build SHA.** `vite.config.ts` gains `define: { __BUILD_SHA__: JSON.stringify(process.env.VERCEL_GIT_COMMIT_SHA ?? 'local') }` and `src/vite-env.d.ts` declares the global; Vercel sets that variable at build time. The dev server reads `local`; a bundle that says `local` is itself a finding.

**The one-word repair.** `debug-bridge.ts:1711` becomes `m.exportDiagnostics(_gameStateProvider?.())`, so the dev bridge's own census stops being `null`. Additive, and it is the same call the bundle makes.

### Graph nodes / edges

None. The bundle reads the graph through its public getters; nothing is written to it.

### Tick phases

No new phase. One O(1) append at the existing tick-end site (`orchestrator.ts:3930`, beside `validateTickOutput`), guarded exactly as the outer tick guard at `:3980-3998` guards the tick.

### Resolution logic

None. Capture is a player action outside the tick; the assembler is a pure function of the state it is handed.

### PRNG callouts

None. No draw anywhere; the timestamp is metadata and never re-enters the simulation.

## Content pillar

Content: N/A — the bundle is diagnostic data; no prose table, template or attachment is authored. The two sentences the panel and the toast speak are UI copy owned by the UI pillar below, written in the house register (sentence case, plain, no numerals).

## UI pillar

*Screenshot tool: **Playwright** (DOM — the settings popover and the toast; no WebGL surface changes). Because the popover is a positioned layer inside the top bar, capture the open panel as an accessibility-tree read plus a closed-state screenshot of the ⚙ trigger, per the portal rule in `Docs/canon/verification-gates.md` § Browser-verify.*

### Player-facing display

The capture control lives in the existing ⚙ **`SettingsPanel`** popover (`src/components/Game/SettingsPanel.tsx`, rendered from `GameViewTopBar.tsx:235`) — the one prod-reachable home of global controls, which already carries fog, palette, notifications, audio and the debug toggle. It gains a fourth section, **TROUBLE**, below Audio, built from the panel's own `toggleStyle` / `settingLabelStyle` and the shared `Button` primitive:

- **Record what happens** — a toggle. On: `enableTracing()`; the label's second line reads *slows the world a little while it is on*. Off: `disableTracing()`. Session-scoped, never persisted — the cost is real and must be chosen each time.
- **Include the whole world** — a checkbox, default off; its second line reads *a much larger file*.
- **Save a snapshot** — a `Button`. Builds the bundle from the current state and downloads it. On success a toast: *Snapshot saved. Attach the file to your message.* On failure a toast: *The snapshot could not be saved.* — and the console carries the error.

The download file is `threadbearer-snapshot-<sha7>-seed<seed>-t<tick>-<YYYYMMDD-HHmm>.json`, produced by a new shared helper `src/components/shared/downloadTextFile.ts` (Blob + `<a download>` + `revokeObjectURL`), which `EncounterCacheView.tsx` adopts in the same change so the idiom exists once.

**Discoverability without a shortcut.** When `tickHealthMonitor` appends a crash entry during play, the game shows one toast — *Something went wrong under the hood. You can save a snapshot from Settings.* — clicking it opens the settings popover. Debounced by `INCIDENT_PROMPT_COOLDOWN_TICKS` so a crashing tick loop produces one prompt, not one per tick. Gated by `INCIDENT_PROMPT_ON_CRASH`.

**The UI Laws this surface engages (THR-1007; they bind by default):** Law 1 (every control carries its tooltip — the toggle explains the cost, the button explains what it saves); Laws 13/14 (no numerals on the surface — byte sizes, tick counts and entry counts stay in the file; the toast says *a much larger file*, never a megabyte figure); Law 17 (status in prose); Law 21 (one gold emphasis per panel — the section adds none; the Save button is the panel's default button style, not gold); Law 23 (the popover keeps `SettingsPanel`'s existing overlay contract); Laws 26/27 (no new primitive — `Button`, the panel's own toggle, one extracted helper); Law 33; Law 37; Law 50 (focus returns to the ⚙ trigger when the popover closes, as it does today).

### Event notifications

Two toasts (success / failure) pushed through the existing `handlePushToast` path (`GameView.tsx:466`), and the crash prompt toast with a `navigationTarget` that opens settings. No chronicle entry — a snapshot is not a world event.

### Debug inspection (DebugPanel)

- `window.__DEBUG.buildIncidentBundle({ includeWorld? })` → the bundle object (not downloaded), and `window.__DEBUG.getIncidentRecorderStats()` → `{ events, metrics, head }`. Both call the same leaf modules the button calls, so the dev proof and the prod path share one implementation.
- The `incident_bundle` trace (below) is visible in the trace viewer when recording is on.

### Visual presence (HexMapV2)

N/A — no map-layer change.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `engine/incidentRecorder.ts` (new) | tick-end append beside `validateTickOutput` (`orchestrator.ts:3930`, `runtime` in scope) | — | none — `runtime.incidentRecorder` on `SimulationRuntime`, fresh per playthrough | — | `__DEBUG.getIncidentRecorderStats()` |
| `engine/incidentBundle.ts` (new) | — | called by `useIncidentCapture` | reads `state` and `runtime`; writes nothing | `incident_bundle` | `__DEBUG.buildIncidentBundle()` |
| `components/Game/hooks/useIncidentCapture.ts` (new) | — | `SettingsPanel` TROUBLE section, crash toast | reads via the GameView state getter and `useSimulation`'s runtime handle | — | — |
| `components/shared/downloadTextFile.ts` (new) | — | `SettingsPanel`, `EncounterCacheView` (adopts) | — | — | — |
| `GameView.tsx` (edit) | — | passes capture props to `GameViewTopBar` → `SettingsPanel`; hoists `getActiveUIState` out of the DEV guard; crash-prompt toast | — | — | `getActiveUIState` stays registered on the bridge in dev |
| `vite.config.ts` + `src/vite-env.d.ts` (edit) | — | — | — | — | `__BUILD_SHA__` |
| `debug-bridge.ts` + `.d.ts` (edit) | — | — | — | — | two new methods; `exportDiagnostics` receives the state |

Player controls: the toggle, the checkbox, the button, the crash toast's click-through. Prose pipeline: none.

## Constants table

All in a new `src/data/incident-snapshot-constants.ts` (NFP #1):

| Constant | Default | Purpose |
|----------|---------|---------|
| `INCIDENT_BUNDLE_VERSION` | `1` | Schema version a reader checks first |
| `INCIDENT_EVENT_RING_SIZE` | `1000` | Tick events kept beyond `recentEvents`' 100 (≈ 260 KB at the measured 26 KB / 100) |
| `INCIDENT_METRICS_RING_SIZE` | `300` | Per-tick census rows (≈ 25 days of play at 12 ticks/day; ≈ 40 KB) |
| `INCIDENT_NEIGHBOURHOOD_DEPTH` | `1` | Edge hops from the selected entity included in `focus` |
| `INCIDENT_NEIGHBOURHOOD_MAX_NODES` | `60` | Cap on neighbour nodes per focus entity |
| `INCIDENT_TIMELINE_TAIL` | `200` | Encounter-timeline entries per focus actor |
| `INCIDENT_PROMPT_ON_CRASH` | `true` | Whether a caught crash raises the snapshot prompt toast |
| `INCIDENT_PROMPT_COOLDOWN_TICKS` | `60` | Minimum ticks between crash prompts |
| `INCIDENT_FILENAME_PREFIX` | `'threadbearer-snapshot'` | Download name stem |
| `INCIDENT_WORLD_TIER_WARN_BYTES` | `8_000_000` | Above this the success toast adds *this one may be too big to attach* (the number never renders) |

## Tracing

Register in `src/types/trace.ts` at all four sites (`TraceCategory` union, the category list, the interface, the `TraceEntry` union — `emitTrace`'s `Omit` collapses unions, so an unregistered field is silently dropped and only `npm run check:typecheck` catches it):

```ts
// IncidentBundleTrace — emitted once per capture (player-scale; no batching needed)
interface IncidentBundleTrace extends TraceBase {
  category: 'incident_bundle';
  includeWorld: boolean;
  bytes: number;
  sections: readonly string[];      // sections that built
  failedSections: readonly string[]; // sections that wrote { error }
  tracingWasOn: boolean;
}
```

The recorder itself emits no trace — it is the thing that runs when nothing else is recording.

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| Recorder append throws (a census getter on a half-built state) | Caught at the append site; the tick proceeds; the miss is counted on the recorder's stats |
| A bundle section throws | That section is `{ error: message }`; every other section ships; `failedSections` names it in the trace |
| `Map` count walked ≠ count rewritten | `serialization.incomplete = true` in the bundle; the toast still says saved; the file says what is missing |
| `__BUILD_SHA__` undefined (a build without the define) | `run.build = 'unknown'` |
| `window.location` or `navigator` unavailable (CLI, jsdom) | `run.url` / `run.userAgent` omitted; the assembler never touches `window` outside a guard |
| `getTraces()` when tracing is off | `traces` is the sentence *recording was off*, never an empty array masquerading as *nothing happened* |
| Blob / `<a download>` throws (a locked-down browser) | Failure toast + `console.error`; no state touched |
| Selected entity id resolves to no node | `focus.selected = null`; followed mortals still dumped |
| `includeWorld` on an epic map | Ships; the size-warning toast line appears when the string exceeds `INCIDENT_WORLD_TIER_WARN_BYTES` |
| Crash prompt would fire during another interrupt | It is a toast, never a modal; it never blocks the veil, a beat or a receipt |

## Interface impact

The health/crash/diagnostics chain has no row in `Docs/canon/interface-map.generated.md` (⚪ UNAUDITED); `src/debug-bridge.ts` appears only as a read site on four other contracts. Per Step 0.7, this plan writes the rows it touches; the executor registers them in `scripts/interface-contracts.ts` in the same change.

| Contract | Action | Producer → Consumer |
|----------|--------|---------------------|
| Tick health + crash log → a reader | **add** | `tickHealthMonitor` (prod, every tick) → `incidentBundle.health` — today the only consumer is the DEV-gated bridge, which is a write-without-consumer in production (🔴 LEAKED in the map's terms); this row closes it |
| `exportDiagnostics(state).stateMetrics` | **extend** | the bridge finally passes state; the bundle's `census` consumes the same call |
| Event ring + metrics ring → bundle | **add** | `incidentRecorder` → `incidentBundle.events` / `.census` |
| Trace ring → bundle (when armed) | **extend** (new consumer, buffer untouched) | `traceBuffer.getTraces` → `incidentBundle.traces` |
| Active UI state → bundle | **extend** | `GameView` composer (hoisted) → `incidentBundle.ui`; the dev bridge registration is preserved |
| Encounter timeline → bundle | **extend** | `encounterTimeline` → `incidentBundle.focus.timeline` |

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/engine/simulationRuntime.ts` | 184 | one added optional field (`incidentRecorder`) created in `createSimulationRuntime`; no signature changes; every importer that constructs a runtime gets it for free |
| `src/types/trace.ts` | 120 | one added category at the four registration sites; nothing renamed; the typecheck ratchet is the gate |

Not touched, by design: `src/engine/graph.ts` (865) and `src/types/gameState.ts` (563) — the recorder lives on the runtime so no state field is added, and the world tier reads `getAllNodes()` / `getAllEdges()` so no `toJSON` is added; `src/engine/gameInit.ts` (105) — no reset call is needed because a runtime is created per playthrough; `src/engine/traceBuffer.ts` (358) is read through its existing exports only.

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar N/A with rationale
- [x] UI pillar present
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise. It is infrastructure for the delivery loop, not the play loop: it adds no player agency over mortals, surfaces no numerals on any player surface (Law 13 is honoured by keeping every count in the file), and the only two sentences it speaks are in the plain register. The one place it touches the play experience — the crash toast — is a toast, never an interrupt, so the scan → encounter → aftermath rhythm is untouched.
- [x] No Vision edit required.

## Rulebook impact

- [x] This plan does not change a rule of play.
- [x] No `Docs/canon/rulebook.md` edit is owed — no turn-structure, verb, prerequisite, resource, encounter, clock or win/loss rule is touched; the snapshot is a tool beside the game, not a rule in it.

> Brainstorm companion: `Docs/plans/2026-09-09-thr-1134-incident-snapshot-brainstorm.md` (written alongside).

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | ten named constants; ring sizes, depth, caps, the prompt gate |
| 2. Inspectability | PASS | the feature *is* inspectability: `incident_bundle` trace, the serialization manifest, `failedSections`, two `__DEBUG` accessors |
| 3. Determinism | PASS | no draw; the bundle carries the replay key (`seed`, `tick`, map) |
| 4. Fail-soft | PASS | ten rows; per-section isolation; O(1) guarded append; a toast never a modal |
| 5. Narrative over mechanical perfection | PASS | no narrative surface changed; the two sentences are plain and un-numbered |
| 6. Additive over destructive | PASS | two leaf modules, one hook, one helper, one `define`; the only edit to existing behaviour is passing a state the call always wanted |
| 7. Performance budget | PASS with note | one O(1) append per tick; tracing stays opt-in because the ring's O(n) eviction is measured, not guessed — the toggle names its cost to the player |

## Done when

- [ ] On `https://threadbearer.co` (the deployed build), a run past tick 100 on a large map is captured to a `.json` from the settings popover alone; the file's `run.build` is a real SHA; its measured size (incident tier) and the world-tier size are recorded on the ticket in bytes — numbers belong on the ticket, never on the surface
- [ ] `serializeIncidentBundle` on a state with a populated `visibilityMap` round-trips the entries, and the same test asserts naive `JSON.stringify` of that state yields `{}` for the field (the test fails against the trap, not a fixture)
- [ ] Forcing a throw inside one section (`vi.spyOn` on the census getter) yields a bundle with that section as `{ error }`, every other section intact, and `failedSections` naming it; forcing a throw in the recorder append leaves the 30-tick CLI smoke green
- [ ] The crash prompt toast fires once for a synthetic `appendCrashLog` burst inside `INCIDENT_PROMPT_COOLDOWN_TICKS` (jsdom), and clicking it opens settings
- [ ] A cold agent handed one real bundle names the subsystem behind a chosen wrong-looking state, or states exactly what the bundle lacks — record which on the ticket
- [ ] Prod-path proof: `npx vite build && npx vite preview`, Playwright `page.waitForEvent('download')` on the Save button, and a `window.__DEBUG === undefined` assertion in the same pass — this is the sanctioned substitution for requirement 3 of the browser-verify contract on the production bundle, recorded as `Browser-verify substitution: vite-preview download — the surface's point is working where __DEBUG does not exist`; the dev-path capture at 1920×1080 with `__DEBUG.buildIncidentBundle()` is taken separately
- [ ] Browser-verify per the UI pillar (screenshot of the ⚙ trigger, accessibility-tree read of the open TROUBLE section, console, the UI-Laws line citing 1, 13/14, 17, 21, 23, 26/27, 33, 37, 50)
- [ ] `EncounterCacheView.tsx` uses `downloadTextFile`; the two inline copies are gone
- [ ] Interface-map rows registered; `npm run generate-interface-map` green; the four `save/load` claims in the plan docs named above get a one-line dated correction each (docs-only, same PR or a `docs/` follow-up)
- [ ] `npm test`, `npm run check:typecheck`, `npx vite build` pass; 30-tick CLI smoke; `npm run test:heavy` locally (orchestrator touched)
- [ ] Closing commit body and PR body include `Fixes THR-1134`

## Kill criteria

- The incident-tier file exceeds what Christian's chat client will attach → `INCIDENT_EVENT_RING_SIZE` halves before anything else moves; the measured limit goes on the ticket.
- A cold agent given three real bundles cannot name the subsystem in any of them → the missing signal is named and added as a section; the tiering stays.
- Tick cost rises measurably with the recorder on (`Docs/ops/tick-cost-trend.tsv`, the hourly probe) → the metrics row moves to every `n`th tick; the event ring is never the suspect (it is one array write).
- Anyone proposes turning tracing on by default in prod → measure the saturated-tick eviction cost first; the toggle exists so that this stays a choice.

## Coordination block

**Suggested model:** opus — two leaf engine modules, a serializer with a self-check, a `vite` define, one UI section and a `vite preview` proof; nothing deep, several surfaces.
**Parallel-safe with:** [THR-1002](https://linear.app/threadbare/issue/THR-1002) (card grammar — `ActionCard`, `ActionDrawer`, `targetActions`, `playerReceipts`; disjoint), [THR-1287](https://linear.app/threadbare/issue/THR-1287) (control upkeep — `strategicActionLifecycle`, `undertaking-objects`; disjoint), [THR-1222](https://linear.app/threadbare/issue/THR-1222) (content).
**Mutex with:** any ticket editing `src/components/Game/SettingsPanel.tsx` or `src/components/Game/GameView/GameViewTopBar.tsx` (none in the queue at handoff); any ticket adding a `define` to `vite.config.ts`; any ticket editing `src/engine/orchestrator.ts` near the tick-end health check (`:3920-4000`) — none queued.
**Files to touch:** `src/engine/incidentRecorder.ts` (new), `src/engine/incidentBundle.ts` (new), `src/data/incident-snapshot-constants.ts` (new), `src/components/Game/hooks/useIncidentCapture.ts` (new), `src/components/shared/downloadTextFile.ts` (new; exported from `shared/index.ts`), `src/components/Game/SettingsPanel.tsx` (TROUBLE section), `src/components/Game/GameView/GameViewTopBar.tsx` (props through), `src/components/Game/GameView.tsx` (hoist the UI-state composer; wire the hook; crash toast), `src/components/Game/debug/EncounterCacheView.tsx` (adopt the helper), `src/engine/orchestrator.ts` (one guarded append at tick end), `src/engine/simulationRuntime.ts` (the `incidentRecorder` field, created with the runtime), `src/engine/tickHealthMonitor.ts` (export a crash-log subscriber or a `crashLogLength` read for the prompt — additive), `src/debug-bridge.ts` + `src/debug-bridge.d.ts` (two methods; pass state to `exportDiagnostics`), `vite.config.ts`, `src/vite-env.d.ts`, `src/types/trace.ts` (four sites), `scripts/interface-contracts.ts`, tests: `src/engine/__tests__/incidentBundle.test.ts`, `incidentRecorder.test.ts`, `src/components/Game/__tests__/SettingsPanel.trouble.test.tsx`, a Playwright spec for the `vite preview` download.

## Notes for the executor

- **Do not stringify the state.** `JSON.stringify(state)` returns 1.6 MB with no world in it and throws nothing. Build the sections by hand from the public getters and the replacer; the manifest self-check is not optional.
- **Do not add a field to `GameState` and do not add `toJSON` to `WorldGraph`.** Both are the two largest hubs in the repo. The recorder lives on `SimulationRuntime` — the load-bearing decision's own prescribed home for per-session engine state — not at module scope like `tickHealthMonitor`; a new runtime per playthrough is the reset, so no init hook is touched. `useSimulation` owns the runtime; the capture hook reads it from there, and the dev bridge needs a runtime provider beside its state provider if none exists.
- **Do not turn tracing on by default.** `traceBuffer.emitTrace` evicts with `shift()` and renumbers the whole buffer (`traceBuffer.ts:99-107`); a saturated tick pays that per entry. The toggle is the design.
- **The tiles are omitted on purpose** — `run` carries `seed`, map preset and the flags; `generateWorld` is deterministic from them. If a reader ever needs a tile, they regenerate.
- **`getActiveUIState` is hoisted, not duplicated.** GameView has ~20 sibling sites guarded by `if (!import.meta.env.DEV || !window.__DEBUG) return;` — this one composer moves out of that guard with a comment saying why; the bridge registration stays where it is.
- **Two sentences, both plain, no numerals.** *Snapshot saved. Attach the file to your message.* and *Something went wrong under the hood. You can save a snapshot from Settings.* If a size warning is needed it is a phrase (*this one may be too big to attach*), never a figure.
- **The `vite preview` proof is the real one.** The dev capture proves the button; only the preview proves the bundle survives the production build. Both go on the ticket.
- **Wiki:** no manifest page's `sources` match any file here (measured); no page is added — a manual page for a diagnostic tool is the wrong surface. Record `Wiki-freshness-exempt: no wiki page owns diagnostics` in the closing commit if the gate asks.

## Intent-judge verdict

**Run 1 (fable, cold, 2026-09-09): Allow** — impact class Reversible confirmed ("at the upper edge of the class"); nine dimensions PASS, two GAPs, zero VIOLATIONs. GAP 8 (load-bearing: the recorder was module-scope-plus-reset while `SimulationRuntime` is the decision's prescribed home) and GAP 9 (`gameInit.ts` at 105 importers touched with no Blast Radius row) — both resolved in this revision by moving the recorder onto `runtime.incidentRecorder`, which removes the `gameInit.ts` touch entirely and adds the `simulationRuntime.ts` (184) row. The judge's note that the opt-in world tier sits beside the ticket's *"never a full graph dump"* sentence is carried to the handoff as invited-veto material: the default bundle honours the sentence; the checkbox is the executor's and Christian's to keep or drop.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-09-09 (sonnet, three auditors spawned in one message, on the post-judge revision).*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | 10 named constants in new `src/data/incident-snapshot-constants.ts` (ring sizes, neighbourhood depth/cap, timeline tail, prompt gate/cooldown, filename prefix, warn threshold) |
| 2. Inspectability | PASS | Wiring section matches the checklist's required table shape; new `incident_bundle` trace registered at all four `trace.ts` sites; two `__DEBUG` accessors; serialization manifest self-checks Map/Set rewrite counts and tags `serialization.incomplete` on mismatch rather than shipping silently |
| 3. Determinism | PASS | Explicit "PRNG callouts: None"; no draw anywhere; bundle carries `seed`+`tick`+map as a complete regeneration key instead of dumping regenerable `tiles` |
| 4. Fail-soft | PASS | 10-row fail-soft table; per-section `try/catch` isolation (`{error: message}` shape, precedented by `tickHealthMonitor.ts:218-234`); guarded O(1) recorder append so a throwing census can't touch the tick; crash prompt is a toast, "never a modal" |
| 5. Narrative over mechanical | N/A | Diagnostic/dev tooling — no game mechanic or story exists to diverge; the plan still keeps the two UI sentences plain and un-numbered |
| 6. Additive over destructive | PASS | Two new leaf modules, one hook, one shared helper, one `define`; explicitly no new `GameState` field and no `toJSON` on `WorldGraph`; the one edit to existing behaviour (`debug-bridge.ts:1711`) passes an argument the call already wanted |
| 7. Performance budget | PASS-with-note | O(1) guarded append per tick; tracing stays opt-in, justified by a *cited* existing cost (`traceBuffer.ts:99-107` `shift()`+renumber) rather than fresh profiling of this feature; the tick-cost kill criterion is post-hoc (`Docs/ops/tick-cost-trend.tsv`) rather than pre-ship measurement — acceptable for a one-line O(1) addition |

**NFP AUDIT: PASS-with-notes** (row 7).

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | present-and-substantive | Systems design (two new leaf modules, ownership on `SimulationRuntime` justified against the load-bearing decision), Graph nodes/edges (none, justified), Tick phases (one guarded O(1) append at the existing tick-end site), Resolution logic (N/A, justified), PRNG callouts (none, justified) |
| Content | N/A-with-rationale | matches the template's N/A pattern exactly |
| UI | present-and-substantive | all four subsections filled; screenshot-tool line stated (Playwright, DOM only) |

No missing required sections. Wiring table uses the checklist's exact schema and covers every new/edited module. Substrate check: PASS — `tick`, `trace`, `encounter` and `simulation` rows confirmed in the inventory; the two new modules have zero hits (no green-field duplication). **PILLAR AUDIT: PASS.**

### Vision audit

`01-core-loop.md` → attention is the player's to spend — confirmed (the crash prompt is a toast, barred from blocking veil/beat/receipt). `02-non-negotiables.md` → #3 prose never numbers — confirmed (Laws 13/14; counts stay in the file); #6 additive — confirmed. `taste-profile.md` → *Numbers in UI* anti-pattern avoided; austere voice; one gold per panel (Law 21) — confirmed. `00-north-star.md`, `03-design-tensions.md` → not referenced; no tension leaned on. No contradictions. North star untouched; core loop preserved; god/protagonist separation untouched; taste profile respected. **VISION AUDIT: PASS.**
