# Briefing
**Generated:** 2026-11-04 13:56 local (12:56 UTC) · keep-work-flowing-cc

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

From the [design lane's 11:34 UTC run](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-11-04a.md). Nobody builds it before 23:35 UTC tonight.

- [Town encounters name the mortal and write their own stake line — round 2](https://linear.app/threadbare/issue/THR-2130/encounter-factory-habits-slice-c-town-encounters-name-the-mortal-write) — when a town job fails, its closing line now says what this particular failure cost (the seed lost, the mill standing idle). It no longer repeats "the town sent for them, and they failed", which seventeen town jobs currently say in nearly the same words.
- Same ticket — no two town jobs may share more than two sentences built the same way, so a player stops reading the same line on every job.
- Same ticket — the line that tells you when and where a follow-up meeting happens ("on court day, in three days, with the steward there to answer") stays the same everywhere, the way the small result tags do, because it states a game fact.
- Same ticket — the rewrites follow your six checks for compressed prose from 3 November: no packed phrases, rare word senses, vague references, filler, lists in place of character, or a mortal who just sits there.

Say "veto <title>" to reverse any of these.

## This week's screens

[Contact sheet — this week next to last week](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/ux-review/2026-11-02/contact-sheet.jpg) — better: all three of last week's faults are fixed, and for the first time the review reached a real mid-game, where one new overlap shows.

## Queue

**Starved (1 ready, held).** The design lane refilled the shelf with [town encounters, round 2](https://linear.app/threadbare/issue/THR-2130/encounter-factory-habits-slice-c-town-encounters-name-the-mortal-write), but it sits in your veto window until 23:35 UTC, so the builder's short runs this hour are correct. [The last player picks go](https://linear.app/threadbare/issue/THR-2161/the-last-player-picks-go-the-three-mentorship-moments-and-the-two) is still in Todo, waiting on its blockers; the orchestrator promotes it when they close.

Items for agents, not you:
- **A finished fix is still waiting to be queued.** [THR-2091](https://linear.app/threadbare/issue/THR-2091/hex-cards-sphere-push-picks-the-nearest-place-on-the-wrong-hex-grid) is built on [branch `thr-2091-oddq`](https://github.com/christianspliid-ui/threadbare/tree/thr-2091-oddq), but the ticket is still in Idea, so no builder run will take it.
- **The paperwork-cut ticket is still parked.** [THR-1947](https://linear.app/threadbare/issue/THR-1947/cut-per-pr-paperwork-to-one-status-line-drop-the-changelogproject) has had no owner since 20 Oct (15 days). It needs gate and CI edits that unattended runs are refused, so agents can un-park it only in an attended run.
- **The returning-player playtest should run tomorrow.** Its rule fix merged ([PR #2739](https://github.com/christianspliid-ui/threadbare/pull/2739)). *— from [the playtest lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/warm-playtest-round-2-stale.md)*

## Health

All green. The live site serves the latest game build; commits since then touched only docs. Checks on main and the 3 scheduled background jobs pass. No PRs are waiting to merge. All 10 enabled scheduled tasks are on time. The builder is not stalled: its last three runs were short because the one ready ticket is inside its veto window. Engine speed: 141 ms per tick, 11% below the weekly median (158). The worktree cleaner last ran at 13:40 local. The home folder copy is 8 commits behind main; the mirror catches up on its own.
