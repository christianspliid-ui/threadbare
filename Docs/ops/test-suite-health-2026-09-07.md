---
lane: tb-orchestrator
duty: test-suite-health
run: 2026-09-07 (weekly, ORCH_TESTHEALTH_DOW)
deadCoverageCandidates: 5
slowFilesReported: 10
ticketsFiled: 0
---
# Test-suite health — weekly pass, 2026-09-07

Sixth run of the duty (THR-942). The previous pass is [2026-08-24](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-08-24.md) — **two weeks ago, not one**: no pass exists for 2026-08-31, and the machine was down 45 hours across 2026-09-05/06. Every week-on-week figure below is therefore a **fortnight**, and is labelled as such rather than quietly compared against a one-week baseline.

Suite: **1182 files, 19516 tests, all passing**, `npx vitest run` exit 0 (all projects, including the `heavy` lane — same command as the baseline, so the comparison is like-for-like). Growth over the fortnight: **+126 files, +2225 tests**.

Two things to read this pass for: a **single-test file that costs 7.5% of summed suite time**, and a **new false-positive trap in the dead-coverage method** that would have proposed deleting live debug-bridge code.

## 1. Dead-coverage candidates

Method unchanged from prior passes, per the duty's no-new-tooling charter: resolve every relative import in each new test file to a tracked repo path to get its *subjects*, build a reverse index of production (non-test) importers across all tracked `.ts`/`.tsx`, then check `package.json` and the entry-point list before flagging anything.

```
new test files since 2026-08-24:           133
subject edges examined:                    839
subjects with ZERO production importers:     5 (unique)
new test files with no local subject import: 0
```

### Of the 5 flags, 1 is genuine and 4 are method limits

| Flagged subject | Verdict |
|---|---|
| **`src/data/terrain-overlays.ts`** | **Genuine candidate — the only one.** See below |
| `src/types/worldRefAdapters.ts` | **Not a candidate — scaffolding, 10 days old.** Landed 2026-08-27 in `181df5b0` (THR-1212 slice 1). Its only importers are two test files, but it is mid-migration, not decayed |
| `src/engine/worldRefResolver.ts` | **Live — new trap, see below.** `src/debug-bridge.ts:2024,2037` imports it, via `await import()` |
| `scripts/check-guidance-freshness.ts` | **Live — trap 4.** `package.json` `check:guidance-freshness` and `:blocking`; THR-1256 is the open ticket to make it blocking |
| `scripts/stale-claim-sweep/index.ts` | **Live — a GitHub Action.** Its caller is a `.yml` workflow, which a `.ts`/`.tsx` import graph cannot see |

**New trap, worth adding to the standing list: a dynamic `await import()` is invisible to the import graph.**

```
src/debug-bridge.ts:2024   const { getWorldRefDrops }   = await import('./engine/worldRefResolver');
src/debug-bridge.ts:2037   const { clearWorldRefDrops } = await import('./engine/worldRefResolver');
```

`src/debug-bridge.ts` is on this duty's own entry-point list, so the subject is reachable from a real entry point by the duty's own rule — and the method still flagged it, because the regex matches `import … from '…'` and nothing else. Had this pass proposed the flag as a prune, it would have deleted the resolver behind two live debug-bridge levers. **Static-import absence is not absence of a caller.** That is now the fifth trap, alongside test-only helpers, type-only imports, filename-vs-imports, and `package.json` entry points.

The two `scripts/` flags are trap 4 doing its job for the fourth consecutive pass. Both were caught by hand here rather than by the automated `package.json` check, which is basename-matching and brittle — `stale-claim-sweep/index.ts` has the basename `index`, which matches nothing useful.

### The one genuine candidate — `src/data/terrain-overlays.ts`

**The dead thing is the tested code, not the test.** `TERRAIN_OVERLAY_DEFINITIONS` — the table describing each named terrain overlay's per-reach modifiers and behaviour effects — has exactly one importer in the repository, and it is the test that asserts on it:

```
src/data/terrain-overlays.ts:33        export const TERRAIN_OVERLAY_DEFINITIONS: Record<TerrainOverlayType, TerrainOverlayDefinition>
src/engine/effects/__tests__/effectConsolidation.test.ts:27   import { TERRAIN_OVERLAY_DEFINITIONS } from '../../../data/terrain-overlays';
src/engine/effects/__tests__/effectConsolidation.test.ts:303  expect(TERRAIN_OVERLAY_DEFINITIONS.warded?.type).toBe('warded');
src/engine/effects/__tests__/effectConsolidation.test.ts:304  expect(TERRAIN_OVERLAY_DEFINITIONS.shrouded?.type).toBe('shrouded');
```

Two assertions, and both check only that the table's key matches its own `type` field — a self-consistency check on a table nothing reads.

**The `TerrainOverlayType` union itself is live** — `src/types/effects.ts` and `src/types/trace.ts` both use it — so the *overlay concept* is wired even though the *definitions table* is not. That distinction is what makes this a candidate rather than a deletion: an executor must decide whether the overlays are meant to apply their `reachModifiers` (in which case the finding is a missing consumer, not dead data) or whether the table is residue.

Added 2026-03-31; last touched 2026-08-26 by `efbf1b2d` — *"one capability, one spelling — retire nine dead types, wire three inert ones"* — an effects-cleanup pass that went through this file and left the table unwired. **Five months old, and survived a cleanup that was specifically looking for this shape.**

**Not filed as a ticket** (process-work throttle: scheduled lanes log, the weekly retro promotes). It is carried here with the import evidence above, which is what a prune ticket would need.

