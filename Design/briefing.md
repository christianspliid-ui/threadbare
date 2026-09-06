# Briefing
**Generated:** 2026-09-06 21:37 local (19:37 UTC) · keep-work-flowing-cc

## The one thing

**Are you still planning to design Traits wave 2? One word.** [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools)

Carried unchanged from last hour, not re-argued. It has sat in the design column **22 days with your name on it**, and the machine is allowed to prepare exactly one new design at a time — so your ticket holds that slot shut.

What is different this hour is worth one sentence: **the machine is visibly working again.** Four tickets closed in the two hours before this run and the build queue held at five only because a lane filed a fresh one as it shipped. That is the throughput your ticket is throttling — not a stalled machine, a working one with nothing new being prepared behind it.

**Yes** changes nothing and the asking stops. **Not getting to it** sets it aside, frees the slot, and the machine starts preparing the next thing tonight. The work itself is location traits going live, artifact traits, and draw-by-trait pools.

## Also waiting (14)

- **[Approve the camp six](https://linear.app/threadbare/issue/THR-1130)** — *"batch 2, run the six"*. [The brief](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/2026-09-04-retrofit-batch-2-brief.md) is merged, unchanged, and pickup-able now.
- **[The undertaking retirement list](https://linear.app/threadbare/issue/THR-1392)** — four templates get deleted; *"run 4b"* finishes the migration.
- **[Do you still want the incident-capture button?](https://linear.app/threadbare/issue/THR-1134)** — you filed it 16 August; yes or no.
- **[Three questions on the undertakings map](https://linear.app/threadbare/issue/THR-1396)** — take [the division rule](https://linear.app/threadbare/issue/THR-1398) first; it unblocks four.
- **[The fight map](https://linear.app/threadbare/issue/THR-1258)** — settle [monster fights](https://linear.app/threadbare/issue/THR-1263) and [duels](https://linear.app/threadbare/issue/THR-1264) and three more open by themselves.
- **[Twenty spells](https://linear.app/threadbare/issue/THR-1232) and [thirty items](https://linear.app/threadbare/issue/THR-1236)** — sketches built for you to react to.
- **[Image credits](https://linear.app/threadbare/issue/THR-876)** — should the spend be gated on you at all?
- **[What is a run about?](https://linear.app/threadbare/issue/THR-1198)** — remembrance, or named campaigns.
- **[One attended dev-server session](https://linear.app/threadbare/issue/THR-1133)** — nineteen captures owed; nothing blocks the sitting.
- **[Chart the hub map](https://linear.app/threadbare/issue/THR-1220)** — advice is still to wait for your slice checkpoint.
- **A Tenacious-style trait** — parked by default, listed so it is not forgotten.
- **Should weekend quiet be normal too?** — one word declines the 45-hour Friday-to-Sunday gap the way you declined overnight quiet.
- **The scripted half of Linear access** — `LINEAR_API_KEY` is still unset, so a handful of background checks stay dark. Nothing is blocked on it.
- **Restart the Claude desktop app when convenient — 30 seconds, and it is new.** Stale background helpers from earlier sessions have piled up and are spinning at full tilt: **16 of them are eating about 30 cores between them, and the machine has been pinned at 100% for over an hour.** Nothing is broken and no work is lost, but it makes every lane slower and it has now blocked the engine-speed measurement two hours running. No agent can clear them safely — killing them would cut live sessions off mid-run. Quitting and reopening the app does it.

## Queue

**Healthy — 5 ready, and the machine is moving well.**

- **Four tickets closed in the two hours before this run** — [THR-1417](https://linear.app/threadbare/issue/THR-1417), [THR-836](https://linear.app/threadbare/issue/THR-836), [THR-1384](https://linear.app/threadbare/issue/THR-1384), [THR-1409](https://linear.app/threadbare/issue/THR-1409). Normal throughput, fully recovered from the weekend outage.
- **Ready for Dev: 5**, all unclaimed, none stale (all touched today). The count held only because a lane filed [THR-1422](https://linear.app/threadbare/issue/THR-1422) (duplicated constants across the engine/render boundary) as it shipped THR-1409 — the shelf is being consumed as fast as it is refilled.
- **In Dev: one live claim** — [THR-1420](https://linear.app/threadbare/issue/THR-1420), companion name collision.
- **Two parked In-Dev items, both waiting on you and both already on your list:** [THR-1130](https://linear.app/threadbare/issue/THR-1130) (ask 2) and [THR-1392](https://linear.app/threadbare/issue/THR-1392) (ask 3). Correctly parked approvals, not stalled work.
- The shelf stays thin by design: the design tier that would refill it is the lead ask above.

## Health

- **Green everywhere the probes can see.** Deploy live and current at `198310f0`; all 3 scheduled workflows and all post-merge CI green; zero open PRs; all 9 scheduled tasks on schedule; the worktree reaper ran at 20:42 and flagged 3 for disposition.
- **Tick cost was measured this run and the row was deliberately not published — and the cause is now identified.** The engine came back at **1233 ms/tick against a 7-day median of 84**, with warm-up inflated in step (907 ms), which is not a shape any code change produces. Last hour reported the same anomaly and named contention without finding the source. It is found: **16 stale `python` MCP helper processes are consuming ~3075% CPU between them**, with the machine pinned at 100% and 35 such processes alive in total. The reading measures that, not the simulation, so publishing it would have poisoned the median for a week. This is the second consecutive hour the trend has gone dark, which is why it is on your list above as a 30-second restart rather than kept as an agent-side note.
- Visibility only, no action: the silence probe still reports the same three gaps (44.9 h weekend, 11.7 h and 10 h overnight). The two overnight ones are declined under your 8 August ruling; the weekend one is on your list above.
- Agent-owned, unchanged and flagged for the Friday retro, not for you: **seven merges to `main` from the outage window carry no `Fixes THR-XX` line** ([PRs #1821–#1827](https://github.com/christianspliid-ui/threadbare/pulls?q=is%3Apr+is%3Amerged)) because the lanes correctly refused to claim board tickets they could not reach. Shipped but unticketed, and needs reconciling.
