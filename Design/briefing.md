# Briefing

**Generated:** 2026-08-12 02:57 local (2026-08-12 00:57 UTC) · keep-work-flowing-cc

## The one thing

**Did you switch the two work lanes off?** [`tb-opus-pickup`](https://linear.app/threadbare) (the executor — picks up and ships tickets) and `tb-orchestrator` (decides what gets promoted next) are both **disabled**, not merely quiet. Between them they have now skipped **nine slots across five hours**: pickup last ran 22:01 and has missed 23:01 / 00:01 / 01:01 / 02:01; the orchestrator last ran 21:26 and has missed 22:25 / 23:25 / 00:25 / 01:25 / 02:25.

**Nothing on the board moves while the executor is off** — the queue has sat unchanged at 21 ready / 0 in flight all night, including the work your other rulings below would create.

- **If you turned them off:** just say so, a marker gets dropped, and this stops being asked. It would be a coherent follow-through on your 2026-08-10 direction to stop the lanes filing cleanup work.
- **If you didn't:** say that, and it gets investigated as a real stoppage.

Same answer also settles the overnight gap — no lane wrote anything 2026-08-10 21:57 → 2026-08-11 18:32 local (~20.6 h), with no pause marker covering it.

## Also waiting (7)

- **[THR-907](https://linear.app/threadbare/issue/THR-907)** — the four-part play verdict on five encounters: prose, rhythm, interface, and whether deciding is fun. Links in [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).
- **[THR-974](https://linear.app/threadbare/issue/THR-974)** — play one hand to its ending: is the change to the world *visible*, and does it feel like it happened rather than being announced. Fully unblocked; the orchestrator re-confirmed it on its last run before going quiet.
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

- **Home tree's `node_modules` is damaged** — `.bin` has no esbuild. The reaper has flagged it on every run since 00:40 and will not auto-install. Repair is `npm install` in the home tree; an executor session's job, not yours.
- **Two stale worktrees need disposition** — `hopeful-shaw-3150f4` (23 d) and `jovial-mcnulty-37a4c9` (24 d), both unmerged. The reaper will not delete unmerged work on its own.
- Deploy, CI checks, scheduled workflows and task heartbeats: all green. The live site is serving the latest commit on main.
