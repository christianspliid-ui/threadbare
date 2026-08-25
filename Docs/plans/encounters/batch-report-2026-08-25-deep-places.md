# Encounter batch report — 2026-08-25

**Batch:** 2 encounter(s) (ruling 1 sets the batch at 6)
**Brief:** `Docs/plans/encounters/deep-places-brief.md`
**Stages rendered:** 3 (`check:encounter`) + 4 (`check:encounter-live`). This report runs neither check itself — it renders their JSON, so it cannot disagree with CI.

> **How to read this.** The first table is the batch: one row per encounter, so variance is visible in one view (ruling 1). Everything below it is per-encounter detail for the two you sample.

## The batch, side by side

| Encounter | Gate | Live | Package | Outcome | Systems | Bands | Review |
|---|---|---|---|---|---|---|---|
| `encounter.delve.the_broken_seal` | ✅ green | ✅ proved | ⚠️ `package pass` | critical_failure | cast, rewards, seeds, conditions | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.delve.the_broken_seal) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.delve.the_broken_seal) |
| `encounter.delve.the_drowned_archive` | ✅ green | ✅ proved | ⚠️ `package pass` | critical_failure | cast, rewards, seeds, conditions | 5 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.delve.the_drowned_archive) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.delve.the_drowned_archive) |

*Package View links resolve once THR-1046 ships; the spawn links are live today.*

## What each encounter leaves behind

> The Package critic's answer, per encounter, to: *what does this encounter leave behind that a later encounter or system can pick up, and would the player recognise it happening?* An encounter whose honest answer is "nothing" is a solitary story — ruling 4 applies, park it rather than shipping it.

| Encounter | Verdict | What it leaves |
|---|---|---|
| `encounter.delve.the_broken_seal` | ⚠️ `package pass` | On the good endings the agent walks out holding a real object — a Veilscript Fragment, or on the rarest ending The Silent Testament as well — which sits in their possessions and can be looked at, carried and lost like any other item; on the bad endings the keepers bring the stair down and the place itself is marked closed, which shows up on that location's own sheet with a term in words and makes every route through it eight times more expensive for anyone in the world, agent or army, until it lifts; and on the worst ending the agent walks away wanting to know what was in the coffer, which is written as a real ambition that steers which encounters they are offered and what they do when idle for the rest of their life — measured on a live world, three-quarters of agents are carrying no ambition at all, so this encounter is one of the few things in the game that gives someone a reason of their own. |
| `encounter.delve.the_drowned_archive` | ⚠️ `package pass` | On the best ending the agent walks out with a clue about a real ruin somewhere in the world, and that clue is the strongest thing this encounter plants — the Adventurer's Guild reads it, and once the evidence at that ruin crosses its threshold with a guild hall within five hexes the guild posts a delve quest and a toast names the ruin and the direction to it, so the player watches a rumour they created turn into work somebody else takes; on the middle ending the vault's own settlement is marked Under Watch for a week of game time and that shows on the place's own sheet with a countdown, and its chip clicks straight through to that sheet, though nothing in the simulation yet acts on being watched; the keeper — a real person who stays in the world — ends up trusting the agent, or on the worst ending grieving the records they lost, both of which sit on their sheet; and every single ending mints an intelligence record the agent carries for the rest of their life, readable in the Intelligence section of their own sheet, which a later court, intrigue or ritual encounter will pick up as an advantage. That record does **not** know which settlement it is about — the engine has no way for an author to say so — and the shipped encounter no longer pretends otherwise: the five chips reporting it now point at the agent who carries it rather than at the settlement, so nothing sends the player to a place sheet where this ending wrote nothing, and the charter's tie to the ground it names lives in the chip's own sentence, where it is honest. |

## Plot hooks taken

> The premise each encounter started from (THR-1147). A hook is a starting point, never a contract — nothing checks the finished encounter against it, so read this for **spread**, not for fidelity. Six hooks sharing a theme is the finding.

| Hook | Themes | Source | Times used before |
|---|---|---|---|
| `hook.descent_into_darkness` | journey, discovery | vault: Archetypes/Ordeal — Descent Into Darkness | 1 |
| `hook.dangerous_truth` | discovery, power | vault: Archetypes/Event — Discovery / The Scholar's Dangerous Discovery | 1 |

**Theme spread:** discovery ×2 · journey ×1 · power ×1

*A `usedBy` count above 0 means the hook had already been spent before this batch — stamp the hook in `src/data/content-eval/plotHooks.ts` as each encounter ships, or the damping that keeps the corpus varied never applies.*

## Verdict roll-up

- **Gate green:** 2 / 2
- **Live proved:** 2 / 2
- **Live vacuous:** 0 / 2

## Per-encounter detail

### `encounter.delve.the_broken_seal`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.delve.the_broken_seal) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.delve.the_broken_seal) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (2 tick(s), hand: seal.draw_on_character, seal.press_the_odds)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- · `seed_planted` — seed authored only on an outcome band this run did not roll (rolled 'critical_failure')

### `encounter.delve.the_drowned_archive`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.delve.the_drowned_archive) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.delve.the_drowned_archive) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (2 tick(s), hand: archive.find_what_remains, archive.kindle_a_wanting, archive.draw_on_character)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- · `seed_planted` — seed authored only on an outcome band this run did not roll (rolled 'critical_failure')

## Director's sample

Ruling: Christian reviews **2** of the 2, in chat, in plain language (THR-608). The gates hold the floor; he holds the ceiling.

- `encounter.delve.the_broken_seal` — [open it](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.delve.the_broken_seal)
- `encounter.delve.the_drowned_archive` — [open it](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.delve.the_drowned_archive)

**Ask him one question:** *do these two read like encounters worth meeting twice?* His verdict feeds the next brief.
