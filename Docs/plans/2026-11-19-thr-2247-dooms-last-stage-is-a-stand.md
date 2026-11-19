> **title:** Doom's last stage is a stand — the Doom feeds at a place, your ground starves it, and Rebuke answers it there (THR-2247)
> **linear_issue:** THR-2247
> **author:** Claude Code (design lane, run dl-20261119T1119Z)
> **created:** 2026-11-19
> **three_pillars:** Engine done (slice 1) · Content done (line tables, slice 1) · UI done (Doom panel, place page, card face, last-stage notice, slice 2)

# Doom's last stage is a stand (THR-2247)

*A quarter of Doom's movement comes from mortals failing, at about fifty places, and nothing says where or offers an answer. The last stage begins on the same tick as the First's Return, and from then on the god is offered almost nothing while its purse fills. This plan makes each feeding a place the player can see and answer with the cards the god already holds, so the last stage becomes a stand over the god's ground.*

## Why this is load-bearing

Christian agreed the direction "make the ending a game" in chat on 2026-11-18 (ticket 3 of 3). The ticket's three questions are the pushes, the last stage, and a measure of "something to decide". The census below answers all three on current `main`. The longest stretch of the run is also the one that decides how it ends, and it is the emptiest.

## Substrate inventory

| Existing subsystem | Status | This plan |
|---|---|---|
| Complications `doom_micro_tick` (`complicationEffects.ts:179`) | 🟢 ACTIVE | **extends**: records the place, absorbs on tended ground |
| Dominion tending index (`dominion.ts` `buildTendingIndex` / `isTended`) | 🟢 ACTIVE | **reads**: a new consumer |
| Rebuke (`rivalRebuke.ts`, THR-2209) | 🟢 ACTIVE | **extends**: a doom target beside the rival one |
| Doom stage notice (`phaseDoom.ts` `doom_escalation`) and the Doom panel (`DoomClockDetail.tsx`, THR-2240) | 🟢 ACTIVE | **extends**: one line, one section, one daily alert |
| Agency census (`scripts/agency-census.ts`, THR-2213/2243) | 🟢 ACTIVE | **extends**: Rebukes doom-fed places, reports the predicate |

### Measured on main @ 9c4300ad

Command (proto branch, never merged: [proto/thr-2247-doom-push-census](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-2247-doom-push-census)), from the repo root, after bundling the branch's census with the `census:agency` esbuild line to `.cache/agency-census-2247.mjs`:

```
node .cache/agency-census-2247.mjs --seed <42|7|99> --arm answer --warm 300 --ticks 950 --out .cache/doom-push/agency-<seed>-answer.json
node .cache/agency-census-2247.mjs --seed 42 --arm none --warm 300 --ticks 950 --out .cache/doom-push/agency-42-none.json
node scripts/proto-2247-analyse.mjs .cache/doom-push
```

The `answer` arm plays every held hand, answers visions, receives gifts, holds Stay and Rebukes rival presses ([the census plan](2026-11-13-thr-2205-measure-whether-the-player-matters.md)). Every run ended in the Twilight, by Doom.

| Seed · arm | Doom moved after warm-up | from failures | failures · mortals · places | First's share | Last stage | Return | Decisions / day before last stage | in last stage | Essence at end |
|---|---|---|---|---|---|---|---|---|---|
| 42 · answer | 734 | 184 (25%) | 657 · 46 · 47 | 1.0% | t682 → t931 (20.8 d) | t682 | 1.04 | **0.10** | 468 |
| 7 · answer | 720 | 206 (29%) | 739 · 57 · 52 | 0.7% | t634 → t846 (17.7 d) | t634 | 1.44 | **0.17** | 411 |
| 99 · answer | 726 | 201 (28%) | 725 · 52 · 74 | 0.9% | t646 → t840 (16.2 d) | t646 | 1.21 | **0.31** | 415 |
| 42 · none | 734 | 171 (23%) | 611 · 41 · 49 | 2.5% | t669 → t864 (16.3 d) | t669 | 0.65 | **0.00** | 540 (full) |

What the numbers say:

