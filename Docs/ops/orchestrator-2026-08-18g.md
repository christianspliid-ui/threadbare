---
lane: tb-orchestrator
run: 2026-08-18g
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: false
---
# Orchestrator — 2026-08-18 (run g, ~11:30Z)

## Needs Christian

**Nothing new this hour.** The one question put to you an hour ago — whether to spend credits on the three missing nudge-card pictures ([THR-1170](https://linear.app/threadbare/issue/THR-1170/every-meet-the-first-nudge-card-renders-the-same-plate-424-imagetags)) — is unchanged and already in front of you. Asking again would not make it arrive sooner.

The builder is not waiting on you. It finished one job this hour, found a real defect while doing it, and the next job is already queued.

## T1 — unblock sweep

**Promoted 1.** Scanned Todo (19) and Idea (60, paged) as candidate pools; Ready for Dev (3) read for shelf depth, not as candidates.

```
[orchestrator] T1 scan: Todo 19, Idea 60 (paged), Ready for Dev 3, In Dev 3, In Design 1
[orchestrator] T1 promote THR-1171: filed 11:15Z by the executor working THR-733; blockedBy empty
               on live relation query, no prose gate, no time gate, names no plan doc so liveness
               passes trivially. Sole prior comment is the executor's own coordination block
               (THR-836), carrying no retire or supersede verdict (THR-990). Premise re-verified
               against the tree, not trusted: apotheosis-ascension.ts:684 does carry
               templateId 'trait.condition.grieving', and CONDITION_TRAIT_DEFINITIONS holds only
               the six agent conditions plus five location.* (debt-laden lives separately in
               economic-trait-content.ts:117). Verified via get_issue: "Ready for Dev", assignee
               key absent. Block posted. Mutex: none. (program: Content Architecture)
```

**Why this one was promotable and THR-1170 was not, since both offer two options.** THR-1170's body says the choice *"is a design call, not an executor call"* and the better branch spends image-generation credits — so it goes to Christian. THR-1171 offers two fixes and then **recommends one, with reasoning**, and its Done-when is satisfied by either. That is the *how* of an already-agreed pattern, which CLAUDE.md § User review interface rule 4 puts with the agent. No credit spend, no direction call, no gate.

**One thing added to the ticket rather than left for the taker to discover.** The description says "sweep for it rather than fixing only the two known sites", which reads as an open-ended hunt. It is not, and running the membership predicate cost about a minute:

- **Shipped content: exactly one site** — `apotheosis-ascension.ts:684`. Nothing else off-vocabulary.
- **Example files: three more**, all under `src/data/encounters/examples/` — `grieving` in `example.betrayal_multi_target.ts:46`, plus `trait.condition.consecrated` / `trait.condition.desecrated` in `example.shrine_consecration.ts:21,37`. Neither of the latter two is defined anywhere in production; `consecrated` exists only as a node minted inside its own test at `encounterAftermath-multi-target.test.ts:26` — a fixture inventing both sides of its assertion.
- **Two things that look like hits and are not**, now named as do-not-chase: the `anomaly_*` / `starter_*` `conditionTraitId`s resolve fine against `anomaly-reward-catalog.ts` and `starter-attachments.ts` (different namespace), and `trait.condition.location.watched` appears only in a test fixture, never in shipped content.

The point of doing this at promotion time rather than leaving it: an executor handed "sweep for it" either under-sweeps or spends an hour proving a negative. The set is four sites, three of them in example files whose scope is the taker's call.

**Declines — nothing newly assessed this run.** No candidate entered Todo or Idea since run f other than THR-1171, so every other decline stands on the evidence already recorded rather than being re-derived: THR-1170 (design + credit call, surfaced to Christian in run f), THR-767 / THR-833 / THR-448 (wrong destination, run f), THR-1026 / THR-1094 / THR-1095 / THR-977 / THR-964 (design forks in their own bodies, run e), THR-1024 (prose gate on THR-966, still Idea — twenty-third consecutive run), THR-716 / THR-1088 (resolved-on-main verdicts), THR-965 / THR-831 / THR-662 / THR-857 / THR-854 / THR-829 / THR-742 / THR-1155 / THR-1134 / THR-1002 / THR-1114 / THR-1053 / THR-1148 (design fork or plan-doc-before-code), THR-1156 / THR-789 (program epics, containers not claims), THR-175 / THR-870 (deferral triggers unmet), THR-1043 / THR-791 / THR-877 (carry an assignee, so not queue candidates), THR-876 (held — unbudgeted credit spend), THR-902 / 907 / 1157 / 1162 / 1163 (`wayfinder:*` → T1.5, never Ready for Dev).

**Ceiling did not bind.** Shelf was 3 at scan, far under `QUEUE_BACKED_UP_MIN` (15), and one promotion is under `ORCH_PROMOTE_BATCH_MAX` (5). Nothing was held back by a cap — one is what the pool honestly yielded, because only one new candidate arrived.

**Product, not process.** THR-1171 is player-facing content correctness on the Influence capstone endings, so the one-process-ticket-per-three-runs budget is untouched and Rule 0 does not apply.

### The shelf, honestly

`Ready for Dev` now holds **4**: THR-830, THR-625, THR-1133, THR-1171.

Two caveats a bare count hides, both unchanged from run f. [THR-1133](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server) needs an attended session with a real dev server and a 1920×1080 viewport, so the overnight lane cannot take it. And THR-733 — promoted last run — has already been claimed and is In Dev, which is why it is no longer on the shelf. So **claimable by the unattended lane right now = 3**.

**All four shelf items carry `Deferral`.** That is the shape of the supply, and it is what keeps T2 triggering below.

**Two In Dev items are parked, not stalled.** THR-1130 and THR-1168 both read `In Dev` with the assignee key absent — the deliberate finished-work park shape, not abandoned work. Recorded because a bare In Dev count of 3 would otherwise read as three jobs in flight when only THR-733 is being worked.

## T1.5 — wayfinder sweep

**Two open maps. Zero of `ORCH_WAYFINDER_AFK_MAX` (2) spent — because no AFK ticket exists, not because any was skipped.** Re-queried live by label this run rather than carried from run f: all five `wayfinder:research` (THR-1160, 1158, 1159, 1039, 903) and all three `wayfinder:task` (THR-986, 906, 904) are **Done**. Every open wayfinder ticket board-wide is HITL by label, and resolving one of those is the broken-HITL failure the skill forbids.

- **[THR-1157 — Typed game-state architecture](https://linear.app/threadbare/issue/THR-1157/typed-game-state-architecture-machinery-first-wave-wayfinder-map).** Frontier is two, both HITL, both unassigned: THR-1163 (`wayfinder:grilling`, the map-closing sitting) and THR-1162 (`wayfinder:prototype`).
- **[THR-902 — Encounter experience redesign](https://linear.app/threadbare/issue/THR-902/encounter-experience-redesign-vertical-slice-wayfinder-map).** THR-907 is open but assigned, so outside the frontier by rule.

Neither map's HITL frontier is repeated under `## Needs Christian` this run — both have been put to him on consecutive runs, and neither is what would move today.

## T2 — design staging

**Triggered for the twenty-third consecutive run, and bound again.** Non-`Deferral` items in Ready for Dev: **0** — below `ORCH_PROGRAM_WORK_FLOOR` (2). This run's promotion did not move that number either: THR-1171 carries `Deferral`, so it lifts the *claimable* shelf without lifting the *program-work* count.

**Nothing staged.** `In Design` holds exactly 1 — [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) — which is `ORCH_MAX_IN_DESIGN` (1). It is now **~63 hours past staging** (`updatedAt` unmoved since 2026-08-15T20:29:32Z). Re-surfaced in the record, not re-staged, and the slot is not released — reinterpreting the bound to unblock myself is the get-busy failure this lane exists to avoid.

The T2 candidate queue is unchanged from run f; [THR-964](https://linear.app/threadbare/issue/THR-964/pendingchoicecommits-has-no-producer-the-entire-encounter-choice-commit) remains the one to rank first when the slot frees, for the reason run e established: it silently owns the disposition of a four-component UI cluster, a test, a snapshot and four constant families as well as its own title.

**Product-vs-process ratio:** not re-measured. Run p's trailing-7-day figure (~2:1 product-favouring) stands, and re-deriving a week-wide window hourly is noise. Direction of travel is right — this run's promotion is product.

## T3 — architecture health

**Not due — already run today.** Run b performed the full sweep at ~05:27Z (07:27 local), the first past `ORCH_HEALTH_SWEEP_HOUR` (6 local). **No detector was run this run and none is reported as clean.** Its standing results are unmodified: 7 LEAKED contracts, 21 canon-staleness warnings, `check:process` green except the longstanding `check:authoring-brief` staleness, and `sweep:rank-reach` **unavailable** — still explicitly not clean, merely unmeasured.

`__DEBUG.validateTraitRefs()` is browser-only and cannot run headless. **Not run, not reported as clean.**

**Redundancy: not assessed this sweep** — the judgement pass belongs to a due T3, and T3 was not due.

Weekly test-suite health **not due** — `ORCH_TESTHEALTH_DOW` is Monday (1); today is Tuesday (2). Last pass: `Docs/ops/test-suite-health-2026-08-17.md`.

**Stalled-work check: partial, and said so.** Only THR-1171's `stateHistory` was fetched this run, and it shows a single Todo → Ready for Dev transition (0 pickups). Run b's board-wide pass at 05:27Z found THR-1130 highest at 2, under `ORCH_STALLED_PICKUP_THRESHOLD` (3); nothing since then has been claimed and released, so that reading still holds — but it is carried, not re-measured.

### One finding not written, and why

The condition sweep above turned up `trait.condition.consecrated` existing **only** as a node minted inside its own test fixture, which is the shape that usually earns a line in this section. It did not get one. It is already inside THR-1171's membership predicate and named explicitly in that ticket's promotion comment, so filing it here as well would double-count one defect across two surfaces and hand the retro a candidate that is already assigned. Recorded as an observation, not a finding — `newFindings: 0` is accurate.

## Escalations

None. Nothing was parked and no question was asked — the pool yielded genuine work, so the agreed-work-exhausted branch did not fire.
