# Encounter batch report — 2026-08-25

**Batch:** 6 encounter(s)
**Brief:** `Docs/plans/encounters/border-perils-brief.md`
**Stages rendered:** 3 (`check:encounter`) + 4 (`check:encounter-live`). This report runs neither check itself — it renders their JSON, so it cannot disagree with CI.

> **How to read this.** The first table is the batch: one row per encounter, so variance is visible in one view (ruling 1). Everything below it is per-encounter detail for the two you sample.

## The batch, side by side

| Encounter | Gate | Live | Package | Outcome | Systems | Bands | Review |
|---|---|---|---|---|---|---|---|
| `encounter.border.the_unclaimed_relic` | ✅ green | ✅ proved | 🔗 connected | critical_failure | cast, rewards, conditions | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.border.the_unclaimed_relic) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.border.the_unclaimed_relic) |
| `encounter.border.one_body_short` | ✅ green | ✅ proved | 🔗 connected | critical_failure | cast, rewards, conditions | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.border.one_body_short) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.border.one_body_short) |
| `encounter.border.toll_of_blades` | ✅ green | ✅ proved | 🔗 connected | success_at_cost | cast, rewards, conditions, reputation, factions | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.border.toll_of_blades) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.border.toll_of_blades) |
| `encounter.border.the_sign_over_the_ruin` | ✅ green | ✅ proved | 🔗 connected | critical_failure | cast, rewards, conditions | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.border.the_sign_over_the_ruin) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.border.the_sign_over_the_ruin) |
| `encounter.border.standing_the_line` | ✅ green | ✅ proved | 🔗 connected | failure | cast, rewards, seeds, conditions | 4 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.border.standing_the_line) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.border.standing_the_line) |
| `encounter.border.the_garrisons_price` | ✅ green | ✅ proved | 🔗 connected | success_at_cost | cast, rewards, conditions, reputation, factions | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.border.the_garrisons_price) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.border.the_garrisons_price) |

*Package View links resolve once THR-1046 ships; the spawn links are live today.*

## What each encounter leaves behind

> The Package critic's answer, per encounter, to: *what does this encounter leave behind that a later encounter or system can pick up, and would the player recognise it happening?* An encounter whose honest answer is "nothing" is a solitary story — ruling 4 applies, park it rather than shipping it.

| Encounter | Verdict | What it leaves |
|---|---|---|
| `encounter.border.the_unclaimed_relic` | 🔗 connected | A real artifact — The Cold Reliquary — sitting in the agent's possessions for good, a bond with the other claimant that is warmed or soured and points at a person the world keeps, and an Under Watch mark on the place itself that the player can read on its Location Profile but that no system in the game acts on yet. |
| `encounter.border.one_body_short` | 🔗 connected | The survivor from Standing the Line walks off this ground carrying a mark nobody can see — the death with no body under it, which the next border road they take can put in the open — plus, on the failure side, a grieving condition on the agent that measurably lowers their next reading of anything, and, if the god lets them speak, a cultural omen the chronicle names aloud. |
| `encounter.border.toll_of_blades` | 🔗 connected | A favour the column's serjeant owes the agent that a real verb can call in, a place on the mercenary company's rolls that its quest, rank and member-work systems read, and detection pressure in the region that a rival god's strike is watching. |
| `encounter.border.the_sign_over_the_ruin` | 🔗 connected | A Terrified condition the capability stack really reads and a journey the agent actually walks on the map — to the nearest settlement when the reading lands, three hexes off this ground when it does not — plus a cultural omen about the two readings that shifts what the world offers next, and an Under Watch mark on the ruin the player can read on its Location Profile that no system in the game acts on. |
| `encounter.border.standing_the_line` | 🔗 connected | A named pilgrim who survives the road and stays bonded to the agent, a wound with a real duration on the agent's sheet, a concealed count that the border family can surface later, and — on the four endings where the road left bodies — a planted scene that brings the same person back onto the same ground a day later as One Body Short. |
| `encounter.border.the_garrisons_price` | 🔗 connected | A named quartermaster who now holds an opinion of the traveler, standing with the mercenary company that on the good endings crosses into Respected — the band reputation-gated doors ask for — and, when the haggle goes badly, a 96-tick compulsion that visibly bends the traveler's next several encounters toward paying work. |

## Verdict roll-up

- **Gate green:** 6 / 6
- **Live proved:** 6 / 6
- **Live vacuous:** 0 / 6

## Per-encounter detail

### `encounter.border.the_unclaimed_relic`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.border.the_unclaimed_relic) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.border.the_unclaimed_relic) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (2 tick(s), hand: relic.a_little_more)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- · `seed_planted` — template declares no encounter seed

### `encounter.border.one_body_short`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.border.one_body_short) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.border.one_body_short) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (2 tick(s), hand: short.who_they_are)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- · `seed_planted` — template declares no encounter seed

### `encounter.border.toll_of_blades`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.border.toll_of_blades) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.border.toll_of_blades) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (4 tick(s), hand: toll.a_little_more, toll.a_little_more_again)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- · `seed_planted` — template declares no encounter seed
- · `condition_applied` — every condition write reachable on this path is a removal or a failureMetadata mint that no step failure fired (step outcomes: near_miss, success_at_cost)

### `encounter.border.the_sign_over_the_ruin`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.border.the_sign_over_the_ruin) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.border.the_sign_over_the_ruin) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (2 tick(s), hand: sign.a_little_more, sign.a_reading_offered)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- · `seed_planted` — template declares no encounter seed

### `encounter.border.standing_the_line`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.border.standing_the_line) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.border.standing_the_line) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (7 tick(s), hand: line.s0.a_little_more)

- every declared claim passed

### `encounter.border.the_garrisons_price`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.border.the_garrisons_price) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.border.the_garrisons_price) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (3 tick(s), hand: gp.pay_it_elsewhere, gp.pay_it_elsewhere_again)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- · `seed_planted` — template declares no encounter seed
- · `condition_applied` — condition authored only on an outcome band this run did not roll (rolled 'success_at_cost')

## Director's sample

Ruling: Christian reviews **2** of the 6, in chat, in plain language (THR-608). The gates hold the floor; he holds the ceiling.

- `encounter.border.the_unclaimed_relic` — [open it](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.border.the_unclaimed_relic)
- `encounter.border.one_body_short` — [open it](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.border.one_body_short)

**Ask him one question:** *do these two read like encounters worth meeting twice?* His verdict feeds the next brief.
