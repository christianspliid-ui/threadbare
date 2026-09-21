---
lane: tb-orchestrator
duty: test-suite-health
run: 2026-09-21 (weekly, ORCH_TESTHEALTH_DOW)
deadCoverageCandidates: 3
slowFilesReported: 10
ticketsFiled: 0
---
# Test-suite health — weekly pass, 2026-09-21

Seventh run of the duty (THR-942). The previous pass is [2026-09-07](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-09-07.md) — **two weeks ago, not one**: no pass exists for 2026-09-14, so every week-on-week figure below is a **fortnight** and is labelled as such rather than quietly compared against a one-week baseline. That is the second consecutive skipped week in this duty's history; the cause is not recorded in the ops archive and is worth one line at the retro.

Suite: **1307 files, 20839 tests, all passing**, `npx vitest run --reporter=json` exit 0 (all projects including the `heavy` lane — same command as the baseline, so the comparison is like-for-like). Growth over the fortnight: **+125 files, +1323 tests**.

Two things to read this pass for: **summed file time grew 33.7% while the file count grew 10.6%**, and the dead-coverage method turned up **a module that is green on the interface map and has no caller at all**.

## 1. Dead-coverage candidates

Method unchanged from prior passes, per the duty's no-new-tooling charter: resolve every relative import in each new test file to a tracked repo path to get its *subjects*, build a reverse index of production (non-test) importers across all tracked `.ts`/`.tsx`, then check `package.json` and the entry-point list before flagging anything. The import regex covers static imports, `export … from`, and dynamic `import()` — the fifth trap added last pass.

```
new test files since 644bc113 (2026-09-07):  124
subject edges examined:                      771
unique subjects:                             253
subjects with ZERO production importers:       4
new test files with no local subject import:   3
```

### Of the 4 flags, 1 is genuine and 3 are trap 4

| Flagged subject | Verdict |
|---|---|
| **`src/engine/effectScope.ts`** | **Genuine candidate, and the most interesting result this pass.** See below |
| `scripts/classify-diff.ts` | **Live — trap 4.** `package.json` `classify:diff`; CLAUDE.md makes it the first step of every diff classification |
| `scripts/generate-undertaking-grid.ts` | **Live — trap 4.** `package.json` `generate-undertaking-grid` + `:check`, the latter inside `check:process` |
| `scripts/retro-draft.ts` | **Live — trap 4.** `package.json` `retro:draft` |

Trap 4 (a `package.json` entry point an import graph cannot see) accounts for three of four flags, for the fifth consecutive pass. The three new test files with no local subject import are all deliberate: two `*.readsites.test.ts` shape tripwires that grep the tree rather than import it, and `check-authoring-brief-floor.test.ts`, which shells out.

### The genuine candidate — `src/engine/effectScope.ts`

**The dead thing is the tested code, not the test — and the module is badged green.**

`resolveScope` is the function that turns an effect's declared scope into a concrete set of hexes. Repo-wide, the symbol appears in exactly two files:

```
src/engine/effectScope.ts:63                      export function resolveScope(
src/engine/__tests__/effectScope.region.test.ts   import { resolveScope } from '../effectScope';   (3 call sites)
```

**Zero production callers.** 292 lines, last touched 2026-09-10 by THR-1155 slice 1, which rewrote `effectScope('region')` from a radius-4 disc into real Area membership and tested it against a fixture where the two answers disagree in both directions. That work is correct. Nothing calls it.

**Why no detector caught it.** `src/engine/effectScope.ts` is a declared **read site** of the `area-partition-to-map` contract (`scripts/interface-contracts.ts:175`), and that row is 🟢 LIVE. The badge is earned honestly — effectScope genuinely does read `areaProjection`. But the contract measures effectScope as a *consumer of the partition*, and has nothing to say about whether anything consumes **effectScope**. A module can be a live reader of an upstream contract and still be a dead end. This is the redundancy/unreachability shape the duty owns precisely because no script sees it.

**Two CMS tunables are inert behind it.** `src/components/CMS/tunableConstants.ts` exposes both of these to a designer with a slider and a stated consumer:

