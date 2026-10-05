> **title:** Warm playtest — no-knowledge testers start a few hundred ticks in — THR-1744
> **linear_issue:** THR-1744
> **author:** Claude Code (design lane, unattended — decisions under delegation, process.md rule 4)
> **created:** 2026-10-05
> **three_pillars:** Engine `done (minimal) — one additive pure helper in the moment queue's single-writer module; runTickBatch unchanged, no tick phase` · Content `N/A — the warm brief is harness text under scripts/cold-playtest/, not game content` · UI `done — a ?warm=<ticks> start lever and its loading overlay`

# Warm playtest — no-knowledge testers start a few hundred ticks in — THR-1744

*The cold playtest has shown what a new player hits in their first ten minutes. Nothing shows what a player meets in their second hour. This plan starts the same no-knowledge testers inside a world that has already been running for a while, and checks that they actually reach factions, undertakings and ambitions.*

## Why this is load-bearing

Two cold rounds ran 8–12 minutes and 55–63 actions per tester. Every finding landed in onboarding, the bond and the first dilemmas ([round 2 report](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/cold-playtest-round-2.md)). The ticket's headless check found the mid-game systems are the weakest: faction turns idle 88% of the time, ambitions complete about 2% of the time, and undertakings are mostly "observe". Those are engine numbers. Nobody knows how they read to a player, because no tester has ever got that far.

