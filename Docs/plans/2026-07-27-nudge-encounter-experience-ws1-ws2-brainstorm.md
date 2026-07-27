# Brainstorm companion — Nudge encounter experience (WS1+WS2)

**Plan:** `2026-07-27-nudge-encounter-experience-ws1-ws2.md` (THR-774 + THR-775). Grill-me skipped with rationale: the design substance was litigated across the multi-day co-design session (mockups v1–v3 Christian-approved, program plan + WS0 gated) — this doc translates settled decisions onto the merged substrate.

## Alternatives considered

- **Two separate plan docs** — rejected: WS1 and WS2 must agree on the authored format (what the skills produce is what the stage renders); one doc kills the drift channel. Handoffs stay per-ticket.
- **New stage mount / dedicated nudge modal host** — rejected: `encounter-stage/` + the THR-668 interrupt registry already own pause + presentation; a second host reintroduces the interrupt-registration class of bug. Kill criterion encodes this.
- **Flag-day cutover from authoredChoices** — rejected: 28 branching templates convert in WS5 batches; the stage branches on data presence so rollout is per-template, compat is testable, and revert is content-side.
- **Hand state in GameState** — rejected: committed nudge ids ride the in-flight action (WS0); pre-commit toggling is ephemeral UI state. A GameState field would create save/replay coupling for no consumer.
- **Blocking WS1/WS2 on WS4 (image manifest)** — rejected: the fallback chain (EntityVisual gradient+glyph terminal) renders correctly art-less; WS4 upgrades in place.
- **Numbers in the designer view rendered in-stage** — rejected: the stage is player-truth (words only); designer numbers live in DebugPanel, preserving the words-not-numbers law at the surface where habits form.
- **Authoring band prose per hand-subset** — rejected as combinatorial; the base-band + `bandProse` rider composition (base must read correctly with any subset active) keeps authoring linear in hand size.

## Tensions surfaced

- **Hand size vs choice paralysis:** rulings demand "quite a few options"; the mockup showed 4–5. Guardrails 4–8 with sphere-coverage ≥4 are warn-level authorial constants, not hard gates — tuned after the first WS5 batch plays.
- **Legacy screens linger during migration:** two encounter UIs coexist for weeks. Accepted deliberately (additive doctrine); the compat proof is in WS2's Done-when so the legacy path can't silently rot.
- **THR-800's dead trait refs:** trait hooks in WS1 may only cite resolvable traits, which shrinks the authorable set until the repair lands — stated as a checklist rule rather than blocking WS1 on THR-800.

## Vision premises invoked

The intervention shifts the odds, not the outcome (the hand IS that sentence as UI); one complex story at a time (nudges exist only at the story_beat tier); failure is plot (mandatory misfire riders); words over numbers at every player surface.
