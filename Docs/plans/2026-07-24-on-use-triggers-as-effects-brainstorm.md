# Item on-use triggers as effect primitives — Brainstorm Companion

> Companion to `Docs/plans/2026-07-24-on-use-triggers-as-effects.md`. Alternatives considered,
> tensions surfaced, Vision premises invoked. Written alongside the plan.

## How this started

The 2026-07-23 interface-map audit found the on-use trigger contract LEAKED: a complete, tested
resolver (`attachmentTriggers.ts`) with zero production importers, while tooltips promise breakage
and curses that never fire. Christian's chat review verdicted the remediation direction —
effects[] primitives, not wiring the legacy resolver. Groomed during the 2026-07-24 away-day
queue prep.

## First-pass framing I considered

"Design a new `on_outcome` effect primitive from scratch." The THR-718 judge's lesson (grep wide
before claiming absence) said check first — and the check found `ActionTriggerEffect` (TB-104):
an on-outcome trigger primitive **already wired into the orchestrator**, with events, predicates,
maxFires, and cooldowns. The right design extends it; a new primitive would have created the
second parallel path the user verdict forbids — ironically, in the name of avoiding one.

## Alternatives considered

**A. Wire `attachmentTriggers.ts` into resolution as-is.** Rejected — user verdict verbatim; a
parallel trigger path beside effects[] is the drift class the interface map exists to kill.

**B. New `on_outcome` effect primitive.** Rejected — `action_trigger` already IS that primitive,
in production. Extending it keeps one trigger vocabulary, one resolver, one call site.

**C. Extend `ReactiveEffect` with outcome triggers.** Rejected — reactive is the "things done TO
the agent" channel (its resolver header states the boundary); conflating agency directions makes
both harder to author and to reason about.

**D. Port all six legacy payload kinds.** Rejected — only the kinds authored content actually
uses get ported (predicate from the shipped `onUseTriggers` blocks). Speculative vocabulary is
dead vocabulary; `spawn_actor` etc. can be added when content wants them.

**E. Keep `onUseTriggers` as a tooltip-only display field.** Rejected — a field that renders
promises the engine doesn't keep is the pathology itself. The tooltip switches to reading the
live `action_trigger` entries; the field dies.

**F. Soft-deprecate instead of deleting the resolver.** Rejected — the dead-contract test rule
(DoD) and the user verdict both say retire; the deleted type field turns any straggler into a
build error, which is stronger than a deprecation comment.

## Trade-off Card

Not run — direction user-verdicted; the one structural choice (extend action_trigger vs new
primitive) is settled by substrate evidence, not preference.

## Decision

User verdict as recorded in THR-719. Agent-set defaults flagged for review: outcome-band event
names (`encounter_critical_success` / `encounter_critical_failure` / `encounter_at_cost`);
payload kinds limited to authored usage; tag-overlap gating dropped in v1 (predicate field covers
it if content ever needs it).

## Tensions surfaced

- **Additive-over-destructive vs one-substrate:** this plan deletes working (if orphaned) code
  and a typed field — sanctioned destruction, because the old shape structurally blocks the
  one-substrate goal and NFP #6 permits refactor "when old shape blocks progress." The
  build-failing deleted field is the safety net.
- **Vocabulary growth vs vocabulary honesty:** the payload-kind predicate (only what authored
  content uses) keeps the effects union honest — THR-736's lesson (fields nobody fills) inverted.

## Vision premises this plan leans on

- **Failure is plot.** This plan's version: a critical failure can now snap the blade or feed the
  curse — with authored prose landing in the event feed. Item drama becomes visible story.
- **One source of truth.** This plan's version: one trigger vocabulary (`action_trigger`), one
  resolver, one orchestrator call — no parallel paths.
- **Every promise the UI makes, the engine keeps.** This plan's version: tooltips finally tell
  the truth because they read the same data that fires.

## Taste profile touchpoints

- Narrative templates ported verbatim — authored prose is content, not collateral.
- No new UI surfaces; drama flows through the existing event feed and chronicle, where item
  moments belong.
