---
lane: tb-orchestrator
run: 2026-09-04d
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-09-04 (run d, ~09:27–09:32Z)

**The first real promotion this lane has made in four days, and it was waiting on a fifteen-second race.** A ticket held out of the queue at 08:30:56Z on the grounds that its predecessor's PR was still open — was already unblocked when that hold was written. The PR merged at 08:30:41Z, fifteen seconds earlier. The hold was correct when it was read and stale when it was typed, and this run only had to re-read rather than re-derive.

The executor also shipped three fixes this morning and is free again.

## Needs Christian

**Nothing new is asked of you. One thing to enjoy, two things still waiting.**

**1. Three of your pixel-sweep findings are already fixed and merged.** The seven tickets your 1920×1080 pass filed this morning are being worked through in order. Since the last briefing: the unreachable commit button is fixed, the missing stance word on authored choice cards is fixed, and the terrain tuning panel that was showing numbers the world generator never read is fixed. **Nothing needed from you** — five more are queued and the machine has them.

**2. The encounter brief — still one yes, unchanged and not re-argued.** [**Retrofit batch 2 — the camp six**](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/2026-09-04-retrofit-batch-2-brief.md) (the September brief — the superseded August draft is still sitting beside it under a nearly identical name, so use this link). The ticket parked on your yes is [Encounter Factory pilot volume](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to); the batch itself is [Run Retrofit Batch 2](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine). The one question inside it: **repair the camp encounters in place, or re-roll them from fresh premises?**

Worth saying plainly, because today's good news does not change it: **everything the machine shipped this morning was repair work on surfaces that already exist.** Nine of the ten things in the build queue are the same. This brief is still the only queued item that becomes something new to *play*.

**3. Traits wave 2 — unchanged, still one word.** [Traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) has sat in the design column 20 days with your name on it, and because your name is on it the machine holds a slot open rather than quietly shelving something you might be about to start. **Still planning to design it soon?** Yes means do nothing; no means it gets set aside and the design tier is free again.

