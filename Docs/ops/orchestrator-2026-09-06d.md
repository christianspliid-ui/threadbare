---
lane: tb-orchestrator
run: 2026-09-06d
promoted: 1
filed: 0
resolved: 0
newFindings: 1
needsChristian: false
---
# Orchestrator — 2026-09-06 (run d, ~23:26–23:35Z)

**A finished, unblocked, fully-prepared ticket was sitting where the machine cannot see it, while the build queue drained to three.** [THR-1423](https://linear.app/threadbare/issue/THR-1423/five-surfaces-still-render-a-raw-tick-count-4-ticks) was filed at 22:33Z by the session that had just shipped [THR-1421](https://linear.app/threadbare/issue/THR-1421/attachmentstab-renders-a-companions-bonus-as-signed-raw-deltas-3-iron) — with a membership predicate, a Done-when, three-pillar scoping, and a coordination block posted 43 seconds later. It did everything right except land in `Todo`, and the executor's pickup query only ever reads `Ready for Dev`. **Promoted this run.**

The rest of the board is the healthiest it has looked all week: **three tickets completed in the hour before this run** (22:28Z, 22:53Z, 23:28Z), and the executor's work slot is now empty with four items waiting.

## Needs Christian

**Nothing new needs you, and nothing from your list is re-argued here.**

The three standing asks are exactly as [run c](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-06c.md) left them four hours ago — [traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) holding the design slot, the [encounter batch](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine) waiting on your repair-or-re-roll answer, and ten map questions across four wayfinder maps. They are carried, not restated — repeating them hourly is what teaches a reader to skip this file.

**The machine had a good night.** It finished three tickets in the last hour and is currently free, with four things queued for it. Nothing is stuck and nothing is waiting on you tonight.

The one thing this run found and fixed is delivery plumbing — a ticket parked one column short of where the machine looks. That is a technical call, mine to make, and it is already made.

## T1 — unblock sweep

**Promoted: 1. Filed: 0. Declined: standing set, unchanged. Held: 1 (standing).** Board at scan: **53 `Todo`** (50 + 3), **3 `Ready for Dev`** before this run's promotion, **2 `In Design`**, **3 `In Dev`** at first read → **2** by the end of the run (see velocity, below).

### Promoted (1) — THR-1423, stranded in `Todo` with a valid coordination block

[THR-1423](https://linear.app/threadbare/issue/THR-1423/five-surfaces-still-render-a-raw-tick-count-4-ticks) — *five surfaces still render a raw tick count* — `Todo` → `Ready for Dev`.

**Every promotion gate checked, not assumed:**

| Gate | Result |
|---|---|
| Blockers | `get_issue(includeRelations:true)` → `blockedBy: []`. No prose gate, no time gate in the description. |
| `wayfinder:*` | Labels are `UI`, `Bug`. Not a wayfinder issue. |
| Wrong destination | Description says explicitly *"The fix is off-the-shelf — this is not a ruling"*. Needs no design pass. |
| Standing retire verdict (THR-990) | Latest comment is the coordination block, not a verdict. Nothing retires it. |
| Plan-doc liveness (THR-921) | Names no plan doc → passes trivially. |
| Promotion ceiling | Shelf 3, far under 15. Ceiling never engaged. |

**The ticket's premise was verified against `origin/main`, not taken on the ticket's word** — the home tree is 9 commits behind, so a working-tree grep would have measured the wrong thing:

```
git grep -n "export function durationLabel" origin/main -- src/engine/aftermathWords.ts
  → origin/main:src/engine/aftermathWords.ts:226        ← the sanctioned fix ships

git grep -n "ticks remaining\|ticksLeft" origin/main -- src/components/
  → AgentInfoCard.tsx:178        `${strengthPct}% strength · ${effect.ticksRemaining} ticks remaining`
  → OmenDetail.tsx:82            {intensity} · {ticksLeft} ticks remaining
  → tabs/AttachmentsTab.tsx:235  {entry.ticksRemaining} ticks remaining
  → tabs/ProwessTab.tsx:157      {entry.ticksRemaining} ticks remaining
  → ReadTheThreadsPanel.tsx:303  {onCooldown ? `Cooldown (${cooldownTicksRemaining} ticks)` : …}
```

All five violations are live on `main` and the helper that fixes four of them is on `main` too. Two details worth recording because they confirm the ticket rather than undermining it: `AttachmentsTab.tsx:94` is now a **doc comment** where THR-1421's fix landed — the companions row really is repaired, exactly as the ticket says — and `DelveProgressPanel.tsx:156` already routes through `getDurationWord`, so the compliant pattern has precedent in the tree. The ticket cites `ReadTheThreadsPanel.tsx:471` (the computation) where the render is at `:303`; its **predicate** is what governs (THR-688 rule A), and the predicate matches.

**Write verified per impediment #48** — re-queried rather than read off the write response:

```
save_issue(THR-1423, state:"Ready for Dev")
get_issue(THR-1423)
  → status "Ready for Dev"
  → stateHistory: Todo (22:33:49Z) → Ready for Dev (23:29:13.997Z)
  → no `assignee` key, no `assigneeId`     ← enters the queue unassigned, as pull-work requires
```

**No coordination block was posted, deliberately — and this is the one place this run departs from the letter of § T1 step 4b.** The rule exists so that `pull-work` Step 3 finds the three required lines on the **latest** comment. That comment already exists: the THR-1421 executor posted a full block at 22:34:36Z carrying `Suggested model` (sonnet for four sites; the fifth split out as a Law 15 ruling), `Parallel-safe with`, `Mutex with` (with its reason stated inline per THR-688 rule B), `Blocked by: nothing`, and the UI-pillar evidence shape. Posting my own would have **displaced it as latest** — substituting a block derived from the description for one written by the party that actually edited those files, which is the precise trade the skill warns against. The gate is satisfied; adding to it would only have made the queue's information worse. Recorded here rather than done silently.

### Held and declined — standing, unchanged

- **[THR-1303](https://linear.app/threadbare/issue/THR-1303/delete-control-upkeep-thr-1292-6-gated-on-a-post-cutover-decision-mix) — held, tenth consecutive run.** Blocker [THR-1301](https://linear.app/threadbare/issue/THR-1301/cut-the-unified-decision-board-over-to-live-blocked-on-undertaking) remains `Todo` in this run's scan. Its substantive condition is met on the tree; only the state field is not `Done`. Still not promoted and the blocking relation still not rewritten — a lane that edits a blocking relation to clear its own promotion is manufacturing its own permission. Ten runs on one bookkeeping field, carried to the weekly retro as an impediment-log row, not re-filed.
- **[THR-1256](https://linear.app/threadbare/issue/THR-1256/flip-checkguidance-freshness-from-advisory-to-blocking-after-its-burn) — time gate opens 2026-09-08.** Two days out. Unchanged.
- **23 `wayfinder:*` items skipped unconditionally** → T1.5's input, never `Ready for Dev`.
- **The remaining standing declines carry on their own recorded evidence** from [run 2026-09-04g](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-04g.md). Nothing reached `Done` that any of them names as a blocker: the three completions this hour (THR-1420, THR-1421, THR-1412) were each searched against the board and **no open issue names any of them as a blocker**.

```
[orchestrator] T1 promote THR-1423: blockedBy [] — queue-ready with a valid coordination block, stranded in Todo → Ready for Dev (project: Encounter Experience)
[orchestrator] T1 promote THR-1423: no block posted — executor's 22:34:36Z block already latest and complete; posting would displace a better-informed one
[orchestrator] T1 hold THR-1303: blocker THR-1301 still Todo; 10th consecutive run
[orchestrator] T1 skip THR-1256: time gate opens 2026-09-08, 2 days out
[orchestrator] T1 skip: 23 wayfinder:* items → T1.5, unconditionally
[orchestrator] T1 ceiling not reached (shelf 3 ≤ 15) — nothing held back
```

**Week's product-vs-process ratio.** This run's promotion is **product** (a UI-pillar conformance bug in game code, Encounter Experience). Running week: four promotions and two filings, **all product; zero process or infrastructure tickets filed or promoted by this lane.**

### Finding — a correctly-authored deferral can still be invisible, and nothing looks

THR-1423 is not an authoring failure. The executor followed the Definition of Done exactly: it filed the deferral, wrote the predicate, and posted the coordination block within a minute. **The gap is that neither CLAUDE.md's deferral rule nor THR-836 says which *state* a session-filed deferral lands in** — THR-836 governs issues filed *into* `Ready for Dev`, and says nothing about one filed into `Todo`. So a ticket can satisfy every authoring rule and still be unreachable by the only query that picks work up.

**Scoped honestly: one occurrence, and the check that bounds it.** Every `Todo` item created in the last 10 days was read (13 items): 8 are `wayfinder:*`, 1 is a `UL-proposal` that travels its own flow, and the remaining 4 ([THR-1393](https://linear.app/threadbare/issue/THR-1393/deferral-the-intelligence-object-type-lands-only-with-its-reader-verb), [THR-1348](https://linear.app/threadbare/issue/THR-1348/ambitions-held-below-the-spotlight-tier-have-no-agency-path-10-of-the), [THR-1381](https://linear.app/threadbare/issue/THR-1381/twilight-authorship-vs-emergence-specify-the-authored-beat-procedural), [THR-1318](https://linear.app/threadbare/issue/THR-1318/lens-overlay-prose-engine-is-authored-tested-and-has-no-caller)) each genuinely await a design or game decision and are correctly *not* on the shelf. **None was in THR-1423's shape.** That check covers 10 days of arrivals, not all 53 `Todo` items — the older ones carry recorded declines from roughly ten prior sweeps and were not re-derived.

**Not filed as a ticket**, per the process-work throttle: this is a scheduled lane, one occurrence, and it clears none of the materiality bars (~40 minutes of queue invisibility, no work lost, nothing corrupted). **Carried to the weekly retro** with the evidence above. The narrow question worth putting to it is cheap and concrete: *should the deferral rule name a destination state, so that "filed with its coordination block" also means "filed where the machine looks"?*

## T1.5 — wayfinder sweep

**Four open maps. Nothing moved, nothing claimed, no AFK burn-down available — eleventh consecutive run.**

| Map | Frontier | Composition |
|---|---|---|
| [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) | 7 | 5 `grilling`, 2 `prototype` |
| [Undertakings across the living simulation](https://linear.app/threadbare/issue/THR-1396/undertakings-across-the-living-simulation-wayfinder-map) | 3 | 2 `grilling`, 1 `task` |
| [Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator) | 1 | 1 `prototype` |
| [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft) | 0 | its one child is assigned to Christian |

**The composition column is inherited from run b's per-child relation reads, and inherited on a re-measured no-movement premise rather than on trust.** Every `wayfinder:*` item in this run's `Todo` scan carries an `updatedAt` of 2026-09-03 or earlier — newest is THR-1396 itself at `2026-09-03T19:32:42.958Z`, byte-identical to the reading in runs c through i. Nothing on any map has moved in four days.

The disposition is unchanged and unchangeable by this lane: the only two `wayfinder:task` items on any frontier are [THR-1405](https://linear.app/threadbare/issue/THR-1405/task-join-the-catalogue-to-the-systems-inventory-owningsystem-values) (research half discharged 2026-09-03, code half already queued as [THR-1407](https://linear.app/threadbare/issue/THR-1407/every-owningsystem-resolves-to-a-registry-subsystem-name-recase-remap) on the dev shelf) and [THR-1403](https://linear.app/threadbare/issue/THR-1403/task-migrate-the-64-retire-the-four-flip-the-model-to-cells), blocked by [THR-1402](https://linear.app/threadbare/issue/THR-1402/prototype-the-two-seed-census-on-the-cells-model-which-callings), a `prototype` that is HITL by construction. **Every remaining frontier ticket across all four maps is `grilling` or `prototype`** — never touched by this lane.

**No claim taken. No Decisions-so-far amended.** The ten HITL questions are in Christian's briefing under their own links and lose nothing by another quiet hour.

## T2 — design staging

**Not triggered.** `Ready for Dev` holds **4** after this run's promotion (3 at scan), and **all four are non-`Deferral`** — against `ORCH_PROGRAM_WORK_FLOOR` of 2.

**And it would still have been barred.** `In Design` measured against the shipped `classifyInDesignItem` predicate rather than raw `updatedAt` — both occupants share the 2026-09-03T07:19:42Z bulk-write stamp, so real-activity dates are the operative ones:

| `In Design` occupant | Assignee | Last real activity | Counts? |
|---|---|---|---|
| [THR-1002](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) | none | 2026-08-19 — **19 days** | **No** — stale-unassigned, excluded |
| [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) | Christian | 2026-08-15 — **23 days** | **Yes** — assigned, a person is waiting |

`ORCH_MAX_IN_DESIGN` is 1; the column reads **1 live**. Eighth consecutive day barred by one assigned item. THR-790 is **not** re-surfaced this run — run b surfaced it six hours ago and the 48h re-surface rule is not an hourly licence.

**No mutation, deliberately.** Excluding an item from a count is not a state change; applying `Parked` is Christian's call and the grooming lane's remit.

**One measurement recorded for the next run, without the prediction run c had to retract.** The executor completed **three** tickets between 22:28Z and 23:28Z — roughly triple its usual rate — and its work slot is now empty (`In Dev` holds only THR-1392 and THR-1130, both `Parked`). Four items are queued. At tonight's burst rate that is a little over an hour of runway; at the usual ~1/hour it is four. **No conclusion is drawn from that** — run c predicted a collision that its own board then overtook, and one hour is not a rate. The number is here so the next run can compare rather than re-derive.

## T3 — architecture health

**Detectors: not due, and none is claimed as run.** The daily sweep fires on the first run after `ORCH_HEALTH_SWEEP_HOUR` (06:00 local); local time at this run is **~01:30**, so the window for local day 2026-09-07 has not opened. [Run a](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-06.md) (11:34Z) ran all four in full for the 09-06 window: 7 LEAKED contracts, 26 canon-staleness warnings, `sweep:rank-reach` `PASS`, `check:process` `passed-with-gaps` with three Linear-backed sub-checks dark. `__DEBUG.validateTraitRefs()` remains browser-only and unmeasured, as always in a headless lane.

**Note for the next run: the weekly test-suite health pass is now due.** `ORCH_TESTHEALTH_DOW` is Monday and the local day has just turned Monday 2026-09-07. The first run after 06:00 local owes it — the last pass predates this week.

**Redundancy: not assessed this sweep.** No judgement pass over the interface map or systems inventory was run; `main` advanced by the three merges of this hour, which is exactly when such a pass would be worth doing, and this run spent its budget on the T1 promotion instead. Stated plainly rather than implied, and no reachability result is offered in its place.

### Stalled work, `In Design`, and hand-created `In Dev` — measured

**Hand-created `In Dev`: none.** The one issue that entered `In Dev` since run c was checked rather than assumed — [THR-1412](https://linear.app/threadbare/issue/THR-1412/debug-tooling-dead-ends-found-by-the-pixel-sweep-37-of-43-debug-panel) appeared in this run's first `In Dev` read and was `Done` by the second:

```
get_issue(THR-1412).stateHistory
  → Ready for Dev  2026-09-04T06:40:22Z → 2026-09-06T23:01:56Z
  → In Dev         2026-09-06T23:01:56Z → 2026-09-06T23:28:08Z
  → Done           2026-09-06T23:28:08Z   (PR #1831)
```

**It passed through `Ready for Dev` and was claimed normally.** One clean transition, shipped inside 27 minutes. Not hand-created, not stalled, and not moved.

**Stalled work: none.** `ORCH_STALLED_PICKUP_THRESHOLD` is 3 `Ready for Dev → In Dev` transitions without a `Done`. THR-1412 was at 1 and is now `Done`; THR-1392 and THR-1130 both carry `Parked` and predate the window.

```
In Design: 1 live, 1 excluded (THR-1002 unassigned 19d → excluded; THR-790 assigned Christian 23d → warned, still counted).
Stalled work: 0 issues at or above 3 claim cycles.
Hand-created In Dev (never in Ready for Dev): none — THR-1412 checked, passed through Ready for Dev 09-04T06:40Z.
Live In Dev: 0 — both occupants Parked; the executor's WIP slot is free with 4 items queued.
```

## Escalations

- **No Discord question posted.** Nothing this run needs a decision from Christian, and the standing asks are already in his briefing — a second channel would be noise, not redundancy.
- **THR-790 remains the single parked item**, parked on Christian rather than on a blocker, eighth consecutive day. Not re-surfaced this run by the 48h rule.
- **The `Todo`-stranding gap is carried to the weekly retro, not filed** (process throttle: scheduled lanes log, the retro promotes).
- **`LINEAR_API_KEY` remains unset**, so `check:process` keeps reporting `passed-with-gaps` with three sub-checks dark — including the one that verifies queued issues carry a coordination block. Had it been wired, it would not have caught THR-1423 anyway: that ticket's block was present and valid; only its column was wrong. Unchanged from run c, deliberately not filed.
- **Nothing promoted was deferred.** The promotion ceiling never engaged — the shelf is 4, well under the 15 that would throttle it.
