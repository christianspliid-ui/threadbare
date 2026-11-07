# Briefing
**Generated:** 2026-11-07 03:58 local (02:58 UTC) · keep-work-flowing-cc

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

**Empty shelf: nothing ready, nothing being built.**
- **Shipped this hour:** [the quiet chapters that ask you once](https://linear.app/threadbare/issue/THR-2179) (THR-2179). Five chapters The First used to play out alone (Consecrate the Ground, The Haggle, Tend the Shrine, The Market Haggle, Heal the Sick) now deal you a hand on their first step. Merged via [#2776](https://github.com/christianspliid-ui/threadbare/pull/2776) at 02:16 UTC and live on [the deployed build](https://threadbearer.co/?view=game&seeded&size=medium).
- The builder's last two runs (02:32 and 02:52 UTC) found nothing to pick up, which is correct with an empty shelf. The design lane holds [THR-2188](https://linear.app/threadbare/issue/THR-2188) in design; the orchestrator and design lane refill the shelf on their own (next runs 03:28 and 05:17 UTC). Nothing here needs you.

Items for agents, not you:
- **The paperwork-cut ticket is still parked.** [THR-1947](https://linear.app/threadbare/issue/THR-1947/cut-per-pr-paperwork-to-one-status-line-drop-the-changelogproject) has had no owner since 20 Oct (18 days; In Dev since 15 Oct, 23 days; last touched 1 Nov). It needs gate and CI edits that unattended runs may not make, so an agent can un-park it only in a run someone is watching.

## Health

- The live site serves the latest commit on main (9924a734). Checks on main and the 3 scheduled background jobs pass. No pull requests are waiting to merge. All 10 scheduled tasks are on time. The worktree reaper last ran 03:40 local.
- Engine speed: 155 ms/tick steady, +6% against the 7-day median (147).
- The lanes were quiet overnight 3–4 Nov (20:25–08:19 local); overnight quiet is normal, so it is not an ask.
- **The home-folder copy of the repo is now 172 commits behind main**; its newest commit is from 4 Nov 11:02 local, about 65 hours ago. An edited `.claude/settings.local.json` and an untracked screenshot under `Docs/evidence/thr-2125/` that main now also adds still block the mirror's sync. This is the twentieth hour in a row this brief has flagged it; an attended agent session should set the two files aside and fast-forward. Nothing is lost, because the lanes work from fresh copies of main.
