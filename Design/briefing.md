# Briefing
**Generated:** 2026-11-07 05:56 local (04:56 UTC) · keep-work-flowing-cc

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

## Decided for you

From [A lean waits for its road](https://linear.app/threadbare/issue/THR-2188) ([the plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-07-thr-2188-a-lean-waits-for-its-road.md)). Nobody builds on these before 15:36 UTC on 7 November. *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-11-07a.md)*

- **Your lean now reaches the choice you paid for.** When you lean on a mortal's road at the Crossroads, the game keeps that road in front of them. Until now, the game's shortlist of what a mortal can see often dropped the road a few hours later, and your lean ended "Your lean finds nothing to hold". That happened to more than half of all leans. The God's Will pick had this protection, and the lean lost it when it replaced God's Will.
- Same ticket — **a lean waits for its road.** If the road is out of sight when the mortal next chooses (they moved on, or they are resting after a chapter), your hand stays on them until it comes back, for up to six days. The held line now reads *"Your hand rests on Kael, toward The Oath-Breaker's Rite. It waits until Kael next faces that road."* If it never comes back, the fade names it: *"Your lean fades: Kael never came back to The Oath-Breaker's Rite."*
- Same ticket — **"likely" means more than before.** "Kael will likely turn to it" now needs a clearer lead. Before, two kinds of lean that each worked about 4 times in 10 both said "likely". Now, leaning toward a road works about 56% of the time on "likely", 38% on "may" and 14% on "not enough".
- Same ticket — the lean still never passes the rest a mortal takes after a chapter. If it could, the leaned road would win by default while other roads are hidden, and that would be an order, not a lean.

Say "veto A lean waits for its road" to reverse it.

## This week's screens

[Contact sheet — this week next to last week](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/ux-review/2026-11-02/contact-sheet.jpg) — better: all three of last week's faults are fixed, and for the first time the review reached a real mid-game, where one new overlap shows.

## Queue

**Starved: one ticket ready, and it is on hold until its veto window closes.**
- [A lean waits for its road](https://linear.app/threadbare/issue/THR-2188) (THR-2188) moved to Ready for Dev at 03:36 UTC; its plan merged via [#2777](https://github.com/christianspliid-ui/threadbare/pull/2777). The builder takes it after 15:36 UTC today, when the veto window above closes.
- The builder's last eight runs (02:32–04:52 UTC) found nothing it was allowed to pick up: an empty shelf, then the one ticket on hold. That is correct, not a stall. Nothing here needs you.

Items for agents, not you:
- **The paperwork-cut ticket is still parked.** [THR-1947](https://linear.app/threadbare/issue/THR-1947/cut-per-pr-paperwork-to-one-status-line-drop-the-changelogproject) has had no owner since 20 Oct (18 days; In Dev since 15 Oct, 23 days; last touched 1 Nov). It needs gate and CI edits that unattended runs may not make, so an agent can un-park it only in a run someone is watching.

## Health

- The live site is up to date: the commits since its last publish (9924a734) only touched notes and plans. Checks on main and the 3 scheduled background jobs pass. No pull requests are waiting to merge. All 10 scheduled tasks are on time. The worktree reaper last ran 05:40 local.
- Engine speed: 130 ms/tick steady, −12% against the 7-day median (148).
- The lanes were quiet overnight 3–4 Nov (20:25–08:19 local); overnight quiet is normal, so it is not an ask.
- **The home-folder copy of the repo is now 175 commits behind main**; its newest commit is from 4 Nov 11:02 local, about 67 hours ago. An edited `.claude/settings.local.json` and an untracked screenshot under `Docs/evidence/thr-2125/` that main now also adds still block the mirror's sync. This is the twenty-second hour in a row this brief has flagged it; an attended agent session should set the two files aside and fast-forward. Nothing is lost, because the lanes work from fresh copies of main.
