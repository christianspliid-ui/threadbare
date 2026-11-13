# Action Proposal — Stop the world only for real decisions (THR-2203)

## intent_quote

> "Yes, file them" — Christian, chat, 2026-11-12, approving the five-ticket direction "make the middle a game", of which this is ticket 3, as recorded in the ticket body.

Ticket title (filed from that approval): "Stop the world only for real decisions — chapters that open already won and aftermaths that needed no hand become a badge, and template chapters get hands that differ".

Ticket Done-when (verbatim):
> * A plan doc is merged in `Docs/plans/` that states the stop rule as a predicate over encounter state, and what the player sees for a chapter that does not stop.
> * The plan states what makes two template chapters deal different hands to the same god, and how that is measured on live deals.
> * The plan covers Engine, Content and UI, or marks a pillar N/A with its reason, and names the laws it touches.
> * Implementation tickets are filed from the plan with their coordination blocks.
> * Fixed when: in a later warm playtest round, no tester lists a chapter that "played itself" or "asked me nothing" among their worst moments.

## scope (what this plan does)

Two build slices.
- **Slice A.** An aftermath of a chapter the god did not touch (`godTouchedEncounter` false) is posted badge-only and never stops the clock. A pause-thread step whose forecast before any card is Fated, and whose hand is only dealt cards (no authored nudges), is posted with a short fuse on the existing auto-resolve path. It badges, and plays out unless opened. Authored steps always stop.
- **Slice B.** The dealer adds a stakes term by the step's authored difficulty (easy steps favour the guard cards, middle steps the free card, hard steps the boost). Its sphere-spread pass guarantees only the primary signature.

Slice A also edits the texts that state the rule:
- rulebook §3 (clock) and §7 (dealt hand), with the quick reference;
- game Law 27 (a moment matters when it offers the god a move or reports the god's own hand);
- UI Law 39 (every beat that offers the god a move interrupts);
- one sentence in `Vision/01-core-loop.md:61` mirroring Law 27.

These are the ticket's design question 1 written into canon. They are listed on the run's veto line.

A census on a never-merged proto branch measured the cause of the identical hands, and the effect of the change: the modal hand fell from 67% to 27% of 315 dealing steps.

## scope (what this plan does NOT do — explicit non-goals)

- It does not change how many chapters happen (Law 29), the tellings cap or `PAUSED_STORY_BREATH_TICKS`.
- It does not change journey visions (THR-2204) or Doom notices.
- It does not change any card's text, cost or odds, or any template.
- It does not add a shuffle or read the live forecast in the dealer.
- It writes no `src/` on main: this is a plan doc.

## impact_class

External. The code is reversible (two switches, `FATED_STEP_FUSE_ENABLED` and `UNTOUCHED_ENDING_BADGE_ENABLED`, and a deal flag), but slice A amends law, rulebook and Vision text that other lanes read. The approved ticket direction covers it (judge run 1).

## evidence cited

- **Linear issue:** THR-2203, with evidence from the 2026-11-12 expert session and THR-2174 (its 2026-11-05 decision and the shipped THR-2178).
- **Vision premises invoked:** north star (witnessing, not steering); core loop (time stops so that reading never costs time).
- **UL terms touched:** badge, Fated, "Theirs alone", dealt hand, Repertoire. No new term.
- **Canon pages consulted:**
  - `Docs/canon/rulebook.md` (`:84`, `:240`);
  - `Docs/canon/rulebook-quick-reference.md` (`:30`, `:68`, `:118`);
  - `Docs/game-design/laws.md` (Laws 4, 7, 13, 15, 18, 21, 27, 29, 42);
  - `Docs/design-system/laws.md` (Laws 39, 40, 52, 55).
- **Prior plan docs this builds on:** `Docs/plans/2026-08-25-thr-1247-dealt-hands.md`, and the THR-2178 / THR-2140 work cited in the substrate table.
- **Rejected approaches considered and dismissed:** see the plan § Decisions and the brainstorm companion.

## load-bearing decisions touched

None. No graph node or edge, no identity-keyed detection, no module-scope cache. `baseStepForecast.ts` is pure.

## high-impact files touched (from Codesight)

None at ≥100 importers.

## kill criteria

- Testers miss fused steps → lengthen the fuse.
- Guard cards crowd out the boost in early play → lower `DEAL_STAKES_WEIGHT`.
