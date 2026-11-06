# Action proposal — 2026-11-06-thr-2179-cards-say-how-they-landed

## intent_quote

The ticket ([THR-2179](https://linear.app/threadbare/issue/THR-2179)) was filed by the design lane on 2026-11-05 from its decision on [THR-2174](https://linear.app/threadbare/issue/THR-2174), a warm-playtest finding. Its own words:

> 1. **Measure first.** Run a live census: which templates threaded mortals start, over a long seeded run, ranked by how often they start. Draw counts must come from live draws, not recipe averages. Report how many of the top 20 offer no move.
> 2. **Decide the bar.** How many of the god's mortal's chapters should give a hand. The lane may decide this within canon: the mortal decides, the god nudges, routine work never asks. It must keep the story breath and pacing (`PAUSED_STORY_BREATH_TICKS`, the tellings cap) unchanged or say why. If the answer changes what the game means (for example "every chapter asks"), reserve it for Christian.
> 3. **Decide the cheapest honest hand.** For the chosen chapters: a step-0 `deal` from the Repertoire alone, or authored nudges through the encounter pipeline. Measure whether a deal-only step pays its cards off in the prose at every band, as canon requires.
>
> **Done when:** A plan doc in `Docs/plans/` that holds the live census, the bar and the hand shape, handed off to Ready for Dev.

Upstream, THR-2174's finding (warm round 3, 2/3 testers): *"The player can't tell which chapters wait for their cards — The Gallows Pardon holds, while Heal the Sick, The Unmarked Crossing and The Oracle Consulted play out alone and hand over only the epilogue."* Christian's standing ruling for the lane (2026-09-25): *"you can probably iterate and progress designs without me in many situations."*

## scope (what this plan does)

Records a live census of the story chapters The First starts (4 seeds × 600 ticks): 103 story chapters, 72 already wait for the god, 31 play out alone, from 12 templates, five of which carry 74% of the alone starts. Item 3's measurement found that **no** card's band prose renders anywhere in the unified encounter flow (no production caller of `collectNudgeBandProse`, no field on `StepProseRecord`, no component reads `bandProse`). So the plan has two slices: (1) a bug fix that freezes up to two card lines per resolved step, through a nearest-band fallback, and renders them under the afterimage on the Stage and in the Ledger; (2) a step-0 pure-fill `deal` on the five chapters The First most often meets alone. Slice 2 is blocked by slice 1.

## scope (what this plan does NOT do — explicit non-goals)

- No hand on steps 1+ of the five chapters, and no hand on the other seven no-move templates.
- No authored specials, and no new band prose. Writing the missing critical-band lines for library cards is not in scope; the fallback covers it.
- No change to story breath, the tellings cap, attention modes, the hold rules or the THR-2178 words.
- No change to retinue ("Lives on") threads, which show no wait word.
- No change to Meet The First, which already renders its own band prose.
- No new UI surface, glyph or colour.

## impact_class

Reversible. Additive data and one optional record field behind a kill switch (`CARD_LINES_ENABLED`); slice 2 is five optional declarations.

## evidence cited

- **Linear issue:** THR-2179 (from THR-2174; its blocker THR-2178 is Done)
- **Vision premises invoked:** the god nudges, fate rolls, the god's hand traceable in failure (via `Docs/canon/encounters.md`)
- **UL terms touched:** Band Fragment, Dealt Hand, Deal Declaration (`Docs/ubiquitous-language/Encounters.md`). No new term.
- **Canon pages consulted:** `Docs/canon/encounters.md` (nudge-native, payoff at every band, rejected "a nudge with no failure-band payoff"), `.claude/skills/encounter-pipeline/reference/nudge-authoring-spec.md` § 3b
- **Prior plan docs this builds on:** `Docs/plans/2026-09-28-thr-1634-finish-the-encounters-the-player-meets.md` (deal hands into the most-fired templates); THR-2178 (the wait word); THR-2180 (the frozen odds word, the wiring precedent)
- **Rejected approaches considered and dismissed:** a hand on every step (+46% held moments); all twelve templates (+61%); authored specials; hiding alone chapters

## load-bearing decisions touched

- "The world graph is mutated in place" — not touched; the change is on the action record, not the graph.
- "Engine caches are owned per session" — not touched.
No decision is changed.

## high-impact files touched (from Codesight)

None ≥100 importers: `unifiedActionResolution.ts` 67, `chapterArchive.ts` 18, `encounters/nudges.ts` 17, `types/stepProseRecord.ts` 7 (grep importer counts on main @ `2b3bebee`).

## kill criteria

- Slice 2: held moments for The First rise more than 25% on the census instrument (119 → over 149) → remove the deal from the most-started template first and re-measure.
- Slice 1: the frozen line differs between Stage and Ledger for one step → ship neither reader until they match.
- Warm round 4: a tester who played a card still cannot say what it did → the format (title + line) is wrong; note it for the next round.

## explicit user sign-off

Not required (Reversible).

## author notes for the judge

- The ticket presumed deal-only payoff was the open question. The measurement showed card payoff is missing for **every** card, authored or dealt. I treated that as a bug against canon and the UL (rule 4: a bug or a consequence of shipped design is agreed work) and put it first, rather than reserving it.
- The bar is narrower than THR-1634's "a hand on every step". I chose step 0 only on pacing evidence: the ticket asked to keep pacing unchanged or say why, and every-step would add 46% more world stops for five chapters.
- The census runs The First alone in pause mode. Retinue mortals on "Lives on" never hold, so they cannot read "Theirs alone".
- The census instrument logs an action at first sight; `effectiveTier` read `none` on 27 starts (not yet assigned at creation). It does not affect the wait word's template reading.
- Uncertainty: whether `action.activeNudges` still holds the committed hand when the record is built (`unifiedActionResolution.ts:2678`). The plan tells the executor to confirm, and where to read it from otherwise.
