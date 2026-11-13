> **title:** Stop the world only for real decisions — an ending the god had no part in waits on its badge, a Fated step with only a dealt hand plays out on a short fuse, and a dealt hand reads how hard the step is (THR-2203)
> **linear_issue:** THR-2203
> **author:** Claude Code (design lane, run dl-20261113T1119Z)
> **created:** 2026-11-13
> **three_pillars:** Engine done (two slices) · Content done (badge and tooltip lines, deal constants) · UI done (badge states, Ledger row, law text)

Plan-size-exempt: two-slice programme doc. The stop rule and the hand variety are filed as separate build tickets, but they share one census, one Law-27/UI-Law-39 argument and one player-text table, and the gate tail (three intent-judge runs, three audits) is recorded inline.

# Stop the world only for real decisions (THR-2203)

*The 2026-11-12 session found the opening stop-start. Each press of Play was halted within a second, often by an ending that said "Nothing in it waited on your hand", or by a chapter that opened at "Fated" and was won with no card played. The template chapters dealt the same four cards every time. This plan makes the world stop only when the god has a choice to make or a result of its own to read. It also makes the dealt hand change with the step, without a shuffle.*

## Why this is load-bearing

Christian approved this direction on 2026-11-12 ("Yes, file them"): ticket 3 of 5, "make the middle a game". The ticket's title states the outcome. The evidence is the expert session (ticket body) and warm round 3's [THR-2174](https://linear.app/threadbare/issue/THR-2174). Its 2026-11-05 decision gave every chapter a "Waits for you" / "Theirs alone" word from the same rule as the hold. It left the ending of a "Theirs alone" chapter stopping the world.

## Substrate inventory

Measured on main @ 80720d45.

| Subsystem | Status | Finding | This plan |
|---|---|---|---|
| Step hold: `playerStepHold.ts:80-93` `stepOffersPlayerMove` (`nudges.length > 0 \|\| deal !== undefined`), poster `encounterVisibility.ts:697-704` | 🟢 ACTIVE (THR-2140) | A step with no move is posted `resolved` + `noPlayerMove` and never opens. Any step with a hand opens, whatever its odds. | **extends**: a pure-dealt Fated step gets a fuse |
| Chapter word: `chapterWaitWord` (`playerStepHold.ts:139-151`), shown by `ChapterWaitWord.tsx` on the Ledger, Chronicle and Stage; ending line `aloneLineFor` (`buildUnifiedEncounterStageModel.ts:318-322`) | 🟢 ACTIVE (THR-2178) | "Theirs alone" = no step offers a move; "Waits for you" = some step does. The alone line ("Nothing in it waited on your hand") shows only on "Theirs alone" chapters. | **keeps** the word (it says whether your cards *could* enter); **adds** one ending line for a chapter that waited and was left untouched |
| Aftermath poster: `encounterVisibility.ts:718-791` | 🟢 ACTIVE | Posts an aftermath for every resolved threaded action, skipping only `invisible` / `background` tiers and routine work. Never asks whether the god took part. A pause thread's notification has `autoResolveTick: null` (`:153-155`), so it auto-opens. | **extends**: an untouched ending is badge-only |
| Auto-open gate: `encounterNotificationRuntime.ts:99-105` `shouldAutoOpenEncounterNotification` | 🟢 ACTIVE | `noPlayerMove` → no; else `!resolved && autoResolveTick === null`. | **extends**: `badgeOnly` → no |
| God's part: `unifiedActionResolution.ts:1174` `godTouchedEncounter` (cards active, or any choice-history entry with a commit, essence spent or `handCommitted`) | 🟢 ACTIVE | Already the one "did the god touch this" predicate. | **reads** |
| Thread-row badge: `encounterBadgeModel.ts:170-200` | 🟢 ACTIVE | `aftermath` badge "concluded — open aftermath"; `encounter` badge "open encounter" / "waiting for you". | **extends**: a Fated-fuse state |
| Base forecast: `buildNudgePhaseModel.ts:759` `forecastActionAtScale(forecastInput, scale).forecastTier`; tiers `outcomeForecast.ts:44-51` (Fated > 0.8) | 🟢 ACTIVE | The forecast before any card, the same call the dice use (THR-1535, Law 18). A `local`-scale step never rolls below 0.65, which is why many template steps open Fated. | **reads**: lifted into one helper |
| Dealer: `dealHand.ts:346-416` | 🟢 ACTIVE (THR-1247) | Score = sphere (3/2/1/0) + tags (2 each) + earned (+1). The fill takes one sphereless card, then a sphere-spread pass until `DEAL_SPHERE_COVERAGE_MIN = 4` spheres, then score order. Ties break on id. A two-sphere god never reaches 4, so the spread pass takes every signature card whatever the step is about. | **changes** the fill and adds one term |

**Why the template hands are identical** (measured by a census of every step that declares `deal`, run on the never-merged branch [proto/thr-2203-deal-census](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-2203-deal-census)). 788 templates, 141 deal, on 315 steps. For a new god, 24 gods in all (12 hungers × 2 sphere pairs), **one hand is dealt on 67% of all 315 steps on average** (mean 8.1 distinct hands). For the witness god with Mind and Spirit, all nine dealing steps of Tend the Shrine, Shadow in the Night, The Refugee Aid and The Inheritance Wake get Read The Architecture, Plant An Urge, Kindle A Wanting and Press The Odds. The causes:
1. The hunger card (+1 earned) always beats the four core cards for the sphereless slot.
2. The spread pass takes both signatures.
3. The four core cards carry no tags, so the last slot is always Press The Odds on the id tie-break.

Step tags only reorder cards already chosen.

## Decisions (made by the design lane under delegation, 2026-11-13 — veto in chat)

These are the *how* of an agreed direction ("stop the world only for real decisions"). They change no card, odds, outcome or cap. Law 29 holds: every chapter still happens, and only whether it halts the clock changes.

1. **An ending the god had no part in waits on its badge.** The aftermath of a chapter where `godTouchedEncounter` is false is posted `badgeOnly`. It never auto-opens and never stops the clock. It shows on the thread row's aftermath badge, the Ledger row ("Theirs alone") and the Chronicle, exactly as a set-down moment does today. An ending the god touched, even with an empty committed hand, still stops: the player chose to be there.
2. **A Fated step with only a dealt hand plays out on a short fuse.** A step is fused when all three hold: the mortal's thread asks (pause mode); the step's forecast before any card is Fated; and the step authors no nudges, so its whole hand is dealt from the Repertoire. It is posted with `autoResolveTick = tick + FATED_STEP_FUSE_TICKS`. That is the existing non-opening, non-holding path the "Lives on" threads use (`encounterVisibility.ts:153-155`). The thread row shows a Fated badge for the fuse. Opening it shows the normal Stage and stops the world, as any badge opened by hand does (THR-2197). Left alone, the step resolves with no cards. Its ending is then untouched, and so badge-only (decision 1).
3. **Authored hands always stop.** A step with even one authored nudge stops at any forecast. Authored cards leave things behind (omens, ambitions, marks), so even a Fated step offers a choice there. This protects Flawed Steel, The Boundary Survey and The Well Sinking, the moments every tester round names as best.
4. **The dealt hand reads how hard the step is.** For the four core cards, the dealer adds `DEAL_STAKES_WEIGHT` by the step's authored `difficulty`:
   - easy (below `DEAL_STAKES_EASY_BELOW`): the protective riders, Buy The Floor and Spare The Worst;
   - middle: the free card, Draw On Character;
   - hard (at or above `DEAL_STAKES_HARD_FROM`): the two cards that move the odds, Press The Odds and Draw On Character.

   Difficulty is template data, so the hand stays the same for the same god at the same step (Law 21: no shuffle, same hand on reload). On an easy step, the only move worth paying for is protection against the rare collapse, which "Fated fails" ([THR-2171](https://linear.app/threadbare/issue/THR-2171)) showed matters.
5. **The sphere-spread pass takes only the god's primary sphere.** The primary signature is who the god is, and it is always offered. The secondary competes on score like any other card.

Rejected, one line each ([brainstorm](2026-11-13-thr-2203-stop-only-for-real-decisions-brainstorm.md)):
- **Stop on Fated steps with authored cards too:** it breaks decision 3's protection.
- **Read the live forecast in the dealer:** the resolution path re-derives the hand (`unifiedActionResolution.ts:658`), so a forecast that moved between render and roll would change the committed hand.
- **Tag the core cards by theme (might, lore):** they are tools, not themes. Tags would make, for example, mercy a "social" card, which nothing about it says.
- **Cap how many chapters stop per day:** Law 29 forbids rationing.
- **Shuffle:** Law 21.

**Census of decisions 4 + 5** (arm D on the proto branch, the same 24 gods): **the modal hand falls from 67% to 27% of dealing steps, and the mean distinct hands rise from 8.1 to 25.1.** The witness god's nine named steps get five different hands. Decision 5 alone (arm B) moved the share by nothing (0.67), so decision 4 carries the change.

## Engine pillar

### Slice A — stop only for real decisions
- `src/types/encounterVisibility.ts`: `EncounterNotification` gains optional `badgeOnly?: 'untouched_ending'` and `fatedFuse?: true` (additive).
- `src/engine/views/stage/baseStepForecast.ts` (new, pure): `baseStepForecastTier(state, action, template, stepIndex): ForecastTier | undefined`. It is lifted from `buildNudgePhaseModel.ts:750-763`, which then calls it, so the Stage and the poster read one call (Law 18). It returns `undefined` on any throw.
- `encounterVisibility.ts` step poster (`:697`): after the `noPlayerMove` check, when `FATED_STEP_FUSE_ENABLED` is on, the thread is pause, `(step.nudges?.length ?? 0) === 0`, `step.deal` is present and `baseStepForecastTier(...) === 'fated'`, it sets `autoResolveTick = tick + FATED_STEP_FUSE_TICKS` and `fatedFuse = true`.
- `encounterVisibility.ts` aftermath poster (`:718-791`): when `UNTOUCHED_ENDING_BADGE_ENABLED` is on and `!godTouchedEncounter(action)`, it sets `badgeOnly = 'untouched_ending'`.
- `encounterNotificationRuntime.ts:99` `shouldAutoOpenEncounterNotification`: `if (notif.badgeOnly) return false;` (`fatedFuse` already fails the `autoResolveTick === null` test).
- The fuse resolves through whatever already resolves a "Lives on" step at its `autoResolveTick`. The executor confirms that path runs for a pause-thread action and adds the branch if it does not (grey zone 1).

### Slice B — a hand that reads the step
- `dealHand.ts` scoring (`:346`): `stakesTermFor(member, step.difficulty)`. It applies only to members with no sphere whose `typeId` is in `DEAL_STAKES_TYPES[band]`, and adds `DEAL_STAKES_WEIGHT`. It is reported as a new `stakesTerm` on `DealCandidateReport` (additive), so `__DEBUG.getRepertoire().lastDeal` shows it.
- `dealHand.ts` spread pass (`:397`): skip any candidate whose sphere is not `context.primarySphere` while `DEAL_SPREAD_PRIMARY_ONLY` is on.
- `dealHand`'s step parameter widens to `Pick<ActionStep, 'nudges' | 'deal' | 'difficulty'>` (optional read). Both call sites already pass the full step.

### Tick phases
Slice A runs in the encounter-visibility post (the step and aftermath posters, once per tick), and the fuse resolves in the existing auto-resolve check at `autoResolveTick`. Slice B runs in no phase: it runs at Stage render and at resolution's hand re-derivation.

### Graph nodes / edges · PRNG
None new. No new draw; the deal stays PRNG-free. The fused step rolls on the existing marble bag, as every threaded step does (Law 4).

## Content pillar

### Data tables
- `src/data/encounter-experience-constants.ts`, beside the forecast thresholds: `FATED_STEP_FUSE_ENABLED`, `FATED_STEP_FUSE_TICKS`, `UNTOUCHED_ENDING_BADGE_ENABLED`.
- `src/data/nudge-constants.ts`, beside `DEAL_*`: `DEAL_STAKES_WEIGHT`, `DEAL_STAKES_EASY_BELOW`, `DEAL_STAKES_HARD_FROM`, `DEAL_STAKES_TYPES`, `DEAL_SPREAD_PRIMARY_ONLY`.

### Player-facing lines (`src/data/ui-content.ts`)
- `ui.badge.fated_fuse` (badge aria and meta): "{chapter}, Fated — plays out soon unless you step in".
- `ui.badge.fated_fuse.tooltip`: "Fated: their odds are high before any card of yours. It plays out on its own within the day unless you open it. Your cards can still guard against the worst." The tooltip states no probability (Law 7: the bag stays invisible). `FATED_STEP_FUSE_TICKS` is 8 ticks, 16 in-world hours, so "within the day" is true. A fuse above 12 ticks needs the wording changed with it.
- **The words agree by one rule (THR-2174's "cannot disagree").** The chapter word stays the THR-2178 word, read off the template. "Waits for you" means your cards could enter it; "Theirs alone" means they could not. Whether the god actually played is a second fact, `godTouchedEncounter`. It is shown only after the chapter ends, by the badge meta and the ending line below. A chapter that waited and was left untouched therefore reads "Waits for you" on the Ledger and "without your hand" on its badge and ending. The two say different things, and both are true.
- Badge **meta** (visible under the chapter name on the thread row, and in the aria label), set by `encounterBadgeModel` for a `badgeOnly` ending:
  - `ui.badge.untouched_ending.alone`: "theirs alone · open to read" (the word was "Theirs alone");
  - `ui.badge.untouched_ending.unplayed`: "played out without your hand · open to read" (the word was "Waits for you");
  - `ui.badge.untouched_ending.bad`: "went badly without your hand · open to read" (either word, final band `near_miss` or worse). It also takes the band's existing accent colour (`bandAccentColor`, the badge already colours by `outcomeBand`), so a loss looks different from a win before it is read.
- `ui.aftermath.unplayed_line` (ending line, `aloneLineFor`, for a "Waits for you" chapter the god never touched): "{name} played this chapter out without your hand." A successful fused step ends with this line.
- `ui.aftermath.fated_fuse_failed` (the ending's alone line, `aloneLineFor` in `buildUnifiedEncounterStageModel.ts:318`, when a fused step landed below success): "This step was Fated, and Fated is likely, never certain. It went against {name} while it played out alone." It answers THR-2171's "a Fated step broke and nothing said why".

### Encounter templates · Attachment content
N/A. No template changes. The deal reads each step's existing `difficulty` and `deal`. The 315 dealing steps' difficulties span p10 0.03, p50 0.40, p90 0.76 (census), so all three bands are populated.

## UI pillar

### Player-facing display
- **Thread-row badge**: the existing `encounterBadgeModel` gains a Fated-fuse state with its own meta and tooltip. The aftermath badge for an untouched ending uses the existing aftermath icon with the new aria line. No new component.
- **Ledger / Chronicle**: the word is unchanged. The ending line gains the "without your hand" case (`aloneLineFor`).
- **Stage**: unchanged when opened. A fused step opened by hand shows the normal Stage, whose dealt hand now differs by step.
- **Time control**: the stops removed are exactly the ones Law 52's "paused · <encounter>" names today. Nothing new pauses.

### Player-facing text

| Surface | Exact text the player reads | Complaint class touched | How the player understands it |
|---|---|---|---|
| Thread-row badge, fused step | "The Refugee Aid, Fated — plays out soon unless you step in" | PC-2, PC-4 | The game says it is acting without them and how to stop it. |
| Badge tooltip, fused step (before the roll) | "Fated: their odds are high before any card of yours. It plays out on its own within the day unless you open it. Your cards can still guard against the worst." | PC-1, PC-2 | It explains Fated (THR-2171), the fuse in words, and why opening is still worth it. |
| Thread-row badge, ending of a "Theirs alone" chapter | "Heal the Sick" / meta "theirs alone · open to read" | PC-4 | Same word as its Ledger row ("Theirs alone"); the ending is there when they want it. |
| Thread-row badge, ending of a "Waits for you" chapter left untouched (a won fused step) | "Tend the Shrine" / meta "played out without your hand · open to read" | PC-4, PC-6 | Its Ledger row says "Waits for you" (cards could enter); the badge says they did not. Two facts, two words. |
| Thread-row badge, untouched ending that went badly (after the roll) | "Shadow in the Night" / meta "went badly without your hand · open to read", in the failure band's accent colour | PC-2, PC-4 | A loss looks and reads different from a win, before it is opened. |
| Ending line, "Waits for you" chapter left untouched | "Kael Thornweaver played this chapter out without your hand." | PC-4, PC-6 | Replaces the THR-2174 alone line, which would be false here; the alone line stays on "Theirs alone" chapters. |
| Ending line, fused step that failed (after the roll) | "This step was Fated, and Fated is likely, never certain. It went against Kael Thornweaver while it played out alone." | PC-2 | It says why a Fated step can fail, and that the god was not there. |
| Ledger rows (unchanged words) | "Tend the Shrine · Waits for you" · "Heal the Sick · Theirs alone" | PC-4 | The word is still whether cards could enter. |
| Stage hand on an easy step (sample, witness god, census arm D) | "Buy The Floor", "Plant An Urge", "Spare The Worst", "Kindle A Wanting" (The Refugee Aid, step 2); the step after it deals "Read The Architecture", "Plant An Urge", "Draw On Character", "Kindle A Wanting" | PC-8 | The hand changes with the step; guard cards come where the odds are already good. Each card's own face text is unchanged. |

Empty slots (PC-3): a missing `{chapter}` renders "A chapter". Each line has a unit test with an empty slot.

### UI Laws engaged
- **Law 1:** the badge stays where it is read today.
- **Laws 13/14:** the fuse is said in words, never ticks.
- **Law 17:** the Stage still shows the stakes before any spend.
- **Law 21:** opening a badge never commits anything.
- **Law 33:** no new panel.
- **Law 37:** an opened fused step wears the usual chrome.
- **Law 39** is amended (§ Rulebook and law impact).
- **Law 40:** a badge never clears before it opens.
- **Law 52:** the pause still names its cause.

Browser-verify tool: Playwright DOM (`mcp__playwright__*`). Nothing is WebGL.

### Playtest signal
A warm tester names no chapter that "played itself" or "asked me nothing" among their worst moments. A cold tester's first ten minutes show the date moving past "winter · year 1" before their tenth stop.

### Event notifications · Debug · Map
No new toast. The DebugPanel encounter list shows `fatedFuse` / `badgeOnly`. `__DEBUG.getRepertoire().lastDeal` gains `stakesTerm`. No map change.

## Interface impact

| Contract | Kind | Note |
|---|---|---|
| step poster → `EncounterNotification.autoResolveTick` / `fatedFuse` → auto-open gate, badge model | **extend** | Production readers: `shouldAutoOpenEncounterNotification`, `encounterBadgeModel`. |
| aftermath poster → `badgeOnly` → auto-open gate | **add** | Read by the gate. |
| forecast core → `baseStepForecastTier` → Stage + poster | **preserve** | One call, two readers. |
| step `difficulty` → dealer | **add** | Read at both deal sites (Stage, resolution). |

`Docs/canon/interface-map.md` and `scripts/interface-contracts.ts` are updated by each slice's executor.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md — one new module (`baseStepForecast.ts`), wired below.

| Slice | Orchestrator phase | Component | GameState | Trace | Player control |
|---|---|---|---|---|---|
| A | encounter visibility (post) | thread-row badge, GameView auto-open scan | notification fields | `encounter.stop_skipped` | opening the badge |
| B | none (render + resolution) | Stage hand | none | deal report `stakesTerm` | none (the hand itself) |

## Constants table

| Name | Default | Purpose |
|---|---|---|
| `FATED_STEP_FUSE_ENABLED` | true | Switch for decision 2 |
| `FATED_STEP_FUSE_TICKS` | 8 | Fuse before a fused step plays out alone (matches `RETINUE_VIGNETTE_TIMEOUT`, two-thirds of a day) |
| `UNTOUCHED_ENDING_BADGE_ENABLED` | true | Switch for decision 1 |
| `DEAL_STAKES_WEIGHT` | 2 | Score added to the core card the step's difficulty favours (one tag match) |
| `DEAL_STAKES_EASY_BELOW` | 0.25 | Below this, guard cards are favoured |
| `DEAL_STAKES_HARD_FROM` | 0.5 | From this, the odds boost is favoured |
| `DEAL_STAKES_TYPES` | easy: insurance, mercy · middle: trait_card · hard: boost, trait_card | Which core card types each band favours (exactly census arm D) |
| `DEAL_SPREAD_PRIMARY_ONLY` | true | The spread pass guarantees only the primary signature |

## Tracing

```ts
interface EncounterStopSkippedTrace { category: 'encounter.stop_skipped'; tick: number; actionId: string; actorId: string; stepIndex: number; reason: 'fated_fuse' | 'untouched_ending'; forecastTier?: ForecastTier; fuseUntil?: number }
```
`DealCandidateReport.stakesTerm: number` (deal report, debug only).

## Fail-soft table

| Failure | Fallback |
|---|---|
| `baseStepForecastTier` throws or has no input | `undefined` → no fuse; the step stops as today |
| Template or step missing at post | No fuse (the existing `stepOffersPlayerMove` fail-soft `true` holds) |
| `godTouchedEncounter` reads an old record with no history | Untouched → badge; the ending is one click away |
| Step has no numeric `difficulty` | `stakesTerm` 0; today's deal |
| Fuse path does not resolve a pause-thread action | The executor adds it; until then `FATED_STEP_FUSE_ENABLED` stays false in that PR |
| Primary sphere absent (legacy god) | Spread pass runs as today |

## Blast Radius

No ≥100-importer file is touched. `encounterVisibility.ts` and `dealHand.ts` are mid-fan-in engine files. Slice A's changes are guarded by two switches. Slice B's deal change shows on every dealt hand by design, and is pinned by the census test below.

## Files touched

- **Slice A:** `src/types/encounterVisibility.ts`, `src/engine/encounterVisibility.ts`, `src/engine/views/stage/encounterNotificationRuntime.ts`, `src/engine/views/stage/baseStepForecast.ts` (new), `src/engine/views/stage/buildNudgePhaseModel.ts`, `src/components/Game/encounterBadgeModel.ts`, `src/engine/views/stage/buildUnifiedEncounterStageModel.ts` (the failed-fuse ending line), `src/data/ui-content.ts`, `src/data/encounter-experience-constants.ts`; text: `Docs/canon/rulebook.md`, `Docs/canon/rulebook-quick-reference.md`, `Docs/game-design/laws.md`, `Docs/design-system/laws.md`, `TheFantasyWorldSimulator/Vision/01-core-loop.md`.
- **Slice B:** `src/engine/encounters/dealHand.ts`, `src/data/nudge-constants.ts`, `src/debug-bridge.d.ts` (the `stakesTerm` field), and a census test from the proto branch, kept as a real test.

## Done when

**Slice A:**
- [ ] Unit: an untouched ending posts `badgeOnly` and does not auto-open. A touched ending (one committed card, or an empty committed hand) still auto-opens.
- [ ] Unit: a pause-thread step that has a deal, no authored nudges and a base tier of `fated` gets `fatedFuse` and a non-null `autoResolveTick`. The same step with one authored nudge does not. Below Fated it does not.
- [ ] Unit: the badge meta for an untouched ending is "theirs alone" when the chapter word is `theirs_alone` and "played out without your hand" when it is `waits`; the "Waits for you" untouched ending shows the unplayed line, never the alone line. An untouched ending whose final band is `near_miss` or worse renders the "went badly" meta; a fused step that landed below success renders the failed-fuse ending line. Each line has an empty-slot test.
- [ ] Live, `?seeded&size=medium`, `window.__DEBUG.tick(n)` from the bond to tick 740: the run reports every `encounter.stop_skipped` trace. Every fused step resolves within `FATED_STEP_FUSE_TICKS` of posting. No aftermath with `godTouchedEncounter` false auto-opens. The run reports how many world stops the First caused before and after the switch (both switches off vs on, same seed), and the on-arm is lower.
- [ ] Browser, 1920×1080: screenshot of a fused badge with its tooltip, and of an untouched-ending badge. Console clean. A `__DEBUG` assertion of one `fatedFuse` notification. UI-Laws line: 1, 13/14, 17, 21, 33, 37, 39 (amended), 52.

**Slice B:**
- [ ] The census test (from the proto branch) is committed and asserts, across the 24 hunger × sphere gods: mean modal-hand share ≤ 0.35 and mean distinct hands ≥ 20 (arm D measured 0.27 / 25.1).
- [ ] Unit: the same god at the same step is dealt the same hand twice (Law 21). The witness Mind/Spirit god gets at least 3 distinct hands across the nine named template steps (arm D: 5).
- [ ] `__DEBUG.getRepertoire().lastDeal.candidates[*].stakesTerm` is present.
- [ ] Live deals: in a `?seeded&size=medium` run with `__DEBUG.tick(n)` from the bond to tick 740, every Stage the First opens on a step with a deal (opened via `__DEBUG`, then `getRepertoire().lastDeal` read) is logged. The log shows at least two distinct dealt hands across those steps, and no hand is dealt on more than half of them. If fewer than four dealing steps open in the run, the run says so and the census test stands as the measurement.

**Every slice:** `npm run gate` passes. A 30-tick CLI smoke runs clean. The PR body carries the line-anchored closer for its own slice ticket. Browser evidence follows the UI-pillar scope. The slice edits its own lines in § Rulebook and law impact.

**Programme:** fixed when no tester in a later warm round lists a chapter that "played itself" or "asked me nothing" among their worst moments (ticket Done-when).

## Kill criteria

- If testers miss the fused steps (a Fated step fails and they say "I never saw it"), the fuse is too short; raise `FATED_STEP_FUSE_TICKS` before removing the fuse.
- If a playtest round files a finding that a chapter's result went unseen because its ending was badge-only (complaint class PC-2), turn `UNTOUCHED_ENDING_BADGE_ENABLED` off for "Waits for you" chapters first. Keep it on for "Theirs alone" chapters.
- If the stakes lean makes protective cards fill easy steps so often that boost disappears from early play, lower `DEAL_STAKES_WEIGHT` to 1 (below one tag match).

## Coordination block

**Suggested model:** opus. Slice A touches the interrupt path and the forecast core; slice B is one engine file and a test.
**Parallel-safe with:** A and B are file-disjoint and can run in either order. Both are parallel-safe with [Make the purse bite](https://linear.app/threadbare/issue/THR-2201) and [Give both clocks a verb](https://linear.app/threadbare/issue/THR-2202)'s slices (no shared files).
**Mutex with:** slice A against any other work on `encounterVisibility.ts` or the auto-open gate, notably [Put the god in the climax](https://linear.app/threadbare/issue/THR-2204), whose journey-vision work is likely to touch the interrupt path. Slice B against any `dealHand.ts` work (none open).

**Files to touch:** per slice, as listed in § Files touched. Each slice also edits its tests, `Docs/canon/interface-map.md` and `scripts/interface-contracts.ts` (the contracts in § Interface impact), its rulebook and law lines in § Rulebook impact, and the Design Reference Wiki page whose `sources` match.

## Notes for the executor

- **Grey zone 1 (slice A):** confirm which code resolves a step at its `autoResolveTick` for a "Lives on" thread, and that it runs for a pause-thread action too. Write a unit test first. If it does not, add the branch there, not a second resolver.
- **Grey zone 2 (slice A):** `baseStepForecastTier` must take exactly the `forecastInput` the Stage builds (`buildNudgePhaseModel.ts:~700-763`). Lift it; do not rebuild it. A unit test pins Stage tier = poster tier on three steps.
- **Grey zone 3 (slice B):** run the proto branch's census before and after. The proto patch (`ARM=D`) is a sketch, not the implementation: the real term lives in a named `stakesTermFor` with the constants above.
- An opened fused step goes through the normal hold. Opening by hand already counts as asked (THR-2197's `playerOpened`).

## Intent-judge verdict

**Allow** (run 3, opus, cold, 2026-11-13). The first two runs returned Revise, and each was fixed inline:
1. **Run 1:**
   - the fuse wording did not match its 8 ticks;
   - no after-roll line for a failed fused step;
   - `DEAL_STAKES_TYPES` disagreed with decision 4;
   - no live-deal measurement;
   - the Vision sentence was missing;
   - the impact class was raised to External.
2. **Run 2:** the chapter word, badge and ending line could disagree (THR-2174's "cannot disagree"), and the badge lines were aria-only. Fixed: the visible badge meta, the band accent and the "without your hand" ending line.

Run 3 had one GAP: no kill criterion for decision 1. It is now added. It also asked that the veto line quote Law 27's current clause, "An encounter, a choice, a doom stage, a receipt, the Chapter Ledger: each one halts the clock", beside the new sentence.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-11-13*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | 8 named constants, 2 kill switches, table present |
| 2. Inspectability | PASS | `encounter.stop_skipped` trace, `stakesTerm` in deal report, `__DEBUG` and DebugPanel fields; wiring table present |
| 3. Determinism | PASS | "No new draw; the deal stays PRNG-free"; deal reads template difficulty; Law 21 same-hand test |
| 4. Fail-soft | PASS | Fail-soft table: forecast throw → `undefined` → no fuse, today's stop |
| 5. Narrative over mechanical | PASS | Authored hands always stop; endings one click away; "without your hand" lines |
| 6. Additive over destructive | PASS-with-note | Optional fields, new helper, new scoring term; but spread pass narrowed and `buildNudgePhaseModel` refactored to call the helper (changes every dealt hand, by design) |
| 7. Performance budget | PASS | One base forecast per posted dealt step; deal scoring adds a term; live-run measures stops |

NFP AUDIT: PASS-with-notes (see rows above)

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | present-and-substantive | Slices A/B give file-and-line predicates, a lifted helper, a trace, PRNG-free statement, fail-soft table. Uses "Slice" subsections instead of the template's Systems design / Tick phases / Resolution logic headings, but content is there. |
| Content | present-and-substantive | Eight named constants, five new ui-content lines with exact text, N/A rationale for templates/attachments. |
| UI | present-and-substantive | Badge states, Ledger/ending lines, Player-facing text table with PC classes, UI Laws, Playtest signal, debug surfaces, Playwright named. |

Missing required sections: none absent or empty; minor template deviations (no headed Tick phases subsection, tracing uses `category:` not `type:`, forked-audit placeholder at audit time). Wiring: present, ties each slice to phase, component, GameState, trace and player control; no explicit Debug column (covered in UI Debug notes). Substrate check: PASS — no green-field duplication; the one new module is a lift.

PILLAR AUDIT: PASS-with-notes

*Author response:* a `### Tick phases` subsection is added to the Engine pillar.

### Vision audit

Premises: north star "witnessing, not steering" confirmed, "hand on the tiller" extended; core loop "Time stops for every moment" extended (the plan narrows which moments halt, and amends the text in the same ticket); density / never ration confirmed; non-negotiables #1, #3, #7 confirmed; tension #4 touched lightly; taste "real time, halting for every moment" extended, declared not silent.

No contradictions found. The nearest edge is 01-core-loop's list naming "a receipt"; the plan quotes and amends it in this ticket.

Checks: north star clear; core loop note (an untouched aftermath is no longer anchored in a witnessed moment, but is one click away and named in the kill criteria); non-negotiables clear; tensions note (#4, handled with words, no numbers); taste clear (opening a badge still stops the clock).

VISION AUDIT: PASS-with-notes

## Three-pillar check

- [x] Engine: two slices, predicates, a helper, a trace
- [x] Content: three lines, eight constants
- [x] UI: badge states and tooltips, unchanged Stage and Ledger, law text
- [x] Wiring connects them

## Vision audit

- [x] The plan does not contradict a Vision premise. "Time stops for every moment" (`01-core-loop.md`) is about reading never costing time. An untouched ending still costs no time to read: it waits, and opening it stops the clock. The north star ("the pleasure is witnessing") is served by fewer interruptions that ask nothing. Law 9 holds: nothing commands. Law 13: the world does not wait, so a Fated step plays out.
- [x] One Vision sentence is clarified with the law texts it sources, so the three cannot disagree. `TheFantasyWorldSimulator/Vision/01-core-loop.md:61`, after the list of moments: "A moment matters when it offers the god a move or reports the god's own hand; a chapter the god had no part in waits on its badge, and a step already Fated with only dealt cards plays out within the day unless opened." Game Law 27 and UI Law 39 change with it (§ Rulebook impact). Law 15 ("stop the world only for a player who asked") is unchanged: this plan narrows what a threaded mortal stops for, within that law.

## Rulebook impact

- [x] This plan changes rules of play: which chapters stop the world, and how the dealt hand is scored.
- [x] Each slice edits its own lines below, in its own PR.

- `Docs/canon/rulebook.md` §3, clock paragraph (`:84`), slice A adds: "A chapter the First plays out alone ends on its badge, not on your screen. A step she is fated to win, where your hand would be only dealt cards, waits on its badge and plays out within the day unless you open it." The quick reference (`:30`) mirrors it.
- `Docs/canon/rulebook.md` §7 dealt hand (quick reference `:68`), slice B: "scored on your spheres, the step's subject, how hard it is, and what you have earned".
- `Docs/game-design/laws.md` **Law 27**, slice A appends: "A moment matters when it offers the god a move or reports the god's own hand; a chapter that did neither waits on its badge." **UI Law 39** (`Docs/design-system/laws.md`), slice A amends "every beat interrupts" to "every beat that offers the god a move interrupts; a Fated step with only a dealt hand, and an ending the god took no part in, badge first." Slice A also makes the Vision edit in § Vision audit. All four edits (rulebook, Law 27, UI Law 39, Vision) follow from the approved ticket's design question 1, and all are on the veto line in this run's report.

> Brainstorm companion: `Docs/plans/2026-11-13-thr-2203-stop-only-for-real-decisions-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Two switches, a fuse and five deal constants, all named |
| 2. Inspectability | PASS | `encounter.stop_skipped` trace; `stakesTerm` in the deal report |
| 3. Determinism | PASS | No new draw; the deal reads template data only |
| 4. Fail-soft | PASS | Every unreadable input falls back to today's stop |
| 5. Narrative | PASS | Authored chapters keep their stop; endings stay one click away |
| 6. Additive | PASS | Optional fields, one new helper, a scoring term |
| 7. Performance | PASS | One base forecast per posted dealt step (already computed once per Stage render) |
