---
lane: tb-orchestrator
run: 2026-08-26b
promoted: 0
filed: 0
resolved: 0
newFindings: 2
needsChristian: true
---
# Orchestrator — 2026-08-26 (run b, ~04:27Z)

## Needs Christian

**The dev queue has nearly run dry, and the one design ticket queued to refill it has been waiting seven days for a session.**

Four tickets shipped overnight, which is good news — but it has left exactly **one** item on the dev shelf, and the design work that would refill it is not moving. The lane that stages design work is allowed to hold one ticket at a time, and its slot has been held since 2026-08-19 by:

* **[Unify the card grammar — action cards adopt the encounter-card vocabulary](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card)** — the "action cards are too verbose and their actual action in the game is very hard to understand" problem you raised on 08-06. It was staged for a design session and nobody has opened one. Until it moves, nothing else can be staged behind it.

An hour of attended session on that one unblocks the staging slot *and* refills the shelf. Everything the session needs is already written into the ticket's staging comment.

**Still waiting on you from earlier today, unchanged:**

* **Approve the camp-seven brief** so the integrated slice checkpoint can invite you — [the brief](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/retrofit-batch-2-brief.md), [the ticket it unblocks](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine). One open question in it: it proposes **seven** encounters, not the six your batch-size ruling set, because the camp set is one family in one file. Yes or no.
* **Two sketch sessions, both ready** — [twenty generated spells to react to](https://linear.app/threadbare/issue/THR-1232/power-generator-sketch-twenty-generated-spells-to-react-to) and [thirty generated items to react to](https://linear.app/threadbare/issue/THR-1236/item-generator-sketch-thirty-generated-items-to-react-to). Both maps are answered down to these last two questions. Say "work the map" when you have an hour.

## T1 — unblock sweep

Scanned 25 `Todo` candidates against a `Ready for Dev` shelf of **1**. **Promoted 0.** Two candidates are new since the 00:27Z run; both were assessed and neither promotes.

**Held — foundation not on `main` yet (the finding of this sweep):**

* `hold THR-1257` — "damaged/healed proxy: the action-trigger condition path is a fourth infliction site". Filed 04:17Z with a complete coordination block whose dependency line reads **`Blocked by: nothing. THR-1244 shipped the module and the dispatch site tags this extends.`** That premise is not yet true on `origin/main`. Measured directly: `git show origin/main:src/engine/effects/conditionProxyEvents.ts` → *"does not exist in 'origin/main'"*, and [THR-1244](https://linear.app/threadbare/issue/THR-1244) is `In Dev` (claimed 04:02Z, unmerged). The whole Done-when extends that module's sites, so a promotion now would put a ticket on the shelf whose subject file an executor could not open. **Hold, not decline** — the ticket is sound and its block is well-written; the foundation is minutes away. The next run promotes it the moment THR-1244 merges. Nothing was written to the issue.

  Worth recording as a generalisation: this is the **stranded-plan-doc shape applied to code**. The liveness gate the skill specifies checks a named *plan doc* against `origin/main`; here the unmerged artifact was a *source module*, named in the coordination block rather than the description, and no gate covers that. Same failure, one file-type over.

**Declined — unmet time gate:**

* `skip THR-1256` — "Flip check:guidance-freshness from advisory to blocking". Its own block says *"Blocked by: nothing — but do not action before 2026-09-08; the burn-in window is the whole point."* Window opens **2026-09-08**; today is 08-26. Thirteen days short. The gate is recorded in code as `GUIDANCE_GATE_MODE.flipReviewAfter`, and this sweep confirms it is live and advisory: `check:process` printed *"check-guidance-freshness: OK — 1 doctrine checked … mode=advisory (burn-in; flip reviewed after 2026-09-08, THR-1256)"*.

**Held — human gate unmet (unchanged from run a):**

* `hold THR-1222` — brief-approval gate. Re-read the issue's comments this sweep: still one comment only, dated 2026-08-24T19:24Z, naming the blocker as *"Christian's chat approval of `Docs/plans/encounters/retrofit-batch-2-brief.md` (ruling 2) — a state gate, not a ticket."* No approval recorded. Surfaced above.

**Declines carried unchanged from run a**, each re-checked against its own evidence and none moved: `THR-1213` (blocker THR-1212 still `Todo`), `THR-1024` (THR-966 still `Idea`), `THR-1255` (condition 1 is THR-1222 shipping, which has not run), `THR-1218` (blocked on THR-1043), `THR-175` (DEFERRED trigger unmet). Wrong-destination declines — design tickets this Sonnet lane does not author: `THR-1212`, `THR-1155`, `THR-1134`, `THR-1156`, `THR-1189`, `THR-1114`, `THR-1148`, `THR-1195`. Not candidates: `THR-1220` (self-declared never-promote), `THR-1043` / `THR-791` (carry an assignee), `THR-870` (parked), `THR-789` (program epic), and `THR-1226` / `THR-1227` / `THR-1232` / `THR-1236` (`wayfinder:*`, skipped unconditionally — T1.5's input).

Promotion ceiling did not apply (shelf 1, far under 15).

**Rule-0 / materiality:** nothing promoted, so the process throttle did not bind. Both new candidates are correctly classified — THR-1257 is product (an engine capability that is half-wired and silently wrong on one path), THR-1256 is process and carries its own deferral to a dated review rather than asking for queue space now. No process ticket was filed by this lane, per the standing throttle.

## T1.5 — wayfinder sweep

Two open maps, both unchanged since run a four hours ago, both down to a single HITL frontier ticket.

* **[Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft)** — frontier 1: THR-1232, `wayfinder:prototype`.
* **[Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator)** — frontier 1: THR-1236, `wayfinder:prototype`.

**AFK tickets resolved: 0.** Not a shortfall. Neither frontier holds a `wayfinder:research` or agent-doable `wayfinder:task` ticket — every research ticket on both maps resolved on 2026-08-25. What remains on each is a `wayfinder:prototype`, which this lane must never touch: an agent resolving one is the broken-HITL failure mode the wayfinder skill exists to prevent.

**HITL surfaced: 2**, under `## Needs Christian` above.

## T2 — design staging

**Triggered, and could not act — the staging slot is full and has been for a week.**

`Ready for Dev` holds **1** non-`Deferral` item (THR-1249, the Play Profile UL proposal) against `ORCH_PROGRAM_WORK_FLOOR` of 2. That is the trigger, and it fired for the first time in days: run a measured the shelf at 5, and four of those five (THR-1253, THR-1242, THR-1241, THR-1244) have been claimed or shipped since.

But `ORCH_MAX_IN_DESIGN` is 1, and this lane's slot is occupied. `In Design` holds two issues:

* **THR-1002** — staged **by this lane** on 2026-08-19 ~02:30Z, its staging comment intact and detailed. Untouched since. That is **7 days**, against a rule that says an item unpicked after 48h is *re-surfaced, not re-staged*.
* **THR-790** — carries Christian as assignee; not lane-staged, not counted against the bound.

So: **nothing staged, nothing moved.** THR-1002 re-surfaced under `## Needs Christian` instead.

**The thing worth naming.** This is the first run where the two halves of the problem met. Run a already observed that "the constraint has moved upstream" — four High/Urgent `Todo` tickets whose Done-when is a plan doc, in a lane that does not author plan docs. Today the dev shelf caught up with that observation and fell to 1. The staging mechanism is working exactly as specified and is nevertheless producing nothing, because its output is a request for an attended session and no attended session has come. A second staged ticket would not help; it would be a second unanswered request. The bound is doing its job by refusing to manufacture one.

## T3 — architecture health

**Due and run** — first sweep past `ORCH_HEALTH_SWEEP_HOUR` (6 local; this run started 06:27 local), and run a at 02:27 local correctly declined it on the hour gate. Diffed against [`orchestrator-2026-08-25b.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-25b.md), the last run that actually invoked a detector.

| Detector | Result | vs. 2026-08-25b |
|---|---|---|
| `generate-interface-map:dry` | **7 LEAKED**, every one carrying a remediation ticket | **Unchanged in count *and* membership** — `attachment-activated-effects` (THR-720), `attachment-edge-modifiers` (THR-997), `branch-decision-writes-archetype-drift` (THR-883), `compulsion-card-plants-agent-decision-bias` (THR-883), `nudge-card-cost-channels-detection-and-doom` (THR-883), `undertow-card-drifts-mortal-values` (THR-1130), `trait-ref-authoring-vocabulary` (THR-800) |
| `sweep:rank-reach` | **PASS** — 60 rank-gated templates reachable, 0 blocked, 0 unowned; 13 apex holders at tick 900 | Verdict identical. **Its incidental `DistanceMatrix` warn moved sharply — see finding 1** |
| `check:process` | exit 0. `check-design-wiki` OK (24 pages); `check-wiki-freshness` OK (24, no stale); four generators up to date; `check:authoring-brief` up to date | **One new row:** `check-guidance-freshness` now runs and reports OK, 1 doctrine, `mode=advisory`. It shipped this morning with THR-1253 and did not exist in yesterday's sweep. Core lint still `skipped (no candidate files found)` — same zero-file shape, unchanged |
| `check:canon-staleness` | **21 warnings** | **23 → 21, and the composition moved — see finding 2** |

`__DEBUG.validateTraitRefs()` is browser-only and cannot run from a headless scheduled context. **Not run, and not reported as clean.**

### New finding 1 — yesterday's distance-matrix decay hypothesis is falsified; the overrun halved

Same command both days (`sweep:rank-reach`, seed 42 / medium / 900 ticks). The incidental `DistanceMatrix` warn:

| Sweep | Locations counted | Unindexed (dropped) |
|---|---|---|
| 2026-08-24 | 1555 | 355 |
| 2026-08-25 | 1688 | 488 |
| **2026-08-26** | **1442** | **242** |

Yesterday's report read the 08-24 → 08-25 jump as a rate and warned that *"one more day of content at this pace and the majority of the graph sits outside the index."* **That did not happen.** The count fell 246 in twenty-four hours and the drop count halved. The likely cause is on `main` in the window: `f05767d6 refactor(thr-1225): finish the fiction retirement — strip the corpus, drop the fields`, which removes content rather than adding it. I am not asserting that attribution as measured — one commit is the obvious candidate, not a proof.

**What this changes and what it does not.** It retires the *decay* reading: two points were not a trend, and this is the third point saying so. **The underlying condition stands unchanged** — 1442 is still above `MAX_DISTANCE_MATRIX_SIZE` (1200), 242 locations still resolve `Infinity` through `getDistance`, and the structural cause named on 08-25 is untouched: `buildDistanceMatrix` counts `graph.getNodesByType('location')`, so the cap is **sized in place-tier units and measured in both-tier units**. CLAUDE.md still records the cap as covering *"all supported presets (`large` ~584, `epic` ~805)"*; a medium map at 1442 is 1.8× the documented `epic` figure.

Blast radius unchanged and still narrow: two production consumers of `getDistance`, both in the tick loop (`idleBehavior.ts`, `phaseAgentDecision.ts`), both fail-soft by design. Encounter awareness is unaffected — it uses hex distance.

**Not filed.** The process-work throttle bars scheduled lanes from filing infrastructure tickets, and the material change today is that the loss got *smaller*. Recorded for the weekly retro, which is the promotion point.

### New finding 2 — canon staleness fell 23 → 21, but two pages reviewed yesterday were re-staled this morning

The count improved. The composition did not, in one specific way worth naming: the plan doc `Docs/plans/2026-04-16-systemic-wiring-guide.md` was edited at **02:35:41Z this morning**, and it is a declared source for **five** canon pages — `attachments.md`, `encounters.md`, `engine.md`, `process.md`, `prose.md`. Two of those five carry `last_reviewed: 2026-08-25`, i.e. they were brought current *yesterday* and were stale again within hours:

```
- Docs/canon/encounters.md stale vs .../2026-04-16-systemic-wiring-guide.md
    (plan mtime 2026-08-26T02:35:41Z > last_reviewed 2026-08-25)
- Docs/canon/prose.md      stale vs .../2026-04-16-systemic-wiring-guide.md
    (plan mtime 2026-08-26T02:35:41Z > last_reviewed 2026-08-25)
```

This is churn, not decay — the reviews were real and the guide genuinely changed after them. It is recorded because a staleness count that keeps hovering near twenty while individual rows clear and re-open is a different situation from twenty rows that never move, and only the composition diff can tell them apart.

Three rows in the 21 are not staleness at all but missing frontmatter — `interface-map.generated.md`, `setting-coverage.generated.md`, `systems-inventory.md` each report *"missing or invalid frontmatter field: last_reviewed"*. All three are **generated** files, so a `last_reviewed` stamp on them would be meaningless by construction. They have appeared in every sweep on record. Noted as a known permanent floor of 3, not as a finding.

### Redundancy pass — assessed, positive, and already ticketed

**The judgement pass was done this sweep**, and unlike yesterday's it came back positive.

Candidate: **condition polarity is expressed in two vocabularies across three catalogs.** `isHarmfulCondition` classifies a condition by reading a `#negative` tag. Measured directly on the tree:

| Catalog | Polarity tags (`#negative` / `#positive`) |
|---|---|
| `src/data/condition-trait-content.ts` | **9** |
| `src/data/anomaly-reward-catalog.ts` | **0** |
| `src/data/starter-attachments.ts` | **0** |

The latter two express polarity topically instead — `anomaly_vault_curse` carries `['#ancient', '#cursed', '#anomaly']`, `starter_drained_resolve` carries `['#curse', '#heart', '#supernatural']`. So one capability — "is this condition harm?" — has two spellings, and a vault curse classifies as *not harm* under the one the engine reads. That is D7's shape exactly: not unreachable code, but two mechanisms doing one job.

**Already captured, so nothing to file.** THR-1257 (filed 04:17Z, held above) carries this as its second half and prescribes the right direction unprompted: *"Prefer normalising the catalogs onto `#negative`/`#positive` over teaching the predicate a second vocabulary — one spelling per capability (THR-1242 precedent)."* The redundancy pass's contribution here is the independent confirmation, by measurement rather than by reading the ticket.

One incidental, now with a baseline: `check:process`'s systems-inventory step again prints `[WorldGen] Validation errors: [ 'Ocean fraction too low: 7.4%' ]`. Yesterday's sweep recorded it as unbaselined. It is now seen twice, at the identical value. **Recurring, not new, not drifting.**

### Stalled work

**No stall.** `In Dev` holds 4. Three carry `Parked` — THR-1130, THR-1133, THR-1168 — which is the sanctioned shape. THR-1130 still shows exactly `ORCH_STALLED_PICKUP_THRESHOLD` (3) `Ready for Dev → In Dev` transitions with no terminal `Done`, and the verdict is unchanged from yesterday and the day before: it is a `Parked` batch-cadence umbrella whose batches ship under their own tickets (batch 1 completed as THR-1221). Repeated pickup is its designed shape, not repeated failure.

The fourth, THR-1244, is the live claim — one pickup, 04:02Z today, no repeats.

### Weekly test-suite health

**Not due.** `ORCH_TESTHEALTH_DOW` is Monday (1); today is **Wednesday**. Deliberately not reported from Monday's result — [`test-suite-health-2026-08-24.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-08-24.md) is on `ops` and stands unchanged.

## Escalations

None asked, nothing parked. No Discord post was made: agreed work is not exhausted (the board holds plenty), and the two things blocking forward motion — an attended design session and three approvals — are normal HITL routes surfaced through the briefing, not blocked work needing a question.

One thing deliberately **not** done: T2 did not stage a second ticket to work around its full slot, and T1 did not promote THR-1257 on the strength of a coordination block that says `Blocked by: nothing`. Both restraints are the specification working, and both are recorded here so the restraint is visible rather than looking like an idle run.
