---
lane: tb-orchestrator
run: 2026-09-22
promoted: 3
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-09-22 (run a, ~02:30Z)

## Needs Christian

**The thing the briefing warned about fifteen minutes earlier happened. Same setting, same shape, three more pieces of work erased.**

At 04:00 local the hourly briefing put one ask at the top: turn off Linear's auto-complete for sub-issues, and it said why *this* hour — the builder had just started [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) (traits wave 2), which has three unfinished parts underneath, and *"the moment THR-790 closes, all three are marked done."*

At 04:15 local THR-790 closed. Within a quarter of a second, all three parts were marked finished. Nobody built any of them.

**Nothing is lost.** I checked each one four different ways before touching it — none had ever been started, none appears in the code that shipped, and the builder's own paperwork correctly named only its own ticket. All three are back where they were, and the one that was ready to be picked up is queued again. Total time erased-to-restored: sixteen minutes.

**This is the second time tonight.** The first took two parts of the appointment feature at 00:12 local. Five pieces of authored work erased in four hours, all five recovered — but only because an hourly sweep happened to look. The warning note I left on the parent yesterday did not stop it, because a note cannot.

**The ask is unchanged and is one toggle:** [Linear → Team settings → General](https://linear.app/threadbare/settings/teams/THR/general) → turn off auto-completing sub-issues when the parent completes.

**One thing worth knowing beyond the ask.** Of the three parts restored, one now looks like it may not be worth building as written. It was to add three new consumers of the "places have traits" system — but the measurement the builder took last night shows the pool those consumers feed does not actually move when a place's traits change. The limit turned out to be *which* encounters are eligible, not *how strongly* they're weighted. Two of its three pieces would be pushing on the wrong lever. I have recorded that on the ticket rather than acting on it; a design session should start from the measurement instead of the original plan.

**And a smaller note on supply.** Three new tickets arrived in the last four hours, and all three are questions rather than work: which mortals the player's attention should follow, whether a scene should be offered to the people who will refuse it, and whether a follow-up scene should be able to appear on its own. Each names options and has measurements behind it; none can be handed to a builder as-is. The build queue is fine for now, but it is being fed by repairs rather than by design, and the questions are stacking up faster than design sessions are being run.

## T1 — unblock sweep

| Column | On arrival (02:28Z) | On departure |
|---|---|---|
| `Ready for Dev` | 2 | **3** |
| `Ready for Dev`, non-`Deferral` | 2 | **3** |
| `In Design` | 0 | 0 |
| `In Dev` | 1 (THR-1527) | 1 |
| `Todo` | 27 | 29 |

`Todo` composition: **15 wayfinder-labelled** (skipped unconditionally — T1.5's input, never `Ready for Dev`) and 14 non-wayfinder after the two restorations.

### The parent-close cascade fired a second time — three children restored (3 verified state changes)

THR-790 reached `Done` legitimately at **02:15:34.712Z** ([PR #1979](https://github.com/christianspliid-ui/threadbare/pull/1979) merged 02:15:12Z). Within 250 ms the workspace closed all three of its unfinished children:

| Child | State when erased | Closed at | Δ after parent | `startedAt` | Restored to |
|---|---|---|---|---|---|
| [THR-1522](https://linear.app/threadbare/issue/THR-1522/traits-wave-2-slice-4-the-deferred-location-trait-consumers-merchant) (slice 4) | `Todo` | 02:15:34.900Z | +188 ms | `null` | `Todo` |
| [THR-1520](https://linear.app/threadbare/issue/THR-1520/traits-wave-2-slice-2-draw-by-trait-completion-dedup-against-what-the) (slice 2) | `Ready for Dev` | 02:15:34.931Z | +219 ms | 21:32Z (queue entry only) | `Ready for Dev` |
| [THR-1521](https://linear.app/threadbare/issue/THR-1521/traits-wave-2-slice-3-artifact-traits-the-has-trait-schema-admits) (slice 3) | `Todo` | 02:15:34.958Z | +246 ms | `null` | `Todo` |

**Each restored to the state it held at the instant the cascade fired — not promoted.** A repair is not a licence to move a ticket forward: THR-1521's blocker is still unmet and THR-1522's gate now reads *not met* (below), so both went back to `Todo` where they were. All three re-queried after the write (`completedAt: null`, no `assignee` key present — absence read off `get_issue`, not off the write response).

**Evidence gathered before any write — four legs, same method as run e:**

1. **No `In Dev` transition on any of the three.** THR-1521 and THR-1522 have two-entry histories, `Todo → Done`, with `startedAt: null`. THR-1520's is `Todo (21:04:19Z) → Ready for Dev (21:32:22Z) → Done (02:15:34.937Z)` — it entered the queue and was never claimed. *(Note on method: `Ready for Dev` is a `started`-type state in this workspace, so a non-null `startedAt` does not by itself mean a session ever worked a ticket — the state history is the load-bearing read, not the timestamp.)*
2. **Timing.** Three children at +188 / +219 / +246 ms. Three merges do not land in a quarter-second.
3. **No close keyword names them.** `be7b760f` carries exactly one line-anchored keyword, `Fixes THR-790`, and its subject reads *"traits wave 2, **slice 1**"*. `git log` over `be7b760f`, `b5f9f85f` and merge `f04ea84c` returns no `Fixes|Closes|Resolves` naming a child. **The executor's close discipline was correct and did not prevent this.**
4. **The work is grep-absent from `origin/main` after the merge.** Slice 2: `requiresBearerTrait` does not exist anywhere in `src`, and `rewardPool.ts` has no `exclude` reference, so `ContentQuery.exclude` still has no caller. Slice 3: `src/types/edgeSchema.ts:67` still reads `sourceNodeType: ['actor', 'location', 'sublocation']` — no `artifact` — and `ArtifactSheet.tsx` contains zero occurrences of "trait". Slice 4: no `welcoming` term in `tradeRoute.ts`, zero `has_trait` reads in `proseResolvers.ts`. All three slices unbuilt in full.

Coordination block re-posted on THR-1520 so `pull-work` Step 3 validates rather than bounces; restoration comments with the per-ticket evidence on all three; a summary comment on THR-790 recording that its guard fired and what it cost.

**Blast radius.** No other parent is at risk this hour: the only other parent with open children is THR-789 (traits epic, `Todo`, one child THR-791 assigned to Christian) and it is nowhere near closing. THR-1527, the only `In Dev` issue, has no children.

### Declined, with evidence

**Three new tickets, all filed in the last four hours, all declining for the same reason — wrong destination, needs design before pickup.** Each is T2's input, not the queue's:

- **[THR-1526](https://linear.app/threadbare/issue/THR-1526/sequel-only-encounter-templates-are-reachable-from-the-live)** (sequel-only templates reachable from the board) — declines on its own heading, *"Scope (needs a small design before pickup)"*: the field shape is an open either/or (`reachableBy` array vs a tag-driven rule), and a new template field owes a canon row plus a UL term in the same PR.
- **[THR-1525](https://linear.app/threadbare/issue/THR-1525/signed-desire-score-vs-the-specs-step-6-a-fork-that-plants)** (signed desire score vs the authoring spec) — declines on its own first line, *"Design question, not yet an implementation ticket — the fix has corpus-wide blast and needs a decision first."* Three named options; option 1 needs a corpus census before flipping.
- **[THR-1523](https://linear.app/threadbare/issue/THR-1523/spotlight-pull-the-swap-pool-is-the-handful-of-ambition-less)** (spotlight pull starvation) — declines on its own section heading, *"The design question (not the executor's to settle)"*, with four options A–D and the tick-cost of each unmeasured.

**Carried forward from run e, re-checked for change and unchanged** (none has been updated since that run's reading, so these are not re-derived): THR-1274 (standing *"premise corrected; deliberately not promoted"* verdict), THR-1220 (its own first line forbids promotion; it is Christian's sitting and the briefing carries it), THR-1393 and THR-1381 and THR-1218 (all three state outright that they need a design pass), THR-175 (trigger condition unmet), THR-870 (design ticket in a parked direction), THR-789 / THR-791 (epic, and an assigned child).

**New this run in that set:** **THR-1522** would previously have declined on its blocker; THR-790 is now `Done`, so the blocker half **is** met — and it declines instead on the second condition it carries. Its gate: *"gated on slice 1's census showing the pool term moves — if location traits do not shift the pool, more consumers are not the fix."* Slice 1's closeout measured exactly that and recorded the reading for this gate: *"the term is LIVE (104 candidates carried it on seed 99, 43 selected) but the composition reads FLAT at 150 ticks even with every row at the cap — gold-reach encounters resolve 0 of 122 at Welcoming towns — so the limit is eligibility, not weight."* The pool term does not move. **Declined on the gate, quoted rather than re-derived** — and the gate did its job, which is worth recording: this is the first time a ticket in this queue has been stopped by its own measured kill criterion rather than by a state check.

**THR-1521** declines on an unmet blocker: THR-1520 (restored to `Ready for Dev` this run) is not `Done`. Its body asks this lane to promote it *"when its blocker clears"* — the appearance that it had cleared was the same cascade.

**Ceiling:** neither bound engaged. Shelf 2 on arrival, far under the backed-up threshold of 15; 3 state changes of a permitted 5. **No candidate was held back.**

**Rule 0 / materiality:** nothing filed, deliberately. The cascade clears the materiality bar on its face — five authored tickets erased in four hours, second recurrence, ~1 hour of sweep time spent on forensics and repair — and the throttle's standing exception for *a loss actively corrupting work right now* would permit filing it immediately. It is still not filed, for the same reason as run e and now a stronger one: **the durable fix is a workspace toggle no executor can flip**, so a ticket would sit unexecutable while making the board read as though the problem were owned. A compensating detector (scan for the `startedAt: null` + sub-250 ms-after-parent signature) is buildable and was considered — declined, because building a workaround for a one-toggle fix that is already the top item on Christian's briefing spends executor time to avoid a click. If the toggle is still unflipped at the weekly retro, the detector is the retro's call to make with the accumulated cost quoted. **Product-vs-process completion ratio, trailing 48h: 8 product : 4 process** — THR-790, THR-1518, THR-1524 and THR-1348 all landed in the window.

## T1.5 — wayfinder sweep

Three open maps, unchanged since 2026-09-11: Item Generator ([THR-1227](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator)), Powers & Spellcraft ([THR-1226](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft)), Physical Conflict ([THR-1258](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict)).

**AFK frontier: 0.** Established this run from the lane's own state-filtered scans rather than re-walking the maps: **no `wayfinder:research` or `wayfinder:task` ticket is open in any state** — `Todo` holds 15 wayfinder items, all of them the 3 maps plus 6 `wayfinder:grilling` and 6 `wayfinder:prototype`; `Ready for Dev` holds none. An AFK ticket that existed would have to be open and unclaimed, so it would appear in one of those two reads. `ORCH_WAYFINDER_AFK_MAX` did not bind; nothing claimed, resolved or closed. Run e's direct per-map child walk reached the same conclusion four hours ago and nothing has changed on the maps since.

**HITL frontier: 12** (11 unassigned; THR-1232 is Christian's) — 6 grilling, 6 prototype, unchanged since 2026-08-26 and already carried on the briefing. **Deliberately not re-raised** against tonight's ask. Method note: with no AFK ticket to gate, per-candidate `includeRelations` reads were **not** run, so "frontier" here means *open and unassigned*, not *relation-unblocked*.

## T2 — design authoring

**Not triggered.** Non-`Deferral` `Ready for Dev` is **3** (THR-1448, THR-1519, THR-1520) against a floor of 2. It was 2 on arrival — at the floor, not under it — and the restoration took it to 3. Nothing staged, nothing mutated, nothing authored.

**`In Design` is empty — 0 live, 0 excluded.** `ORCH_MAX_IN_DESIGN` has nothing to bind; printed rather than skipped, because a `0 live` line is the signal that this tier is free to stage the moment the shelf drops.

**Named for the next trigger, in priority order** — the tier declined on the count, not on the absence of candidates, and all three arrived tonight: THR-1525 (widest blast — the desire-score reading governs every spec-authored fork in the corpus, and the authoring spec currently instructs authors into the defect), THR-1526 (untrue prose reaching live mortals, the THR-1476 class), THR-1523 (attention model; four options, each with an unmeasured tick cost). Three design questions in four hours against zero design sessions is the supply signal, and it is surfaced to Christian above rather than acted on here.

## T3 — architecture health

**The daily detector sweep is not due and was not run.** It last ran in [run a of 09-21](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-21.md) (local 17:40), all four detectors; local time at this run is **04:30 on 09-22**, ahead of the next `ORCH_HEALTH_SWEEP_HOUR` (06:00). **No detector result is reported clean by inheritance.** `__DEBUG.validateTraitRefs()` is browser-only, **was not run, and is not reported clean**. The weekly test-suite pass ran 09-21 ([`test-suite-health-2026-09-21.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-09-21.md)) and is not due until 09-28; today is Tuesday.

**Redundancy: not assessed this sweep.**

**New findings: 0.** Tonight's cascade is a **recurrence of run e's finding, not a new one** — counted honestly as zero rather than re-banked to make the run look productive. What the recurrence adds, recorded so the retro has it: the defect's *period is under four hours*, its warning-comment mitigation has now been tested and failed, and the second firing took a ticket out of `Ready for Dev` rather than only out of `Todo` — one step closer to the dangerous case, which is a child closed out from under a session actively building it (impediment #955's shape by a different door).

**Stalled work: none.** `In Dev` holds one issue, [THR-1527](https://linear.app/threadbare/issue/THR-1527/the-appointment-planter-writes-an-owes-favor-edge-without-its-two), created into `Ready for Dev` at 02:00:21Z and claimed to `In Dev` at 02:11:17Z — one transition against a threshold of 3, with [PR #1980](https://github.com/christianspliid-ui/threadbare/pull/1980) attached and open.

**Hand-created `In Dev` tickets: none.** THR-1527 is the only occupant and its `stateHistory` opens with `Ready for Dev`, so it came through the queue. Checked because it was created and claimed inside the same eleven minutes, which reads like a hand-creation until the history is read.

**`main` is red on the non-required heavy lane, with a fix in flight and not a defect anyone need act on:** `edgeIntegrity.test.ts`'s 150-tick smoke reads two `owes_favor` schema warnings from the appointment planter. Surfaced by THR-790's closeout, filed as THR-1527, fix open on PR #1980. Recorded here so the next run does not re-diagnose it, and noted on THR-1520's block so whoever claims that ticket does not read a heavy failure as their own.

**Carried, not re-derived:** run b's `lastInDesignActivityMs` finding (a lane's own warning comment counts as human activity, so the staleness detector stays unfirable on exactly the items automated lanes comment on) stands unrepaired for the retro. The column is empty, so it did not bind.

## Escalations

**None opened on Discord, nothing parked, nothing blocked.**

Discord was considered for the cascade and declined: the ask is already the top item on the briefing, `keep-work-flowing-cc` republishes within the hour, and local time is 04:30 — a ping adds nothing a sleeping reader will not see in the same place an hour later.

Environment note, recorded rather than actioned: this lane performed no git state ops in the home tree; the report was published to `ops` by plumbing, which reads no branch state.
