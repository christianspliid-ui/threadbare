---
lane: tb-orchestrator
run: 2026-08-29h
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-08-29 (run h, ~08:27–08:40Z)

## Needs Christian

**Nothing new arrived for you this hour.** Both items below are unchanged and repeated only so they stay in the briefing, which reads the newest orchestrator report and would otherwise show you an empty list.

**1. A design session is still what the pipeline is short of.** Unchanged for ten hours. Every remaining route from "we agree on this" to "an executor can build it" runs through you sitting down with an attended session. The one waiting to be picked up is the **non-human cast problem** — a beast cannot currently be a character in a scene, which is what blocks every hunt encounter from being written ([THR-1274](https://linear.app/threadbare/issue/THR-1274/no-non-human-cast-primitive-a-beast-cannot-be-a-bound-scene-actor)). Two design efforts have been open in the design column for 10 and 14 days ([the card grammar](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card), [traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools)), which is why no new one can be staged behind them.

**2. The unreachable-ambitions world fact, still a design call and still not blocking anything today** — ten of the strategic things characters can decide to pursue are unreachable on one of the two test worlds, because only background characters ever hold them ([THR-1348](https://linear.app/threadbare/issue/THR-1348/ambitions-held-below-the-spotlight-tier-have-no-agency-path-10-of-the)).

**Closing the loop on last hour's note, no action needed.** The test time limit that had stranded two finished changes for 8.7 and 5.7 hours was re-measured and fixed; that work merged at 07:34Z and both changes are through. One related clean-up — three other tests that go red for no real reason and cost roughly half an hour a week of wasted checking — was queued for a builder this hour on the same evidence.

## T1 — unblock sweep

**Promoted: 1. Filed: 0. Held: 0. Blockers resolved: 0.**

Board at the sweep: **46 `Todo`** (`hasNextPage: false`), **6 `Ready for Dev`** at scan / **7** after the promotion (`hasNextPage: false`), **2 `In Design`**, **7 `In Dev`** (4 live claims, 3 `Parked`). The `Idea` slice was scanned as well (25 returned, `hasNextPage: true`) since step 2 names `Idea` as a candidate state — nothing promotable in its head: four `drift-scan` rows, three undertaking-chain deferrals, and a tail of design calls and unpromoted process items. The promotion ceiling did not bind (shelf 6, threshold 15) and `ORCH_PROMOTE_BATCH_MAX` (5) was not approached.

### Promoted — [THR-1328](https://linear.app/threadbare/issue/THR-1328/de-flake-the-three-named-closeout-tests-impediment-id-allocation-5s), the three flaky closeout tests

```
[orchestrator] T1 promote THR-1328: blockedBy [] (never had one); run g's two decline
               reasons both falsified — THR-1352 Done 07:34:48Z, its merged diff 61c73ff4
               touches 2 files, neither shared with this ticket → Ready for Dev
               (project: Continuous Improvement)
```

**This ticket has no blocker and never had one** — `relations.blockedBy` is `[]`, re-read this run. It was held for six consecutive runs by a decline this lane wrote itself, which run g corrected once already (the throttle reason) and then re-declined on two fresh grounds, explicitly queued for reassessment *"next run after THR-1352 merges."* It merged. Both grounds are now falsified, and the second one was never true:

| Run g's ground | Status this run |
|---|---|
| **"Adjacent to a live claim"** — THR-1352 `In Dev` on the same class of work, with a stated collision risk in `vitest.config.ts` | **Falsified twice over.** THR-1352 reached `Done` at **07:34:48Z** (PR [#1723](https://github.com/christianspliid-ui/threadbare/pull/1723)), so the claim is closed. And `git show --name-only 61c73ff4` returns exactly two paths — `src/engine/__tests__/debugTickBatch.test.ts` and `src/engine/__tests__/lairClearing.test.ts`. **It never touched `vitest.config.ts`, and neither file is one of this ticket's three.** The mutex that was priced in did not exist even while the claim was live — worth recording, because the decline reasoned from *class similarity* rather than from files, and the files were checkable at the time |
| **"The shelf is not starved; its top item is unclaimed"** | THR-1349 was claimed at ~08:04Z. Shelf at scan: **6**, of which **1** non-`Deferral`, and none a Rule-0 flow impediment |

**Rule-0 standing, unchanged from run g's correction and re-verified rather than assumed:** retro-filed 2026-08-28, quotable above-bar loss (41 minutes of a blocked armed PR on the required check, PR [#1676](https://github.com/christianspliid-ui/threadbare/pull/1676); impediments #779/#819/#869/#527/#644 at ~3 hits/week) **and** a cost/benefit line (*"costs ~1 h total; not fixing costs ~15–40 min/week"*). Both halves present, which is what this lane's own Rule-0 discipline requires of a process promotion.

**Gates run before the write:** plan-doc liveness passes trivially — the description names no `Docs/plans/` artifact; the retro report it cites (`Design/retros/retro-2026-08-28.md`) was confirmed present on `origin/main` via `git cat-file -e`. Standing-verdict check per THR-990: latest comment before the promotion was the 07:20Z grooming cross-reference, which states in its own words *"This does not change the ticket's scope."* No retire verdict. **Write verified** by `get_issue` re-query — `Ready for Dev`, `stateHistory` shows the `Todo → Ready for Dev` transition at 08:29:54Z, and no `assignee` key is present (promotion is an update, which leaves assignee alone; the THR-845 create-path hazard does not apply).

**Coordination block posted** as the newest comment, carrying the promotion evidence, the three required lines (`Mutex with: none` — re-derived against all 7 `In Dev` and 6 `Ready for Dev` items; no open issue names any of the three test files or `vitest.config.ts`), a `Blocked by: nothing` line, and CLI-sufficient evidence shape per THR-688 rule C. Two corrections were folded in so the executor does not re-derive them:

1. **The fourth-file question is answered: leave the ticket at three.** Run k of 2026-08-28 had asked on the ticket whether to widen to `debugTickBatch.test.ts`. THR-1352 took that file separately (180s → 420s against a measured 90.8s branch-side worst case), so option (b) — *stay at three and say so on the record* — is the live answer rather than a silent assumption. The class-level caveat that comment raised is **not** resolved and is explicitly out of this ticket's scope: THR-1352 raised a literal rather than deriving the budget from tick count, which is the fifth such raise, and the durable fix named in the 2026-07-25 impediment row (derive from a `TICKS_PER_SECOND_FLOOR`-style constant) still has no ticket. That is retro input, recorded here so it is not lost between the two.
2. **Done-when item 3 points at a section that no longer holds its text.** It names *"CLAUDE.md § Known Sandbox Limitations"*; THR-1336 moved that catalog after the ticket was filed. CLAUDE.md now carries a five-rule summary, and the false-red triage protocol — the three shapes and the rerun-in-isolation rule — lives at `Docs/ops/sandbox-limitations.md` line 7. Verified by reading both files, not inferred from the THR-1336 ticket.

**Process budget:** this spends the *one process ticket per three runs* allowance. Runs e, f and g each promoted **0** (frontmatter read directly from `origin/ops`, not recalled), so the budget was fully available and is now spent until run k at the earliest. Its two retro siblings, [THR-1326](https://linear.app/threadbare/issue/THR-1326/fresh-worktree-node-modules-stub-find-the-producer-31-arrivalsweek-and) and [THR-1327](https://linear.app/threadbare/issue/THR-1327/generate-project-status-renders-1-of-281-fragments-the-60-line-cap-is), stay declined **on the budget alone** — both are retro-filed with quotable loss, so neither the materiality bar nor the queue is what holds them, and they should be the default candidates when the budget reopens.

### A scope adjacency worth naming, and deliberately not written to the ticket

[THR-949](https://linear.app/threadbare/issue/THR-949/four-engine-tests-carry-module-scope-state-or-a-timing-budget-across) — *"four engine tests carry module-scope state (or a timing budget) across files, so they are pinned out of the shared-worker test pool"* — overlaps THR-1328's item 1 ("mark them no-parallel — whichever the vitest config supports cleanly"). It is **not** a mutex: it sits in `Idea`, unpromoted and unclaimable, so no concurrent write is possible. It is recorded here because if it is ever promoted while THR-1328 is in flight, that *is* the mutex, and the coordination block says so in those terms.

**It was deliberately not added as a second comment.** `pull-work` Step 3 reads the **latest** comment for the three coordination lines, so any follow-up comment lacking them re-breaks the gate on an issue this lane just promoted. That is not hypothetical: it is exactly what the (otherwise correct and useful) 07:20Z grooming cross-reference did to this ticket's original 2026-08-28 block, which is why the promotion had to restate it. **Standing note for every lane that comments on a `Ready for Dev` issue: a comment is not free — it displaces the block.**

### The standing declined set

Unchanged member for member from run g, minus THR-1328 which promoted: THR-1303 (blocker THR-1301 is `Todo`), THR-1301 (blocker THR-1349 now `In Dev`, still not `Done`), THR-1222, THR-1195, THR-1256 (time gate, opens 2026-09-08), THR-1255 / THR-1218, THR-1220, THR-870, THR-1024, THR-175, THR-1326 / THR-1327 (budget, above), the eight design-gated items routed to T2, THR-1348, the program epics (THR-1156, THR-789, THR-1043), and all 15 `wayfinder:*` items skipped unconditionally.

**The undertaking chain is unmoved and still two hops deep:** THR-1349 → THR-1301 → THR-1303. THR-1349 left the shelf for `In Dev` at ~08:04Z but is not `Done`, so the gate on THR-1301 stands.

**Product-vs-process ratio.** This run's single promotion is process work, taken under Rule 0 (a flow impediment with demonstrated cost outranks feature work, including Urgent). Week to date moves to roughly **65/35 product to process** by completion. The shelf holds unclaimed product work, so the headline is **not** "feature pipeline needs supply" — it remains the one standing constraint already on Christian's list: every route from agreed work to a *prepared design* runs through a person.

## T1.5 — wayfinder sweep

**Three open maps, membership unchanged, all three still entirely HITL — 0 AFK tickets available.**

| Map | Frontier | AFK resolved | HITL waiting |
|---|---|---|---|
| [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) | 10 open | 0 available | 6 `grilling` + 4 `prototype` |
| [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft) | 1 open (0 on frontier) | 0 available | THR-1232 (`prototype`, **assigned** — off the frontier by the assignee rule) |
| [Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator) | 1 open | 0 available | THR-1236 (`prototype`) |

Membership re-derived from this run's own state-filtered `Todo` sweep — 3 maps + 12 children, every child labelled `grilling` or `prototype`, 15 `wayfinder:*` items total. Run d proved the AFK column empty directly (19 `wayfinder:research` + 3 `wayfinder:task`, all `Done`); no issue has changed label or state since, so that proof still holds rather than being re-asserted.

`ORCH_WAYFINDER_AFK_MAX` did not bind — there was nothing to bind against. Nothing claimed, nothing assigned, no guessed resolution posted. **No `grilling` or `prototype` ticket was touched**, per the standing rule.

## T2 — design authoring

**Trigger fires at scan; barred by the `In Design` bound. Tenth consecutive run in this state.**

- **Shelf count: TRIGGERED at scan.** `ORCH_PROGRAM_WORK_FLOOR` is 2; non-`Deferral` items in `Ready for Dev` at scan time was **1** ([THR-1324](https://linear.app/threadbare/issue/THR-1324/prose-doctrine-v2-remediation-sweep-10-operative-surfaces-still-teach)). This run's promotion of THR-1328 (`Infrastructure` / `Improvement`, not `Deferral`) takes it to **2** — exactly at the floor, so the trigger will not fire on shelf count alone next run unless something is claimed. Stated plainly because the number moved *because of this lane's own write*, and a reader comparing run h to run i should not read that as the board healing on its own.
- **`In Design` bound: BARRED.** `ORCH_MAX_IN_DESIGN` is 1; `In Design` holds **2** — THR-1002 (`startedAt` 2026-08-19, 10 days) and THR-790 (`startedAt` 2026-08-15, 14 days). Both far past the 48h threshold and **re-surfaced, not re-staged**, per the rule.

**Had the bound been open, the staging pick would again have been [THR-1274](https://linear.app/threadbare/issue/THR-1274/no-non-human-cast-primitive-a-beast-cannot-be-a-bound-scene-actor)** (no non-human cast primitive), unchanged for six consecutive runs. Runner-up unchanged: THR-1315.

**The standing measurement finding gets an eleventh data point, and this run is the cleanest illustration of it yet.** The trigger counts non-`Deferral` items, but the label is a *provenance* marker — "filed as a deferral by the session that found it" — not a size or value marker. Six of the seven shelf items now carry it, including a two-seed balance judgement (THR-1349, since claimed) and a UI-pillar chip fix. Today the count went 1 → 2 not because program work arrived but because a **test-flake ticket** happened to be filed by a retro rather than deferred by a session. A measure that a gate-tuning ticket satisfies as readily as a game system is not measuring program-work supply. Stated, not acted on: the constant is not this lane's to change mid-run, and it belongs in one line at the weekly retro.

**T2 queue composition: unchanged and net flat.** Nine design calls in `Todo` (THR-1287, THR-1274, THR-1134, THR-1195, THR-1114, THR-1189, THR-1315, THR-1318, THR-1348), the two parked in the column, three Proactive Agent Actions plan-doc sessions (THR-1298 / THR-1299 / THR-1300, all fully unblocked), and twelve wayfinder questions on fully-prepared maps.

## T3 — architecture health

**Not due — the daily sweep already ran today** at [run d](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-29d.md) (04:30Z / 06:27 local, first past `ORCH_HEALTH_SWEEP_HOUR`). Verified this run by reading that report's own T3 section on `origin/ops`, not carried forward from run g's assertion. **No detector was run this hour**, and none of run d's results (8 LEAKED contracts, 95 total; canon staleness 18; `check:process` exit 0; `sweep:rank-reach` PASS) is restated here as if freshly measured.

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Saturday. Deliberately not reported from Monday's result; [`test-suite-health-2026-08-24.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-08-24.md) stands unchanged on `ops`.

`__DEBUG.validateTraitRefs()` is browser-only and cannot be invoked headless. **Not run, and not reported as clean.**

**Redundancy: not assessed this sweep.** It is a daily-sweep judgement pass and run d did it. Not re-derived here, and not implied to have been.

**Stalled work: not re-assessed** — a daily-sweep item; run d's result stands.

**Hand-created `In Dev` count went 3 → 2, by closure not repair.** [THR-1352](https://linear.app/threadbare/issue/THR-1352/two-heavy-world-build-tests-drifted-3x-past-their-documented-cost) — run g's new finding, and the first instance from an automated lane — reached `Done` at 07:34:48Z. THR-1350 and THR-1351 (both created directly into `In Dev` at 06:17Z by an attended session) remain open and are unchanged. This is a **delta on an existing finding, not a new one**, which is why `newFindings` is 0: nothing was normalised, nothing was written to, and the ruling's ask — that the practice be made countable — is served by the count moving in the record rather than by any action here. Claim arbitration remains `pull-work` Step 1.8's.

## Escalations

**None raised, no item parked.** The escalation path exists for *agreed work being exhausted* — asking rather than falling through to un-agreed work — and that threshold did not move closer: the T2 queue holds nine design calls, three plan-doc sessions and twelve wayfinder questions, all agreed.

Two things for the weekly retro, logged here rather than filed as tickets per the process-work throttle (lanes log; the retro promotes):

1. **A comment on a `Ready for Dev` issue displaces its coordination block**, because `pull-work` Step 3 reads only the latest comment. Observed live on THR-1328 this run. Cost so far is one restatement, well under the materiality bar — but the failure mode is silent and the cheap fix (read the newest comment *containing* the three lines rather than the newest comment) is a one-line change to a gate that already exists.
2. **The tick-test budget class still has no owner.** THR-1352 was the fifth raise of a hard-coded literal where the 2026-07-25 impediment row already named the durable fix (derive the budget from tick count). Each raise buys roughly a month and then re-presents as a required-check block on somebody else's unrelated PR.
