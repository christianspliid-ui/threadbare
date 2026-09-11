# Encounter batch report — 2026-09-11

**Batch:** 1 encounter(s) (ruling 1 sets the batch at 6)
**Brief:** `Docs/plans/encounters/2026-09-10-retrofit-batch-3-brief.md`
**Stages rendered:** 3 (`check:encounter`) + 4 (`check:encounter-live`). This report runs neither check itself — it renders their JSON, so it cannot disagree with CI.

> **How to read this.** The first table is the batch: one row per encounter, so variance is visible in one view (ruling 1). Everything below it is per-encounter detail for the two you sample.

## The batch, side by side

| Encounter | Gate | Live | Package | Outcome | Systems | Bands | Review |
|---|---|---|---|---|---|---|---|
| `encounter.shrine_offering` | ✅ green | ✅ proved | — not run | critical_failure | cast, rewards, seeds, conditions | 4 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.shrine_offering) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.shrine_offering) |

*Package View links resolve once THR-1046 ships; the spawn links are live today.*

## What each encounter leaves behind

> The Package critic's answer, per encounter, to: *what does this encounter leave behind that a later encounter or system can pick up, and would the player recognise it happening?* An encounter whose honest answer is "nothing" is a solitary story — ruling 4 applies, park it rather than shipping it.

*No Package verdicts found in `Docs/plans/encounters`. Either the batch predates the Package stage or it has not run yet — treat this batch as unjudged on the package question, not as passing it.*

## Verdict roll-up

- **Gate green:** 1 / 1
- **Live proved:** 1 / 1
- **Live vacuous:** 0 / 1

## Per-encounter detail

### `encounter.shrine_offering`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.shrine_offering) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.shrine_offering) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (2 tick(s), hand: shrine.give_the_good_one, shrine.mean_it_going_down, shrine.wait_one_hour_more)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- · `seed_planted` — seed authored only on an outcome band this run did not roll (rolled 'critical_failure')

## Director's sample

Ruling: Christian reviews **2** of the 1, in chat, in plain language (THR-608). The gates hold the floor; he holds the ceiling.

- `encounter.shrine_offering` — [open it](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.shrine_offering)

**Ask him one question:** *do these two read like encounters worth meeting twice?* His verdict feeds the next brief.
