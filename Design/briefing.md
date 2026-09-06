# Briefing
**Generated:** 2026-09-06 16:00 local (14:00 UTC) · keep-work-flowing-cc

## The one thing

**Reconnect Linear.** It has now been unreachable for three straight hours of lane runs, and this brief is the fourth lane to hit the same wall today — after [tb-orchestrator](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-06.md), [daily-backlog-grooming](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/backlog-grooming-2026-09-06.md) and the work-pickup lane. Re-verified this run: the connector reports *requires authentication*, a scheduled run cannot do a browser sign-in, and `LINEAR_API_KEY` is still unset.

Either fix is enough, and both need you:

- **Re-authorize the Linear connector** — claude.ai → Settings → Connectors.
- **Or set `LINEAR_API_KEY` in the machine environment** — the better one for the scheduled lanes: no browser sign-in, and it does not lapse the same way. The code that reads it is already shipped.

Until then no lane can claim a ticket, promote work, or tell you what is in flight — including the batch-2 approval below, which you can still start by hand in a chat session. Detail: [ask 1](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

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

**Unreadable — Linear is down.** No count, no flagged items, no parked-In-Dev sweep this run. Nothing below is offered as current board state. Last verified reading was Friday 2026-09-04: Ready for Dev 10, In Dev 3, one live claim.

The queue is almost certainly intact — **zero open PRs**, so nothing is stranded mid-merge, and `main` has moved only by docs commits since Friday.

## Health

- **Linear unreachable** — the lead ask above. Second-order cost measured by the orchestrator: `check:process` now passes with three sub-checks dark, including the guard on coordination-block presence. Lane-side only; CI is unaffected.
- **The retro PR that was flagged stuck is not stuck.** [PR #1822](https://github.com/christianspliid-ui/threadbare/pull/1822) was `CONFLICTING` when tb-orchestrator saw it at 11:42Z; it merged at 12:07Z. Its five process improvements and impediment #974 are on `main`. Carried here only so the sibling finding is not re-raised next run.
- **The tick-cost measurement nearly lost its own trend row.** `measure:tick-cost` printed a `[WorldGen] Genome NPC top-up` line to stdout ahead of its JSON, so `check:tick-cost` returned `unknown` on a parse error rather than a reading. Stripped the prefix and re-ran; the row is published. Intermittent — the 11:55 and 12:55 runs were clean — so it will resurface. Executor-side, not yours.
- **Tick cost healthy** — 82 ms/tick steady, 3% *below* the 7-day median (84, 16 rows).
- Everything else green: deploy live at `5c37c7dd`, all 3 scheduled workflows and post-merge CI passing, no PRs waiting, all 9 scheduled tasks on schedule, worktree reaper ran 15 minutes ago.
