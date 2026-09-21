---
lane: tb-orchestrator
run: 2026-09-21b
promoted: 0
filed: 0
resolved: 0
newFindings: 1
needsChristian: false
---
# Orchestrator — 2026-09-21 (run b, ~17:29Z)

## Needs Christian

**Nothing new for you this hour.** The two standing asks are unchanged and already on your briefing; runs f and g stopped repeating them as news and this run holds to that.

This run found one thing worth a line at the next retro, and it is purely internal plumbing — no decision from you. Short version: the board has an automatic reminder that nags when a design item has sat untouched too long. **The nag itself counts as activity**, so every time the system complains that an item is stalled, it resets that item's "untouched" clock to zero. Nothing is lost and nothing is broken for you; it just means the stall-detector can never fire on the two items currently sitting in design. An earlier report today diagnosed this as a different fault, so this run records the correct one so the retro fixes the right thing.

## T1 — unblock sweep

**Board unmoved since [run a](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-21.md) read it 1h49m ago.**

State names re-verified against `list_issue_statuses` before trusting any empty — an empty result and a wrong state name are the same response shape, and four empties in a row is too consequential to read off an unverified filter. All four names resolve exactly: `Ready for Dev`, `Implementation Planning`, `In Dev`, `In Design`.

| Column | Count |
|---|---|
| `Ready for Dev` | **0** |
| `Implementation Planning` | **0** |
| `In Dev` | **0** |
| `In Design` | 2 |
| `Todo` | 26 |

`Todo` holds the same 26 ids run a reported, none added or removed; the most recently touched is still THR-790 at 2026-09-20T13:32Z, which predates run a's own sweep.

- **15 wayfinder-labelled** → skipped unconditionally. T1.5's input, never `Ready for Dev`.
- **11 non-wayfinder candidates** — all carry recorded decline evidence from run f's full audit, none has moved.

**Promotions: 0.** Neither the batch cap (5) nor the backed-up-shelf ceiling engaged; with a shelf of 0 the ceiling cannot bind. Nothing re-derived by hand: run f read all eleven, the board has not moved, and re-deriving identical declines hourly is the reporting pathology this lane's own rules name.

**Rule 0 / materiality:** nothing filed. **Product-vs-process completion ratio, trailing 48h: 5 product : 4 process** — unchanged, no completions in the window. **Headline, ninth consecutive run: the feature pipeline needs a design session, not another promotion.** Stated once; not re-argued.

## T1.5 — wayfinder sweep

Three open maps — Item Generator (THR-1227), Powers & Spellcraft (THR-1226), Physical Conflict (THR-1258). None updated since 2026-09-11.

**AFK frontier: 0.** Re-confirmed from this run's own `Todo` scan: all 15 wayfinder items are `wayfinder:map` (3), `wayfinder:prototype` (6) or `wayfinder:grilling` (6). **Not one is `wayfinder:research` or `wayfinder:task`**, so no agent-resolvable ticket exists on any map. `ORCH_WAYFINDER_AFK_MAX` did not bind; nothing claimed, resolved or closed.

