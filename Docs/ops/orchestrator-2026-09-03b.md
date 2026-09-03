---
lane: tb-orchestrator
run: 2026-09-03b
promoted: 0
filed: 1
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-09-03 (run b, ~19:26–19:35Z)

**The promotion machine worked end to end, and it took 44 minutes.** [Run a](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-03.md) promoted [THR-1390](https://linear.app/threadbare/issue/THR-1390/ul-proposal-undertaking-contract-batch-brief-undertaking-sense) at 18:31Z. The executor claimed it at 19:02Z and it was **`Done` at 19:15Z** ([PR #1808](https://github.com/christianspliid-ui/threadbare/pull/1808)) — promoted, claimed, shipped, closed, inside one hour. That is this lane's whole purpose observed working, and it is worth recording because the failure mode it replaces (authored work sitting in `Todo` for days) leaves no trace at all.

**It also emptied the shelf back to 1**, which is what this run had to answer. It answered by filing rather than promoting: nothing in `Todo` became promotable in the last hour, but an hour-old piece of research had a finished, executor-ready code half with **nowhere to go**.

## Needs Christian

**Nothing new is being asked of you this hour.** Three asks stand from an hour ago, unchanged and not re-argued — carried here only because the briefing reads the newest report, so dropping them would silently retire them.

**1. Retrofit Batch 2 — still the one lever that puts *content* in the queue.** [Run Retrofit Batch 2](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine): the seven camp-and-devotion encounters, shrines and resting and the quiet moments between fights. It waits on nothing but your yes to [the brief](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/retrofit-batch-2-brief.md).

**2. Traits wave 2 — one word.** [Traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) has been in the design column **19 days**, assigned to you — and because it is assigned, the machine keeps counting it rather than quietly setting aside something you might be about to start.

> **Are you still planning to design Traits wave 2 soon?** If yes, nothing to do. If not, say so and it gets set aside.

This is the single thing barring the design tier from staging anything else.

**3. Your new map's five questions are waiting.** [Undertakings across the living simulation](https://linear.app/threadbare/issue/THR-1396/undertakings-across-the-living-simulation-wayfinder-map), charted with you this afternoon. Same five as an hour ago: [which open cells are wanted](https://linear.app/threadbare/issue/THR-1397/which-open-cells-are-wanted-yield-and-leverage-ownership-of-people) (already assigned to you), [the division rule](https://linear.app/threadbare/issue/THR-1398/the-division-rule-category-picks-the-verbs-reach-picks-the-objects), [the untouched-by-design list](https://linear.app/threadbare/issue/THR-1401/the-untouched-by-design-list-which-systems-mortals-never-move-by-their), [what the player sees](https://linear.app/threadbare/issue/THR-1404/what-the-players-sees-the-callings-spread-on-the-sheet-the-work-on-the), plus two sketches to react to. Say *"work the map"* when you have the appetite; **no rush from this lane.**

*One thing that quietly got easier, with nothing for you to do:* the untouched-by-design question was going to be answered off a table drawn by hand. The work that lets the machine generate it instead is now queued.

**Not re-listed, deliberately:** the eleven fight-design questions on the Physical Conflict map and the one item-generator sketch. They are a standing shelf, static for eight days.

## T1 — unblock sweep

**Promoted: 0. Filed: 1. Declines: unchanged from run a.** Board at the sweep: **52 `Todo`** (`hasNextPage:false` on the second page), **1 `Ready for Dev`** before the filing, **2 `In Design`**, **4 `In Dev`** (all `Parked`). Neither ceiling bound — `ORCH_PROMOTE_BATCH_MAX` is 5, and a shelf of 1 is nowhere near the 15-item backed-up threshold.

**Nothing became promotable.** The only state change since run a is THR-1390 → `Done`, and a search for issues naming it returns only itself: it blocks nothing. Every decline in run a stands on the reason recorded there and is not re-argued here — THR-1222 (Christian gate), THR-1380 (satisfied upstream, wants a `Done` this lane may not set), THR-1381 (design decision → T2), THR-1348 / THR-1287 / THR-1114 / THR-1189, THR-1024 (blocker THR-966 still `Idea`), THR-1195, THR-1301 / THR-1303 (gated behind the cutover). **16 `wayfinder:*` items** skipped unconditionally → T1.5.

### Filed — THR-1407, the executor home the research half did not have

[**THR-1407**](https://linear.app/threadbare/issue/THR-1407/every-owningsystem-resolves-to-a-registry-subsystem-name-recase-remap) — *Every `owningSystem` resolves to a registry subsystem name.*

Run a discharged the AFK research half of [THR-1405](https://linear.app/threadbare/issue/THR-1405/task-join-the-catalogue-to-the-systems-inventory-owningsystem-values) and **deliberately left the ticket open**, because what remained was code and this lane does not ship code. That was the right call, and it left a real gap: THR-1405 carries `wayfinder:task`, so it can never enter the executor queue by rule, and unlike its sibling THR-1403 it names no executor home. A complete, executor-ready derivation was sitting where no executor would ever read it.

Filing a separate, non-wayfinder ticket routes it without bending either rule — the decision stays on the map, the code goes to the queue.

**The premise was re-measured before filing, not taken on trust from the ticket that asked for it.** Run a's own finding was that THR-1405's body understates its scope; inheriting that would have reproduced the understatement one level down:

```
grep -o "owningSystem: '[^']*'" src/data/world-objects.ts | sort -u   →  20 distinct
grep -c  "owningSystem: '"      src/data/world-objects.ts             →  34 kind rows
registry row names, scripts/subsystems-registry.ts                    →  26 rows
comm -12 (set intersection)                                           →   2
```

Exactly two values match — `Doom Clock & Journey` and `Essence & Divine Economy` — so **18 of 20 are adrift**, against the "eight" the originating ticket names. THR-1407 therefore states a **membership predicate** rather than a count (THR-688 rule A): *every `owningSystem` is a member of `SUBSYSTEM_NAMES`, and every writer module's domain resolves to some row's `domains`*. That cannot rot the way the originating list already has.

The three writes ran in the order THR-845 requires, and the null assignee was **verified by absence of the key on a `get_issue` re-query** — not off the create response, which omits it while the issue is in fact assigned:

```
[orchestrator] T1 file THR-1407: create → Ready for Dev (project Thematic Pressure & Living World)
[orchestrator] T1 file THR-1407: save_issue(assignee:null) → get_issue: no assignee key present ✅
[orchestrator] T1 file THR-1407: coordination block posted — Opus advisory; parallel-safe with
               THR-1391; mutex THR-1403 / THR-1392-4b (all edit src/data/world-objects.ts kind rows)
[orchestrator] T1 shelf 1 → 2; ceiling not reached (max 5, backed-up threshold 15)
```

**Its `stateHistory` begins at `Ready for Dev`, and that is not the THR-1325 shape.** The hand-created pathology is a ticket created into **`In Dev`**, skipping the claim step and carrying no coordination block. This one enters the queue unclaimed, unassigned, and with its block posted in the same pass — the sanctioned direct-file path. Flagged here so a later T3 sweep reading that history does not mis-file it.

**The judgement call, stated plainly rather than buried.** THR-1407 sits near the line the 2026-08-10 throttle draws, since it is tooling and scheduled lanes do not file process tickets. I filed it because it is not delivery machinery — it touches no CI, gate, git or Linear surface. It is a named deliverable of a map Christian charted this afternoon, its research is already done and posted, and it ends with a generated table replacing a hand-drawn one under a question that goes to him. If that reading is wrong the correction is cheap: the ticket is unclaimed and can be parked without losing anything, because the derivation lives on THR-1405 either way.

**Week's product-vs-process ratio.** One filing, product-adjacent (game-object vocabulary in service of a live design map), not process tooling. **No process or infrastructure ticket was filed or promoted this run.** The headline finding is unchanged from run a and the filing does not soften it: *the queue has motion, and still nothing in it is new content or new play.* THR-1222 is the only lever that changes that, and it is one word from Christian.

## T1.5 — wayfinder sweep

**Four open maps, frontier 17, of which 16 are HITL. Nothing was burned down — and this hour that is the correct result rather than an idle one.**

| Map | Frontier | Composition |
|---|---|---|
| [Undertakings across the living simulation](https://linear.app/threadbare/issue/THR-1396/undertakings-across-the-living-simulation-wayfinder-map) | 6 | 3 `grilling`, 2 `prototype`, 1 `task` (THR-1405) |
| [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) | 10 | 6 `grilling`, 4 `prototype` |
| [Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator) | 1 | `prototype` |
| [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft) | 0 | its one child is assigned to Christian |

Membership was re-enumerated from the full `Todo` slice this run (both pages, `hasNextPage:false`), not carried from run a. **It confirms run a's figures exactly**, including the Physical Conflict 10 — which a first pass here miscounted as 9 by dropping THR-1266 before the recount caught it. Run a's caveat still holds and is inherited rather than resolved: native-relation blocking was verified only on the two `wayfinder:task` candidates, the sole place it changes a decision, so the HITL counts could be one or two high if an unread relation blocks one of them.

**The AFK pool is genuinely empty, and for a new reason.** THR-1405 remains the only frontier `wayfinder:task` — THR-1403 is still `blockedBy` THR-1402, re-verified by relation read this run — but its agent-doable half was completed an hour ago, and as of this run its code half sits in the executor queue as THR-1407. There is no remaining AFK work on any of the four maps. **No `grilling` or `prototype` ticket was touched**, and no claim was taken.

**No map's Decisions-so-far was amended.** THR-1405 did not resolve, so there is still nothing decided to record on THR-1396.

## T2 — design staging

**Not triggered — and it would have been barred had it been.** Both readings are given, because they disagree:

- **At scan time** the shelf held **1** non-`Deferral` item (THR-1391), *fewer than* `ORCH_PROGRAM_WORK_FLOOR` (2) → triggered.
- **After T1's filing** it holds **2** (THR-1391, THR-1407) → not triggered.

The second is the reading that governs: T1 runs first precisely so its output is the remedy for a thin shelf, and run a measured post-promotion for the same reason.

**Either way the bound binds.** `In Design` is unchanged from an hour ago, re-measured against the shipped `classifyInDesignItem` predicate — newest comment or state transition, not `updatedAt`, since a bulk relation-write stamped both at `2026-09-03T07:19:42Z` and that is not activity:

| `In Design` occupant | Assignee | Last real activity | Counts? |
|---|---|---|---|
| [THR-1002](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) | none | 2026-08-19 — **15 days** | **No** — stale-unassigned, excluded |
| [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) | Christian | 2026-08-15 — **19 days** | **Yes** — assigned, a person is waiting |

`ORCH_MAX_IN_DESIGN` is 1 and the column reads **1 live**, so the tier had no room regardless of its trigger. THR-790 is **re-surfaced, not re-staged** (it is at 19 days against a 48h re-surface rule) as `## Needs Christian` item 2. **No mutation was made** — excluding an item from a count is not a state change, and applying `Parked` is Christian's call and the grooming lane's remit.

## T3 — architecture health

**Not due — already run today, and deliberately not repeated.** The daily sweep fired in [run a](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-03.md) at ~18:26Z, one hour ago, with all four detectors completing and two new findings recorded (the `world-objects.md` missing `last_reviewed` stamp; LEAKED 8 → 7 as `undertaking-checkpoint-events` went live).

**No detector was run this hour, and none is reported as clean.** Re-running them an hour later would produce identical output and re-print two findings as though they were new — the dump this tier exists to avoid. So `newFindings: 0` in the frontmatter means *nothing was swept*, **not** *nothing was found*; the distinction matters if anything ever diffs these counters across runs.

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Thursday.

One T3-adjacent fact this run did establish, recorded so tomorrow's sweep has it: **`In Dev` still holds four items against WIP=1, all four `Parked`** (THR-1392 assigned Christian; THR-1130 / THR-1133 / THR-1168 unassigned), and **there is no live claim** — THR-1390's opened at 19:02Z and closed at 19:15Z. Free executor slot, two-item shelf; the healthiest that pairing has read in days.

## Escalations

- **Nothing asked on Discord.** The trigger is *agreed work exhausted*; it is not — the shelf holds two items, the executor slot is free, and the next pickup has work whichever it takes. Run e's standing escalation condition (idle executor, zero shelf, neither Christian ask answered) remains live for a future run, unchanged.
- **[THR-1380](https://linear.app/threadbare/issue/THR-1380/ul-proposal-calling-moment-follow-the-undertaking-surface-vocabulary) still needs a `Done` this lane may not set.** Carried from run a without re-verification; the evidence there is complete. It is the second satisfied-upstream ticket in two days that no sweep will close, which run a flagged for the retro and this run seconds rather than re-argues.
- **For the retro, logged not filed** (2026-08-10 throttle, below the materiality bar): `owningSystem` had **no validation of any kind** — its only two consumers are pure rendering in `scripts/generate-world-objects.ts` — which is why 18 of 20 values drifted unnoticed. THR-1407 closes that particular gap; what is worth the retro's attention is the shape, since *a field with a single rendering consumer and no gate* is a pattern this repo will have more of. Also carried unlogged from run a: the `'companion'` alias defect and the `world-objects.md` stamp gap.
- **Carried unchanged:** UL-proposals still express their real dependency as prose while `relations.blockedBy` stays empty. THR-1407 was filed with real `relatedTo` relations for exactly this reason — but its own "blocked by: nothing" is prose in a comment, like every other.
