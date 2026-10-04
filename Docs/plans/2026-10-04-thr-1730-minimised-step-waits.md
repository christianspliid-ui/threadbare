> **title:** A minimised moment waits for its god — THR-1730
> **linear_issue:** THR-1730
> **author:** Claude Code (design lane, run 2026-10-04d — decided under delegation, process.md rule 4)
> **created:** 2026-10-04
> **three_pillars:** Engine done · Content done (one tooltip entry + rulebook sentence) · UI done

# A minimised moment waits for its god — THR-1730

*Escape and "Show on map" set an encounter down. They must not hand it to fate behind the player's back.*

## Why this is load-bearing

Christian's 2026-10-04 layout pass ([THR-1724](https://linear.app/threadbare/issue/THR-1724)) replaced "Look away" with **minimise**. Escape and "Show on map" now close the encounter veil without deciding it. The encounter stays on its badge, and the badge reopens it. His approved text names one way out:

> "Let fate decide" with an empty hand … is **the one deliberate way** to let an encounter play out without spending. (THR-1724 description, change 11, approved in chat 2026-10-04)

The engine does not keep that promise. A pause-tier step waits only because the auto-pause holds the clock. Minimise restores the clock, and if it was running, the step resolves at its scheduled tick on the mortal's terms. That is the same as an empty-hand commit the player never made. So a second, accidental way to let fate decide exists. It is reached by pressing Escape to look at the map and then pressing Play.

