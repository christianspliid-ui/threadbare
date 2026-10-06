# Why masters skip master work — THR-1742 (pickup lane, 2026-10-06)

**Question.** The invariant rung "masters attempt harder content than experts" stays skipped (`src/engine/__tests__/engagementWindow.invariant.test.ts`). THR-1740's window re-plan moved every other rung and left this one flat. Masters choose master-band content under 9% of the time and novice work about 60% of the time. Is master work **absent** from their board, **cut** before scoring, or **present and outscored**?

**Answer: cut by the cap, because there is so little of it.**

- **Not absent.** All 185 master free choices on seeds 42/99/7 had master-band work within reach, in a reach where the decider is a master. The world instances all eight THR-1688 templates, 187–242 instances per seed.
- **Not filtered.** That work passes awareness, visibility, prerequisites, reputation, outgrowth, story breath and threat untouched (3.09 own-master entries per decision, before and after).
- **Cut by the cap.** `capWithDiversity` (`src/engine/encounterFilterPipeline.ts`) leaves 0.23 entries per decision. It removes the last one on 136 of 185 decisions, so only 20.5% of master decisions score any own-master work. The cap's fill takes one entry per template before repeats, and its fair own-hex draw (THR-1687) gives each template about the same chance: an own-master template survives with **q = 0.215**, among a median 202 candidate templates. With one template per reach, that is one chance in five.
- **The decision board reads only the scorer's top five** (`decision.topCandidates`, `phaseAgentDecision.ts`). At today's volume almost all scored master work makes that list (t = 0.95), so **19.5%** of master boards hold any.
- **Present and not chosen, about half the time.** On the board, masters take it 8.6 times for every 10.8 times they pass it over (44%). The committed winner is usually novice work (15 of 20). It beats the master work on value per tick, desire (median ×1.46) and window fit (0.945 against 0.806). The master work's forecast sits at the window's low edge (median 0.50, against the winner's 0.65).

## Would more master work on the board carry the rung?

These counterfactual probes were never shipped. The cap additionally keeps each own-master template with chance *p*, or keeps all of it. "On the board" means the board's top list.

| arm | scored | **on the board** | masters choose master work | master mean attempted (42 / 99 / 7) | expert mean attempted (42 / 99 / 7) | rung |
|---|---|---|---|---|---|---|
| shipped `main` | 20.5% | **19.5%** | 8.6% | 0.241 / 0.295 / 0.252 | 0.290 / 0.282 / 0.264 | fails 42, 7 |
| keep *p* = 0.35 | 44.0% | **34.2%** | 12.5% | 0.300 / 0.311 / 0.290 | 0.290 / 0.291 / 0.276 | passes, margin ≤ 0.02 |
| keep *p* = 0.45 | 59.5% | **42.9%** | 16.1% | 0.315 / 0.331 / 0.289 | 0.304 / 0.306 / 0.268 | passes, margin ≤ 0.03 |
| keep *p* = 0.54 | 57.6% | **46.2%** | 17.9% | 0.326 / 0.283 / 0.311 | 0.280 / 0.324 / 0.271 | **fails 99** |
| keep all | 76.2% | **55.6%** | 20.6% | 0.325 / 0.380 / 0.369 | 0.295 / 0.294 / 0.261 | passes, margin 0.03–0.11 |

With about 50 master engagements per seed, the band means move by ±0.03 between arms. Between ~34% and ~46% on the board the rung flips on noise. It passes with margin only near the keep-all ceiling, about 56% on the board.

Once master work is plentiful, the scorer's top-five shortlist becomes a second cut: t falls from 0.95 to 0.72–0.80. Even keeping all of it puts master work on 56% of boards, not 76%.

## The brief — how many master templates per reach would carry it

Under the THR-1627 stop rule (plan § D4), counts are ceilings the gauge may undercut.

The projection gives the scored share for K own-master templates per reach as `1 − (1 − q_K)^K`. Here `q_K` is q diluted by eight additions per batch to the ~202-template draw; at K = 1 it gives 0.21 against 20.5% measured. The board share is that times t, which is 0.95 at today's volume and ~0.75 once master work is plentiful (probe-measured).

| K per reach | new encounters | projected scored | projected on the board (t 0.75–0.95) | reading against the probes |
|---|---|---|---|---|
| 2 | 8 | 0.37 | 0.28–0.35 | at or below the narrowest passing arm |
| 3 | 16 | 0.49 | 0.37–0.47 | inside the noise band |
| **4** | **24** | **0.57** | **0.43–0.54** | **earliest the rung may pass** (coin flip on 99) |
| 5 | 32 | 0.64 | 0.48–0.61 | |
| 6 | 40 | 0.69 | 0.52–0.66 | |
| **7** | **48** | **0.74** | **0.56–0.70** | **passes with margin** (at or past keep-all) |

The projection is conservative in one direction. Distinct new templates would also ease the cooldown cut, which removed own-master work on 17.5% of keep-all decisions; the probe's repeated templates could not ease it.

**Brief.** Run batches of eight master everyday encounters, one per reach, under the existing master brief's binding rows (`Docs/plans/encounters/master-everyday-brief.md`: steps 0.72–0.85, `rarityTier 2`, `scale 'local'`, settlement subtypes, no rule gates). Re-measure with this reader after each batch, and stop when the rung passes on 42 and 99. Expect three to six batches.

**The cheaper alternative.** A cap reserve for work in the band the decider stands in would sit beside Phases 1b–1f and reach the keep-all ceiling (~56% on the board) with no content. It is a shortlist reserve, not a difficulty floor or actor-scaled difficulty. Whether it counts as tuning to make the rung pass is a design call.

Both routes go to [THR-1757](https://linear.app/threadbare/issue/THR-1757) for the design lane to choose. The rung stays skipped with `TODO(THR-1757)`. Nothing was tuned here.

## Method

- **Base:** `origin/main` @ `f23f37e4` (THR-1740 merged). The world is the gameplay-report construction, the same one the invariant test runs: `generateArchetypes(4, seed)[0]`, balanced cosmology, medium map, `runTick` × 120, seeds 42/99/7.
- **Reader:** `Docs/audits/2026-09-25-living-world-data/readers/master-band.ts`, built by `master-band.build.mjs`. Its hooks are read-only:
  - before `scoreAndSelect` (pool, filtered, eligible);
  - after each filter-pipeline stage;
  - on the scorer's full ranked list;
  - before `scoreUnifiedBoard` (the board's top list).
- **"Master" decider:** the KPI's own definition, capability ≥ 0.85 in the chosen work's reach. "Own-master work" means content band master (`windowFitBandFor`) in a reach where the decider is a master. The "winner" is the entry the mortal committed to, not the scorer's top.
- **Behaviour-neutral proof:** the `--no-trace` arm's ledger sha1 equals the traced arm's on every seed (`4b579e93e670`, `13b56dca90f0`, `5089aa9ebfc6`).
- **Probe build:** `.cache/master-band-keep.mjs` patches the cap's return to append own-master entries (`__MB_KEEP`). With `--keep-p`, each template is kept with a deterministic per-(agent, tick, template) hash chance.
- **Review gate round 1** found that the first draft counted "scored" as "on the board" and took the scorer's top as the winner. Both are fixed above, and every arm was re-run.
- **Raw output:** `Docs/audits/2026-09-25-living-world-data/output/master-band-2026-10-06-thr1742.txt`.

Reproduce:

```
node Docs/audits/2026-09-25-living-world-data/readers/master-band.build.mjs
node .cache/master-band.mjs 42,99,7 120
node .cache/master-band.mjs 42,99,7 120 --no-trace
node .cache/master-band-keep.mjs 42,99,7 120 [--keep-p 0.45]
```