**4. The maps, carried unchanged and not re-argued.** [Undertakings](https://linear.app/threadbare/issue/THR-1396/undertakings-across-the-living-simulation-wayfinder-map) — two questions, the [division rule](https://linear.app/threadbare/issue/THR-1398/the-division-rule-category-picks-the-verbs-reach-picks-the-objects) first, because it unblocks four. [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) — seven, of which the [monster fight loop](https://linear.app/threadbare/issue/THR-1263/npc-mode-fight-loop-the-stat-block-and-test-skeleton) and the [person-vs-person fight loop](https://linear.app/threadbare/issue/THR-1264/agent-mode-fight-loop-opposed-band-pairs) are the two heads. Plus the [item generator sketch](https://linear.app/threadbare/issue/THR-1236/item-generator-sketch-thirty-generated-items-to-react-to). **No rush from this lane on any of it.**

## T1 — unblock sweep

**Promoted: 1. Filed: 0. Held: 1 (unchanged).** Board: **50 `Todo`** (page 1; page 2 holds only the THR-789 epic, measured in run b and unchanged), **8 `Ready for Dev`** at scan → **9** after the promotion, **2 `In Design`**, **3 `In Dev`**. Neither ceiling bound — 9 against a backed-up threshold of 15, one promotion against a max of 5.

### Promoted — THR-1418, and the hold that guarded it was already stale when it was written

[**THR-1418**](https://linear.app/threadbare/issue/THR-1418/terrainpipeline-has-no-pipeline-22-more-cms-tuning-rows-render-a) — *`terrainPipeline` has no pipeline; 22 more CMS tuning rows render a module no generator reads.* Medium, Engine + UI, project Thematic Pressure & Living World.

A sweep at ~08:30Z found this ticket newly filed with `blockedBy: []` and **added the relation rather than promoting it**, on two checks: its Done-when named a guard test that did not yet exist on `origin/main`, and it edited the same two files an open PR was holding. Both were right. Both were also **already discharged** — [PR #1814](https://github.com/christianspliid-ui/threadbare/pull/1814) merged at **08:30:41Z**, and that hold comment posted at **08:30:56Z**. Fifteen seconds. That run read an open PR, and by the time it wrote its conclusion the PR had merged.

Its own closing line is what made this run cheap: *"It is self-clearing: when THR-1409 goes `Done`, this promotes on the next sweep with a full coordination block."* So this run verified rather than re-derived. Both artifact conditions checked against `origin/main` at `bd71928e`, not inferred from ticket state:

```
git ls-tree -r --name-only origin/main -- src/engine/__tests__/ | grep worldgenConstant
  src/engine/__tests__/worldgenConstantOwnership.test.ts          ← present; the guard exists to update

git show origin/main:src/engine/terrainPipeline/types.ts | grep -E 'RIVER_MIN_LENGTH|LAKE_SIZE_MAX|GREAT_LAKE_SIZE_MAX'
  // RIVER_MIN_LENGTH, LAKE_SIZE_MAX and GREAT_LAKE_SIZE_MAX are owned by
  ← declarations gone, ownership comment in their place
```

[THR-1409](https://linear.app/threadbare/issue/THR-1409/three-worldgen-constants-are-declared-twice-with-different-values-the) — the ticket this lane's own T3 redundancy pass filed at 05:55Z this morning — was claimed at 08:01:48Z and `Done` at 08:30:41Z. **Filed and shipped inside three hours**, which is the fastest a T3 finding has ever become a merged fix.

```
[orchestrator] T1 promote THR-1418: blocker THR-1409(Done 2026-09-04T08:30:41Z, PR #1814) → Ready for Dev
[orchestrator] T1 promote THR-1418: get_issue verify → status "Ready for Dev", stateHistory Todo→RfD 09:29:42Z ✅
[orchestrator] T1 promote THR-1418: no assignee key present (promotion is an update; assignee untouched) ✅
[orchestrator] T1 promote THR-1418: coordination block posted 09:30:22Z → list_comments confirms newest ✅
[orchestrator] T1 shelf 8 → 9; ceiling not reached (max 5, backed-up threshold 15)
```

**Plan-doc liveness:** the ticket names no plan doc, so the gate passes trivially — but its Done-when names a test artifact, which is the same hazard wearing different clothes, and that was checked directly rather than waived.

**One correction carried into the block, measured not assumed:** `terrainPipeline/types.ts` holds **23** exported constants on `origin/main`, not the 22 in the title. The ticket's enumerated list is complete and correct — the headline miscounts the four `MIN/MAX` pairs written with a slash as one name apiece. Recorded so the executor enumerates from the file rather than chasing a phantom, and because a count in a title is exactly the THR-688 rule A shape that rots.

### The executor shipped twice more and is free

- [THR-1410](https://linear.app/threadbare/issue/THR-1410/authored-choice-veil-the-commit-control-is-unreachable-at-19201080-the) — `Done`, [PR #1813](https://github.com/christianspliid-ui/threadbare/pull/1813).
- [THR-1411](https://linear.app/threadbare/issue/THR-1411/the-stance-word-never-renders-on-the-live-authored-choice-veil-choice) — [PR #1815](https://github.com/christianspliid-ui/threadbare/pull/1815) merged at **09:28:05Z**, one minute before this run's scan. Still reads `In Dev` at 09:19Z `updatedAt`; the auto-close has not fired yet. **Not a defect and not actioned** — a merge-to-`Done` lag of a few minutes is the workflow behaving normally, and this lane does not set `Done`.
- THR-1409 — `Done` 08:30:41Z, above.

Three merges to `main` this morning, all three from the pixel-sweep and T3 backlog.

**THR-1416's mutex is now clear as a side effect.** Its block reads *"Mutex with: THR-1410 and THR-1411 (same file). Sequence after THR-1410."* Both are now shipped, so the sequencing constraint is satisfied and it is freely pickable. **No write made** — the mutex reason remains accurate history and `pull-work` resolves blocker state at claim time. Recorded so the next pickup does not read a live constraint into a dead one.

### Checked and clean — the run c comment-displacement hazard did not recur

Run c found `daily-backlog-grooming` had displaced THR-1415's coordination block by commenting after it. **THR-1416 showed an `updatedAt` of 09:15:40Z**, fourteen minutes before this scan — the exact shape that hides the fault. `list_comments` read: its only comment is the 06:42:17Z coordination block. **The 09:15Z stamp was a field write, not a comment.** No repair owed.

This is the second time in two runs that a recent `updatedAt` on a shelf item turned out to be a field write rather than a displacing comment (THR-1168 in run c was the first). **The lesson holds both ways** — a list scan cannot distinguish them, so the comment read is not optional; but it also means the hazard is rarer than the timestamps suggest.

### Held and declined — unchanged, none re-argued

- **[THR-1303](https://linear.app/threadbare/issue/THR-1303/delete-control-upkeep-thr-1292-6-gated-on-a-post-cutover-decision-mix) — held**, fourth consecutive run, on the reason run a established: its substantive condition is met (the board decides in `'live'`), only [THR-1301](https://linear.app/threadbare/issue/THR-1301/cut-the-unified-decision-board-over-to-live-blocked-on-undertaking)'s state field is not `Done`. Re-read this run: THR-1301 is still `Todo`, and its `blocks` relation to THR-1303 still stands. This lane does not rewrite a relation to unblock its own promotion. It promotes on the sweep after THR-1301 closes.
- **THR-1301 — still `Todo`**, still satisfied-upstream with all four Done-whens met (evidence on the ticket from run a, verified against `d8861ca6`). No lane may close it.
- **Standing declines**, each on its already-recorded reason: THR-1222 (approval gate), THR-1380 and THR-1301 (satisfied upstream, want a `Done` this lane may not set), THR-1381 / THR-1134 / THR-1155 / THR-1348 (design verdict first → T2's input), THR-1287 (waits behind THR-1303), THR-1256 (time gate, opens 2026-09-08), THR-1133 (attended dev-server session by construction), THR-1024 / THR-1114 / THR-1189 / THR-1195 / THR-1315 / THR-1318 / THR-1274 / THR-1148 / THR-1255 / THR-1393 / THR-870 / THR-1043 / THR-1218 / THR-1220 / THR-1156. **16 `wayfinder:*` items** skipped unconditionally → T1.5.

**Week's product-vs-process ratio.** One promotion this run, **product** — a defect in the game's world-generation tuning surface, not delivery machinery. Running total for the week: **one filing and one promotion, both product; zero process or infrastructure tickets filed or promoted by this lane.** The headline finding is unchanged and today's three merges do not soften it: *the queue has depth and motion, and none of it is new play.* THR-1222 remains the only lever that changes that.

## T1.5 — wayfinder sweep

**Four open maps. Frontier 11, of which 10 are HITL. Nothing moved, nothing touched.**

| Map | Frontier | Composition |
|---|---|---|
| [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) | 7 | 5 `grilling`, 2 `prototype` |
| [Undertakings across the living simulation](https://linear.app/threadbare/issue/THR-1396/undertakings-across-the-living-simulation-wayfinder-map) | 3 | 2 `grilling`, 1 `task` |
| [Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator) | 1 | 1 `prototype` |
| [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft) | 0 | its one child is assigned to Christian |

**Carried, not re-derived, and the licence to carry is measured rather than assumed:** every open `wayfinder:*` item in this run's `Todo` slice has an `updatedAt` of 2026-09-03 or earlier — the newest is THR-1396 itself at 2026-09-03T19:32:42Z, unchanged from run c's reading. Nothing on any map has moved since all four were read at relation level (run a on THR-1396, run b on the other three), so re-reading `includeRelations` on eleven tickets would return the same eleven answers.

**No AFK burn-down was available, for the fifth consecutive run.** Every frontier ticket is `grilling` or `prototype` — HITL, never touched by this lane — except [THR-1405](https://linear.app/threadbare/issue/THR-1405/task-join-the-catalogue-to-the-systems-inventory-owningsystem-values), whose research half was discharged on 2026-09-03 and whose code half is queued as [THR-1407](https://linear.app/threadbare/issue/THR-1407/every-owningsystem-resolves-to-a-registry-subsystem-name-recase-remap) — still on the shelf, still unclaimed. What remains on THR-1405 rides on THR-1407 and is code this lane does not ship. **No claim taken, no Decisions-so-far amended** — nothing resolved.

## T2 — design staging

**Not triggered, and not close.** `Ready for Dev` holds **9**, of which **8 are non-`Deferral`** (only THR-1168 carries it) — against `ORCH_PROGRAM_WORK_FLOOR` of 2. The tier fires below the floor; the shelf is four times it.

**And it would have been barred regardless.** `In Design` unchanged from all three earlier runs, re-measured against the shipped `classifyInDesignItem` predicate rather than `updatedAt` — a bulk relation-write stamped both at 2026-09-03T07:19:42Z, and that is not activity:

| `In Design` occupant | Assignee | Last real activity | Counts? |
|---|---|---|---|
| [THR-1002](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) | none | 2026-08-19 — **16 days** | **No** — stale-unassigned, excluded |
| [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) | Christian | 2026-08-15 — **20 days** | **Yes** — assigned, a person is waiting |

`ORCH_MAX_IN_DESIGN` is 1 and the column reads **1 live**. THR-790 re-surfaced above as `## Needs Christian` item 3, **not re-staged**. **No mutation** — excluding an item from a count is not a state change, and applying `Parked` is Christian's call and the grooming lane's remit.

**Fifth consecutive day the design tier is barred by one 20-day assigned item.** Carried to Escalations with its cost line, unchanged.

## T3 — architecture health

**Not due — already run today.** [`orchestrator-2026-09-04.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-04.md) (run a, ~05:50Z) ran the daily sweep: all four detectors completed, zero new detector findings, and a redundancy pass that filed THR-1409 — **which is now merged**, three hours after it was filed. Re-running the detectors 3.5 hours later would produce an identical table.

**No detector was run this run, and none is reported as clean.** `__DEBUG.validateTraitRefs()` remains browser-only and unmeasured, as always in a headless lane.

**Redundancy: not assessed this sweep.** The tier is not due; no judgement pass was made and none is implied.

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Friday.

**Board-health lines, from T1's own scan rather than a T3 sweep:**

- **No issue meets `ORCH_STALLED_PICKUP_THRESHOLD`** (3 `Ready for Dev → In Dev` transitions with no `Done`). THR-1418's history is a single `Todo → Ready for Dev` transition made by this run.
- `In Design: 1 live, 1 excluded (THR-1002 unassigned 16d → excluded; THR-790 assigned Christian 20d → warned, still counted).`
- **Hand-created `In Dev` (never in `Ready for Dev`): none.** The three occupants are THR-1411 (merged one minute before the scan, auto-close pending), THR-1392 (`Parked`, assigned Christian) and THR-1130 (`Parked`, unassigned, holding the batch-2 approval). Two sanctioned parks and one ticket on its way out — the executor's slot is effectively free.

## Escalations

- **Nothing asked on Discord.** The trigger is *agreed work exhausted*; it is emphatically not — nine shelf items and a free executor.
- **New for the retro, logged not filed (2026-08-10 throttle): a run that does real work the counters cannot see publishes nothing, and the next run pays for it.** The ~08:30Z sweep added a blocking relation and posted a hold comment that this run depended on — genuine coordination work — and published no report, because `promoted`/`filed`/`resolved`/`newFindings` were all zero and `check:substantive` returns `skip` on that. The comment was excellent, so **this run's actual cost was near zero**; the record simply lived on the ticket instead of in `ops`. **The class is the concern:** a relation write and a hold decision are exactly the kind of sequencing this lane exists to produce, and the frontmatter has no counter for either. Cheap fix if it recurs — a `held:` or `relationsWritten:` counter in the substantive check. One occurrence with no measurable loss is below the materiality bar; batched for the weekly retro with this line.
- **The fifteen-second race is worth recording as a pattern, not a defect.** Two runs in two days have written a conclusion about an open PR that merged mid-sweep (this one at 08:30:41Z vs 08:30:56Z; run a's THR-1391 claim at 05:52Z inside its own scan window). Nothing was wrong in either case — both were correct at read time and both self-corrected on the next run. **No fix proposed:** re-reading PR state immediately before writing a hold would narrow the window without closing it, and the self-clearing hold pattern the 08:30Z run used is already the right answer. Recorded so a future sweep reading a stale-looking hold checks the clock before assuming an error.
- **THR-1301 still needs a `Done` no lane may set**, and still holds THR-1303 out of the queue. Fifth day in the log. The cost is smaller than it was on Wednesday — the shelf is 9, not 2 — but the backlog of satisfied-upstream tickets nobody can close is still growing at roughly one a day. Carried for the retro.
- **T2 barred five consecutive days**, unchanged. The shelf it exists to refill has been refilled twice this week by parties other than this tier — an attended pixel sweep and this lane's own T3 pass. Whether the tier's bound is calibrated for the way work actually arrives is the retro's question, not this lane's.
- **Carried unchanged:** `Docs/canon/world-objects.md`'s missing `last_reviewed` stamp (one frontmatter line, open three days); UL-proposals expressing their real dependency as prose while `relations.blockedBy` stays empty; the superseded `retrofit-batch-2-brief.md` still resolving beside its September replacement, which no liveness gate distinguishes.