| Constant | CMS-stated consumer | Actual readers |
|---|---|---|
| `SCOPE_REGION_MAX_HEXES` | `effectScope → region resolution` | `effectScope.ts` only — which nothing calls |
| `RULE_OVERRIDE_MAX_PER_HEX` | `effectScope → rule override resolution` | **none anywhere** — `effectScope.ts` does not even reference it |

So the CMS advertises two levers that cannot move anything in a running game. That is an NFP #1 (tunability) defect on the surface whose whole job is tunability, and it is the part of this finding with a player-facing consequence.

**Disposition — candidate, not a deletion.** The executor's decision is the same fork as `terrain-overlays`: either scope resolution is meant to be wired into the effect pipeline (in which case the finding is a **missing consumer**, and deleting would destroy the work THR-1155 just did), or the module is residue from a spell system that never landed. Given THR-1155 invested in it eleven days ago, *missing consumer* is the more likely reading and deletion would be the wrong move. The `RULE_OVERRIDE_MAX_PER_HEX` row is separable and simply false today.

### The carried candidates — one resolved itself, three unchanged

| Carried candidate | Re-verified this pass | Status |
|---|---|---|
| **`AgentDetailPanel` unit** | **Gone.** `src/components/Game/AgentDetailPanel.tsx` and `src/engine/activitySummary.ts` are both untracked as of this pass — deleted since 09-07. The only surviving mentions are comments in sibling tests explaining that the panel *was* unmounted and is now deleted | **Resolved — drop from the carry list.** Trap 2 (the type-only island) no longer has an instance |
| **SceneStatePanel cluster** | `src/components/Game/Encounter/SceneStatePanel.tsx`, 168 lines, last touched 2026-05-07. Repo-wide search for `SceneStatePanel` still returns exactly three paths: the component, its test, its snapshot. **Zero importers of any kind** | Unchanged, now 4½ months cold. Retire-or-wire is still **THR-964**'s call |
| **`src/composition-dsl/` sub-island** | `schema.ts` has 13 production importers, only **3 runtime** (`validator.ts`, `CompositionView.tsx`, `types/gameState.ts`); the other 10 are type-only. `harness.ts` still has **0** of any kind, 33 lines, last touched 2026-04-20 | Changed from last pass — `CompositionView.tsx` is back in the runtime importer set, so the island is *less* dead than 09-07 recorded. **Re-verify before acting.** THR-952's decide-as-a-whole-unit rule still applies |
| **`src/data/terrain-overlays.ts`** | Still **0 production importers**; `TERRAIN_OVERLAY_DEFINITIONS` still read only by `effectConsolidation.test.ts`, still two self-consistency assertions | Unchanged. Same missing-consumer-vs-residue fork as `effectScope` |

**New trap for the standing list, hit by this pass's own method: a deleted file and a dead file are indistinguishable to a reverse importer index.** `AgentDetailPanel.tsx` and `activitySummary.ts` both reported "0 production importers" — because they are not in the tree at all, so the index simply has no row for them. The method printed the same result it would have printed for a live-but-unreferenced file. This pass caught it only because the carried-candidate step re-checks `git ls-files` per path. **Confirm a flagged subject still exists before reporting it as dead.** That is now the sixth trap, alongside test-only helpers, type-only imports, filename-vs-imports, `package.json` entry points, and dynamic `import()`.

## 2. Slowest test files — top 10

Full local run, 1307 files, 20839 tests, all passing. Summed file time **729.1s** (was 545.4s on 09-07, **+33.7%** over the fortnight against +10.6% file growth). The top 10 alone account for **53.2%** of summed file time.

