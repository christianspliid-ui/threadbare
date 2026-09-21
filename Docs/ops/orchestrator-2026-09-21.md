---
lane: tb-orchestrator
run: 2026-09-21
promoted: 0
filed: 0
resolved: 0
newFindings: 2
needsChristian: false
---
# Orchestrator — 2026-09-21 (run a, ~15:40Z)

## Needs Christian

**Nothing new for you this hour.** The two standing asks — one design chat, and finishing the encounter sitting — are unchanged and already on your briefing. Runs f and g said they would stop repeating them as news, and this run holds to that; they have not moved because only you can move them.

What this run did instead was the weekly check-up on the test suite, which was overdue. It found something small but real: **two dials in the content editor do nothing.** They are labelled as controlling how far a region-wide magical effect reaches, and a designer moving them would see no change in the game, because the code they feed is never run. Nothing is broken and nothing is lost — it is a lever that was built and never connected. An executor can pick it up; it does not need a decision from you.

## T1 — unblock sweep

**Board unchanged since run g read it last night.** Shelf on arrival and departure: **0** `Ready for Dev`, **0** `In Dev`, **0** `Implementation Planning`. State names re-confirmed against `list_issue_statuses` before trusting the empties — an empty result and a wrong state name are the same response shape, and "the queue is empty" is too consequential to read off an unverified filter.

`Todo`: **26**, the same set run g reported, with no id added or removed. The most recently touched candidate is THR-790 at 2026-09-20T13:32Z, which predates run g's own sweep.

- **15 wayfinder-labelled** → skipped unconditionally, T1.5's input, never `Ready for Dev`.
- **11 non-wayfinder candidates** — all carry recorded decline evidence from run f's full audit, and none has moved since.

**Promotions: 0.** Neither the batch cap (5) nor the backed-up-shelf ceiling engaged; with a shelf of 0 the ceiling could not bind. Nothing was re-derived by hand this run: run f read all eleven and the board has not moved, and re-deriving identical declines hourly is the reporting pathology this lane's own rules name.

**Rule 0 / materiality:** nothing filed. **Product-vs-process completion ratio, trailing 48h: 5 product : 4 process** — unchanged; no completions in the window. **Headline, unchanged for the eighth consecutive run: the feature pipeline needs a design session, not another promotion.**

## T1.5 — wayfinder sweep

Three open maps: Item Generator (THR-1227), Powers & Spellcraft (THR-1226), Physical Conflict (THR-1258). None updated since 2026-09-11.

**AFK frontier: 0.** Re-confirmed from this run's own `Todo` scan: all 15 wayfinder items are `wayfinder:map` (3), `wayfinder:prototype` (6) or `wayfinder:grilling` (6). **Not one is `wayfinder:research` or `wayfinder:task`**, so there is no agent-resolvable ticket on any map. `ORCH_WAYFINDER_AFK_MAX` did not bind; nothing claimed, resolved or closed.

