# Encounter batch report — 2026-09-09

**Batch:** 6 encounter(s)
**Brief:** `Docs/plans/encounters/2026-09-04-retrofit-batch-2-brief.md`
**Stages rendered:** 3 (`check:encounter`) + 4 (`check:encounter-live`). This report runs neither check itself — it renders their JSON, so it cannot disagree with CI.

> **How to read this.** The first table is the batch: one row per encounter, so variance is visible in one view (ruling 1). Everything below it is per-encounter detail for the two you sample.

## The batch, side by side

| Encounter | Gate | Live | Package | Outcome | Systems | Bands | Review |
|---|---|---|---|---|---|---|---|
| `encounter.sharpen_blades` | ✅ green | ✅ proved | — not run | critical_failure | cast, rewards, conditions | 3 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.sharpen_blades) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.sharpen_blades) |
| `encounter.ward_the_camp` | ✅ green | ✅ proved | — not run | critical_failure | cast, rewards, conditions | 3 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.ward_the_camp) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.ward_the_camp) |
| `encounter.offer_small_prayer` | ✅ green | ✅ proved | — not run | critical_failure | cast, rewards, conditions | 3 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.offer_small_prayer) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.offer_small_prayer) |
| `encounter.rest_and_reflect` | ✅ green | ✅ proved | — not run | critical_failure | cast, rewards, seeds | 3 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.rest_and_reflect) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.rest_and_reflect) |
| `encounter.tend_to_wounds` | ✅ green | ✅ proved | — not run | critical_failure | cast, rewards, conditions | 4 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.tend_to_wounds) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.tend_to_wounds) |
| `encounter.scout_the_perimeter` | ✅ green | ✅ proved | — not run | critical_failure | cast, rewards, reputation, factions | 3 | [spawn](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.scout_the_perimeter) · [package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.scout_the_perimeter) |

*Package View links resolve once THR-1046 ships; the spawn links are live today.*

## What each encounter leaves behind

> The Package critic's answer, per encounter, to: *what does this encounter leave behind that a later encounter or system can pick up, and would the player recognise it happening?* An encounter whose honest answer is "nothing" is a solitary story — ruling 4 applies, park it rather than shipping it.

*No Package verdicts found in `Docs/plans/encounters`. Either the batch predates the Package stage or it has not run yet — treat this batch as unjudged on the package question, not as passing it.*

## Verdict roll-up

- **Gate green:** 6 / 6
- **Live proved:** 6 / 6
- **Live vacuous:** 0 / 6

## Per-encounter detail

### `encounter.sharpen_blades`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.sharpen_blades) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.sharpen_blades) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (2 tick(s), hand: sharpen.admit_the_nick, sharpen.find_the_rhythm)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- · `reward_node` — reward authored only on an outcome band this run did not roll (rolled 'critical_failure')
- · `seed_planted` — template declares no encounter seed
- · `condition_applied` — condition authored only on an outcome band this run did not roll (rolled 'critical_failure')

### `encounter.ward_the_camp`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.ward_the_camp) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.ward_the_camp) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (2 tick(s), hand: ward_camp.walk_it_again, ward_camp.a_gap_in_the_wind)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- · `seed_planted` — template declares no encounter seed

### `encounter.offer_small_prayer`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.offer_small_prayer) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.offer_small_prayer) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (2 tick(s), hand: prayer.expect_an_answer, prayer.take_it_on_faith)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- · `seed_planted` — template declares no encounter seed
- · `condition_applied` — condition authored only on an outcome band this run did not roll (rolled 'critical_failure')

### `encounter.rest_and_reflect`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.rest_and_reflect) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.rest_and_reflect) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (2 tick(s), hand: rest_reflect.trust_the_morning, rest_reflect.a_stray_recollection)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- · `condition_applied` — template declares no condition effect

### `encounter.tend_to_wounds`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.tend_to_wounds) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.tend_to_wounds) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (2 tick(s), hand: tend_wounds.hold_them_still, tend_wounds.one_clean_pull)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- · `seed_planted` — template declares no encounter seed

### `encounter.scout_the_perimeter`

