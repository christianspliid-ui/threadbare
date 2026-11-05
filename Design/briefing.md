# Briefing
**Generated:** 2026-11-05 03:58 local (02:58 UTC) · keep-work-flowing-cc

## The one thing

**Set the Claude app to open when Windows starts.** The lanes lost 40 hours on 29–30 Oct and 48 hours on 21–23 Oct while the app was not running, with tickets ready to build both times. [The workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md) traced every recent gap to the app not reopening after a start or wake. Only you can change that setting. Say "done" and the next silence check confirms it.

## Also waiting (8)

- **Your writing-checks conversation can start.** [The story-text audit](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-31-encounter-story-text-quality.md#the-writing-checks-against-these-examples-done-when-1b) is what [Writing evals — with Christian](https://linear.app/threadbare/issue/THR-2106) needs. *— from the design lane*
- **Thursday 29 to Friday 30 Oct:** the lanes were silent for 40 hours and no pause was recorded. Was the computer off or the app closed, or was this a pause?
- **Wednesday night to Friday night (21–23 Oct):** the lanes were silent for 48 hours and no pause was recorded. Was the app closed or the computer off, or was this a pause?
- **Sunday evening to Monday evening (18–19 Oct):** the lanes were silent for 23 hours and no pause was recorded. Was the app closed, or was this a pause?
- **Should "Fated" be gold instead of grey?** If you say nothing, it stays grey. ([the plan's section](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-18-thr-1980-words-teach-themselves.md#needs-christian-reserved-not-decided))
- **Thursday 1 Oct afternoon and Friday 2 Oct morning:** the computer was on, but no lane ran. Was the Claude app closed?
- **Monday 14 and Tuesday 15 September:** the same thing happened. Was the app closed?
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

Detail for each: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Decided for you

From the design lane's [02:18 UTC run](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-11-05a.md). Nobody builds these before 14:25 UTC on 5 November.

- [Encounter Factory habits, slice c](https://linear.app/threadbare/issue/THR-2130/encounter-factory-habits-slice-c-town-encounters-name-the-mortal-write) — the town-encounter fixes the second critic still found go to two tickets, not seven: [the one-line records](https://linear.app/threadbare/issue/THR-2162/town-encounters-the-one-line-records-each-summary-line-names-the) and [the overviews and follow-up lines](https://linear.app/threadbare/issue/THR-2163/town-encounters-the-overviews-and-carryover-lines-name-the-mortal-say).
- Same ticket — the one-line chronicle records name the mortal too, the same rule as the scenes. "The stranger's reading failed" becomes the mortal's name.
- Same ticket — "and their name suffered for it" (three towns) and "ended badly for…" get scene-specific words. A record that already names its loss stays as it is.
- Same ticket — the new tickets finish when their listed lines are fixed. A fresh critic reads only the rewritten lines; anything new it finds is posted, not chased. No third round.
- Same ticket — Easter Reckoning's blurb stops stating as fact what the first step exists to find. The Pawnbroker's "He" becomes the cooper, because two men are on stage.

Say "veto <title>" to reverse any of these.

## This week's screens

[Contact sheet — this week next to last week](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/ux-review/2026-11-02/contact-sheet.jpg) — better: all three of last week's faults are fixed, and for the first time the review reached a real mid-game, where one new overlap shows.

## Queue

**2 tickets ready, both waiting out your veto window until 14:25 UTC:** [the one-line records](https://linear.app/threadbare/issue/THR-2162/town-encounters-the-one-line-records-each-summary-line-names-the) and [the overviews and follow-up lines](https://linear.app/threadbare/issue/THR-2163/town-encounters-the-overviews-and-carryover-lines-name-the-mortal-say) for the town encounters. The builder will rightly stand down until then.

- **The story-beats rewrite, slice B, closed without changing any story text.** All three encounters (the Comet at the Turning, the Page Beneath the Saint, Apotheosis) still failed their second cold read, so the plan's stop rule kept main's text. The finished rewrite is kept on [its branch](https://github.com/christianspliid-ui/threadbare/compare/main...claude/thr-2134-slice-b), and the findings moved to [THR-2164](https://linear.app/threadbare/issue/THR-2164) for the design lane. The closing paperwork ([PR #2745](https://github.com/christianspliid-ui/threadbare/pull/2745)) is merging now and will close [THR-2134](https://linear.app/threadbare/issue/THR-2134/novel-prose-story-beats-slice-b-the-comet-at-the-turning-the-page).

Items for agents, not you:
- **A finished fix is still waiting to be queued.** [THR-2091](https://linear.app/threadbare/issue/THR-2091/hex-cards-sphere-push-picks-the-nearest-place-on-the-wrong-hex-grid) is built on [branch `thr-2091-oddq`](https://github.com/christianspliid-ui/threadbare/tree/thr-2091-oddq), but the ticket is still in Idea, so no builder run will take it.
- **The paperwork-cut ticket is still parked.** [THR-1947](https://linear.app/threadbare/issue/THR-1947/cut-per-pr-paperwork-to-one-status-line-drop-the-changelogproject) has had no owner since 20 Oct (16 days; In Dev since 15 Oct). No local worktree and no pushed branch holds work for it (checked this run). It needs gate and CI edits that unattended runs are not allowed to make, so an agent can un-park it only in a run someone is watching.
- **The returning-player playtest should run at today's 09:47 UTC fire.** Its rule fix merged ([PR #2739](https://github.com/christianspliid-ui/threadbare/pull/2739)). *— from [the playtest lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/warm-playtest-round-2-stale.md)*

## Health

All green. The live site serves the latest main. Checks on main and the 3 scheduled background jobs pass. One PR is open ([#2745](https://github.com/christianspliid-ui/threadbare/pull/2745), docs only) and will merge on green. All 10 enabled scheduled tasks are on time. The builder is not stalled: it shipped slice B's close at 02:32 UTC, and its other short runs found nothing claimable. Engine speed: 160 ms per tick, 3% above the weekly median (155). The worktree cleaner last ran at 03:55 local. The lanes were quiet overnight 3–4 Nov (20:25–08:19 local); overnight quiet is normal, so it is not an ask. The home-folder copy of the repo is 15 commits behind main. It is the read-only mirror and catches up on its own.
