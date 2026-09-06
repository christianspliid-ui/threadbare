# Briefing
**Generated:** 2026-09-06 17:00 local (15:00 UTC) · keep-work-flowing-cc

## The one thing

**Reconnect Linear.** Five lane runs in a row have now hit the same wall, and re-verified this run: the connector still reports *requires authentication*, a scheduled session cannot run a browser sign-in, and `LINEAR_API_KEY` is still unset.

Either fix is enough, and both need you:

- **Re-authorize the Linear connector** — claude.ai → Settings → Connectors.
- **Or set `LINEAR_API_KEY` in the machine environment** — the better one for the scheduled lanes: no browser sign-in, and it does not lapse the same way. The code that reads it is already shipped.

Until then no lane can claim a ticket, promote work, or tell you what is in flight — including the batch-2 approval below, which **you can still start by hand in a chat session**. Detail: [ask 1](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

Nothing else has changed since the last brief; the thirteen below are carried unchanged.

## Also waiting (13)

- **[Approve the camp six](https://linear.app/threadbare/issue/THR-1130)** — *"batch 2, run the six"*. [The brief](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/2026-09-04-retrofit-batch-2-brief.md) is merged and unchanged.
- **[The undertaking retirement list](https://linear.app/threadbare/issue/THR-1392)** — four templates get deleted; *"run 4b"* finishes the migration.
- **[Do you still want the incident-capture button?](https://linear.app/threadbare/issue/THR-1134)** — you filed it 16 August; yes or no.
- **[Three questions on the undertakings map](https://linear.app/threadbare/issue/THR-1396)** — take [the division rule](https://linear.app/threadbare/issue/THR-1398) first; it unblocks four.
- **[Are you still planning Traits wave 2?](https://linear.app/threadbare/issue/THR-790)** — one word; smaller than it was billed.
- **[The fight map](https://linear.app/threadbare/issue/THR-1258)** — settle [monster fights](https://linear.app/threadbare/issue/THR-1263) and [duels](https://linear.app/threadbare/issue/THR-1264) and three more open by themselves.
- **[Twenty spells](https://linear.app/threadbare/issue/THR-1232) and [thirty items](https://linear.app/threadbare/issue/THR-1236)** — sketches built for you to react to.
- **[Image credits](https://linear.app/threadbare/issue/THR-876)** — should the spend be gated on you at all?
- **[What is a run about?](https://linear.app/threadbare/issue/THR-1198)** — remembrance, or named campaigns.
- **[One attended dev-server session](https://linear.app/threadbare/issue/THR-1133)** — nineteen captures owed; nothing blocks the sitting.
- **[Chart the hub map](https://linear.app/threadbare/issue/THR-1220)** — advice is still to wait for your slice checkpoint.
- **A Tenacious-style trait** — parked by default, listed so it is not forgotten.
- **Should weekend quiet be normal too?** — one word declines the 45-hour Friday-to-Sunday gap the way you declined overnight quiet.

## Queue

**Unreadable — Linear is down.** No count, no flagged items, no parked-In-Dev sweep this run. Nothing above is offered as current board state. Last verified reading was Friday 2026-09-04: Ready for Dev 10, In Dev 3, one live claim.

The queue is almost certainly intact — **zero open PRs**, so nothing is stranded mid-merge, and `main` has moved only by docs commits since Friday.

## Health

- **Linear unreachable** — the lead ask above. Raised again this run by [tb-orchestrator](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-06.md) and [daily-backlog-grooming](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/backlog-grooming-2026-09-06.md); folded into ask 1 rather than repeated.
- **One correction to the grooming report, so it is not believed later.** It warns that this briefing "has been frozen since Friday 15:54 and will not refresh itself." It has not been: the brief has published every hour through the outage, including this one, with the Queue section stating the fault plainly. The escalation channel degrades honestly rather than failing — the same correction tb-orchestrator already made against impediment #973.
- **The tick-cost measurement tripped over its own log line again — second run running.** `measure:tick-cost` prints a `[WorldGen] Genome NPC top-up` line to stdout ahead of its JSON, so `check:tick-cost` reads a parse error instead of a reading. Stripped and re-run again this hour; the row is published. No longer intermittent enough to wait out — a one-line stdout fix in the measure script ends it. Executor-side, not yours.
- **Tick cost healthy** — 73 ms/tick steady, 13% *below* the 7-day median (84, 17 rows).
- Everything else green: deploy live at `5c37c7dd`, all 3 scheduled workflows and post-merge CI passing, no PRs waiting, all 9 scheduled tasks on schedule, worktree reaper ran 16 minutes ago.
