---
lane: tb-design-lane
run: 2026-11-16b
promoted: 0
filed: 2
resolved: 1
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-16 (run b, ~11:18Z)

## Needs Christian

Nothing new needs you. One fact may help with the briefing's main ask, "what should the design lane plan next?". **Your play now changes the First's story, but not yet how the age ends.** Every age still runs out on Doom, whatever the god does. Details are in the first line below.

## Decided for you

- [Measure whether the player matters](https://linear.app/threadbare/issue/THR-2205/measure-whether-the-player-matters-a-run-nobody-plays-and-a-run-played): closed. A run you play now ends differently from one nobody plays on **3 of 3** test worlds; it was 0 of 3 on Friday. What changes is the First: how the Ordeal goes, how the Apotheosis goes and, on one world, whether the First becomes your Aspect at all. What does not change: Doom ends every age at its last stage, and the Mandate stays near empty. Say "the age's ending is what counts" and the measure counts only how the age ends, which reads 0 of 3 today.
- [The pre-bonded First has no meeting record](https://linear.app/threadbare/issue/THR-2242/the-pre-bonded-first-has-no-meeting-record-so-every-seeded-and-warm) (filed, Ready for Dev): on the test route every warm tester and every census plays, the First always "vanishes" at the Return, even after a triumphant Ordeal. It happens because the test First skips the meeting. Real players are not affected. Fixing it lets the next warm round see the Ordeal change the Return.
- [The agency census answers the clocks](https://linear.app/threadbare/issue/THR-2243/the-agency-census-answers-the-clocks-a-third-arm-that-holds-stay-the) (filed, Ready for Dev): a third census run that plays Stay the Unmaking and Rebuke, which the current census never plays. It will tell whether answering Doom can change how the age ends, or whether Doom needs more design.

## Work

- **Claimed** [Measure whether the player matters](https://linear.app/threadbare/issue/THR-2205/measure-whether-the-player-matters-a-run-nobody-plays-and-a-run-played) with the marker `design-lane claim dl-20261116T1118Z` (assignment checked).
  - **Why this unit:** Ready for Dev was empty, no map is open, and no ticket was waiting in In Design. The UI-focus project holds only your icon picks, so no focus unit could be worked. The census build ([Ship the agency census](https://linear.app/threadbare/issue/THR-2213)) and every build of the other four "make the middle a game" tickets had shipped since the 0-of-3 baseline. The open step was to read the measure again.
  - **Measured:** `npm run census:agency -- --all` on main @ `2a898612`: six arms, seeds 42 / 99 / 7, warm 300, to tick 800, 24 minutes in the background, no arm stopped early. The verdict was "the player mattered on 3/3", with headline differences 2, 1 and 2. Doom was at stage 5 in every arm (progress 0.918–0.986). The Mandate reached 0.06–0.15 and the played arm led by at most +0.026. Cards played: 58, 54 and 63, down from 117–178 on 13 Nov, with 416–452 essence left against 540: the purse now bites. The full table is in [the decision comment](https://linear.app/threadbare/issue/THR-2205/measure-whether-the-player-matters-a-run-nobody-plays-and-a-run-played).
  - **Root cause of the vanishing Return**, measured: `devSeedTheFirst` writes `meetingChoiceRecord: null` ([gameInit.ts:898](https://github.com/christianspliid-ui/threadbare/blob/main/src/engine/gameInit.ts#L898)). With no record, only outcomes with no founding gate are allowed, and Vanishing is the only one ([returnEngine.ts types :93](https://github.com/christianspliid-ui/threadbare/blob/main/src/types/returnEngine.ts#L93)).
  - **Closed** under the design-request carve-out. The closing comment quotes all four Done-when lines and links each output. Status Done was checked.
  - **Left a note** on [Put the god in the climax](https://linear.app/threadbare/issue/THR-2204/put-the-god-in-the-climax-the-journey-visions-read-from-the-scene-the) saying the predicate it waited on has been read. It stays open for its warm-playtest check.
- **Shelf:** 0 → 2 non-Deferral tickets in Ready for Dev (the two filed above), both unassigned, each with its coordination block.

## Escalations

None.