**HITL frontier: 12** (11 unassigned; THR-1232 is Christian's), unchanged since 2026-08-26 and already carried on the briefing — not re-listed, not re-surfaced. Method note, as in runs c–a: with no AFK ticket to gate, per-candidate `includeRelations` reads were **not** run, so "frontier" here means *open and unassigned*, not *relation-unblocked*.

## T2 — design authoring

**Triggered, and barred — ninth consecutive run.** Non-`Deferral` `Ready for Dev` is **0** (floor 2). `In Design` classifies **2 live, 0 excluded** against `ORCH_MAX_IN_DESIGN` of 1.

**Nothing mutated.** Classification was by hand against `classifyInDesignItem` as written; `scripts/stale-claim-sweep/index.ts` was **not** executed, because it posts warning comments as a side effect and a read-only tier must not mutate issues in order to measure them.

Both items classify `live`, and the finding below is why. **The bar is correct and I am not overriding it** — the skill is explicit that when prose and the function disagree, the function is what ran, and a lane that talks its way past its own governor to stage a third unanswered design ask is the failure this bound exists to prevent.

**The bar also cost nothing this run, for a reason independent of the defect.** The grooming lane's 15:40Z comment on THR-1479 makes the argument better than I can, and I endorse it: the constraint is **plan-doc authoring capacity**, not staging budget. Staging a third item into `In Design` would deepen the queue behind the same single missing step, not relieve it. Even with the bound lifted, the correct move this hour would still be to stage nothing.

**THR-1348 remains the queued next stage** the moment either `In Design` item leaves the column — THR-790's 2026-09-11 comment (Christian: *"you are approved to unblock everything here"*) assigns the freed slot to it explicitly. Carried forward from runs e–a so it is not re-derived from a buried comment.

## T3 — architecture health

**The daily detector sweep is not due — it ran this morning in run a (local 17:40), all four detectors.** Those results stand and were **not** re-measured this run; they are not reported clean by inheritance, they are simply unchanged and already published. The weekly test-suite pass also ran in run a (`Docs/ops/test-suite-health-2026-09-21.md`). `__DEBUG.validateTraitRefs()` remains browser-only and was not run.

**Redundancy: not assessed this sweep.**

**Stalled work:** none — `In Dev` is empty. **Hand-created `In Dev` tickets:** none — `In Dev` is empty.

**In Design: 2 live, 0 excluded** (THR-1479 unassigned, **0d** by the function; THR-1448 unassigned, **2d** by the function — neither stale by its clock, both counted).

### New finding (1): the stall-warning resets the stall clock, and today's earlier report named the wrong mechanism

**The correction first, because it matters more than the finding.** Run a attributed the T2 bar to a *"self-referential-clock defect"* in which `classifyInDesignItem` reads `updatedAt`, which Linear bumps when another issue merely links to this one. **That is not what the function does.** `scripts/stale-claim-sweep/index.ts:327–337` computes activity from `lastInDesignActivityMs`, which is `max(newest comment createdAt, newest state transition createdAt)`, and falls back to `updatedAt` only when neither signal exists. The author closed the `updatedAt` hole deliberately and documented why at length — THR-1382's two motivating items would have classified `live` on day one under an `updatedAt` predicate. A retro acting on run a's description would go looking for a bug that was fixed before it shipped.

**The real mechanism is one layer in.** `lastInDesignActivityMs` treats *any* comment as activity. Its own doc comment states the premise — activity is *"the newest of two signals that only a human working the issue can produce."* **On this board that premise is false.** Most comments on these issues are lane-authored, and they all carry Christian's API identity, so authorship cannot distinguish them even in principle.

The consequence is a ratchet, and THR-1448 shows it in closed form:

| When | What happened | Clock after |
|---|---|---|
| 2026-09-11T06:36Z | Orchestrator T2 stages it → `In Design` | 0d |
| 2026-09-19T15:45Z | `stale-claim-sweep` posts: *"8 days without activity… past 7 days an unassigned item stops counting against `ORCH_MAX_IN_DESIGN`, so the orchestrator's design staging is no longer barred by it"* | **0d** |
| 2026-09-21T17:29Z (now) | — | 2d → `live` → **bars staging** |

**The sweep's warning that the item no longer bars staging is the act that makes it bar staging again.** The warning is self-defeating by construction, and because the sweep runs on a schedule, the clock can never reach the 7-day threshold while the sweep keeps firing.

THR-1479 is the same shape and sharper: the grooming lane commented at 2026-09-21T15:40:30Z, so it now reads **0 days untouched** — one hour and forty-nine minutes after a comment whose entire content is that the queue beneath it is empty and nothing can advance it.

**True ages, from column entry with lane comments discounted:** THR-1448 ~10d, THR-1479 ~9d. Both unassigned. Under the predicate as its own documentation describes it, both would classify `stale-unassigned` → excluded → `0 live`, and T2 would be free.

**Scope of the consequence, stated honestly:** the practical cost *this run* is nil, because staging is the wrong move anyway (see T2 above). What the defect actually costs is diagnostic: it makes the `In Design` staleness warning permanently unfirable on any item an automated lane is commenting on, which is every item the lanes are worried about — the detector is quietest exactly where it is most needed. It also silently holds `ORCH_MAX_IN_DESIGN` shut for a reason no report before this one stated correctly.

**Not filed**, per the process-work throttle — scheduled lanes log, the weekly retro promotes. It does not meet the immediate-file exception: nothing is being corrupted as it runs, and no shipped artifact is at risk. Recorded here with the code path named (`scripts/stale-claim-sweep/index.ts:327–337`, `lastInDesignActivityMs`) so the retro can size it against the `updatedAt` misdiagnosis it supersedes.

## Escalations

**None opened, nothing parked.** No blockages this run. This report exists for the finding above and its correction to run a, not because the board changed — it did not.