### The 4 carried candidates — all re-verified against the tree, all unchanged

| Carried candidate | Re-verified this pass | Status |
|---|---|---|
| **SceneStatePanel cluster** | `src/components/Game/Encounter/SceneStatePanel.tsx` — a repo-wide search for the string `SceneStatePanel` returns exactly three paths: the component, its test, and its snapshot. **Zero importers of any kind outside its own test.** | Unchanged. Retire-or-wire is still **THR-964**'s call |
| **`AgentDetailPanel` unit** | Trap 2 still holds exactly: 1 production importer, `src/engine/activitySummary.ts`, and it is `import type`. `activitySummary.ts` itself has **0** production importers. A closed island, reachable on paper and dead at runtime | Unchanged |
| **`src/composition-dsl/` sub-island** | `schema.ts` has 11 production importers but only **1 runtime** one (`validator.ts`); the other ten are type-only, including `engine/phaseComposition.ts`, `engine/rival.ts`, `engine/notableAgendas.ts`. `harness.ts` still has **0**. **This is now a stronger candidate than last pass recorded** — the baseline's live-importer claim rested on `CompositionView.tsx`, which no longer appears in the importer set | Changed — re-verify before acting. THR-952's "decide as a whole unit" rule still applies |
| **THR-997** — reach-keyed `modifiers` on seeded `possesses` edges | `attachment-edge-modifiers` is still one of the 7 🔴 LEAKED rows on this morning's interface map | Unchanged |

## 2. Slowest test files — top 10

Full local `npx vitest run --reporter=json`, 1182 files, 19516 tests, all passing. Summed file time **545.4s**.

| # | Duration | Share | Tests | File | vs. 2026-08-24 |
|---|---|---|---|---|---|
| 1 | 58.5s | 10.7% | 17 | `src/engine/__tests__/edgeIntegrity.test.ts` | #2 → **#1** |
| 2 | 41.1s | 7.5% | **1** | `src/engine/__tests__/premonitionGateChain.test.ts` | **NEW** |
| 3 | 37.5s | 6.9% | 8 | `src/engine/__tests__/doomIdentityMilestones.test.ts` | #4 → #3 |
| 4 | 33.4s | 6.1% | 14 | `src/engine/__tests__/content-layer1-integration.test.ts` | #3 → #4 |
| 5 | 28.2s | 5.2% | 7 | `src/engine/__tests__/debugTickBatch.test.ts` | **#1 → #5** |
| 6 | 25.4s | 4.7% | 3 | `src/engine/__tests__/contracts/agent-decision-pipeline.contract.test.ts` | #5 → #6 |
| 7 | 23.2s | 4.2% | 10 | `src/engine/__tests__/traceBuffer-integration.test.ts` | #7 → #7 |
| 8 | 21.0s | 3.9% | 3 | `src/engine/__tests__/tickHealth-integration.test.ts` | #8 → #8 |
| 9 | 20.7s | 3.8% | 3 | `src/engine/__tests__/contracts/encounter-liveness.contract.test.ts` | #6 → #9 |
| 10 | 18.8s | 3.4% | 40 | `scripts/__tests__/check-wiki-freshness.test.ts` | **NEW** |

**The top 10 hold 56.4% of summed file time, down from 65.6%.** That is the most useful number in this section and it moved by 9 points in a fortnight. The suite added 126 files and the *tail* thickened faster than the head — concentration falling while absolute time rises means new cost is arriving broadly, not in one place. This reverses the trend the last three passes recorded.

**The entry worth naming: `premonitionGateChain.test.ts` — 41.1 seconds for one test, 7.5% of summed suite time.** It is the headless verification that shipped with THR-1414 (*"No premonition surfaced in ~280 ticks across four seeded runs"*, Done 2026-09-04), so a long seeded run is intrinsic to what it proves — a gate chain that only fires rarely cannot be verified in a short world. Recorded as a **measurement, not a complaint**: it is the highest cost-per-test file in the suite by a wide margin, which makes it the first place to look if the fast lane ever needs time back, and nothing more than that.

`debugTickBatch.test.ts` fell from #1 (47.8s, 12.7%) to #5 (28.2s, 5.2%) — a real drop, not a re-ranking artifact, and the largest single improvement this section has recorded. `worktree-write-guard.test.ts` more than doubled (8.0s → 18.0s) and now sits just off the list at #11.

**Absolute durations are again not comparable across passes.** This run overlapped the T3 detector batch, the same contention the last two passes recorded and recommended avoiding; the recommendation was again not followed, because both fit in one hourly slot. **Ranking and the share column are the comparable signals; the seconds are not.** Documented wall-time variance on this repo is up to 2.2×.

**None of these is a deletion candidate.** Standing rule, every pass: slowness ranks optimisation priority and is *never* grounds for deletion.

## 3. Duplicated coverage — not re-derived

The 2026-08-17 pass ruled this section undeliverable as chartered (assertion-level comparison across 1000+ files needs tooling this duty is forbidden to build) and recommended retiring it; 2026-08-24 restated that and handed the verdict to the weekly retro. **Nothing is re-derived here** — restating the same inability a sixth time is exactly the "trains its reader to skip it" failure the T3 charter warns against. The recommendation stands; the retro owns it.

## Guardrails observed

Nothing was deleted. No ticket was filed. No prune candidate is proposed on the grounds that its test is slow — sections 1 and 2 are kept strictly separate, and the one genuine candidate in section 1 is there because the *tested code* has no production reader, not because the test costs anything.
