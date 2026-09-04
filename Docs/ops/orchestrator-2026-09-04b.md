---
lane: tb-orchestrator
run: 2026-09-04b
promoted: 0
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-09-04 (run b, ~06:27–06:35Z)

**Two corrections, both of which change what you are asked to look at.** The encounter brief you are being asked to approve was rewritten and merged **four minutes before this run started** — the link the last briefing gave you points at the August draft, which is still on `main` and still reads plausible. And the fight map has **seven open questions, not eleven**: three of the ten were waiting on the other two all along, and this run read the relations instead of counting labels.

One ask also came off the list on its own: the encounter-audio question you answered this morning.

## Needs Christian

**One ask, one corrected link, and two things you can stop thinking about.**

**1. The encounter brief — approve it, and answer one question inside it. The link has changed since your last briefing.**

Read this one: [**Retrofit batch 2 — the camp six**](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/2026-09-04-retrofit-batch-2-brief.md). It was drafted and merged this morning at 06:23Z, and it replaces the version you were pointed at an hour ago. The older draft is still sitting on `main` under a nearly identical name, so nothing breaks if you click the old link — you just read an August plan that three rulings have since overtaken. The ticket parked on your yes is [Encounter Factory pilot volume](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to).

Beyond approving it, the brief asks you one thing:

> **Is repairing the camp encounters in place still what you want — or have they earned being re-rolled from fresh premises?** They were written in July under the old prose doctrine. Repair is the plan; re-rolling is a bigger job.

Two things in the brief are worth knowing before you answer, because they make the job smaller than the ticket says: the batch is **seven encounters, not nine** (two were already finished and nobody had noticed), and **two of those seven need a design ruling rather than an author**, so they will sit out either way.

This is still the only queued item that turns into something you can *play*.

**2. Traits wave 2 — unchanged, still one word.** [Traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) has been in the design column 20 days with your name on it, and because your name is on it the machine keeps a slot open rather than quietly shelving something you might be about to start. **Are you still planning to design it soon?** Yes means do nothing. No means it gets set aside and the design tier is free again.

**3. Answered and gone — the encounter audio question.** You said *"no audio please"* this morning. That question had been waiting since 18 August. It is now a straightforward deletion job sitting in the build queue, and it is off this list for good.

**4. The fight map got smaller and grew a starting point.** [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) has been reported to you as ten open questions. It is **seven** — three of them were waiting on answers to the others, which nobody had checked. More useful: two of the seven are the head of the whole thing.

