---
lane: tb-orchestrator
run: 2026-09-04f
promoted: 0
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-09-04 (run f, ~12:27–12:35Z)

**Two tickets filed ten minutes before this sweep both declared themselves unblocked against a branch that has not merged.** Each carried a well-written coordination block whose `Blocked by` line was measurably false — one claims a CLI command that exists only on the open PR, the other claims a precedent file that has zero matching lines on `main`. Both were held rather than promoted, and both blocks were corrected in place against `git grep` output rather than against the author's description of their own tree.

Nothing was promoted. The board is healthy and busy: **five merges today** and a sixth ticket in flight.

## Needs Christian

**Nothing new is asked of you.** The four items below are carried unchanged from the last briefing — repeated so they do not fall off the list, not re-argued. One number has moved and is worth the correction.

**1. Five of your pixel-sweep findings are now fixed and merged, not four.** Since the last briefing, the two authored audio moments that had no live caller were resolved too. That is five of the seven tickets your 1920×1080 pass filed this morning, all merged inside seven hours. **Nothing needed from you** — the remaining two are queued and the machine has them.

**2. The encounter brief — still one yes, unchanged.** [**Retrofit batch 2 — the camp six**](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/2026-09-04-retrofit-batch-2-brief.md) (the September brief — the superseded August draft still sits beside it under a nearly identical name, so use this link). The ticket parked on your yes is [Encounter Factory pilot volume](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to); the batch itself is [Run Retrofit Batch 2](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine). The one question inside it: **repair the camp encounters in place, or re-roll them from fresh premises?**

Worth repeating plainly, and today's five merges make it sharper rather than softer: **everything the machine shipped today was repair work on surfaces that already exist.** This brief is still the only queued item that becomes something new to *play*.

**3. Traits wave 2 — still one word.** [Traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) has sat in the design column 20 days with your name on it, and because your name is on it the machine holds a slot open rather than quietly shelving something you might be about to start. **Still planning to design it soon?** Yes means do nothing; no means it gets set aside and the design tier is free again.

