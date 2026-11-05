# Action proposal — while you were away (THR-2173, slice 1)

## intent_quote

Christian, chat 2026-11-01 (the period focus that ranks this work):

> "get the design lane to focus on UI and UX improvements for the next period. specifically legibility and usability of the different UI modules: are we using tried and true ux patterns for how humans read UI panels for how we organize the core UI panels and the information, including: relative text positions, font sizing, modularization and composition"

Christian, chat 2026-09-25 (the lane's mandate):

> "I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations, for example where we have agreed on a wayfinder map."

The ticket (warm playtest round 3 finding, THR-2173), testers verbatim:

> skimmer: "the first 8 minutes, a loading modal with a stuck timer, followed by a paid recap full of numbers. On a lunch break, that's my whole patience budget spent before I touch anything." / "put the player in one [encounter] within 60 seconds of returning"
> veteran: "The catch-up took about 4 minutes of real time and summarized almost nothing. To find 'what happened while I was away', I had to dig three clicks deep into a random hall's Story tab."
> story: "make the Chapter Ledger the front door: put it first when I come back"

Ticket design question: "What does a returning god see first — and is it a summary of the world, or the mortal's story?" Recommended direction: "On arrival, before the map, a short 'While you were away' card: three to five lines in story words, led by The First's chapters (what they finished, what they are doing now), then one line each for the world things that touch the player (a rival move on your ground, a town turned). One button opens the Ledger at those entries. Fix the estimate to step in 30 s below three minutes. Look at whether the warm-up can come back under ~90 s." Fixed when: "A warm round-4 tester names something that happened while they were away within their first ten actions, and the measured warm-up stays under 180 s."

## scope (what this plan does)

When a `?warm=<ticks>` warm-up ends, the existing warm-up card (`WarmStartOverlay`) stays up and turns into a recap of at most five lines. The First's finished chapters (as the Aftermath's `outcomeSentence`) come first, then what The First is doing now, then the god's places that slipped or grew. The place lines come from diffing the dominion band table taken before and after the warm-up. Names are links. The card has two buttons, Begin and Read it in the Ledger (opens the Ledger at The First's newest chapter). The time-left line steps in half minutes below three minutes. The recap is built by one new pure view module (`engine/views/warmRecap.ts`). The hook, the interrupt entry, the dialog host and the content registry each get additive edits.

## scope (what this plan does NOT do — explicit non-goals)

- No recap outside the warm arrival. The game has no saved worlds; the warm plan names that a product decision.
- Does not name the rival behind a slipped place (the lookup is broken; THR-2172 owns rivals).
- Does not shorten the warm-up itself (127 s, under the 180 s kill line; engine performance work).
- Does not re-run first-use captions on arrival (THR-2175's deferred item, decided no).
- Does not open the Ledger automatically; does not add a toast, badge or new screen.
- No engine rule, tick phase, stored field or PRNG change.

## impact_class

Reversible.

## evidence cited

- **Linear issue:** THR-2173
- **Vision premises invoked:** the mortal's story leads (The First as the spine), prose before numbers, the map is the table (THR-1823)
- **UL terms touched:** The First, Chapter Ledger, Dominion (band words Touched / Held / Sovereign), chapter. No new terms.
- **Canon pages consulted:** `Docs/design-system/laws.md`, `Docs/design-system/layout-zones.md`, `Docs/canon/rulebook-quick-reference.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-10-05-thr-1744-warm-playtest.md` (the lever, its kill criteria), `Docs/plans/2026-11-05-thr-2175-rail-rows-say-what-they-are.md` (deferred the caption question here)
- **Rejected approaches considered and dismissed:** auto-open the Ledger; world digest first; toast/badge; re-run captions; name the rival; shorten the warm-up — each in the plan's Decisions and the brainstorm.

## load-bearing decisions touched

- "The world graph is mutated in place — never key change detection on graph identity." The recap diffs a value snapshot (`bands` copied into a plain record at warm start), not graph identity.
- "Agent position is three-tier…" / "bare getNodesByType('location') returns both tiers": not used; the band table is keyed by the places the dominion phase already reads.

## high-impact files touched (from Codesight)

None ≥100 importers. Measured: `data/ui-content.ts` 44, `engine/views/interruptRegistry.ts` 15, `GameView.tsx` 7, `dialogSize.ts` 7, `useWarmStart.ts` 7.

## kill criteria

- The M-tier card scrolls or clips at 1920×1080 with five lines → cap at four.
- Warm round 4 shows testers clicking Begin unread and later asking what happened → the card is the wrong place; the next round's plan revisits, no second surface in this slice.

## explicit user sign-off

N/A (Reversible).

## author notes for the judge

- The ticket's design question (world summary or mortal's story) is decided by delegation from settled direction (The First as the spine; the ticket's own recommended direction). The lane judged it is not an open fork in what the game means, because the recommended direction and canon agree.
- "A rival move on your ground" from the recommended direction is delivered only as "a place slipped", without the rival's name, because the rival lookup is broken (THR-2172). This is a deliberate partial.
- "Look at whether the warm-up can come back under ~90 s" is not done here; the 180 s kill line still holds (127 s measured).
- The warm card is seen only through the `?warm` lever today (warm testers). The THR-1744 plan holds lever text to the Laws because testers read it as the game.
