# Action Proposal — 2026-07-04-action-catalog-gameplay-effects

## intent_quote

> taking a look at our actions catalog http://localhost:5348/action-catalog.html
> I can see that we do not really have en "Effect" described in gameplay terms only in prose. is this because the effects are not really implemented for all?

Follow-up (AskUserQuestion, same session): user selected **"Design + Linear issue"** — "I write a plan doc for an authored gameplayEffect field on templates + catalog emission, plus a separate issue for the 6 no-op actions, and hand off to CC via Ready for Dev."

Clarification (chat, same session, verbatim):

> descriptions and technical game effects are not the same. i want a technical game effect description for our game wiki (currently under construction)

## scope (what this plan does)

Adds an optional authored `technicalEffect` field to `UnifiedActionTemplate` — technical game-mechanical language, sourced from the resolving code, distinct from `description` flavor prose per the user's clarification. The catalog generator emits it plus a derived `effectSource` classification (grounded against template step ops, controlSpec, aftermath configs, and a new metadata-only `engineEffectRegistry` that aggregates existing id-keyed engine bridge lists). Catalog HTML renders an Effect line + wired/not-wired badge; Game Manual Wiki pages can consume the same JSON. Backfills the field for all 164 catalog entries. Schema version 1 → 2.

## scope (what this plan does NOT do — explicit non-goals)

- Does NOT implement the six no-op actions (`artifact.attune/nullify/curse`, `loc.fortify`, `sub.trap`, `sub.vision`) — sibling issue, needs its own effect design.
- Does NOT rewrite `description` flavor prose or touch ActionCard/tray layout.
- Does NOT surface the technical register in-game (Codex explicitly out of scope — wiki-only field; in-game prose-first rules unaffected).
- Does NOT auto-derive effect text from GraphOps.
- Does NOT cover non-ascendant (encounter/faction/army/monster) templates — they are outside the catalog per THR-519.
- Does NOT change any rule of play; no rulebook edit needed.

## impact_class

Reversible. (Additive optional field, additive exports, build-time generator change, doc/UI surfaces. Fully revertible by dropping the field.)

## evidence cited

- **Linear issue:** created at handoff (Action System & Unlocks project); builds on THR-519 (catalog generator), THR-521 (wiki infra), THR-390 (action audit).
- **Vision premises invoked:** none directly; supports prose-plainer direction + NFP #2.
- **UL terms touched:** none new — "Effect" is a plain catalog label, not a game concept. No UL-proposal needed.
- **Canon pages consulted:** `Docs/canon/process.md` conventions followed; not a content-authoring or rules-of-play task (rulebook quick-reference checked — no rule touched).
- **Prior plan docs this builds on:** `Docs/plans/2026-05-11-action-catalog-design-skill-spec.md`, THR-519 issue text, `Docs/design-reference-wiki.md`.
- **Rejected approaches considered and dismissed:** auto-derivation from GraphOps (fragile/half-blind), description rewrite (wrong reader, destroys flavor), hand-maintained HTML (THR-519's raison d'être). Detail in brainstorm companion.

## load-bearing decisions touched

- "Everything is a graph node/edge" — untouched; new field is node-internal template metadata (a property of authored data, not a relationship).
- "No inventing node types" / "new edge types need design" — respected; explicitly deferred to the no-op sibling issue.
- "Additive over destructive" — the plan's core mechanism.

## high-impact files touched (from Codesight)

- `src/types/unifiedAction.ts` — 278 importers (CLAUDE.md high-impact list). Blast Radius section present in plan doc: one additive optional readonly field, zero forced ripple.

## kill criteria

- If backfilled `gameplayEffect` text drifts back into flavor prose (spot-check at review: any entry failing "states a world-state consequence" test), the field has failed its purpose — revert emission and rethink as structured effect metadata instead of free text.
- If the `effectSource` derivation misclassifies >5 known-wired templates at implementation time, the registry approach is wrong — stop and redesign before backfill.

## explicit user sign-off

Not required (Reversible class). User's option selection quoted above.

## author notes for the judge

The single real judgment call: new field vs. rewriting `description` (whose docstring already promised game-mechanical text). Chose additive field because 116 authored descriptions are in production ActionCard use and their flavor register is intentional; the catalog's reader wants consequence, the card's reader wants texture. Uncertainty: exact set of id-keyed engine special-cases beyond the five found (hexActionBridge, perceiveRelay, divine.self.*, artifact.enchant, sub.sanctify sustained prose) — implementation must grep-verify when building the registry; the fail-soft badge makes any miss visible rather than silent.