It also breaks the promise The First was just given ([THR-1715](https://linear.app/threadbare/issue/THR-1715), shipped in PR #2224): *"her story chapters stop the world"*, measured as **0 auto-resolving story steps** in 150 turns. A minimised chapter step is an auto-resolving story step.

## Measured, not assumed

**Live build, 2026-10-04 ~18:30Z** ([Unsafe Bridge spawn](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge), main `288083e6`, built-in browser). Production has no `window.__DEBUG`, so the repro used the real controls:

1. The veil opened on step 1 ("Let fate decide" present).
2. Escape. Result: veil closed, badge `"The Unsafe Bridge, step 1 — open encounter"`.
3. Clicked "Play simulation" and waited 12 s. Result: badge `"The Unsafe Bridge concluded — open aftermath"`. The step resolved and the encounter ended with no player input.

**Source, worktree at `origin/main` 288083e6:**

| Claim | Evidence |
|---|---|
| Minimise lives only in a UI ref; nothing in `GameState` records it | `GameView.tsx:3283` `minimisedEncounterNotificationIds = useRef<Set<string>>`; `handleEncounterMinimize` (`GameView.tsx:3360-3376`) writes only `viewed: false` on the notification |
| The engine advances every unresolved action every tick, with no hold | `progressUnifiedAction` (`unifiedActionLifecycle.ts:129-135`): `if (action.resolved) return action; return { ...action, stepProgress: action.stepProgress + 1 }`; its one caller is `progressAllActions` (`unifiedActionResolution.ts:236-240`), Phase 1 of `phaseUnifiedActionProgress` (`:3717`, orchestrator phase `2a`, `orchestrator.ts:2997`) |
| A step completes when progress reaches duration | `isStepComplete` (`unifiedActionLifecycle.ts:140-142`), filtered by `collectCompletions` (`unifiedActionResolution.ts:248-251`) |
| A commit does not change step timing; it records the hand and closes the veil | `handleCommitNudges` (`GameView.tsx:3870-3988`) sets `activeNudges` and `choiceHistory`, then `setTieredEncounterState(null)`. The comment there: *"The hand is committed; the step now resolves on mortal terms."* |
| A badge for a step the world already resolved is retired by a UI effect | `GameView.tsx:4067-4099`. Its comment: *"the engine does not hold steps; THR-1730"* |
| Pause-mode notifications carry no auto-resolve tick | `EncounterNotification.autoResolveTick: number \| null` — *"null for pause mode"* (`types/encounterVisibility.ts:96-97`) |
| Attention mode is read from the thread edge | `resolveAttentionMode(props: ThreadEdgeProperties)` (`attentionCadence.ts:58`) |

## The decision

**A minimised pause-tier step waits for the player, however long the world runs.** The mortal stays in that moment. Everyone else's time goes on. It ends in exactly one of five ways:

1. the player reopens it from the badge and commits a hand (cards or empty — "Let fate decide");
2. the player dismisses it through a surface that still calls the disregard path (`onDisregard`: the button at `EncounterVeil.tsx:1873` and the `onLeave` at `:787`);
3. the player switches the thread to **Lives on** (her life goes on without you, which is what that toggle means);
4. the action ends some other way the engine already handles (the mortal dies, the action is removed);
5. the step changes (a stale hold is inert).

Ways 3–5 are released by the engine, not the UI, so a hold can never strand an action.

**Decided by delegation (process.md rule 4).** The evidence decides it. Christian's approved text makes the empty-hand commit *the one* deliberate way to let an encounter play out. The THR-1715 promise is "her story chapters stop the world". Law 39 makes the badge "the recovery route". A badge that recovers an encounter which has already ended recovers nothing.

**Options weighed (full set in the brainstorm companion):**

- **B — let it play out** (the status quo). Rejected: it is a second, accidental "let fate decide", which Christian's text rules out.
- **Hold every pending pause-mode notification**, whether minimised or not. Rejected: it would freeze headless runs and the census readers, where no player ever answers. Only an explicit player action sets a hold.
- **A hold with a time cap** (play out after N ticks). Rejected: that is B on a delay. The THR-1715 plan already rejected a wall-clock halt cap.
- **Reopen the veil after N ticks.** Rejected: a nag loop. Law 39 already gives every *new* beat its own interrupt.

**Would change the call:** Christian saying that minimise should mean "I'll come back if I can". Or round-3 cold testers who forget a held moment and later wonder why The First stood still. The second would be a UI signal problem (louder badge), not a reason to drop the hold.

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| **Encounters & Dilemmas** — unified-action pipeline (phase `2a`) | 🟢 ACTIVE | **extends**: Phase 1 progress skips a held action; a pure liveness check releases stale holds |
| **Attention, Chronicle & Narrative** — attention mode / cadence (`attentionCadence.ts`, THR-1715) | 🟢 ACTIVE | **reads** `resolveAttentionMode` for hold liveness; no write |
| Encounter veil + interrupt registry (`GameView.tsx`, `useInterruptAutoPause`, THR-1608/1724) | 🟢 ACTIVE | **extends**: minimise writes the hold; commit/dismiss clear it. The auto-pause itself is unchanged |
| Encounter badge model (`encounterBadgeModel.ts`) | 🟢 ACTIVE | **extends**: a held step's badge says it is waiting |

No new node type, no new edge, and no graph write. The hold is one optional field on `UnifiedAction`, which already lives in `GameState.unifiedActions`, beside `disregardRemaining` and `activeNudges`.

## Engine pillar

### Systems design

**E1 — the field.** On `UnifiedAction` (`src/types/unifiedAction.ts`), additive and optional:

```ts
/**
 * THR-1730 — the player set this step down (minimise) at pause-tier attention.
 * While live, Phase 1 does not advance `stepProgress`: the step waits for its god.
 * Absent ⇒ today's behaviour, byte for byte.
 */
readonly playerHold?: { readonly stepIndex: number; readonly sinceTick: number };
```

**E2 — the pure helpers**, in a new small module `src/engine/playerStepHold.ts`. They are pure, with no React and no graph mutation:

- `setPlayerHold(action, tick): UnifiedAction` sets `{ stepIndex: action.currentStep, sinceTick: tick }`. It is idempotent: an existing hold on the same step keeps its `sinceTick`.
- `releasePlayerHold(action): UnifiedAction` drops the field. If the field is absent, it returns the same object.
- `playerHoldReleaseReason(action, graph, tick): PlayerHoldReleaseReason | null` returns `null` while the hold is live, else the reason it is not. `isPlayerHoldLive(action, graph, tick)` is `playerHoldReleaseReason(...) === null && action.playerHold !== undefined`. Live means all of these hold:
  - the action has a `playerHold`;
  - `!action.resolved`;
  - `playerHold.stepIndex === action.currentStep`;
  - the actor's thread edge resolves to `'pause'` via `resolveAttentionMode`. Use the same thread lookup `encounterVisibility.ts` uses for the actor;
  - `tick - playerHold.sinceTick < PLAYER_HOLD_MAX_TICKS` (always true at the default `Infinity`; this is the constant's one read site, reason `max_ticks`);
  - `PLAYER_HOLD_ENABLED` is true (else reason `disabled`).

  If no thread edge is found, it returns false (fail-soft, so a hold never outlives its thread).

**E3 — Phase 1 honours live holds.** In `phaseUnifiedActionProgress` (`unifiedActionResolution.ts:3717`), before `progressAllActions`:

- A held action whose hold is live is passed through **un-progressed**. Because it never reaches `stepProgress >= stepDuration` through progress, `collectCompletions` never picks it up.
- A held action whose hold is **not** live has its hold released (E2) and is progressed normally that same tick. Emit `encounter.player_hold_released` with the reason from `playerHoldReleaseReason` (`step_changed` | `thread_not_pause` | `resolved` | `max_ticks` | `disabled`).

`progressUnifiedAction` itself stays unchanged. The skip lives at the phase, where `state.graph` is in hand, so the lifecycle module stays graph-free.

**E4 — `advanceStep` drops the hold.** `advanceStep` (`unifiedActionLifecycle.ts:194`) and the action-complete path return an action without `playerHold`. A hold is per step and never carries into the next one. E3's liveness check is the second line of defence.

### Graph nodes / edges

None. The thread edge is read only.

### Tick phases

Phase `2a` (unified action progress) only. A step held at the moment its progress would complete is the same as one held earlier: it does not complete. No new phase.

### Resolution logic

Unchanged. When the hold releases on commit, the step finishes its remaining ticks (`stepDuration - stepProgress`) and resolves through the existing path with the committed hand. The progress counter is frozen, not reset, so a step that was one tick from done is still one tick from done.

### PRNG callouts

None. A held action draws nothing, because it does not reach resolution. The step that resolves after release draws from the same `uaRng` stream it would have used. Its tick changes, so a seeded run in which the player minimises diverges from one in which they do not. Player input is part of "same seed + same inputs" (NFP 3).

## Content pillar

- **C1 — tooltip entry.** Register `ui.encounter_waiting` in `ui-content.ts`, the `ui.*` namespace that `resolveTooltip` reads (`tooltipResolver.ts:9`, Law 17): *"This moment waits for you. Open it to play your hand, or let fate decide."*
- **C2 — rulebook sentence** (`Docs/canon/rulebook.md` §3 clock paragraph and the quick-reference clock line, both `[IMPL — THR-1730]`): *"Set a moment down (Escape, or Show on map) and it waits on its badge. The world runs on, but that mortal stands in the moment until you return, let fate decide, or let them live on."* Add a dated change-log line at the foot of the rulebook.

No encounter template, prose table or data table changes. The hold is template-agnostic.

## UI pillar

*Screenshot tool: Playwright (DOM surfaces: the veil, the badge, the time control). No WebGL surface is touched.*

### Player-facing display

- **U1 — minimise writes the hold.** `handleEncounterMinimize` (`GameView.tsx:3360`), inside the existing `setGameState`, applies `setPlayerHold` to the matching action. Use the same match `handleEncounterDisregard` uses (`activeActionId`, else actor + template + unresolved). Only do this when **all** of these hold:
  - the notification is `sourceSystem: 'unified_action'`;
  - its `kind` is `'encounter'`;
  - `autoResolveTick === null` (pause mode).

  Auto-mode and legacy notifications keep today's behaviour (see Notes for the executor).
- **U2 — commits and dismiss clear it.** `handleCommitNudges` (`GameView.tsx:3870`), `handleEncounterCommitAndContinue` (`:3990`) and `handleEncounterDisregard` (`:3296`) apply `releasePlayerHold` to the action they already map over.
- **U3 — the badge says it waits.** When a badge's primary notification maps to an action with a live hold, `encounterBadgeModel.ts` (`:150-174`) changes two things:
  - `ariaLabel` becomes `"<encounter>, <meta> — waiting for you"` instead of `"— open encounter"`;
  - the badge gets `tooltipId: 'ui.encounter_waiting'`.

  Glyph and accent are unchanged. No new chrome and no count change, within the Law 53 budget. The badge model is pure today; pass a `heldActionIds: ReadonlySet<string>` argument computed by the caller rather than reading `GameState` inside it.
- **U4 — retire nothing that still works.** The "spent minimised step" effect (`GameView.tsx:4067-4099`) stays. It still covers legacy and auto-mode notifications, and a held step it finds "not openable" means a real bug. Update only its comment: holds now exist, so "the engine does not hold steps" is no longer true.

### UI Laws engaged

- **Law 39:** pause-tier beats interrupt; the badge is the recovery route. The hold makes the recovery real.
- **Law 40:** the badge never destroys what it counts; the held encounter is still there to open.
- **Law 52:** the time control is unchanged. A held step is not an auto-pause, so the clock reads its normal state.
- **Law 17:** the new phrase is a registered tooltip.
- **Law 13:** no number appears; "waiting" is a word.
- **Law 1 / 21:** the badge keeps its existing presentation and routing; no new concept is named.
- **Law 37:** the reopened veil wears the same chrome at the same step.
- **Law 33:** nothing is added that renders off-screen.

### Event notifications

None new. A held step raises no toast; the standing badge is the signal.

### Debug inspection (DebugPanel)

**D1 — `window.__DEBUG.getPlayerHolds()`.** It returns `{ actionId, actorId, templateId, stepIndex, sinceTick, heldTicks, live }[]` (async, per the bridge convention). Declare it in `src/debug-bridge.d.ts`.

### Visual presence (HexMapV2)

N/A: no map signifier. The agent's existing badge/pulse is enough, and a map overlay would spend the HUD budget (Law 53) on a rare state.

## Wiring

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `playerStepHold.ts` (new) | `2a` (read by `phaseUnifiedActionProgress`) | — | `unifiedActions[].playerHold` | `encounter.player_hold_released` | `getPlayerHolds()` |
| `GameView.tsx` minimise / commit / dismiss | — (player input) | EncounterVeil via GameView | `unifiedActions[].playerHold` | `encounter.player_hold_set`, `encounter.player_hold_released` (reason `commit` / `dismiss`) | `getPlayerHolds()` |
| `encounterBadgeModel.ts` | — | thread badge | reads held ids | — | badge `ariaLabel` |

Wiring action items:

- **W1:** `Docs/plans/wiring-checklist.md` row for `playerStepHold.ts`.
- **W2:** `Docs/canon/interface-map.md` + `scripts/interface-contracts.ts` — one **add** row (see Interface impact).
- **W3:** The rulebook and quick-reference sentence (C2).
- **W4:** The Design Reference Wiki page whose `sources` match `unifiedActionResolution.ts`, if any (the blocking wiki-freshness gate decides).

## Interface impact

Encounters & Dilemmas (core) is ⚪ UNAUDITED, so this plan writes its first row for the seam it adds (audit-on-touch, protocol §4).

| Contract | Change | Writer | Production read site |
|---|---|---|---|
| `minimised-step-hold` — the player's set-down holds a pause-tier step | **add** | `GameView.tsx` `handleEncounterMinimize` (UI → `GameState.unifiedActions`) | `phaseUnifiedActionProgress` Phase 1 via `isPlayerHoldLive` (`unifiedActionResolution.ts`) |
| `encounter-badge-label` — badge reads action state | **extend** | — | `encounterBadgeModel.ts` |
| Auto-pause / interrupt registry (THR-1608) | **preserve** | — | unchanged |

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `PLAYER_HOLD_ENABLED` | `true` | Kill switch in `playerStepHold.ts`. `false` makes every hold release (reason `disabled`), which restores today's play-out behaviour in one edit. |
| `PLAYER_HOLD_MAX_TICKS` | `Infinity` | No cap, by decision (§ The decision). A finite value would release a hold after that many ticks: the "play out on a delay" option, kept tunable rather than coded. |

## Tracing

```ts
// encounter.player_hold_set — the player minimised a pause-tier step.
interface PlayerHoldSetTrace {
  type: 'encounter.player_hold_set';
  tick: number;
  actionId: string;
  actorId: string;
  templateId: string;
  stepIndex: number;
  summary: string; // "<actor>'s <encounter> step N waits for the player"
}

// encounter.player_hold_released — a hold ended, and why.
interface PlayerHoldReleasedTrace {
  type: 'encounter.player_hold_released';
  tick: number;
  actionId: string;
  actorId: string;
  stepIndex: number;
  heldTicks: number; // tick - sinceTick
  reason: 'commit' | 'dismiss' | 'step_changed' | 'thread_not_pause' | 'resolved' | 'max_ticks' | 'disabled';
  summary: string;
}
```

Both are low volume (one per player action or one per release), so the all-agents aggregate-batching rule does not apply. A held tick emits nothing; `getPlayerHolds()` answers "what is waiting".

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| Actor's thread edge missing or unreadable | `isPlayerHoldLive` → false; the hold is released with `thread_not_pause` and the step progresses as today |
| `playerHold.stepIndex` ≠ `currentStep` (stale) | Released with `step_changed`; normal progress |
| Minimise cannot find the matching action | No hold is written; today's behaviour (plays out), and the existing spent-badge effect retires the badge |
| Hold on an action another system ends (death, removal) | The action leaves `unifiedActions` or is `resolved`; the hold dies with it (`resolved` release when observed) |
| Old save without the field | Field absent ⇒ unchanged behaviour |
| Headless CLI / census runs | Nothing sets a hold (only the UI minimise does), so runs are byte-identical |
| `PLAYER_HOLD_ENABLED = false` | Every hold reads as not live and releases; today's behaviour |

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/unifiedAction.ts` | ~610 files import from it (`grep -rln "types/unifiedAction'"` over `src` + `scripts`) | One optional readonly field. Additive; no consumer must change. Object spreads (`{ ...action }`) carry it, which is why E4 strips it explicitly in `advanceStep`. |
| `src/engine/unifiedActionLifecycle.ts` | 61 | `advanceStep` returns one field fewer on a held action. Below the 100 line; noted for the E4 edit. |

## Three-pillar check

- [x] Engine pillar present: E1–E4
- [x] Content pillar present: C1 tooltip, C2 rulebook sentence
- [x] UI pillar present: U1–U4, D1
- [x] Wiring section connects them: W1–W4, Interface impact

## Vision audit

- [x] This plan does not contradict any Vision premise. It enforces the agreed one: the world "stops for every moment that matters", and the god acts only by choice (the whisper), never by default.
- [x] No Vision edit needed.
- Premises cited: `TheFantasyWorldSimulator/Vision/00-north-star.md` (the player hesitates, then chooses), `TheFantasyWorldSimulator/Vision/01-core-loop.md` (scan → encounter → aftermath; the player is the metronome), `TheFantasyWorldSimulator/Vision/02-non-negotiables.md` #1 (the player is a god: fate decides only when the god lets it) and #3 (no numbers), `TheFantasyWorldSimulator/Vision/taste-profile.md` ("turn-based, not auto-advancing"). Tension to watch: a forgotten hold keeps one mortal's story standing (`TheFantasyWorldSimulator/Vision/03-design-tensions.md`); the kill criteria cover it.

> Brainstorm companion: `Docs/plans/2026-10-04-thr-1730-minimised-step-waits-brainstorm.md`

## Rulebook impact

- [ ] This plan does not change a rule of play — **it does**: the clock. A set-down moment now waits.
- [x] If it does, `Docs/canon/rulebook.md` is updated in the same PR. That is the **build** PR (C2): the §3 clock paragraph and the quick-reference clock line carry `[IMPL — THR-1730]` tags, which may only land with the code.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | `PLAYER_HOLD_ENABLED`, `PLAYER_HOLD_MAX_TICKS` named; the no-cap decision is a number, not a code path |
| 2. Inspectability | PASS | Two trace types with reasons; `getPlayerHolds()` shows every live hold and its age |
| 3. Determinism | PASS with note | No PRNG. A held step resolves later on the same stream; player input is part of "same inputs" |
| 4. Fail-soft | PASS | Every hold has an engine-side release; missing data releases, never throws (table above) |
| 5. Narrative over mechanical perfection | PASS | "She waits on her god" is the story; the held mortal's stillness is visible and chosen |
| 6. Additive over destructive | PASS | One optional field, one new module; no field removed; the spent-badge effect stays |
| 7. Performance budget | PASS | Liveness is checked only for actions carrying a hold (expected 0–2 at a time); one thread lookup each |

## Done when

- [ ] On a local build, [Unsafe Bridge spawn](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge) route: open the veil, press Escape, then `await window.__DEBUG.tick(10)`. `await window.__DEBUG.getPlayerHolds()` lists the action with `live: true`, and the badge `aria-label` ends `"— waiting for you"`. Reopen the badge, commit an empty hand, then `tick(10)`: the badge reads `"… concluded — open aftermath"` and `getPlayerHolds()` is empty.
- [ ] Unit tests (`playerStepHold.test.ts` + a phase test):
  - a live hold freezes `stepProgress`;
  - commit releases the hold and the step resolves after its remaining ticks;
  - a `step_changed` hold, a `thread_not_pause` hold and a missing thread each release and progress the same tick;
  - an action with no hold is byte-identical to today.
- [ ] Toggling The First's thread to *Lives on* while held releases the hold on the next tick (trace reason `thread_not_pause`).
- [ ] An auto-mode notification minimised then ticked still plays out (no hold written).
- [ ] 30-tick CLI smoke and `npm run test:heavy` unchanged (no hold is set headlessly). The THR-1715 census reader (`first-chapters.ts`) is unchanged at 0 auto-resolving story steps.
- [ ] Four-part browser evidence: 1920×1080 screenshot of the waiting badge, console output, the `getPlayerHolds()` assertion, and a UI-Laws line (39, 40, 52, 17, 13, 1/21, 37, 33).
- [ ] `npm run gate` green; closing commit body carries the line-anchored closer.

## Coordination block

**Suggested model:** opus. It is a small diff, but it touches the unified-action Phase 1 every encounter passes through and three GameView handlers, and the release paths need judgement.

**Parallel-safe with:** THR-1716 (arrival first beat): `SimulationControls.tsx` / `GameViewTopBar.tsx` / the opening flow, no overlap with the minimise/commit handlers or Phase 1. THR-1687 (fair draw): the candidate filter pipeline, a different engine module.

**Mutex with:** THR-1714 (show the roll). Both edit `handleCommitNudges` in `GameView.tsx` and the empty-hand commit path; whichever lands second rebases. THR-1732 (five-card hand bar): it moves the commit block in `NudgePhaseShell.tsx` / `EncounterVeil.tsx`, while this edits the GameView commit *handler*. Low collision, but the empty-hand path is shared, so serialise.

**Files to touch:**
- Create: `src/engine/playerStepHold.ts`, `src/engine/__tests__/playerStepHold.test.ts`
- Edit:
  - `src/types/unifiedAction.ts` (E1 field)
  - `src/types/trace.ts` (register `encounter.player_hold_set` / `encounter.player_hold_released` in `TraceCategory` + `TRACE_CATEGORIES` + `TraceEntry`, as the wiring-checklist precedents do)
  - `src/engine/unifiedActionResolution.ts` (E3 Phase 1 skip/release)
  - `src/engine/unifiedActionLifecycle.ts` (E4 strip in `advanceStep`)
  - `src/components/Game/GameView.tsx` (U1, U2, U4 comment)
  - `src/components/Game/encounterBadgeModel.ts` (U3)
  - `ui-content.ts` (C1 tooltip)
  - `src/debug-bridge.ts` + `src/debug-bridge.d.ts` (D1)
  - `Docs/canon/rulebook.md` + `Docs/canon/rulebook-quick-reference.md` (C2)
  - `Docs/plans/wiring-checklist.md`, `Docs/canon/interface-map.md`, `scripts/interface-contracts.ts` (W1–W2)

## Notes for the executor

- **Legacy `encounterProgress` notifications are out of scope.** `sourceSystem: 'legacy_encounter'` is still emitted (`encounterVisibility.ts:594`), but its step clock is a different structure. Leave legacy minimise as today and say so in the PR. If you find a pause-mode legacy encounter on The First's path in the census, file it; do not widen this PR.
- **Do not change the auto-pause.** Minimise still restores the clock to its prior state (THR-1608 resume-to-prior). The hold is about the *step*, not the clock.
- **Do not hold on open.** The veil being open already pauses the clock; the hold is written only on minimise.
- **Contestation:** a held action is not "completing", so an action contesting it that completes meanwhile resolves uncontested, as it would against any action mid-step. Note it in the PR; do not special-case it.
- **Grey zone (your call):** whether the reopened veil should say anything about time having passed. The default is no: the scene is the same scene, and Law 37 holds.

## Intent-judge verdict

**Allow** (fable, cold spawn, 2026-10-04 ~18:50Z). Impact class confirmed Reversible. All substrate anchors verified against the worktree. Two advisory GAPs were folded in before commit:
- `src/types/trace.ts` is now in Files to touch, for the two trace categories;
- `PLAYER_HOLD_MAX_TICKS` now has its one read site in `playerHoldReleaseReason` (reason `max_ticks`).

A note carried, not this plan's debt: "attention mode" / "Asks you" / "Lives on" have no UL entries (inherited from THR-1715).

## Forked-audit verdicts

### NFP audit

PASS-with-notes:
- **Tunability:** `max_ticks` appeared in the trace union with no release site. Fixed: the read site is now in E2.
- **Determinism:** a hold shifts the resolution tick, so seeded runs diverge on player input, by design.
- **Other rows:** Inspectability, Fail-soft, Narrative, Additive and Performance PASS.

### Three-pillar audit

PASS:
- **Pillars:** Engine (E1–E4), Content (C1 tooltip, C2 rulebook sentence) and UI (U1–U4, D1) are all present and substantive. HexMapV2 is N/A with its rationale.
- **Wiring and substrate:** the wiring table maps each module to its phase, field, trace and debug surface. The substrate inventory matches `systems-inventory.md` and introduces no duplicate.
- **One gap, fixed:** the brainstorm-companion pointer is now linked in the template form.

### Vision audit

PASS-with-notes:
- **Premises extended:** north star ("the player hesitates, then chooses"), core loop (the player is the metronome; the badge is the recovery route) and taste profile ("turn-based, not auto-advancing").
- **Premises confirmed:** non-negotiables #1 and #3.
- **Contradictions:** none.
- **Citation gap, fixed:** the plan cited no Vision file by path; it now does under § Vision audit.
- **Tension to watch:** a forgotten hold keeps one story standing. It is covered by the kill criteria.
