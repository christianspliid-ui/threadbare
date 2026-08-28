---
lane: tb-orchestrator
run: 2026-08-28j
promoted: 1
filed: 0
resolved: 0
newFindings: 1
needsChristian: true
---
# Orchestrator — 2026-08-28 (run j, ~19:29Z)

## Needs Christian

**The builders are busy and the shelf is stocked — nothing has gone wrong this hour.** One more job went onto the queue (a world where merchants never manage to found a single trade route in 150 turns — the builder can diagnose that alone), and the job released last hour is already being worked on.

**Your three standing asks are unchanged from last hour. Skip this section if you have already read them.**

1. **[Approving the retrofit batch-2 brief](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/retrofit-batch-2-brief.md)** unlocks the camp-seven encounter work ([THR-1222](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine)) — still the biggest single lever on the content side, and it costs you one yes or no.
2. **Two designs are frozen waiting for a person**, and no third can be prepared until one moves: [the card-grammar unification](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) (**9 days**) and [traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) (**13 days**). Pick one up, or park it and say so.
3. **Three wayfinder maps are waiting entirely on you** — every question an agent could answer alone is answered, and what is left is only judgement about how the game should feel:
   - **[Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict)** — ten open, including [what winning leaves in your hands](https://linear.app/threadbare/issue/THR-1270/victory-yields-what-winning-leaves-in-your-hands) and [how many faces defeat should wear](https://linear.app/threadbare/issue/THR-1266/defeat-wears-many-faces-the-outcome-spectrum).
   - **[Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft)** — one left: [twenty generated spells to react to](https://linear.app/threadbare/issue/THR-1232/power-generator-sketch-twenty-generated-spells-to-react-to).
   - **[Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator)** — one left: [thirty generated items to react to](https://linear.app/threadbare/issue/THR-1236/item-generator-sketch-thirty-generated-items-to-react-to).

   The two generator sketches are the cheapest — you look at a list and react. Say "work the map" when you have an hour.

Nothing else needs you. One in-flight job hit a red check and the cause is already diagnosed and written up for whoever picks it back up; it needs no decision from you.

## T1 — unblock sweep

**Promoted: 1. Held: 0 beyond the standing holds. Filed: 0. Declined: no set re-derived.**

Board at the sweep: **7 `Ready for Dev`** before the write, **8** after (`hasNextPage: false`); **6 `In Dev`** — THR-1337, THR-1321 and THR-1336 claimed, plus the three `Parked` umbrellas THR-1130 / THR-1133 / THR-1168; **2 `In Design`**. `Todo` returned 47 with `hasNextPage: false`. **`Idea` was queried by hand** for the fifth consecutive run, and `createdAt: -PT3H` was queried as a **new-arrivals pass** — see below.

### Promoted

| Issue | Evidence |
|---|---|
| [THR-1329](https://linear.app/threadbare/issue/THR-1329/seed-99-mints-zero-trade-routes-in-150-ticks-so-the-trade-route-kind) — seed 99 mints zero trade routes in 150 ticks (Low, Engine) | Run g's hold released **on the exact condition it wrote**: *"the mutex dies entirely once #1690 merges."* [#1690](https://github.com/christianspliid-ui/threadbare/pull/1690) merged **18:22:02Z**; THR-1309 `Done` 18:22:24Z; `get_issue(includeRelations: true)` returns `blockedBy: [THR-1309]`, terminal. Run i then held it a second time on the **promotion ceiling alone** and recorded it as next run's first item — which is what this is. Names no plan doc → THR-921 gate passes trivially. Latest-comment check (THR-990): run g's hold, not a retire verdict. Ceiling did not bind (shelf 7 ≪ 15). Verified by `get_issue` re-query: `Ready for Dev`, `assignee` key absent. [Block posted](https://linear.app/threadbare/issue/THR-1329/seed-99-mints-zero-trade-routes-in-150-ticks-so-the-trade-route-kind) |

**Mutex re-derived at promotion, not inherited.** The filing block's mutex named THR-1309/#1690, which is now dead. The live one is **THR-1321** (`In Dev` since 19:04:46Z): its diagnosis half can land in `src/engine/strategicActionLifecycle.ts`, which is also on THR-1329's provisional list, though the two touch different strategic packs (warband vs merchant). Stated as **soft**, with its reversal condition, because WIP = 1 serializes them in practice — the executor cannot hold both slots. The only other open PR, [#1704](https://github.com/christianspliid-ui/threadbare/pull/1704), was checked and is **not** a mutex: `gh pr view 1704 --json files` returns twelve paths, all `.md` or `Docs/`, with `Test · Typecheck · Build` recorded `SKIPPED`.

### The run's finding — #1704's red is a coupling guard firing correctly against a doc move

[**THR-1336**](https://linear.app/threadbare/issue/THR-1336/claudemd-diet-gate-law-and-sandbox-lore-move-to-canonops-pages-with) (CLAUDE.md diet) is `In Dev` with PR #1704 `BLOCKED` on required check **`Docs gates` FAILED at 19:06:07Z**. Run i inherited this PR as `DIRTY`; it has since been merged forward and now carries a different, deterministic failure. **Technical verdict, which is this lane's to make: not a flake, not a timeout, and none of the three false-red shapes** — the step names its two victims and the mechanism is fully legible from the log.

```
check:predicate-copies — FAILED

  MISSING  CLAUDE.md (registered as: the canonical prose copy — § Testing, the two-track gate) — no `grep -vE '...'` found
  MISSING  Docs/canon/process.md (registered as: session Step 0 pointer surface) — no `grep -vE '...'` found
```

`scripts/docs-only-predicate.ts:141` registers five prose copies of the docs-only classification predicate. The diet moves the gate law out of `CLAUDE.md` and `Docs/canon/process.md` into the new `Docs/canon/verification-gates.md`, so both registered files lose their `grep -vE '...'` line — and the checker deliberately treats a *vanished* copy as a failure rather than a pass, for the reason stated in its own header: *"'the copy is gone' is the same failure as 'the copy is wrong' for an agent reading that file to decide its track."* The other three rows (`AGENTS.md`, `.claude/skills/pull-work/SKILL.md`, the `tb-opus-pickup` prompt mirror) still pass, which is why exactly two lines appear.

**The consequence worth naming, and the reason this is a finding rather than a note:** the fix is a `PREDICATE_COPIES` edit, and `scripts/` is code — so the repair **moves this PR from the docs track to the code track**. `Test · Typecheck · Build` currently records `SKIPPED` and will start running from that push onward, along with the full ~15-minute gate and the tree-diffing freshness rules. An executor who fixes the registry expecting a 30-second docs merge is planning the wrong closeout. That is precisely the sort of thing an incoming session re-derives at cost, so it is [written onto the ticket](https://linear.app/threadbare/issue/THR-1336/claudemd-diet-gate-law-and-sandbox-lore-move-to-canonops-pages-with) rather than left in a report.

**Nothing filed.** No ticket is owed: the guard worked, the PR is claimed and live, and the repair belongs to the session already holding it. Scheduled lanes do not file process tickets (CLAUDE.md § Process-work throttle) and there is no loss here to log — this is a gate catching a change before it shipped, which is the healthy case.

### New-arrivals pass — run i's Finding 1, applied

Run i's finding was that "do not re-derive the declined set" silently excludes candidates **filed after** the last classification, at a measured cost of ~3 hours on two tickets. Its proposed clause was applied this run: a `createdAt: -PT3H` query returned nine issues, of which exactly one postdates run i's 18:38Z sweep — **THR-1337** (context-cleanup round 2, created 18:43:07Z). It is already `In Dev` and assigned, so it is an attended session's work and not a T1 candidate. Cost of the pass: one call. It found nothing this hour, which is the expected result most hours and is the point of it being cheap.

### Declined

**Nothing re-derived, by design.** Runs c–i's classification of the `Todo` and `Idea` sets stands and no member has moved: THR-1222 (unmet chat-approval gate — the standing ask above), THR-1195 (standing verdict on record 2026-08-22), THR-1256 (time gate, opens 2026-09-08), THR-1255 / THR-1218 (gated on content density), THR-1220 (HITL review session, never promotable), the design-gated tickets routed to T2 (THR-1155, THR-1274, THR-1287, THR-1114), and the program epics. THR-1294 remains held on run i's Finding 2 (its Done-when names a stage-mover that has not landed) with no new `blockedBy` set, deliberately. THR-1295 remains recorded, not acted on — closing on another ticket's Done-when is outside this lane's remit. All `wayfinder:*` items skipped unconditionally.

## T1.5 — wayfinder sweep

Three open maps, membership unchanged, and all three remain **entirely HITL**.

| Map | Frontier | AFK resolved | HITL surfaced |
|---|---|---|---|
| [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) | 10 open | **0 available** | 6 `grilling` + 4 `prototype` |
| [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft) | 1 open | **0 available** | THR-1232 (`prototype`) |
| [Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator) | 1 open | **0 available** | THR-1236 (`prototype`) |

**Re-proved independently rather than inherited from run i**, because the two readings look identical in a report and only one is healthy: two direct label queries returned `wayfinder:research` → **19 issues, every one `Done`**, and `wayfinder:task` → **3, every one `Done`**. So the zero means *every agent-doable ticket these maps have ever carried is finished*, not "none happens to be available". `ORCH_WAYFINDER_AFK_MAX` (2) did not bind — there was nothing to bind against. Nothing claimed, nothing assigned, no guessed resolution posted. Grilling and prototype tickets are never touched by this lane.

Surfaced by name under `## Needs Christian` above.

## T2 — design authoring

**Not triggered, on two independent grounds — both unchanged from run i.**

- **Shelf count.** `ORCH_PROGRAM_WORK_FLOOR` is 2 and the trigger is *fewer than* 2 non-`Deferral` items in `Ready for Dev`. The count is **2** (THR-1324, THR-1325) — at the floor, not below it. This run's promotion does not change that: THR-1329 carries the `Deferral` label, so the shelf went 7 → 8 while program work stayed at 2. Worth stating plainly, because a shelf that grows without its program-work count moving is the exact reading the deferral exclusion exists to prevent.
- **`In Design` bound.** `ORCH_MAX_IN_DESIGN` is 1 and `In Design` holds **2** — [THR-1002](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) (9 days) and [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) (13 days). Over the bound, so T2 is barred regardless of shelf depth. Both are far past the 48h threshold and are **re-surfaced, not re-staged**, per the rule.

**Product-vs-process ratio for the run.** One promotion, **product**: THR-1329 is an engine defect in the trade-route economy. No process ticket entered the queue from this lane this run, so the Rule 0 materiality bar and the one-per-three-runs process budget were not exercised.

**The headline finding remains an upstream one.** Run i's five promotions were a one-off release from two long-running builds finishing, not a supply fix, and this run's single promotion is the tail of that same release. The constraint is unchanged and is entirely upstream of this lane: two designs frozen in `In Design` awaiting a person, and one High-priority content ticket awaiting a chat approval. When the current eight drain, the shelf returns to deferrals unless one of those three moves.

## T3 — architecture health

**Not due — already run today.** Run b performed the daily sweep at 07:35 local, the first past `ORCH_HEALTH_SWEEP_HOUR` (6): [`…-28b.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-28b.md). One sweep per day; this run does not repeat it. Its findings stand — 8 LEAKED contracts unchanged in membership, canon staleness 22, `sweep:rank-reach` PASS, `check:process` exit 0.

**No detector ran this run, and none is reported as clean.** The `newFindings: 1` in this report's frontmatter is § T1's #1704 diagnosis, reached by reading a CI job log and two source files. It is **not detector output** and is named here so it cannot be mistaken for any. `__DEBUG.validateTraitRefs()` is browser-only and cannot run headless: **not run, not reported as clean.**

**Redundancy: not assessed this sweep.** Run b's judgement pass over `Docs/canon/interface-map.md` and `Docs/canon/systems-inventory.md` stands and nothing above amends it — this run's finding is a doc-move/guard-registry coupling defect, which was not reached by any pass over either surface.

**Stalled work: assessed, and clean, with run g's standing caveat.** No `In Dev` issue meets `ORCH_STALLED_PICKUP_THRESHOLD` (3 `Ready for Dev → In Dev` transitions with no `Done`). THR-1321's `stateHistory` shows **two** such transitions (14:05:51Z, released 14:06:49Z honouring the THR-1309 mutex; and 19:04:46Z, live now) — one short of the threshold and currently progressing, so it is watched rather than surfaced. THR-1130 remains at the threshold **by design**, as a `Parked` batch umbrella. Run g's caveat is unchanged and not re-filed: the detector counts re-claims, so a *first* claim that never lands stays invisible to it.

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Friday. Monday's [`test-suite-health-2026-08-24.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-08-24.md) stands and is deliberately not re-reported.

## Escalations

**None raised, nothing parked.** No Discord question was needed: agreed work was not exhausted, and no decision required Christian mid-run. The three items that need him are surfaced through the briefing under `## Needs Christian`, which is the designed path and not an escalation.

**One open PR inherited by the next run**, recorded so its state is read correctly rather than re-diagnosed: [#1704](https://github.com/christianspliid-ui/threadbare/pull/1704) (THR-1336) is `BLOCKED` on a **genuinely failing** required `Docs gates` check, cause diagnosed above and written onto the ticket. It is the claiming session's to fix and is not escalated. Run i's other inherited PR, [#1703](https://github.com/christianspliid-ui/threadbare/pull/1703) (THR-1317), has merged.
