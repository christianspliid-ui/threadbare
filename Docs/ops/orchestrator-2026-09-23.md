---
lane: tb-orchestrator
run: 2026-09-23
promoted: 0
filed: 0
resolved: 0
newFindings: 1
needsChristian: true
---
# Orchestrator — 2026-09-23 (run a, ~06:30Z)

## Needs Christian

**The builder is working again, so yesterday's ask to top up its credit is resolved.** At 08:24 local it picked up [artifact traits](https://linear.app/threadbare/issue/THR-1521/traits-wave-2-slice-3-artifact-traits-the-has-trait-schema-admits) where it had died, finished the build, and opened [PR #1985](https://github.com/christianspliid-ui/threadbare/pull/1985). That PR will merge itself once its checks pass. You don't need to do anything for it.

**The only open ask is the same design hour as yesterday:** **[Scenes are being offered to exactly the people who will refuse them](https://linear.app/threadbare/issue/THR-1525/signed-desire-score-vs-the-specs-step-6-a-fork-that-plants-on-its).** Here's the problem. The world offers a scene to someone who leans one way on the value the scene is about. When the scene's choice splits on that same value, the better option is usually the other side, the one they won't pick. To work on it, open a chat and say you want to work THR-1525. Once artifact traits merges, the builder's shelf is empty, so this design hour is what the builder needs next.

## T1 — unblock sweep

| Column | Yesterday run h (14:30Z) | This run |
|---|---|---|
| `Ready for Dev` | 0 | **0** |
| `Ready for Dev`, non-`Deferral` | 0 | **0** |
| `In Design` | 1 | 1 |
| `In Dev` | 1 (THR-1521, dead builder) | 1 (THR-1521, **PR open**) |
| `Todo` | 28 | 28 |

**Nothing promoted, and nothing could have been.** `Todo` still holds the same 28 items. The newest `updatedAt` is still 2026-09-22T08:22:54Z, so nothing in the column changed after run h's full read. That read's dispositions still apply and are carried over rather than re-derived:

- **15 wayfinder-labelled**: skipped unconditionally. They are T1.5's input.
- **Design-first, 6** (THR-1526, THR-1528, THR-1523, THR-1274, THR-1393, THR-1381): these belong to T2, not T1.
- **Trigger unmet, 3** (THR-1522, THR-175, THR-1218). THR-1522 is declined on its semantic gate: THR-790's census came back `FLAT`. Its `Blocked by` half is not what holds it.
- **Not executor work, 4** (THR-1220 HITL sitting, THR-870 parked direction, THR-789 epic, THR-791 assigned to Christian).

**Ceilings:** neither one engaged. The shelf is at 0 and no promotions were made, so no candidate was held back.

**Product-vs-process, this week:** the week's completions are product work (THR-1448 held-town standing merged; THR-1521 artifact traits in flight). No process ticket was promoted. **Headline: the feature pipeline needs design supply.** After THR-1521 the shelf is empty.

## T1.5 — wayfinder sweep

Three open maps, all unchanged: [THR-1227](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator), [THR-1226](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft), [THR-1258](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict). **AFK frontier: 0.** No `wayfinder:research` or `wayfinder:task` tickets exist, so nothing was claimed or closed. **HITL frontier: 12** (6 grilling, 6 prototype). It has not changed since 2026-08-26 and is not re-listed here.

## T2 — design authoring

**Triggered, but barred.** There are 0 non-`Deferral` items in `Ready for Dev`, below the floor of 2. `In Design` has **1 live** item, [THR-1525](https://linear.app/threadbare/issue/THR-1525/signed-desire-score-vs-the-specs-step-6-a-fork-that-plants-on-its). It is unassigned and was staged 2026-09-22T04:37Z, about 26h ago. It still counts, and `ORCH_MAX_IN_DESIGN` is 1, so nothing new was staged. The 48h re-surface falls at ~04:37Z on 09-24. Until then it is carried in `## Needs Christian` as the standing ask.

## T3 — architecture health

**Due and run: all four detectors, first sweep of the local day** (local 08:30; the last sweep was [09-22 run b](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-22b.md)).

| Detector | Result | vs. 09-22b |
|---|---|---|
| `generate-interface-map:dry` | 7 LEAKED + 1 PARTIAL, 141 contracts | **Unchanged**: same seven LEAKED rows |
| `sweep:rank-reach` | PASS: 60 reachable, 0 blocked, 13 apex holders at tick 900 | **Unchanged** |
| `check:process` | exit 0. Die-B floors VACUOUS (10 briefs, previously 9). Wiki freshness, systems inventory, setting coverage and plans index are all up to date | Unchanged. The Linear-keyed sub-checks need `LINEAR_API_KEY`, which is unset. They are **not reported clean** |
| `check:canon-staleness` | 32 warnings | **Unchanged** (32 → 32) |

`__DEBUG.validateTraitRefs()` is browser-only. It was not run and is not reported clean. There is no weekly test-suite pass today (Wednesday); the next one is 09-28.

### New finding (1), redundancy: "cursed" on a thing is about to be stored twice

[PR #1985](https://github.com/christianspliid-ui/threadbare/pull/1985) (THR-1521, not yet merged) adds `src/engine/artifactTraits.ts`. Its header says it is deliberately additive: *"the THR-661 `properties.cursed` flag keeps being written beside the edge."* After merge, one fact (this artifact is cursed) will live in two stores: the new `has_trait → trait.artifact.cursed` edge, and the old `properties.cursed` flag. The flag is read by `ascendantExpression.ts`, `conditionProxyEvents.ts`, `graphOpExecutor.ts`, `seedAttachments.ts` and `unifiedActionResolution.ts`, among others. Both stores can be reached, so no reachability sweep will ever flag the pair. Any writer that later clears one store and not the other makes the readers disagree without any error.

This is a **judgement call, not a defect**. The dual-write follows NFP #6 (additive) on purpose, and within a single slice it is the right call. What is missing is a scheduled retirement: nothing records which store is canonical or when the flag's readers move to the edge. **Not filed** (process-work throttle, and the owning PR is still open). The right place for it is a `Deferral` from THR-1521's own closeout, or from the traits-wave follow-up. Recorded here so it is not rediscovered cold.

**Redundancy: assessed this sweep**, limited to the one probe above. The newest engine module was the likeliest place for a fresh duplicate.

**Stalled work: 0.** THR-1521 has one `Ready for Dev → In Dev` transition, below the threshold of 3. It is now building normally.

**In Design: 1 live, 0 excluded** (THR-1525, unassigned, ~1d, counted).

**Open PRs: 1.** #1985 has auto-merge armed and `Test · Typecheck · Build` in progress. Yesterday's armed-on-red shape (PR #1981) resolved: it merged. `main` is green (`CI success` on `4896c726`).

## Escalations

None. Nothing was parked and no Discord message was sent. The builder recovered without intervention, so there is nothing to push through a second channel. **Zero Linear writes this run.**
