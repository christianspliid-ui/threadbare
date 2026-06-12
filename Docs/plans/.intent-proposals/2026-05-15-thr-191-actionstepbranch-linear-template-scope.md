# Action Proposal — THR-191 ActionStepBranch scope

## intent_quote

> Deferral (THR-96): ActionStepBranch per-step branching for Lorekeepers Covenant templates
>
> During the Lorekeepers Covenant encounter migration, ActionStepBranch per-step branching was not added to the 15 templates.
>
> **What's needed:** Design a per-step branching approach for guild templates that fits the `BranchAwareAftermathConfig` structure, or document why ActionStepBranch is intentionally guild-template-exclusive. Apply to Lorekeepers templates if decided.

(Source: Linear issue THR-191 description, verbatim. This is an autonomous `keep-work-flowing` design session — no live user message; the issue description is the ask.)

## scope (what this plan does)

Resolves the THR-191 deferred question with a documented decision: step-level `ActionStepBranch` is intentionally exclusive to *branching encounters* (`src/data/encounters/`); linear-template encounters (guild/social/tavern/combat/borderland, including the 15 Lorekeepers Covenant templates) intentionally do not use it. The plan specifies a five-surface documentation/governance edit pass (the `ActionStepBranch` JSDoc, the encounters Canon page, the `template-encounter-rewrite` skill + `.agents/` mirror, the encounter-building checklist, and a superseded note on the THR-96 plan doc) plus one tracked Linear follow-up for the optional `authoredChoices → BranchAwareAftermathConfig.variants` format enhancement.

## scope (what this plan does NOT do — explicit non-goals)

- Does NOT modify any encounter template content — the 15 Lorekeepers Covenant templates are unchanged.
- Does NOT add, remove, or restrict any engine code — `ActionStepBranch`, `isActionStepBranch`, `resolveStepDefinition()` are untouched (the JSDoc edit is comment-only).
- Does NOT implement the `authoredChoices → BranchAwareAftermathConfig.variants` enhancement — that is deferred to a tracked follow-up as a format-level decision.
- Does NOT change any rule of play or Vision premise.
- Does NOT touch UI.

## impact_class

Reversible. All edits are additive doc/comment text across five named files plus one Linear issue; trivially revertable. No runtime behaviour change.

## evidence cited

- **Linear issue:** THR-191 (deferred from THR-96)
- **Vision premises invoked:** none — no Vision premise touched.
- **UL terms touched:** none new. References existing terms (encounter, branching encounter, linear template encounter, aftermath reaction).
- **Canon pages consulted:** `Docs/canon/encounters.md` (two-subtype model; the page already implies the split this plan makes explicit).
- **Prior plan docs this builds on:** `Docs/plans/2026-04-19-thr-96-lorekeepers-covenant-migration.md` (the parent migration; its "use ActionStepBranch on ≥3 templates" instruction is explicitly superseded by this decision).
- **Rejected approaches considered and dismissed:** Option A (extend `ActionStepBranch` to the 15 templates) — dismissed because it contradicts the canon subtype model, requires destructive rewrites against NFP #6, pays branch-authoring cost on ambient connective-tissue content, and delivers no player-visible gain over the existing aftermath-reaction choice surface. See plan doc §2.2.

## load-bearing decisions touched

- **"Everything is a graph node/edge"** — not changed; not relevant beyond confirming no new node/edge types.
- **Encounter format / subtype model** (not a numbered CLAUDE.md load-bearing decision, but a canon-level settled decision in `Docs/canon/encounters.md`): this plan *respects and makes explicit* the existing branching-vs-linear subtype split. It does not change the decision; it removes ambiguity about which primitive belongs to which subtype.

No load-bearing architectural decision from CLAUDE.md is being *changed*.

## high-impact files touched (from Codesight)

- `src/types/unifiedAction.ts` — ~205 importers. **The edit is JSDoc-comment-only** — zero compilation-semantics change, zero blast radius. Listed here for completeness; no Blast Radius section is warranted because no importer's behaviour can change from a comment edit. CC runs `npx tsc --noEmit` to confirm the file still parses.

## kill criteria

This decision is wrong if: (a) a concrete Lorekeepers (or other guild) template surfaces a genuine need for a *mid-quest mechanical fork* (different reach/difficulty/graph-ops by player choice) that the aftermath-reaction surface and `BranchAwareAftermathConfig.variants` demonstrably cannot express; or (b) the §3.6 follow-up design concludes that step-level branching, not aftermath-variant branching, is the right linear-template lever. If either fires: reopen THR-191, revert the five doc edits (all additive, trivially reverted), and either promote the specific template to a branching encounter via `encounter-pipeline` or revisit the format decision. The decision is cheap to unwind precisely because it changes no content and no code.

## explicit user sign-off

N/A — Reversible impact class, not High-risk. This is an autonomous `keep-work-flowing` session; the decision stays within the scope of the already-brainstormed Encounter Format Migration project and its canon subtype model.

## author notes for the judge

- This is a *governance* ticket. The "design work" the THR-191 ask requests is a decision, not a system — and the issue text explicitly offers "document why ActionStepBranch is intentionally [scoped away from] guild templates" as one of the two sanctioned outcomes. This plan takes that outcome and justifies it.
- The phrase "guild-template-exclusive" in the issue is mildly garbled; context (ActionStepBranch lives in `src/data/encounters/`, not guild files) makes the intent unambiguous: document why guild/linear templates do not get it.
- The three-pillar table is all-N/A. This is intentional and rationalised (§4 of the plan) — it mirrors the precedent set by THR-386, another Infrastructure/governance ticket in the same project that shipped all-pillars-N/A-with-rationale.
- Tension surfaced and resolved: the THR-96 plan doc (2026-04-19) explicitly asked for ActionStepBranch on guild templates, but the canon subtype model (2026-05-07) and the `template-encounter-rewrite` skill both treat ActionStepBranch as branching-encounter-only. The plan reconciles this in favour of the newer canon and marks the THR-96 instruction superseded.
- The one judgment call I am least certain about: whether to fold the `authoredChoices → BranchAwareAftermathConfig.variants` enhancement into THR-191 or defer it. I deferred it because it is a format-level decision touching ~115 templates, not a Lorekeepers-specific fix — folding it in would be scope creep against the THR-191 ask. It is tracked, not dropped.
