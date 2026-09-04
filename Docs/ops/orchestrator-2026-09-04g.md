---
lane: tb-orchestrator
run: 2026-09-04g
promoted: 2
filed: 0
resolved: 2
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-09-04 (run g, ~13:28–13:35Z)

**Both tickets run f held one hour ago are promoted, and both were released by running the exact one-command test that block wrote for this reader.** PR #1818 merged as `e9d92f6c` at ~13:0xZ, which put the CLI route THR-1420's repro opens with, and the parity target THR-1421 exists to match, on `main` together.

That is the hold-then-release cycle working end to end inside one hour: run f declined to promote on an author's word, wrote down what would falsify its own decline, and this run spent two `git grep`s to reverse it.

## Needs Christian

**Nothing new is asked of you.** All four items below are carried unchanged so they do not drop off the briefing — none is re-argued, and one count has moved in your favour.

**1. Your pixel-sweep findings: six of seven now merged.** Since the last briefing the companion mint route landed too, and it filed two small follow-ups that are already queued. **Nothing needed from you.**

**2. The encounter brief — still the one yes.** [Retrofit batch 2 — the camp six](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/2026-09-04-retrofit-batch-2-brief.md) (the September brief — an older draft sits beside it under a near-identical name, so use this link). Parked on your yes: [Encounter Factory pilot volume](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to); the batch is [Run Retrofit Batch 2](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine). The question inside it: **repair the camp encounters in place, or re-roll them from fresh premises?**

Said plainly again, because today's merges sharpen it rather than soften it: **everything the machine shipped today was repair on surfaces that already exist.** This brief is still the only queued item that becomes something new to *play*.

**3. Traits wave 2 — still one word.** [Traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) has sat in the design column 20 days with your name on it, and the machine holds a design slot open rather than shelve something you may be about to start. **Still planning to design it soon?** Yes means do nothing; no means it is set aside and the design tier frees up.

