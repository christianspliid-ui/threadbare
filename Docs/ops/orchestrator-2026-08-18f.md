---
lane: tb-orchestrator
run: 2026-08-18f
promoted: 2
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-08-18 (run f, ~09:30Z)

## Needs Christian

**One question, and it is about the first thing a new player ever sees.**

While fixing the encounter art fallbacks this morning, the builder found the same defect one layer up — and this one lands on the opening beat. In the Meet-The-First flow, **every nudge card in every hand shows the same picture**: wisps settling over a plain clay bowl. All 424 cards. They were authored to use three different images — a crowd, a mercy, a blade — and none of those three pictures was ever made, so the game quietly falls back to one stand-in plate for all of them.

See it yourself: [open the Meet-The-First route](https://threadbare.vercel.app/?view=game&firstunmet&size=medium). The cards you are offered are the ones in question.

**The question is whether to make the three missing plates.**

- **Make them** — three new 16:9 pictures, and the opening beat gets the visual variety it was written for. This spends image-generation credits, which is why it is your call and not the builder's.
- **Reuse near-misses** — point the three names at pictures that already exist. Free, same-day, and it takes the beat from one plate to three. But one of the three lands back on the exact stand-in it already shows, so a third of the cards gain nothing.

The ticket, with both options written out: [THR-1170](https://linear.app/threadbare/issue/THR-1170/every-meet-the-first-nudge-card-renders-the-same-plate-424-imagetags)

A yes or no on "make the three plates" is all that is needed. Nothing is blocked on it — the builder has other work — but it is the game's first impression, and it has been showing one picture for a while now.

Nothing else needs you this hour. The two things put to you earlier today are unchanged and are not repeated here.

## T1 — unblock sweep

**Promoted 2.** The unattended lane was down to a single takeable item at scan time, and both promotions are product content work with no design fork left in them.

```
[orchestrator] T1 scan: Todo 18, Idea 78 (full pool), Ready for Dev 2 → 4, In Dev 3, In Design 1
[orchestrator] T1 promote THR-733: sole gate "Blocked by THR-74"; THR-74 Done 2026-07-25T01:57:42Z
               across PRs #774/#776/#790/#795/#807/#813/#815/#817/#819/#821. blockedBy empty on live
               relation query; zero comments so no retire verdict to weigh (THR-990). Plan-doc
               liveness LIVE — all three named docs resolve on origin/main. Premise re-verified:
               group content layer real (six src/data/group-*.ts files), group-exclusive template
               path live (encounter.sunken_vault/broken_span/hollow_watch, gated by
               groupEligibility.ts, bound to real content by partyExclusiveDelves.test.ts), and none
               of the four drama subjects already shipped. Verified via get_issue: "Ready for Dev",
               assignee key absent. Block posted, carrying a LIVE mutex against THR-1052.
[orchestrator] T1 promote THR-625: its own THR-574 triage comment sets the trigger — "none blocking.
               Promote when a content slot opens" — and the slot is open. Upstream THR-612 Done
               2026-07-05T05:46:13Z (PR #527); blockedBy empty; names no plan doc so liveness passes
               trivially. Premise measured live: backstory-content.ts is 801 lines, ~110 keys across
               12 tables at a uniform 4 variants/key, so the expansion is a real depth increase past
               THR-612's own 3–5 bar, not a re-run. Verified via get_issue: "Ready for Dev", assignee
               key absent. Block posted. Mutex: none.
```

**Declines — four assessed fresh this run, each naming its evidence:**

```
[orchestrator] T1 skip THR-1170: wrong destination — body states "This is a design call, not an
               executor call — hence a ticket rather than a silent repoint", and the better of its
               two fixes spends image-generation credits. Surfaced to Christian above rather than
               promoted; same reasoning that held THR-876 in runs d and e.
[orchestrator] T1 skip THR-767: wrong destination — carries a section headed "What this ticket must
               decide (design, not just code)" with three open questions about whether lairs gain a
               rank-and-file population and at what agent-count cost. → T2.
[orchestrator] T1 skip THR-833: wrong destination — "What this ticket must decide before it builds",
               three questions on interrupt budget; plus a browser-evidence Done-when the unattended
               lane cannot satisfy. → T2.
[orchestrator] T1 skip THR-448: blocked on user verdict by its own words — "Christian (or a
               brainstorm session) selects the pilot pair and moves this issue Idea → Ready for Dev".
               Not surfaced: it is Low, blocks nothing, and its pilot framing predates the nudge era.
```

Standing declines re-confirmed by state rather than re-derived: THR-716 / THR-1088 (resolved-on-main verdicts, runs c and l), THR-1024 (prose gate on THR-966, still Idea — twenty-second consecutive run), THR-965 / THR-831 / THR-662 / THR-857 / THR-854 / THR-829 / THR-742 / THR-1026 / THR-1094 / THR-1095 / THR-977 / THR-964 / THR-1155 / THR-1134 / THR-1002 / THR-1114 / THR-1053 / THR-1148 (each names a design fork or plan-doc-before-code in its own body → T2), THR-1156 / THR-789 (program epics, containers not claims), THR-175 / THR-870 (deferral triggers unmet), THR-1043 / THR-791 / THR-877 (carry an assignee, so not queue candidates), THR-876 (held — unbudgeted credit spend), THR-902 / 907 / 1157 / 1162 / 1163 (`wayfinder:*` → T1.5, never Ready for Dev).

**Ceiling did not bind.** Shelf was 2 at scan, far under `QUEUE_BACKED_UP_MIN` (15), and two promotions is under `ORCH_PROMOTE_BATCH_MAX` (5). Nothing was held back by a cap — two is what the pool honestly yielded once the design-fork tickets were set aside.

**Both promotions are product content work, not process.** Neither touches the delivery machinery, so the one-process-ticket-per-three-runs budget is untouched and Rule 0 does not apply to either.

### The shelf, honestly

`Ready for Dev` now holds **4**: THR-830, THR-1133, THR-733, THR-625.

Two caveats a bare count would hide. [THR-1133](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server) needs an attended session with a real dev server and a 1920×1080 viewport, so the overnight lane cannot take it — that is an approval gate, not a fault. And THR-733 carries a live mutex against THR-1052, which was still In Dev and unmerged at promotion time; the mutex reason is stated inline on the ticket and lapses the moment THR-1052 merges.

So: **claimable by the unattended lane right now = 3** (THR-830, THR-625, and THR-733 only if it takes THR-733 after the merge). THR-625 was deliberately chosen as the clean parallel pick — `src/data/backstory-content.ts` collides with nothing in flight.

**All four shelf items carry `Deferral`.** That is the shape of the supply, and it is what keeps T2 triggering below.

## T1.5 — wayfinder sweep

**Two open maps. Zero of `ORCH_WAYFINDER_AFK_MAX` (2) spent — because no AFK ticket exists, not because any was skipped.** Re-queried live by label this run rather than carried from run e: all five `wayfinder:research` (THR-1160, 1158, 1159, 1039, 903) and all three `wayfinder:task` (THR-986, 906, 904) are **Done**. Every open wayfinder ticket board-wide is HITL by label, and resolving one of those is the broken-HITL failure the skill forbids.

- **[THR-1157 — Typed game-state architecture](https://linear.app/threadbare/issue/THR-1157/typed-game-state-architecture-machinery-first-wave-wayfinder-map).** Frontier is two, both HITL, both unassigned: THR-1163 (`wayfinder:grilling`, the map-closing sitting) and THR-1162 (`wayfinder:prototype`).
- **[THR-902 — Encounter experience redesign](https://linear.app/threadbare/issue/THR-902/encounter-experience-redesign-vertical-slice-wayfinder-map).** THR-907 is open but assigned, so outside the frontier by rule.

Neither map's HITL frontier is repeated under `## Needs Christian` this run — both have been put to him on consecutive runs and neither is what would move today.

## T2 — design staging

**Triggered for the twenty-second consecutive run, and bound again.** Non-`Deferral` items in Ready for Dev: **0** — below `ORCH_PROGRAM_WORK_FLOOR` (2). This run's two promotions did not move that number either: THR-733 and THR-625 both carry `Deferral`, so they lift the *claimable* shelf without lifting the *program-work* count. All four shelf items are deferrals.

**Nothing staged.** `In Design` holds exactly 1 — [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) — which is `ORCH_MAX_IN_DESIGN` (1). It is now **~61 hours past staging** (`updatedAt` unmoved since 2026-08-15T20:29:32Z). Re-surfaced in the record, not re-staged, and the slot is not released — reinterpreting the bound to unblock myself is the get-busy failure this lane exists to avoid.

The T2 candidate queue grew by three this run, all declined out of T1 above with their reasons: THR-767, THR-833, THR-448. [THR-964](https://linear.app/threadbare/issue/THR-964/pendingchoicecommits-has-no-producer-the-entire-encounter-choice-commit) remains the one to rank first when the `In Design` slot frees — not on its own priority (Medium) but because run e established it silently owns the disposition of a four-component UI cluster, a test, a snapshot and four constant families as well as its own title. Two findings, one verdict.

**Product-vs-process ratio:** not re-measured. Run p's trailing-7-day figure (~2:1 product-favouring) stands; nothing completed in the last hour would move it, and re-deriving a week-wide window hourly is noise. Worth noting the direction of travel is right: both of this run's promotions are product.

## T3 — architecture health

**Not due — already run today.** Run b performed the full sweep at ~05:27Z, the first past `ORCH_HEALTH_SWEEP_HOUR` (6 local). **No detector was run this run and none is reported as clean.** Its standing results are unmodified: 7 LEAKED contracts, 21 canon-staleness warnings, `check:process` green except the longstanding `check:authoring-brief` staleness, and `sweep:rank-reach` **unavailable** — still explicitly not clean, merely unmeasured.

`__DEBUG.validateTraitRefs()` is browser-only and cannot run headless. **Not run, not reported as clean.**

**Redundancy: not assessed this sweep** — the judgement pass belongs to a due T3, and T3 was not due.

Weekly test-suite health **not due** — `ORCH_TESTHEALTH_DOW` is Monday (1); today is Tuesday (2). Last pass: `Docs/ops/test-suite-health-2026-08-17.md`.

**Stalled-work check ran** off the `stateHistory` already fetched for this run's candidates: THR-733, THR-625 and THR-1170 each show a single transition into their current state, so 0 pickups apiece. Nothing on the board is at or over `ORCH_STALLED_PICKUP_THRESHOLD` (3).

### One thing checked and deliberately not reported as a finding

While measuring THR-625's baseline, `SURFACE_SPHERE_PROSE` came up with **8 keys against a 12-Sphere cosmology** — which reads like a coverage gap and would have been an easy line to write. It is not one. The table covers exactly the 8 Creation Spheres; the resolver keys off `node.properties.primarySphere`, and the contract test pins the table's key count to its own 8-member `ALL_SPHERES` list. The 4 Foundation Spheres (chaos, order, light, darkness) are elder forces, not agent alignments, so adding keys for them would break the length assertion and author prose nothing can draw.

Recorded here because the *check* is the useful part: the gap was verified against the call site and the guard before being written down, and it dissolved. A finding published without that step would have sent an executor to "fix" working code. The same caution is now baked into THR-625's coordination block as an explicit do-not.

## Escalations

None. No question was asked and nothing was parked this run — the shelf yielded genuine work, so the agreed-work-exhausted branch did not fire.

One item carried rather than escalated: THR-1170 is surfaced to Christian above as a single yes/no rather than posted to Discord, because it is a content-direction call with a working fallback, not a blocker.
