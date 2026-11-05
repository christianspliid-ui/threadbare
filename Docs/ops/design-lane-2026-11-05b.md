---
lane: tb-design-lane
run: 2026-11-05b
promoted: 0
filed: 0
resolved: 1
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-05 (run b, ~05:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [The Comet, the Page and Apotheosis, the leftover rewrite](https://linear.app/threadbare/issue/THR-2164/novel-prose-story-beats-slice-b-residue-comet-page-and-apotheosis-held): the second cold read of the rewrite found problems in all three story beats, so all three keep their current text. There is no third rewrite round, as the 4 November report promised. The held work is kept for later.
- Same ticket: the next rewrite waits for your [writing-checks conversation](https://linear.app/threadbare/issue/THR-2106). The two mistakes the critic kept finding need a machine check, because two hand-read rounds did not get rid of them. I added both mistakes to that ticket as check ideas. They are not decisions.
- Same ticket, rule for the next rewrite: an ending's opening paragraph never repeats the step result shown just before it, not even in other words.
- Same ticket, rule for the next rewrite: in the Comet and the Page, a mortal who stumbles at a step still wins at a price, because the game works that way. So those quests get no separate "failed" ending. Their win-at-a-price text must read true whether the mortal only scraped through or stumbled and pushed on.

Say "veto <title>" to reverse any of these. Nothing gets built on them: the ticket is parked until the writing-checks conversation happens.

## Work

- **Claimed** [the leftover rewrite](https://linear.app/threadbare/issue/THR-2164/novel-prose-story-beats-slice-b-residue-comet-page-and-apotheosis-held). The builder filed it at 02:46Z and asked this lane to choose between a third read and shipping the closest text. The build shelf held two tickets, both waiting out their veto window. The UI-legibility focus had nothing to work on. [The UI legibility map](https://linear.app/threadbare/issue/THR-2114) is closed. The only open UI-project tickets are your two icon picks. The two warm-playtest UI findings ([the mortal's mid-game](https://linear.app/threadbare/issue/THR-1859), [outcome words that mislead](https://linear.app/threadbare/issue/THR-1860)) were decided on 16 October and are waiting for warm round 3.
- **Measured before deciding:**
  - The held branch [`claude/thr-2134-slice-b`](https://github.com/christianspliid-ui/threadbare/compare/main...claude/thr-2134-slice-b) no longer merges cleanly. `git merge-tree` against main @ `aad1f40e` conflicts in the Comet and the Page files. That is because [the mortal-decides change for the story beats](https://linear.app/threadbare/issue/THR-2157) reshaped both files at 04:00Z. Apotheosis still merges cleanly.
  - Every step in the Comet and the Page continues after a failure. The engine turns any lost step into a win at a price (`computeFinalActionOutcome`). That makes a separate "failed" ending unreachable there.
  - The page-repeat check compares only an ending's opening paragraph, its result tags and its reactions (`aftermathPage.ts:155-172`). It never compares the opening paragraph with the step result shown before it.
- **Recorded** the decision on the ticket, plus resume notes for the next writer in its description. **Re-parked** the ticket in Todo, unassigned, blocked by [Writing evals — with Christian](https://linear.app/threadbare/issue/THR-2106). Verified.

*Counting note:* `resolved: 1` counts the design question the ticket put to this lane, which this run answered. The ticket itself stays open as the container for the next rewrite. With `resolved: 0`, `check:substantive` returns `skip` (no-op-run), and these veto lines would never reach the briefing. That gap is logged as an impediment.

## Escalations

None.
