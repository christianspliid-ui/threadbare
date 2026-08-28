---
lane: tb-orchestrator
run: 2026-08-28f
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-08-28 (run f, ~15:31Z)

## Needs Christian

**Nothing new this hour.** A real engine fix went onto the shelf and it needs nothing from you — the world's trade routes have been quietly deleting themselves six ticks after anyone founds them, so a season of an agent's work vanished before the next season and the blockade counter-play it was supposed to enable has never once fired in any run. The job to fix it was written up this morning, was correctly told to wait for another piece to land, and then sat unnoticed for three and a half hours after that piece landed. It is now queued. ([THR-1320](https://linear.app/threadbare/issue/THR-1320/a-strategically-founded-trade-route-dissolves-6-ticks-after-founding))

**Two standing asks, both unchanged — skip if you have seen them.**

1. **The design column is the bottleneck, and it has been for nineteen runs.** Two items sit there unpicked: [the card-grammar unification](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) at **9 days** and [traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) at **13**. Pick one up or park it, and nine design calls start moving.
2. **Approving [the retrofit batch-2 brief](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/retrofit-batch-2-brief.md) unlocks the camp-seven encounter work** ([THR-1222](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine)). This is the only queued item that would put real *content* work on a shelf that currently holds none.

## T1 — unblock sweep

**Promoted: 1. Held: 1. Filed: 0.** Scans complete (`hasNextPage: false` throughout): **45 `Todo`**, **4 `Ready for Dev`** before the write and **5** after, **5 `In Dev`** (THR-1313 and THR-1309 claimed, plus the same three `Parked` items THR-1130 / THR-1133 / THR-1168). THR-1311 has gone `Done` since run e.

**The two documented scans were not sufficient this run, and that is the run's finding.** T1's scan queries only `Todo` and `Ready for Dev`. The one genuinely promotable item on the board was in **`Idea`**, and would have been missed for a fourth consecutive run. Both extra states were queried by hand.

### Promoted

| Issue | Evidence |
|---|---|
| [THR-1320](https://linear.app/threadbare/issue/THR-1320/a-strategically-founded-trade-route-dissolves-6-ticks-after-founding) — a strategically-founded trade route dissolves ~6 ticks after founding, so the `trade_route` counter-play never fires | Sole blocker **THR-1308 `Done` 11:59:09Z** (PR #1689, commit `6b553538`, on `origin/main`). The 11:31Z hold's stated reason — `strategic_blockade_route` had **0** hits on `main`, making Done-when 2 unsatisfiable — re-measured this run at **3 hits**; all four Done-whens now satisfiable. Latest-comment check (THR-990): the hold itself, no retire verdict. Names no plan doc → liveness gate passes trivially. Ceiling did not bind (shelf 4 ≪ 15). Verified by `get_issue`: `Ready for Dev`, `assignee` key absent. [Block posted](https://linear.app/threadbare/issue/THR-1320/a-strategically-founded-trade-route-dissolves-6-ticks-after-founding) |

**This promotion was already decided; it just could not be seen.** A prior run held THR-1320 at 11:31Z rather than declining it, set a native `blockedBy` relation, and wrote the release condition explicitly: *"T1 promotes it automatically once THR-1308 goes `Done` — no re-derivation needed next run."* THR-1308 went `Done` at **11:59Z**. Runs c (13:35Z), d and e (14:30Z) each swept and none promoted it — **not a judgement error, a scan gap**: the ticket sits in `Idea`, which T1 never queries. The hold worked exactly as designed and the release depended on a query that was never issued.

**Cost, stated plainly because it is the materiality evidence:** a well-formed engine defect fix waited **~3h32m** across three sweeps while the shelf held **zero** non-`Deferral` program work. This is the same gap recorded on 2026-08-17 (THR-1150 / THR-1151 filed into `Idea` overnight and invisible to every downstream lane). It is now twice-measured. **Not filed as a ticket** — the process-work throttle routes it to the impediment log, and the weekly retro is the single promotion point. [PR #1694](https://github.com/christianspliid-ui/threadbare/pull/1694) (this week's retro) is open now and is the right place for it; the fix is a one-line amendment adding `Idea` and `Implementation Planning` to the skill's § T1 step 1.

**The mutex was re-derived at promotion, not forwarded** — run e's own finding about filing-time blocks ageing, applied. The filing block named THR-1308 as a live mutex (it was `In Dev` then; it has since merged, so that reason is dead) and THR-1309 as *conditional*. That conditional is now **live and resolved to the file level**: `gh pr view 1690 --json files` shows PR #1690 edits `src/engine/strategicGraphOps.ts`, so THR-1320's *cheapest* fix option collides while its other two — landing in `tradeRoute.ts` / `phaseTradeRouteDecay.ts`, neither in #1690's file list — are disjoint and can proceed today. The block states which option is safe rather than blocking the whole ticket.

### Held

| Issue | Evidence |
|---|---|
| [THR-1294](https://linear.app/threadbare/issue/THR-1294/requireslocation-defaults-off-undertakings-ignore-their-stage-until) — `requiresLocation` defaults off, so undertakings ignore their stage | Done-when has two halves. **Half one met:** doc 3, the binder (THR-1296), `Done` 2026-08-27T11:44Z. **Half two one merge short:** doc 2 (THR-1297) is `Done` but shipped T1 whole with T2/T3 absent by design — T2's per-kind rows landed with THR-1308, **T3's are still being authored in THR-1309 (`In Dev`)**. Compounding it, PR #1690 edits **all three** of this ticket's key files: `strategic-action-constants.ts` (where `UNDERTAKING_DEFAULT_REQUIRES_LOCATION` lives, line 232), `undertaking-kinds.ts`, and `strategicActionLifecycle.ts`. **Native `blockedBy` → THR-1309 set this run**, replacing a stale prose mutex on the long-merged THR-1292, so the next sweep releases it without re-deriving any of this |

Held rather than declined for the reason the board paid for twice today: promoting into a known file collision is what produced the THR-1321 / THR-1322 bounce cycle below.

### Declined

**THR-1321 and THR-1322 — do not re-promote.** Both were promoted (13:32Z / 13:31Z), claimed by the executor, bounced within a minute, and at **15:08Z** demoted to `Todo` with **native `blockedBy` relations to THR-1309**, which is `In Dev` and unmerged. The gate is now machine-readable and correct; a re-promotion would restart a cycle that has already cost two claims. This is the healthy repair, not a defect.

**Nothing else was re-derived.** Runs c/d/e's classification of the remaining `Todo` set stands unchanged and no member has moved: THR-1222 (unmet chat-approval gate — the standing ask above), THR-1195 (standing verdict on record), THR-1256 (unmet time gate, opens 2026-09-08), the six design-gated tickets routed to T2, and the program epics and plan-doc sessions. Re-listing them hourly with identical evidence is the dump this lane forbids. All `wayfinder:*` items were skipped unconditionally — they are T1.5's input and never enter `Ready for Dev`.

**One hygiene observation, surfaced not acted on.** THR-1320 and THR-1323 both sit in `Ready for Dev` with **no project**, against CLAUDE.md's "every Linear issue belongs to a project — no orphans". Both plainly belong to *Thematic Pressure & Living World* on their siblings' evidence. `daily-backlog-grooming` owns state hygiene; this lane owns sequencing, so the field was left alone and is reported instead.

## T1.5 — wayfinder sweep

Three open maps, unchanged: [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict), [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft), [Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator).

**AFK burn-down: 0, re-proved independently rather than inherited from run e.** Two direct label queries: `wayfinder:research` returns **19 issues, every one `Done`**; `wayfinder:task` returns **3, every one `Done`**. So the zero means *every agent-doable ticket these maps have ever carried is finished*, not "none happens to be in `Todo`" — a distinction worth re-proving, because the two read identically in a report and only one of them is healthy. Nothing claimed, nothing assigned, no guessed resolution posted.

**HITL frontier deliberately not re-listed.** Every open child across the three maps carries `wayfinder:grilling` or `wayfinder:prototype`, which an agent must not resolve. The set is unchanged since 2026-08-26 and has already been surfaced; re-surfacing it hourly is the same dump.

## T2 — design staging

**Triggered, bound out — nineteenth consecutive run.** Nothing staged, bound not overridden.

Non-`Deferral` items in Ready for Dev: **0**, against `ORCH_PROGRAM_WORK_FLOOR` of 2. `In Design` holds **2** against `ORCH_MAX_IN_DESIGN` of 1 — THR-1002 (**9 days** unpicked) and THR-790 (**13 days**). Both far past 48h, therefore **re-surfaced, not re-staged**.

**This run's promotion did not move the measure, and that is now four consecutive runs.** THR-1320 carries `Deferral`, so the shelf went 4 → 5 while program work stayed at **0**. Run c logged the reason the measure is distorted — `Deferral` has become the closeout convention for anything filed mid-slice, including work that is not deferred in any meaningful sense — and that remains an impediment-log row for the weekly retro, not a ticket. It does not clear the materiality bar alone and is not re-filed here.

**Had the bound been open, the staging pick would again have been [THR-1274](https://linear.app/threadbare/issue/THR-1274/no-non-human-cast-primitive-a-beast-cannot-be-a-bound-scene-actor)**, unchanged from runs d and e and recorded so it is not re-derived next run. Runner-up unchanged: THR-1315.

**T2's queue is unchanged in composition:** nine design calls in `Todo` (THR-1287, THR-1274, THR-1134, THR-1195, THR-1114, THR-1189, THR-1302, THR-1315, THR-1318), plus two parked in the column, plus three Proactive-Agent-Actions plan-doc sessions (THR-1298 / THR-1299 / THR-1300), plus ten wayfinder questions on fully-prepared maps. This run added none and cleared none.

**The headline is unchanged and remains a supply problem: the feature pipeline needs design/Christian.**

## T3 — architecture health

**Not due — already run today.** Run b performed the daily sweep at 07:35 local, the first past `ORCH_HEALTH_SWEEP_HOUR` (6): [`…-28b.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-28b.md). One sweep per day; this run does not repeat it.

**No detector ran this run and none is reported as clean.** `newFindings: 0` is literal, not a clean bill. `__DEBUG.validateTraitRefs()` is browser-only and cannot run headless: not run, not reported as clean.

**Redundancy: not assessed this sweep.** Run b's pass stands. Nothing above amends it — the scan-gap finding is a lane-coverage defect reached by querying Linear, not a judgement pass over the interface map and systems inventory.

**Stalled work: not re-assessed**, but one adjacent observation is worth a line because it bears directly on the two gates set this run. **Both mutex partners are `DIRTY`**: PR [#1690](https://github.com/christianspliid-ui/threadbare/pull/1690) (THR-1309) and PR [#1693](https://github.com/christianspliid-ui/threadbare/pull/1693) (THR-1313), with [#1694](https://github.com/christianspliid-ui/threadbare/pull/1694) (the weekly retro) `BLOCKED`. THR-1309 is the release condition for THR-1294 *and* the live mutex on THR-1320's cheapest option, so a conflict left unresolved there holds two tickets rather than one. Resolving a `DIRTY` PR is the executor's own work (`git merge origin/main && git push`) and is not escalated — recorded so the next run reads the gates it inherits correctly.

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Friday. Monday's [`test-suite-health-2026-08-24.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-08-24.md) stands and is deliberately not re-reported.

## Escalations

**None raised, and none warranted.** T2's agreed work is not *exhausted* — it is **bound out**, which does not trigger the stop-and-ask rule: nine agreed design calls are queued and available the moment `In Design` has room. Nothing was parked, no un-agreed roadmap item was picked up to stay busy, and Discord was not contacted.

**Nothing filed.** The `Idea`-scan gap documented in § T1 is now twice-measured and cost ~3.5 hours of a starved shelf this run — but scheduled lanes do not file process tickets, and the weekly retro is the single promotion point. It goes to the impediment log with its cost quoted, for [PR #1694](https://github.com/christianspliid-ui/threadbare/pull/1694) to batch.

**Product-vs-process ratio for the week:** this run's single promotion is product work — an engine defect in the trade-route economy that makes an entire authored counter-play unreachable. Zero process tickets promoted, zero filed.
