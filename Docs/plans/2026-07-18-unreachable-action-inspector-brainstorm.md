# Brainstorm companion — Unreachable-action inspector (THR-659)

Companion to `2026-07-18-unreachable-action-inspector.md`. Captures the alternatives weighed, tensions surfaced, and premises invoked — written alongside the plan, not retrofitted.

## The itch

The empty starter floor (THR-501) quietly changed the invariant "a shipped card is a reachable card" into "a shipped card is reachable **iff** some beat grants it." Nothing enforces or reports the gap. The knowledge of which cards are stranded lives only in an agent's session memory — a classic case of tribal knowledge that NFP #2 says should be a query. THR-656 (art for a card that *used* to be orphaned) is downstream evidence that the set genuinely moves as progression work lands, so a live detector beats a hand-maintained list.

## Alternatives considered

**A. `__DEBUG` helper + DebugPanel tab (chosen).** Mirrors the THR-490 `proseQualityReport` precedent exactly: pure module over static content, lazy-imported into the debug bridge, surfaced as one DebugPanel tab. Low surface area, deterministic, scriptable from CLI/preview_eval, and — critically for a *verification* exercise — a small, honest, three-real-pillar feature (Engine real, UI real, Content justified-N/A) rather than an all-N/A process change.

**B. A CI guard / failing test that asserts zero orphans.** Rejected for v1 *as the primary deliverable* — it would turn every deliberate "shipped but not yet wired" card into a red build, which is a policy decision (is a temporarily-orphaned card a bug?) that isn't settled. The inspector is the prerequisite; a guard can be layered on later once the team decides orphans are always-errors. The plan's Done-when includes a unit test for the report's correctness, not a zero-orphans gate.

**C. Fold it into the existing `listActions()` bridge.** Rejected — `listActions()` is agent-scoped and requires a loaded game; the orphan question is session-independent (it's about the static catalogue vs the static grant list). Coupling it to live state would make the answer depend on the run, which is wrong: a card is orphaned or not regardless of which world is loaded. The `proseQualityReport` (static, no GameState) precedent is the right mirror.

**D. Report *all* ungranted templates, including mortal/agent actions.** Rejected — that floods the report with templates the player was never meant to hold, burying the real signal. The one judgment call in the plan is therefore the player-reachable predicate: the denominator must match "what a player could ever see," which means reusing the drawer's own eligibility class (`targetActions.ts`) rather than inventing a new rule.

## Tension surfaced

**Collision with THR-613.** The grant source (`collectGrantedActionIds()`) lives in THR-613's actively-churned file, and both features touch the DebugPanel. Resolved by (a) *importing* a stable function rather than editing that file, and (b) declaring the DebugPanel-tab overlap as a soft mutex in the coordination block. The inspector is deliberately read-only toward progression: it detects orphans, it never grants — grant-wiring stays THR-613's, where the "never re-offer a held card" rule lives.

## Premises invoked

- **NFP #2 (Inspectability)** — "trace *why* something happened … flat state, pure functions." The orphan set is a pure function of two static registries; it should be queryable, not remembered.
- **NFP #4 (Fail-soft)** — even a dev tool degrades to a loud-but-alive report rather than throwing.
- **Load-bearing decision — additive over destructive (NFP #6)** — new module + one method + one tab; the beat catalogue and progression logic are untouched.
- **THR-501 empty-floor invariant** — the reason the tool needs to exist at all; the plan reads `STARTER_ACTION_IDS` live so the report self-corrects if that invariant is ever revisited.

## Why this was chosen as the THR-652 verification subject

THR-652 (Pure Claude Code Migration Phase-2 go/no-go) asks for "one real small design task" run entirely through the CC `design-session` path. This task is genuinely real (observed orphan set, referenced in live session memory), genuinely small (one leaf feature mirroring an existing pattern), zero-collision on new files, and — unlike an all-N/A process change — exercises the *full* governance gate (intent-judge + three-axis design-audit have real Engine and UI pillars to audit), making it a stronger go/no-go signal than a docs-only task would be.