| # | Duration | Share | Tests | File | vs. 2026-09-07 |
|---|---|---|---|---|---|
| 1 | 64.1s | 8.8% | 7 | `src/engine/__tests__/numericPropertyIntegrity.test.ts` | **NEW** (added 2026-09-11) |
| 2 | 53.7s | 7.4% | 17 | `src/engine/__tests__/edgeIntegrity.test.ts` | #1 → #2 (58.5s → 53.7s) |
| 3 | 48.0s | 6.6% | **1** | `src/engine/__tests__/premonitionGateChain.test.ts` | #2 → #3 (41.1s → **48.0s**) |
| 4 | 45.1s | 6.2% | 14 | `src/engine/__tests__/content-layer1-integration.test.ts` | #4 → #4 (33.4s → 45.1s) |
| 5 | 34.8s | 4.8% | 7 | `src/engine/__tests__/debugTickBatch.test.ts` | #5 → #5 (28.2s → 34.8s) |
| 6 | 30.7s | 4.2% | 10 | `src/engine/__tests__/traceBuffer-integration.test.ts` | #7 → #6 |
| 7 | 30.2s | 4.1% | 8 | `src/engine/__tests__/doomIdentityMilestones.test.ts` | #3 → #7 (37.5s → 30.2s) |
| 8 | 29.9s | 4.1% | 3 | `src/engine/__tests__/contracts/encounter-liveness.contract.test.ts` | **NEW to top 10** (file dates to 2026-03-30) |
| 9 | 26.8s | 3.7% | **1** | `src/engine/__tests__/undertakingCapabilityGrowth.live.test.ts` | **NEW** (added 2026-09-08) |
| 10 | 24.4s | 3.3% | 3 | `src/engine/__tests__/contracts/agent-decision-pipeline.contract.test.ts` | #6 → #10 |

**Cost-per-test outliers — five files spend >10s to run ≤2 tests:**

| Duration | Tests | File |
|---|---|---|
| 48.0s | 1 | `premonitionGateChain.test.ts` |
| 26.8s | 1 | `undertakingCapabilityGrowth.live.test.ts` |
| 15.7s | 1 | `undertakingCheckpointLiveness.test.ts` |
| 11.0s | 1 | `pathfindingSingleSource.heavy.test.ts` |
| 11.0s | 1 | `GameView-momentCard.test.tsx` |

Together: **112.5s, 15.4% of summed file time, for 5 assertions.** Every one is a *liveness* test that drives a real world for many ticks, which is exactly the shape this repo's anti-vacuity discipline asks for — a cheap version of any of these would be the vacuous-probe failure the impediment log records repeatedly. **These are ranking information, not deletion candidates.** `premonitionGateChain` grew 17% in a fortnight while doing the same single assertion, which is the only number here worth watching.

**Reminder of the guardrail, because the two lists sit next to each other:** nothing in section 2 is grounds for deleting anything. A prune ticket must prove the *tested code* is dead; slowness only ranks work.

## 3. Duplicated coverage

**Assessed, and nothing found — but say honestly what the method can see.** Two passes:

- **Shared-subject count.** The modules imported by the most distinct test files are `src/engine/graph.ts` (586), `src/types/gameState.ts` (339), `src/types/unifiedAction.ts` (229), `src/engine/traceBuffer.ts` (181). These are the repo's hot files; a test importing `graph.ts` is building a world, not asserting on graph. **This measures fixture dependency, not assertion overlap**, and reporting it as duplication would be the "green check on an uncovered condition" the duty forbids.
- **Subject-stem clustering.** 8 clusters of 3+ test files share a subject stem. The largest is `graphOpExecutor` (11 files), then `encounterAftermath` (4), then six clusters of 3. **Every cluster is facet-named** — `graphOpExecutor.artifactTier`, `.drawTogether`, `.essenceSources`, `.tradeVerbs` — which is deliberate partitioning of a large surface, the healthy pattern, not duplication.

**What this pass could not see: assertion-level overlap.** Two files can assert the same behaviour through different subjects and neither method above would notice. Detecting that needs either coverage instrumentation or reading the assertions, and the duty's no-new-tooling charter rules out the first. **Duplicated coverage is therefore assessed at the structural level only**, and the honest verdict is *no structural duplication found*, not *no duplication exists*.

## Tickets filed

**None**, per the process-work throttle (CLAUDE.md § Continuous Improvement, Christian's direction 2026-08-10): scheduled lanes log findings, and the **weekly retro is the single promotion point**. The duty's own guardrail still binds — nothing here was deleted, and each candidate is carried with the import-graph evidence a prune ticket would need.

The one item worth the retro's attention above the others is **`RULE_OVERRIDE_MAX_PER_HEX`**: it is not a judgement call like the other candidates, it is simply a CMS control with no reader, and the fix is a deletion or a wiring rather than a design decision.
