---
lane: tb-orchestrator
duty: test-suite-health
run: 2026-10-19 (weekly, ORCH_TESTHEALTH_DOW)
deadCoverageCandidates: 2 new, 4 carried, 0 resolved (+15 already ticketed under THR-1991)
slowFilesReported: 10
ticketsFiled: 0
---
# Test-suite health — weekly pass, 2026-10-19

Eleventh run of the duty (THR-942). The previous pass was [2026-10-12](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-10-12.md).

**Suite: 1666 files, 25043 tests, all passed, 0 failed, 0 skipped.** That is +85 files and +872 tests over the week. The run was `npx vitest run --reporter=json` (all four projects, `heavy` included) against `main` @ `de68cb60`, the same command as last week. Summed file time was **3755.9s** against 2101.9s last week (+79% for +5.4% more files).

- **Most of that growth is one file** (see § 2): `armyLongevity.heavy.test.ts` alone is 1081.4s. Without it the sum is 2674.5s (+27%), and stable files ran ~1.3× last week's times (`numericPropertyIntegrity` 133.5 → 180.8s), so the machine was contended again. Absolute durations are inflated; compare on ranks and shares.
- **Last week's timeout did not recur.** `doomIdentityMilestones.test.ts` passed and fell out of the top 13.
- **The deliberate skip is gone.** `engagementWindow.invariant.test.ts` no longer carries the THR-1575 `it.skip` ("masters attempt harder content than experts"); the suite reports 0 skipped.

## 1. Dead-coverage candidates

Method unchanged for the new-file pass: every test file added since `f19ce3ab` (main at the 10-12 pass), its static / re-export / dynamic / side-effect / `vi.mock` subjects, a reverse index of **runtime** production importers across `src/`, `scripts/` and the root configs; `import type` importers counted apart; test-only modules and entry points excluded.

```
new test files since f19ce3ab (2026-10-12):          141
subject edges examined:                              865
unique subjects:                                     390
subjects with ZERO runtime production importers:     4 raw → 0 after reading the imports
```

The 4 raw hits all fall to the documented traps: `engine/wheel.ts` and `engine/views/subjects/subjectTypes.ts` are imported by the new tests as `import type` only (trap 2, on the test side); `ascendant-bar/selectors.ts` is a re-export shim over the live `engine/views/subjects/godSheet.ts`; `data/sublocation-concept-art.ts` is real but already on THR-1991's list.

**Added this week: a whole-suite pass for modules that lost their last importer.** THR-1912 (Inspector S4, merged 2026-10-18) deleted the retired sheets, so the question this week was which *existing* tests now cover orphaned code. 17 modules had at least one production importer at `f19ce3ab` and have none at `de68cb60`. **15 of them are already THR-1991's list** (`EncounterLog`, `GuildQuestPanel`, `NotableLine`, `RecentActivityLog`, `StorySoFarPanel`, `chronicle/explorationHooks`, `chronicle/index`, `companionWords`, `encounterHandoff`, `hooks/useTargetActions`, `ruins/PlaceOfPowerInspector`, `data/sublocation-concept-art`, `engine/archetypeEpithet`, `lib/polygonLayout`, `utils/portraitCompositor`) and its Done-when already says "deleted with its tests". **Two are new and on no ticket:**

| New candidate | Evidence | Shape |
|---|---|---|
| `src/components/HexMapV2/scene/fogShader.ts` + `scene/__tests__/fogShader.test.ts` | THR-1902 (`69baa1b8`, 2026-10-15) rewrote the parchment fog inside `FogOverlayMesh.ts` and dropped both importers (`HexMapV2.tsx:97`, `FogOverlayMesh.ts:23` at `f19ce3ab`). `FOG_VERTEX_SHADER`, `FOG_FRAGMENT_SHADER`: 0 references outside the file. `PARCHMENT_FOG_CONSTANTS`: one hit, a stale comment in `hooks/useFogCulling.ts:11`. | **Dead coverage in full.** The test (44 lines) covers only the dead module (71 lines). Delete both and fix the comment |
| `src/components/Game/hexMapAgentVisibility.ts` | A 2-line re-export shim ("kept as a re-export for existing importers") over `src/engine/views/map/agentVisibility.ts` (THR-1822). Its one production importer, `GameView.tsx:313`, went in THR-1822 (`67082444`). Only `src/engine/__tests__/spotlightPull.test.ts:38` still imports through it, and `scripts/interface-contracts.ts` lists the shim as a spotlight-contract `readSite`. | **Not dead coverage** (the function is live). Repoint the test to `engine/views/map/agentVisibility`, swap the contract `readSite` for `src/engine/views/map/agents.ts`, delete the shim |

**Not reported as candidates (honest limit):** the whole-suite pass also lists 23 standing modules with no runtime production importer by its grep (for example `engine/stealth.ts`, `engine/lakeGeneration.ts`, `engine/actionCandidates.ts`, `engine/socialOutcome.ts`, `components/Game/NarrativeFeed.tsx`, `components/Game/AttachmentRow.tsx`). These predate this week and were never in the new-file method's scope. The grep cannot see a `.ts`-extension import, so some may be live. They need the full import read before anyone calls them dead; next week's pass reads them one by one rather than dumping them here.

