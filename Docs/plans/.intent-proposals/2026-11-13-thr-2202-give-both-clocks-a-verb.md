# Action Proposal — Give both clocks a verb (THR-2202)

## intent_quote

> "Yes, file them" — Christian, chat, 2026-11-12, approving the five-ticket direction "make the middle a game", of which this is ticket 2, as recorded in the ticket body.

Ticket title (filed from that approval): "Give both clocks a verb — the mortal's deeds fill the Mandate, and Doom and rival gods each get an answer the player can play".

Ticket Done-when (verbatim):
> * A plan doc is merged in `Docs/plans/` that gives each of the three threats above a named player answer, with the words the player reads before and after using it.
> * Each answer costs essence from the same pools as nudge cards, so Law 30 holds.
> * The plan covers Engine, Content and UI, or marks a pillar N/A with its reason, and names the laws it touches.
> * Implementation tickets are filed from the plan with their coordination blocks.

## scope (what this plan does)

It designs three build slices. (1) A threaded mortal's chapter close credits the Mandate directly: a base amount when the chapter is in a Mandate sphere, plus the essence the god paid in Mandate spheres on that chapter's cards, scaled by band. The Mandate trend word reads the last day's change. (2) A sustained god card, Stay the Unmaking, slows Doom through the existing `doom_rate_multiplier` override, with upkeep from the primary pool. A second button on the Doom notice opens it. This slice first fixes a measured bug where an active multiplier compounds every tick. (3) A god card, Rebuke, played on a place a rival just pressed, tends it (a fifth tending kind, `rebuke`), pushes back, and raises the rival's temper. The rival toast is rewritten so it promises only what the game does. Both cards are generic milestone gifts.

## scope (what this plan does NOT do — explicit non-goals)

- It does not tune the purse or card prices. That is THR-2201; the prices here are named constants.
- It does not make undertaking milestones Mandate deeds.
- It does not add a counter per Doom stage card, or any Doom rollback.
- It does not add a rival graph node or a card that targets a rival god directly.
- It does not change the Mandate targets (80/20) or THR-2081's ledger rules.
- It does not change Claim Dominion's place on the ladder.
- It writes no `src/`: this is a plan doc.

## impact_class

Reversible.

## evidence cited

- **Linear issue:** THR-2202 (evidence tickets THR-2199, THR-2172; prior slice THR-2185)
- **Vision premises invoked:** north star (two clocks, small purse); non-negotiables §1 (influence, never command)
- **UL terms touched:** Mandate, Doom, Dominion, tending, rival temper. "Rebuke" names the card and the tending kind. The word "ward" was avoided because the UL already uses it for condition protection (death_prevented, tag_immunity).
- **Canon pages consulted:** `Docs/canon/rulebook-quick-reference.md` (:53, :136), `Docs/canon/rulebook.md` (:210, :409, :411, :415), `Docs/game-design/laws.md` (Laws 9, 16, 17, 22, 23, 26, 30, 31, 32, 36, 37, 38, 42, 43, 45)
- **Prior plan docs this builds on:** `Docs/plans/2026-10-28-thr-2081-god-caused-mandate.md`, `Docs/plans/2026-11-06-thr-2172-a-rival-move-has-a-place-and-an-answer.md`
- **Rejected approaches considered and dismissed:** see the plan § Decisions and the brainstorm companion

## load-bearing decisions touched

- "Relationships between entities are graph edges": the `thread` edge is read, and nothing new is added as a property relation. `rebukedPlaces` is keyed by place id on GameState, because rivals are not graph nodes (same pattern as `RivalState.lastPressed`).
- "No inventing node types": none.
- "World graph mutated in place": no identity-keyed change detection added.

## high-impact files touched (from Codesight)

`src/types/gameState.ts` (≥100 importers, additive optional field) and `src/engine/orchestrator.ts` (wide-blast). The plan has a Blast Radius section.

## kill criteria

See the plan § Kill criteria: deed credit overshooting 80 points before doom 0.4; Stay held all run with its cost unfelt; the Rebuke milestone never firing in a warm run because of the raid throttle.
