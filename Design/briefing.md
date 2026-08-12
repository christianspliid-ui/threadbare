# Briefing

**Generated:** 2026-08-12 13:22 local (2026-08-12 11:22 UTC) · keep-work-flowing-cc

## The one thing

**Did you switch the two work lanes off last night?** [`tb-opus-pickup`](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/ops/scheduled-tasks-registry.md) (the executor — picks up and ships tickets) and `tb-orchestrator` (decides what gets promoted next) are both **disabled**, not merely quiet. Pickup last ran 22:01 last night, the orchestrator 21:26. That is **~15 hours and ~15 missed slots each.**

This run can now say it wasn't the machine. Between 21:26 and 03:57 this machine was awake and working — the hourly briefing lane and the git housekeeping job both ran every hour through that window. Those two lanes, and only those two, stopped firing. **Something switched them off deliberately.**

**Nothing on the board moves while the executor is off.** The queue has sat at 21 ready / 0 in flight since, and it is 21 cleanup items with zero feature or content work on it.

- **If you turned them off:** just say so, a marker gets dropped, and this stops being asked. It would be a coherent follow-through on your 2026-08-10 direction to stop the lanes filing cleanup work.
- **If you didn't:** say that, and it gets investigated as a real stoppage.

## Also waiting (7)

- **[THR-907](https://linear.app/threadbare/issue/THR-907)** — the four-part play verdict on five encounters: prose, rhythm, interface, and whether deciding is fun. Links in [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).
- **[THR-974](https://linear.app/threadbare/issue/THR-974)** — play one hand to its ending: is the change to the world *visible*, and does it feel like it happened rather than being announced. Fully unblocked.
- **[THR-998](https://linear.app/threadbare/issue/THR-998)** — action cards print "steady / uncertain / perilous" where 85% of the time the number behind the word can't move the odds. Recommendation: stop printing a risk word where the risk is flat.
- **[THR-962](https://linear.app/threadbare/issue/THR-962)** — where the encounter sound cues should be routed. Needs your ears.
- **[THR-961](https://linear.app/threadbare/issue/THR-961)** — how those cues should feel. Needs your ears.
- **Encounter endings** — you reported on 2026-08-06 that the aftermath didn't pop on its own. Both halves shipped; **no reply needed if it works now.**
- **Tenacious-style trait** — parked option, no urgency. Safe default is "stays parked."

## Queue

**Backed up — 21 ready, 0 in flight.** Every one of the 21 is cleanup: infrastructure, deferrals, prose/UI tidying. **Zero feature or content work on the shelf.** THR-907 / THR-974 above are the only asks that refill it with real work.

- Stale: [THR-991](https://linear.app/threadbare/issue/THR-991) — untouched 9 days.
- No parked In-Dev issues (nothing is In Dev at all).

## Health

- **This machine was asleep or off roughly 03:57 → 13:19 today** (~9.4 h). The git housekeeping job missed the same nine slots, and it is a Windows job that knows nothing about the two disabled lanes — so the overnight gap is sleep, not a fault. Declined as normal per your 2026-08-08 ruling; noted here only so it isn't mistaken for the lane question above.
- **Home tree's `node_modules` is damaged** — the `.bin` directory is now gone entirely, not merely missing esbuild. Repair is `npm install` in the home tree; an executor session's job, not yours.
- **Two stale worktrees need disposition** — `hopeful-shaw-3150f4` (23 d) and `jovial-mcnulty-37a4c9` (24 d), both unmerged. The housekeeping job will not delete unmerged work on its own.
- Deploy, CI checks, scheduled workflows and task heartbeats: all green. The live site is serving the latest commit on main (`eabbc173`).