1. **Every push is a failure.** All of them come from `doom_micro_tick` in two complications: *Doom Noticing* (0.3 a failure, from Doom's second stage) and *Omen Resonance* (0.25, under a doom-echo omen). In clock ticks, Noticing / Resonance: seed 42 118 / 66, seed 7 127 / 79, seed 99 121 / 81, seed 42 hands-off 107 / 64. *Breach Advances* (0.5) never fired. The other writers never fired in any run: nudge doom costs (`nudgeDispatch.ts:350`), dark teaching (`ascendantExpression.ts:498`) and the two artifact multipliers. Those are prices the god chose, shown on the card that charges them, so they need no answer here.
2. **The pushes are spread wide.** The busiest place fed the Doom 12% of the total, and the five busiest mortals 29–34%. The First fed it 1–2.5%. A card per push would mean hundreds of plays. A rule about places can answer them all.
3. **The last stage and the Return are the same moment.** The Return vision fired on the exact tick the last stage began in all four runs. The First's story is over when the stand begins.
4. **The last stage asks almost nothing.** In 16–21 in-game days, the god was offered 2–6 moves: one hand on one seed, and the rest ladder gifts (bind a faction, bind an army, anoint). That is about a tenth of the rate before it.
5. **The purse fills with nothing to spend on.** Essence rose through the last stage in every played run (seed 42: 403 → 468). The hands-off run sat at the cap.

"Decision offered" means a held step with at least one card, a journey vision with choices, or a gift beat. A day is `TICKS_PER_DAY` (12).

## Decisions (made by the design lane under delegation, 2026-11-19 — veto in chat)

1. **The Doom feeds at a place, and the game remembers where.** When a failure feeds the Doom, the feeding is written to the top-level place where it happened (a sublocation resolves to its parent place), with the mortal and the day. This is the record every surface below reads.
2. **Ground you tend starves the Doom.** A failure at a place the god tends feeds the Doom nothing: the push is absorbed, and the complication's line says the ground held. "Tends" means the existing tending index (`buildTendingIndex`: claim, seat, carry, anointed, rebuke). This is Law 37 (home ground) applied to the clock, and the same shape as tending absorbing a rival's blow.
3. **Rebuke answers the Doom where it fed.** A place where the Doom fed within `DOOM_REBUKE_WINDOW_DAYS`, and which the god does not tend, can be Rebuked. The card, price, roll and hold are unchanged: Rebuke tends the place for `RIVAL_REBUKE_HOLD_DAYS`, so failures there stop feeding the Doom. There is no rival, so no temper rises. A clean landing still pushes the god's primary sphere at the place. No new card: Rebuke, tending and Stay come first, as the ticket asked ([THR-2237](https://linear.app/threadbare/issue/THR-2237)'s pattern, "the answer is where the threat is").
4. **The last stage is the stand.** On entering it, the stage notice adds one line: a failure can feed the Doom, and ground you tend starves it. From then, once a day, if the Doom fed at a place the god can still Rebuke and can pay for it, one non-pausing alert names it and opens the place. The Doom panel lists where it fed. The purse's last use is this choice: which places to hold, against the Mandate's chapters and Stay's upkeep (Law 30). No new sink is added.
5. **The predicate.** *The final stretch gives the god something to decide* when decisions offered per in-game day in the last stage are at least `LAST_STAGE_DECISION_SHARE` (0.5) of the rate before it, in the census's `answer` arm, on all three seeds. Today the ratio is 0.10, 0.12 and 0.26 (fails). A doom-feeding alert counts as a decision, at most one per day, only when the god can pay for the Rebuke at that tick. An alert alone can clear the bar (one a day against 1.04–1.44 before), so the predicate has a second half: the `answer` arm casts a doom Rebuke on at least half of the alert days, which proves each alert was answerable and paid for. The census prints the share with and without alerts, the doom Rebukes cast, and the clock ticks absorbed, so it also shows whether answering moved the age's end.

**Law 31:** nothing here rolls the clock back or lifts its floor. Tending and Rebuke only stop new feedings, and the post-bond floor (`doomFloorMetAtTick`) and the age's end are unchanged.

**Not built on today's other lane decisions** ([a well-played age can be won](https://linear.app/threadbare/issue/THR-2245), [the player can read the race](https://linear.app/threadbare/issue/THR-2246)). They share the Doom panel, which is a mutex, not a dependency.

