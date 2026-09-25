# Raw data behind the living-world and content-coverage audit (2026-09-25)

The measurements behind `Docs/audits/2026-09-25-living-world-and-content-coverage.md`. They are kept so a later session can check any number in that audit, or re-run the reader and compare, instead of re-deriving the baseline. The audit is the summary. This folder is the evidence.

Measured on `main` @ `d6ff4070`. Seeds 42 and 99, medium map unless a file name says `small` or `large`. All runs are unattended (no player and no First) except the `attended-*` and `social-cap` files, which THR-1590 added on `main` @ `4aacaafc`.

## `output/` — what each file is

| File | Produced by | What it holds |
|---|---|---|
| `seeded-world.{txt,json}` | `npm run census:seeded-world -- --seeds 42,99 --map medium --ticks 150` | Every world-object kind at t0 and t150: objects, owned, owned by a deciding mortal; realm census |
| `ownership-t0.{txt,json}` | `npm run census:ownership -- --seeds 42,99 --map medium --ticks 0` | Owner edges per kind at t0 |
| `reachability.txt` | `npm run census:reachability -- --seeds 42,99 --ticks 40 --map medium` | Which kinds are reachable by any verb in 40 ticks |
| `cells.{txt,json}` | `npm run census:cells -- --seeds 42,99 --ticks 150 --map medium` | Undertaking cells started or finished, and refusals (65 · 91 starts) |
| `undertakings.txt` | `npm run census:undertakings` | The acceptance envelope; FAIL on starts per mortal |
| `firings.txt`, `firings-combined.json` | `npm run census:firings -- --all` (200 ticks) | Every encounter template that fired, per seed. **Blind to the social/tavern path** (`socialEncounterGeneration.ts`) |
| `loctraits.txt` | `npm run census:location-traits` | Location-trait census (flat `#welcoming`) |
| `cmc42.txt`, `cmc99.txt` | `npm run check:content-model-census -- --seed <n>` | Content-model query hits (`reward_draw`, `fight_trophy` 0) |
| `2026-09-25-content-census.{md,json}` | `npm run content-census -- --out-dir <dir>` | Authored counts per content kind |
| `setting-coverage-check.txt` | `npm run generate-setting-coverage:check` | Setting-envelope coverage is up to date |
| `alive-{small,medium,large}.{txt,json}` | `readers/alive.ts` | Settlement story, social ties, events t1–20, pre-history, per map size |
| `alive-hex-*.{txt,json}` | `readers/alive.ts` (hex pass) | Land hexes with anything named on them |
| `alive-timing.json` | `readers/alive.ts` (clean run, nothing else on the CPU) | ms per tick, t1–20 and t21–150 |
| `corpus.json` | `readers/corpus.ts` | Encounter corpus sliced by reach, sphere, culture, tier, faction, outcome bands authored |
| `demand.json` (`demand.err` = its stderr) | `readers/demand.ts 42,99 200` | Place counts in the world against supply and against firings, per subtype, setting, culture, tier and outcome |
| `rewards.json` | `readers/rewards.ts` | Reward repetition (`starter_revelation` ≈ 10%) |
| `reach-gates.json` | `readers/reach.ts 42,99 200` (THR-1597, `main` @ `32d974ca`) | Per drawable encounter template, the first gate it fails per seed (supply → travel → funnel stage → cooldown → outscored → spawn), off the engine's own `runtime.eligibilityFunnel`; faction membership split by deciding (spotlight) members; subtype occupancy; every withered seed with its reason |
| `reach-prereq.json` | `readers/prereq.ts 42,99 200` (THR-1597) | The funnel's "prerequisites" bucket split into core prerequisites / reputation-trait gate / outgrowth, per template, for deciders every 20 ticks; decider capability quantiles |
| `attended-medium.{txt,json}` | `readers/attended.ts 42,99 150 --json …` (THR-1590) | The attended view: `?view=game&seeded&size=medium` worlds (identity + First bonded + test package), 150 ticks, next to an unattended arm of the same length. Every firing from **both** `state.unifiedActions` and `state.encounterProgress`, tagged by court position, effective attention tier, content pool (board vs the social generator's pools), band; top-10 share; longest same-template run per mortal; §2 numbers restated. The JSON carries every firing row |
| `attended-diag-{42,99}.txt` | `readers/attended-diag.ts <seed> 150` (THR-1590) | Where The First is and what it is doing, tick by tick; social-generator candidate counts off the engine's own trace |
| `social-cap.txt` | `readers/social-cap.ts 42,99 150 30` (THR-1590) | A/B on `runFilterPipeline`: social entries surviving the cap in the engine's order (cache first, social appended) vs alone. 0 vs 52–86% — the positional cap cut |

## `readers/` — the throwaway scripts

Kept as written. Imports are rewritten relative to the repo root. They are not part of the build: `tsconfig.app.json` includes `src` only. Bundle and run them the way the census scripts do, from the repo root:

```bash
npx esbuild Docs/audits/2026-09-25-living-world-data/readers/alive.ts --bundle --platform=node --format=esm --outfile=.cache/alive.mjs --external:fs --external:path && node .cache/alive.mjs
```

`join.ts` takes the firing JSON as its argument. `attended.ts` takes `<seeds> <ticks> [--json <path>] [--modes attended,unattended]`; it reproduces `?seeded` with the same three calls `useSimulation` makes (`initializeGameStateFromIdentity` + `devSeedTheFirst` + `devSeedAscendantTestPackage`) and ticks with plain `runTick`, which is what `window.__DEBUG.tick(n)` does. `spot.ts` finds where protagonists live and their leading reaches; it found the freehold cause in THR-1588. `unk.ts` finds the subtype-less wilderness Locations minted in play.

If a reader is worth keeping, promote it to `scripts/` with a `package.json` entry. The seeded-world census was promoted that way from the THR-1435 prototypes.
