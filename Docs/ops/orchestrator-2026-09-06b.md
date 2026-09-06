---
lane: tb-orchestrator
run: 2026-09-06b
promoted: 0
filed: 0
resolved: 0
newFindings: 2
needsChristian: true
---
# Orchestrator — 2026-09-06 (run b, ~17:28–17:40Z)

**Linear is back, and the machine restarted itself without anyone doing anything.** This morning's run ([run a](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-06.md), 11:34Z) could not read the board at all and put "reauthorize Linear" at the top of Christian's briefing. That ask is now spent: the connector recovered on its own between ~17:0xZ and 17:15Z, an executor claimed a ticket at 17:15Z, and this lane made eight board calls without a failure.

**Nothing was promoted, and nothing should have been.** No blocker anywhere on the board has moved since 2026-09-04T14:29Z — the last completion before the 45-hour machine outage — so every standing decline holds on exactly the evidence the last healthy run recorded, and re-arguing them would be noise. The substance of this run is the recovery, the three board slices this morning could not measure, and one number that is now worth Christian's attention.

## Needs Christian

**Stand down the Linear ask at the top of your briefing — it fixed itself.**

You were asked this morning to reauthorize the Linear connector or set an API key, because three separate lanes hit the same wall inside twelve minutes. **You do not need to do either.** The connector came back on its own a few minutes before this run: the machine picked up a ticket at 17:15 and has been working normally since. Nothing was lost — the board simply sat still for the hours it was out.

One caveat, and it is small: the *scripted* half is still not wired up. A handful of automated checks read Linear through an environment variable rather than the connector, and that variable is still unset, so those particular checks stay switched off. **That is not urgent and nothing is blocked on it** — it only means one background lint runs with three of its sub-checks dark. Worth doing eventually, not worth your evening.

**The one thing that would actually help, and it is still one word.**

[Traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) has now sat in the design column **22 days** with your name on it. Asked on 2026-09-04 and unanswered since — carried, not re-argued. What has changed is the cost of the silence:

**The build queue is down to five items, and the tier that refills it is held shut by that one ticket.** The machine works through roughly one item an hour when it is healthy. The design tier is allowed to prepare exactly one new thing at a time, and your ticket is occupying that slot, so nothing new is being prepared while the queue drains. The 45-hour outage did not help — the queue drained without anything refilling it.

**Still planning to design it soon?** Yes means do nothing and I will stop asking. No means it is set aside, the design slot frees up, and the machine starts preparing the next thing tonight.

**Everything else on your list is unchanged** and none of it is re-argued here: the [encounter batch](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine) still waits on your repair-or-re-roll answer, and the four wayfinder maps still hold ten questions between them. **No rush from this lane on any of it.**

## T1 — unblock sweep

**Promoted: 0. Filed: 0. Declined: standing set, unchanged. Held: 1 (standing).** Board at scan time: **52 `Todo`** (50 page 1 + 2 page 2), **5 `Ready for Dev`**, **2 `In Design`**, **3 `In Dev`** (1 live, 2 `Parked`).

**Zero promotions is a measured result this run, not an unexamined one.** The board has been frozen since the outage, and that is checkable rather than assumed:

```
list_issues(state:"Done", updatedAt:-P3D)
  → newest completion = THR-1416, completedAt 2026-09-04T14:29:17Z
```

**No issue on the team has reached `Done` in the 51 hours since.** A promotion requires a blocker to have cleared, and no blocker has cleared, so the entire standing decline list from [run 2026-09-04g](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-04g.md) carries forward on its own evidence. It is not restated here — that report holds it, and repeating twenty-six declines hourly is what trains a reader to skip this file.

### THR-1303 — held, eighth consecutive run

