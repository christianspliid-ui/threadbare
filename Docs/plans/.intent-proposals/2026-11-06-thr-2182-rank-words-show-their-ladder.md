# Action proposal — rank words show their ladder (THR-2182)

## intent_quote

Warm playtest round 3, veteran tester, quoted on the ticket:

> "Rank words (Formidable, Bartering, Phantom, Handy, Destined): no scale, no numbers, no tooltip."
> "The small number next to every person, hall and resource (4 / 3 / 2)"

The ticket's design question:

> How does a player read where a rank word sits on its ladder, and what the small number beside a person, hall or resource counts, without a hover and without a raw number (Laws 13/14)?

Christian's period focus (chat, 2026-11-01):

> "get the design lane to focus on UI and UX improvements for the next period. specifically legibility and usability of the different UI modules: are we using tried and true ux patterns for how humans read UI panels..."

## scope (what this plan does)

On the Inspector's person sheet, each reach tile gets a muted second line saying where the word sits on its ladder and the next word up ("Middle of the ladder · next Fearsome"), the rank word gets a hover listing its five-word ladder, and the reach title gets its existing `reach.*` hover. The Inspector's row card count chip shows its noun visibly ("4 cards"). The faction ladder's top word changes from "Formidable" to "Foremost" so one word names one place. Words and render only; three optional tile fields and one optional chip prop.

## scope (what this plan does NOT do — explicit non-goals)

- No number, percentage, pip row or meter for rank (Law 10/13/15).
- No rename of any mortal ladder word.
- No change to the god rail (slice 1, THR-2183) or to rank words on the encounter skill line or the thread row.
- No change to tiers, capability, faction scores or any rule of play.
- No change to other count chips (Needs you, the strip).

## impact_class

Reversible

## evidence cited

- **Linear issue:** THR-2182 (split from THR-2175)
- **Vision premises invoked:** words never numerals (Vision non-negotiable #3; Law 13)
- **UL terms touched:** Reach (display only); no new term
- **Canon pages consulted:** `Docs/design-system/laws.md` (1, 10, 11, 13, 15, 17, 18, 27, 29, 33), `Docs/ubiquitous-language/README.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-11-05-thr-2175-rail-rows-say-what-they-are.md`, `Docs/plans/2026-11-02-thr-2143-the-sheet-says-what-grew.md`
- **Rejected approaches considered and dismissed:** segmented meter (new glyph language), "3 of 5" (numeral), hover only (measured not to work), ladder renames (content canon)

## load-bearing decisions touched

None. No graph, node, edge, position or cache change.

## high-impact files touched (from Codesight)

None with ≥100 importers (measured by grep: `types/detailPage.ts` 49, `data/domain-words.ts` 27, `shared/Section.tsx` 11, `shared/Chip.tsx` 8).

## kill criteria

- The subline takes more than two lines in a tile, or the Prowess row starts the Inspector scrolling at 1920×1080: shorten to "next {word}".
- A warm round-4 tester reads "Middle of the ladder" as a score: drop the place words.
- A tester still asks what the row count is with "cards" showing: next slice opens the tray on hover.
