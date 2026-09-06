---
lane: tb-orchestrator
run: 2026-09-06c
promoted: 0
filed: 1
resolved: 0
newFindings: 1
needsChristian: false
---
# Orchestrator — 2026-09-06 (run c, ~19:11–19:40Z)

**The board is healthy and moving on its own — the substance of this run is a five-day-old hole in this lane's own published record.** The executor shipped one ticket and claimed another in the two hours since [run b](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-06b.md), nothing unblocked anything, and T1 correctly promoted nothing. What it did find is that **one orchestrator run — 2026-09-01, ~17:47Z — wrote a full report and never published it.** Its architecture findings sat in an untracked local file for five days. They are recovered, re-verified against today's tree, filed as [THR-1422](https://linear.app/threadbare/issue/THR-1422/six-constants-are-defined-twice-with-no-shared-source-sea-level), and the lost report itself is published to `ops` alongside this one.

## Needs Christian

**Nothing new needs you, and nothing from your list is re-argued here.**

The three standing asks are exactly as [run b](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-06b.md) left them two hours ago — [traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) holding the design slot, the [encounter batch](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine) waiting on your repair-or-re-roll answer, and ten map questions across four wayfinder maps. Repeating them hourly is what teaches a reader to skip this file, so they are carried, not restated.

**One thing is quietly better than run b reported.** The build queue is no longer draining unopposed: the machine finished one item and started another while this run was scanning, and this run added a fifth. The shelf is back to five. The design-slot question is still worth your one word when you get to it, but it is no longer on a clock this evening.

The lost-report defect below is delivery machinery — a technical call, mine to make and fix, and it needs nothing from you.

## T1 — unblock sweep

**Promoted: 0. Filed: 1. Declined: standing set, unchanged. Held: 1 (standing).** Board at scan: **52 `Todo`** (50 + 2), **4 `Ready for Dev`** before this run's filing, **2 `In Design`**, **3 `In Dev`** (1 live, 2 `Parked`).

**Zero promotions is measured, not assumed.** Exactly one issue on the team has reached `Done` since run b's sweep:

```
list_issues(state:"Done", updatedAt:-P3D)
  → THR-1417 completedAt 2026-09-06T17:41:36Z   (the only completion since THR-1416 @ 09-04T14:29Z)

list_issues(query:"THR-1417")
  → 1 result: THR-1417 itself. No issue on the board names it as a blocker.
```

A promotion requires a blocker to have cleared. The one blocker-shaped event since run b clears nothing, so the whole standing decline list from [run 2026-09-04g](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-04g.md) carries forward on its own evidence and is not restated.

### Filed (1) — THR-1422, recovered from the lost 09-01 report

[THR-1422](https://linear.app/threadbare/issue/THR-1422/six-constants-are-defined-twice-with-no-shared-source-sea-level) — *six constants defined twice with no shared source* — filed straight into `Ready for Dev`. This is the redundancy finding the 2026-09-01 run made and could not deliver (see T3). **Every claim was re-verified against `origin/main` today before filing; nothing rides on the lost report's word.**

Load-bearing case, verified this run:

```
src/components/HexMapV2/palette/waterPalette.ts:31   export const SEA_LEVEL = 0.38;   ← renderer
src/engine/worldgen/constants.ts:115                 export const SEA_LEVEL = 0.38;   ← worldgen
```

Neither imports the other, and the two doc-comments citing `terrain.ts ELEV.SEA_LEVEL` name a key that **does not exist** — `ELEV` (`src/engine/terrain.ts:7`) holds `DEEP_OCEAN`/`SHALLOWS`/`LAKE_MAX`/`LOWLAND`/`MID`/`HIGHLAND`/`HIGH_MOUNTAINS` and nothing else. Also verified duplicated: the trust triple (`agent-behavior-constants.ts:292/296/300` vs `types/disposition.ts:124/127/130`) and both `REACH_TO_SPHERE` and `SPHERE_COLORS` (`components/icons/constants.ts` vs `data/premonition-constants.ts`).

**Judged product, not process, so the throttle does not bar it.** It is an Engine-pillar NFP #1 (Tunability) defect in game code, not delivery machinery — and it is the same class as [THR-1409](https://linear.app/threadbare/issue/THR-1409/three-worldgen-constants-are-declared-twice-with-different-values-the), which was filed, accepted and shipped on 2026-09-04. THR-1409 covered the worldgen cluster; this is the remainder of the same probe.

**Filed by the three-write sequence (THR-845), verified the way that ticket requires:**

```
save_issue(create) → THR-1422            # Linear's create path defaults assignee to the API actor
save_issue(THR-1422, assignee:null)      # the separate update is the one that works
get_issue(THR-1422)  → no `assignee` key, no `assigneeId`; state "Ready for Dev"
```

Absence of the key is read off the **re-query**, not the create response — the distinction that made the THR-859 run's "verified null" wrong. [Coordination block posted](https://linear.app/threadbare/issue/THR-1422/six-constants-are-defined-twice-with-no-shared-source-sea-level) as the only, therefore latest, comment: `Suggested model` Opus (advisory), `Parallel-safe with` all five other live items, `Mutex with: nothing` — derived by listing this ticket's seven touched files against every other queued ticket's scope, not assumed.

### Held and declined — standing, re-verified where it mattered

**[THR-1303](https://linear.app/threadbare/issue/THR-1303/delete-control-upkeep-thr-1292-6-gated-on-a-post-cutover-decision-mix) — held, ninth consecutive run.** Re-verified by `get_issue` rather than inherited or read off the list scan, which can serve a stale `status`:

```
get_issue(THR-1301).status       → "Todo"
get_issue(THR-1301).stateHistory → …In Dev (08-29 05:02Z) → Todo (08-29 05:54Z), open since
```

Its substantive condition is met on the tree; only THR-1301's **state field** is not `Done`. **Still not promoted, and the blocking relation still not rewritten** — a lane that edits a blocking relation to clear its own promotion is manufacturing its own permission. Nine runs on one bookkeeping field is already an impediment-log row awaiting the weekly retro. Not re-filed, not re-argued.

**[THR-1256](https://linear.app/threadbare/issue/THR-1256/flip-checkguidance-freshness-from-advisory-to-blocking-after-its-burn) — time gate, opens 2026-09-08.** Two days out. Declined, unchanged.

**23 `wayfinder:*` items skipped unconditionally** → T1.5's input, never `Ready for Dev`.

```
[orchestrator] T1 promote: none — only THR-1417 reached Done since run b, and no issue names it as a blocker
[orchestrator] T1 file THR-1422: redundancy finding recovered from the unpublished 2026-09-01 report, re-verified on origin/main → Ready for Dev (project: Repo Health)
[orchestrator] T1 hold THR-1303: blocker THR-1301 verified Todo via get_issue; 9th consecutive run
[orchestrator] T1 skip THR-1256: time gate opens 2026-09-08, 2 days out
[orchestrator] T1 skip: 23 wayfinder:* items → T1.5, unconditionally
[orchestrator] T1 ceiling not reached (shelf 4 ≤ 15) — nothing held back
```

**Week's product-vs-process ratio.** This run's one filing is **product** (Engine defect in game code). Running week: three promotions and two filings, **all product; zero process or infrastructure tickets filed or promoted by this lane.** The headline is no longer "the shelf is draining" — it is five and the executor is working through it at roughly one an hour.

## T1.5 — wayfinder sweep

**Four open maps. Nothing moved, nothing claimed, no AFK burn-down available — tenth consecutive run.**

| Map | Frontier | Composition |
|---|---|---|
| [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) | 7 | 5 `grilling`, 2 `prototype` |
| [Undertakings across the living simulation](https://linear.app/threadbare/issue/THR-1396/undertakings-across-the-living-simulation-wayfinder-map) | 3 | 2 `grilling`, 1 `task` |
| [Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator) | 1 | 1 `prototype` |
| [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft) | 0 | its one child is assigned to Christian |

**Carried on this run's own measurement of movement, and the frontier figures on run b's relation reads.** Every `wayfinder:*` item in this run's `Todo` scan carries an `updatedAt` of 2026-09-03 or earlier — newest is THR-1396 itself at `2026-09-03T19:32:42.958Z`, byte-identical to the reading in runs c through h. Nothing on any map has moved, so run b's per-child `includeRelations` reads (two hours old) still describe the board. **Said plainly rather than implied: the composition column is inherited, and it is inherited on a verified no-movement premise, not on trust.**

The disposition is unchanged and unchangeable by this lane: the only two `wayfinder:task` items on any frontier are [THR-1405](https://linear.app/threadbare/issue/THR-1405) (research half discharged 2026-09-03, code half already queued as [THR-1407](https://linear.app/threadbare/issue/THR-1407) on the dev shelf) and [THR-1403](https://linear.app/threadbare/issue/THR-1403/task-migrate-the-64-retire-the-four-flip-the-model-to-cells), blocked by [THR-1402](https://linear.app/threadbare/issue/THR-1402), a `prototype` that is HITL by construction. **Every remaining frontier ticket across all four maps is `grilling` or `prototype`** — never touched by this lane.

**No claim taken. No Decisions-so-far amended.** The ten HITL questions are in Christian's briefing under their own links and lose nothing by another quiet hour.

## T2 — design staging

**Not triggered.** `Ready for Dev` holds **5** after this run's filing (4 at scan), and **all five are non-`Deferral`** — against `ORCH_PROGRAM_WORK_FLOOR` of 2.

**And it would still have been barred.** `In Design` measured against the shipped `classifyInDesignItem` predicate rather than raw `updatedAt` — both occupants share the 2026-09-03T07:19:42Z bulk-write stamp, so real-activity dates are the operative ones:

| `In Design` occupant | Assignee | Last real activity | Counts? |
|---|---|---|---|
| [THR-1002](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) | none | 2026-08-19 — **18 days** | **No** — stale-unassigned, excluded |
| [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) | Christian | 2026-08-15 — **22 days** | **Yes** — assigned, a person is waiting |

`ORCH_MAX_IN_DESIGN` is 1; the column reads **1 live**. Seventh consecutive day barred by one assigned item. THR-790 is **not** re-surfaced this run — run b surfaced it two hours ago and the 48h re-surface rule is not an hourly licence.

**No mutation, deliberately.** Excluding an item from a count is not a state change; applying `Parked` is Christian's call and the grooming lane's remit.

**Run b's convergence warning is discharged, not carried.** It predicted the shelf reaching the floor of 2 "within a few working hours", at which point T2 would fire into a bound column. The shelf went **5 → 4 → 5** instead: the executor closed THR-1417, claimed THR-1420, and this run filed THR-1422. The collision is not imminent tonight. Recorded so the next run does not re-raise a prediction its own board has overtaken.

## T3 — architecture health

**Detectors: not re-run — already run today, and not reported as clean.** [Run a](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-06.md) (11:34Z) ran all four in full: 7 LEAKED contracts (unchanged), 26 canon-staleness warnings (unchanged), `sweep:rank-reach` `PASS`, `check:process` `passed-with-gaps` with three Linear-backed sub-checks dark. No detector ran this run and none is claimed. `__DEBUG.validateTraitRefs()` remains browser-only and unmeasured, as always in a headless lane.

### Finding 1 (new) — a run report was written and never published; five days undetected

**`Docs/ops/orchestrator-2026-09-01.md` exists in the home tree, is 211 lines, records `promoted: 1` and `needsChristian: true`, and is on neither `origin/ops` nor `origin/main`.** Measured by set difference rather than by eye:

```
git ls-tree -r --name-only origin/ops  -- Docs/ops/ | grep orchestrator-  →  266 files
git ls-tree -r --name-only origin/main -- Docs/ops/ | grep orchestrator-  →   42 files  (frozen pre-cutover archive)
ls Docs/ops/ | grep '^orchestrator-'                                      →   43 files
comm -23 <local> <ops ∪ main>  →  orchestrator-2026-09-01.md   ← exactly one, and only one
```

`ops` has a clean one-day hole: the reports run `…08-30c` → **nothing for 08-31 or 09-01** → `09-02`. The file's mtime is `2026-09-01 19:52 +0200`; its own header says the run started ~17:47Z. So the run executed, did its work, wrote its report, and the publish never landed.

**Why nothing caught it.** `.gitignore:173` ignores `Docs/ops/orchestrator-*.md`, so an unpublished draft is invisible to `git status` — it is not an untracked file anyone would notice. And the lane's own THR-1056 delete-after-publish rule means the *absence* of a local file is the normal state, so a file that lingers reads as ordinary rather than as a symptom. The two mechanisms compose into a silent failure.

**What it actually cost, scoped honestly rather than inflated:**

- **The promotion itself was never at risk.** THR-1378 was a Linear write; it landed on the board and is not in the report's custody. **Nothing was lost that the board holds.**
- **Three of its four Christian-facing asks re-surfaced on their own**, because they are standing items later runs re-derive — the design-slot bottleneck, the encounter-batch approval, the wayfinder maps. **One did not**: its item 3, the two game forks ([THR-1348](https://linear.app/threadbare/issue/THR-1348/ambitions-held-below-the-spotlight-tier-have-no-agency-path-10-of-the) on off-screen merchant ambitions and [THR-1287](https://linear.app/threadbare/issue/THR-1287/control-upkeep-is-structurally-impossible-nothing-ever-resets) on upkeep-vs-timer). Both tickets are still open in `Todo`, so nothing is unrecoverable; they simply never reached him.
- **Its redundancy judgement pass went nowhere for five days.** That is the real loss and the reason this is a finding rather than a shrug: a redundancy pass is the one T3 output no detector can reproduce, so when its report dies the finding dies with it. **It is recovered and filed this run as THR-1422**, and every claim in it re-verified against today's tree rather than trusted.
- **Its diff baseline was skipped.** Later sweeps diffed against `08-30b`, so its 8-LEAKED / 25-warning readings never entered the chain. Benign in hindsight — the counts had already moved to 7/26 by today and both are recorded — but a diff chain with a hole in it is not a diff chain.

**Recovery action taken: the 09-01 report is published to `ops` in the same commit as this one.** Read in full before publishing; it is this lane's own output, contains nothing sensitive, and its filename carries its own date. `keep-work-flowing-cc` reads the *newest* sibling report, which is this one — so restoring a five-day-old file cannot disturb Christian's briefing. It restores the record and closes the hole.

**Not filed as a ticket**, per the process-work throttle: scheduled lanes log rather than file, this is **one** occurrence in five days (bounded by the measurement above — exactly one such file exists), and it clears none of the materiality bars. **Carried to the weekly retro** with the evidence above. The narrow question for the retro is worth stating precisely, because it is cheap: *the lane deletes its report on a successful publish and on a `skip` verdict, and there is no third path — so a lingering `Docs/ops/orchestrator-*.md` is by construction a failed publish, and nothing looks.*

### Stalled work, `In Design`, and hand-created `In Dev` — measured

**Hand-created `In Dev`: none.** The one board change since run b was checked rather than assumed — [THR-1420](https://linear.app/threadbare/issue/THR-1420/two-companions-on-one-bearer-can-share-a-name-collectusednames-is) appeared in `In Dev` at 18:16Z having not been in run b's `Ready for Dev` scan, which is exactly the shape THR-1325's ruling is about:

```
get_issue(THR-1420).stateHistory
  → Todo           2026-09-04T12:17:00Z → 2026-09-04T13:31:17Z
  → Ready for Dev  2026-09-04T13:31:17Z → 2026-09-06T18:16:18Z
  → In Dev         2026-09-06T18:16:18Z → open
```

**It passed through `Ready for Dev` and was claimed normally.** One clean transition, 55 minutes old at scan. Not hand-created, not stalled, **and not moved** — the ruling is that this lane reports these and never normalises them, and there was nothing to report.

**Stalled work: none.** `ORCH_STALLED_PICKUP_THRESHOLD` is 3 `Ready for Dev → In Dev` transitions without a `Done`. THR-1420 is at 1 (above). THR-1392 and THR-1130 both carry `Parked` and predate the window.

**`In Design`: 1 live, 1 excluded.** Full table under T2.

```
In Design: 1 live, 1 excluded (THR-1002 unassigned 18d → excluded; THR-790 assigned Christian 22d → warned, still counted).
Stalled work: 0 issues at or above 3 claim cycles.
Hand-created In Dev (never in Ready for Dev): none — THR-1420 checked, passed through Ready for Dev 09-04T13:31Z.
```

### Redundancy — assessed this sweep, and it produced the run's ticket

**Not a reachability result offered in place of a redundancy one.** The judgement pass ran, on the recovered 09-01 probe class (duplicate *constant definitions* — the tunability axis), and every pair was re-read on today's tree rather than carried:

- **Confirmed still duplicated, and now filed as THR-1422:** `SEA_LEVEL`, `TRUST_COOPERATE_DELTA`, `TRUST_DEFECT_DELTA`, `TRUST_DECAY_PER_TICK`, `REACH_TO_SPHERE`, `SPHERE_COLORS`.
- **Confirmed already repaired, so deliberately excluded:** the worldgen cluster the 09-01 pass listed as unverified (`LAKE_SIZE_MAX`, `GREAT_LAKE_SIZE_MAX`, `RIVER_MIN_LENGTH`, `TEMP_ALTITUDE_PENALTY`) — THR-1409 closed those on 09-04 and run a re-verified single-ownership this morning. **Refiling them would have been the whole hazard of acting on a stale report.**
- **Confirmed benign and explicitly excluded from the ticket:** the re-export adapters (`MAX_AWARENESS_HOPS`, `DEFAULT_DOOM_TICKS`) — one source plus adapters is what a repair looks like, not a finding.
- **Left open, deliberately:** `TRACE_CATEGORIES` (a known four-site registration shape needing its own decision) and `OUTCOME_BAND_PROSE` (different types on each side — a dead-code question, not a tunability one).

**No new redundancy candidate beyond the recovered set.** `main` has advanced by one merge commit since run a's pass, so that is the expected result rather than a thin one.

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is **Sunday**. Nothing is said about it rather than repeating a stale result. Next due **Monday 2026-09-07**.

## Escalations

- **No Discord question posted.** Nothing this run needs a decision from Christian, and the standing asks are already in his briefing — a second channel would be noise, not redundancy.
- **THR-790 remains the single parked item**, parked on Christian rather than on a blocker, seventh consecutive day. Not re-surfaced this run by the 48h rule.
- **The 2026-09-01 report is recovered and published**; the lost-publish defect is carried to the weekly retro, not filed (process throttle).
- **`LINEAR_API_KEY` remains unset**, so `check:process` keeps reporting `passed-with-gaps` with three sub-checks dark — including the one that verifies queued issues carry a coordination block. Unchanged from run b, consequence of the same root cause, deliberately not filed.
- **Nothing promoted was deferred.** The promotion ceiling never engaged: the shelf is 5, well under the 15 that would throttle it, and there was nothing eligible to promote regardless.
