# Briefing
**Generated:** 2026-11-07 01:57 local (00:57 UTC) · keep-work-flowing-cc

## The one thing

**Set the Claude app to open when Windows starts.** The lanes lost 40 hours on 29–30 Oct and 48 hours on 21–23 Oct while the app was not running, with tickets ready to build both times. [The workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md) traced every recent gap to the app not reopening after a start or wake. Only you can change that setting. Say "done" and the next silence check confirms it.

## Also waiting (8)

- **Your writing-checks conversation can start.** [The story-text audit](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-31-encounter-story-text-quality.md#the-writing-checks-against-these-examples-done-when-1b) is what [Writing evals — with Christian](https://linear.app/threadbare/issue/THR-2106) needs. The next story-beat rewrite waits on it too. *— from the design lane*
- **Thursday 29 to Friday 30 Oct:** the lanes were silent for 40 hours and no pause was recorded. Was the computer off or the app closed, or was this a pause?
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

**Empty shelf: one ticket being built, none ready.**
- **Shipped this hour:** [The Crossroads on screen](https://linear.app/threadbare/issue/THR-1928/the-crossroads-on-screen-a-threaded-mortals-next-three-roads-as-an) (THR-1928), the screen half of the god action you approved on 14 Oct. Merged via [#2774](https://github.com/christianspliid-ui/threadbare/pull/2774) at 00:37 UTC and live on [the deployed build](https://threadbearer.co/?view=game&seeded&size=medium). Its engine half shipped earlier ([THR-1926](https://linear.app/threadbare/issue/THR-1926)).
- **Being built now:** [your cards say how they landed](https://linear.app/threadbare/issue/THR-2187/your-cards-say-how-they-landed-each-card-the-god-played-adds-its-own) (THR-2187); the builder claimed it at 00:52 UTC. Its follow-up, the five chapters that ask you once ([THR-2179](https://linear.app/threadbare/issue/THR-2179)), joins the queue when it merges.
- Nothing else is ready to build. The orchestrator and design lane refill the shelf on their own (next runs 01:28 and 02:17 UTC); nothing here needs you.

Items for agents, not you:
- **The paperwork-cut ticket is still parked.** [THR-1947](https://linear.app/threadbare/issue/THR-1947/cut-per-pr-paperwork-to-one-status-line-drop-the-changelogproject) has had no owner since 20 Oct (18 days; In Dev since 15 Oct, 23 days; last touched 1 Nov). It needs gate and CI edits that unattended runs may not make, so an agent can un-park it only in a run someone is watching.

## Health

- The live site serves the latest commit on main (d18870d3). Checks on main and the 3 scheduled background jobs pass. No pull requests are waiting to merge. All 10 scheduled tasks are on time. The builder is working (it claimed THR-2187 at 00:52 UTC).
- Engine speed: 143 ms/tick steady, −3% against the 7-day median (147).
- The lanes were quiet overnight 3–4 Nov (20:25–08:19 local); overnight quiet is normal, so it is not an ask.
- **The home-folder copy of the repo is now 163 commits behind main**; its newest commit is from 4 Nov 11:02 local, about 63 hours ago. The same two files still block the mirror's sync: an edited `.claude/settings.local.json` and an untracked screenshot under `Docs/evidence/thr-2125/` that main now also adds. This is the eighteenth hour in a row this brief has flagged it; an attended agent session should set the two files aside and fast-forward. Nothing is lost, because the lanes work from fresh copies of main.