[THR-1303](https://linear.app/threadbare/issue/THR-1303/delete-control-upkeep-thr-1292-6-gated-on-a-post-cutover-decision-mix) is held on the unchanged reason: its substantive condition is met on the tree, and only [THR-1301](https://linear.app/threadbare/issue/THR-1301/cut-the-unified-decision-board-over-to-live-blocked-on-undertaking)'s **state field** is not `Done`.

Re-verified this run rather than inherited — and by `get_issue`, not the list scan, because `list_issues` can serve a stale `status`:

```
get_issue(THR-1301).status      → "Todo"
get_issue(THR-1301).stateHistory → …In Dev (08-29 05:02Z) → Todo (08-29 05:54Z), open since
```

**Still not promoted, and the blocking relation still not rewritten.** Run f's position stands unreversed: a lane that edits a blocking relation to clear its own promotion is manufacturing its own permission. The arithmetic — eight runs holding one Medium engine ticket on a bookkeeping field — is already an impediment-log row awaiting the weekly retro, per the process-work throttle. **Not re-filed, not re-argued.**

### Time gate — one, still shut

[THR-1256](https://linear.app/threadbare/issue/THR-1256/flip-checkguidance-freshness-from-advisory-to-blocking-after-its-burn) (*"review on/after 2026-09-08"*) opens in **two days**. Declined on the gate, unchanged.

```
[orchestrator] T1 promote: none — no team issue reached Done since THR-1416 @ 2026-09-04T14:29:17Z (51h)
[orchestrator] T1 hold THR-1303: blocker THR-1301 verified Todo via get_issue; 8th consecutive run
[orchestrator] T1 skip THR-1256: time gate opens 2026-09-08, 2 days out
[orchestrator] T1 skip: 23 wayfinder:* items → T1.5, unconditionally
[orchestrator] T1 no writes attempted this run; nothing to verify
```

**Week's product-vs-process ratio.** Zero promotions this run, so the running figure is unmoved: **three promotions and one filing over the week, all product; zero process or infrastructure tickets filed or promoted by this lane.** The headline is unchanged and now has a number behind it — *the shelf is five and draining, and the tier that refills it is barred.* That is a supply problem, and per the throttle the answer is Christian, never another process promotion.

## T1.5 — wayfinder sweep

**Four open maps. Nothing moved, nothing claimed, no AFK burn-down available — ninth consecutive run.**

| Map | Frontier | Composition |
|---|---|---|
| [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) | 7 | 5 `grilling`, 2 `prototype` |
| [Undertakings across the living simulation](https://linear.app/threadbare/issue/THR-1396/undertakings-across-the-living-simulation-wayfinder-map) | 3 | 2 `grilling`, 1 `task` |
| [Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator) | 1 | 1 `prototype` |
| [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft) | 0 | its one child is assigned to Christian |

**Carried on this run's own measurement, not on run g's word.** Every `wayfinder:*` item in this run's `Todo` scan carries an `updatedAt` of 2026-09-03 or earlier; the newest is THR-1396 itself at `2026-09-03T19:32:42.958Z` — byte-identical to the reading in runs c through g. Nothing on any map has moved.

**One relation read was run rather than skipped, on the one ticket that could have changed the answer.** [THR-1403](https://linear.app/threadbare/issue/THR-1403/task-migrate-the-64-retire-the-four-flip-the-model-to-cells) is a `wayfinder:task` — the only label class on any frontier this lane is permitted to burn down — so the AFK count turns on whether it is blocked:

```
get_issue(THR-1403, includeRelations:true).relations.blockedBy
  → [THR-1402 "Prototype — the two-seed census on the cells model"]
```

**Blocked, by a `prototype` ticket that is HITL by construction.** So THR-1403 is not on the frontier, the frontier's only other task ([THR-1405](https://linear.app/threadbare/issue/THR-1405)) had its research half discharged on 2026-09-03 with its code half already queued as [THR-1407](https://linear.app/threadbare/issue/THR-1407) on the dev shelf, and **every remaining frontier ticket across all four maps is `grilling` or `prototype`** — never touched by this lane.

**No claim taken. No Decisions-so-far amended. The ten HITL questions are carried in Christian's briefing under their own links and lose nothing by another quiet hour.**

## T2 — design staging

**Not triggered.** `Ready for Dev` holds **5**, and **all 5 are non-`Deferral`** — against `ORCH_PROGRAM_WORK_FLOOR` of 2.

**And it would have been barred if it had triggered.** `In Design` measured against the shipped `classifyInDesignItem` predicate rather than raw `updatedAt` — both occupants still share the 2026-09-03T07:19:42Z bulk-write stamp, so real-activity dates are the operative ones:

| `In Design` occupant | Assignee | Last real activity | Counts? |
|---|---|---|---|
| [THR-1002](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) | none | 2026-08-19 — **18 days** | **No** — stale-unassigned, excluded |
| [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) | Christian | 2026-08-15 — **22 days** | **Yes** — assigned, a person is waiting |

`ORCH_MAX_IN_DESIGN` is 1; the column reads **1 live**. **Seventh consecutive day the design tier is barred by one assigned item**, now at 22 days. THR-790 is re-surfaced under `## Needs Christian`, **not re-staged** — its 48h re-surface rule.

**No mutation, deliberately.** Excluding an item from a count is not a state change; applying `Parked` is Christian's call and the grooming lane's remit.

**The trigger and the bound are converging, which is worth saying before it happens rather than after.** The shelf fell 7 → 5 in 51 hours with the machine mostly off; at healthy throughput it reaches the floor of 2 within a few working hours, at which point T2 fires and is immediately barred by the row above. That is the whole content of the ask to Christian.

## T3 — architecture health

**Detectors: not re-run — already run today.** [Run a](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-06.md) (11:34Z) ran all four in full: 7 LEAKED contracts (unchanged), 26 canon-staleness warnings (unchanged), `sweep:rank-reach` PASS, `check:process` `passed-with-gaps`. **No detector ran this run and none is reported as clean.** `__DEBUG.validateTraitRefs()` remains browser-only and unmeasured, as always in a headless lane.

**What this run adds is the half run a could not reach.** Its T3 recorded stalled work, the `In Design` split and hand-created `In Dev` as *"all three unmeasurable — Linear unreachable"*. All three are Linear reads, Linear is back, and they are measured here rather than left for tomorrow.

### Stalled work, `In Design`, and hand-created `In Dev` — measured

**Stalled work: none.** `ORCH_STALLED_PICKUP_THRESHOLD` is 3 `Ready for Dev → In Dev` transitions without a `Done`. The only live `In Dev` item is [THR-1417](https://linear.app/threadbare/issue/THR-1417/stepnavigator-renders-list-children-without-keys-react-warns-on-every), and its history is a single clean transition:

```
get_issue(THR-1417).stateHistory
  → Ready for Dev  2026-09-04T06:41:23Z → 2026-09-06T17:15:28Z
  → In Dev         2026-09-06T17:15:28Z → open
```

One claim, 13 minutes old at scan time. Its two days in `Ready for Dev` are the outage, not a stall.

**`In Design`: 1 live, 1 excluded.** `THR-1002` unassigned 18d → excluded; `THR-790` assigned Christian 22d → warned, still counted. Full table under T2. **The `0 live` line is deliberately not printable this run — the column is 1 live, and T2 is bound.**

**Hand-created `In Dev`: none.** All three `In Dev` occupants were checked for a `Ready for Dev` state in their history. THR-1417's is quoted above. THR-1392 and THR-1130 both carry `Parked` and predate the window. **Nothing was moved, and nothing would have been** — the ruling is that this lane reports these and never normalises them.

```
In Design: 1 live, 1 excluded (THR-1002 unassigned 18d → excluded; THR-790 assigned Christian 22d → warned, still counted).
Stalled work: 0 issues at or above 3 claim cycles.
Hand-created In Dev (never in Ready for Dev): none.
```

### Finding 1 (new) — the Linear outage ended on its own; it was a flap, not a revocation

Run a's diagnosis was correct for 11:34Z and is **wrong as a description of the day**. Measured, four points:

| Time (UTC) | Session | Linear tools |
|---|---|---|
| 11:34Z | orchestrator run a | **absent** — 2 `ToolSearch` probes returned no Linear tool |
| ~17:0xZ | `tb-opus-pickup` (worktree `sweet-mendel-638f99`) | **absent** — whole lane no-opped, logged as [#537 recurrence](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/impediments.md) |
| 17:15:28Z | an executor session | **present** — claimed THR-1417, state write landed |
| 17:28Z→ | this run | **present** — 8 board calls, no failure |

**Nobody intervened between 17:0x and 17:15.** Christian was asked at 11:34Z and the ask is still sitting in his briefing unactioned; no reauthorization happened. So the connector **recovered by itself**, which makes this an intermittent fault rather than the lapsed-authorization story both #537 and run a tell.

**Why that distinction is worth a finding rather than a shrug:** the standing remedy on record is *"ask Christian to reauthorize"*, and that remedy was never applied yet the symptom cleared — so it is unfalsified, not confirmed, and the row has now been paid twice on a diagnosis nothing has tested. The durable fix both reports already name (`LINEAR_API_KEY`, still unset — verified in-shell this run) is the one that is **immune to flapping** rather than merely a second way to sign in. That reframing belongs to whoever renews the row.

**Not filed as a ticket.** Per the process-work throttle, scheduled lanes log rather than file; #537 already exists and this is a correction to its diagnosis, not a new defect. It is carried to the weekly retro with the four timestamps above, which is the evidence that row has never had.

### Finding 2 (new) — run a's stranded retro PR merged, 25 minutes after it was flagged

Run a's Finding 2 reported [PR #1822](https://github.com/christianspliid-ui/threadbare/pull/1822) `CONFLICTING`/`DIRTY` with auto-merge armed, holding the weekly retro's five process improvements and impediment #974, and correctly declined to fix it as another lane's branch.

```
gh pr view 1822 → state MERGED, mergedAt 2026-09-06T12:07:13Z, mergeCommit 4ced52a8
gh pr list --state open → []
```

**Merged at 12:07Z. Nothing is stranded, and there are now zero open PRs on the repo.** Recorded so the next sweep does not re-raise a closed finding, and so run a's escalation (*"needs one command from any session with a worktree"*) is visibly discharged rather than left standing.

### Redundancy — not assessed this sweep

**No reachability result is being offered in its place.** The judgement pass belongs to the daily detector sweep, which ran at 11:34Z and did assess it (both standing findings closed, no new candidate). `main` has advanced by two docs commits since; there is no new surface to judge.

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is **Sunday**. Nothing is said about it rather than repeating a stale result.

## Escalations

- **No Discord question posted.** The one item for Christian is a stand-down plus a repeat of a question already in his briefing — neither needs a second channel, and posting would be noise rather than redundancy.
- **THR-790 is the single parked item**, and it is parked on Christian, not on a blocker. Seventh consecutive day. It is the only thing between this lane and a refilled queue.
- **`LINEAR_API_KEY` remains unset**, so `check:process` will keep reporting `passed-with-gaps` with three sub-checks dark — including the one that verifies queued issues carry a coordination block. Consequence of the same root cause, resolves with it, deliberately not filed.
- **Nothing promoted was deferred.** The promotion ceiling never engaged: the shelf is 5, well under the 15 that would throttle it, and there was nothing eligible to promote regardless.
