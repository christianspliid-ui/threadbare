---
lane: tb-orchestrator
run: 2026-08-28g
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-08-28 (run g, ~16:32Z)

## Needs Christian

**Nothing new this hour, and nothing is stuck waiting on you.** One more job went onto the shelf — a strip of the god's own status bar (the row meant to show your conditions, clues and vows) has been wired to a data source nothing has ever written to, so those rows have shown empty in every game ever played. The builder can decide alone whether to repoint it, fill it, or remove it. ([THR-1307](https://linear.app/threadbare/issue/THR-1307/the-ascendant-hooks-block-reads-an-edge-type-that-has-no-writer-and-is))

**Two standing asks, both unchanged — skip if you have seen them.**

1. **The design column is the bottleneck, and has been for twenty runs.** Two items sit there unpicked: [the card-grammar unification](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) at **9 days** and [traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) at **13**. Pick one up or park it, and nine design calls start moving.
2. **Approving [the retrofit batch-2 brief](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/retrofit-batch-2-brief.md) unlocks the camp-seven encounter work** ([THR-1222](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine)). Still the only queued item that would put real *content* work on a shelf holding none.

## T1 — unblock sweep

**Promoted: 1. Held: 1. Filed: 0.** Scans complete (`hasNextPage: false` on both documented queries): **4 `Ready for Dev`** before the write, **5** after; **6 `In Dev`** — THR-1309, THR-1320 and THR-1313 claimed, plus the same three `Parked` items (THR-1130 / THR-1133 / THR-1168). `Todo` returned 50 with `hasNextPage: true`. **`Idea` and `In Design` were queried by hand**, as run f did, and `Idea` is again where the run's promotion came from.

### Promoted

