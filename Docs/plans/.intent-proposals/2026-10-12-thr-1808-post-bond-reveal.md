# Action proposal — 2026-10-12-thr-1808-post-bond-reveal

## intent_quote

From the ticket Christian filed (THR-1808, created 2026-10-10, cold playtest round 3):

> **Design question.** After the bond, in what order does the dashboard reveal itself, and what one sentence tells the player what to do first?

> **Recommended direction.** Stage the post-bond reveal across the opening gifts, which are already "one player act apart" (THR-1647). Each gift unlocks the one panel it is about: the seat brings Investiture, the first chapter brings the Chapter Ledger, and so on. Doom and Omen appear with the first beat that names them. Until then the screen shows The First, her current chapter and the essence bars. Give one standing line of direction ("Watch over Elara. Her next chapter is waiting →") until the player has resolved their first main-map chapter. Coordinate with the "gifts open over the player's click" and "can't read what they spend" tickets in this milestone, and keep the reveal order a data table so it is tunable.

> **Fixed when** no round-4 tester describes the post-bond screen as overwhelming or "no prompt", and each tester names their first goal on the map in their debrief.

> **Done when** this ticket's implementation tickets are filed into this same milestone (*Cold playtest · round 3*) and this ticket is closed by the design pass.

Tester notes quoted in the ticket: *"teach me the god-dashboard one word at a time instead of all at once."* / *"hide most of those 30 panels until I actually need them."*

Christian's standing ruling on the lane (2026-09-25): *"you can probably iterate and progress designs without me in many situations."*

## scope (what this plan does)

Adds a data table keying 18 dashboard surfaces to the bond, The First's first chapter, or a specific opening gift (spine beat), a pure engine selector that reads the existing beat history to say which surfaces are revealed and why, mount-site gating in the top bar, left rail and right sidebar, a standing direction line until The First's first post-bond chapter resolves, one "New on your table" toast per gift, one sentence added to The Seat's prose naming Doom and Mandates, a ceiling that reveals everything 200 ticks after the bond, and a "Show every panel" setting. Player copy says "New beside the map", avoiding "table" (THR-1823 uses it for the map). A Path Opens' prose gains the word "omens". Only worlds that arrive with The First unbonded are staged.

## scope (what this plan does NOT do — explicit non-goals)

- Does not change gift pacing, gates, grants, or the gift-delivery hold (THR-1647/1805/1809).
- Does not shorten the six setup screens before the bond (the ticket mentions it as evidence; the THR-1716 plan ruled the remembrance keeps its screens).
- Does not move panels between rails — that is The screen frame (THR-1828), whose decision is still inside its veto window and is not an input.
- Does not add a tutorial, coach marks or any interrupt.
- Does not add a win condition or change what Doom does (the veteran's "no win condition" note is out of scope; this plan only makes Doom's nature readable when it appears).
- Does not stage pre-bonded dev routes or warm starts.
- Follows both of the ticket's examples: The Seat brings Investiture, and The First's first chapter brings the Chapter Ledger.

## impact_class

Reversible — UI gating behind a data table and a setting; one optional GameState field; one prose sentence.

## evidence cited

- **Linear issue:** THR-1808 (and the orchestrator's staging comment on it)
- **Vision premises invoked:** `Vision/taste-profile.md` (IPK as the teaching surface; Real time, halting for every moment; one gold emphasis per panel), `Vision/00-north-star.md` (one complex story at a time), `Vision/03-design-tensions.md` § 4
- **UL terms touched:** The First, Chapter Ledger, Doom, Mandate, Omen, World-Soul, Reach — all existing; no new terms
- **Canon pages consulted:** `Docs/canon/design-governance.md`, `Docs/design-system/laws.md` (Law 53), `Docs/ops/player-complaint-classes.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-09-27-thr-1605-the-opening.md` (S5 quiet first screen), `Docs/plans/2026-10-04-thr-1716-arrival-first-beat.md`, `Docs/plans/2026-10-10-thr-1805-gift-waits-its-turn.md`, `Docs/plans/2026-10-11-thr-1807-terms-explain-themselves.md`
- **Rejected approaches considered and dismissed:** coach-mark tutorial, simple-mode toggle as the primary fix, time-based reveal, relying on empty-section hiding alone (brainstorm companion)

## load-bearing decisions touched

- "Everything is a graph node/edge" — respected; The First is found via the existing `thread` edge, no new node or edge.
- "The world graph is mutated in place — never key change detection on graph identity" — the selector is derived per render from state fields, not keyed on graph identity.

## high-impact files touched (from Codesight)

- `src/types/gameState.ts` (~700 importers) — one optional field; Blast Radius section present.

## kill criteria

- A round-4 tester still calls the post-bond screen overwhelming → move rows later (World Pulse and World-Soul first).
- A round-4 tester is blocked by a hidden panel → move that row earlier; if two or more rows need it, stage by chapter instead of gift.
- All three testers ignore the direction line → replace it with a pulse on The First's Threads row.
