# Action proposal — Put the god in the climax (THR-2204)

## intent_quote

> "Yes, file them" — Christian, chat, 2026-11-12, approving the five tickets of the direction "make the middle a game" after the attended assessment session. This is ticket 4 of 5.

The ticket body (written in that session, recording what he agreed) asks:

> 1. How does a journey vision draw on the scene the mortal is in, and how does the player read its price and its weight before choosing?
> 2. What makes the Apotheosis the run's largest moment for the god: what the hand holds, what earlier play adds to or removes from it, and what the player reads when it lands?
> 3. What does the player do between the Return and the end of the age? […] The rulebook's Twilight Phase is the existing home for this.
> 4. What does the ending say about *this* run's First?

> Law 10 and Law 11 (fate picks the band, forks belong to the mortal: the fix is a bigger hand, never a chosen ending)

> Whether a run should hold more than one mortal's full journey is a question about what the game means. If the plan cannot settle question 3 without it, reserve that fork for Christian with the options built, and design the rest.

Done when: a merged plan doc answering the four questions with the words the player reads; a predicate for how a played run's ending differs from an unplayed one; three pillars and the laws named; implementation tickets filed with coordination blocks.

## scope (what this plan does)

It designs four build slices. (1) The Ordeal vision stops selling an outcome and becomes a roll the god leans on, and visions read the First's scene. (2) The Apotheosis is fitted to an uncertain bare forecast, deals the god's repertoire on top of its authored cards, grows with chapters the god paid into, and is warned by a premonition. (3) The Return gets a close button and a line naming what is left. (4) The Twilight's First beat and the harvest summary say what this god did at the Ordeal and the threshold, and the agency census gains two headline outcomes and the ending text. It reserves the second-journey question for Christian with three options.

## scope (what this plan does NOT do — explicit non-goals)

- Does not add a second First, an heir, or any new journey after the Return (reserved fork).
- Does not tune card prices or pool income (the purse ticket, THR-2216).
- Does not change the six endings, their gates, or how the Return scores them.
- Does not make the Twilight interactive: it stays "you watch, not act" (rulebook §8).
- Does not add new encounters; the Apotheosis template is extended, not replaced.
- Does not wire the census into any weekly lane (pipeline freeze).

## impact_class

Reversible — every change is additive data or optional fields behind existing paths; a docs-only PR now, code later in four slice PRs.

## evidence cited

- **Linear issue:** THR-2204
- **Vision premises invoked:** `00-north-star.md` (witnessing, choosing what kind of god), `02-non-negotiables.md` §1 (forks are the mortal's), via `Docs/game-design/laws.md` Laws 10, 11, 32.
- **UL terms touched:** Ordeal, Apotheosis, Aspect, Return, Twilight, First (all existing). No new player term.
- **Canon pages consulted:** `Docs/canon/rulebook.md` (§8 Twilight `:419`), `rulebook-quick-reference.md` (`:138`), `Docs/game-design/laws.md`, `Docs/ops/player-complaint-classes.md`.
- **Prior plan docs this builds on:** `2026-11-13-thr-2205-measure-whether-the-player-matters.md` (census, H1–H5), `2026-11-13-thr-2202-give-both-clocks-a-verb.md`, `2026-11-13-thr-2203-stop-only-for-real-decisions.md`, `2026-10-17-thr-1381-the-end-of-the-age.md`.
- **Rejected approaches considered and dismissed:** pure LLM/generated prose (epilogue, scene prose); a choice between endings; making the climax free.

## load-bearing decisions touched

- "Everything is a graph node/edge": new facts ride optional fields on the existing thread edge, no new node or edge type.
- "Agent position is three-tier": the scene read uses `located_at` and `resolveToParentLocation`.
- "No inventing node types": none invented.

## high-impact files touched (from Codesight)

`src/types/influence.ts` (147 importers) gains four optional fields on `ThreadEdgeProperties`; `src/types/unifiedAction.ts` (wide-blast) gains two optional step fields. Plan has a Blast Radius section.

## kill criteria

In the plan: fitted climaxes breaking most Firsts → raise the target; one variant dominating → halve the scene bonus; ending text differing while outcomes never do → revisit lean sizes before slice 4's wording ships.

## explicit user sign-off

Not required (Reversible).

## author notes for the judge

- The ticket said the vision price is not shown. Code shows it (`JourneyVignetteModal.tsx:141-149`), but without the pool; the plan corrects the premise rather than re-adding it.
- Measured on three seeds: the Apotheosis arrives at t361. Step 0 is Fated 0.83–0.91 with 7/7 playable; step 1 (the one that grants Aspect) deals 0 cards and does not hold. The plan puts the hand on step 1 and fits the odds.
- The probe did not answer journey visions, so the First's journey never reached the Ordeal or the Return on any seed. Question 3's evidence is the playtest only, and the plan says so. The census has the same blind spot, and slice 4 fixes it.
- The plan is ~350 lines and carries `Plan-size-exempt` as a four-slice programme doc, following the sibling plans of the same direction.
- The 0.45 fitted forecast and the lean sizes are starting numbers; the Done-whens are predicates.
- The purse re-decision (THR-2215) is inside its veto window until 2026-11-14T12:17Z; this plan sizes the climax in cards and forecast, so it does not depend on those numbers.