**4. The maps, unchanged.** [Undertakings](https://linear.app/threadbare/issue/THR-1396/undertakings-across-the-living-simulation-wayfinder-map) — two questions, the [division rule](https://linear.app/threadbare/issue/THR-1398/the-division-rule-category-picks-the-verbs-reach-picks-the-objects) first, because it unblocks four. [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) — seven, headed by the [monster fight loop](https://linear.app/threadbare/issue/THR-1263/npc-mode-fight-loop-the-stat-block-and-test-skeleton) and the [person-vs-person fight loop](https://linear.app/threadbare/issue/THR-1264/agent-mode-fight-loop-opposed-band-pairs). Plus the [item generator sketch](https://linear.app/threadbare/issue/THR-1236/item-generator-sketch-thirty-generated-items-to-react-to). **No rush from this lane on any of it.**

## T1 — unblock sweep

**Promoted: 2. Filed: 0. Held: 1 (standing).** Board at scan time: **54 `Todo`** (50 page 1 + 4 page 2), **5 `Ready for Dev`**, **2 `In Design`**, **3 `In Dev`** (one live, two `Parked`).

### The two promotions — each released by its own predecessor's falsification test

`origin/main` = **`e9d92f6c`**, *"Merge pull request #1818 from christianspliid-ui/fix/thr-1413-companion-mint-route"*. Both holds named a command; both commands were run against `origin/main` this run, not against a worktree and not inherited from the merge notification.

| Ticket | Run f's test, verbatim | Result this run |
|---|---|---|
| [**THR-1420**](https://linear.app/threadbare/issue/THR-1420/two-companions-on-one-bearer-can-share-a-name-collectusednames-is) | *"Confirm with `git grep "spawn companion" origin/main -- scripts/cli.ts`; a hit means this line is spent."* | **Hit** — `cli.ts:1293`, `cli.ts:1636`, `debugCommands.ts:158`. Was zero at 12:31Z. |
| [**THR-1421**](https://linear.app/threadbare/issue/THR-1421/attachmentstab-renders-a-companions-bonus-as-signed-raw-deltas-3-iron) | *"Confirm with `git grep -c "companion" origin/main -- src/components/Game/AscendantSheet.tsx`; a non-zero count means this line is spent."* | **17** (was **0**). `companionReachLine` at `:153`, called at `:590`. |

Both defects were re-verified as still present rather than assumed: `contributionLine` sits at `AttachmentsTab.tsx:47` and is called at `:86`; `collectUsedNames` / `pickCulturalName` are untouched by #1818, as both prior blocks recorded. **Only the routes were stranded, and both landed in the same merge** — which is why one PR released two holds.

Both promotions carry a full replacement coordination block. Three lines are restated from the filing session's own block (they are correct and better-informed than a rewrite), with the dependency half rewritten and the mutex re-verified against the five other shelf items file-by-file.

```
[orchestrator] T1 promote THR-1420: hold cleared — `spawn companion` on origin/main@e9d92f6c (cli.ts:1293, debugCommands.ts:158); PR #1818 merged
[orchestrator] T1 promote THR-1421: hold cleared — AscendantSheet.tsx companion lines 0 → 17 on origin/main@e9d92f6c; companionReachLine:153 is the parity target
[orchestrator] T1 THR-1420/1421: state-only writes, verified by get_issue; no assignee key present on either; blocks posted 13:31:43Z / 13:32:13Z ✅
[orchestrator] T1 mutex re-check: neither ticket's files appear in THR-1415/1417/1416/1407/1412 → shelf has no contention
```

**Evidence shapes differ and are stated per ticket**, which is the half a promotion most often gets wrong: THR-1420 is Engine — CLI repro output plus the code-track gate and `test:heavy`, **no browser owed**. THR-1421 is UI — **all four browser parts owed**, citing Laws 13 and 14 by number.

### THR-1303 — held, seventh consecutive run, and the cost is now worth writing down

[THR-1303](https://linear.app/threadbare/issue/THR-1303/delete-control-upkeep-thr-1292-6-gated-on-a-post-cutover-decision-mix) (Medium, Engine) is held on run a's reason, unchanged and not re-argued: its substantive condition is met, and only [THR-1301](https://linear.app/threadbare/issue/THR-1301)'s **state field** is not `Done`.

Verified independently this run rather than inherited from run a's comment:

```
git grep -n "UNIFIED_DECISION_BOARD_MODE: UnifiedDecisionBoardMode" origin/main
  → strategic-action-constants.ts:462  = 'live';
git ls-tree origin/main -- src/engine/decisionBoardModeGuard.ts
  → (empty — file deleted)
```

So THR-1303's Done-when #1, *"THR-1301 merged and the board deciding in `'live'`"*, is true of the tree today. THR-1301 re-read: still `Todo`, `updatedAt` 05:55Z, unmoved since this morning's sweep.

**Still not promoted, and the relation still not rewritten.** Run f's position stands and this run does not reverse it: a lane that edits a blocking relation to clear its own promotion is manufacturing its own permission, and that is the shape that eventually gets pointed at live work.

**What is new is only the arithmetic, recorded as an impediment-log row rather than a ticket** (process-work throttle — scheduled lanes log, the weekly retro promotes): **seven consecutive runs have held one Medium engine ticket on a bookkeeping field, and three tickets in four days are now finished-but-open for the same reason** (THR-1301, THR-1380, and one earlier). The common cause is single and precise: **no automated lane may write `Done`**, and every closing path in this repo runs through a merge commit — so a ticket whose work shipped *under a different id* has no closer at all. That is not a defect in any one ticket and it will not fix itself; it is a gap in the state machine, and it belongs to the retro with this run's count attached.

### Standing declines — unchanged, none re-argued

THR-1222 (approval gate, `## Needs Christian` item 2) · THR-1380 and THR-1301 (satisfied upstream, want a `Done` this lane may not set) · THR-1381 / THR-1134 / THR-1155 / THR-1348 (design verdict first → T2's input) · THR-1287 (waits behind THR-1303) · THR-1256 (time gate, opens **2026-09-08**, four days out) · THR-1133 (attended dev-server session by construction) · THR-1024 / THR-1114 / THR-1189 / THR-1195 / THR-1315 / THR-1318 / THR-1274 / THR-1148 / THR-1255 / THR-1393 / THR-175 / THR-870 / THR-1043 / THR-791 / THR-789 / THR-1218 / THR-1220 / THR-1156. **23 `wayfinder:*` items** skipped unconditionally → T1.5.

**Week's product-vs-process ratio.** Two promotions this run, **both product bugs**. Running week: **three promotions and one filing, all product; zero process or infrastructure tickets filed or promoted by this lane.** The headline is unchanged and today's throughput does not move it: *the queue has depth and motion, and none of it is new play.*

## T1.5 — wayfinder sweep

**Four open maps. Frontier 11, of which 10 are HITL. Nothing moved, nothing touched, nothing claimed.**

| Map | Frontier | Composition |
|---|---|---|
| [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) | 7 | 5 `grilling`, 2 `prototype` |
| [Undertakings across the living simulation](https://linear.app/threadbare/issue/THR-1396/undertakings-across-the-living-simulation-wayfinder-map) | 3 | 2 `grilling`, 1 `task` |
| [Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator) | 1 | 1 `prototype` |
| [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft) | 0 | its one child is assigned to Christian |

**Carried on this run's own measurement.** Every `wayfinder:*` item in this sweep's `Todo` scan carries an `updatedAt` of **2026-09-03 or earlier**; the newest is THR-1396 itself at `2026-09-03T19:32:42.958Z`, byte-identical to the readings in runs c, d, e and f. Nothing on any map has moved since all four were last read at relation level, so re-reading `includeRelations` on eleven tickets would return eleven identical answers — the relation reads are skipped on that basis and the skip is stated rather than silent.

**No AFK burn-down available, eighth consecutive run.** Every frontier ticket is `grilling` or `prototype` — HITL, never touched by this lane — except [THR-1405](https://linear.app/threadbare/issue/THR-1405), whose research half was discharged 2026-09-03 and whose remaining half is code, queued as [THR-1407](https://linear.app/threadbare/issue/THR-1407) on the dev shelf. **No claim taken, no Decisions-so-far amended.**

## T2 — design staging

**Not triggered, and not close.** `Ready for Dev` holds **7** after this run's two promotions, and **all 7 are non-`Deferral`** — against `ORCH_PROGRAM_WORK_FLOOR` of 2.

**And it would have been barred regardless.** `In Design` is unchanged from run f, measured against the shipped `classifyInDesignItem` predicate rather than raw `updatedAt` (both occupants share a 2026-09-03T07:19:42Z bulk-write stamp, so real-activity dates are the operative ones):

| `In Design` occupant | Assignee | Last real activity | Counts? |
|---|---|---|---|
| [THR-1002](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) | none | 2026-08-19 — **16 days** | **No** — stale-unassigned, excluded |
| [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) | Christian | 2026-08-15 — **20 days** | **Yes** — assigned, a person is waiting |

`ORCH_MAX_IN_DESIGN` is 1; the column reads **1 live**. THR-790 is re-surfaced as `## Needs Christian` item 3, **not re-staged** (its 48h re-surface rule). **No mutation** — excluding an item from a count is not a state change, and applying `Parked` is Christian's call and the grooming lane's remit.

**Fifth consecutive day the design tier is barred by one 20-day assigned item.** Carried to Escalations unchanged.

## T3 — architecture health

**Not due — already run today.** [`orchestrator-2026-09-04.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-04.md) (run a, ~05:50Z) ran the daily sweep: all four detectors completed, zero new detector findings, and a redundancy pass that filed THR-1409 — since merged and extended by THR-1418.

**No detector ran this run, and none is reported as clean.** The weekly test-suite-health pass is not due either: `ORCH_TESTHEALTH_DOW` is Monday and today is **Friday**, so nothing is said about it rather than repeating a stale result. `__DEBUG.validateTraitRefs()` remains browser-only and unmeasured, as always in a headless lane.

**Redundancy: not assessed this sweep.** T3 did not run; no reachability result is being offered in its place.

## Escalations

- **THR-1303, seventh consecutive hold** — logged above as an impediment-log row with its count, not filed as a ticket. The generalisable finding for the weekly retro: *no automated lane may write `Done`, and every closing path runs through a merge commit, so a ticket whose work shipped under a different id has no closer.* Three instances in four days. No Discord question raised — this is a technical gap with a named owner (the retro), not a direction question for Christian.
- **Design tier barred five days running** by one 20-day assigned `In Design` item (THR-790). Surfaced to Christian as one yes/no word, unchanged. No lane action available; `Parked` is his call.
- **Nothing parked, nothing asked on Discord this run.**
