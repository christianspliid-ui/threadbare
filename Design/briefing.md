# Briefing
**Generated:** 2026-09-06 20:35 local (18:35 UTC) · keep-work-flowing-cc

## The one thing

**Are you still planning to design Traits wave 2? One word.** [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools)

**Linear is back — you do not need to do anything about it.** It recovered on its own around 17:15; the board reads normally this run and a lane claimed a ticket at 18:16. The ask that led this brief for seven runs is retired, not carried. Detail in [ask 14](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

That clears the way for the one that actually costs something. THR-790 has sat in the design column **22 days with your name on it**, and the machine is allowed to prepare exactly one new design at a time — so your ticket is holding that slot shut while the build queue drains. It is down to **five items**, and the weekend outage drained it with nothing refilling behind.

**Yes** changes nothing and the asking stops. **Not getting to it** sets it aside, frees the slot, and the machine starts preparing the next thing tonight. The work itself is location traits going live, artifact traits, and draw-by-trait pools — and it is smaller than earlier briefs claimed: three of the four things it was said to be blocking closed under their own power.

## Also waiting (13)

- **[Approve the camp six](https://linear.app/threadbare/issue/THR-1130)** — *"batch 2, run the six"*. [The brief](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/2026-09-04-retrofit-batch-2-brief.md) is merged and unchanged — and now genuinely pickup-able, with the board back.
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
- **The scripted half of Linear access** — `LINEAR_API_KEY` is still unset, so a handful of background checks stay dark. Nothing is blocked on it; not worth your evening.

## Queue

**Healthy — 5 ready, and the machine is moving again.** First readable board since Friday.

- **Ready for Dev: 5**, all unclaimed, none stale (all touched 2026-09-04). Top of queue is [THR-1407](https://linear.app/threadbare/issue/THR-1407) (`owningSystem` registry sweep, no priority); the other four are Low-priority bugs and infrastructure.
- **In Dev: one live claim** — [THR-1420](https://linear.app/threadbare/issue/THR-1420) (companion name collision), claimed 18:16, an hour into the recovery.
- **Two parked In-Dev items, both waiting on you and both already on your list:** [THR-1130](https://linear.app/threadbare/issue/THR-1130) (ask 2) and [THR-1392](https://linear.app/threadbare/issue/THR-1392) (ask 3). Neither is stalled work — they are your approvals, correctly parked.
- The shelf is thin by design right now, not by accident: the design tier that refills it is the lead ask above.

## Health

- **All green.** Deploy is live and current at `198310f0`; all 3 scheduled workflows and all 3 post-merge CI workflows passing; zero open PRs; all 9 scheduled tasks on schedule; the worktree reaper ran and flagged 3 for disposition.
- **Tick cost was not measured this run, and no trend row was published.** The measurement came back at 1624 ms/tick against a 7-day median of 84 — with warm-up equally inflated, which is not a shape any code change produces. The machine was pinned at **100% CPU across 49 node processes** while it ran, so the reading is contention, not the engine. A serial re-run gave the same answer under the same load. Publishing that row would have poisoned the median for a week, so it was dropped rather than recorded. Next hour re-measures.
- Superseded, noted so the trail is clean: this morning's [tb-orchestrator](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-06b.md), [daily-backlog-grooming](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/backlog-grooming-2026-09-06.md) and [weekly-project-hygiene](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/weekly-hygiene-2026-09-06.md) reports all lead with the Linear outage. All three are now stale on that point. The orchestrator's later run says so itself — *"Stand down the Linear ask at the top of your briefing — it fixed itself"* — and its own lead ask, THR-790, is the lead here.
- One real cost the outage left behind, agent-owned and flagged for the Friday retro, not for you: **seven merges to `main` carry no `Fixes THR-XX` line** ([PRs #1821–#1827](https://github.com/christianspliid-ui/threadbare/pulls?q=is%3Apr+is%3Amerged)) because the lanes correctly refused to claim board tickets they could not reach. That work is shipped but unticketed and needs reconciling.
- Visibility only, no action: the silence probe still reports the same three gaps (44.9 h weekend, 11.7 h and 10 h overnight). The two overnight ones are declined under your 8 August ruling; the weekend one is on your list above.
