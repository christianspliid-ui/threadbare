# Encounter batch report — 2026-08-26

**Batch:** 1 encounter(s) (ruling 1 sets the batch at 6)
**Brief:** `Docs/plans/encounters/full-line-proof-brief.md`
**Stages rendered:** 3 (`check:encounter`) + 4 (`check:encounter-live`). This report runs neither check itself — it renders their JSON, so it cannot disagree with CI.

> **How to read this.** The first table is the batch: one row per encounter, so variance is visible in one view (ruling 1). Everything below it is per-encounter detail for the two you sample.

## The batch, side by side

| Encounter | Gate | Live | Package | Outcome | Systems | Bands | Review |
|---|---|---|---|---|---|---|---|
| `encounter.hunt.the_beast_in_the_granary` | ✅ green | ✅ proved | 🔗 connected | success_at_cost | cast, rewards, conditions, factions | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.hunt.the_beast_in_the_granary) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.hunt.the_beast_in_the_granary) |

*Package View links resolve once THR-1046 ships; the spawn links are live today.*

## What each encounter leaves behind

> The Package critic's answer, per encounter, to: *what does this encounter leave behind that a later encounter or system can pick up, and would the player recognise it happening?* An encounter whose honest answer is "nothing" is a solitary story — ruling 4 applies, park it rather than shipping it.

| Encounter | Verdict | What it leaves |
|---|---|---|
| `encounter.hunt.the_beast_in_the_granary` | 🔗 connected | The settlement itself ends the night carrying a named season — a Festival if its winter was saved, a Blighted Harvest if it was lost — written onto the location's own sheet where the player can open it and read it, and where the travel system already charges every later journey against it; the agent walks away with their recovered pack, possibly a wound, and on the martyr pole a place on the settlement's watch roll. |

## Plot hooks taken

> The premise each encounter started from (THR-1147). A hook is a starting point, never a contract — nothing checks the finished encounter against it, so read this for **spread**, not for fidelity. Six hooks sharing a theme is the finding.

| Hook | Themes | Source | Times used before |
|---|---|---|---|
| `hook.impossible_heist` | craft, discovery | vault: Archetypes/Ordeal — Impossible Heist | 0 |

**Theme spread:** craft ×1 · discovery ×1

*A `usedBy` count above 0 means the hook had already been spent before this batch — stamp the hook in `src/data/content-eval/plotHooks.ts` as each encounter ships, or the damping that keeps the corpus varied never applies.*

## Verdict roll-up

- **Gate green:** 1 / 1
- **Live proved:** 1 / 1
- **Live vacuous:** 0 / 1

## Per-encounter detail

### `encounter.hunt.the_beast_in_the_granary`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.hunt.the_beast_in_the_granary) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.hunt.the_beast_in_the_granary) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (3 tick(s), hand: granary.weigh_the_winter)

- · `seed_planted` — template declares no encounter seed

## Director's sample

Ruling: Christian reviews **2** of the 1, in chat, in plain language (THR-608). The gates hold the floor; he holds the ceiling.

- `encounter.hunt.the_beast_in_the_granary` — [open it](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.hunt.the_beast_in_the_granary)

**Ask him one question:** *do these two read like encounters worth meeting twice?* His verdict feeds the next brief.
