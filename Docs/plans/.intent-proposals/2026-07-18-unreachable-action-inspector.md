# Action Proposal — Unreachable-action inspector (THR-659)

## intent_quote

This plan doc is the **subject** of a verification task, not a direct user feature request. The governing user directive is THR-652 (Pure Claude Code Migration, Phase 2), authored from Christian's chat direction:

> "Pick a real small design task; run it as a CC `design-session`; verify the full chain with zero Cowork involvement: plan doc → PR → CI → merge → Ready for Dev → hourly pickup → Done."

The underlying real need the chosen task addresses is the THR-501 empty-starter-floor consequence, tracked in the executor's session memory:

> "any template not in some beat's `grantsActionIds` is UNREACHABLE forever — a mine of orphaned cards (`loc.bless_harvest`/`ward`/`fortify`/`place_of_power` remain)."

## scope (what this plan does)

Adds a dev-only, deterministic inspector — a pure module `src/engine/content-eval/unreachableActions.ts`, a `window.__DEBUG.listUnreachableActions()` bridge method, and a DebugPanel "Orphaned Cards" tab — that reports which player-reachable action templates are neither in `STARTER_ACTION_IDS` nor `collectGrantedActionIds()`, i.e. unreachable by any run. It reads three existing static registries and computes a set difference. It touches no game state, no tick loop, no beat catalogue, no player capability.

## scope (what this plan does NOT do — explicit non-goals)

- Does **not** grant, wire, or "fix" any orphaned card — detection only. Grant-wiring stays THR-613's domain (where the "never re-offer a held card" rule lives).
- Does **not** add a CI guard or failing test that blocks builds on orphans (deferred: a policy decision the team hasn't settled).
- Does **not** change the beat catalogue, progression logic, or `ascendant-beat-content.ts` (imports a stable function from it, edits nothing there).
- Does **not** add a player-facing surface, notification, or trace — dev-only, tree-shaken from production.
- Does **not** run in the tick loop.

## impact_class

Reversible — additive dev tooling (new files + two small additive edits); every change is a plain revertable commit; no runtime/game-state behavior changes.

## evidence cited

- **Linear issue:** THR-659 (executor target); THR-652 (governing verification task)
- **Vision premises invoked:** none — dev tooling, no game-design surface.
- **UL terms touched:** none new. Uses existing "action template", "beat", "starter action" — all already in UL/CLAUDE.md.
- **Canon pages consulted:** `Docs/canon/rulebook-quick-reference.md` (confirmed the five-verb action model / player-as-Ascendant framing that defines "player-reachable").
- **Prior plan docs this builds on:** THR-490 `proseQualityReport` precedent (static, session-independent `__DEBUG` report — the exact pattern mirrored). THR-501 (empty starter floor — the reason the tool exists).
- **Rejected approaches considered and dismissed:** CI-guard-as-primary (policy not settled); fold into agent-scoped `listActions()` (wrong — orphan-ness is session-independent); report all ungranted templates incl. mortal/agent (floods signal). See brainstorm companion.

## load-bearing decisions touched

- **"No inventing node types" / graph-is-everything** — respected; the inspector reads no graph, creates nothing.
- **THR-501 empty-starter-floor invariant** — respected and depended upon; `STARTER_ACTION_IDS` is read live so the report self-corrects if the floor is ever repopulated.
- No load-bearing decision is changed. This is why the impact class is Reversible, not High-risk.

## high-impact files touched (from Codesight)

None. New module + `debug-bridge.ts` / `debug-bridge.d.ts` (not in the ≥100-importer high-impact list) + a DebugPanel tab component. No Blast Radius section required. The imported functions (`collectGrantedActionIds`, `STARTER_ACTION_IDS`, `UNIFIED_ACTION_TEMPLATES`) are read, not modified.

## kill criteria

If the player-reachable predicate proves impossible to define cleanly from `targetActions.ts` without running the full contextual filter, the report's denominator would be untrustworthy — in that case, ship the raw "ungranted templates" list labeled as such (no player-reachable filter) and file a follow-up, rather than shipping a misleading precision. If the tool sees zero use in 30 days (checkable via whether agents cite it instead of hand-tracking), it was not worth the tab — leave it (cost is near-zero) but don't invest further (no CI guard).

## explicit user sign-off

N/A — Reversible impact class. The governing High-risk decision (the migration itself) already carries Christian's verbatim sign-off recorded in the migration plan's intent-judge verdict (2026-07-17). This plan is a low-risk instance produced *by* that approved process.

## author notes for the judge

This plan is unusual: it is the deliberately-small **subject** of THR-652's pipeline verification, chosen to be real-but-minimal. The one genuine design judgment is the "player-reachable" predicate (Engine pillar / Notes for executor) — I specified reusing the drawer's own eligibility class (`targetActions.ts`) rather than inventing a rule, and gave the executor an explicit kill-criterion if that proves infeasible. All three pillars are addressed with real (Engine, UI) or justified-N/A (Content) content, so the downstream design-audit has real substance to audit — intentional, to make the go/no-go a stronger signal than an all-N/A process change.