[Open the encounter](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.scout_the_perimeter) · [Open the content package](https://threadbare.vercel.app/?view=cms#encounter-packages/encounter.scout_the_perimeter) *(pending THR-1046)*

**Stage 3 — gate:** green.

**Stage 4 — live proof:** ✅ proved (2 tick(s), hand: scout_perimeter.walk_it_twice, scout_perimeter.one_more_pull)

- · `aftermath_variant` — aftermathConfig authors a fallback only
- · `seed_planted` — template declares no encounter seed
- · `condition_applied` — template declares no condition effect

## Director's sample

Ruling: Christian reviews **2** of the 6, in chat, in plain language (THR-608). The gates hold the floor; he holds the ceiling.

- `encounter.sharpen_blades` — [open it](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.sharpen_blades)
- `encounter.ward_the_camp` — [open it](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.ward_the_camp)

**Ask him one question:** *do these two read like encounters worth meeting twice?* His verdict feeds the next brief.

---

# Addendum — authored at the batch's close (THR-1222)

Everything above this line is rendered from the gates' JSON. Everything below it is
the drafter's, and covers what the generator cannot see: the corrected sample, and
three findings that changed the batch's shape mid-run.

## The director's sample is `ward_the_camp` + `tend_to_wounds`

The generated section above names the first two rows, which is its default. The
brief (§5a.2) and the 2026-09-09 approval comment both name **`ward_the_camp`**
(thinnest start; veil; forces the game's second omen emitter) and
**`tend_to_wounds`** (eye; warmest tone; the `possession` + `knowledge` hand). Read
those two, not the default pair.

- `encounter.ward_the_camp` — [open it](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.ward_the_camp)
- `encounter.tend_to_wounds` — [open it](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.tend_to_wounds)

## Finding 1 — the raw-entry converter is a field allowlist, so the contract was unreachable

`toUnifiedTemplate` (`src/data/encounter-content.ts`) names every field it copies.
`supportBundle`, `aftermathConfig`, `consequenceDraw` and `consequenceSwap` were in
neither it nor `EncounterEntry`, so authoring them on a raw entry would have
compiled, read correctly to a reviewer, and **connected nothing**. The corpus has
been here before: `favorGeneration` sat inert exactly this way until THR-724 found
it. Batch 1 never met this because the slice six live in `src/data/encounters/` and
are authored as `UnifiedActionTemplate` directly, skipping the converter entirely.

Added as optional passthrough (NFP #6). Every future retrofit in this file depends
on it, so it is the batch's most reusable output.

## Finding 2 — two drawn families are unwirable from authored content

The brief's §2c wiring table assumed sentinels that do not bind. Both were checked
against the engine, not argued from the type:

- **`place` on `sharpen_blades`.** Needs a condition carrying `targetLocationId`.
  `$target` binds a location only when the action targets one; a camp chore targets
  its actor. Verified in the CLI (seed 42, medium): a spawned
  `encounter.sharpen_blades` resolves `targetId === actorId`, so the binder's
  location-kind check rejects it and the effect no-ops silently. The family's only
  sentinel-free kind is `spawn_unique_location`, which mints a place for honing a
  knife. **Traded to `condition`** (weight 8 in iron).
- **`thread` on `ward_the_camp`.** `thread_strengthen` and its siblings take literal
  `ascendantId` and `mortalId`; neither field is in `SCENE_SENTINEL_FIELDS`
  (`encounterAftermath.ts`), so no sentinel binds them and content cannot know either
  node id. The handler then looks for an existing `thread` edge between the two and
  skips when it finds none. Corroborated by the corpus: **zero shipped templates
  author any thread effect.** **Traded to `condition`** (weight 9 in veil).

**This is two swaps against the brief's budget of one, and the deviation is
deliberate.** The budget exists to stop authors dodging inconvenient hands; it does
not exist to force provably dead wiring into the corpus, which is the vacuous-wiring
failure the gate is there to catch. Both swaps are recorded on the templates with
their evidence, per THR-688 rule B.

The brief's *budgeted* swap — `membership` on `scout_the_perimeter` — **was not
spent.** §2c asked the drafter to author it if a company was in scope, and one is:
`membership_change` takes a faction **definition** id, not a node id and not a
sentinel (`the-beast-in-the-granary` and `toll-of-blades` both author bare
`'civic_guard'` / `'mercenary_company'`). Standing a perimeter watch is how a
traveller earns a place on the roster. Wired as drawn.

Worth its own ticket: the Consequence Draw can hand an author a hand that no
authored content can wire, and the only remedy is a swap budgeted at one per
template. `thread` in particular has weight ≥ 1 in all eight reaches and zero
reachable effect kinds.

## Finding 3 — `concepts` were authored, contrary to the brief's finding B

The brief says batch 2 authors no `concepts`, because THR-1053 has not ruled and
option (b) would discard the work. Taken literally that is unsatisfiable: Law 2 fails
any change without them, so a chip-carrying template cannot leave `RETROFIT_PENDING`
— which is the batch's own proof and its Done-when. Batch 1 resolves the tension in
practice: the slice chips carry `concepts` (`slice.bridge.steady_hands` does).
Finding B is about the two *residue* slice templates held to batch 3, not about new
chips. Authored, one phrase each; if THR-1053 rules the other way, deleting a
one-line field per chip is cheap.

## What the gates could not judge

- **Package View verdicts are absent** for this batch (the roll-up says so). The
  package question — what each encounter leaves behind that something later can pick
  up — is answered in the aftermath wiring but has not been judged by that stage.
- **The live proof rolls `critical_failure` for all six**, so the five other bands
  are gate-verified but not live-exercised. `tend_to_wounds` gained its
  `critical_failure` band *because* the proof exposed the gap: the band was
  unauthored, fell through to an empty fallback reaction, and failed `reward_node`
  against a step that promises something persistent.
