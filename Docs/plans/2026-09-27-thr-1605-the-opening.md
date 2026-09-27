> **title:** The opening — meet The First at once, a clock that waits for you, and a quiet first screen — THR-1605, THR-1608, THR-1609
> **linear_issue:** THR-1605 (also THR-1608, THR-1609)
> **author:** Claude Code (attended design session, 2026-09-27)
> **created:** 2026-09-27
> **three_pillars:** Engine `done` · Content `done — one opening line rewritten, the meeting keeps its 107 settlement lines by moving the meeting to a settlement` · UI `done — interrupt queue, first-screen reveal, avatar marker, camera; Playwright DOM + Claude-in-Chrome WebGL`

# The opening — THR-1605, THR-1608, THR-1609

*Round-1 cold testers loved the remembrance, then got a spreadsheet: no mortal met, five popups before they could act, a world that ended ten minutes in. After this plan the first ten minutes are: Ascend → Reach Down → meet The First → the world starts, quietly, and waits for you whenever something matters.*

## Why this is load-bearing

The cold playtest loop ([THR-1610](https://linear.app/threadbare/issue/THR-1610)) ran three no-knowledge testers against the deployed build on 2026-09-25. **0 of 3 met a mortal.** All three named the opening as their best moment, and the drop came straight after it. The loop only runs round 2 once every round-1 finding is closed and deployed, so these three tickets gate the next round of evidence.

Four findings, one cause each (all verified in code, 2026-09-27):

| Finding | Cause |
|---|---|
| Nobody meets The First | The meeting auto-triggers only when the avatar stands in a settlement (`GameView.tsx` ~3999-4008 against `MEETING_SETTLED_LOCATION_SUBTYPES`). The avatar starts at the Sacred Grove (`loc.start`, subtype `shrine`, `gameInit.ts` ~244-283) and nothing points the way. |
| Five popups before acting | Spine beats trigger on `minTurn` = `[0, 2, 4, 6, 8]` ticks (`ascendant-beat-content.ts` ~40). A tick is one real second at speed 1 (`useSimulation.ts` ~156-167), and resolving a beat auto-resumes time, so each next beat is already due. |
| The world ends in Summer Year 1 | `DEFAULT_DOOM_TICKS = 200` (`game-config.ts` ~32), which is 200 unpaused seconds at speed 1. There is no floor. Cycle 2 then ended at once because a new cycle keeps the expired clock (a plain bug, filed as [THR-1642](https://linear.app/threadbare/issue/THR-1642)). |
| "Turn-based" is real-time | The game is real-time with pause. Resolving any popup restarts time, even over a manual pause (`useInterruptAutoPause.ts` ~45-59, `forceResumeAfterInterruptsRef` `GameView.tsx` ~3079-3095, `ChoiceSetModal` `setRunning(true)` ~4839/4853). |

**Settled input — Christian's rulings in chat, 2026-09-27** (recorded as comments on [THR-1605](https://linear.app/threadbare/issue/THR-1605) and [THR-1608](https://linear.app/threadbare/issue/THR-1608)):

1. **The First is the player's first threaded agent, and threading is character creation.** The meeting is the first instance of a ceremony that should eventually play every time the player threads someone. The city lock exists only because the meeting prose is written as a city scene, so it is not a rule to preserve.
2. **The clock is the Stellaris model:** real time, with generous auto-pause on important things. Not turn-based.
3. **Doom must not end a world before one threaded agent has had room for a full character journey.** Use a simple, tunable floor for now; tune it into a proper win condition later.

**Decided in this plan by the design session under delegation** (process.md rule 4; each is marked *Session decision* where it appears, and each can be vetoed in chat): the meeting moves to the settlement nearest the avatar (§ S1); the doom clock starts at the bond, not at world start (§ S2); after an interrupt, time returns to the state it was in, not always to running (§ S3); a new spine gift waits for one player act (§ S4); the avatar keeps its past-life name, framed as the player's own (§ S6).

## Substrate inventory

Step 0.6 greps: `Docs/canon/systems-inventory.md` for *doom, journey, beat, spine, director, meeting, pause, interrupt, fog, visibility, camera, reveal, onboarding*, and `src/engine/` for the same. **Nothing here is green-field.** "Onboarding" has 0 engine hits; its job is done by the systems below.

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| **Doom Clock & Journey** (`doomClock.ts`, `phaseDoom.ts`, `phaseDoomExpiry`, `journeyEngine.ts`) | 🟢 ACTIVE | **extends** — the clock wakes at the bond and gets a floor before the Unmaking; the length constant is retuned. The journey still reads `doomClock.progress`, which now starts at the bond. |
| **Ascendant Beats & Progression** (`phaseAscendantBeatDirector`, `ascendant-beat-content.ts`) | 🟢 ACTIVE | **extends** — spine offers gain two gates (First bonded, one player act since the last gift). Pool and deepening beats are unchanged. |
| `meeting` (`meetingEncounter.ts`, `MeetTheFirstFlow.tsx`) | 🟢 ACTIVE | **extends** — a pure `pickMeetingLocation`; the trigger condition changes; the flow is unchanged. |
| Interrupt auto-pause (THR-668: `otherInterruptOpen` in `GameView.tsx` ~4221-4231, `useInterruptAutoPause.ts`) plus the second pause path in `useNotifications.ts` ~130-166 | 🟢 ACTIVE | **replaces the OR-expression with a declared list** and folds `useNotifications`' pause into it. One registry, one resume policy. |
| Rival actions (`phaseRivalActions`, `orchestrator.ts` ~2402) | 🟢 ACTIVE | **extends** — a grace window after the bond; the inline `8 + floor(rng*5)` becomes named constants with the same PRNG draw. |
| Omens (`phaseOmenAgenda.ts`, `OMEN_FIRST_ACTIVATION_TICK`) | 🟢 ACTIVE | **extends** — first activation counts from the bond. |
| Visibility (`types/visibility.ts` sight ranges), `D3ZoomCamera` `CAMERA_CONSTANTS` | 🟢 ACTIVE | **tunes** constants; no new mechanism. |
| Chapter Ledger (`chapterArchive.ts`, `ChapterLedger.tsx`) | 🟢 ACTIVE | **extends** — joins the interrupt registry; the badge counts unread, not total. |

Population counts this plan consumes (seed 42, medium, t0, from the THR-1589 living-world diagnostics): 235 place-tier Locations, of which **40 carry a current culture**. The meeting reads the culture for candidate names; that is why § S1 prefers a cultured settlement.

## Engine pillar

### Systems design

**S1 — The meeting comes to the player** ([THR-1605](https://linear.app/threadbare/issue/THR-1605)). *Session decision:* the meeting takes place at **the settlement nearest the avatar**, not where the avatar stands.

This works because of what the meeting already is. The god *senses* three souls from a height, and the candidates are invented at the meeting location (`generateNarrativeCandidates`, `createAgentFromMeeting` → `located_at` that location). Nothing requires the avatar to be there. Moving the meeting to a real settlement keeps every one of the 107 `{agent.location}` lines in `meeting-dilemma-library.ts`, and every market-square vignette, true as written. The First lives in a real town, and the seat (spine Beat 1, `seedHomeSeat`) lands there too, so the whole opening points at one place.

- New pure function `pickMeetingLocation(graph, avatarId): string | null` in `meetingEncounter.ts`.
  - Candidates: `getLocationNodes(graph)`, the outer tier only, never a Place, with `locationSubtype ∈ MEETING_SETTLED_LOCATION_SUBTYPES`.
  - Score: hex distance from the avatar's resolved hex (resolve upward through `located_at`).
  - Prefer a settlement carrying a current culture (a `belongs_to` edge with `cultureLayer: 'current'`) when one lies within `MEETING_CULTURED_PREFERENCE_RADIUS` hexes. Otherwise take the nearest.
  - Ties break on node id, so the choice is deterministic and uses no PRNG.
- Trigger: the auto-trigger effect in `GameView.tsx` no longer reads the avatar's location. It fires once when all of these hold:
  - the spine opening beat has resolved (`ascendantBeats.history` contains it);
  - `isMeetTheFirstAvailable`;
  - `ascendantIdentity` is present. This fixes the gap where a non-remembrance start spent the one-shot flag on a flow that never mounts.
  - The `tick >= 2` wait goes: the trigger no longer waits on the world.
  - It calls `handleStartMeeting(pickMeetingLocation(...))`. On `null`, it falls back to the avatar's location, the old behaviour.
- `MEETING_SETTLED_LOCATION_SUBTYPES` stays. The manual "Meet The First" card in the location drawer stays. `devPlaceAvatarAtSettlement` and `?firstunmet` keep working.
- **Why not option (a), starting the avatar in a town?** It would couple the Remembrance ending to a settlement and undo the "Sacred Grove" opening prose. **Why not (b), a pilgrimage pull?** It still puts minutes of walking between the promise and the person, which is exactly what lost all three testers. It remains the natural shape for the *later* threading ceremony (see Notes).

**S2 — The doom clock waits for The First.** *Session decision:* the Unmaking does not start counting until The First is bonded.

- `phaseDoom` skips `advanceDoomClock` while no `thread` edge with `courtPosition: 'the_first'` leaves the ascendant. It checks this through a new pure helper `isFirstBonded(graph, ascendantId)` in `meetingEncounter.ts`, which is also reused by S4 and S5.
- On the first tick the helper returns true, record `doomClock.wokeAtTick = state.tick`. This is an additive optional field on `DoomClockState`. From that tick on, `currentTick`, `progress` and stage thresholds behave exactly as today.
- **Floor:** `phaseDoomExpiry` also requires `state.tick - doomClock.wokeAtTick >= DOOM_MIN_RUN_TICKS_AFTER_BOND` before it moves the game to `twilight`.
  - While the clock is expired but the floor is unmet, the Culmination stage holds. The stage popup has already fired, and nothing else changes.
  - This is the one guarantee against the accelerators: `doom_rate_multiplier`, nudge doom costs and `doom_micro_tick`.
- **Length:** `DEFAULT_DOOM_TICKS` goes from 200 to 1080.
  - That is three in-world years at 12 ticks a day.
  - The round-1 skimmer's world ran ~200 ticks in ~10 real minutes, including pauses (≈3 s/tick). At that pace 1080 ticks is ≈54 real minutes, and the floor alone is ≈36.
  - The journey phases are fractions of doom progress (`JOURNEY_*_PHASE_END`), so The First's journey stretches with it. A full call → return arc is guaranteed inside every run, because the journey starts at the bond.
- **Rivals** do not act before `wokeAtTick + RIVAL_GRACE_TICKS_AFTER_BOND`. The inline interval `8 + floor(rng*5)` becomes `RIVAL_ACTION_INTERVAL_BASE` + `RIVAL_ACTION_INTERVAL_JITTER`, with the same single PRNG draw at the same site.
- **Omens:** `OMEN_FIRST_ACTIVATION_TICK` is measured from `wokeAtTick`, not from tick 0.
- **New cycles:** [THR-1642](https://linear.app/threadbare/issue/THR-1642) rebuilds the doom clock per cycle. When The First survives into the next cycle, the rebuilt clock must set `wokeAtTick` at cycle start; otherwise it waits for a bond that already exists. The S2 executor adds that line if THR-1642 has landed without it.

**S3 — The Stellaris clock** ([THR-1608](https://linear.app/threadbare/issue/THR-1608)). The engine part is nil; see the UI pillar. The clock itself stays real time at `SPEED_STEPS`.

**S4 — The gifts wait for the player.** Spine beats 1–4 (`the_seat`, `thing_left_behind`, `the_first_word`, `a_path_opens`) all reference The First or grow from the bond.

- `phaseAscendantBeatDirector` offers the next spine beat only when all of these hold:
  - (a) its `minTurn` has passed, which is unchanged;
  - (b) for beats 1–4, `isFirstBonded`;
  - (c) `BEAT_MIN_GAP` ticks have run since the last spine beat resolved (today spine offers skip that gap);
  - (d) *Session decision:* the player has taken **at least `SPINE_PLAYER_ACTS_BETWEEN_GIFTS` acts** since the last spine beat resolved, **or** `SPINE_IDLE_FALLBACK_TICKS` running ticks have passed. The fallback means an idle player is never starved.
- **"Player act"** is a new monotonic counter `GameState.playerActCount`, an additive field. It is an engine counter, never a player-facing word, so it owes no UL entry. It is incremented in `commitPlayerCast`, on an avatar move command, and when a Follow or Observe is issued. The director stores `ascendantBeats.playerActCountAtLastSpine` and `lastSpineResolvedTick`.
- Beat 0 ("Reach Down") is unchanged, and the meeting follows it directly (S1).
- Pool, deepening and milestone beats are untouched.

### Graph nodes / edges

No new node or edge types. S1 writes the same `thread` edge (`courtPosition: 'the_first'`) and `located_at` edge the meeting writes today, pointing at a different location. `isFirstBonded` reads `thread` edges; `pickMeetingLocation` reads `located_at` and `belongs_to` edges.

### Tick phases

- `1.5` Journey Beat: unchanged; it reads progress, which now starts at the bond.
- `1.75` Ascendant Beat Director: S4 gates.
- Doom advance (`phaseDoom`): S2 wake gate.
- `8` Doom Expiry: S2 floor.
- Rival actions and omen agenda: S2 grace windows.

The meeting trigger stays a UI effect (S1); it is not a tick phase.

### Resolution logic

- `pickMeetingLocation`: minimum hex distance, with the cultured-preference radius and an id tie-break.
- S4 gate: a conjunction of (a)–(d) above.
- S2: skip the advance until the bond; expiry requires the floor.

### PRNG callouts

None added. S2 renames one existing draw (`phaseRivalActions` interval jitter) without moving it. Skipping rival actions during the grace window changes *when* the draw happens, so the post-grace rival stream differs from today's for the same seed. Same seed + same inputs still gives the same outputs (NFP #3); only the baseline shifts, and heavy-test golden values may need a re-baseline, stated in the PR.

## Content pillar

### Prose tables

- **Beat 0 ("Reach Down")**, `ascendant-beat-content.ts` ~166-173: the body gains one line that hands off to the meeting and names the avatar as the player's own shape (S6). Draft, for the executor to fit to the narrator register: *"You walk the world again as {avatarName}. But the one you are looking for is not you — somewhere near, a soul burns at a pitch only you can hear."*
  - It must read as GM narration ([prose narrator doctrine](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/canon/prose.md)) and stay under the beat's existing length budget.
- **Doom wakes:** the first `phaseDoom` advance after the bond emits one chronicle line from a new `DOOM_WAKES_LINES` table keyed by doom archetype, 7 lines. Example for Breach: *"Far below the world, something that was sleeping turns over."* It is authored in the doom archetype files' voice.
- No meeting prose changes. That is the point of S1.

### Encounter templates

N/A — no template changes. The meeting dilemmas keep their settlement framing.

### Attachment content

N/A — no attachments.

### Data tables

The constants below (§ Constants table), plus `DOOM_WAKES_LINES` (7 entries).

## UI pillar

*Screenshot tools: Playwright (DOM surfaces: interrupt queue, top bar, ledger, sheet) and Claude-in-Chrome (WebGL: the avatar marker, camera zoom, fog; S6, S7). UI Laws engaged: 1, 12, 13/14, 17, 21, 33, 37, 47, 53, 55.*

### Player-facing display

**S3 — The Stellaris clock** ([THR-1608](https://linear.app/threadbare/issue/THR-1608)):

- **One declared registry.** Replace the `otherInterruptOpen` OR-expression with a declared list `INTERRUPT_SURFACES` (new module `src/components/Game/interruptRegistry.ts`). Each entry is `{ id, isOpen(state), tier: 'interrupt' }`.
  - The tier word is the UL's own: an *interrupt* "stops the world" (`Docs/ubiquitous-language/Agents.md` § Moment presentation). Do not coin a second stop-the-world word in code.
  - The never-pausing class is *toast*, the existing notification channel.
  - Every surface in the current expression is an interrupt: encounter veil, Meet The First, premonitions, journey vignettes, story beats, entered ascendant beat, choice sets, emergence dilemma, divine receipt, moment card.
  - Add as interrupts: the Chapter Ledger (reading must not leak time — the Vision rhythm argument), doom-stage popups, and "The Unmaking".
  - `getDebugOpenModals` reads the same list, so the debug surface and the pause can never disagree.
- **One queue.** Popup-channel notifications (doom stages, the Unmaking, rival scheme cracks) no longer render beside open modals. They wait in the notification queue until no interrupt is open. This ends stacking. The second pause path in `useNotifications` is removed in favour of the registry.
- **Resume to prior state.** *Session decision:*
  - When the first interrupt opens, record whether the clock was running. When the last interrupt closes, restore that state. A player who paused stays paused.
  - `forceResumeAfterInterruptsRef` and `ChoiceSetModal`'s direct `setRunning(true)` go through the same policy. Before removing either, read the commit that added it and keep any intent that is not "always resume". If a case genuinely needs a forced resume, it becomes an explicit `resume: 'always'` field on that registry entry, never a side channel.
- **Toast tier** (never pauses, never modal): rival probe toasts, omen rotation, doom progress ticks, receipts at toast tier. These already route as toasts; the plan's job is to keep them out of the interrupt list.
- **Copy:** the store page and the two turn-structure wiki pages say "turn-based". Rewrite them to the Stellaris model, in the Vision's own terms: *time runs between moments and stops for every one.*
  - [`public/the-game.html`](https://github.com/christianspliid-ui/threadbare/blob/main/public/the-game.html): title, hero eyebrow, footer.
  - [`public/turn-structure-reference.html`](https://github.com/christianspliid-ui/threadbare/blob/main/public/turn-structure-reference.html) ~188-189, ~279.
  - [`public/run-lifecycle-reference.html`](https://github.com/christianspliid-ui/threadbare/blob/main/public/run-lifecycle-reference.html) ~219.
  - The code comments at `encounterHandoff.ts:16` and `GameView.tsx:3048` that call this the "turn-based contract".

**S5 — A quiet first screen.**

- Until `isFirstBonded`, the top bar hides `DoomBar`, `RivalsButton`, `NotablesButton`, `OmenIndicator` and `MandateTracker` (Law 53, the HUD is a budget).
- **At the bond:** the doom bar appears with the S2 wake line as a toast-tier toast. The mandate tracker and notables appear with it.
- **Rivals:** the rivals button appears when the first rival action lands, derived from any rival event in `recentEvents`.
- **Omens:** the indicator appears with the first omen, as it already does once `omenState.primary` is set.
- `?seeded` pre-bonds The First, so every dev URL shows the full HUD unchanged.
- **Chapter Ledger badge:** counts **unread** chapters (resolved since the ledger was last opened), not the running total `countThreadedChapters`. UI-local state; resetting on reload is acceptable.
- **Ledger reopen fix:** after the ledger closes, return focus to the game surface, not the ledger button. That kills the Enter-reopens path in `useDialogFocus`. The z-order collision with the beat modal goes away with the S3 queue (one interrupt at a time).

**S6 — Who am I** ([THR-1609](https://linear.app/threadbare/issue/THR-1609)). *Session decision:* the avatar keeps the name from the remembrance, because the player named their own past self and that is the emotional hook. It is framed everywhere as the player's own shape:

- **Avatar marker:** a distinct HexMapV2 marker for the avatar. It carries a ring in the god's primary sphere tint plus the god's sigil, so it is never the same dot as a mortal (Law 12 — a new icon gets a tooltip at first contact).
  - Its hover reads *"You walk here as {avatarName}."*
  - Its sheet header reads *"{avatarName} — your mortal shape"* above the god's title.
- **The First's marker** keeps the court-position look it has today. The contrast between the two markers carries the rest.
- **Beat 0 line:** see Content.
- No rename field, and no new node type (the avatar is an `avatar_of` edge today and stays one).

**S7 — The world reads bigger.**

- `AVATAR_SIGHT_RANGE` goes 0 → 2. The god's own shape sees further than a mortal (`AGENT_SIGHT_RANGE` stays 1).
- `CAMERA_CONSTANTS.MIN_ZOOM` becomes `MIN_ZOOM_FLOOR` (a new, lower constant). The opening fit-to-grid zoom is then no longer clamped up, and the wheel can zoom out until the whole map outline shows, with unexplored ground rendered as the existing parchment fog.
  - The old comment "capped so fog edge is never visible" records a look that the testers read as "a tiny or broken world". This reverses it on their evidence.
- **Kill criterion:** if the zoomed-out parchment renders broken (seams, z-fighting, unreadable labels) at 1920×1080, keep the sight-range change and ship only a small `MIN_ZOOM` reduction. Record which in the PR.

### Event notifications

- Doom wake line: toast-tier toast plus a chronicle line.
- Doom stage popups and the Unmaking: interrupt-tier, queued (S3).
- Spine gifts: unchanged surfaces (ceremonial `RevealCard`), now paced (S4). The sphere-tinted card treatment stays.

### Debug inspection (DebugPanel)

- `window.__DEBUG.getInterruptState()` → `{ open: string[]; wasRunningBeforeInterrupt: boolean | null; queuedPopups: number }` (S3).
- `window.__DEBUG.getOpeningState()` → `{ firstBonded: boolean; doomWokeAtTick: number | null; doomFloorMetAtTick: number | null; playerActCount: number; nextSpineBeat: string | null; spineGateBlockedBy: 'minTurn' | 'first' | 'gap' | 'acts' | null; meetingLocationId: string | null }` (S1, S2, S4).
- Both are declared in `src/debug-bridge.d.ts` with JSDoc, per the bridge convention.

### Visual presence (HexMapV2)

S6 avatar marker; S7 sight and zoom. No new layer, only marker styling on the existing agent layer. Load the `hexmap-core` and `hexmap-layers` skills.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `pickMeetingLocation` (S1) | — (UI effect) | `GameView` auto-trigger → `MeetTheFirstFlow` | `meetingState.locationId` | `meeting.location_picked` | `getOpeningState().meetingLocationId` |
| `isFirstBonded` (S1/S2/S4/S5) | read by `phaseDoom`, beat director | top bar reveal | — (derived) | — | `getOpeningState().firstBonded` |
| Doom wake + floor (S2) | `phaseDoom`, `phaseDoomExpiry` | `DoomBar` (revealed at bond) | `doomClock.wokeAtTick` | `doom.wake`, `doom.expiry_held` | `getOpeningState()` |
| Rival/omen grace (S2) | `phaseRivalActions`, `phaseOmenAgenda` | Rivals panel, omen indicator | reads `doomClock.wokeAtTick` | `rival.grace_hold` (once) | trace viewer |
| Spine gates (S4) | `1.75` director | `AscendantBeatModal` | `playerActCount`, `ascendantBeats.playerActCountAtLastSpine`, `ascendantBeats.lastSpineResolvedTick` | `beat.spine_deferred` | `getOpeningState().spineGateBlockedBy` |
| Interrupt registry (S3) | — | `interruptRegistry.ts`, `useInterruptAutoPause`, notification queue | — (UI state) | `clock.interrupt_open` / `clock.interrupt_close` (UI trace, dev only) | `getInterruptState()` |
| First-screen reveal (S5) | — | `GameViewTopBar`, `ChapterLedger` badge | — (derived + UI-local last-seen) | — | Playwright DOM assertion |
| Avatar marker (S6) | — | HexMapV2 agent layer, avatar sheet header | — | — | Claude-in-Chrome screenshot |
| Sight/zoom (S7) | visibility (existing) | `D3ZoomCamera`, fog | — | — | Claude-in-Chrome screenshot |

**Player controls:** unchanged — Space, `+`/`-`, `.`, the speed buttons. S3 changes only what happens *after* an interrupt. The manual "Meet The First" card in the location drawer stays as the retry path.

**Prose:**
- The Beat 0 line uses the beat content's existing `{avatarName}` substitution; the executor confirms the placeholder name the beat resolver uses.
- The doom-wake lines are plain strings keyed by archetype, emitted as a chronicle `TickEvent`.
- The meeting's prose is unchanged and keeps its existing `{agent.location}` resolution.
- No new `enrichProse()` slot.

**Traces:** the five new engine trace types register in `TraceCategory` / `TRACE_CATEGORIES` / the `TraceEntry` union.

## Interface impact

Doom/Journey and Ascendant Beats are ⚪ UNAUDITED on the [interface map](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/canon/interface-map.md), so this plan writes their rows (audit-on-touch). Each executor slice registers its rows in `scripts/interface-contracts.ts` and regenerates the map in the same PR.

| Contract (new id) | Write site | Read site | Action |
|---|---|---|---|
| `meeting-bond-writes-the-first` — the meeting's bond is what makes a First | `createAgentFromMeeting` (`thread`, `courtPosition: 'the_first'`) | `isFirstBonded`, `isMeetTheFirstAvailable`, attention (`attentionTier.ts`) | **preserve** (row written; S1) |
| `first-bond-wakes-doom` — the Unmaking starts counting when you first reach down | `the_first` thread edge | `phaseDoom` advance gate; writes `doomClock.wokeAtTick` | **add** (S2) |
| `doom-floor-holds-unmaking` — no world ends before its First has had a life | `doomClock.wokeAtTick` | `phaseDoomExpiry` | **add** (S2) |
| `doom-progress-paces-first-journey` — The First's hero's journey moves with the doom clock | `advanceDoomClock` (`progress`) | `journeyEngine.ts` phase fractions | **preserve** (row written; S2 re-verifies) |
| `player-acts-pace-spine-gifts` — the god's gifts arrive between the player's own acts | `commitPlayerCast`, avatar move, follow/observe → `playerActCount` | `phaseAscendantBeatDirector` | **add** (S4) |

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `MEETING_CULTURED_PREFERENCE_RADIUS` | 6 | Hexes within which `pickMeetingLocation` prefers a settlement that carries a current culture (names and prose read the culture) over a nearer one that does not. |
| `DEFAULT_DOOM_TICKS` | 1080 (was 200) | Doom clock length. Three in-world years; ≈54 real minutes at the round-1 observed pace. |
| `DOOM_MIN_RUN_TICKS_AFTER_BOND` | 720 | Floor: the Unmaking cannot begin until this many ticks after the bond, whatever accelerates the clock. |
| `RIVAL_GRACE_TICKS_AFTER_BOND` | 48 | Rivals take no action for four in-world days after the bond. |
| `RIVAL_ACTION_INTERVAL_BASE` | 8 | Was inline. Ticks between a rival's actions, before jitter. |
| `RIVAL_ACTION_INTERVAL_JITTER` | 5 | Was inline. Exclusive upper bound of the `floor(rng*N)` jitter. |
| `OMEN_FIRST_ACTIVATION_TICK` | 3 (unchanged value) | Now measured from `wokeAtTick`, not tick 0. |
| `SPINE_PLAYER_ACTS_BETWEEN_GIFTS` | 1 | Player acts required between spine gifts 1–4. |
| `SPINE_IDLE_FALLBACK_TICKS` | 36 | Running ticks after which the next gift arrives without an act (three in-world days). |
| `BEAT_MIN_GAP` | 4 (unchanged value) | Now also applies to spine offers. |
| `AVATAR_SIGHT_RANGE` | 2 (was 0) | Hex radius the avatar reveals. |
| `MIN_ZOOM_FLOOR` | executor measures; start at 2 | Lowest camera zoom; replaces the `MIN_ZOOM: 5` clamp so the fit-to-grid view is reachable. |

## Tracing

```ts
// meeting.location_picked — emitted once when the auto-trigger picks the meeting settlement (S1)
interface MeetingLocationPickedTrace {
  type: 'meeting.location_picked';
  locationId: string;
  hexDistance: number;         // from the avatar's resolved hex
  cultured: boolean;           // picked for its current culture
  fallback: boolean;           // true when pickMeetingLocation returned null and the avatar's location was used
}

// doom.wake — emitted on the first doom advance after the bond (S2)
interface DoomWakeTrace {
  type: 'doom.wake';
  tick: number;                // becomes doomClock.wokeAtTick
  archetype: string;
}

// doom.expiry_held — emitted once per run when the clock has expired but the floor is unmet (S2)
interface DoomExpiryHeldTrace {
  type: 'doom.expiry_held';
  tick: number;
  wokeAtTick: number;
  floorMetAtTick: number;      // wokeAtTick + DOOM_MIN_RUN_TICKS_AFTER_BOND
}

// rival.grace_hold — emitted once per run, the first tick a rival action is suppressed by the grace window (S2)
interface RivalGraceHoldTrace {
  type: 'rival.grace_hold';
  graceEndsAtTick: number;
}

// beat.spine_deferred — emitted when a due spine beat is held back; deduped per (beatId, reason) (S4)
interface SpineDeferredTrace {
  type: 'beat.spine_deferred';
  beatId: string;
  reason: 'first_not_bonded' | 'min_gap' | 'awaiting_player_act';
}
```

S3's `clock.interrupt_open` / `clock.interrupt_close` are dev-only UI traces through the existing UI trace path. They are not engine traces, since the engine never sees the UI's pause.

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| No settlement on the map matches the settled subtypes | `pickMeetingLocation` returns `null`; the trigger uses the avatar's own location (today's behaviour); trace `fallback: true`. |
| The avatar has no `located_at` edge | Distance scoring uses the map centre hex; still deterministic. |
| The meeting never completes (flow crash, reload mid-flow) | Doom stays asleep, so the world is safe. The manual "Meet The First" card remains the retry path. `getOpeningState()` shows `firstBonded: false`. |
| The First dies later in the run | `wokeAtTick` is already set, and the clock and floor carry on; `isFirstBonded` going false later never re-sleeps doom (the gate reads `wokeAtTick !== undefined` first). |
| A saved world has no `wokeAtTick` | Treated as woken at tick 0. Old saves behave as today, floor included. |
| `playerActCount` missing on a saved world | Read as 0; the idle fallback still delivers gifts. |
| An interrupt surface throws in `isOpen` | The registry catches it, logs once and treats the surface as closed, so the clock never deadlocks paused. |
| A queued popup's source state is gone by the time the queue drains | Drop it with a debug log; never render an empty modal. |
| The zoomed-out parchment renders badly | S7 kill criterion: ship the sight change only. |

## Blast Radius

`src/types/gameState.ts` is a ≥100-importer file (see `.codesight/graph.md`). S4 adds one optional field (`playerActCount`) and two optional fields on `ascendantBeats`; S2 adds one optional field on `DoomClockState` (`src/types/doomClock.ts`). Everything is additive and optional, with no renames and no required fields, so the cascade is limited to type-checking; nothing at existing construction sites needs to change.

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/gameState.ts` | 675 (`.codesight/graph.md`, 2026-09-27) | Optional-field additions only; no construction site must change. |

## Slicing

Seven build slices: three existing tickets and four new ones (THR-1646 to THR-1649). Order: **S1 → S2 → S4**, because S2 and S4 read the bond S1 makes reliable. S3, S5, S6 and S7 are independent of that chain, but S1, S3, S5 and S6 all edit `GameView.tsx` (see mutex lines).

| Slice | Ticket | Pillars | Size |
|---|---|---|---|
| S1 The meeting comes to the player | [THR-1605](https://linear.app/threadbare/issue/THR-1605) | Engine, UI | S |
| S2 The doom clock waits for The First | [THR-1646](https://linear.app/threadbare/issue/THR-1646) | Engine, Content (7 lines) | M |
| S3 The Stellaris clock | [THR-1608](https://linear.app/threadbare/issue/THR-1608) | UI, copy | M |
| S4 The gifts wait for the player | [THR-1647](https://linear.app/threadbare/issue/THR-1647) | Engine | S |
| S5 A quiet first screen | [THR-1648](https://linear.app/threadbare/issue/THR-1648) | UI | S |
| S6 Who am I | [THR-1609](https://linear.app/threadbare/issue/THR-1609) | UI (WebGL), Content (1 line) | S |
| S7 The world reads bigger | [THR-1649](https://linear.app/threadbare/issue/THR-1649) | UI (WebGL), constants | S |

[THR-1642](https://linear.app/threadbare/issue/THR-1642) (the cycle reset bug) is filed and lands before S2.

## Three-pillar check

- [x] Engine pillar present (S1 picker and trigger, S2 doom, S4 director)
- [x] Content pillar present (Beat 0 line, 7 doom-wake lines; meeting prose deliberately untouched, with the reason)
- [x] UI pillar present (S3 registry and queue, S5 reveal, S6 marker, S7 camera)
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not *silently* contradict a Vision premise; the one it changes is changed openly, below.
- [x] **This plan changes a Vision premise, and the edit is in scope.** `Vision/01-core-loop.md` § "Turn-based is load-bearing" and `Vision/taste-profile.md` ("Turn-based, not auto-advancing"; rejected "Auto-advancing time") are rewritten to Christian's 2026-09-27 ruling, by this session, in the vault, as the same act as this PR.
  - The premise's *reason* survives intact and becomes the rule: *time must not run while the player reads a moment or scans their portfolio*. The Stellaris model delivers that by halting for every moment (S3) and by making the ledger an interrupt, not by making every tick wait.
  - What is dropped is the *mechanism*: "the world advances only when you say so". The game has not worked that way in code; the rulebook's `[IMPL]` tag for it was wrong.
- `00-north-star.md` ("pressure that is not the player's to pause") is **strengthened**, not contradicted: the clocks now run.
- `02-non-negotiables.md` §3 (prose, never numbers): untouched here. Readability numbers are the sibling plan's question ([THR-1607](https://linear.app/threadbare/issue/THR-1607)), under the Law 13 ratified exception.

## Rulebook impact

- [x] This plan changes rules of play (clock; win/loss timing).
- [x] **This plan changes two rules of play; `Docs/canon/rulebook.md` and `rulebook-quick-reference.md` are updated in this PR.**
  - § 3 "The Three-Beat Turn": "turn-based … single-step per player command [IMPL]" → real time between moments, halting for every moment [IMPL — the clock]; interrupt registry and resume-to-prior [DESIGN — this plan, S3].
  - § 8 "The Clocks": the Doom Clock wakes at the bond and cannot culminate before a floor [DESIGN — this plan, S2].
  - The quick-reference "The world advances only when you say so" → the same, one line.

> Brainstorm companion: `Docs/plans/2026-09-27-thr-1605-the-opening-brainstorm.md` (written alongside).

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Every new number is a named constant (§ Constants); two inline rival magic numbers are promoted. |
| 2. Inspectability | PASS | Five trace types; two debug accessors expose every gate and why it is closed. |
| 3. Determinism | PASS with note | No new PRNG. The rival grace window shifts when an existing draw happens, so the post-grace rival stream changes for a given seed (re-baseline, not nondeterminism). `pickMeetingLocation` breaks ties on id. |
| 4. Fail-soft | PASS | § Fail-soft table; the registry never deadlocks paused; old saves read the missing fields as today's behaviour. |
| 5. Narrative over mechanical perfection | PASS | The meeting keeps its authored settlement fiction by moving to a settlement rather than rewriting 107 lines; doom wakes with a line of prose, not a meter. |
| 6. Additive over destructive | PASS with note | All state additions are optional fields. One deliberate removal: the second pause path in `useNotifications`, folded into the registry (two pause systems are the bug). |
| 7. Performance budget | PASS | `pickMeetingLocation` runs once per run over ~200–800 locations; the director gate is O(1). |

## Kill criteria

- **S1:** if a round-2 cold tester still does not register The First as a person *they* chose (they click through the meeting without reading), the fix is the ceremony's weight, not its reachability. File that against the future threading-ceremony ticket; do not move the meeting again.
- **S7:** see the UI pillar.

## Done when

Per slice (each slice ticket carries its own copy):

- [ ] **S1** — On the real first-run path (StartPage → RemembranceFlow → GameView, **not** `&seeded` and not `&firstunmet`):
  - the meeting opens right after "Reach Down", with no avatar movement;
  - `getOpeningState().meetingLocationId` names a settled place-tier Location;
  - after the bond, `firstBonded: true`.
  - Unit test for `pickMeetingLocation`: nearest-wins, cultured-preference, tie-break, null fallback.
  - Browser evidence (UI pillar): Playwright screenshot of the sensing beat at 1920×1080 plus the console.
- [ ] **S2** — Tests:
  - no doom advance before the bond;
  - `wokeAtTick` is set on the first bonded tick;
  - expiry is held until the floor even with a `doom_rate_multiplier` of 10;
  - rivals are silent inside the grace window.
  - Headless CLI evidence (engine pillar, no browser owed): `?firstunmet`-equivalent headless world, `tick 30` before a bond shows `doomClock.currentTick === 0`.
  - 30-tick CLI smoke plus `npm run test:heavy`.
- [ ] **S3** — Tests for the registry and the resume policy (paused stays paused; running resumes).
  - Playwright: pause → open ledger → close → still paused; run → a doom-stage popup arrives while a beat is open → it waits, then shows. Screenshot plus `getInterruptState()` output.
  - The three `public/*.html` pages no longer say turn-based.
  - Wiki pages owed: `turn-structure-reference`, `run-lifecycle-reference` (edited in this slice); check `public/wiki-manifest.json` `sources` for any page matching the hooks touched.
- [ ] **S4** — Test: with the First bonded and no player act, gift 1 arrives only after `SPINE_IDLE_FALLBACK_TICKS`; after one cast it arrives at the next gap.
  - CLI evidence via `window.__DEBUG.tick(n)` or headless: `spineGateBlockedBy` reads `awaiting_player_act` between gifts.
- [ ] **S5** — Playwright on the real first-run path:
  - a screenshot before the bond (no doom bar, rivals, notables or omens) and after;
  - the ledger badge reads 0 after opening the ledger.
- [ ] **S6** — Claude-in-Chrome WebGL screenshot of the avatar marker next to a mortal at 1920×1080; the sheet header reads "— your mortal shape".
- [ ] **S7** — Claude-in-Chrome screenshot at the initial zoom and at full zoom-out, or the kill-criterion record.
- [ ] All slices:
  - `npm test`, `npm run check:typecheck` and `npx vite build` pass;
  - the closing commit body carries the slice's own `Fixes` line;
  - UI slices carry the four-part browser-verify evidence, including the UI-Laws line (Laws 1, 12, 13/14, 17, 21, 33, 37, 47, 53, 55 as engaged).

## Coordination block

**Suggested model:** opus for S1, S3 and S6 (GameView and WebGL surfaces, judgement on the resume policy); sonnet for S2, S4, S5 and S7 (contained engine gates and constants).

**Parallel-safe with:** the sibling plan's slices ([THR-1606](https://linear.app/threadbare/issue/THR-1606), [THR-1607](https://linear.app/threadbare/issue/THR-1607) and their new tickets) except where named below; [THR-1643](https://linear.app/threadbare/issue/THR-1643) (thread templates only).

**Mutex with:**
- S1 ↔ S3 ↔ S5: all edit `src/components/Game/GameView.tsx` (trigger effect, interrupt expression, top-bar props).
- S2 ↔ [THR-1642](https://linear.app/threadbare/issue/THR-1642): both edit the doom clock state and `phaseDoomExpiry` / `cycleEnd.ts`.
- S5 ↔ the sibling plan's essence slice: both edit the top bar or ascendant bar.
- S6 ↔ S7: both edit HexMapV2 (agent layer / camera).

**Blocked by:** S2 and S4 by S1; S2 by THR-1642.

**Files to touch:**
- Edit: `src/engine/meetingEncounter.ts` (S1 `pickMeetingLocation`, `isFirstBonded`)
- Edit: `src/components/Game/GameView.tsx` (S1 trigger; S3 registry use; S5 reveal props)
- Edit: `src/engine/phaseDoom.ts`, `src/engine/orchestrator.ts` (`phaseDoomExpiry`, `phaseRivalActions`), `src/engine/phaseOmenAgenda.ts`, `src/types/doomClock.ts`, `src/data/game-config.ts` (S2)
- Edit: `src/data/doom/*.json` or a new `src/data/doom-wake-lines.ts` (S2 lines)
- Create: `src/components/Game/interruptRegistry.ts`; edit `hooks/useInterruptAutoPause.ts`, `hooks/useNotifications.ts` (S3)
- Edit: `public/the-game.html`, `public/turn-structure-reference.html`, `public/run-lifecycle-reference.html` (S3)
- Edit: `src/engine/ascendantBeat.ts`, `src/types/gameState.ts`, `src/engine/playerCastDispatch.ts` (S4)
- Edit: `src/components/Game/GameView/GameViewTopBar.tsx`, `ChapterLedger.tsx` (S5)
- Edit: HexMapV2 agent layer and avatar sheet header, `src/data/ascendant-beat-content.ts` (S6)
- Edit: `src/types/visibility.ts`, `src/components/HexMapV2/camera/D3ZoomCamera.ts` (S7)
- Edit: `src/debug-bridge.ts`, `src/debug-bridge.d.ts` (S1/S2/S3/S4 accessors)
- Edit: `scripts/interface-contracts.ts`, `Docs/canon/interface-map.md` (rows per slice)

## Notes for the executor

- **Do not rewrite meeting prose.** S1 works *because* the prose stays true. If a line reads wrong at a specific settlement subtype, file it; do not patch it inside S1.
- **Do not test on `&seeded`.** It pre-bonds The First and hides every behaviour here. Use the real first-run path, or `?view=game&firstunmet&size=medium` for engine checks where the doc allows.
- **The resume policy is the contested line.** If you find a case where resume-to-prior feels wrong in play (for example, the player paused, then chose an encounter card, and expects the world to run on), record it in the PR and ask in the ticket rather than re-adding `always resume`.
- **What comes next (not in scope):** Christian's broader direction is that *every* threading plays a ceremony, the closest thing the game has to character creation. It is filed as its own ticket, [THR-1644](https://linear.app/threadbare/issue/THR-1644). S1 deliberately moves the meeting toward "the ceremony comes to where the mortal is", which is the shape that ticket needs.

## Intent-judge verdict

**Allow** (2026-09-27, `fable`, cold context). Impact class corrected Reversible → **High-risk**; sign-off present as Christian's verbatim rulings. Two advisory GAPs, both applied before commit:

- (3) the wiring prose line and trace registration, added to § Wiring;
- (6) the tier word renamed from a coined "halt" to the UL's *interrupt*, with toasts for the never-pausing class.

## Forked-audit verdicts

| Dimension | Verdict | Note |
|---|---|---|
| NFP | PASS-with-notes | #3: the rival grace window shifts when an existing draw fires (re-baseline, not nondeterminism). #6: one deliberate removal (the second pause path) is justified. |
| Three-pillar | PASS | All pillars substantive; substrate inventory matches the inventory; no green-field duplication. |
| Vision | PASS-with-notes | The premise edit is declared and already made in the vault. Soft note: S7's zoom-out leans toward legibility in the legibility-vs-mystery tension; bounded by its kill criterion. |

### NFP audit

PASS-with-notes. Tunability: 12 named constants; two inline rival numbers promoted. Inspectability: five trace types plus two debug accessors covering every gate. Determinism: no new PRNG; id tie-break; the post-grace rival stream re-baselines. Fail-soft: 9 cases, none throws. Narrative: the meeting's 107 settlement lines are preserved by moving the meeting; doom wakes with a line of prose. Additive: optional fields only; the second pause path is folded, not dropped silently. Performance: a one-time picker and an O(1) gate.

### Three-pillar audit

PASS. Engine: all five subsections concrete. Content: templates and attachments N/A with rationale; prose and data tables filled. UI: all four subsections concrete, with two debug accessors. Wiring covers S1–S7 plus player controls, prose and traces. Substrate: eight rows, each extends, tunes or replaces an ACTIVE subsystem.

### Vision audit

PASS-with-notes. `01-core-loop` and `taste-profile` confirmed rewritten to the Stellaris model, with the rhythm reason kept verbatim; `00-north-star` "pressure not the player's to pause" is extended; non-negotiables untouched. No contradictions. Soft note on S7 (legibility vs mystery).
