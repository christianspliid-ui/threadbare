# Action proposal — every card says what it buys (THR-2146)

## intent_quote

> "get the design lane to focus on UI and UX improvements for the next period. specifically legibility and usability of the different UI modules: are we using tried and true ux patterns for how humans read UI panels..." — Christian, chat, 2026-11-01

> "we want exact and understandable game effects … it is impossible for the player to understand what they are getting … hidden in prose, which for these particular game effect chips is the opposite of the design." — Christian, chat, 2026-08-23 (consequence chips)

Ticket THR-2146 (filed from cold playtest round 6): "What does each card tag tell the player at the moment they choose a card, and does it need to be on the card face at all, or only in its hover? Done when this ticket's implementation tickets are filed into this milestone and the design pass closes this ticket."

Tester evidence (round 6): story — "Card tags (Create, Find, Cosmic, Cache, Balm, Boost, Kindled ambition…): card categories, I guess. Only 'Boost' ever visibly changed the odds. I couldn't see what Balm or Kindle bought me after paying for them." / "Nothing tells me what Balm will actually do." Veteran — "Non-Boost cards (Cache, Compulsion, Kindled ambition). They don't move odds … nothing confirms it." / "Scale: Cosmic". Skimmer — "Coloured circle icons next to card prices: no guess."

## scope (what this plan does)

Card faces in the hand (nudge cards and action cards, one shared `CardFace`). A card that does not move the odds gets a result line in the odds slot naming the exact game effect on the named mortal. A remove-condition card whose target has no such condition is withheld from the hand, as other unusable cards already are. The price row keeps only the price and the paying pool's word; the reach mark moves beside the kind chip with its word. Action cards keep one kind chip; scale moves into its hover. The card's own world write reaches the Aftermath as ordinary chips.

## scope (what this plan does NOT do — explicit non-goals)

- Does not rename, remove or re-icon any card type chip or verb glyph (verb glyphs await Christian's pick, THR-1908).
- Does not change any authored card line, cost, odds or deal scoring.
- Does not touch the Aftermath legend (SCAR / BOND / BOON / PATH "too much to take in").
- Adds no number to any surface; no legend panel.
- Does not change the sphere tint on cards.

## impact_class

Reversible.

## evidence cited

- **Linear issue:** THR-2146
- **Vision premises invoked:** vault `Vision/taste-profile.md` (prose-first UI, no numbers visible)
- **UL terms touched:** Repertoire, Dealt Hand (unchanged); no new terms
- **Canon pages consulted:** `Docs/design-system/laws.md` (Laws 9–18, 25, 45, 56), `Docs/canon/rulebook-quick-reference.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-07-30-nudge-card-repertoire.md` (THR-887), `Docs/plans/2026-09-09-thr-1002-card-grammar.md`
- **Rejected approaches considered and dismissed:** dropping type chips (Repertoire vocabulary), a hand legend (extra surface), rewriting authored lines (loses voice, cannot name target)

## load-bearing decisions touched

- Everything is a graph node/edge: the no-target check reads the existing condition edge; no new storage.
- Engine caches per session: untouched.

## high-impact files touched (from Codesight)

`src/types/unifiedAction.ts` (721 importers): one optional field, `nudgeWrites?`. The plan carries a Blast Radius section, and the PR passes `review-gate`. No other touched file reaches 100. Files importing each of the others (`grep -rln "<basename>'" src | wc -l`): `ui-content` 63, `nudge-stage-content` 33, `encounters/nudges` 31, `buildNudgePhaseModel` 24, `CardFace` 13, `nudge-card-display` 10, `actionCardModel` 3, `phaseAutonomousAftermath` 2.

## kill criteria

If cold playtest round 7 still lists Balm, Cache or Kindled ambition as never understood with the result line on screen, the line moves above the authored effect line. If a tester reads the reach word as a second price, the reach mark returns to icon-only and is re-tested.