### Carried candidates (re-verified)

| Carried candidate | Re-verified this pass | Status |
|---|---|---|
| `getAgentWheelSlots` in `src/engine/wheel.ts` | Still 0 runtime production importers; only comments mention it (`useAgentInteraction.ts:209`, `unified-action-templates.ts:5797`). `wheel.test.ts`, `actionCardRedesign-integration.test.ts`, `delivery-integration.test.ts` still present | Unchanged (the last is **mixed**: keep its delivery/dream assertions) |
| `src/engine/effectScope.ts` (`resolveScope`) | Still 0 importers outside `effectScope.region.test.ts` | Unchanged (THR-1155 slice 1, missing consumer) |
| `RULE_OVERRIDE_MAX_PER_HEX` | Still only `effect-constants.ts:97` and the CMS slider at `tunableConstants.ts:1288` | Unchanged. **Still the one item that is a fix, not a judgement call** |
| `src/composition-dsl/harness.ts` | Still 0 importers | Unchanged (THR-952) |
| `src/data/terrain-overlays.ts` | Still referenced only by `effectConsolidation.test.ts` | Unchanged |

**Nothing was deleted here.**

## 2. Slowest test files: top 10

The top 10 take **64.9%** of summed file time (49.0% last week). The jump is one file.

| # | Duration | Share | Tests | File | vs. 2026-10-12 |
|---|---|---|---|---|---|
| 1 | 1081.4s | 28.8% | **1** | `src/engine/__tests__/armyLongevity.heavy.test.ts` | **NEW** (THR-1973, added 2026-10-18) |
| 2 | 279.8s | 7.4% | 3 | `src/engine/__tests__/journeyKeepsGoal.test.ts` | **NEW to top 10** (65.3s last week; THR-1930 widened it 10-15) |
| 3 | 180.8s | 4.8% | 7 | `src/engine/__tests__/numericPropertyIntegrity.test.ts` | #1 → #3 |
| 4 | 171.2s | 4.6% | **1** | `src/engine/__tests__/arrivalCommitmentBoard.test.ts` | #2 → #4 |
| 5 | 147.0s | 3.9% | 17 | `src/engine/__tests__/edgeIntegrity.test.ts` | #3 → #5 |
| 6 | 139.8s | 3.7% | 9 | `src/engine/__tests__/engagementWindow.invariant.test.ts` | #4 → #6 |
| 7 | 125.6s | 3.3% | **1** | `src/engine/__tests__/thr1779-chapterSeamSweep.test.ts` | #6 → #7 |
| 8 | 109.7s | 2.9% | **1** | `src/engine/__tests__/premonitionGateChain.test.ts` | #5 → #8 |
| 9 | 105.8s | 2.8% | 14 | `src/engine/__tests__/content-layer1-integration.test.ts` | #9 → #9 |
| 10 | 97.0s | 2.6% | 10 | `src/engine/__tests__/traceBuffer-integration.test.ts` | #11 → #10 |

`debugTickBatch` (#7 → #13) and `encounter-liveness.contract` dropped out; `doomIdentityMilestones` dropped out. `appointment-generatedWorld` (87.3s) and `tickHealth-integration` (86.2s) sit just below the cut.

**`armyLongevity.heavy.test.ts` is the finding of the week, as a cost, not a deletion candidate.** It drives the seed-42 medium world 90 days (1 080 ticks) in one `it`, with `BUDGET_MS = 40 * 60_000`. Its own header says "~10 min locally". The **Heavy simulation tests** CI job went from ~22 min (seven sampled runs 2026-10-17 12:08Z → 2026-10-18 08:00Z) to 31 min (2026-10-18 14:29Z) and **40.5 min** (2026-10-19 08:51Z, [run](https://github.com/christianspliid-ui/threadbare/actions/runs/39225799118)) against the job's `timeout-minutes: 45` (`.github/workflows/heavy-tests.yml:67`). Every run is still green, but the job now has about 10% headroom. The shapes that would buy it back (a shorter horizon with the same predicate, or a smaller world) are an executor's judgement — the test is the only proof of THR-1973's Done-when.

**Cost-per-test outliers.** Twelve files spend more than 10s on 2 tests or fewer (ten last week): new are `armyLongevity.heavy` (1081.4s) and `premonitionSteer.integration` (15.6s); `undertakingPortent.live` (13.8s) is back over the bar; `journeyKeepsGoal` left the list because it now has 3 tests. As before, these are generated-world liveness tests. **They rank work. They are not deletion candidates.**

## 3. Duplicated coverage

**Assessed at the structural level only; nothing found.** Same method and limit as before: assertion-level overlap needs coverage instrumentation, which the no-new-tooling charter rules out. One related note: `sheetParity.test.ts` and `sheetParity.s2b.test.ts` both import `SubjectHeaderVM` and both pin field homes, but split by subject (person vs. place/faction/army/artifact), so they partition rather than overlap.

## Tickets filed

**None.** The weekly retro is the single promotion point, and the THR-1946 freeze holds. Nothing was deleted.
