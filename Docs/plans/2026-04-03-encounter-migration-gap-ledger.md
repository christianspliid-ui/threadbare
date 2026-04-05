# Encounter Migration Gap Ledger

**Date:** 2026-04-03  
**Status:** Active Phase 5 working note  
**Why:** Keep encounter migration honest. Port what maps cleanly to existing runtime semantics, and explicitly mark everything else instead of flattening it into low-quality approximations.

---

## Policy

Phase 5 should follow this rule:

- **Port now** when the authored encounter consequence has a real unified-runtime consumer.
- **Mark and defer** when the consequence wants a primitive the runtime still does not have.
- **Do not fake missing primitives** with generic modifiers just to claim migration coverage.

This ledger exists so unsupported or thin encounter outcomes stop disappearing silently during migration.

---

## Source Of Truth

Repo-level factual audit lives in:

- [encounter-migration-audit.ts](/C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/data/encounter-migration-audit.ts)
- [encounter-migration-audit.test.ts](/C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator/src/data/__tests__/encounter-migration-audit.test.ts)

That audit currently classifies each legacy encounter template by final-step consequence coverage:

- live migrated signals:
  - `reward_pool`
  - `reputation_delta`
  - `tier_promotion`
- deferred legacy-only fields:
  - `traitModifiers`
  - `traitChanges`
- thin placeholders:
  - templates whose final step has no currently migrated live consequence signal

Use the audit module for live counts and template IDs. This doc is the policy layer, not a duplicated snapshot.

---

## What Is Live Today

These consequence channels already have real unified-runtime support:

- reward pool instantiation
- faction reputation progression for migrated faction encounter IDs
- reputation tally progression for migrated encounter IDs
- actor `reputationScore` changes from authored `reputationDelta`
- promotion-eligible growth via `tierPromotionEligible`

These are the seams to keep using while Phase 5 widens migration.

---

## What To Mark Instead Of Faking

If a migrated encounter wants any of the following, do **not** approximate it into a generic bonus/penalty just to keep moving:

- test shaping
- flip / reveal state
- task / progress carriers
- prevention / interception / recovery
- authored choice bundles or outcome forks

Those are component-library concerns and belong under the pattern work in:

- [2026-04-03-procedural-content-component-library-audit.md](/C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator/Docs/plans/2026-04-03-procedural-content-component-library-audit.md)

If we hit one of those during migration:

1. keep the encounter migrated only up to the last clean existing primitive
2. add or preserve the audit mark
3. note the missing primitive family in the implementation close-out

---

## Migration Invariant: Canonical Unified Registration

An encounter is **not** safely migrated to unified actions unless the real tick-time progression loop can advance it using the canonical unified template registry.

Failure mode we hit on `cg.quest.gate_duty`:

- debug spawn succeeded because `getUnifiedTemplateById(...)` could dynamically migrate the encounter by ID
- step 1 opened and looked correct in the UI
- but the orchestrator progression phase resolved templates only from the canonical `UNIFIED_ACTION_TEMPLATES` array
- because the encounter was missing from that canonical registry, the timer completed and then silently stalled instead of advancing to step 2

Why this is expensive:

- it mimics a content/network/support bug
- step 1 can appear fully functional
- the failure only reveals itself when the first beat duration elapses
- it is easy to misdiagnose as missing cast, missing location, or broken support bundle wiring

Working rule:

- if a unified encounter can only be spawned through fallback lookup, it is not migration-complete
- direct unified spawn plus real tick progression must be part of migration verification
- the canonical registry and the tick-time progression path must agree on encounter availability

Minimum migration check for every serious unified encounter:

1. confirm the encounter is present in the canonical unified registry
2. confirm direct unified spawn creates the action without relying on legacy progress shims
3. confirm the encounter advances across at least one real step boundary under the orchestrator tick loop
4. confirm the next-step notification is emitted after the authored duration

---

## How To Use This During Phase 5

- Use the audit module to find **thin placeholders** first. Those are good rewrite candidates because they are not blocked by hidden runtime semantics; they simply need richer authored consequences.
- Use the audit module to find **deferred legacy fields** next. Those are explicit migration gaps and should stay visible until a clean runtime consumer exists.
- When a design rewrite starts asking for hidden state, reveal tables, progress tasks, or prevention/recovery behavior, stop the migration pass and route that request to the component-library track instead of improvising.

---

## Working Interpretation

Right now, most encoded legacy encounter consequences are not blocked by exotic hidden mechanics; they are blocked by **thin authoring**. That means the next Phase 5 passes should keep doing two things:

- wire through every consequence that already maps cleanly
- leave a visible paper trail for the encounters that need better primitives rather than worse approximations