**4. The maps, carried unchanged.** [Undertakings](https://linear.app/threadbare/issue/THR-1396/undertakings-across-the-living-simulation-wayfinder-map) — two questions, the [division rule](https://linear.app/threadbare/issue/THR-1398/the-division-rule-category-picks-the-verbs-reach-picks-the-objects) first, because it unblocks four. [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) — seven, of which the [monster fight loop](https://linear.app/threadbare/issue/THR-1263/npc-mode-fight-loop-the-stat-block-and-test-skeleton) and the [person-vs-person fight loop](https://linear.app/threadbare/issue/THR-1264/agent-mode-fight-loop-opposed-band-pairs) are the two heads. Plus the [item generator sketch](https://linear.app/threadbare/issue/THR-1236/item-generator-sketch-thirty-generated-items-to-react-to). **No rush from this lane on any of it.**

## T1 — unblock sweep

**Promoted: 0. Filed: 0. Held: 3 (2 new, 1 standing).** Board: **51 `Todo`** (50 on page 1, THR-789 alone on page 2), **6 `Ready for Dev`**, **2 `In Design`**, **3 `In Dev`**.

### The two new candidates, and why both are held

[**THR-1420**](https://linear.app/threadbare/issue/THR-1420/two-companions-on-one-bearer-can-share-a-name-collectusednames-is) (two companions sharing a name) and [**THR-1421**](https://linear.app/threadbare/issue/THR-1421/attachmentstab-renders-a-companions-bonus-as-signed-raw-deltas-3-iron) (`+3 iron` on a player surface, Law 13) were filed at **12:17Z**, ten minutes before this sweep, by the session shipping [THR-1413](https://linear.app/threadbare/issue/THR-1413). Both are clean, well-scoped bugs with real defects on `main`. Both carry a coordination block written by the filing session — the right instinct, and exactly what THR-836 asks for.

**Both blocks assert `Blocked by: nothing`, and in both cases that is false.** The author wrote them from a working tree where the dependency was already present.

| Ticket | The block's claim | What `main` actually holds |
|---|---|---|
| THR-1420 | *"The repro runs on `main` today."* | `spawn companion` **does not exist on `main`** — no hit in `scripts/cli.ts`, `debugCommands.ts` or `debugWorldSpawnTools.ts`. It is introduced by [PR #1818](https://github.com/christianspliid-ui/threadbare/pull/1818) at `cli.ts:1293` / `debugCommands.ts:156` / `debugWorldSpawnTools.ts:779`. |
| THR-1421 | *"THR-1413 has shipped the precedent this builds on."* | #1818 is **open**, `Test · Typecheck · Build` in progress at 12:31Z. `git grep -c "companion" origin/main -- src/components/Game/AscendantSheet.tsx` → **0**. The block's own `blob/main` link to `companionReachLine` resolves to a file without it. |

The defects themselves are genuinely on `main` — `contributionLine` sits at `AttachmentsTab.tsx:47` and is called at :86; `collectUsedNames` / `pickCulturalName` are untouched by #1818. **Only the routes are stranded:** THR-1420's Done-when opens with a CLI command an executor cannot run, and THR-1421's parity Done-when has no ascendant row to match against — and parity is what that ticket exists for, not a side condition.

**This is the THR-921 stranded-artifact class in its code form**, and the rule applies unchanged: **hold, do not decline.** #1818 has auto-merge armed with everything green but the build; both tickets become promotable the moment it lands, and the next sweep takes them.

**Both blocks were corrected in place** — a full replacement block on each, three lines restated verbatim from the author's own (they are correct and better-informed than a rewrite would be), with only the dependency half changed and a one-command test the next reader can run:

```
[orchestrator] T1 hold THR-1420: repro cmd `spawn companion` absent on origin/main, present on PR #1818 branch (verified by git grep, both refs)
[orchestrator] T1 hold THR-1421: precedent AscendantSheet.tsx companion lines = 0 matches on origin/main; PR #1818 OPEN, build IN_PROGRESS 12:31Z
[orchestrator] T1 THR-1420/1421: blocks re-asserted 12:31:48Z / 12:32:03Z — Blocked by corrected, mutex re-verified vs #1818 file list, no state/assignee/scope written ✅
[orchestrator] T1 THR-1420/1421 mutex check: #1818 touches AscendantSheet.tsx, not AttachmentsTab.tsx / companions.ts / culture-name-pools.ts → no contention either way
```

**Why correct the ticket and not just the report.** A future T1 run reads Linear, not this file. `Blocked by: nothing` sitting as the latest comment is precisely what makes a wrong promotion look correct — the THR-990 shape running in reverse. Correcting it there is the only channel a later sweep is guaranteed to read. The corrections were written as *complete* blocks rather than bare notes, because a bare note would have displaced the block out of latest position and reproduced the hazard runs c and e both had to repair.

### The shelf is clean, checked by run e's own timestamp rule

Six items. Four share `updatedAt` **09:30:22.290Z to the millisecond** (THR-1416, THR-1407, THR-1414, THR-1412) — a bulk field write, not four comments. The remaining pair sits at 10:30:08.7–.9Z, contemporaneous with run e's own restore. **No lone distinct stamp, so nothing is owed a comment read.** Spot-checked [THR-1415](https://linear.app/threadbare/issue/THR-1415) anyway to keep the rule falsifiable rather than assumed: its latest comment is still run c's 07:29Z restoration, intact — so its 10:30:08.889Z stamp is a field write, and the rule held on the one case that could have broken it.

Run e's sequencing note on [THR-1407](https://linear.app/threadbare/issue/THR-1407) stands unchanged: fully formed, block intact, `No priority` so it sorts below six `Low` fixes despite being the largest real program work on the shelf. **No write made** — this lane does not set priority.

### Throughput: five merged today, one in flight

| Merged today | At | What |
|---|---|---|
| [THR-1410](https://linear.app/threadbare/issue/THR-1410) | 07:31Z | commit control unreachable at 1920×1080 |
| [THR-1409](https://linear.app/threadbare/issue/THR-1409) | 08:30Z | worldgen constants declared twice |
| [THR-1411](https://linear.app/threadbare/issue/THR-1411) | 09:28Z | stance word never renders on the veil |
| [THR-1418](https://linear.app/threadbare/issue/THR-1418) | 10:28Z | `terrainPipeline` has no pipeline |
| [THR-1168](https://linear.app/threadbare/issue/THR-1168) | 11:31Z | two audio moments with no live caller |

The executor's slot is **occupied, not free**: THR-1413 is `In Dev` with [PR #1818](https://github.com/christianspliid-ui/threadbare/pull/1818) open and auto-merge armed. That is the correction to run e's "slot effectively free" reading, which was true at 10:32Z and is not now.

### Held and declined — unchanged, none re-argued

- **[THR-1303](https://linear.app/threadbare/issue/THR-1303/delete-control-upkeep-thr-1292-6-gated-on-a-post-cutover-decision-mix) — held**, sixth consecutive run, on run a's reason: its substantive condition is met, only [THR-1301](https://linear.app/threadbare/issue/THR-1301)'s state field is not `Done`. THR-1301 re-read: still `Todo`, `updatedAt` 05:55Z, unmoved. This lane does not rewrite a relation to unblock its own promotion.
- **Standing declines**, each on its already-recorded reason: THR-1222 (approval gate, item 2 above), THR-1380 and THR-1301 (satisfied upstream, want a `Done` this lane may not set), THR-1381 / THR-1134 / THR-1155 / THR-1348 (design verdict first → T2's input), THR-1287 (waits behind THR-1303), THR-1256 (time gate, opens **2026-09-08** — four days out), THR-1133 (attended dev-server session by construction), THR-1024 / THR-1114 / THR-1189 / THR-1195 / THR-1315 / THR-1318 / THR-1274 / THR-1148 / THR-1255 / THR-1393 / THR-175 / THR-870 / THR-1043 / THR-791 / THR-789 / THR-1218 / THR-1220 / THR-1156. **23 `wayfinder:*` items** skipped unconditionally → T1.5.

**Week's product-vs-process ratio.** Zero promotions this run. Running total for the week: **one filing and one promotion, both product; zero process or infrastructure tickets filed or promoted by this lane.** Five merges today do not change the headline: *the queue has depth and motion, and none of it is new play.* THR-1222 remains the only lever that changes that.

## T1.5 — wayfinder sweep

**Four open maps. Frontier 11, of which 10 are HITL. Nothing moved, nothing touched.**

| Map | Frontier | Composition |
|---|---|---|
| [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) | 7 | 5 `grilling`, 2 `prototype` |
| [Undertakings across the living simulation](https://linear.app/threadbare/issue/THR-1396/undertakings-across-the-living-simulation-wayfinder-map) | 3 | 2 `grilling`, 1 `task` |
| [Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator) | 1 | 1 `prototype` |
| [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft) | 0 | its one child is assigned to Christian |

**Carried on this run's own measurement, not on run e's word.** Every open `wayfinder:*` item in this sweep's `Todo` scan carries an `updatedAt` of **2026-09-03 or earlier** — newest is THR-1396 itself at 2026-09-03T19:32:42.958Z, byte-identical to the readings in runs c, d and e. Nothing on any map has moved since all four were last read at relation level, so re-reading `includeRelations` on eleven tickets would return the same eleven answers.

**No AFK burn-down available, seventh consecutive run.** Every frontier ticket is `grilling` or `prototype` — HITL, never touched by this lane — except [THR-1405](https://linear.app/threadbare/issue/THR-1405), whose research half was discharged 2026-09-03 and whose code half is queued as THR-1407. What remains on THR-1405 rides on THR-1407 and is code this lane does not ship. **No claim taken, no Decisions-so-far amended.**

## T2 — design staging

**Not triggered, and not close.** `Ready for Dev` holds **6**, and **all 6 are non-`Deferral`** — against `ORCH_PROGRAM_WORK_FLOOR` of 2. (The one `Deferral` on the shelf, THR-1168, merged at 11:31Z, which if anything makes the program-work count cleaner than run e's.)

**And it would have been barred regardless.** `In Design` unchanged, measured against the shipped `classifyInDesignItem` predicate rather than `updatedAt` — both occupants share a bulk-write stamp of 2026-09-03T07:19:42Z, so the real-activity dates below are the operative ones:

| `In Design` occupant | Assignee | Last real activity | Counts? |
|---|---|---|---|
| [THR-1002](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) | none | 2026-08-19 — **16 days** | **No** — stale-unassigned, excluded |
| [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) | Christian | 2026-08-15 — **20 days** | **Yes** — assigned, a person is waiting |

`ORCH_MAX_IN_DESIGN` is 1 and the column reads **1 live**. THR-790 re-surfaced above as `## Needs Christian` item 3, **not re-staged**. **No mutation** — excluding an item from a count is not a state change, and applying `Parked` is Christian's call and the grooming lane's remit.

**Fifth consecutive day the design tier is barred by one 20-day assigned item.** Carried to Escalations unchanged.

## T3 — architecture health

**Not due — already run today.** [`orchestrator-2026-09-04.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-04.md) (run a, ~05:50Z) ran the daily sweep: all four detectors completed, zero new detector findings, and a redundancy pass that filed THR-1409 — since merged, and extended by THR-1418.

**No detector was run this run, and none is reported as clean.** `__DEBUG.validateTraitRefs()` remains browser-only and unmeasured, as always in a headless lane.

**Redundancy: not assessed this sweep.** The tier is not due; no judgement pass was made and none is implied.

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Friday.

**Board-health lines, from T1's own scan rather than a T3 sweep:**

- **No issue meets `ORCH_STALLED_PICKUP_THRESHOLD`** (3 `Ready for Dev → In Dev` transitions with no `Done`). THR-1420 and THR-1421 each have a single-entry `stateHistory` (`Todo`, 12:17Z) — first sighting, nothing repeated.
- `In Design: 1 live, 1 excluded (THR-1002 unassigned 16d → excluded; THR-790 assigned Christian 20d → warned, still counted).`
- **Hand-created `In Dev` (never in `Ready for Dev`): none.** The three occupants are THR-1413 (claimed, PR open, auto-merge armed), THR-1392 (`Parked`, assigned Christian) and THR-1130 (`Parked`, unassigned, holding the batch-2 approval).

## Escalations

- **Nothing asked on Discord.** The trigger is *agreed work exhausted*; it is emphatically not — six shelf items, two more a merge away, and an executor mid-ticket.
- **Logged not filed (2026-08-10 throttle) — a coordination block written from the author's own branch can assert `main`-branch facts that are only true in their working tree. First occurrence as a named class; two instances in one minute, from one session.** THR-1420 and THR-1421 above. **Measured loss so far: zero**, because this sweep ran ten minutes after the filing — but the failure mode is not hypothetical: an executor claiming THR-1420 would have opened the CLI, had `spawn companion` rejected as unknown, and burned a claim reaching line one of the Done-when. That is the THR-887 shape (~a session), which is above the materiality bar; it did not fire only because the timing was lucky. **What makes it a class rather than a slip:** a session filing a follow-up ticket is, by construction, standing in a tree where its own dependency already exists, so "does this run on `main`?" is the one question its position makes it least able to answer honestly. **Cheap durable fixes for the retro to weigh, neither filed:** (a) extend `check:plan-doc-liveness` — or a sibling — to accept a *command or symbol* predicate, so a Done-when naming `spawn companion` can be tested against `origin/main` the way a plan-doc path already is; (b) add one line to the deferral-filing rule in CLAUDE.md: *a `Blocked by: nothing` claim on a ticket filed mid-PR must be verified against `origin/main`, not the working tree.* **(b) costs ~10 minutes and would have caught both.**
- **A run that does real coordination work the counters cannot see, third occurrence.** Run d wrote a blocking relation and a hold comment; run e restored a displaced block and verified a mutex against a mid-sweep merge; this run corrected two false dependency lines against two `git grep` refs. None of it is visible to `promoted` / `filed` / `resolved` / `newFindings`, and this report exists only because `needsChristian` is independently true. **Counters left honest at zero rather than inflated.** Now three occurrences in three consecutive runs — a `blocksRepaired:` counter in `check:substantive` would close it, and the case for one is no longer anecdotal.
- **THR-1301 still needs a `Done` no lane may set**, and still holds THR-1303 out of the queue. Sixth day in the log. Carried for the retro.
- **T2 barred five consecutive days**, unchanged. Whether the tier's bound is calibrated for the way work actually arrives is the retro's question, not this lane's.
- **Carried unchanged:** `Docs/canon/world-objects.md`'s missing `last_reviewed` stamp (one frontmatter line, open three days); UL-proposals expressing their real dependency as prose while `relations.blockedBy` stays empty; the superseded `retrofit-batch-2-brief.md` still resolving beside its September replacement, which no liveness gate distinguishes.
