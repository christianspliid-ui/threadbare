# Why masters skip master work — THR-1742 (pickup lane, 2026-10-06)

**Question.** The invariant rung "masters attempt harder content than experts" stays skipped (`src/engine/__tests__/engagementWindow.invariant.test.ts`). THR-1740's window re-plan moved every other rung and left this one flat. Masters choose master-band content under 9% of the time and novice work about 60% of the time. Is master work **absent** from their board, **cut** before scoring, or **present and outscored**?

**Answer: cut, by the cap, because there is so little of it.**

- **Not absent.** Every master decision had master-band work in a reach the decider is a master in, and it was within reach (100% of 185 master free choices on seeds 42/99/7). The world instances all eight THR-1688 templates, 187–242 instances per seed.
- **Not filtered.** That work passes awareness, visibility, prerequisites, reputation, outgrowth, story breath and threat untouched: 3.09 own-master entries per decision before and after.
- **Cut by the cap.** `capWithDiversity` (`src/engine/encounterFilterPipeline.ts`) leaves 0.23 entries. It removes the last own-master entry on 136 of 185 decisions, so only **20.5%** of master boards hold any. The fill takes one entry per template before repeats, and its fair own-hex draw (THR-1687) gives each template about the same chance. Each own-master template survives with **q = 0.215** among a median 202 candidate templates. One template per reach therefore means one chance in five.
- **Present and outscored, sometimes.** When own-master work is scored, masters take it about 4 times in 10. The winner beats it on value per tick and a slightly better window fit. Its forecast sits at the window's low edge (median 0.52 against the winner's 0.56).

## Would more master work on the board carry the rung?

These are counterfactual probes, never shipped. The cap additionally keeps each own-master template with chance *p*, or all of it.

| arm | own-master on board | masters choose master work | master mean attempted (42 / 99 / 7) | expert mean attempted (42 / 99 / 7) | rung |
|---|---|---|---|---|---|
| shipped `main` | 20.5% | 8.6% | 0.241 / 0.295 / 0.252 | 0.290 / 0.282 / 0.264 | fails 42, 7 |
| keep *p* = 0.35 | 44.0% | 12.5% | 0.300 / 0.311 / 0.290 | 0.290 / 0.291 / 0.276 | passes, margin ≤ 0.02 |
| keep *p* = 0.45 | 59.5% | 16.1% | 0.315 / 0.331 / 0.289 | 0.304 / 0.306 / 0.268 | passes, margin ≤ 0.03 |
| keep *p* = 0.54 | 57.6% | 17.9% | 0.326 / 0.283 / 0.311 | 0.280 / 0.324 / 0.271 | **fails 99** |
| keep all | 76.2% | 20.6% | 0.325 / 0.380 / 0.369 | 0.295 / 0.294 / 0.261 | passes, margin 0.03–0.11 |

With about 50 master engagements per seed, the band means move by ±0.03 between arms. Between 44% and 60% on-board the rung flips on noise. It passes with margin only near the keep-all ceiling.

## The brief — how many master templates per reach would carry it

The THR-1627 stop rule (plan § D4) counts are ceilings the gauge may undercut. Projection: K own-master templates per reach give `1 − (1 − q_K)^K` on-board. Here `q_K` is q diluted by the eight-per-batch additions to the ~202-template draw. At K = 1 the projection gives 0.21, against 20.5% measured.

| K per reach | new encounters | projected on-board | reading against the probes |
|---|---|---|---|
| 2 | 8 | 0.37 | below every passing arm |
| 3 | 16 | 0.49 | inside the noise band |
| **4** | **24** | **0.57** | **earliest the rung may pass** (coin flip on 99) |
| 5 | 32 | 0.64 | |
| 6 | 40 | 0.69 | |
| **7** | **48** | **0.74** | **passes with margin** (keep-all territory) |

The projection is conservative in one direction. Distinct new templates would also ease the cooldown cut, which removed own-master work on 17.5% of keep-all decisions.

**Brief.** Run batches of eight master everyday encounters, one per reach, under the existing master brief's binding rows (`Docs/plans/encounters/master-everyday-brief.md`: steps 0.72–0.85, `rarityTier 2`, `scale 'local'`, settlement subtypes, no rule gates). Re-measure with this reader after each batch and stop when the rung passes on 42 and 99. Expect three to six batches.

**The cheaper alternative.** A cap reserve for work in a band the decider stands in would sit beside Phases 1b–1f and reach the keep-all ceiling with no content. It is a shortlist reserve, not a difficulty floor or actor-scaled difficulty. Whether it counts as tuning to make the rung pass is a design call.

Both routes go to [THR-1757](https://linear.app/threadbare/issue/THR-1757) for the design lane to choose. The rung stays skipped with `TODO(THR-1757)`. Nothing was tuned here.

## Method

- **Base:** `origin/main` @ `f23f37e4` (THR-1740 merged). World: the gameplay-report construction (`generateArchetypes(4, seed)[0]`, balanced cosmology, medium map, `runTick` × 120) on seeds 42, 99 and 7. This is the world the invariant test runs.
- **Reader:** `Docs/audits/2026-09-25-living-world-data/readers/master-band.ts`, built by `master-band.build.mjs`. It adds read-only hooks:
  - before `scoreAndSelect` in `phaseAgentDecision` (pool, filtered, eligible);
  - after each filter-pipeline stage;
  - on the scorer's full ranked list.
- **"Master" decider:** the KPI's own definition, capability ≥ 0.85 in the chosen work's reach. "Own-master work": content band master (`windowFitBandFor`) in a reach where the decider is a master.
- **Behaviour-neutral proof:** the `--no-trace` arm's ledger sha1 equals the traced arm's on every seed (`4b579e93e670`, `13b56dca90f0`, `5089aa9ebfc6`).
- **Probe build:** `.cache/master-band-keep.mjs` patches the cap's return to append own-master entries (`__MB_KEEP`; `--keep-p` keeps each template with a deterministic per-agent/tick/template hash chance).
- **Raw output:** `Docs/audits/2026-09-25-living-world-data/output/master-band-2026-10-06-thr1742.txt`.

Reproduce:

```
node Docs/audits/2026-09-25-living-world-data/readers/master-band.build.mjs
node .cache/master-band.mjs 42,99,7 120
node .cache/master-band.mjs 42,99,7 120 --no-trace
node .cache/master-band-keep.mjs 42,99,7 120 [--keep-p 0.45]
```
