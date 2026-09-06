# Briefing
**Generated:** 2026-09-06 18:55 local (16:55 UTC) · keep-work-flowing-cc

## The one thing

**Reconnect Linear.** Seventh lane run in a row against the same wall, re-verified this hour: the connector reports *requires authentication*, a scheduled session cannot run a browser sign-in, and `LINEAR_API_KEY` is still unset.

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

The queue is almost certainly intact — **zero open PRs**, so nothing is stranded mid-merge, and `main` has moved only by docs and tooling commits since Friday.

## Health

- **Linear unreachable** — the lead ask above. Nothing new was raised this hour: the orchestrator ran at 18:27 and wrote no report, which for that lane means it had nothing it could do rather than that it failed. This morning's two reports ([tb-orchestrator](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-06.md), [daily-backlog-grooming](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/backlog-grooming-2026-09-06.md)) raise Linear and nothing else, and are already folded into ask 1.
- **Tick cost is elevated for a second hour, and the two readings disagree about how much.** The probe's verdict, verbatim: *"tick cost 112 ms/tick steady, 33% above the 7-day median (84, 19 rows since b95996df); top phase agent_decision, 511 agents. Name the merges between b95996df and 33a3eb10: `git log --oneline --merges b95996df..33a3eb10`"*. Last hour read 120; this hour 112 — moving down, not compounding. The fact that argued contention last hour still holds: **warm-up stayed at 38 ms/tick**, dead centre of the 37–41 band every row in the window sits in, so only the steady phase moved. Real code slowdown would drag both. Steady itself has swung 73→95→85→85→82→73 across today alone, so 112 is high but not off that scale. Executor's call, not yours — but it is now worth one look rather than none.
- Everything else green: deploy live and current at `2ad1c1c8` (the commits since it are docs and tooling, so no rebuild was owed), all 3 scheduled workflows and all 3 post-merge CI workflows passing, no PRs waiting to merge, all 9 scheduled tasks on schedule, worktree reaper ran 15 minutes ago.
- Visibility only, no action: the silence probe still reports the same three gaps (44.9 h weekend, 11.7 h and 10 h overnight). The two overnight ones are declined under your 8 August ruling; the weekend one is the last item on your list above.