| Issue | Evidence |
|---|---|
| [THR-1307](https://linear.app/threadbare/issue/THR-1307/the-ascendant-hooks-block-reads-an-edge-type-that-has-no-writer-and-is) — the ascendant Hooks block reads `has_attachment`, an edge with two readers, zero writers, no `EDGE_SCHEMA` row and no `EdgeType` member, so conditions/clues/vows can never render | `get_issue(includeRelations:true)` returns `blockedBy: []`. No prose gate, no time gate, no phase alias. Names no plan doc → liveness gate (THR-921) passes trivially. Latest-comment check (THR-990): newest is `daily-backlog-grooming`'s 07:18Z project assignment, explicitly "no other field touched" — a hygiene note, not a verdict. Ceiling did not bind (shelf 4 ≪ 15). Verified by `get_issue` re-query: `Ready for Dev`, `assignee` key absent. [Block posted](https://linear.app/threadbare/issue/THR-1307/the-ascendant-hooks-block-reads-an-edge-type-that-has-no-writer-and-is) |

**The `Idea` scan gap is now twice-measured on consecutive runs, and the cost is larger than run f's.** THR-1307 was filed 2026-08-27T17:33Z and sat invisible to every sweep for **~23 hours** — six hourly runs — because T1's documented step 1 queries only `Todo` and `Ready for Dev`. Run f paid ~3h32m for the same gap on THR-1320 and correctly routed the fix to [PR #1694](https://github.com/christianspliid-ui/threadbare/pull/1694) (this week's retro) as a one-line amendment adding `Idea` and `Implementation Planning` to the skill's § T1 step 1. Nothing new is filed here — the process-work throttle makes the weekly retro the single promotion point, and that ticket is already open. This run adds the second data point and the larger duration to it.

**Why THR-1307 promotes rather than routing to T2, when its own body opens by calling itself "a design call".** That is the filer's framing and the board should not inherit it uninspected. The ticket asks *what to do with a reader that has no writer* — a dead-code disposition, which is a technical verdict and the executor's to make (CLAUDE.md § User review interface, rule 4). It is the same class run e promoted THR-1323 on. Decisively, the ticket's own Done-when **delegates its one genuinely design-shaped branch away**: *"If a producer is owed: it is its own ticket with a coordination block, and this one closes pointing at it."* No branch of it requires deciding what the game means.

**Mutex re-derived at promotion from actual file lists, not inherited.** Only two PRs are open, and `gh pr view <n> --json files` confirms neither touches `src/components/Game/ascendant-bar/`: [#1690](https://github.com/christianspliid-ui/threadbare/pull/1690) is strategic-action/undertaking engine plus `src/types/gameState.ts`; [#1693](https://github.com/christianspliid-ui/threadbare/pull/1693) is `src/engine/worldSeed.ts` plus closeout docs. `Mutex with: none live.`

### Held

| Issue | Evidence |
|---|---|
| [THR-1329](https://linear.app/threadbare/issue/THR-1329/seed-99-mints-zero-trade-routes-in-150-ticks-so-the-trade-route-kind) — seed 99 mints zero trade routes in 150 ticks | `Blocked by: nothing` is accurate, and on that field alone it promotes. Held on **its own filing block's instruction** — that block derives a live mutex against THR-1309 and closes with *"Serialize."*, having established there is **no disjoint option**, because naming the failing stage is the first Done-when so the investigation cannot choose its files in advance. Re-verified: #1690's file list contains every file this diagnosis can land in. **Native `blockedBy` → THR-1309 set this run**, so the next sweep releases it mechanically |

Held rather than promoted for the reason the board paid for twice today: THR-1321 and THR-1322 were promoted at 13:31/13:32Z into a known collision with this same PR, claimed, bounced within a minute, and demoted to `Todo` at 15:08Z — two claims and ~95 minutes of top-of-queue slot for zero code.

### The run's finding — PR #1690's red is a real regression, and it dams four tickets

**THR-1309 has held the WIP slot since 12:03Z. Its PR has been armed for auto-merge since 13:01Z and cannot fire**: `mergeStateStatus: DIRTY` **and** required check `Test · Typecheck · Build` **FAILED** at 15:22Z. That is the THR-969 shape (impediment #402) — reads as shipping from every surface except the check rollup — standing ~3h27m.

**Technical verdict, which is this lane's to make: not a flake.** 1 test failed against 18,934 passed, 1 file against 1,133, named test and named line. None of the three false-red shapes in CLAUDE.md's triage protocol fits — not worker contention (the file is inside this diff's blast radius), not a worker-fork crash (the test is named and the file total is normal), not a piped exit code.

```
AssertionError: expected 0 to be greater than 0
 ❯ src/engine/__tests__/edgeIntegrity.test.ts:318:51
   expect(writtenByType.get('trades_with') ?? 0).toBeGreaterThan(0);
```

**And it is THR-1329's finding arriving from a second direction.** That line is a pre-existing THR-830 assertion on `origin/main` (`8185b6f6`) whose comment records the measured run writing **5** `trades_with` edges; it exists to stop the vacuous reading of its two siblings. On #1690's branch the count is **0** — a second world, unrelated to seed 99, also minting no trade routes. Whether the two share a cause is now recorded on THR-1329 as the thing its investigation settles first; if they do, `edgeIntegrity.test.ts` is a far cheaper reproduction than a 150-tick CLI run. A likely mechanism was offered to the executor as a *lead, explicitly not a verdict* (`strategicActionCandidates.ts` is in the diff, and adding the `warband` kind can shift which undertaking a merchant selects) — **not verified; the branch was not checked out and no arm was run.**

Both PRs on the board are `DIRTY`, and #1693's conflict is the documented closeout-docs class (green checks, `Docs/changelog.md` / `impediments.md` / `project-history.md`) whose fix is `git merge origin/main && git push` from the branch. Both are ordinary merges, not anything structural. Surfaced to the executor as a [comment on THR-1309](https://linear.app/threadbare/issue/THR-1309/t3-undertaking-tier-the-warband-kind-and-the-create-group-strategic-op), with one warning: **do not make that assertion pass by relaxing it** — it is the guard against exactly the failure THR-1329 documents.

**Four tickets carry native `blockedBy` → THR-1309** — THR-1321, THR-1322, THR-1294 and now THR-1329 — and all release the moment #1690 merges. **Not filed as a ticket:** this is a live PR the executor lane owns, with no measured loss beyond the wait, and scheduled lanes do not file process tickets.

### Declined

**Nothing was re-derived.** Runs c/d/e/f's classification of the remaining `Todo` set stands and no member has moved: THR-1222 (unmet chat-approval gate — standing ask 2), THR-1195 (standing verdict on record), THR-1256 (unmet time gate, opens 2026-09-08, 11 days out), THR-1255 and THR-1218 (both gated on corpus/content density that has not arrived), THR-1220 (HITL review session — never promotable), the design-gated tickets routed to T2, and the program epics and plan-doc sessions. **THR-1321 and THR-1322 remain declined** — run f's "do not re-promote" holds, their blocker is unchanged, and the reason is now stronger than it was at 15:31Z. Re-listing this set hourly with identical evidence is the dump this lane forbids. All `wayfinder:*` items skipped unconditionally — T1.5's input, never `Ready for Dev`.

**Hygiene, surfaced not acted on (unchanged from run f, one item added).** THR-1329 and THR-1323 sit with **no project**, against CLAUDE.md's no-orphans rule; both plainly belong to *Thematic Pressure & Living World*. `daily-backlog-grooming` owns state hygiene — it fixed THR-1307's orphan at 07:18Z this morning — so the field was left alone.

## T1.5 — wayfinder sweep

Three open maps, unchanged: [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict), [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft), [Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator).

**AFK burn-down: 0, re-proved independently rather than inherited.** Two direct label queries this run: `wayfinder:research` returns **19 issues, every one `Done`**; `wayfinder:task` returns **3, every one `Done`**. So the zero means *every agent-doable ticket these maps have ever carried is finished* — not "none happens to be in `Todo`". The two read identically in a report and only one is healthy, which is why it is re-proved rather than copied forward. Nothing claimed, nothing assigned, no guessed resolution posted.

**HITL frontier deliberately not re-listed.** Every open child across the three maps carries `wayfinder:grilling` or `wayfinder:prototype`, which an agent must not resolve. The set is unchanged since 2026-08-26 and has already been surfaced; re-surfacing it hourly is the same dump.

## T2 — design staging

**Triggered, bound out — for a twentieth consecutive run.** Nothing staged, bound not overridden.

Non-`Deferral` items in `Ready for Dev`: **0**, against `ORCH_PROGRAM_WORK_FLOOR` of 2. `In Design` holds **2** against `ORCH_MAX_IN_DESIGN` of 1 — THR-1002 (staged by this lane 2026-08-19, **9 days** unpicked) and THR-790 (**13 days**). Both far past 48h, therefore **re-surfaced, not re-staged**.

**This run's promotion did not move the measure, and it is stated rather than left implied.** THR-1307 carries `Deferral`, so the shelf went 4 → 5 while program work stayed at **0**. That is now four consecutive runs whose every promotion was `Deferral`-labelled. Run c logged the reason the measure is wrong — `Deferral` has become the closeout convention for anything filed mid-slice, including work that is not deferred in any meaningful sense — and that remains an impediment-log row for the weekly retro, **not** a ticket. It does not clear the materiality bar and is not re-filed.

**Had the bound been open, this run's staging pick would again have been [THR-1274](https://linear.app/threadbare/issue/THR-1274/no-non-human-cast-primitive-a-beast-cannot-be-a-bound-scene-actor)** — unchanged from runs d and e, recorded so the choice stays on the record rather than being re-derived next run. Runner-up unchanged: THR-1315.

**T2's queue: nine design calls in `Todo`** — THR-1287, THR-1274, THR-1134, THR-1195, THR-1114, THR-1189, THR-1302, THR-1315, THR-1318 — **plus two parked in the column, plus three proactive-agents plan-doc sessions, plus ten wayfinder questions on a fully-prepared map.** Unchanged in composition; this run added none and cleared none.

**The headline is unchanged and remains a supply problem: the feature pipeline needs design/Christian.**

## T3 — architecture health

**Not due — already run today.** Run b performed the daily sweep at 07:35 local, the first past `ORCH_HEALTH_SWEEP_HOUR` (6): [`…-28b.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-28b.md). One sweep per day; this run does not repeat it.

**No detector ran this run and none is reported as clean.** `newFindings: 0` is literal, not a clean bill — the #1690 diagnosis in § T1 came from reading a CI log, not from a detector. `__DEBUG.validateTraitRefs()` is browser-only and cannot run headless: **not run, not reported as clean.**

**Redundancy: not assessed this sweep.** Run b's judgement pass stands. Nothing above amends it — the #1690 finding is a CI/regression verdict, not a redundancy finding, and it was reached by reading a failing assertion rather than by a pass over the interface map and systems inventory.

**Stalled work: partially assessed, and the assessment is worth stating because the definition does not catch what is actually stuck.** No `In Dev` issue meets `ORCH_STALLED_PICKUP_THRESHOLD` (3 `Ready for Dev → In Dev` transitions without a `Done`); THR-1309 has exactly **one**, and THR-1130 sits at the threshold by design as a `Parked` batch umbrella. Yet THR-1309 is unambiguously stuck — 4h30m `In Dev` on an armed PR that cannot merge, damming four tickets. **The detector counts re-claims, so a first claim that never lands is invisible to it.** Recorded as an observation, not filed: it needs a duration signal rather than a transition count, and the weekly retro is the place that judgement belongs.

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Friday. Monday's [`test-suite-health-2026-08-24.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-08-24.md) stands and is deliberately not re-reported.

## Escalations

**None raised, and none was warranted.** T2's agreed work is not *exhausted* — it is **bound out**, which does not trigger the stop-and-ask rule: nine agreed design calls are queued and available the moment `In Design` has room. Nothing was parked, no un-agreed roadmap item was picked up to stay busy, and Discord was not contacted.

**Nothing filed.** Three candidates for a process ticket were seen and all three correctly withheld — the `Idea` scan gap (already routed to the open retro PR #1694), the stalled-PR detector's transition-count blind spot, and the `Deferral`-label measurement drift. All are impediment-log material for the weekly retro to batch; scheduled lanes do not file process or infrastructure tickets.

**Product-vs-process ratio for the week:** this run's single promotion is a player-visible UI defect — product work, notwithstanding its `Improvement` label and `Continuous Improvement` project, since the label says what a ticket is *about*, not what it has cost. Zero process tickets promoted, zero filed.
