> **title:** Your cards say how they landed, and The First's five quiet chapters ask once — every played card adds its own line to how the step went, and the chapters The First meets most often alone get a dealt hand on their first step (THR-2179)
> **linear_issue:** THR-2179
> **author:** Claude Code (design lane, unattended, 2026-11-06 — run dl-20261106T1119)
> **created:** 2026-11-06
> **three_pillars:** Engine done (one frozen field on the step record, one pure helper, no tick phase, no PRNG) · Content done (deal declarations on five templates, player-facing words listed exactly) · UI done (one line under the step's afterimage on the Stage and in the Ledger)

# Your cards say how they landed — THR-2179

*The ticket asked which of The First's own chapters should give the god a hand. Measuring it live answered a different question first: when the god does play a card, the game never says how that card landed. Every card carries a line for each outcome ("The odds had been quietly widened, and Kael walked through the gap."), and no screen shows it. Fix that first, so a new hand pays off. Then give the five chapters The First most often plays alone one hand each, on the first step.*

## Why this is load-bearing

[The player can't tell which chapters wait for their cards](https://linear.app/threadbare/issue/THR-2174) (decided 2026-11-05) kept the mortal's own chapters and made the game say which ones wait for the god. [Say which chapters wait for the god](https://linear.app/threadbare/issue/THR-2178) shipped that on 2026-11-06. It left this ticket to answer: should more chapters give the god a hand, and what is the cheapest *honest* one? Canon makes "honest" testable: *"prose pays the nudge off at every band, misfires included"* ([encounters.md](../canon/encounters.md)). The UL defines a band fragment as *"a line of prose appended to a step's outcome text"* ([Encounters.md § Band Fragment](../ubiquitous-language/Encounters.md)).

## Substrate inventory

All 🟢 ACTIVE; this plan **extends** each, and replaces nothing. No touched file reaches 100 importers (`unifiedActionResolution.ts` 67, `chapterArchive.ts` 18, `encounters/nudges.ts` 17, `types/stepProseRecord.ts` 7), so there is no Blast Radius section.

| Existing subsystem | Where | This plan |
|---|---|---|
| Dealt hand (THR-1247/1248) | `encounters/dealHand.ts`, `PLAY_PROFILES` / `BAND_FRAGMENTS` | extends: five templates declare a fill |
| Nudge band prose | `encounters/nudges.ts:533` `collectNudgeBandProse` | **activates**: written, tested, never called |
| Frozen step record (THR-636, THR-2180) | `types/stepProseRecord.ts`, `unifiedActionResolution.ts:2678` | extends: one optional field |
| Chapter archive + Ledger | `chapterArchive.ts:273`, `ChapterView.tsx:232` | extends: reads the frozen field |
| Stage step model | `views/stage/buildUnifiedEncounterStageModel.ts:581`, `EncounterVeil.tsx:4128` | extends: reads the frozen field |
| Chapter wait word (THR-2178) | `playerStepHold.ts:139` | unchanged; the five templates' data changes its reading |

## Measured (main @ `2b3bebee`, 2026-11-06)

**1. The chapters The First actually meets.** Instrument: `scripts/proto-chapter-hand-census.ts` on the pushed, never-merged branch [`proto/thr-2179-chapter-hand-census`](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-2179-chapter-hand-census). Medium map, The First pre-bonded (`devSeedTheFirst`, "Asks you"), unattended, seeds 42, 99, 7 and 1234, 600 ticks each. Every new action by a threaded mortal is logged once, with the THR-2178 predicate (`chapterOffersPlayerMove`) and the live wait word (`chapterWaitWord`).

| Measure (4 seeds × 600 ticks) | Value |
|---|---|
| Actions The First started | 242: 139 daily life, **103 story chapters** |
| Story chapters that wait for the god ("Waits for you") | **72 (70%)** |
| Story chapters that read "Theirs alone" | **31 (30%)**, from 12 distinct templates |
| Share of the 31 covered by the top 5 of those 12 | **74%** (top 10: 94%) |
| Held moments today (steps that offer a move, summed over every story start) | **119** |
| Added by a hand on step 0 of the top 5 | +23 (**+19%**) |
| Added by a hand on every step of the top 5 | +55 (+46%) |
| Added by a hand on every step of all 12 | +72 (+61%) |

**The ticket's top-20 figure:** ranked by starts across all four seeds, The First started 38 distinct story templates. The top 20 carry 82% of its story starts, and **6 of those 20 offer no move**: Consecrate the Ground (4th), The Haggle (6th), Tend the Shrine (9th), The Market Haggle (10th), Heal the Sick (15th) and Mutiny (16th, 2 starts on one seed, so below the predicate).

The registry count on the ticket (391 of 541 offer no move) overstated it. Most of those 391 are scenes The First never draws. The [Finish the encounters the player meets](https://linear.app/threadbare/issue/THR-1634) slices (S1–S3, Sept 2026) already dealt hands into the most-fired templates, which is why 70% of The First's chapters wait.

The five "Theirs alone" chapters The First meets most (predicate: ≥3 starts on ≥2 seeds):

| Template | Starts · seeds | Steps | File |
|---|---|---|---|
| `ts.quest.consecrate_ground` — Consecrate the Ground | 6 · 3 | 2 | `src/data/temple-of-spheres-encounter-content.ts` |
| `encounter.the_haggle` — The Haggle | 5 · 3 | 3 | `src/data/encounter-content.ts` |
| `ts.quest.tend_shrine` — Tend the Shrine | 5 · 4 | 2 | `src/data/temple-of-spheres-encounter-content.ts` |
| `encounter.market_haggle` — The Market Haggle | 4 · 2 | 3 | `src/data/encounter-content.ts` |
| `ts.quest.heal_the_sick` — Heal the Sick | 3 · 2 | 2 | `src/data/temple-of-spheres-encounter-content.ts` |

**2. A played card's line never reaches the player.** `collectNudgeBandProse` (`src/engine/encounters/nudges.ts:533`) has **no production caller**. `git log -S "collectNudgeBandProse("` shows two commits, and neither adds a call. `StepProseRecord` (`src/types/stepProseRecord.ts:31`) freezes `narrativeProse`, `afterimageProse`, `complicationProse` and `forecastTier`, but no card line. A search of `src/components/Game` for `bandProse` finds nothing. The only runtime reader is Meet The First (`meetingEncounter.ts:796`). The game's only card payoff today is the generic cause clause, *"your cards held it"* / *"your cards could not save it"* (`aftermathWords.ts:1054-1064`).

What sits unread: **1,310** authored band lines on **529** authored cards in **116** templates, and the 38 library cards' `BAND_FRAGMENTS` (`src/data/nudge-card-library.ts:1295`).

**3. Dealt cards cover the plain bands, not all the extremes.** All 38 dealable library cards have a `success` and a `failure` line. 36 have `success_at_cost` and `near_miss`, 22 have `critical_success`, and **7** have `critical_failure`. `validateRepertoire()` reports 0 unpayable and 0 win-only. So a nearest-band fallback gives every dealt card a line at every band.

## Decisions (made by the design lane under delegation, 2026-11-06 — veto in chat)

1. **Fix the payoff first (slice 1, a bug).** Each card the god played on a step adds its line to how the step went. The line is frozen on the step record at the roll and shown under the step's afterimage, on the Stage and in the Chapter Ledger. *Why:* canon and the UL both say the line appears, and the code never shows it. Without this, a new hand would charge essence, move the odds and then leave no trace. That is PC-8, "the player acts and nothing answers".
2. **Nearest-band fallback.** A card with no line for the exact band uses the nearest band on the same side: critical success → success, success at a cost → success, near miss → failure, critical failure → failure. *Why:* 31 of 38 library cards lack a critical-failure line. A card that disappears on the worst roll is the case canon names as a rejected approach ("a card that vanishes on a loss makes failure read as punishment").
3. **At most two card lines per step**, in the order the cards were committed. *Why:* a hand can commit several cards. Two lines keep the result readable, and the rest are still counted by the cause clause.
4. **The bar: the five chapters The First meets most often alone get a hand (slice 2).** Not all twelve, and not every step. *Why:* those five carry 74% of the alone starts. A hand on step 0 only adds 19% more held moments, against 46% for every step. Story breath (`PAUSED_STORY_BREATH_TICKS` 22) and the tellings cap (`PAUSED_STORY_MAX_TELLINGS` 2) are unchanged, so The First starts the same number of chapters. Only these five now ask once.
5. **The hand shape: a pure fill on step 0.** `deal: { count: 4, tags: [<the step's reach tag>] }`, no specials. *Why:* the dealer is pure and zero-PRNG, its cards carry their own lines (decision 1 makes them visible), and `check:encounter` already checks composed hands. A step-0 hand also makes the THR-2178 word read "Waits for you" with no other change.

**Rejected:** a hand on every step (+46% held moments for five chapters); authored specials (bespoke card prose for templates no tester named, and the Encounter Factory's sampling cost); writing the missing extreme-band lines for 31 library cards (the fallback covers it, and authoring them is a later content pass, not a fix); hiding alone chapters (THR-2174 already rejected it).

**Not a fork.** The mortal decides and the god nudges (canon). Both slices change how often the god is asked, not what a chapter means.

## Engine pillar

- **`StepProseRecord.cardLines?: readonly string[]`** (additive, `src/types/stepProseRecord.ts`). Written once, where `unifiedActionResolution.ts:2678` builds the record. It is read from the step that function already composes (`composeDealtStepFromState`, `:2437`) and `action.activeNudges`. The executor confirms `activeNudges` still holds the committed hand at that point; if it was cleared earlier, read it from where `collectNudgeModifiers` read it for this roll. Each line goes through `enrichProse` with the step's context, so `{they}` / `{actor}` resolve.
- **New pure helper `cardBandLines(step, activeNudgeIds, outcome)`** in `src/engine/encounters/nudges.ts`. It wraps `collectNudgeBandProse` with the `CARD_BAND_FALLBACK` map and the `MAX_CARD_LINES_PER_STEP` cap. It does not change `collectNudgeBandProse`'s signature or behaviour.
- **Readers:** `chapterArchive.ts` `buildStepRecord` (`:273`) copies `cardLines` from `stepProseHistory`, as it copies the tested reach (`:288-290`). `buildUnifiedEncounterStageModel.ts` (`:581`) puts `cardLines` on the step model, as THR-2180 did with `oddsMissedLine`.
- No tick phase, no graph node or edge, no PRNG. `enrichProse` gets the resolution's existing `rng`, as the afterimage beside it does.

## Content pillar

- **Slice 2:** add a step-0 `deal` to the five templates in the table. The tag is the step's reach as a `DealContextTag` (one of the 8 reach tags, closed vocabulary). Steps 1+ unchanged. The temple entries are authored as full templates, so `deal` passes through. `encounter-content.ts` passes it at `:409` (THR-1634 E1). Add a test on the **shipped** object (`getUnifiedTemplateById`) that each has `steps[0].deal` and that `chapterOffersPlayerMove` is now true.
- No new prose. The library's `BAND_FRAGMENTS` are the lines, shown through decision 1.

## UI pillar

Screenshot tool: Playwright (DOM surfaces) at 1920×1080.

### Player-facing text

| Surface | Exact text the player reads | Complaint class | How the player understands it |
|---|---|---|---|
| Stage, a resolved step, under the afterimage | *"Press The Odds — The odds had been quietly widened, and Kael walked through the gap."* | PC-8, PC-2 | The card's name, then what it did. The card they played answers in the result. |
| Same, a critical failure on a card with no critical line | *"Loosen Their Footing — Nothing gave where it was pushed, and something gave where it was not."* | PC-8 | The card is still named on the worst roll. Failure shows the god was there and did not land. |
| Same, an **authored** card at failure (Pilgrim's Offering, rank 3 of The First's chapters) | *"Honor The Old Rite — Kael reached for the rite, and the words came out wrong."* | PC-8, PC-3 | The scene's own card answers in the scene's own words. |
| Chapter Ledger step (`ChapterView.tsx`, after the afterimage, `:232`) | The same lines, frozen, so a reread says the same thing | PC-6 | Ledger and Stage read the same frozen record word for word. |
| Ledger row / Stage header on the five templates | *"Waits for you"* (THR-2178's word, now true for them) | PC-2 | No new word. |

**The 1,310 authored lines were written to be read.** They follow the nudge authoring spec § 4 (band prose, narrator mode), and `check:encounter` already scans every `bandProse` fragment as `outcome`-class prose with the register detectors (`nudgeAuditDetectors.ts:308`, `compositionContract.ts:1955`). They ship as they are. The risk is lines in templates older than Doctrine v2 that read flat or carry a seam. Slice 1's Done-when owes a sweep for that: no rendered card line holds an unresolved `{…}`, and a sampled read of 20 rendered lines across the census run, with each one that reads as developer text (PC-3) filed as a Deferral.

Format: the card's display title (`cardDisplayTitle`), an em dash, then the line. Muted secondary text, italic, `--text-sm`, the same treatment as the cast line (`ChapterView.tsx:238-249`). No glyph, no new colour.

### UI Laws engaged

Laws 1, 13/14, 17, 21, 33, 37 (the DoD minimum); Law IV (words, no numbers on the line); Law 56 does not apply (no chip).

### Playtest signal

A tester who plays a card can say, from the result alone, what that card did, including when the step failed.

### Event notifications · Debug inspection · Visual presence (HexMapV2)

No new notification. `window.__DEBUG` needs nothing new. The record is visible in the chapter archive and `getRepertoire().lastDeal` already shows the deal. No map change.

## Interface impact

| Contract | Change |
|---|---|
| Resolution → `StepProseRecord` → Stage model + chapter archive | **add**: register `step-card-lines-reach-the-reader` in `scripts/interface-contracts.ts` (producer `unifiedActionResolution.ts`, readers `buildUnifiedEncounterStageModel.ts`, `chapterArchive.ts`). Regenerate the map. |
| Dealt hand → resolution (THR-1247) | preserve |
| `chapterWaitWord` (THR-2178) | preserve; the five templates change reading through their data only |

## Wiring

| Module | Phase | UI component | GameState flow | Trace | Debug |
|---|---|---|---|---|---|
| `cardBandLines` (`nudges.ts`) | step resolution (existing site) | none (pure) | reads `activeNudges` + the composed step | none | unit tests |
| `StepProseRecord.cardLines` | written at resolution, `unifiedActionResolution.ts:2678` | — | `unifiedActions[].stepProseHistory`, then the chapter archive | none (frozen record) | the archived chapter record |
| Stage step model | render | `EncounterVeil.tsx` step entry | reads the record | — | stage model in tests |
| Ledger step | render | `ChapterView.tsx` step block | `chapterArchive` `buildStepRecord` | — | Ledger DOM |
| Slice 2 deal | dealing (existing, zero-PRNG) | the existing hand | template data | — | `getRepertoire().lastDeal` |

Check both slices against `Docs/plans/wiring-checklist.md`. Update the wiki page whose `sources` include `nudges.ts` or `stepProseRecord.ts`. Add one line to the systemic wiring guide: card band lines now render, so authors writing `bandProse` are writing player-visible text.

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `MAX_CARD_LINES_PER_STEP` | 2 | Card lines shown per resolved step, in commit order |
| `CARD_BAND_FALLBACK` | `{ critical_success: 'success', success_at_cost: 'success', near_miss: 'failure', critical_failure: 'failure' }` | Nearest band when a card has no line for the exact band |
| `CARD_LINES_ENABLED` | `true` | Kill switch; `false` restores today's output |

## Tracing

N/A — no new trace. The frozen `cardLines` on `stepProseHistory` is the inspectable record (NFP #2), the same way `forecastTier` is (THR-2180).

## Fail-soft table

| Failure | Fallback |
|---|---|
| Committed id not on the composed step (retired card) | Skipped, as `collectNudgeBandProse` does today |
| Card with no line for the band or its fallback | No line for that card |
| `enrichProse` throws | The raw fragment, as the afterimage does |
| Old save, record without `cardLines` | Nothing renders (today's output) |
| Dealer returns an empty fill on a slice-2 step | The step reads "Theirs alone" again, as it does today |

## Kill criteria

- Slice 2: rerun the census instrument. If held moments for The First rise by more than **25%** (119 → over 149 on the same seeds and ticks), remove the deal from the most-started template first and re-measure.
- Slice 1: if the frozen line ever differs between the Stage and the Ledger for the same step, ship neither reader until they match.
- Warm round 4: a tester who played a card still cannot say what it did → the format (title + line) is wrong; note it on the ticket for the next round's plan.

## Three-pillar check

- [x] Engine pillar present (one frozen field, one pure helper)
- [x] Content pillar present (five deal declarations, every player word in the table)
- [x] UI pillar present (one line on two existing surfaces)
- [x] Wiring connects them (one interface contract, the wiki page, the wiring guide line)

## Vision audit

- [x] No Vision premise is contradicted (vault `Vision/00-north-star.md`, "the intervention has to feel consequential in both directions"; `Vision/01-core-loop.md`, the encounter step; `Vision/taste-profile.md`, mortal sovereignty). Slice 2 leans a little toward the god's agency in five chapters; step 0 only and the 25% kill bound hold that. It makes the god's touch felt in the result, which canon already requires ("the god's hand must be traceable in failure at any size").
- [x] No Vision edit is needed.

## Rulebook impact

- [x] This plan does not change a rule of play. The roll, the hand, the odds and the story breath are unchanged.
- [x] No `Docs/canon/rulebook.md` edit is needed.

> Brainstorm companion: `Docs/plans/2026-11-06-thr-2179-cards-say-how-they-landed-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | Cap, fallback map and kill switch are named constants |
| 2. Inspectability | PASS | The line is frozen on the step record that the Ledger and Stage both read |
| 3. Determinism | PASS | No PRNG added; the dealer is zero-PRNG; `enrichProse` takes the resolution's seeded rng |
| 4. Fail-soft | PASS | Table above; every miss renders nothing and nothing throws |
| 5. Narrative over mechanical perfection | PASS | Shows 1,310 authored lines and the library's fragments, which exist already |
| 6. Additive over destructive | PASS | One optional field, one helper, five optional declarations |
| 7. Performance budget | PASS | One lookup per committed card per resolved step |

## Done when

**Slice 1 — [Your cards say how they landed](https://linear.app/threadbare/issue/THR-2187):**
- [ ] A step resolved with a committed card shows that card's title and band line under its afterimage on the Stage, and the same text on the Ledger step.
- [ ] Unit tests on `cardBandLines`: all six bands, each fallback, the cap of two in commit order, a retired id skipped. A falsification arm: with `CARD_LINES_ENABLED = false` the record carries no `cardLines`.
- [ ] Browser evidence, four parts, at 1920×1080 on `?view=game&seeded&size=medium&spawn=encounter.barter_with_travelers&outcome=critical_failure` with a card committed that has no critical-failure line of its own (a `card.stumble.*` card, not `card.boost.core`): the screenshot shows the card's fallback line, the console output, `await window.__DEBUG.getOutcomePinVerdict()` read, and a UI-Laws line covering Laws 1, 13/14, 17, 21, 33, 37.
- [ ] Corpus sweep: over the census instrument's four seeds, no frozen `cardLines` entry contains an unresolved `{`; a sampled read of 20 rendered lines is recorded in the PR, and any line that reads as developer text is filed as a `Deferral` ticket.
- [ ] `step-card-lines-reach-the-reader` is registered in `scripts/interface-contracts.ts`, the interface map is regenerated, and the wiki page is updated.
- [ ] `npm run gate` is green; the review gate has passed (engine file).

**Slice 2 — this ticket:**
- [ ] The five templates' shipped objects (`getUnifiedTemplateById`) carry `steps[0].deal`, and `chapterOffersPlayerMove` is true for each.
- [ ] `check:encounter -- --all` stays within its ratchet.
- [ ] The census instrument, re-run on seeds 42, 99, 7 and 1234 at 600 ticks, shows none of the five reading "Theirs alone", and held moments within the kill bound.

## Coordination block

**Suggested model:** sonnet for both slices. Slice 1 is small engine and UI wiring with a direct precedent (THR-2180's frozen odds word). Slice 2 is five data declarations and a test.
**Parallel-safe with:** [rank words show their ladder](https://linear.app/threadbare/issue/THR-2182) and [the rail rows say what they are](https://linear.app/threadbare/issue/THR-2183) (the reach tiles and the god rail, not the step record).
**Mutex with:** any ticket editing `unifiedActionResolution.ts` around the step record (`:2630-2705`), the step model in `buildUnifiedEncounterStageModel.ts`, or the step block in `ChapterView.tsx` / `EncounterVeil.tsx`, because slice 1 adds a field to each. Slice 2 is blocked by slice 1, because without it a new hand pays off in no prose.

**Files to touch:**
- Slice 1, edit: `src/types/stepProseRecord.ts`, `src/types/chapterRecord.ts`, `src/engine/encounters/nudges.ts` (+ constants), `src/engine/unifiedActionResolution.ts`, `src/engine/chapterArchive.ts`, `src/engine/views/stage/buildUnifiedEncounterStageModel.ts`, `src/engine/views/stage/types.ts`, `src/components/Game/EncounterVeil.tsx`, `src/components/Game/ChapterView.tsx`, their tests, `scripts/interface-contracts.ts`, `Docs/canon/interface-map.md`.
- Slice 2, edit: `src/data/temple-of-spheres-encounter-content.ts`, `src/data/encounter-content.ts`, one new test under `src/data/__tests__/`.

## Notes for the executor

The census script lives on the proto branch, not on main. Copy it to `.cache/` to re-run it. It is the kill-criterion instrument, not a gate. If the card title adds noise in play, drop the title and keep the line. That is a wording call, and it is yours.

## Forked-audit verdicts

*design-audit-pipeline, 2026-11-06*

| Axis | Verdict | Note |
|---|---|---|
| NFP | PASS-with-notes | All seven PASS. Note: the executor confirms `activeNudges` still holds the committed hand where the record is built (already in § Engine pillar) |
| Three-pillar | PASS-with-notes → fixed | Wiring had no per-module table (now present). The band-prose helper is activated, not rebuilt |
| Vision | PASS-with-notes → fixed | No contradictions. The section cited no Vision file by path (now cited). Slice 2 leans a little toward the god's agency in five chapters, held by step 0 only and the kill bound. Nothing goes to Christian |

### Intent-judge verdict

**Allow** (Reversible), on the second run. The first run said **Revise**: the ticket's top-20 figure was missing (now 6 of 20); the Player-facing text had no rendered sample from an *authored* card and said nothing about how the 1,310 authored lines are checked (now a sample, the existing detectors named, and a corpus sweep in slice 1's Done-when); and the warm-round-4 kill criterion sat only in the proposal (now in the plan). Advisory from the re-run, folded in: the browser evidence commits a card with no critical-failure line, so the fallback is what shows.
