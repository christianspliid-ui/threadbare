---
lane: tb-orchestrator
run: 2026-09-07e
promoted: 0
filed: 0
resolved: 1
newFindings: 2
needsChristian: true
---
# Orchestrator — 2026-09-07 (run e, ~04:27–04:50Z)

**The daily architecture sweep and the Monday test-suite pass both landed on this run**, being the first after 06:00 local. All four detectors ran in full and unpiped; the weekly test-suite health file is published alongside this report.

The substantive board action was closing a map step: **the undertakings map's third generated view is live**, which was the last thing [THR-1405](https://linear.app/threadbare/issue/THR-1405/task-join-the-catalogue-to-the-systems-inventory-owningsystem-values) was holding open.

## Needs Christian

**Good news first, and it is the kind you asked for — a map got shorter without you.**

The undertakings map now has all three of its promised views generated rather than hand-drawn. The last one — *which of the world's systems a mortal's own work actually reaches* — shipped overnight and can no longer quietly fall behind the code. It says: **27 systems, 9 that mortal work reaches through something live, 1 reached only by work we have decided on but not built, and 17 that nothing a mortal does touches at all.**

**That last number matters to a question already waiting for you.** The hand-drawn version of this table said 14 untouched, and you were going to split those into *"untouched on purpose"* and *"that's a gap"*. The machine-made one says 17. So three systems have never been looked at in that light, and the by-design/gap split should be re-done against the new list rather than carried over. The question itself is unchanged and still yours: [Which systems mortals never move by their own work](https://linear.app/threadbare/issue/THR-1401/the-untouched-by-design-list-which-systems-mortals-never-move-by-their). Nothing is blocked on it.

**The standing ask is unchanged, and it is the only one that is actually costing anything.** The build queue is down to **one** item. Normally that is my cue to take the next agreed thing and set it up for a design session — but I am not allowed to hold more than one item in design at a time, and **two are already sitting there waiting on you**:

- [Traits wave 2 — locations, artifacts, and draw-by-trait pools](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) — waiting **23 days**, assigned to you. The only technical thing it was ever waiting on finished on 26 July. The open question is simply whether you mean to run that design pass yourself; if not, unassigning it frees it for a design session.
- [Unify the card grammar — action cards adopt the encounter-card vocabulary](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card-vocabulary) — waiting **19 days**, unassigned. This one is your own 2026-08-06 direction (*"the action cards are too verbose and their actual action in the game is very hard to understand"*), already worked up to the point where a design session could start on it cold.

**One attended design session on either would restart the supply.** This is the fourth consecutive run reporting it, and it is now the binding constraint rather than a background note.

**The wayfinder questions are unchanged and are not restated.** Four maps are open; every remaining frontier ticket on all four is one for you rather than for an agent, and they are listed in the last few briefings.

## T1 — unblock sweep

**Promoted: 0. Filed: 0. Declined: 10 (all standing). Held: 0 — the ceiling never engaged.**

Board at scan: **54 `Todo`** (50 + 4), **1 `Ready for Dev`**, **2 `In Dev`** — both `Parked`, so **zero live** and the executor's WIP=1 slot is free.

**No new `Todo` candidate has appeared since [run d](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-07d.md)** — the two `Todo` items with a newer timestamp (THR-1405, THR-1401) moved because run d and this run commented on them, not because anything arrived. So every decline is standing, with its evidence in runs a–d, and none is re-derived here:

| Issue | Reason |
|---|---|
| [THR-1424](https://linear.app/threadbare/issue/THR-1424/two-player-facing-percentages-have-no-sanctioned-reading-strengthpct) · [THR-1426](https://linear.app/threadbare/issue/THR-1426/tick-timestamps-and-per-tick-rates-are-the-two-tick-shapes-with-no) | Creative ruling — Christian's |
| [THR-1222](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine) | Unmet approval gate (the 2026-09-04 batch brief) |
| [THR-1287](https://linear.app/threadbare/issue/THR-1287/control-upkeep-is-structurally-impossible-nothing-ever-resets) · [THR-1195](https://linear.app/threadbare/issue/THR-1195/hexsend-heralds-divine-herald-has-no-actortype-so-it-is-located-but) · [THR-1114](https://linear.app/threadbare/issue/THR-1114/two-action-templates-carry-a-sphereaffinity-that-is-not-a-sphere) · [THR-1274](https://linear.app/threadbare/issue/THR-1274/no-non-human-cast-primitive-a-beast-cannot-be-a-bound-scene-actor) · [THR-1348](https://linear.app/threadbare/issue/THR-1348/ambitions-held-below-the-spotlight-tier-have-no-agency-path-10-of-the) · [THR-1134](https://linear.app/threadbare/issue/THR-1134/shareable-game-state-snapshot-one-button-incident-bundle-that-works-in) | Wrong destination — design first; T2's input, not T1's |
| [THR-1024](https://linear.app/threadbare/issue/THR-1024/detailmodal-forks-its-own-overlay-instead-of-composing-modal-no) | Sequencing gate — *"do not start this before THR-966"*, and THR-966 is `Idea` |
| [THR-1256](https://linear.app/threadbare/issue/THR-1256/flip-checkguidance-freshness-from-advisory-to-blocking-after-its-burn) | Unmet time gate — **the window opens tomorrow, 2026-09-08.** The first run after 00:00Z may promote it |
| [THR-1133](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server) | Unblocked but unclaimable by an unattended lane, on its own instruction |

**Wayfinder issues skipped unconditionally**, whatever their blockers say: 21 of the 54 `Todo` items carry a `wayfinder:*` label and are T1.5's input, never T1's.

### One observation about the shelf, not a decline

[THR-1422](https://linear.app/threadbare/issue/THR-1422/six-constants-are-defined-twice-with-no-shared-source-sea-level) is now the entire build queue and has sat unclaimed for **9 hours** — `Ready for Dev` since 2026-09-06 19:29Z, `stateHistory` a single unbroken entry, never claimed once.

**That is correct behaviour, not a stall, and it is worth writing down so it is not mistaken for one.** It carries `No priority`; [THR-1427](https://linear.app/threadbare/issue/THR-1427/the-undertaking-grid-emits-no-subsystem-verb-view-the-join-thr-1407) was filed at 03:31Z at `Medium`, and the 04:01Z executor run sorted by priority and correctly took the higher one — shipping it by 04:25Z, **54 minutes filed-to-merged**. THR-1422 is now alone and is the next pickup by construction. No priority was set on it by this lane; the rule against a second ordering mechanism holds.

## T1.5 — wayfinder sweep

**Four open maps. AFK tickets resolved: 1. HITL frontier surfaced: unchanged.**

| Map | Frontier | Disposition |
|---|---|---|
| [THR-1396](https://linear.app/threadbare/issue/THR-1396/undertakings-across-the-living-simulation-wayfinder-map) — Undertakings | 6 open → **5** | **1 AFK task resolved and closed** (below); 3 grilling + 2 prototype remain, all HITL |
| [THR-1258](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) — Physical Conflict | 9 | all `grilling` / `prototype` — HITL, untouched by rule |
| [THR-1226](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft) — Powers & Spellcraft | 1 | `prototype` — HITL |
| [THR-1227](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator) — Item Generator | 1 | `prototype` — HITL |

[THR-1403](https://linear.app/threadbare/issue/THR-1403/task-migrate-the-64-retire-the-four-flip-the-model-to-cells) remains off the frontier — re-checked via `get_issue(includeRelations:true)`, native `blockedBy: THR-1402`, a prototype still `Todo`. **Budget used: 1 of `ORCH_WAYFINDER_AFK_MAX` (2); the second slot had no eligible ticket, not an unspent choice.**

### THR-1405 resolved and closed — the deliverable caught up with its proxy

Run d found this ticket in an unusual state and deliberately did **not** close it: its stated closing condition (*"stays open as the map-side tracker until THR-1407 lands"*) had been met, while its actual deliverable (4) — the subsystem × verb view — had shipped with nothing. Run d filed the code half as THR-1427 rather than closing on the proxy.

**THR-1427 merged at 04:25Z** ([PR #1836](https://github.com/christianspliid-ui/threadbare/pull/1836), commit `51427637`), so all four deliverables now exist. Verified by reading `origin/main` at `c798bc91`, not by inferring from ticket state:

```
scripts/generate-undertaking-grid.ts:100   // ─── The subsystem × verb view (THR-1427) ───
scripts/generate-undertaking-grid.ts:41    import { SUBSYSTEMS, SUBSYSTEM_NAMES } from './subsystems-registry.ts'
scripts/generate-undertaking-grid.ts:154   problems.push(`${r.subsystem}: LIVE-TOUCHED but has no SUBSYSTEM_READERS entry …`)
Docs/canon/undertaking-grid.generated.md:46   ## Subsystems × verbs
src/data/__tests__/worldObjects.test.ts:142   it('names an owningSystem that is a registry subsystem', …)
```

Claimed (the sanctioned `wayfinder:*` exception to never-assign), resolution comment posted with the evidence table, closed, and **verified on a `get_issue` re-query**: `status: Done`, `completedAt: 2026-09-07T04:30:36Z`. The map's *Decisions so far* carries the gist.

### The finding inside it: the generated view disagrees with the hand-drawn one

THR-1400's research table read **26 subsystems — 11 live-touched, 1 open-only, 14 untouched (9 by design, 5 gap)**. The generator reads **27 — 9 LIVE-TOUCHED, 1 OPEN-ONLY, 17 UNTOUCHED**.

One row of the gap is the registry row THR-1407 added (26 → 27). The rest is the hand pass counting a subsystem as reached by live work where the mechanical join does not. **The generated one is the one that cannot drift, so it wins** — and the consequence is that THR-1401's by-design/gap split was drawn against a list that is three rows short. Recorded on the map so that ticket is answered against the right list; **not answered here**, by THR-1427's own caveat 2 and because it is Christian's call.

## T2 — design staging

**Triggered, and barred. Nothing was staged and nothing was mutated.**

- **Shelf: 1 non-`Deferral` item** in `Ready for Dev` (THR-1422), against `ORCH_PROGRAM_WORK_FLOOR` of 2. The trigger is *fewer than* 2, so this tier armed for the first time in several runs.
- **`In Design` bound: `ORCH_MAX_IN_DESIGN` is 1 and the executable predicate counts 2 as live.** Staging is barred.

```
In Design: 2 live, 0 excluded (THR-790 assigned Christian, last activity 2026-09-03 → 4d by the shipped
  predicate / 23d since entering the column; THR-1002 unassigned, last activity 2026-09-03 → 4d by the
  predicate / 19d since entering the column). Neither carries `Parked`. Nothing warned, nothing mutated.
Stalled work: 0 issues at or above 3 claim cycles.
Hand-created In Dev (never in Ready for Dev): none — both In Dev occupants carry `Parked` and have real histories.
```

**Those two age figures disagree with each other, and that disagreement is finding 1 below.**

## T3 — architecture health

**Due and run in full.** Baseline for the diff is [`orchestrator-2026-09-06.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-06.md) (run a, 11:34Z), the last sweep that actually executed detectors. **All four completed. None was piped, and none is reported from a truncated read.**

| Detector | Result (real exit code, unpiped) | vs. 2026-09-06 run a |
|---|---|---|
| `generate-interface-map:dry` | **7 LEAKED**, 101 contracts (72 LIVE, 2 PARTIAL, 20 UNVERIFIED-OK), exit 0 | **Unchanged** — same seven, same total |
| `check:canon-staleness` | **26 warnings**, exit 0 | **Unchanged** — same count |
| `sweep:rank-reach` | **`PASS`** — 60 reachable, 0 blocked, 0 unowned; 16 apex holders at tick 900 | **Unchanged**, verdict and figures |
| `check:process` | exit 0, **`passed-with-gaps`** — 3 Linear-backed sub-checks dark (`LINEAR_API_KEY` unset) | **Unchanged** — still the 09-06 finding, not a new one |

The seven LEAKED contracts are the same seven, each carrying its remediation ticket: `attachment-activated-effects` · `attachment-edge-modifiers` · `branch-decision-writes-archetype-drift` · `compulsion-card-plants-agent-decision-bias` · `nudge-card-cost-channels-detection-and-doom` · `trait-ref-authoring-vocabulary` · `undertow-card-drifts-mortal-values`.

**`__DEBUG.validateTraitRefs()` is browser-only and cannot run headless. Not run, and not reported as clean.**

**Redundancy: not assessed this sweep.** The judgement budget went to the `In Design` predicate below and to the weekly test-suite pass. Saying so rather than implying coverage — the standing redundancy ticket from the 09-01 pass ([THR-1422](https://linear.app/threadbare/issue/THR-1422/six-constants-are-defined-twice-with-no-shared-source-sea-level)) is still on the shelf and unclaimed.

**A method correction worth recording, because it nearly became a false clean.** Three of the four detectors were first run piped through `tail`, which both truncated the output and returned `tail`'s exit code rather than the detector's — the exact trap CLAUDE.md § Known Sandbox Limitations names for `npm test`. The truncated read showed **1 LEAKED** where the full output shows **7**, and hid `check:process`'s `passed-with-gaps` verdict entirely. All four were re-run unpiped before anything above was written. **Every figure in the table is from a complete, unpiped run.**

### Finding 1 (new) — the `In Design` staleness exclusion is unreachable for exactly the items it was written for

`ORCH_IN_DESIGN_STALE_DAYS` exists so that a dead, unassigned `In Design` item stops barring T2 (THR-1382). It is not working, and the mechanism is a loop.

**The shipped predicate reads comment timestamps as activity**:

```
scripts/stale-claim-sweep/index.ts:327  export function lastInDesignActivityMs(issue) {
                                   330    for (const c of issue.comments.nodes) stamps.push(new Date(c.createdAt).getTime());
                                   332    if (h.toState !== null) stamps.push(new Date(h.createdAt).getTime());
                                   336    return Math.max(...stamps);
scripts/stale-claim-sweep/index.ts:363  const lastActivity = lastInDesignActivityMs(issue) ?? new Date(issue.updatedAt).getTime();
                                   366  const isStale = ageDays > ORCH_IN_DESIGN_STALE_DAYS;
                                   378  if (issue.assignee === null) return { countsAgainstBound: false, … 'stale-unassigned' };
```

**And the only two things that comment on a stale `In Design` item are warn-only sweeps.** THR-1002 entered the column 2026-08-19. It was warned at 14 days by the stale-claim sweep on 09-02, and commented on again by `daily-backlog-grooming` on 09-03. Both comments changed no state, no assignee and no label — and both reset the clock the predicate reads. As of now it measures **4 days**, so it classifies `live` and counts against the bound. The grooming comment's own text says *"past 7 days an unassigned In Design item stops counting against `ORCH_MAX_IN_DESIGN`, so this is not barring the orchestrator's staging either way"* — **writing that sentence is what made it false.**

The general shape: a warn-only guard whose warning is a comment, over a predicate that counts comments as activity, can never escalate. It warns at day 8, resets to 0, warns at day 8 again, forever. The `stale-unassigned` arm is reachable only in the single run between a comment and the sweep — which is why no run has ever exercised it.

**Second half: the run reports and the executable predicate have been disagreeing, and nobody noticed because the answer did not change.** [Run 09-06b](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-06b.md) reported `In Design: 1 live, 1 excluded (THR-1002 unassigned 18d → excluded)`. 18 days is measured from entry into the column; the shipped function would have said 3 days and `live`. The reported exclusion never happened. It was invisible because `ORCH_MAX_IN_DESIGN` is 1 and the column held 2 either way — **T2 was barred on both readings, so a wrong count produced a right decision.** The skill's own rule settles which is authoritative: *"when this prose and that function disagree, the function is what actually ran."* This report uses the function, and prints both figures side by side above so the gap is legible rather than papered over.

**Not filed as a ticket**, per the process-work throttle — scheduled lanes log and the weekly retro promotes. The honest cost/benefit, since a ticket will want one: *costs roughly one executor run to fix (exclude the lane's own bot comments from the activity signal, or measure from column entry); not fixing costs nothing this week, because the bound is genuinely correct right now — two real design items are genuinely waiting on Christian, and staging a third would not help.* That is below the materiality bar, and it is why this is a log row rather than a ticket. It becomes material the moment one of those two items clears.

### Finding 2 (new) — the dead-coverage method cannot see a dynamic import

Detail and evidence in [`test-suite-health-2026-09-07.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-09-07.md), published with this report. In short: `src/engine/worldRefResolver.ts` was flagged as having zero production importers, and it is imported twice by `src/debug-bridge.ts` via `await import()` — an entry point on this duty's own list. A prune proposed on that flag would have deleted live code behind two debug levers. Added as the fifth standing trap.

### Weekly test-suite health (Monday, `ORCH_TESTHEALTH_DOW`)

Ran; the last pass was **2026-08-24**, so 2026-08-31's was missed and every comparison is a fortnight. **1182 files, 19516 tests, all passing.** Growth: +126 files, +2225 tests.

**Dead-coverage candidates 5 (1 genuine, 4 method limits) · slow files top 10 reported · duplicated coverage not re-derived · tickets filed 0.** Two figures worth carrying up: the top 10 now hold **56.4%** of summed suite time, **down from 65.6%** — the tail is thickening faster than the head, reversing three passes of trend; and `premonitionGateChain.test.ts` costs **41.1s for a single test**, 7.5% of the suite. Full detail, including the one genuine prune candidate (`src/data/terrain-overlays.ts` — a definitions table whose only importer is the test asserting on it), in the linked file.

### Product vs process — the week

Of the **~30 issues completed since 2026-08-31**, roughly **24 product / 6 process (~80% product)** — consistent with run a's ~77% measured a day earlier. The process six are all delivery-machine work that paid for itself: the heavy-test lane split (THR-1384), the import-time and engine-cost guards (THR-1386, THR-1385), the pathfinding fix (THR-1389), the debug-tooling sweep (THR-1412), and the Vite worktree-watch fix (THR-1415).

**No process ticket was promoted or filed this run.** The product pipeline is supplying itself; the headline is *design capacity*, not more tidying.

## Escalations

**Nothing escalated to Discord this run, and nothing is parked.** Agreed work is not exhausted — the constraint is the `In Design` bound, which is a bound this lane must respect rather than a question it needs answered. The one thing that would move it is an attended design session on THR-790 or THR-1002, and that is carried in `## Needs Christian` above rather than as a Discord question, which is where it belongs.

**Two items deliberately not acted on**, recorded so the restraint is visible rather than looking like an omission:

- **The `In Design` items were not mutated.** Finding 1 shows the bound is barring T2 on a predicate that cannot work — but applying `Parked` or demoting to `Todo` is the grooming lane's remit and Christian's call, and this tier is warn-only in that column by rule.
- **THR-1401 was not answered.** The generated view makes its question measurable and moves its answer from 14 untouched systems to 17. Splitting those into by-design and gap is a design judgement, explicitly Christian's, and THR-1427's own caveat forbids shipping a plausible-sounding reason as data.
