# Encounter batch report — 2026-08-15

**Batch:** 6 encounter(s)
**Brief:** `Docs/plans/encounters/retrofit-batch-1-brief.md`
**Stages rendered:** 3 (`check:encounter`) + 4 (`check:encounter-live`). This report runs neither check itself — it renders their JSON, so it cannot disagree with CI.

> **How to read this.** The first table is the batch: one row per encounter, so variance is visible in one view (ruling 1). Everything below it is per-encounter detail for the two you sample.

## The batch, side by side

| Encounter | Gate | Live | Outcome | Systems | Bands | Review |
|---|---|---|---|---|---|---|
| `encounter.slice.unsafe_bridge` | ✅ green | ❌ failed | success_at_cost | cast, rewards, conditions, reputation | 4 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.slice.unsafe_bridge) |
| `encounter.slice.grateful_kin` | ✅ green | ❌ failed | success_at_cost | cast, rewards, reputation | 3 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.grateful_kin) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.slice.grateful_kin) |
| `encounter.slice.swindled_family` | ✅ green | ❌ failed | critical_failure | cast, rewards, seeds, reputation | 3 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.swindled_family) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.slice.swindled_family) |
| `encounter.slice.swindler_found` | ✅ green | ❌ failed | critical_failure | cast, rewards, conditions, reputation | 4 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.swindler_found) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.slice.swindler_found) |
| `encounter.slice.bargain_at_crossroads` | ✅ green | ✅ proved | critical_failure | cast, rewards, seeds, reputation | 3 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.bargain_at_crossroads) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.slice.bargain_at_crossroads) |
| `encounter.slice.full_moon_collection` | ✅ green | ❌ failed | success_at_cost | cast, rewards, seeds | 3 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.full_moon_collection) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.slice.full_moon_collection) |

*Package View links resolve once THR-1046 ships; the spawn links are live today.*

## Verdict roll-up

- **Gate green:** 6 / 6
- **Live proved:** 1 / 6
- **Live vacuous:** 0 / 6

## Per-encounter detail

### `encounter.slice.unsafe_bridge`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.slice.unsafe_bridge) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ❌ failed (1 tick(s), hand: slice.bridge.patient_steps)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- ❌ `cast_bound` — support bundle declares cast but bound no actor in the live world
- ❌ `reward_node` — declared a reward but the resolved aftermath left nothing persistent
- · `seed_planted` — template declares no encounter seed
- ❌ `condition_applied` — declared a condition effect but none applied on this outcome

### `encounter.slice.grateful_kin`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.grateful_kin) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.slice.grateful_kin) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ❌ failed (1 tick(s), hand: slice.kin.easy_grace)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- ❌ `cast_bound` — support bundle declares cast but bound no actor in the live world
- ❌ `reward_node` — declared a reward but the resolved aftermath left nothing persistent
- · `seed_planted` — template declares no encounter seed
- · `condition_applied` — template declares no condition effect

### `encounter.slice.swindled_family`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.swindled_family) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.slice.swindled_family) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ❌ failed (2 tick(s), hand: slice.family.hard_miles)

- ❌ `cast_bound` — support bundle declares cast but bound no actor in the live world
- ❌ `seed_planted` — declared a seed effect but pendingEncounterSeeds carries none from this encounter
- · `condition_applied` — template declares no condition effect

### `encounter.slice.swindler_found`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.swindler_found) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.slice.swindler_found) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ❌ failed (2 tick(s), hand: slice.swindler.old_anger)

- ❌ `cast_bound` — support bundle declares cast but bound no actor in the live world
- · `seed_planted` — template declares no encounter seed

### `encounter.slice.bargain_at_crossroads`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.bargain_at_crossroads) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.slice.bargain_at_crossroads) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (2 tick(s), hand: slice.crossroads.a_taste_for_wonders)

- · `condition_applied` — template declares no condition effect

### `encounter.slice.full_moon_collection`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.full_moon_collection) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.slice.full_moon_collection) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ❌ failed (1 tick(s), hand: slice.fullmoon.read_the_coat)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- ❌ `cast_bound` — support bundle declares cast but bound no actor in the live world
- · `condition_applied` — template declares no condition effect

## Director's sample

Ruling: Christian reviews **2** of the 6, in chat, in plain language (THR-608). The gates hold the floor; he holds the ceiling.

- `encounter.slice.unsafe_bridge` — [open it](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- `encounter.slice.grateful_kin` — [open it](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.grateful_kin)

**Ask him one question:** *do these two read like encounters worth meeting twice?* His verdict feeds the next brief.
