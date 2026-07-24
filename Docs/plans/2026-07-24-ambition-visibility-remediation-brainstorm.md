# Ambition visibility remediation — Brainstorm Companion

> Companion to `Docs/plans/2026-07-24-ambition-visibility-remediation.md`. Alternatives considered,
> tensions surfaced, Vision premises invoked. Written alongside the plan.

## How this started

The 2026-07-23 system-interface-map audit (THR-717) found ambitions engine-live but player-invisible: two contracts badged against this ticket (`ambition-player-visibility` PARTIAL, `ambition-completed-history` LEAKED). Christian's chat review verdicted the remediation the same day; this grooming pass turns those verdicts into an executable plan during the 2026-07-24 away-day queue prep.

## First-pass framing I considered

"Just lower the number" — drop `AMBITION_PRIMARY_INTERACTIONS` and ship. Too narrow: the gate is a two-sided OR (`interactionDepth` OR knowledge level), and the knowledge side was a *hardcoded string* (`'known'`), invisible to tuning — an NFP #1 violation hiding inside the gate this ticket exists to fix. Both sides needed to become named constants.

## Alternatives considered

**A. Depth-only gate (drop the knowledge-level branch).** Rejected — the knowledge ladder is how observation-at-distance reveals things; removing it would make watching an agent for days reveal less than one bump-in interaction. Both signals stay.

**B. Reveal primary ambitions unconditionally (no gate).** Rejected — knowledge gating is a Vision-consistent intelligence fantasy; strangers should be opaque. "First meaningful knowledge" (verdict) implies a low bar, not no bar.

**C. Completed ambitions as chronicle *events* instead of a dedicated list.** Rejected — milestone events already fire into the chronicle at completion time; the verdict asks for the *accumulated list* ("who they became"), which is a different read shape (biography, not feed). Both now exist; neither duplicates the other.

**D. Include failed/abandoned ambitions in the list.** Rejected as default — failure narrates through events already; the list is a biography surface. One-constant change if review disagrees.

**E. New `__DEBUG` bridge for ambition inspection.** Rejected — `getAmbitionsStrand` + `eval` already cover it; adding a bridge for a read-side UI fix is scope creep.

## Trade-off Card

Not run — all three decisions were user-verdicted before grooming; remaining choices were mechanical.

## Decision

User verdicts 1–3 as recorded in THR-721 (chat review 2026-07-23). Agent-set defaults flagged for review: Completed Ambitions shares the primary-ambition gate; failures excluded from the list.

## Tensions surfaced

- **Mystery vs. legibility:** the knowledge system wants agents to unfold gradually; NFP #2 wants motives readable. Resolved by lowering the *first* rung (primary drive = cheap to learn) while keeping secondary ambitions and deeper facets gated (verdict 3 made this explicit).
- **Tunability vs. shipped behavior:** the hardcoded `'known'` string was un-tunable; promoting it to `AMBITION_PRIMARY_KNOWLEDGE` makes the retune reviewable and reversible.

## Vision premises this plan leans on

- **The world runs on wants you can read.** This plan's version: the primary drive surfaces at first meaningful contact, so encounter choices stop looking arbitrary.
- **Failure is plot.** This plan's version: failed ambitions stay out of the biography list because they already live as story events; the list celebrates arcs completed.
- **Intelligence is earned.** This plan's version: the gate drops to "first meaningful knowledge," it does not vanish.

## Taste profile touchpoints

- **Prose over key-value:** entries render in the tabs' existing narrative idiom (`t214 — Avenge the burned village`), no new stat rows.
- **Design-system conformance:** shared primitives + tokens only, per the required section in the ticket.
