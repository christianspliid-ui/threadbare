---
lane: daily-backlog-grooming
run: 2026-08-12
promoted: 0
filed: 0
resolved: 1
newFindings: 1
needsChristian: true
---
# Backlog Grooming — 2026-08-12

## Needs Christian

- **The two lanes that move work are switched off, and the board has been frozen ~15 hours.** `tb-opus-pickup` (the executor) and `tb-orchestrator` both read `enabled: false`; their last runs were 2026-08-11 22:01 and 21:26 local, and nothing has merged to `main` since 22:29 that night — while 21 claimable tickets sit in Ready for Dev and In Dev is empty. Every other lane is healthy and caught up, so this is not a harness outage. It looks deliberate: they went dark right as you were purging the queue by hand that evening, which is exactly when you'd want the executor to stop claiming tickets you were about to cancel. **Recommendation: if the purge is finished, switch both back on — the shelf is stocked and nothing is waiting on you to unblock it.** If you meant them off for longer, say so and I'll stop reporting it as a stall.
- **Nothing else is waiting on your judgement.** Both encounter verdicts are in — [THR-907](https://linear.app/threadbare/issue/THR-907) four of four, [THR-974](https://linear.app/threadbare/issue/THR-974) ruled "not yet". What is missing now is *design capacity*, not direction: the two High-priority items, [THR-1082](https://linear.app/threadbare/issue/THR-1082) (consequence icon language) and [THR-1043](https://linear.app/threadbare/issue/THR-1043) (the Encounter Factory), each need a design session to write the plan doc before an executor can touch them — and the lane that stages design requests is one of the two switched off.

## Work in flight

**In Dev: nothing blocked — and nothing at all.** Zero In Dev, zero parked, none stale. That is the freeze above, not healthy idle.

## Technical gates resolved this run

- **Materiality sweep executed — 0 cancellations**, per [THR-1090](https://linear.app/threadbare/issue/THR-1090)'s remit (run early in good faith; the ticket itself is still queued). Reason: all 21 Ready-for-Dev items are the survivor set from Christian's own hand review ~14h ago, which cancelled 9 and batched 7 into [THR-1089](https://linear.app/threadbare/issue/THR-1089). Nothing has been filed since — re-judging his survivors the next morning is churn, not grooming.
- **Linear is back.** Yesterday's run no-opped entirely on an unauthenticated connector; every query and write worked today. Impediment #535, carried in that report, can be closed by the weekly retro.
- **Project "Engine Observability & Performance" moved Now → Done** — all 5 issues terminal (4 Done, 1 Canceled) since THR-582; it had advertised itself as live work for six weeks.

## Counts by state

In Dev 0 · Ready for Dev 21 (13 player-visible defects, 8 process) · Todo 16 · In Design 1 · Implementation Planning 0 · Idea 60+

## Problems found and fixed

- Orphan-deferral audit clean — every `TODO`/`DEFERRED`/`FIXME` under `src/` carries a `(THR-…)` id; the two bare hits are the word used in prose inside doc comments (`sublocation.ts:598`, `encounter-image-library.ts:6`).
- No orphan issues: every issue across all six states carries a project. Roadmap cross-reference clean — every `.planning/ROADMAP.md` Future Work item maps to a live Linear issue or project.
- **Flagged, not fixed:** project "Attention Tier Model" sits at `Now` with zero active issues (only THR-59, in Idea). It trips no hygiene rule literally, so I left it rather than force a state.
- **No ticket filed for the lane freeze**, per the 2026-08-10 throttle — lanes log, the weekly retro promotes. It clears the materiality bar (~15 lane-hours lost) and Friday's retro should take it.

## Pipeline status

The shelf is stocked; the blockage is downstream. Pickup order once the executor is back on: product first per the budget rule — [THR-1085](https://linear.app/threadbare/issue/THR-1085), then [THR-1070](https://linear.app/threadbare/issue/THR-1070) / [THR-1080](https://linear.app/threadbare/issue/THR-1080) — holding process work to one item per three runs. Upstream, nothing new is entering the feature pipeline: every High item is a design deliverable, which makes design-session capacity the real constraint this week.
