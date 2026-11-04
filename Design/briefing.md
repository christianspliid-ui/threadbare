# Briefing
**Generated:** 2026-11-04 10:57 local (09:57 UTC) · keep-work-flowing-cc

## The one thing

**Set the Claude app to open when Windows starts.** The lanes lost 40 hours on 29–30 Oct and 48 hours on 21–23 Oct while the app was not running, with tickets ready to build both times. [The workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md) traced every recent gap to the app not reopening after a start or wake. Only you can change that setting. Say "done" and the next silence check confirms it.

## Also waiting (8)

- **Your writing-checks conversation can start.** [The story-text audit](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-31-encounter-story-text-quality.md#the-writing-checks-against-these-examples-done-when-1b) is what [Writing evals — with Christian](https://linear.app/threadbare/issue/THR-2106) needs. *— from the design lane*
- **Thursday 29 to Friday 30 Oct:** "The scheduled lanes went silent for 40.3h (2026-10-29T01:56:50.000Z → 2026-10-30T18:17:35.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time." *— silence check*
- **Wednesday night to Friday night (21–23 Oct):** the lanes were silent for 48 hours and no pause was recorded. Was the app closed or the computer off, or was this a pause?
- **Sunday evening to Monday evening (18–19 Oct):** the lanes were silent for 23 hours and no pause was recorded. Was the app closed, or was this a pause?
- **Should "Fated" be gold instead of grey?** If you say nothing, it stays grey. ([the plan's section](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-18-thr-1980-words-teach-themselves.md#needs-christian-reserved-not-decided))
- **Thursday 1 Oct afternoon and Friday 2 Oct morning:** the computer was on, but no lane ran. Was the Claude app closed?
- **Monday 14 and Tuesday 15 September:** the same thing happened. Was the app closed?
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

Detail for each: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## This week's screens

[Contact sheet — this week next to last week](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/ux-review/2026-11-02/contact-sheet.jpg) — better: all three of last week's faults are fixed, and for the first time the review reached a real mid-game, where one new overlap shows.

## Queue

**Starved (1 ready).** The builder has emptied the shelf. Two more shipped this hour and are live: [the six seeded quests now let the mortal decide](https://linear.app/threadbare/issue/THR-2158) via [PR #2737](https://github.com/christianspliid-ui/threadbare/pull/2737), and [reputation encounters, half one](https://linear.app/threadbare/issue/THR-2159) via [PR #2738](https://github.com/christianspliid-ui/threadbare/pull/2738). A builder run is now working on [half two](https://linear.app/threadbare/issue/THR-2160). The only ticket still ready is [Legibility 4](https://linear.app/threadbare/issue/THR-2125/plan-doc-legibility-4-the-god-rail-the-ledger-rail-lists-and-the-hover). The orchestrator and design lane refill the shelf when it runs low; the design lane runs next at about 11:17 UTC.

Items for agents, not you:
- **The returning-player playtest was stuck for two weeks, and the fix is merging.** Warm round 3 waited on two design tickets, and those tickets waited on round 3. [PR #2739](https://github.com/christianspliid-ui/threadbare/pull/2739) changes the rule, and warm round 3 should run on tomorrow's daily fire. *— from [the playtest lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/warm-playtest-round-2-stale.md)*
- **A finished fix is still waiting to be queued.** [THR-2091](https://linear.app/threadbare/issue/THR-2091/hex-cards-sphere-push-picks-the-nearest-place-on-the-wrong-hex-grid) is built on [branch `thr-2091-oddq`](https://github.com/christianspliid-ui/threadbare/tree/thr-2091-oddq), but the ticket is still in Idea, so no builder run will take it.
- **The paperwork-cut ticket is still parked.** [THR-1947](https://linear.app/threadbare/issue/THR-1947/cut-per-pr-paperwork-to-one-status-line-drop-the-changelogproject) has had no owner since 20 Oct (15 days). It needs gate and CI edits that unattended runs are refused, so agents can un-park it only in an attended run.

## Health

All green. The live site serves the latest main (82938ebe, which includes THR-2158 and THR-2159). Checks on main and the scheduled background jobs pass. One PR is waiting on checks and will merge itself: [#2739](https://github.com/christianspliid-ui/threadbare/pull/2739). All 9 enabled scheduled tasks are on time. The builder is not stalled: a run is working now. Engine speed: 179 ms per tick, 14% above the weekly median, inside the normal range.
