# Briefing
**Generated:** 2026-10-24 08:08 local (06:08 UTC) · keep-work-flowing-cc

## The one thing

**Set the Claude app to open when Windows starts.** The longest gap so far ended last night: no lane ran from about 23:07 Wednesday 21 Oct until 23:11 Friday 23 Oct. That is two whole days, with 20 jobs ready for the builder. The lanes all came back in the same second, which is what it looks like when the app reopens. Only you can change that setting. Say "done" and the next silence check will confirm it. *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md)*

## Also waiting (7)

- **Wednesday night to Friday night (21–23 Oct):** "The scheduled lanes went silent for 48.1h (2026-10-21T21:07:01.000Z → 2026-10-23T21:15:17.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time." Was the app closed or the computer off, or was this a pause?
- **The two process cuts you approved on 15 Oct are stuck.** The unattended builder may not edit the gate and CI files that [THR-1947](https://linear.app/threadbare/issue/THR-1947) and [THR-1949](https://linear.app/threadbare/issue/THR-1949) change. Recommended: ship both in one session with you present, rather than widening the builder's permissions. *— from [daily-backlog-grooming](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/backlog-grooming-2026-10-23.md)*
- **Sunday evening to Monday evening (18–19 Oct):** the lanes were silent for 23 hours with no pause recorded. Was the app closed, or was this a pause?
- **Should "Fated" be gold instead of grey?** If you say nothing, it stays grey. ([the plan's section](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-18-thr-1980-words-teach-themselves.md#needs-christian-reserved-not-decided))
- **Thursday 1 Oct afternoon and Friday 2 Oct morning:** the computer was on, but no lane ran. Was the Claude app closed?
- **Monday 14 and Tuesday 15 September:** the same thing happened. Was the app closed?
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

Detail for each: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Queue

**Backed up: 22 ready, 1 in progress (parked).** Overnight, [the first slice of the encounter firing pass](https://linear.app/threadbare/issue/THR-1218) merged ([#2531](https://github.com/christianspliid-ui/threadbare/pull/2531)) and is live. The builder started a new run at 06:04 UTC and is choosing its next job. The lanes were quiet from about 02:04 to 08:04 local; that is overnight, so it is not an ask.

- [Cut per-PR paperwork to one line](https://linear.app/threadbare/issue/THR-1947) is parked and unassigned, 8 days since it was first claimed. It waits on your answer above, not on the builder. No pushed branch or named local worktree for it (checked this run).
- Two ready tickets have not been touched for over a week: [the design lane's closing rule](https://linear.app/threadbare/issue/THR-1888) and [crown courtship rate](https://linear.app/threadbare/issue/THR-1961). Most of that week is the silences above.

## Health

- **Heavy tests are green on main again** (passed on the [THR-1218 merge](https://github.com/christianspliid-ui/threadbare/commit/c5acdb59)). The fix ticket [THR-2015](https://linear.app/threadbare/issue/THR-2015) is still on the shelf; the builder should confirm the test passes and close it, or find that it only passes by chance.
- **PR stuck:** [#2529](https://github.com/christianspliid-ui/threadbare/pull/2529) (the CI/CD review's own tweak, about 8 h old) has a merge conflict, and GitHub has scheduled no checks on it. The builder's unstick duty owns it.
- **The worktree cleaner last ran at 01:40 local**, more than 6 hours ago. That matches the overnight quiet (it runs on the same computer). If it has not run by the next brief, that is a fault.
- Everything else is green: every lane is on schedule, main's CI and the three scheduled background jobs are healthy, engine speed is normal (117 ms per tick, below the week's median), and the live site is current ([c5acdb59](https://github.com/christianspliid-ui/threadbare/commit/c5acdb59)).
