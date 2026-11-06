# Action proposal — a rival's move has a place and an answer (THR-2172, slice 1)

## intent_quote

Christian, chat 2026-09-25 (the lane's mandate):

> "I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations, for example where we have agreed on a wayfinder map."

The ticket (warm playtest round 3 finding, THR-2172), testers verbatim:

> story: "Rival gods kept 'waging war upon my dominion' and 'cursing my followers', and I never found out where that was happening, how bad it was, or what I could do about it." / "If the rival gods ever start taking Kael's things and I still can't tell how to respond, I'd stop playing."
> veteran: "every rival is 'wrathful'" / "Why every rival god is 'wrathful' toward me: nothing shows the cause."
> skimmer: "I found out *what* they're doing … but never found a way to *do* anything about it." / "give … the rival threats a single button that lets me act on them."

Ticket design question: "What does the player *do* about a rival in the mid-game — where does a rival's move land on the map, and what is the god's answer to it?" Recommended direction: "Every rival move that lands names the place it landed (a map link) and offers the existing cards that answer it there (ward, rekindle, a Mandate action — whatever the action catalog already holds; extend before green-field). Hostility gets a cause line ("wrathful since you took Iron Glade") and slow decay. A rival's name either opens a real sheet or loses the link styling." Fixed when: "A warm round-4 tester names one thing they did about a rival, and none says they could see rival threats but not act on them."

## scope (what this plan does)

A rival's probe toast fires only when its pressure lands on one of the god's places. It names the place and sphere and says whether the god's tending absorbed it, and a click opens the place (via a location ref on the event and a `rival_action` branch in `deriveNavigationTarget`). The existing flavour rng draw is kept and discarded to preserve the seeded stream. Rival temper starts at 0.3 ("hostile") instead of 0.5. It rises +0.08 when the god breaks one of its schemes, as well as the existing +0.03 per scheme beat, and cools 0.02 a quiet day to the 0.3 floor. It records its latest cause, which the rival panel shows as a sentence. The rival's name in the panel becomes a plain disclosure (no link styling). The opened entry adds the cause line, the last place pressed (a link) and one answer sentence naming the existing tending verbs. Two Chronicle lookups that print raw rival ids are fixed to read `rivalDefinitions`.

## scope (what this plan does NOT do — explicit non-goals)

- No new card or verb against rivals (the counter-card slice is the kill-criterion fallback).
- No rival graph node or Inspector page (a new node type needs Christian).
- No counter hints on scheme cards (next slice, after round 4).
- No change to raid frequency, throttle or pressure magnitude.
- No map overlay change.

## impact_class

Reversible.

## evidence cited

- **Linear issue:** THR-2172
- **Vision premises invoked:** rivals generated not fixed (CLAUDE.md rejected approaches); narrative over mechanical perfection (NFP 5); map is the table (THR-1823)
- **UL terms touched:** Dominion, Band, tend (existing); no new terms
- **Canon pages consulted:** `Docs/canon/rulebook.md` (Dominion paragraph :210), `Docs/canon/systems-inventory.md`, `Docs/design-system/laws.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-07-05-rival-activation-schemes.md` (THR-66 schemes), THR-1748 Dominion core (tending), `Docs/plans/2026-11-06-thr-2173-while-you-were-away.md` (defers rival naming here)
- **Rejected approaches considered and dismissed:** new ward card; rival node; flavour + place; decay to zero; wiring updateRivalState's +0.05 (see brainstorm)

## load-bearing decisions touched

- "No inventing node types without verification" — respected: rivals stay run state; no node.
- "Everything is a graph node/edge" — rivals were already run state before this plan; no new non-graph store is added beyond two fields on the existing `RivalState`.

## high-impact files touched (from Codesight)

- `src/engine/orchestrator.ts` — 163 importers. Plan carries a Blast Radius section.

## revision after the first judge run (Revise)

- Player-facing table now tags the toast, last-pressed, temper and answer rows PC-9. It names the cards the opened place page shows (Bind Thread — Location; Claim Dominion after the held-ground milestone, `MILESTONE_HELD_GROUND_FLOWERING` = 2). It makes the answer line honest about the milestone: "your seat, where your threaded stand, what you claim".
- Temper hover, scheme fallback and place fallback added to both tables.
- `### Playtest signal` subsection added.
- Warm climb: grep confirms one stored writer (scheme beat +0.03). The executor measures warm-300 on main first, with a Done-when row recording it. A climb not explained by beats means a missing writer, which joins E3.

## revision after the second judge run (Revise)

- The answer line now names all four `TendedBy` kinds in the held toast's words: "Places you tend shrug off its hand. Your seat, your threaded, a claim, or an anointed faction tends one."
- Scheme-cause and no-cause temper lines are added to the Player-facing text table (PC-9 / PC-1).

## kill criteria

- Warm round 4: a tester still says they could see rival threats but not act → the answer must be a card; next slice designs a counter-card.
- Rival toasts drop to zero in a warm run because every landing is throttled → tune the throttle in a measured slice.
