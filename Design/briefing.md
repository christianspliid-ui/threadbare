# Briefing
**Generated:** 2026-10-23 23:16 local (21:16 UTC) · keep-work-flowing-cc

## The one thing

**Set the Claude app to open when Windows starts.** It happened again, and this was the longest gap so far: no lane ran from about 23:07 Wednesday 21 Oct until 23:11 tonight (Friday). That is two whole days, with 20 jobs ready for the builder. The lanes came back on their own tonight, all in the same second, which is what it looks like when the app reopens. Only you can change that setting. Say "done" and the next silence check will confirm it. *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md)*

## Also waiting (7)

- **Wednesday night to Friday night (21–23 Oct):** "No scheduled Claude Code lane has written to origin/main or origin/ops since 2026-10-21T21:07:01.000Z — 48.1h of fleet-wide silence, past the 6h threshold, and no pause marker is set. Either the lanes are broken, or this is a deliberate pause that was never declared." Was the app closed or the computer off, or was this a pause?
- **The two process cuts you approved on 15 Oct are stuck.** The builder is not allowed to edit the gate and CI files that [THR-1947](https://linear.app/threadbare/issue/THR-1947) (one status line per PR) changes, and [THR-1949](https://linear.app/threadbare/issue/THR-1949) changes the same files. Either run them in one session with you present, or allow the builder to edit those files. Recommended: one session with you present. *— from [daily-backlog-grooming](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/backlog-grooming-2026-10-21.md)*
- **Sunday evening to Monday evening (18–19 Oct):** the lanes were silent for 23 hours with no pause recorded. Was the app closed, or was this a pause?
- **Should "Fated" be gold instead of grey?** If you say nothing, it stays grey. ([the plan's section](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-18-thr-1980-words-teach-themselves.md#needs-christian-reserved-not-decided))
- **Thursday 1 Oct afternoon and Friday 2 Oct morning:** the computer was on, but no lane ran. Was the Claude app closed?
- **Monday 14 and Tuesday 15 September:** the same thing happened. Was the app closed?
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

Detail for each: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Queue

**Backed up: 20 ready, 1 in progress (parked).** The builder restarted at 23:11 tonight and is running now.

- [Cut per-PR paperwork to one line](https://linear.app/threadbare/issue/THR-1947/cut-per-pr-paperwork-to-one-status-line-drop-the-changelogproject) is parked and unassigned, 8 days since it was first claimed. It waits on your answer above, not on the builder. No pushed branch, pull request or named local worktree for it (checked this run).
- Three ready tickets have not been touched for over a week: [encounter firing pruning pass](https://linear.app/threadbare/issue/THR-1218/encounter-firing-pruning-pass-select-down-from-everything-fires-once), [the design lane's closing rule](https://linear.app/threadbare/issue/THR-1888/the-design-lane-closes-design-tickets-that-are-not-wayfinder-tickets) and [crown courtship rate](https://linear.app/threadbare/issue/THR-1961/crown-courtship-rate-sits-at-68-73percent-of-days-under-the-plans). Most of that week is the two silences above.

## Health

- **Lanes:** the scheduled-task check flags the orchestrator, the design lane, backlog grooming and the cold playtest as "stalled". That is the known misreading after the computer wakes: the builder, this brief and the weekly retro all restarted in the same second tonight, and each flagged lane has its next slot within hours. The real cause is the two-day silence above.
- **Worktree reaper:** last ran 22:40 Wednesday 21 Oct; it stopped with everything else. It has 5 items needing a decision, which the builder handles.
- Everything else is green: main's checks and the three background jobs are healthy, no pull request is waiting, the live site is current ([0e14a188](https://github.com/christianspliid-ui/threadbare/commit/0e14a1887712418d9c2fda40b5f7cc86dc817303)), and the engine runs at 159 ms/tick (+11% vs the 7-day median).