**Reserved for Christian, untouched:** whether a run holds a second journey after the Return ([THR-2204's section](2026-11-14-thr-2204-put-the-god-in-the-climax.md#reserved-for-christian--does-a-run-hold-a-second-full-journey)). The stand works either way: a second First would fail at places too.

Rejected, one line each ([brainstorm](2026-11-19-thr-2247-dooms-last-stage-is-a-stand-brainstorm.md)): **a card per push** means hundreds of plays for 0.25 each. **Stay also slowing failures' pushes** was weighed and rejected on 2026-11-16 and is not reopened; the place answer covers the same pushes. **Unspent essence turning into something at the age's end** reaches across runs (Law 39) and would be Christian's call. **A faster Doom in the last stage** would undo the measured win rate of [a well-played age](https://linear.app/threadbare/issue/THR-2245) while its veto window is open.

## Engine pillar

All of it is slice 1.

- `src/types/gameState.ts`: optional `doomFeedings?: Record<placeId, DoomFeeding>`, where `DoomFeeding = { lastTick; lastActorId; recentTicks: number[]; heldUntil?: number }` (additive, flat). `recentTicks` keeps feedings younger than `DOOM_REBUKE_WINDOW_DAYS`: the record, the panel and the Rebuke offer share one window, so nothing is listed that cannot be answered. A doom Rebuke landing sets `heldUntil`; the entry is dropped only once `recentTicks` is empty and `heldUntil` is more than `DOOM_REBUKE_WINDOW_DAYS` past.
- `src/engine/complicationEffects.ts` `doom_micro_tick`: resolve the place (`resolveToParentLocation`). If it is tended (`buildTendingIndex` / `isTended`, called as `phaseDominion.ts:273` does), push only `magnitude × (1 − DOOM_FEED_ABSORB_SHARE)` (nothing at the default), emit `doom.feed_absorbed`, and set the event's line variant to `held`. Otherwise push as today, append to `doomFeedings`, and emit `doom.fed`. Fail-soft: no place means push as today with no record.
- `src/engine/rivalRebuke.ts`: `rebukeTargetFor` returns `{ kind: 'rival', rivalId, pressedAt } | { kind: 'doom', fedAt }`. The rival target wins when both apply. `rebukablePlaceIds` adds untended places with a feeding inside `DOOM_REBUKE_WINDOW_DAYS`. The landing skips the temper rise for `kind: 'doom'`. For a doom target it also tends the top-level places within `DOOM_REBUKE_TENDS_RING` hex rings (default 0, so today only the place itself). `rival.rebuked` gains `targetKind`.
- `src/engine/phaseDoom.ts`: at most once per `DOOM_FEED_ALERT_EVERY_DAYS`, from stage `DOOM_FEED_ALERT_FROM_STAGE`, when the god holds Rebuke, can pay its price, and a rebukable doom-fed place exists, emit one `doom_feeding` event on the `alert` channel (no pause), naming the place fed most recently. `GameState.doomFeedAlertTick` (optional) holds the last one.
- `scripts/agency-census.ts` (promoted from the proto branch): the `answer` arm also Rebukes each doom-fed place it can pay for, once per feeding. Output gains `doomPushTicks`, `doomPushAbsorbed`, `doomRebukesCast`, `doomAlertDays`, `decisionsPerDayBeforeLastStage`, `decisionsPerDayLastStage` (with and without alerts), `lastStageFrom`, and the predicate's verdict per seed.
- No new node or edge type. No PRNG: tending, absorption and the alert are deterministic. The complication roll is unchanged.

## Content pillar

All of it is slice 1.

The lines live in `src/data/complication-templates.ts` (a `heldProse` list on the two feeding complications), `src/data/rival-rebuke-content.ts` and `src/data/doom-content.ts` (or the file holding the stage notice's lines). Words only, no numbers (UI Law 13).

Every line is quoted in the UI pillar's Player-facing text table.

## UI pillar

All of it is slice 2. Screenshot tool: Playwright (DOM surfaces only; nothing on the WebGL map changes).

- `DoomClockDetail.tsx`: a new **Where it feeds** section, under the Stay line ([THR-2240](https://linear.app/threadbare/issue/THR-2240)'s Act slot). It shows at most `DOOM_FEED_LIST_MAX` `ListRow`s, newest first, each a place link (Law 21) with a word: "fed here once" or "fed here often" (`DOOM_FEED_OFTEN_COUNT` in memory). A tended place reads "held". Clicking opens the place. Empty: "The doom has not fed anywhere lately." The view model is `src/engine/views/doomFeedings.ts` (pure), so the dialog only renders.
- `DoomBar` hover: one line when a feeding is in memory: "It feeds on failures at Riverford and two other places."
- Place page: `actOn.ts` `rebukeFirst` already leads with Rebuke when it is offered. The lead line ([THR-2237](https://linear.app/threadbare/issue/THR-2237)'s "pressed" line) gains a doom variant: "The doom fed here when Mira failed. Rebuke it here, or tend it."
- The alert routes through `notificationRouter` to the place (the existing place route). It is not a drumbeat: it fires only in the last stage, only while the god holds Rebuke and a place is still answerable, at most once a day, and it routes under the existing `doom` notification category (`src/types/notification.ts`). Preferences are per category (UI Law 51), so muting it also mutes Doom's stage notices; slice 2 adds no new category. It coalesces with itself (UI Law 49) and never pauses (UI Law 39: it reports, it is not a beat with a move inside it).
- UI Laws engaged: 1, 13, 17, 21, 25 (no "Rebuke" link when the card is not held: the row reads the place only), 33 (the section fits the dialog at 1920×1080 with three rows, nothing scrolls), 36, 39, 49, 53 (nothing new in the top bar), 57.
- Browser-verify: Playwright DOM at 1920×1080 on `?view=game&seeded&size=medium&warm=600`, then `window.__DEBUG.tick(100)` to reach the last stage. Four-part evidence (more than 400 UI lines is not expected, but the Doom panel is a contract surface). Slice 2 adds `window.__DEBUG.getDoomFeedings()` (async, returns the view model); assert it is non-empty and the dialog lists its newest place.

### Player-facing text

| Surface | Exact text the player reads | Complaint class | How the player understands it |
|---|---|---|---|
| Complication, fed (unchanged) | "Kael Thornweaver's failure fed the doom, and it crept a little closer. Mandates kept well blunt its next blow." | PC-9 | Gets a second sentence when Rebuke is held: "Rebuke it at Riverford and the doom finds nothing there." (the added sentence rides the same event, so it reaches only a followed mortal's row, as the line above does; the row collapses repeats into a count, UI Law 49) |
| Complication, held (new) | "Mira failed at Riverford, but the ground is yours. The doom found nothing to feed on." | PC-5 | It replaces the fed line on the same complication event, so it fires no more often than complications do today. The router already drops an unthreaded mortal's events and diverts a threaded one's to its row (`notificationRouter.ts:269-285`), so the player meets it only for mortals they follow (the First fed the Doom 1–2.5% of the time). Ten at once collapse into that mortal's row count (UI Law 49); every one still reaches the chronicle |
| Rebuke card face, doom target | "The doom fed here. Rebuke it, and failures here feed it nothing for a while." | PC-1 | The card says what it buys |
| Last-stage notice, added line | "From here a failure can feed the doom. Ground you tend starves it." | PC-7 | Tells the player what the stand is |
| Last-stage alert (daily, non-pausing) | "The doom fed at Riverford. Rebuke it there." | PC-5, PC-9 | At most one a day (`DOOM_FEED_ALERT_EVERY_DAYS`); clicking opens Riverford with Rebuke first |
| Rebuke landed on a doom place (clean) | "You rebuked the doom at Riverford. Failures there feed it nothing for a few days, and the ground leans back toward you." | PC-8 | The reply arrives on the cast's result line, the same tick |
| Rebuke landed on a doom place (crooked, Law 26) | "You rebuked the doom at Riverford, but crookedly. Failures there feed it nothing for a few days; the ground did not lean back." | PC-2, PC-8 | Says what the crooked landing lost; a god's cast never misses outright |
| Doom panel row | "Riverford · fed here once" / "Riverford · fed here often" / "Riverford · held" | PC-6 | Every listed place can still be Rebuked or is held. A place stays listed as "held" for as long as its rebuke lasts (`rebukedPlaces`, `RIVAL_REBUKE_HOLD_DAYS`), even after its feeding leaves the window, so a held place never drops off while held |
| Doom panel row, hold ended | "Riverford · no longer held" | PC-8 | Shown for `DOOM_REBUKE_WINDOW_DAYS` after a doom Rebuke's hold ends, then the row leaves. If the Doom feeds there again the row turns back to "fed here once" and Rebuke is offered again. The place page's tending line drops "rebuke" the same tick (the existing tended-by list) |
| Doom panel, empty | "The doom has not fed anywhere lately." | none | — |
| Doom bar hover | "It feeds on failures at Riverford and two other places." | PC-9 | The place names link to the place |
| Place page lead (doom variant) | "The doom fed here when Mira failed. Rebuke it here, or tend it." | PC-9 | Shown only while Rebuke is offered there (the `rebukeFirst` gate in `actOn.ts`); Rebuke leads the card list |
| Place page lead, Rebuke not held | "The doom fed here when Mira failed. Ground you tend here starves it." | PC-9 | No Rebuke link (UI Law 25); tending is the answer the god already has |

### Playtest signal

A tester who reaches the last stage can say where the Doom fed and names one place they held or Rebuked.

## Interface impact

| Contract | Change |
|---|---|
| complications → doom clock (`doom_micro_tick`) | **extend**: reads the tending index, writes `doomFeedings` |
| dominion tending → complications | **add** read (production read site: `complicationEffects.ts`) |
| `doomFeedings` → Rebuke targets, Doom panel, place page, alert | **add** (read sites: `rivalRebuke.ts`, `views/doomFeedings.ts`, `actOn.ts`, `phaseDoom.ts`) |

Slice 1 updates `Docs/canon/interface-map.md` and `scripts/interface-contracts.ts`.

## Wiring

Checked against [the wiring checklist](wiring-checklist.md) (`Docs/plans/wiring-checklist.md`).

| Module | Phase | UI | GameState | Trace | Debug |
|---|---|---|---|---|---|
| feeding record + absorb | step resolution (`unifiedActionResolution.ts:2401`) | complication toast/alert | `doomFeedings` | `doom.fed`, `doom.feed_absorbed` | `__DEBUG.getDoomFeedings()` (slice 2) |
| Rebuke on a doom place | god-cast resolution, the path Rebuke already lands through (`rivalRebuke.ts`) | place page, card face | `rebukedPlaces` | `rival.rebuked` (`targetKind`) | trace viewer |
| last-stage alert | `phaseDoom` | alert → place | `doomFeedAlertTick` | `doom.feed_alert` | trace viewer |
| Where it feeds | none: a pure view model (`views/doomFeedings.ts`) read at render | `DoomClockDetail`, `DoomBar` | reads `doomFeedings` | none (reads only) | `__DEBUG.getDoomFeedings()` |

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `DOOM_REBUKE_WINDOW_DAYS` | 3 | Days a feeding stays on the record, on the panel and Rebukable (matches the rival window) |
| `DOOM_FEED_ABSORB_SHARE` | 1.0 | Share of a feeding absorbed on tended ground (1 = all of it) |
| `DOOM_REBUKE_TENDS_RING` | 0 | Hex rings around a doom-Rebuked place whose top-level places it also tends (0 = the place only); the kill-criterion lever |
| `DOOM_FEED_ALERT_FROM_STAGE` | 5 | First Doom stage that raises the daily alert (the last stage) |
| `DOOM_FEED_ALERT_EVERY_DAYS` | 1 | Fewest days between two alerts |
| `DOOM_FEED_LIST_MAX` | 3 | Rows in the Doom panel's Where it feeds |
| `DOOM_FEED_OFTEN_COUNT` | 3 | Feedings in memory at which a place reads "fed here often" |
| `LAST_STAGE_DECISION_SHARE` | 0.5 | Predicate: last-stage decisions per day ÷ the rate before it |

Rebuke keeps `RIVAL_REBUKE_COST` (3), `RIVAL_REBUKE_HOLD_DAYS` (4) and `RIVAL_REBUKE_PUSH` (4).

## Tracing

```ts
interface DoomFedTrace { category: 'doom.fed'; tick: number; placeId: string; actorId: string; complicationId: string; magnitude: number }
interface DoomFeedAbsorbedTrace { category: 'doom.feed_absorbed'; tick: number; placeId: string; actorId: string; magnitude: number; tendedBy: TendedBy[] }
interface DoomFeedAlertTrace { category: 'doom.feed_alert'; tick: number; placeId: string; stage: number }
// rival.rebuked gains: targetKind: 'rival' | 'doom'
```

## Fail-soft table

| Failure case | Fallback |
|---|---|
| Complication has no place | Push as today, no record, no absorb |
| Tending index throws | Push as today (the index is already fail-soft) |
| `doomFeedings` absent (old save) | Read as empty; nothing rebukable for the Doom |
| A recorded place no longer exists | Dropped on read; the list shows the rest |
| Rebuke not held | No alert, no Rebuke link; the panel still lists places |

## Blast Radius

| File | Importers | Note |
|---|---|---|
| `src/types/gameState.ts` | 922 | Two optional fields only; no existing field changes |

## Implementation tickets

1. **The Doom feeds at a place, your ground starves it, and Rebuke answers it there** (Engine + Content): decisions 1–3 and 5, the alert, the lines, the census. Done when: the unit tests below pass, and the census prints the predicate for three seeds with `doomPushAbsorbed > 0` in the `answer` arm.
2. **The Doom panel shows where it feeds** (UI): the section, the bar line, the place lead, the card face. Blocked by 1.

Tests for slice 1: a failure on tended ground pushes nothing and traces `doom.feed_absorbed`. A feeding on an untended place makes it rebukable for exactly `DOOM_REBUKE_WINDOW_DAYS`. A Rebuke there tends it and raises no temper. A place both pressed and fed reads as the rival target. The alert fires at most once a day, and only from the last stage.

## Done when

- [ ] Slice 1 and slice 2 merged with their tests; `npm test`, `npm run check:typecheck`, `npx vite build` pass.
- [ ] The census reports last-stage decisions per day against the rate before it on seeds 42, 7 and 99. The share is at least `LAST_STAGE_DECISION_SHARE` on all three, or the kill criterion below applies.
- [ ] Slice 2's four-part browser evidence at 1920×1080.
- [ ] Fixed when: an expert session started at `?warm=600` (the warm route's cap, about 35–80 ticks before the last stage) names one place the player chose to hold in the last stage.

## Kill criteria

- The census's `answer` arm absorbs or rebukes pushes and its age still ends within one day of today's `answer` arm on all three seeds (t931, t846, t840 at 9c4300ad): the answer is too small. First raise `DOOM_REBUKE_TENDS_RING` to 1, so one Rebuke tends the places around it, never the Doom's own speed.
- Either half of the predicate fails with the alert live (the share stays below 0.5, or fewer than half of the alert days end in a doom Rebuke): the alert is noise, not a choice. The last stage then needs a new kind of move, and that comes back to the lane with these numbers.

## Coordination block

**Suggested model:** opus — slice 1 touches the complication path, Rebuke's targeting and the census.
**Parallel-safe with:** [THR-2248](https://linear.app/threadbare/issue/THR-2248) and [THR-2251](https://linear.app/threadbare/issue/THR-2251) for slice 2 only (different files).
**Mutex with:** slice 1 ↔ [THR-2248](https://linear.app/threadbare/issue/THR-2248) and [THR-2253](https://linear.app/threadbare/issue/THR-2253) (both edit `scripts/agency-census.ts`); slice 2 ↔ [THR-2252](https://linear.app/threadbare/issue/THR-2252) (both edit `DoomClockDetail.tsx`).

**Files to touch:** slice 1 — `src/types/gameState.ts`, `src/engine/complicationEffects.ts`, `src/engine/rivalRebuke.ts`, `src/engine/phaseDoom.ts`, `src/data/game-config.ts` (constants), `src/data/complication-templates.ts`, `src/data/rival-rebuke-content.ts`, the stage-notice line file, `scripts/agency-census.ts`, `scripts/agency-verdict.ts`, `Docs/canon/interface-map.md`, `scripts/interface-contracts.ts`, `Docs/canon/rulebook.md` §8. Slice 2 — `src/engine/views/doomFeedings.ts` (new), `src/components/Game/DoomClockDetail.tsx`, `src/components/Game/DoomBar.tsx`, `src/engine/views/subjects/actOn.ts`, `src/engine/views/rivalEntry.ts`, `src/engine/notificationRouter.ts`, `src/debug-bridge.ts` + `src/debug-bridge.d.ts` (`getDoomFeedings`).

## Notes for the executor

- Do not touch the Doom's own rate, Stay, or `DOOM_RATE_FLOOR`.
- `ctx.doomStage` in a complication is 0-based; `currentStage` is 1-based. The alert reads `currentStage`.
- Rebuke's existing rival behaviour must stay byte-identical for `kind: 'rival'`; its tests are the guard.

## Three-pillar check

- [x] Engine pillar present (slice 1)
- [x] Content pillar present (slice 1)
- [x] UI pillar present (slice 2)
- [x] Wiring section connects them

## Rulebook impact

- [ ] This plan does not change a rule of play
- [x] It does: the Doom feeds on failures at a place, tended ground starves it, and Rebuke answers it. Slice 1 updates `Docs/canon/rulebook.md` §8 in the same PR.

## Vision audit

- [x] This plan does not contradict any Vision premise: the world keeps failing on its own (Law 13), the god answers where it stands (Law 37), and Doom still leaves room for one whole journey (Law 31: the post-bond floor is untouched, and nothing buys the clock back).
- [x] No Vision edit is needed, so none is in scope.

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | Eight named constants (one window shared by the record and the offer); Rebuke's own reused |
| 2. Inspectability | PASS | Three traces, `targetKind` on Rebuke, a flat record in state |
| 3. Determinism | PASS | No new random draw |
| 4. Fail-soft | PASS | See the table; every miss falls back to today's push |
| 5. Narrative | PASS | Each failure now leaves a place in the story (Law 22) |
| 6. Additive | PASS | Optional fields, a union on Rebuke's target |
| 7. Performance | PASS with note | One tending-index build per feeding (about one a tick); cache it per tick if the slice measures more than 1 ms |

## Forked-audit verdicts

### NFP audit

PASS-with-notes. Tunability, inspectability, determinism, fail-soft and narrative PASS: named constants, three traces plus `targetKind` on `rival.rebuked`, a flat `doomFeedings` record, no PRNG, and a fail-soft table that falls back to today's push. Additive PASS-with-note: `rebukeTargetFor` becomes a union, guarded by "byte-identical for kind: 'rival'" and the existing tests. Performance PASS-with-note: one tending-index build per feeding, cached if over 1 ms; not yet measured.

### Three-pillar audit

REVISE on the first pass, for one gap: no `## Substrate inventory` section. Engine, Content and UI were each present-and-substantive, the wiring table complete, and no green-field duplication against `Docs/canon/systems-inventory.md` (Doom Clock & Journey, complications, rival/Rebuke all extended). **Resolved:** the Substrate inventory table now leads the plan. The thin phase cells were filled by naming the cast-resolution and panel read paths.

### Vision audit

PASS-with-notes. No contradictions with 00-north-star, 01-core-loop, 02-non-negotiables, 03-design-tensions or the taste profile. Notes: a daily unbidden alert leans toward the core loop's "drumbeat" warning, and a per-place feeding list leans toward the dashboard side of legibility against mystery, offset by words-only wording. **Answered:** the alert fires only in the last stage, only while an answer exists, at most once a day, and can be muted (UI pillar).

### Intent judge

Run 1: Revise (7 findings): missing Substrate inventory; no Player-facing text table covering the panel, bar and place lines; no Rebuke result line on a doom target; a listed place that could not be Rebuked (6-day list vs 3-day offer); a kill-criterion lever already at its maximum. All fixed: the table, the two result lines, one shared window, and `DOOM_REBUKE_TENDS_RING` as the lever.

Run 2: Revise (4 findings): the notice claimed "every failure" feeds the Doom, which the engine does not do; the held line's frequency was unstated (PC-5); an alert alone could clear the predicate; Law 31 was paraphrased loosely. All fixed: the line now says "a failure can feed the doom", the held row states the router's threading gate and row coalescing, the predicate requires doom Rebukes cast on half the alert days and counts an alert only when Rebuke is affordable, and Law 31 is quoted as the journey floor. `DOOM_FEED_ABSORB_SHARE` is now wired in the engine bullet.

Run 4: **Allow** (two advisory GAPs, applied: the alert's mute is named as the `doom` category, and the first kill criterion compares against today's played arm, not the hands-off arm).

Run 3: Revise (dimension 12 only): the end of a doom Rebuke's hold was silent, and the place lead without Rebuke was not quoted. Fixed: a held place stays listed while held, a "no longer held" row and the tended-by line answer the lapse, and the no-Rebuke lead is quoted.