This plan measured the coverage gap rather than assuming it. The cold round-2 snapshot files (one `.yml` accessibility snapshot per tester action, under `%USERPROFILE%\.threadbare\cold-playtest\round-2\<persona>\shots\`) were searched for the headings each mid-game surface renders:

| Surface | Marker searched | story | veteran | skimmer |
|---|---|---|---|---|
| Faction sheet | `Network Graph` / `Current Agenda` / `Ascendant Actions` | 0 | 0 | 0 |
| Undertakings (Journey tab) | `heading "The Work"` / `No long work under way` | 0 | 0 | 0 |
| Ambitions | `heading "Ambitions"` / `Completed Ambitions` / `know what drives` | 0 | 0 | 0 |
| Thread history | `Story so far` / `dialog "Chapter Ledger"` / `heading "Timeline"` | 8 / 2 / 0 | 6 / 0 / 0 | 5 / 3 / 0 |

Counts are matching snapshot lines (`cat <persona>/shots/*.yml | grep -cF '<marker>'`). Cold testers already reach thread history, and 0 of 3 reach the other three surfaces. A warm round exists to change those rows. A first marker draft used the faction sheet's "Leadership" title, and it matched 5 lines in the skimmer's snapshots with no faction sheet open (encounter prose uses the word). That is why every marker below was checked for uniqueness under `src/`.

## Substrate inventory

The Engine pillar is minimal (one pure helper, § Engine pillar). Otherwise the plan reuses these existing surfaces, each measured on `origin/main` `c53a96c4` and on the live site at `https://threadbearer.co` on 2026-10-05.

| Existing surface | Status | This plan |
|---|---|---|
| Cold playtest harness (`scripts/cold-playtest/`: `config.json`, `personas.json`, `player-brief.md`, `run-player.ps1`, `run-round.ps1`, `extract.mjs`) | 🟢 ACTIVE (rounds 1–2) | **extends:** a `warm` mode. Same tester isolation, same personas, its own brief file and start URL |
| `cold-playtest` skill + `tb-cold-playtest` daily lane (`37 10 * * *`) | 🟢 ACTIVE | **extends:** the skill gains `--warm`; the lane evaluates the warm gates after the cold ones |
| Quick-start URL params `?view=game&seeded&size=medium` (`App.tsx:55-60`, `:211-213`) | 🟢 ACTIVE **in production** | **reuses:** on the live site this lands with The First pre-bonded. Measured: the Threads panel lists `KAEL THORNWEAVER`, and the page reads "Time is still. Press Play or Space…". None of these params are gated on `import.meta.env.DEV`. `GameView.tsx:449` documents that `?spawn` and its siblings are ungated on purpose, "so it also works on the deployed build" |
| `runTicksSync` → `runTickBatch` (`useSimulation.ts:176-193`) | 🟢 ACTIVE, compiled into the production bundle | **reuses:** the warm-up drives it. Only its debug registration (`GameView.tsx:2969`) is dev-gated |
| `window.__DEBUG` (`debug-bridge.ts:8`, `if (import.meta.env.DEV)`) | 🟢 dev only | **not used in production.** Measured on the live site: `typeof window.__DEBUG === "undefined"`. A warm start cannot come from `__DEBUG.tick` |
| Attention toggle, **Asks you / Lives on** (`ThreadsPanel.tsx:293-332`, `data-attention-mode="pause" \| "auto_resolve"`; copy `ui-content.ts:557-564`) | 🟢 ACTIVE | **reuses:** during the warm-up The First runs on **Lives on**; on arrival the previous mode is restored |
| Interrupt suppression `interruptSuppressedUntilTick` (`GameView.tsx:1342-1343`; production state, already set by eight production call sites, e.g. `:3320`, `:4000`) | 🟢 ACTIVE in production | **reuses:** the warm-up sets it to `startTick + advanced + 1`, so vignettes, story beats, premonitions, the beat offer banner and encounter auto-open (`isEncounterAutoOpenSuppressed`, `:4062`) stay closed through the warm-up and its arrival tick. The plan adds **no second suppression switch**. The dev-only `beatSuppressionActive` (`:4876`, `:4955`) is not used |
| `dismissOpenBeatInterrupts()` (`GameView.tsx:4887`) | 🟢 ACTIVE (dev bridge `dismissBeats`) | **deliberately not used.** It resolves ascendant beats with a **default choice** (`handleResolveBeat`) and **withdraws** journey vignettes (`handleJourneyChoice(withdrawn.id)`), so calling it would make the player's decisions for them, which is PC-4 at its worst. A decision raised during the warm-up **waits for the player** instead (§ Start state, step 4) |
| Undertaking moment queue `pendingUndertakingMoments`, consumer `GameView.tsx:4638-4650` (deliberately **not** gated on `interruptsSuppressed`), FIFO cap `MOMENT_QUEUE_MAX = 8` for the **whole world** (`strategic-action-constants.ts:502`; overflow evicts the oldest record, `undertakingMoments.ts:87-91`) | 🟢 ACTIVE | **reuses, with its limits stated.**
  - **Why they pile up.** The First is followed, so its at-cost / completion / fork / complication moments are interrupt-tier **regardless of Asks you / Lives on** (`resolveMomentPresentation`, `undertakingCheckpoints.ts:184-205`, keys on `isFollowed`). They would pop at arrival.
  - **Why the queue is not the record.** It holds 8 records for the whole world, and every mortal's checkpoints push into it. Over 300 ticks, most of The First's moments are evicted before arrival.
  - **The durable record is the chronicle.** Every non-completion moment also emits a chronicle `TickEvent` (`undertakingCheckpoints.ts:648`, significance `MOMENT_INTERRUPT_SIGNIFICANCE` 0.85), and a completion is emitted by the undertaking lifecycle under its christened name.
  - **What the warm-up does at the end.** It re-tiers whatever of The First's interrupt records **survived** in the queue to `presentation: 'badge'` and leaves them unacknowledged. Acknowledging them would hide them: `isMomentBadgeable`, `momentBadgeModel.ts:84-85`, excludes acknowledged records. `nextInterruptMoment` (`undertakingMoments.ts:135-139`) then skips them, so none pops. Survivors from the last `MOMENT_BADGE_RETENTION_TICKS` (48) badge on The First's thread row, and survivors also appear under "The Arc So Far" (`agentArc.ts:98-108`). |
| Interrupt registry `INTERRUPT_SURFACES` (`interruptRegistry.ts:19-60`) | 🟢 ACTIVE | **extends:** `WarmStartOverlay` registers as an interrupt surface (a `warmStartRunning` field on `InterruptSnapshot` plus one entry), so the moment consumer and every other surface yield to it, and `getOpenModals()` reports it in dev |
| Speed control `SPEED_STEPS = [1,2,3,5,10,20]` (`SimulationControls.tsx:58`), tick interval `max(50, 1000/speed)` ms (`useSimulation.ts:210`) | 🟢 ACTIVE | **rejected as the warm start:** see the brainstorm companion. Measured on the live site, the top speed is 20×, and The First's moments stop the clock |
| Save / load | ⚪ **does not exist.** `SettingsPanel.tsx:483` says "There is no save". The "Save a snapshot" incident export (`useIncidentCapture.ts`) has no import path | **not built:** a snapshot import is rejected (see the companion) |
| Snapshot `.yml` files + `console-*.log` in each tester's `shots/` (Playwright MCP 0.0.82 `--output-dir`) | 🟢 present for every cold round | **extends:** the coverage source. Read before `keepRoundsWithScreenshots` prunes them |
| `Docs/ops/player-complaint-classes.md` (THR-1743) | 🟢 ACTIVE | **extends:** warm rounds add to the same list through skill step 8b |
| `keep-work-flowing-cc` sibling fold (`SKILL.md:75`) | 🟢 ACTIVE | **extends:** adds `warm-playtest-round-*` to the pattern list |

**Measured warm-up cost.** `printf "tick 300\nstatus\nquit\n" | npm run cli -- --seed 42 --map medium` took 93 s wall-clock, including the esbuild bundle and world generation. At tick 300 the world is still in phase `playing` at doom stage 1, and the population has grown from 509 to 841 agents. A few hundred ticks fits inside a loading wait, and the world does not end before the tester arrives. `?seeded` is not `--seed 42`, so the executor re-times the warm-up on the live build (Done when, item 2).

## How a warm round works

### Start state — the `?warm=<ticks>` lever

The tester's start URL is `https://threadbearer.co/?view=game&seeded&size=medium&warm=300`.

1. The page builds the `?seeded` world exactly as today: the dev ascendant, with The First pre-bonded.
2. Before the player gets control, the game reads `warm`. It clamps the value to `WARM_START_MAX_TICKS`, sets The First's attention mode to **Lives on**, and advances the world through `runTicksSync` in chunks of `WARM_START_CHUNK_TICKS`. It yields a macrotask between chunks so the page stays responsive and the overlay can repaint.
3. Before the first chunk, it sets the existing `interruptSuppressedUntilTick` to `startTick + requested + 1`, using the clamped request (known before the first chunk), and `WarmStartOverlay` takes the interrupt slot. Beats, vignettes, premonitions and encounter auto-opens raised during the warm-up stay closed. Their events still reach the chronicle and the Chapter Ledger, which is where a returning player reads what happened.
4. At the end, in this order:
   1. Make no decision for the player. Beats, vignettes and premonitions held by suppression are **not** resolved. They wait, and the interrupt registry shows them one at a time once suppression clears, exactly as for any player returning to a paused world.
   2. Re-tier every unacknowledged interrupt-tier undertaking moment raised since the start tick to badge tier (`settleUndertakingMomentsAsBadges`, § Engine pillar). They stay unacknowledged. This covers only the records that **survived** the world-wide 8-slot queue. Survivors from the last 48 ticks badge on The First's thread row, and survivors also appear under "The Arc So Far". The full record is the chronicle line each moment wrote (§ Substrate inventory).
   3. Restore The First's attention mode to what it was before step 2.
   4. Clear `interruptSuppressedUntilTick`.
   5. Leave the clock paused at 1×, and close the overlay.

   The tester arrives at the same paused screen a real player sees, a few seasons later. No undertaking moment pops. At most the decisions raised during the warm-up wait, one at a time (`WARM_START_MAX_ARRIVAL_DECISIONS`).

`warm` is ignored unless `?view=game&seeded` is also present, because there is no bonded First to warm without it. An ignored value logs one `console.warn`. A value that does not parse, or is < 1, is also ignored.

**Determinism.** `?seeded` fixes the world. The warm-up advances it by the fixed tick count through the same seeded pipeline, so every warm round of a given build starts in the same world. Rounds stay comparable, and a finding can be reproduced by opening the same URL.

### The tester

Same as cold, by construction: a fresh `claude -p` outside the repo, its system prompt replaced by the brief, `--setting-sources local`, and Playwright-only tools (no page scripts, console or network). Same three personas (`story`, `veteran`, `skimmer`), same `testerModel` and action budget. Two things differ:

- **Start URL:** `warmStartUrl`, above.
- **Brief:** a new file, `scripts/cold-playtest/player-brief-warm.md` (Appendix B), versioned on its own as `warmBriefVersion`. It keeps the cold brief's load-bearing playtest-log wording verbatim. Round 1 learned that the safeguard refuses "think aloud" phrasing. The brief changes only the framing: *you played the opening about an hour ago; you are coming back to the world*. It adds one curiosity line in a returning player's words — who holds power in this world, what your mortal is working towards, what has happened while you were gone — and names no panel, tab or button. It also tells the tester the world may take a minute or two to load, and to wait.

### Coverage — did the tester reach the mid-game?

A new extractor step reads each tester's `shots/*.yml` snapshots. A surface counts as **reached** when any snapshot contains one of its markers. The markers live in `config.json` (`coverageMarkers`) so copy changes are a config edit, not a code change.

| Surface | Markers (any one) | Source of the text |
|---|---|---|
| `faction` | `Network Graph`, `Current Agenda`, `Ascendant Actions` (plain text: the sheet's section titles render through `SectionLabel` as `div`s, not headings, `FactionSheet.tsx:941-948`) | `FactionSheet.tsx:280-285, 323, 417`. Each string occurs nowhere else under `src/components` or `src/data` (grep, 2026-10-05). "Leadership" is rejected because it also appears in encounter prose |
| `undertaking` | `heading "The Work"`, `No long work under way` | `JourneyTab.tsx:195` (heading), `:202` (empty state) |
| `ambition` | `heading "Ambitions"`, `Completed Ambitions`, `know what drives` | `JourneyTab.tsx:209` (heading), `:214` ("know what drives" empty state), `ChronicleTab.tsx:215` |
| `threadHistory` | `Story so far`, `dialog "Chapter Ledger"`, `heading "Timeline"` | `StorySoFarPanel.tsx:64`, `ChapterLedger.tsx:325`, `ChronicleTab.tsx` |

A surface reached only through its empty state (`No long work under way`, `know what drives`) is recorded as `reached-empty`. That is still coverage, and still a fact the observer reads.

**A coverage failure is a tester who reached none of `faction`, `undertaking` or `ambition`.** Thread history does not count toward it, because cold testers already reach it (3/3 in round 2, above). Counting it would let a tester pass without touching any of the mid-game systems. A coverage failure is reported per tester, never hidden in a round total. Its verified findings are still filed, since they are real, but it does not count as a clean pass.

The extractor also reads the warm-up's own console line from `shots/console-*.log` (§ Tracing). A tester whose warm-up never logged completion played the wrong world. That persona is unusable, with `failure: warm-start`.

### The observer, filing and cross-round tracking

These follow the cold skill unchanged: read every log in full, verify every candidate against `origin/main`, and classify each as `bug` / `design` / `tester-error` / `unverified`. Compare against earlier findings and publish. The warm-specific parts are:

- **Milestone:** `Warm playtest · round N`, in the project **Thematic Pressure & Living World**. That is where factions, ambitions and undertakings live; onboarding is cold's project.
- **Label:** `warm-playtest`, plus `Bug` or `Game Design` and the pillar labels.
- **Cross-round tracking** reads both `cold-playtest` and `warm-playtest` issues. A cold finding that a warm tester hits again is `recurred` and is commented on the original. It is not re-filed.
- **Report:** `Docs/ops/warm-playtest-round-N.md` on `ops`. It has the cold report's sections plus a **Coverage** table: per tester, each surface `reached` / `reached-empty` / `—`, and a `coverage failure` flag.
- **Scorecard:** `Docs/ops/warm-playtest-scorecard.tsv` on `ops`. It has the cold columns plus `faction`, `undertaking`, `ambition`, `threadHistory` and `coverageFailure`.
- **Complaint classes:** skill step 8b runs for warm rounds too, against the same `player-complaint-classes.md`.

### Lane shape and when a warm round runs

Warm is a **mode of the existing `cold-playtest` skill and the existing `tb-cold-playtest` lane**, not a new lane. The lane fires once a day. It evaluates the cold gates first and runs a cold round if they open. Only when no cold round ran does it evaluate the warm gates, which are the cold four applied to warm's own series:

1. Every issue in the highest `Warm playtest · round k` milestone is Done or Canceled.
2. `check:deploy` reports `deployed`, and the newest fix is at least `deploySettleMinutes` old.
3. At least `warmMinDaysBetweenRounds` days have passed since warm round k.
4. The standalone CLI login is alive.

**At most one round runs per fire.** That caps the lane's daily spend at one round (~$12–15 notional on the subscription plan, three testers at ~$4–5 each from the round-2 scorecard) and keeps the two series from crowding each other.

An attended `/cold-playtest --warm` skips gates 1 and 3, exactly as the cold attended mode does.

## Engine pillar

The warm-up calls `runTickBatch` through the existing `runTicksSync` hook (`useSimulation.ts:176`), the same pipeline every live tick runs. Doom, twilight and population are whatever the engine produces in that many ticks. No tick phase, graph node or edge is added.

**One additive pure helper** goes in the moment queue's single-writer module `src/engine/undertakingMoments.ts`. Its header reads: *"single writer for `state.pendingUndertakingMoments`"*.

```ts
/**
 * Re-tier interrupt moments raised at or after `sinceTick` to badge tier, leaving them
 * unacknowledged so the badge and the arc strip still count them. Records before
 * `sinceTick`, acknowledged records and badge-tier records are returned unchanged.
 * Returns the same array when nothing changes.
 * No trace: the done line's `momentsSettled` counts the changes (no edit to `src/types/trace.ts`).
 */
export function settleUndertakingMomentsAsBadges(
  queue: readonly UndertakingMomentRecord[] | undefined,
  sinceTick: number,
): readonly UndertakingMomentRecord[];
```

It uses no PRNG. It is pure, and `useWarmStart` calls it once, when the warm-up ends. Because the file is engine code, the executor owes the engine gates: the 30-tick CLI smoke and `npm run test:heavy`.

## Content pillar

Content: N/A. The warm brief and the coverage markers are harness configuration under `scripts/cold-playtest/`. Nothing enters `src/data/` except the two overlay strings in the tooltip registry (UI pillar).

## UI pillar

Screenshot tool: Playwright, which is the harness's own browser. The overlay is DOM, and the arrival screen includes the WebGL map, which Playwright renders.

### Player-facing display

- **`WarmStartOverlay`** (new, `src/components/Game/WarmStartOverlay.tsx`): a full-viewport scrim inside the game root, shown only while a warm-up runs. It shows a title, one progress line that updates per chunk, and one line naming The First. It has no buttons, because it cannot be dismissed early and closes itself.
- It uses the existing modal scrim token and fits the 1920×1080 contract with no scrolling (Law 33). It is not a multi-beat flow, so Law 37 does not apply.
- **Arrival:** no new surface. The overlay closes onto the existing paused game. The existing "Time is still. Press Play or Space to let the world move." line is the arrival cue, as it is for every player.

### Player-facing text

This text is seen only through the `?warm` start lever. Today that means the warm playtesters, not a store-page player. It is still held to the laws, because a tester reads it as the game.

| Surface | Exact text the player reads | Complaint class touched | How the player understands it |
|---|---|---|---|
| `WarmStartOverlay` title | "The world moves on" | PC-7 (no direction) | Read with the wait line below it, which tells the player what is happening and what to do: wait, about how long, and how far along it is |
| `WarmStartOverlay` wait line | "Catching up on the seasons you were away. This takes a minute or two." | PC-7 (no direction: "setup runs minutes before anything happens") | **The surface's own answer to PC-7.** It says what is happening (catching up), what to do (wait, implied by "takes a minute or two") and how long. When it closes, the arrival screen's existing "Time is still. Press Play or Space to let the world move." line gives the next step |
| `WarmStartOverlay` progress line (rendered sample: `?seeded` world, `warm=300`, at tick 180) | "Autumn, year 1 — catching up to Winter, year 1" | PC-1 (unexplained terms), PC-7 | Where the catch-up is and where it ends, in the season and year words the top bar already shows ("spring · year 1"). The target is the start tick plus the requested ticks, put through the same helper. No tick count is shown (Law 13; the 2026-09-10 tick-timestamp ruling) |
| `WarmStartOverlay` First line (rendered sample) | "Kael Thornweaver's moments resolve on their own; you can read them afterwards." | PC-4 (the game acts for the player), PC-6 (one fact told two ways) | This is the existing **Lives on** tooltip, `ui.attention.lives_on`, filled with The First's name. It names the automatic step in the words the toggle already uses, so the two surfaces match word for word. **Where "afterwards" is:** mainly the **chronicle**. Every moment The First's work hits writes a chronicle line (`undertakingCheckpoints.ts:648`), which the player reads on The First's sheet, Chronicle tab ("Timeline"). The Chapter Ledger holds The First's chapters. The thread-row badge and "The Arc So Far" add the most recent survivors of the 8-slot moment queue |
| Arrival: undertaking moments | (no new text). Surviving interrupt-tier moments are re-tiered to badges, unacknowledged | PC-5 (piled-up rows) | **When ten fire at once, none of them pops.** Survivors from the last 48 ticks show as **one** badge on The First's thread row, with a count (`countLabel`) and the newest record's line as its tooltip (`momentBadgeModel.ts`). The full record of what The First's work went through is in the **chronicle**: one line per moment (`undertakingCheckpoints.ts:648`). The player reads it on The First's sheet, Chronicle tab ("Timeline"), and in the world chronicle. The queue holds 8 records for the whole world, so "The Arc So Far" shows only survivors and is not promised as the full record |
| Arrival: decisions raised during the warm-up | The decision's own existing surface, e.g. the ascendant beat offer banner or a story beat, shown one at a time | PC-4 (the game acts for the player), PC-5 | **Nothing is decided for the player.** A decision raised while away waits, and the player meets it on return, the same as any paused world. More than `WARM_START_MAX_ARRIVAL_DECISIONS` waiting is logged (`openInterruptsAtArrival`), and the observer judges it as a PC-5 pile-up |
| Arrival next step | "Time is still. Press Play or Space to let the world move." (`FIRST_RUN_PROMPT_CAPTION`, `ui-content.ts:19`) | PC-7 | It renders because the warm path does **not** call `markClockRan`. So `clockEverRan` stays false, and `firstRunCandidate` (`GameView.tsx:4626`) holds. It appears after `FIRST_RUN_PROMPT_DELAY_MS`, as on a fresh start. Done-when item 1 checks it in the arrival screenshot |

The overlay strings live in the tooltip registry next to the attention entries:

- `ui.warm_start.title` ("The world moves on")
- `ui.warm_start.wait` ("Catching up on the seasons you were away. This takes a minute or two.")
- `ui.warm_start.progress` ("{now} — catching up to {target}")

The First line reuses `ui.attention.lives_on`'s `desc` rather than a copy (Law 17: one home for the copy). `{now}` and `{target}` are filled by the existing season/year display helper.

### Playtest signal

A warm-round tester's log shows them opening at least one of a faction's sheet, a mortal's long work, or a mortal's ambitions. Their debrief's *What I think this game is* mentions the world beyond their own mortal: its powers, its people, or its history.

### Event notifications

None added. Interrupts raised during the warm-up are held by the existing `interruptSuppressedUntilTick`, At the end, held decisions (beats, vignettes, premonitions) wait for the player, unresolved, and undertaking moments are re-tiered to unacknowledged badges. Their events are still recorded in the chronicle and the Chapter Ledger, which do not depend on the interrupt path.

### Debug inspection (DebugPanel)

None added. In dev builds, the existing `window.__DEBUG` tick accessor reports the advanced tick, which is the browser-verify assertion. Production has no bridge, and the console line (§ Tracing) is the production evidence.

### Visual presence (HexMapV2)

None. The map renders the advanced world through its normal path when the overlay closes.

### UI Laws engaged

- **Law 1/17:** the overlay copy comes from the one tooltip registry.
- **Law 13:** season words, never a tick count.
- **Law 14:** no raw keys.
- **Law 21:** The First's name is plain text on a non-interactive scrim. It is not a link, because the overlay has no controls.
- **Law 33:** one viewport, no scroll.
- **Law 42:** plain register, with second person only for the god's own frame. The reused Lives-on line already passes this.

Law 37 (multi-beat chrome) and Law 55 (story continuity) are engaged only by pointing at the Chapter Ledger, which already satisfies them.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md. Rows applied: URL param → component → hook; no GameState field, no orchestrator phase, no new trace type.

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| `parseWarmStartTicks()` (new, beside `parseDevSeedFlags` in `App.tsx`) | none (load time) | passes `warmTicks` to `GameView` | none | none | `console.warn` when ignored |
| `useWarmStart` (new hook, `src/components/Game/hooks/useWarmStart.ts`) | none (drives `runTicksSync` before control is handed over) | `WarmStartOverlay` | reads `gameState.tick` and `phase`; writes nothing new, since attention mode goes through the toggle's existing write path | none (console line, § Tracing) | dev: the `__DEBUG` tick accessor; prod: the console line |
| `WarmStartOverlay` | none | itself; registered in `INTERRUPT_SURFACES` via a new `InterruptSnapshot.warmStartRunning` field | none | none | DOM; dev `getOpenModals()` lists `WarmStartOverlay` |
| End-of-warm-up settle (inside `useWarmStart`) | none | — | `pendingUndertakingMoments` (surviving records re-tiered through `settleUndertakingMomentsAsBadges`; no new field) | none (no new trace event) | done line `momentsSettled` |
| `scripts/cold-playtest/run-round.ps1 -Mode warm` | — | — | — | — | `round.json` gains `mode`, `warmTicks`, `coverage` |
| `scripts/cold-playtest/extract.mjs` (coverage step) | — | — | — | — | `summary.json` gains `coverage` and `warmStartOk` |
| `cold-playtest` skill `--warm` | — | — | — | — | `Docs/ops/warm-playtest-round-N.md` + scorecard on `ops` |

The lane-to-lane wiring extends the cold plan's table. The `tb-cold-playtest` lane runs the skill. The skill writes `warm-playtest-round-N.md` to `ops`. `keep-work-flowing-cc`'s sibling fold reads the newest `warm-playtest-round-*` report, if it is ≤36 h old, into the briefing.

## Interface impact

| Contract (interface-map.md) | Disposition | Note |
|---|---|---|
| UI → engine tick (`runTicksSync` → `runTickBatch`) | **preserve** | Called with a chunk size, exactly as `__DEBUG.tick` calls it today. No signature change |
| UI → attention mode write (the `AutoToggle` `onToggle` path) | **preserve** | The warm-up writes the same field through the same handler, twice (set, then restore) |
| Beat / interrupt emission → UI (`interruptSuppressedUntilTick`) | **preserve** | The existing production suppression is reused, not duplicated. Nothing is auto-resolved. The engine still emits, and chronicle and ledger still record |
| Engine moment queue → UI (`pendingUndertakingMoments`, consumer `GameView.tsx:4638-4650`) | **preserve** | The consumer stays ungated. The warm-up re-tiers its own records through one new pure helper in the queue's single-writer module (`settleUndertakingMomentsAsBadges`) |
| Interrupt registry (`INTERRUPT_SURFACES`) | **extend** | One surface added, `WarmStartOverlay`, following the registry's own "Adding an interrupt surface" rule |

No cross-system read or write is added.

## Constants table

**Game side.** These are named constants in `useWarmStart.ts` (NFP #1).

| Constant | Default | Purpose |
|---|---|---|
| `WARM_START_PARAM` | `'warm'` | URL param name |
| `WARM_START_MAX_TICKS` | `600` | Clamp. 300 measured at 93 s headless on seed 42; tick cost grows with population, so 600 is the ceiling a loading wait can bear |
| `WARM_START_CHUNK_TICKS` | `10` | Ticks per `runTicksSync` call between yields. Keeps the overlay repainting, and keeps the page responsive to Playwright |
| `WARM_START_MAX_ARRIVAL_DECISIONS` | `1` | How many decisions held during the warm-up may wait at arrival before the done line flags a pile-up. The decisions are never auto-resolved |
| `WARM_START_SETTLE_MOMENTS` | `true` | At the end, re-tier interrupt-tier undertaking moments raised during the warm-up to badge tier, unacknowledged. `false` lets them queue as pop-ups, a knob for testing that pile-up deliberately |

**Harness side.** These are new keys in `scripts/cold-playtest/config.json`.

| Constant | Default | Purpose |
|---|---|---|
| `warmTicks` | `300` | "A few hundred ticks" (ticket). Measured world state at 300: phase `playing`, doom stage 1, ~840 agents |
| `warmStartUrl` | `https://threadbearer.co/?view=game&seeded&size=medium&warm={{WARM_TICKS}}` | The warm front door. `size=medium` because `large` stalls (CLAUDE.md) |
| `warmBriefVersion` | `1` | Bumped on any warm brief change, independent of cold's `briefVersion` |
| `warmMinDaysBetweenRounds` | `7` | Spacing for the warm series |
| `warmMilestoneProject` | `Thematic Pressure & Living World` | Where warm round milestones are created |
| `coverageMarkers` | the table in § Coverage | Snapshot text per surface. A copy change is a config edit |
| `minCoveredPersonas` | `2` | Below this, the report headline says the round fell short on coverage (report-only; findings still file) |
| `warmStartLogMarker` | `[warm-start] done` | The console line the extractor requires before a persona counts as usable |

## Tracing

The warm-up adds no trace type: `settleUndertakingMomentsAsBadges` traces nothing, and `src/types/trace.ts` is not edited. It writes one console line on completion, in production and dev alike:

```ts
// Logged once when the warm-up ends (normally or early).
// Read by extract.mjs from shots/console-*.log.
interface WarmStartLogLine {
  marker: '[warm-start] done';
  requested: number;        // ticks asked for, after the clamp
  advanced: number;         // ticks actually run
  stoppedEarly: null | 'phase' | 'error';
  ms: number;               // wall-clock for the whole warm-up
  firstModeRestored: 'pause' | 'auto_resolve';
  momentsSettled: number;      // interrupt-tier undertaking moments re-tiered to badge
  pendingInterruptsAtArrival: number; // unacknowledged interrupt-tier moments left; expected 0
  openInterruptsAtArrival: string[];  // INTERRUPT_SURFACES ids that open once suppression clears, including those
                                      // interruptsSuppressed does not gate (ChoiceSetModal,
                                      // EmergenceDilemmaModal, DivineReceiptModal); expected length <= WARM_START_MAX_ARRIVAL_DECISIONS
}
// e.g. [warm-start] done {"requested":300,"advanced":300,"stoppedEarly":null,"ms":71234,"firstModeRestored":"pause","momentsSettled":4,"pendingInterruptsAtArrival":0,"openInterruptsAtArrival":["StoryBeatModal"]}
```

On the harness side, inspectability is the round's artifacts, as for cold, plus the `coverage` block in each `summary.json` and the Coverage table in the report.

## Fail-soft table

| Failure case | Fallback |
|---|---|
| `warm` present without `?view=game&seeded` | Ignored, with one `console.warn`. The game starts normally |
| `warm` not a number, or < 1 | Ignored, with one `console.warn` |
| `warm` > `WARM_START_MAX_TICKS` | Clamped, and the clamp is logged in the done line's `requested` |
| A chunk throws | The warm-up stops at the tick reached. `stoppedEarly: 'error'`, and the error goes to `console.error`. The end-of-warm-up steps still run: surviving moments settled, attention mode restored, suppression cleared. Then the overlay closes. The game is never left blocked behind the scrim |
| The world reaches `twilight` / `harvest` mid-warm-up | Stop at once with `stoppedEarly: 'phase'`. The tester plays whatever phase it is, and the report notes it |
| The First has no thread (the bond did not happen) | Skip the attention-mode set and restore. Warm up anyway, and log `firstModeRestored` as the unchanged mode |
| Moments are still queued, or an ungated interrupt is open, at arrival (`pendingInterruptsAtArrival > 0` or `openInterruptsAtArrival` non-empty, e.g. a choice set raised on the last tick) | The moment consumer shows them one at a time, as for any player. The done line records the count, the extractor copies it into `summary.json`, and the observer reads it before calling a pile-up a finding. Done-when item 1 requires 0 on the live build |
| Several decisions were raised during the warm-up | They wait, one at a time, through the registry's existing ordering. `openInterruptsAtArrival` lists them, and above `WARM_START_MAX_ARRIVAL_DECISIONS` the observer reads it as a pile-up finding. They are never auto-resolved |
| The tester's console log lacks the done marker | Persona unusable, `failure: warm-start`. The round is void below `minUsablePersonas`, exactly as for cold |
| No snapshot matched any marker for a tester | Coverage failure for that tester (§ Coverage). Findings still verified and filed |
| Markers miss because copy changed | Caught by the calibration check (Done when, item 4) and the first warm dry run. Fix by editing `coverageMarkers`, never by loosening the coverage-failure rule |
| Shots pruned before coverage was read | `extract.mjs` runs before the prune step in `run-round.ps1`, so the order guarantees it |
| Both cold and warm gates open on one fire | Cold runs; warm waits for the next fire |

## Three-pillar check

- [x] Engine pillar present (minimal: one additive pure helper, `settleUndertakingMomentsAsBadges`; `runTickBatch` unchanged)
- [x] Content pillar present (N/A with rationale: harness text, not game content)
- [x] UI pillar present (start lever, overlay, exact text, Laws named)
- [x] Wiring section connects them (URL → hook → overlay; harness → skill → lane → briefing fold)

## Vision audit

- [x] This plan does not contradict any Vision premise. It tests the store-page premise past its first ten minutes: a god following mortals' lives in a living world.
- [x] No Vision edit needed.

## Rulebook impact

- [x] This plan does not change a rule of play. The warm-up runs the existing rules for N ticks, with The First on the existing **Lives on** mode.
- [x] N/A.

> Brainstorm companion: `Docs/plans/2026-10-05-thr-1744-warm-playtest-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Tick count, clamp, chunk, spacing, markers and the coverage bar are all named constants or config keys |
| 2. Inspectability | PASS | The done line records requested/advanced/stopped/ms/mode. The per-tester coverage block names the marker that matched. Raw snapshots are kept with the round |
| 3. Determinism | PASS with note | The world is `?seeded` plus a fixed tick count through the seeded pipeline, so a build reproduces the same warm world. The tester is an LLM and is not deterministic, so rounds compare as trends, as with cold |
| 4. Fail-soft | PASS | See the fail-soft table. The warm-up never leaves the game blocked, and a bad param is ignored |
| 5. Narrative over mechanical perfection | PASS | It measures whether the mid-game reads as a story to a player, which no current check does |
| 6. Additive over destructive | PASS | One new URL param, one hook, one overlay, two registry strings. The harness, skill and lane gain a mode, and cold behaviour is unchanged |
| 7. Performance budget | PASS with note | Load-time only: ~1–2 min of warm-up behind the overlay, chunked so the page stays responsive. Normal play is untouched. The lane spends at most one round (~$12–15 notional) per fire |

## Kill criteria

How we will know this plan was wrong, and what happens then. The executor and the lane read these here; they are not only in the action proposal.

1. **Warm round 1 has ≥2 coverage failures with the v1 brief.** The curiosity line is not enough. The next step is a `warmBriefVersion` bump, never a looser coverage bar. If v2 also fails, the finding is that the mid-game is unreachable from the main screen, and it is filed as a `design` finding.
2. **The warm-up on the live build exceeds 180 s at any `warmTicks` ≥ 100, or arrival is a pile-up.** Pile-up means `pendingInterruptsAtArrival > 0`, or more than `WARM_START_MAX_ARRIVAL_DECISIONS` decisions waiting, on two consecutive rounds. The lever is the wrong shape. Pull the param, and raise a saved-world feature as a product decision.
3. **Two consecutive warm rounds file only findings that cold rounds had already filed.** Warm adds no signal. The weekly retro retires the warm mode under the six-week sunset rule.

## Done when

- [ ] 1. **The lever works on the deployed build.** `https://threadbearer.co/?view=game&seeded&size=medium&warm=300` shows `WarmStartOverlay`, then lands paused on the game screen.
  - Four-part browser evidence: a 1920×1080 screenshot of the overlay and one of the arrival; the console output, including the `[warm-start] done` line with `advanced: 300`; on the dev build, the `window.__DEBUG` tick accessor reading ≥ 300 after the overlay closes; and a UI-Laws judgment line for Laws 1, 13/14, 17, 21, 33 and 37.
  - The First's toggle reads what it read before the warm-up ("Asks you" on a fresh `?seeded` world).
  - The done line shows `pendingInterruptsAtArrival: 0` and at most `WARM_START_MAX_ARRIVAL_DECISIONS` entries in `openInterruptsAtArrival`. No undertaking moment pops.
  - The arrival screenshot shows "Time is still. Press Play or Space to let the world move.". If a decision waits, the screenshot is taken after the tester-equivalent closes it.
  - A test proves no beat was resolved by the warm-up: a beat pending at the end is still pending after it.
  - If `momentsSettled > 0`, a screenshot shows either the moment badge on The First's thread row or the entries under "The Arc So Far" on The First's Journey tab.
  - On the dev build, `getOpenModals()` lists `WarmStartOverlay` while it is up and nothing once it closes.
- [ ] 2. **The warm-up time on the live build is quoted** from the done line's `ms`. If it exceeds 180 s, lower `warmTicks` until it does not, and say so in the closing comment.
- [ ] 3. **Unit tests** for `parseWarmStartTicks` (missing, non-numeric, < 1, clamp, without `seeded`) and for `useWarmStart`. On a normal end, on a thrown chunk and on a twilight stop, it must:

  - restore the attention mode;
  - clear `interruptSuppressedUntilTick`;
  - re-tier exactly the unacknowledged interrupt-tier moments raised at or after the start tick to `presentation: 'badge'`, leaving them unacknowledged and leaving earlier records untouched. A unit test on `settleUndertakingMomentsAsBadges` covers this, and a second checks that the settled records still pass `isMomentBadgeable` and appear in `getAgentArc`;
  - close the overlay.
- [ ] 4. **Coverage calibration.** `node scripts/cold-playtest/extract.mjs --coverage-only <dir>` run on each cold round-2 persona directory reproduces this plan's baseline: faction, undertaking and ambition `—` for all three testers, and thread history reached by all three. Paste the output.
- [ ] 5. **Harness.** `config.json` carries the warm keys, `player-brief-warm.md` matches Appendix B, and `run-round.ps1 -Mode warm` writes `round-N` under `%USERPROFILE%\.threadbare\warm-playtest\` with `mode`, `warmTicks` and per-persona `coverage` in `round.json`.
- [ ] 6. **Skill and lane.**
  - `.claude/skills/cold-playtest/SKILL.md` has a `--warm` mode: the warm gates, warm milestones in `Thematic Pressure & Living World`, the `warm-playtest` label, the Coverage table, the scorecard columns, and the one-round-per-fire rule. Its `last_validated_against` is bumped.
  - The prompt mirror `Docs/ops/scheduled-task-prompts/tb-cold-playtest.md` and the registry row say the lane runs both modes. The executor updates the live task prompt if its session has the scheduled-tasks tool. Otherwise the closing comment records `Needs attended update: tb-cold-playtest prompt` with the mirror's link.
- [ ] 7. The label `warm-playtest` exists. `keep-work-flowing-cc` step 2.6 lists `warm-playtest-round-*`.
- [ ] 8. **One warm dry run** (`/cold-playtest --warm --dry-run`) completes against the deployed build with `usable ≥ 2`. Its report is published to `ops`.
- [ ] 9. **Warm round 1** runs against the deployed build in attended mode, which skips gates 1 and 3. Its report is on `ops` as `Docs/ops/warm-playtest-round-1.md`, in the cold-round shape: a verdict table, findings filed into milestone `Warm playtest · round 1`, and a "Not filed" section with reasons.
  - The report's Coverage table shows every tester's surfaces. A tester who reached none of faction / undertaking / ambition is listed as a coverage failure, not a clean pass.
  - Its scorecard rows are in `warm-playtest-scorecard.tsv`.
- [ ] 10. Code gates per `Docs/canon/verification-gates.md`: `npm run gate`, then `npm run gate -- --final` last. The UI pillar owes the browser evidence in item 1.
- [ ] 11. The closing commit body and the PR body each include `Fixes THR-1744` on its own line.

## Coordination block

**Suggested model:** opus. It crosses a production code path (a start lever in the shipped build), a harness extension, a skill mode and a lane prompt, and it ends by running and verifying a real playtest round.

**Parallel-safe with:**
- THR-1702: engine clue decay only.
- THR-1740: engine forecast window only.
- THR-1742: content and engine, no shared files.

**Mutex with:**
- **THR-1730**, which changes how The First's minimised moments wait (`useSimulation` / attention-mode territory). The warm-up relies on **Lives on** letting The First's encounter steps resolve without stopping the world. Undertaking moments are a separate path, interrupt-tier whatever the mode, and are handled by the settle step. Build after it, or rebase onto it and re-run Done-when item 1.
- **THR-1713**, which adds tooltip-registry entries in `src/data/ui-content.ts`. Both edits are additive in the same file, so rebase on conflict.
- Any open ticket editing `.claude/skills/cold-playtest/SKILL.md` or `scripts/cold-playtest/`, because they are the same files.

**Files to touch:**
- Create:
  - `src/components/Game/hooks/useWarmStart.ts`
  - `src/components/Game/WarmStartOverlay.tsx`
  - tests beside both
  - `scripts/cold-playtest/player-brief-warm.md`
- Edit:
  - `src/engine/undertakingMoments.ts`: add `settleUndertakingMomentsAsBadges` (additive).
  - `src/components/Game/hooks/useSimulation.ts`: give `runTicksSync` an options argument, `{ markClock?: boolean }`.
  - `src/App.tsx`: `parseWarmStartTicks`, passed to `GameView`.
  - `src/components/Game/GameView.tsx`: mount the hook and overlay; hand the hook `setInterruptSuppressedUntilTick` and the attention toggle handler; add `warmStartRunning` to the snapshot.
  - `src/components/Game/interruptRegistry.ts`: one `InterruptSnapshot` field and one `INTERRUPT_SURFACES` entry.
  - `src/data/ui-content.ts`: three `ui.warm_start.*` entries.
  - `scripts/cold-playtest/config.json`, `run-player.ps1` (`-Mode`), `run-round.ps1` (`-Mode`; extract before prune) and `extract.mjs` (coverage + `--coverage-only`).
  - `.claude/skills/cold-playtest/SKILL.md`
  - `.claude/skills/keep-work-flowing-cc/SKILL.md` (pattern list)
  - `Docs/ops/scheduled-task-prompts/tb-cold-playtest.md`
  - `Docs/ops/scheduled-tasks-registry.md` (row text)

## Notes for the executor

- **Do not route the warm start through `window.__DEBUG`.** It is compiled out of production (`debug-bridge.ts:8`), and the tester cannot run page scripts anyway. The lever must work from the URL alone.
- **Reuse `runTicksSync`; do not write a second tick loop.** `runTicksSync` calls `markClockRan('debug')` (`useSimulation.ts:181`). That sets `clockEverRan` and hides the arrival cue. Give `runTicksSync` an options argument `{ markClock?: boolean }`, defaulting to `true` so `__DEBUG.tick` is unchanged, and pass `false` from the warm path.
- **Do not use `acknowledgeUndertakingMoment` to settle the warm-up's moments.** An acknowledged record leaves the badge (`momentBadgeModel.ts:84-85`). Use the new `settleUndertakingMomentsAsBadges`.
- **The attention mode goes through the toggle's own write path.** It is the `onToggle` handler `GameView` passes to `AutoToggle`. Do not poke the field directly, or the toggle's display and the engine can disagree (PC-6).
- **Brief wording is load-bearing.** Copy the playtest-log block from `player-brief.md` verbatim into the warm brief. Never ask the tester about its own instructions.
- **The coverage-failure rule is deliberate.** Thread history alone does not clear it, because cold testers already reach it. Do not loosen it to make a round pass. If testers miss the mid-game, that is the finding.
- **Throttle compliance.** Warm rounds file product findings (Bug / Game Design), as cold rounds do. The lane gains no process-ticket filing.
- **Do not run round 1 before the lever is deployed** (`npm run check:deploy` says `deployed` for the merge commit). The dry run and round 1 both play the live build.
- **Level-system rule.** A warm report's `## Needs Christian` is a status report (the verdict trend, coverage, top findings, all as links), never a review invitation.

## Appendix A — decisions taken under delegation (design lane, 2026-10-05)

The ticket assigns these questions to the design session ("It decides these questions; the answers are not prescribed here"). Each was decided against measured substrate, and each is open to veto.

| Question | Decision | Would change the call |
|---|---|---|
| Start state | A `?warm=<ticks>` URL lever on the `?seeded` world, using the existing tick pipeline, with The First on **Lives on** during the warm-up | A wish for testers to inherit *their own* opening choices, which needs a save/import feature this game does not have |
| Brief and personas | The same three personas. A separate warm brief: "you played the opening an hour ago and are coming back", plus a curiosity line in player words that names no panels | "Don't steer them at all". The coverage bar would then likely fail, which is itself a finding |
| Coverage | Snapshot-text markers per surface. A coverage failure is reaching none of faction / undertaking / ambition | "Thread history should count". It would pass every cold tester today |
| Lane shape | A mode of `cold-playtest` and `tb-cold-playtest`, one round per fire, cold first | "Run both the same day". That doubles the daily spend ceiling |
| Filing | Its own `Warm playtest · round N` milestones in Thematic Pressure & Living World, label `warm-playtest` | A preference to keep all playtest milestones in one project |

## Appendix B — `scripts/cold-playtest/player-brief-warm.md` (warm brief v1)

The playtest-log section, the budget section and the debrief section are copied **verbatim** from `player-brief.md` (brief v1). Only the opening sections below differ. `{{PERSONA}}`, `{{START_URL}}` and `{{ACTION_BUDGET}}` are filled by `run-player.ps1` as for cold.

```markdown
You are a playtester coming back to a browser game you started about an hour ago. You are playing through a browser you control with tools.

## What you know about the game (the store page)

**Threadbearer** — *A turn-based god-game of mortal stories in a living world.*

> You are a new god, watching a world you didn't make. A handful of mortals catch your eye — a swordbearer, a scholar, a refugee. You follow their lives like chapters of a book, and when the moment matters you whisper, nudge, or send a dream. Their choices are theirs. The story becomes yours.

## What you remember from your first hour

You woke as a new god. You met a mortal and bound your fate to theirs; the game calls them your First. You remember that time can be paused and played, and that you can whisper to mortals. You do not remember the details of any screen. While you were away, the world kept going.

This session you are curious about the world beyond your own mortal: who holds power here, what your mortal is working towards, and what has happened while you were gone.

## Who you are

{{PERSONA}}

Stay in character as this player: your patience, your expectations, what you notice and what you skip. You have played this game for about an hour, so the first screens are behind you.

## How to play

- Start at {{START_URL}} and play the game the way a real person would. Do not type other URLs, add URL parameters, or open developer tools.
- The world may take a minute or two to catch up when it first loads. If you see it still moving on its own, wait (browser_wait_for) until it settles before you act.
- **Your eyes are the screenshot.** (… the rest of the cold brief's How-to-play bullets, verbatim …)
```

## Intent-judge verdict

The judge ran four rounds, each on opus in a cold context with the proposal at `Docs/plans/.intent-proposals/thr-1744-warm-playtest.md`.

- **Round 1: Revise.**
  - The impact class was corrected to External.
  - Wiring missed the existing interrupt suppression and the moment queue.
  - There were no kill criteria.
  - PC-7 (the overlay never said to wait) was unanswered.
- **Round 2: Revise.**
  - Acknowledging a moment removes it from the badge.
  - `markClockRan` would hide the arrival cue.
- **Round 3: Revise.**
  - The moment queue is world-wide with 8 slots, so the "every moment" claims were false.
  - The new trace event needed a `trace.ts` edit.
  - The beat dismissal made the player's choices for them, so it was dropped.
- **Round 4: Allow.** Its three cleanups (stale beat wording, the THR-1730 mutex premise, JourneyTab line numbers) were applied.

Every fix was verified against source by the judge.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-10-05*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | Game-side constants table (`WARM_START_MAX_TICKS`, `WARM_START_CHUNK_TICKS`, `WARM_START_SETTLE_MOMENTS`) plus harness config keys (`warmTicks`, `coverageMarkers`, `minCoveredPersonas`). |
| 2. Inspectability | PASS | The `[warm-start] done` line records requested, advanced, stoppedEarly, ms, momentsSettled and openInterruptsAtArrival. The wiring table maps every module. Coverage block per tester. No new trace type, with the rationale stated. |
| 3. Determinism | PASS-with-note | `?seeded` plus a fixed tick count gives the same world. The LLM tester varies, and the plan acknowledges it. `settleUndertakingMomentsAsBadges` uses no PRNG. |
| 4. Fail-soft | PASS | 12-row fail-soft table. A thrown chunk still runs the end steps. Bad params are ignored. The overlay never blocks. |
| 5. Narrative over mechanical | PASS | Nothing is auto-resolved for the player. The chronicle is kept as the record. Season words, not tick counts. |
| 6. Additive over destructive | PASS | New param, hook and overlay. One additive pure helper. The `runTicksSync` options default to today's behaviour. Cold mode is unchanged. |
| 7. Performance budget | PASS-with-note | 300 ticks measured at 93 s. Load-time only, chunked, clamped at 600. A kill criterion fires above 180 s. The 600 clamp is unmeasured on the live build and deferred to Done-when item 2. |

NFP AUDIT: PASS-with-notes

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | present-and-substantive | One additive pure helper in the queue's single-writer module. No PRNG, no tick phase. The trace decision (none) is stated, with constants and fail-soft coverage. Thin by design, and the plan says so. |
| Content | N/A-with-rationale | The warm brief and coverage markers are harness text. The only `src/data` strings are the overlay strings, which the UI pillar covers. |
| UI | present-and-substantive | Overlay spec, exact-text table with PC-class mapping, playtest-signal predicate, event notifications, debug inspection, hex-map (none) and named UI Laws. The screenshot tool, Playwright, is named. |

The wiring section is present and covers URL → hook → overlay → registry → harness → lane. The substrate inventory is present. A grep of `systems-inventory.md` for warm / fast-forward / `runTicksSync` / `interruptSuppressed` found nothing duplicated. Save/load and a second tick loop are explicitly declined. Note: the substrate rows cite source rather than inventory names; the grep found no conflict.

PILLAR AUDIT: PASS-with-notes

### Vision audit

**Premises touched:**

- **00-north-star.** Confirmed: the plan tests whether second-hour play is reachable at all.
- **01-core-loop.** Extended: arrival re-tiers moments into one badge instead of a pile of pop-ups, and decisions wait one at a time.
- **02-non-negotiables.**
  - #1, god not protagonist: confirmed. Nothing is auto-resolved for the player; `dismissOpenBeatInterrupts` is explicitly rejected.
  - #2, narrative over mechanics: confirmed.
  - #3, prose not numbers: confirmed. Season words, never tick counts.
  - #5: confirmed.
- **03-design-tensions.** #2 and #4 are touched through the PC-class rows.
- **Taste profile.** Confirmed: no raw numbers reach the player.

**Contradictions:** none found.

**Notes:**

- About 300 ticks of the First's emphasis moments collapse into badges and chronicle lines, so the "this matters" framing for that stretch is lost. The plan says so openly.
- Lives on during the warm-up leans toward divine remove and emergence over attachment. The plan names the chronicle as the way back in.
- The plan's Vision audit cites premises by substance, not by file path.

VISION AUDIT: PASS-with-notes
