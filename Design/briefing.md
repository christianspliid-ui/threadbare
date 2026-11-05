# Briefing
**Generated:** 2026-11-05 02:58 local (01:58 UTC) · keep-work-flowing-cc

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

## Decided for you

From the design lane's [14:18 UTC run](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-11-04b.md) (nobody builds it before 02:30 UTC on 5 November). The town-encounter decisions from the 11:34 UTC run are past their veto window and are being built now.

- [The Comet at the Turning, the Page Beneath the Saint and Apotheosis, rewritten in plain words](https://linear.app/threadbare/issue/THR-2134/novel-prose-story-beats-slice-b-the-comet-at-the-turning-the-page) — when a mortal wins at a cost, the mortal pays (strength, nerve, what they would have learned), never the god. Three Apotheosis lines change.
- Same ticket — the ending paragraph tells what happened; the small result tag says what changed. They stop saying the same thing twice, per your 15-word tag ruling of 12 September.
- Same ticket — a mortal's pronouns come from the mortal, so nobody is wrongly called "they". Fifteen lines change.
- Same ticket — a failed ending gets its own words. Three endings that read like a win when the mortal lost get their own failure endings, with no new effect added.
- Same ticket — if the second rewrite still fails its cold read, each encounter ships or stays on its own merits. There is no third round.

Say "veto <title>" to reverse any of these.

## This week's screens

[Contact sheet — this week next to last week](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/ux-review/2026-11-02/contact-sheet.jpg) — better: all three of last week's faults are fixed, and for the first time the review reached a real mid-game, where one new overlap shows.

## Queue

**Starved: 1 ticket ready, waiting out your veto window.** [The story-beats rewrite, slice B](https://linear.app/threadbare/issue/THR-2134/novel-prose-story-beats-slice-b-the-comet-at-the-turning-the-page) opens at 02:30 UTC. [Town encounters, round 2](https://linear.app/threadbare/issue/THR-2130/encounter-factory-habits-slice-c-town-encounters-name-the-mortal-write) shipped at 00:18 UTC ([PR #2744](https://github.com/christianspliid-ui/threadbare/pull/2744)) and is live. The six builder runs since then (00:15–01:52 UTC) have rightly waited for the window.

Items for agents, not you:
- **A finished fix is still waiting to be queued.** [THR-2091](https://linear.app/threadbare/issue/THR-2091/hex-cards-sphere-push-picks-the-nearest-place-on-the-wrong-hex-grid) is built on [branch `thr-2091-oddq`](https://github.com/christianspliid-ui/threadbare/tree/thr-2091-oddq), but the ticket is still in Idea, so no builder run will take it.
- **The paperwork-cut ticket is still parked.** [THR-1947](https://linear.app/threadbare/issue/THR-1947/cut-per-pr-paperwork-to-one-status-line-drop-the-changelogproject) has had no owner since 20 Oct (16 days; In Dev since 15 Oct). No local worktree and no pushed branch holds work for it. It needs gate and CI edits that unattended runs are not allowed to make, so an agent can un-park it only in a run someone is watching.
- **The returning-player playtest should run today.** Its rule fix merged ([PR #2739](https://github.com/christianspliid-ui/threadbare/pull/2739)). *— from [the playtest lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/warm-playtest-round-2-stale.md)*

## Health

All green. The live site serves the latest main, including the town-encounter rewrite. Checks on main and the 3 scheduled background jobs pass. No PRs are waiting to merge. All 10 enabled scheduled tasks are on time. The builder is not stalled: its short runs since 00:15 UTC each found the one ready ticket still inside its veto window. Engine speed: 125 ms per tick, 20% below the weekly median (156). The worktree cleaner last ran at 02:40 local. The lanes were quiet overnight 3–4 Nov (20:25–08:19 local); overnight quiet is normal, so it is not an ask. The home-folder copy of the repo is 15 commits behind main. It is the read-only mirror and catches up on its own.
