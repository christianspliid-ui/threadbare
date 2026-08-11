# Briefing
**Generated:** 2026-08-11 18:55 local (16:55 UTC) · keep-work-flowing-cc

## The one thing

**Sign Linear back in — the automation is locked out of the board.** About a minute of your time, and it is now gating everything else on this list.

Every scheduled lane reads and writes work through the Linear connector, and it is signed out. No agent can clear this: a scheduled run has no way to complete a sign-in prompt. **Open a `claude` terminal and run `/mcp`, or re-connect Linear in your claude.ai connector settings.** One sign-in restores every lane at once — nothing else is needed, they reconcile on their own.

Two lanes ran in the last half hour and did no board work at all, each reporting it independently:

- [**Orchestrator, 16:45 UTC**](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-11.md) — its three main jobs (promoting unblocked work, the wayfinder sweep, design staging) "could not run at all — not 'found nothing,' genuinely blocked."
- [**Backlog grooming, 16:29 UTC**](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/backlog-grooming-2026-08-11.md) — "could not read the queue, could not check in-flight work, and could not fix anything."

The pickup lane that claims and implements tickets goes through the same connector. So does the queue section below, which is why it is showing you a day-old number.

*This displaces the play sitting as the lead only because it is upstream of it:* the verdict you give produces tickets, and right now there is no board to put them on. The sitting is first in the list below and unchanged.

## Also waiting (6)

- **The play sitting — the substantive one.** [**THR-907**](https://linear.app/threadbare/issue/THR-907) (prose clear? rhythm right? interface gamey enough? is deciding fun?) and [**THR-974**](https://linear.app/threadbare/issue/THR-974) (does the world-change look like it *happened*?) — two rulings, one sitting, same five encounters. Start at [**the unsafe bridge**](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge); the rest are in [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).
- [**THR-998**](https://linear.app/threadbare/issue/THR-998) — action cards print a risk word that can't move the odds for 85% of castable cards. Recommendation: print something true instead (scale or cost).
- [**THR-962**](https://linear.app/threadbare/issue/THR-962) / [**THR-961**](https://linear.app/threadbare/issue/THR-961) — two sound decisions; needs your ears, not a screen.
- **Was last night's automation pause deliberate?** ~20.6h with no lane running, now fully recovered. If it was usage limits, saying so drops a marker and the probe stops asking.
- **Does the encounter ending appear on its own now?** Your 2026-08-06 repro was fixed and verified — no reply needed if it works.
- **Parked, no urgency:** the Tenacious-style trait. Safe default is "stays parked."

## Queue

⚠️ **Stale — Linear was unreachable this run, and the run before it.** Figures are from the [orchestrator's 2026-08-10 ~21:30 local run](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-10o.md), now ~21h old. Nothing has been able to read the board since.

- Last known: **35 Ready for Dev** — backed up (threshold 15). 9 non-Deferral items, all process/infrastructure.
- Headline finding, unchanged for several runs: **no feature or content work anywhere in the ready queue.** Every genuine candidate needs a design decision or your verdict first — which is what makes the play sitting the supply the pipeline is short of.
- One held PR: [#1114](https://github.com/christianspliid-ui/threadbare/pull/1114) — paused on purpose behind the locked encounter format. Correctly parked, no action.

## Health

- **Last brief's two red flags have both cleared on their own.** The ~20.6h fleet-wide lane silence (2026-08-10 21:57 → 2026-08-11 18:32 local) ended, and **tb-orchestrator has re-fired** after 21 missed slots — all 9 scheduled tasks are now within 2 slots of schedule. The only open question left from it is whether the pause was deliberate (above).
- Deploy green (live site serving `f976bdc5`), CI green, both scheduled GitHub jobs healthy.
- Git worktree reaper ran 18:40 local, 15 min ago. Two worktrees still flagged for disposition (23–24 days stale, unmerged) — executor's job, not yours.
