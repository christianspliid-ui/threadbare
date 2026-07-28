# Backlog Grooming — 2026-07-28

## Needs Christian

Nothing needs a decision from you. One thing is worth knowing: **the Nudge Model program is one step from finished and that step is stalled on a mechanical split, not on a design question.** WS0–WS4 are all Done (THR-773/774/775/776/777 + image batches 2–4). The only open child, WS5 content migration (THR-778), is a container whose per-family batch children were never created, so the hourly executor bounced it and would have kept bouncing it. The lane that does that split (`tb-orchestrator`) has not run since 20:27 yesterday — filed as THR-837. **Recommendation:** no action from you today; if WS5 still has no children by tomorrow's grooming run, that is worth your attention.

## Work in flight

- **THR-804** (was the only In Dev) — **shipped and closed this run.** PR [#992](https://github.com/christianspliid-ui/threadbare/pull/992) merged at 07:20Z (`d0170608`), auto-close fired to Done. The executor's 07:09 comment correctly diagnosed the earlier red check as a 20-minute job timeout, not a defect, and filed THR-835 for the 80–90% timeout utilisation. Nothing remains.
- **In Dev is now empty** — the 08:00 executor run picks fresh.

## Technical gates resolved this run

- **THR-778 → Todo.** Queue hygiene, executing the request the executor made at 05:03 and nothing acted on for ~14h. It is an unsplit container with no coordination block: the top Ready-for-Dev candidate by priority, refused every hour, costing a candidate slot per run for nothing. The orchestrator skill's own words (§ T1 step 4b) call this "worse than leaving it in `Todo`". Reasoning posted to the issue, including an explicit *do not re-promote as-is* — the split is T2 design input, not a T1 promotion.

## Filed this run

- **THR-837** (High) — `tb-orchestrator` has not fired since 2026-07-27T20:27Z, ~11 hours / ≥11 slots, while both hourly siblings are current and the machine was demonstrably awake for the 05:26 and 06:26 slots. No `Docs/ops/orchestrator-2026-07-28.md` exists on main, so the lane produced no work rather than merely failing to stamp `lastRunAt`. Filed with a coordination block already attached.
- **THR-836** (Medium) — nothing authors coordination blocks for issues filed *directly* into Ready for Dev. Cowork's handoff is retired and the orchestrator only authors on promotion, so executor-filed deferrals are born failing `pull-work` Step 3. Every candidate now costs either a bounce (THR-778) or a hand-written reversal (THR-804). Predicate-based, four candidate directions, no direction chosen.

## Counts by state

In Dev 0 · Ready for Dev 20 · Todo 30 · In Design 0 · Implementation Planning 0 · Idea 63.

## Problems found and fixed

- **The queue head was jammed** — see THR-778 above. Fixed.
- **No orphan issues.** Every issue across all six states carries a project (Idea checked exhaustively, both pages).
- **No stale design work** — In Design and Implementation Planning are both empty, so nothing can sit there.
- **Deferrals in Ready for Dev are correct, not a violation.** CLAUDE.md's prioritisation rule 1 names `list_issues label:"Deferral" state:"Ready for Dev"` as the *first* place to look for work. The grooming prompt's "deferrals belong in Idea or Todo" bullet contradicts CLAUDE.md; CLAUDE.md wins, no issues moved.
- **Roadmap cross-reference (Step 3): no filings needed.** `.planning/ROADMAP.md` is unchanged since 2026-04-03 and every Future Work item still maps to Linear coverage (Content Architecture phases → THR-54/55/56, culture seeding → THR-70, NPC workforce → THR-67, chain reactions → THR-68, Codex → THR-52, plus the Social Systems, M3 and Onboarding projects). Its stale *status claims* remain tracked by THR-763.

## Flagged, not changed

- **Repo Health** is `Next` while holding Ready-for-Dev work (THR-807). Unchanged from yesterday's call — one Low item does not justify claiming active focus.
- **Idea is 63 deep.** Already tracked twice (THR-574 stale-Idea triage, THR-756 stop filing weekly drift-scan duplicates). Nothing new filed into that pile by design.

## Pipeline status

Healthy on depth, thin on program work. 20 items Ready for Dev, none blocked — but only ~5 are non-`Deferral`, and all of those are Low. **Recommended next pickup: THR-837** (High, and it unblocks the lane that feeds every other pickup). Then **THR-822** (Medium, Content Architecture deferral, satisfies "finish before you start"). Note both will trip the Step 3 coordination-block gate — THR-837 ships with a block attached; THR-822 has zero comments and will need the reversal ritual until THR-836 lands.