- [**How a fight against a monster works**](https://linear.app/threadbare/issue/THR-1263/npc-mode-fight-loop-the-stat-block-and-test-skeleton) — the nerve test, then the clash test, and what a monster's stat block has to say.
- [**How a fight between two people works**](https://linear.app/threadbare/issue/THR-1264/agent-mode-fight-loop-opposed-band-pairs) — both sides roll, and the interesting part is which pair of results you got.

Settle those two and **three more open by themselves** — what a fight looks like on screen, how a fight slots into an encounter, and the mid-fight moments table. Nothing else on that map unblocks anything.

**Also still open, not re-argued:** the [undertakings map](https://linear.app/threadbare/issue/THR-1396/undertakings-across-the-living-simulation-wayfinder-map)'s two questions (the [division rule](https://linear.app/threadbare/issue/THR-1398/the-division-rule-category-picks-the-verbs-reach-picks-the-objects) first — it unblocks four), and the [item generator sketch](https://linear.app/threadbare/issue/THR-1236/item-generator-sketch-thirty-generated-items-to-react-to). **No rush from this lane on any of it.**

## T1 — unblock sweep

**Promoted: 0. Filed: 0. Held: 1 (unchanged).** Board: **51 `Todo`** (50 + one on page 2 — [THR-789](https://linear.app/threadbare/issue/THR-789/traits-as-the-universal-trigger-layer-program-epic), a program epic, not promotable), **3 `Ready for Dev`**, **2 `In Design`**, **3 `In Dev`**. Neither ceiling bound.

**Page 2 was read this run.** Run a stopped at page 1 with `hasNextPage:true` recorded but unexplored. It holds exactly one issue and it is an epic — so nothing was missed, and this is now a measured fact rather than an open edge.

### The shelf is 3, not 2 — and the third arrived with a director verdict on it

[THR-1168](https://linear.app/threadbare/issue/THR-1168/two-authored-encounter-audio-moments-have-no-live-caller-wire-or) moved `In Dev` → `Ready for Dev` at **05:51:21Z**, inside run a's own scan window. Run a saw it leave `In Dev` and recorded it as *"left the column"* without following where it went. It went onto the shelf, carrying Christian's chat verdict (*"thr 1168. no audio please."*) and a **complete coordination block** in its latest comment — model, parallel-safe, mutex, `Blocked by: nothing`, plus a `Browser-verify exempt` line for the deletion-only diff.

So it is pickable **now**, and it is the one item on the shelf whose scope is fully settled. It carries the `Deferral` label, which is why T2's floor still reads 2 (below).

**Checked, because an issue that re-enters the shelf from `In Dev` is exactly where a missing coordination block hides:** its latest comment satisfies `pull-work` Step 3 in full. No repair needed.

### The executor shipped and is free

[THR-1391](https://linear.app/threadbare/issue/THR-1391/ul-proposal-covet-rivalry-a-hostile-to-the-world-writes-from-coveting) (Covet rivalry UL-proposal) reached **`Done` at 05:56:08Z** via [PR #1810](https://github.com/christianspliid-ui/threadbare/pull/1810) — the claim run a caught mid-sweep at 05:52Z, closed four minutes later. `stateHistory` is clean: `Todo` → `Ready for Dev` → `In Dev` → `Done`, the sanctioned path. The WIP=1 slot is open and the next pickup has three candidates.

### The finding — the batch-2 brief was replaced four minutes before this run, and the stale path still resolves

[THR-1222](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine)'s coordination block names its blocker as *"Christian's chat approval of `Docs/plans/encounters/retrofit-batch-2-brief.md`"*. **That is not the brief that will be approved.**

An attended session on THR-1130 drafted a new one at 06:13:33Z and merged it as [PR #1811](https://github.com/christianspliid-ui/threadbare/pull/1811) at **06:22:57Z**. Verified against `origin/main` rather than inferred from the PR:

```
git ls-tree -r --name-only origin/main -- Docs/plans/encounters/ | grep -i retrofit
  Docs/plans/encounters/2026-08-15-retrofit-batch-1-brief.md
  Docs/plans/encounters/2026-09-04-retrofit-batch-2-brief.md   ← current, "the camp six"
  Docs/plans/encounters/retrofit-batch-1-brief.md
  Docs/plans/encounters/retrofit-batch-2-brief.md              ← 2026-08-24, superseded, still present
```

**Both files exist**, which is the whole reason this is worth a paragraph. The plan-doc liveness gate (THR-921) tests whether a named artifact *resolves* — this one resolves perfectly and is simply the wrong document. A `LIVE` verdict is not a currency verdict, and no gate in the repo distinguishes the two. Left unrecorded, every future sweep re-parsing that block would have kept pointing at the August draft, and run a's `## Needs Christian` had already sent Christian there once.

The superseded draft predates three rulings that bind the current one (the 2026-08-24 authoring order, prose doctrine v2 rule zero, and consequence families becoming drawn rather than chosen), and describes a nine-encounter batch where the current brief measures seven.

[Correction posted to THR-1222](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine) naming both paths, what changed, and why the stale one is dangerous rather than merely old. **The three coordination lines were repeated verbatim in that comment** — posting a bare correction would have made it the latest comment and left the ticket failing `pull-work` Step 3 the moment its approval gate cleared.

**Not promoted.** The approval gate is Christian's and is not met; the artifact being repointed does not change that. **Its title was not corrected** either ("the camp seven" against the brief's "camp six") — a scope edit belongs to whoever picks it up.

### Held and declined — all unchanged, none re-argued

- **[THR-1303](https://linear.app/threadbare/issue/THR-1303/delete-control-upkeep-thr-1292-6-gated-on-a-post-cutover-decision-mix) — held**, exactly as run a left it: its substantive condition is met (the board decides in `'live'`), only [THR-1301](https://linear.app/threadbare/issue/THR-1301/cut-the-unified-decision-board-over-to-live-blocked-on-undertaking)'s state field is not `Done`. This lane does not rewrite a relation to unblock its own promotion. It promotes on the sweep after THR-1301 closes.
- **THR-1301 — still `Todo`**, still satisfied-upstream with all four Done-whens met (evidence on the ticket from run a, verified against `d8861ca6`). No lane may close it.
- **Standing declines**, each on the reason already recorded: THR-1222 (approval gate), THR-1380 (satisfied upstream, wants a `Done`), THR-1381 / THR-1134 / THR-1155 / THR-1348 (design verdict first → T2's input), THR-1287 (waits behind THR-1303), THR-1256 (time gate, opens 2026-09-08), THR-1024 / THR-1114 / THR-1189 / THR-1195 / THR-1315 / THR-1318 / THR-1274 / THR-1148 / THR-1255 / THR-175 / THR-1393. **16 `wayfinder:*` items** skipped unconditionally → T1.5.

**Week's product-vs-process ratio.** Nothing filed or promoted this run, so the ratio is unmoved from run a's: **one filing this week, product** (THR-1409, a terrain-tuning defect). **No process or infrastructure ticket was filed or promoted.** The headline finding is unchanged and the corrected brief link does not soften it — *the queue has motion and none of it is new play*. What did change is that the one lever that would fix it now has a brief on `main` and a single yes/no in front of it.

## T1.5 — wayfinder sweep

**Four open maps. Frontier 11, of which 10 are HITL — down from the 15 reported this morning.** Run a's escalation named re-reading the Physical Conflict relations as *"the obvious next sweep's cheap win"*. It was, and it was worth more than expected.

| Map | Frontier | Was reported | Composition |
|---|---|---|---|
| [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) | **7** | 10 | 5 `grilling`, 2 `prototype` |
| [Undertakings across the living simulation](https://linear.app/threadbare/issue/THR-1396/undertakings-across-the-living-simulation-wayfinder-map) | 3 | 3 | 2 `grilling`, 1 `task` |
| [Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator) | 1 | 1 | 1 `prototype` |
| [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft) | 0 | 0 | its one child is assigned to Christian |

### Physical Conflict is 7, not 10 — and it is a chain with two heads

`includeRelations` read on all ten open children. All four of the map's research tickets (THR-1259, THR-1260, THR-1261, THR-1262) closed on 2026-08-26, so every blocker they held is met — the three that remain blocked are blocked by **open siblings**:

```
THR-1263 (NPC fight loop, prototype)   → blocks THR-1272, THR-1269
THR-1264 (agent fight loop, prototype) → blocks THR-1272, THR-1269, THR-1265

blocked, not frontier:  THR-1265 (by 1264) · THR-1269 (by 1264+1263) · THR-1272 (by 1264+1263)
frontier (7):  THR-1263 · THR-1264 · THR-1266 · THR-1267 · THR-1268 · THR-1270 · THR-1271
```

**The two fight loops are the head of the map**, and nothing else on it unblocks anything — THR-1266, THR-1267, THR-1268, THR-1270 and THR-1271 are all leaves whose research blockers cleared nine days ago. That is the sequencing this tier exists to produce, and it was invisible while the frontier was counted from labels.

Consistent with run a's THR-1396 result (6 → 3): **on both maps where relations were actually read, the frontier came out roughly half what the label count said.** The pattern is now measured twice, not once.

### Item Generator confirmed genuinely unblocked; Powers confirmed empty

[THR-1236](https://linear.app/threadbare/issue/THR-1236/item-generator-sketch-thirty-generated-items-to-react-to) carries four `blockedBy` relations — THR-1237, THR-1228, THR-1235, THR-1234 — and **all four are `Done`** (25 August). So its frontier of 1 was right for the right reason, which was not previously established. Powers & Spellcraft's only open child (THR-1232) is assigned to Christian → frontier 0. Both counts now rest on read relations rather than inherited numbers.

**THR-1396 carried forward unchanged** — frontier THR-1398, THR-1401, THR-1405; nothing on that map has moved since run a read its relations at ~05:50Z (every open child's `updatedAt` is 2026-09-03 or earlier).

### No AFK burn-down was available, for the third consecutive run

Every frontier ticket across all four maps is `grilling` or `prototype` — **HITL, never touched by this lane** — with the single exception of [THR-1405](https://linear.app/threadbare/issue/THR-1405/task-join-the-catalogue-to-the-systems-inventory-owningsystem-values), whose agent-doable research half was discharged by run a yesterday and whose code half is queued as [THR-1407](https://linear.app/threadbare/issue/THR-1407/every-owningsystem-resolves-to-a-registry-subsystem-name-recase-remap). What remains on it rides on THR-1407 and is code this lane does not ship. **No claim taken, no map's Decisions-so-far amended** — nothing resolved.

## T2 — design staging

**Not triggered.** Ready for Dev holds 3, of which **2 are non-`Deferral`** (THR-1409, THR-1407) — not *fewer than* `ORCH_PROGRAM_WORK_FLOOR` (2), so the tier does not fire. THR-1168 is the third and carries `Deferral`, so it does not count toward the floor even though it is the most execution-ready item on the board.

**And it would have been barred regardless.** `In Design` is unchanged from run a: [THR-1002](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) (unassigned, last real activity 2026-08-19 — **16 days**) is excluded by the stale-unassigned arm; [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) (assigned Christian, 2026-08-15 — **20 days**) counts, because a person is waiting on it. `ORCH_MAX_IN_DESIGN` is 1 and the column reads **1 live**. No room.

**Fourth consecutive day the design tier is barred by one 20-day assigned item.** Re-surfaced above as `## Needs Christian` item 2, **not re-staged**. No mutation — excluding an item from a count is not a state change, and applying `Parked` is Christian's call.

## T3 — architecture health

**Not due — already run today.** [`orchestrator-2026-09-04.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-04.md) (run a, ~05:50Z) ran the daily sweep: all four detectors completed, zero new detector findings, and a redundancy pass that filed THR-1409. The tier is once-daily on the first run after `ORCH_HEALTH_SWEEP_HOUR`; re-running it 40 minutes later would produce the identical table and train its reader to skip it.

**No detector was run this run, and none is reported as clean.** `__DEBUG.validateTraitRefs()` remains browser-only and unmeasured, as always in a headless lane.

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Friday.

**Board-health observations that belong to T1's scan rather than T3's**, recorded because they were read this run: no issue meets `ORCH_STALLED_PICKUP_THRESHOLD`; `In Design: 1 live, 1 excluded (THR-1002 unassigned 16d → excluded; THR-790 assigned Christian 20d → warned, still counted)`; **hand-created `In Dev`: none** — the three occupants are THR-1130 (`Parked`, unassigned, holding the batch-2 approval), THR-1133 (`Parked`, assigned Christian), THR-1392 (`Parked`, assigned Christian). All three carry the sanctioned park shape; **none is a live claim**, so the executor's slot is genuinely empty.

## Escalations

- **Nothing asked on Discord.** The trigger is *agreed work exhausted*; it is not — three shelf items, an idle executor, and the next pickup has work whichever it takes.
- **A stale-but-resolving artifact path is a gap no gate covers — for the retro, logged not filed** (2026-08-10 throttle). THR-921's liveness gate answers *"does this path resolve?"*, and a superseded doc sitting beside its replacement answers yes. Cost so far: one briefing sent Christian to an August draft for an approval decided against a September one. Cheap fix if it recurs — a brief's frontmatter naming its successor — but one occurrence is below the materiality bar, so it is a log row.
- **Relations-vs-labels is now measured twice, and both times the frontier halved.** Run a found THR-1396 at 3 against 6; this run found Physical Conflict at 7 against 10. The remaining unread map is none — all four have now been read at relation level. **The escalation run a raised is discharged**, and the standing fix is that T1.5 step 2 must be executed as written rather than approximated from labels.
- **THR-1301 still needs a `Done` no lane may set**, and still holds THR-1303 out of a shelf that is only three deep. Unchanged from run a and carried for the retro with its cost line.
- **Carried unchanged:** `Docs/canon/world-objects.md`'s missing `last_reviewed` stamp (one frontmatter line, open two days); UL-proposals expressing their real dependency as prose while `relations.blockedBy` stays empty.