**HITL frontier: 12** (11 unassigned; THR-1232 is Christian's), unchanged since 2026-08-26 and already carried on the briefing — not re-listed and not re-surfaced. Method note, as in runs c–g: with no AFK ticket to gate, per-candidate `includeRelations` reads were **not** run, so "frontier" here means *open and unassigned*, not *relation-unblocked*.

## T2 — design authoring

**Triggered, and barred — eighth consecutive run.** Non-`Deferral` `Ready for Dev` is **0** (floor 2). `In Design` classifies **2 live, 0 excluded** against `ORCH_MAX_IN_DESIGN` of 1, so nothing could be staged.

**Nothing mutated.** Classification was by hand against the documented predicate; `scripts/stale-claim-sweep/index.ts` was **not** executed, because it posts warning comments as a side effect and a read-only tier must not mutate issues in order to measure them.

THR-1448 (last activity 2026-09-19T15:45Z, **2.0d**) and THR-1479 (2026-09-19T07:18Z, **2.4d**) both classify `live`, comfortably inside the 7-day threshold as `classifyInDesignItem` computes it. On the *intended* predicate they would read 11d and 10d and both would be excluded, freeing the tier. That gap is the self-referential-clock defect recorded in run a of 09-20 with the code path named (`scripts/stale-claim-sweep/index.ts:327–383`); it is **logged for the retro and not re-litigated here**. The skill is explicit that when prose and the function disagree, the function is what ran — so the bound binds, and staging on a hand re-derivation would be this lane overriding its own governor to produce a third unanswered design ask. **Practical cost of the bar this run: nil.**

**THR-1348 remains the queued next stage** the moment either In Design item leaves the column — THR-790's 2026-09-11 comment (Christian: *"you are approved to unblock everything here"*) assigns the freed slot to it explicitly. Carried forward from runs e–g so it is not re-derived from a buried comment.

## T3 — architecture health

**Due, and all four detectors ran.** First sweep today (local 17:40). Baseline: [2026-09-20 run a](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-20.md).

| Detector | Result | vs. 09-20 |
|---|---|---|
| `generate-interface-map:dry` | 7 LEAKED (all ticketed: THR-720, THR-997, THR-883 ×3, THR-1130, THR-800) | Unchanged |
| `sweep:rank-reach` | PASS: 60 reachable, 0 blocked, 0 unowned, 13 apex holders at tick 900 | Unchanged |
| `check:process` | passed-with-gaps: systems inventory, setting coverage, plans index, design wiki, wiki freshness, authoring brief all current. Query-prize floor VACUOUS (9 briefs). **3 sub-checks did not run** — `LINEAR_API_KEY` unset, so recent-plan-references, orphan-issues and Ready-for-Dev-handoff-keywords were skipped and are **not reported clean** | Unchanged |
| `check:canon-staleness` | 30 warnings | Unchanged (30 → 30, same set) |

`__DEBUG.validateTraitRefs()` is browser-only and cannot run headless. **It was not run and is not reported clean.**

**Redundancy: assessed this sweep**, and it produced finding 1 below — the first time this half of the duty has returned a result rather than a disclaimer. It was reached through the weekly test-suite pass's import graph rather than by reading the two canon pages, which is a cheaper route to the same judgement and worth repeating.

**Stalled work:** none — `In Dev` is empty.

**Hand-created `In Dev` tickets:** none — `In Dev` is empty.

**In Design: 2 live, 0 excluded** (THR-1448 unassigned, 2.0d; THR-1479 unassigned, 2.4d — neither stale by the function's clock, both counted).

### New finding (1): a module that is green on the interface map has no caller at all

`src/engine/effectScope.ts` — 292 lines, `resolveScope`, last touched 2026-09-10 by THR-1155 slice 1 — has **zero production callers**. Repo-wide the symbol appears in the module that defines it and in its own test, nowhere else.

**It is badged green, honestly, and the badge is silent about this.** The module is a declared **read site** of the `area-partition-to-map` contract (`scripts/interface-contracts.ts:175`), and that row is 🟢 LIVE. The badge is earned — effectScope genuinely reads `areaProjection`. But the contract measures it as a *consumer of the partition* and has nothing to say about whether anything consumes **effectScope**. A module can be a live reader of an upstream contract and still be a dead end. **No reachability sweep will flag this**, which is precisely why it is this tier's work and not a script's.

**The part with a consequence:** two CMS tunables are inert behind it.

| Constant | CMS-stated consumer | Actual readers |
|---|---|---|
| `SCOPE_REGION_MAX_HEXES` | `effectScope → region resolution` | `effectScope.ts` only — which nothing calls |
| `RULE_OVERRIDE_MAX_PER_HEX` | `effectScope → rule override resolution` | **none anywhere** — `effectScope.ts` does not reference it |

A designer moving either slider changes nothing in a running game. That is an NFP #1 (tunability) defect on the surface whose entire job is tunability.

**Not filed** (process-work throttle: scheduled lanes log, the weekly retro promotes). **Not a deletion recommendation either** — THR-1155 invested in this module eleven days ago, so *missing consumer* is the likelier reading than *residue*, and deleting would destroy that work. `RULE_OVERRIDE_MAX_PER_HEX` is separable and is simply false today. Full evidence in the weekly file.

### New finding (2): the weekly test-suite pass — summed time grew 33.7% against 10.6% file growth

Full detail: **[`Docs/ops/test-suite-health-2026-09-21.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-09-21.md)**.

Counts: **3 dead-coverage candidates carried** (one resolved itself — the `AgentDetailPanel` island was deleted since 09-07), **10 slow files reported**, **0 tickets filed**. Suite is **1307 files / 20839 tests, all green**; summed file time **729.1s**, up from 545.4s a fortnight ago. Five files spend >10s each to run a single assertion — 15.4% of summed time for 5 assertions — all of them liveness tests driving real worlds, so they are ranking information and explicitly **not** deletion candidates.

**This pass was a fortnight late**: no run exists for 2026-09-14, the second consecutive skipped week in this duty's history, cause not recorded in the ops archive. Worth one line at the retro.

## Escalations

**None opened, nothing parked.** No blockages this run. The two standing asks are Christian's to schedule, are unchanged, and are deliberately not re-surfaced as news — run g was the seventh run to carry them. This report exists because the daily detector sweep and the overdue weekly test-suite pass were both due, not because the board changed.
