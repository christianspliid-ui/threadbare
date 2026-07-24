# Items move capability tiers again — Brainstorm Companion

> Companion to `Docs/plans/2026-07-24-item-stat-contributions.md`. Alternatives considered,
> tensions surfaced, Vision premises invoked. Written alongside the plan.

## How this started

The 2026-07-23 interface-map audit (THR-717) found `attachment-domain-contributions` 🔴 LEAKED:
`computeRawScore` walks possession edges for contributions that every catalog entry writes as `{}`.
Christian's chat review verdicted the fix — finish the 2026-04-06 effects[] migration with a new
stat primitive, plus a dots magnitude indicator on the character sheet. This grooming pass (during
the 2026-07-24 away-day queue prep) turns those verdicts into an executable plan.

## First-pass framing I considered

"Fill in the empty `domainContributions` bags" — the smallest diff. Explicitly forbidden by the
user verdict, and rightly: it would fork the stat substrate (some items on node-props, some on
effects[]) and re-create the drift class the interface map exists to kill. The migration must
finish in one direction.

## Alternatives considered

**A. Fill bare `domainContributions` on possession entries.** Rejected — user verdict verbatim
("do NOT resurrect"); substrate fork.

**B. Route contributions through the test-shaper channel instead.** Rejected — shapers modify
*rolls*, not *capability tier*; tier gates eligibility and prose. Conflating them would make item
power invisible to prerequisites, which is the half of the fantasy currently missing.

**C. Remove the legacy node-prop artifact read once the effect exists.** Rejected — destructive;
traits/resources share the walk shape, old/modded artifacts may carry real values, and NFP #6 says
additive. The legacy read stays; a content test flags double-dipping.

**D. New dedicated dot component for magnitude.** Rejected — the user's ask names `StepDots`
reuse; a `variant: 'magnitude'` (no glow, filled/dim) keeps one dot language and leaves the three
existing StepDots consumers untouched.

**E. 10-dot scale.** Rejected — the established capability-dot language is 5:
`CAPABILITY_DOTS = 5` in the orphaned pre-modal sheet (`AgentDetailPanel.tsx:28` — precedent
only, untouched), sphere dots in `HexBreadcrumb.tsx:132–144`, and the 5-tier
`DOMAIN_WORD_SCALES` in DomainCard all agree. Five is corroborated, not a coin flip.

**F. Effect-level conditions/duration on stat contributions (cursed blade only at night…).**
Deferred as a non-goal — composition with `conditional`/`duration` wrappers is a natural later
extension; v1 is passive-while-possessed, keeping the resolver hook trivial and the power budget
auditable.

## Trade-off Card

Not run — the direction was user-verdicted; remaining calls were mechanical or explicitly banded.

## Decision

User verdict as recorded in THR-718 (chat review 2026-07-23). Agent-set defaults flagged for
review: 5-dot scale (matching DomainCard tiers), passive-only semantics in v1, band ceilings
(0.5 / 1.0 / 2.0) enforced by content test.

## Tensions surfaced

- **Power fantasy vs. balance:** the user's own power-budget note. Resolved by named band
  constants + a build-failing ceiling test — item power is tunable data, not scattered judgment.
- **One substrate vs. additive migration:** finishing the migration *and* keeping the legacy read
  alive looks contradictory; it isn't — new content has exactly one authoring path (effects[]),
  while the read side stays tolerant of history (NFP #6). The content test that flags
  double-dipping is the guard between them.
- **Symbol language vs. raw numbers:** dots beside prose tier words honor the no-key-value rule
  while giving the magnitude legibility the user asked for.

## Vision premises this plan leans on

- **Mechanics surface through prose, never numbers.** This plan's version: magnitude is dots +
  tier words + tooltip prose ("Iron +1 while borne") — no stat table.
- **A person, not a unit.** This plan's version: what a mortal carries visibly changes who they
  are on the sheet — possessions become biography.
- **One source of truth.** This plan's version: contributions feed the same raw score and sigmoid
  as traits and practice; no parallel XP-like channel.

## Taste profile touchpoints

- Shared primitives + tokens only (`StepDots` variant, `var(--step-*)` colors) — design-system
  conformance is a ticket requirement, restated in the executor notes.
- The dot row respects reveal gating — unknown domains stay mysterious (`???` + no dots).
