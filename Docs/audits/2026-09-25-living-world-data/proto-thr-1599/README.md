# THR-1599 prototype — culture and spheres showing through

Branch `proto/thr-1599-culture-sphere-layer`. **Never merged.** It is the evidence behind the design lane's decision on THR-1599 (living-world map THR-1589), 2026-09-25.

## What it tests

It tests whether a reusable layer can make one authored encounter opening read differently across a world's cultures and its strong-sphere places, without writing any encounter per culture or per sphere. The layer adds **one stated-fact sentence** to the opening's complication beat:

| Line | Key | Size of the full table |
|---|---|---|
| **Culture custom** | the place's culture's `foundationBias` (its social contract: chaos = honour and challenge, order = written law, light = open witness, darkness = closed circles) × the encounter's primary reach | 4 × 8 × 3 variants = 96 lines, covering all ~518 encounters |
| **Sphere fact** | the place's dominant sphere × reach. It fires only when that sphere's share is ≥ `SPHERE_FACT_MIN_SHARE` (0.55) | 12 × 8 × 2 = 192 lines at most. In practice, 8 spheres ever dominate a place |

Word substitution into authored sentences is deliberately **not** used. THR-1101 removed the `{adj}`/`{verb}` mad-lib shape, and Prose Doctrine v2 retires atmosphere that does no job. Each line states a custom, a cost or a pressure that bears on the test.

## Files

- `layer.ts` holds the tables (the three reaches the sample needs), the threshold, and the four missing sphere vocabularies.
- `sample.ts` builds a real medium world at t0, composes the three most-fired attended templates in each living culture and under sphere tints, and measures what the layer depends on.
- `sample-seed-42.md` and `sample-seed-99.md` are its output, the samples to read.

Run from the repo root:

```bash
npx esbuild Docs/audits/2026-09-25-living-world-data/proto-thr-1599/sample.ts --bundle --platform=node --format=esm --outfile=.cache/thr1599.mjs --external:fs --external:path
node .cache/thr1599.mjs 42
```

## Measured (seed 42 · seed 99, medium, t0)

| Measure | Seed 42 | Seed 99 |
|---|---|---|
| Living cultures | 3 | 3 |
| Cultures sharing a foundation | 2 (light) | 2 (chaos) |
| Place-tier Locations carrying a current culture | 40 of 235 | 60 of 238 |
| Place-tier Locations with a sphere affinity | 118 | 135 |
| Dominant-sphere share, p50 / p90 | 0.43 / 0.60 | 0.40 / 0.57 |
| Places at ≥ 0.55 share | 35 (30%) | 24 (18%) |
| Order- or chaos-dominant places | 0 | 0 |
| Darkness- or light-dominant places | 7 | 6 |
| Engine `cultureResolver` / `agentCultureResolver` layers produced | 0 of 40 / 0 of 235 | 0 of 60 / 0 of 326 |

- **Same-foundation cultures need a per-culture variant.** Keyed by foundation alone, two of the three cultures read identical lines on both seeds. The sample now picks the variant by the culture's rank among same-foundation cultures, a stamp worldgen would set once.
- **At 0.35, the sphere line fired on 74% of places** (seed 42), so it would stop meaning anything. 0.55 leaves 18–30% of places marked.
- **Culture and sphere mostly touch different places.** Culture lives on settlements; strong spheres mostly sit on wilds, quarries, gardens and roads. One line per opening, with culture taking precedence, rarely drops anything.
- **The engine's culture prose layers never fire.** They read `cultureIdentity.foundationPair`, a field `CultureIdentity` does not have (`grep -rn foundationPair src` finds only the reader and a UI comment). This was filed as a bug.
