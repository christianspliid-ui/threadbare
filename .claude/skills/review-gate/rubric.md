# Review-gate rubric — what "mergeable" means in Threadbare

The reviewer judges a diff against these checks. **Each check is a pointer to its authority, not a copy of it** — read the authority when a check fires; if this page and the authority disagree, the authority wins and this page is stale. The agent owns this rubric (Christian owns game meaning, not code; THR-608). Keep it ≤ ~80 lines: a check earns a line by catching defects this repo actually ships.

A finding needs **all three**: a `file:line` in the diff, the check it breaks, and a concrete failure scenario (input/state → wrong output, crash, or silent no-op). No scenario, no finding. Style, naming taste and "could be cleaner" are not findings.

## A. Contracts — something reads what nothing writes (or the reverse)

1. **Reader with no writer / writer with no reader.** A new property, edge, GameState field or event that is read but never produced (or produced but never consumed) in production code. Grep the writer. Authority: `Docs/canon/interface-map.md`; precedent: the singular `domainCapability` has no writer.
2. **Unwired module.** A new engine module not called from the orchestrator/phase, a modal not rendered in `GameView`, a GameState field the UI never reads. Authority: `Docs/plans/wiring-checklist.md`.
3. **Tests that assert a dead contract.** A test that stays green because it constructs the state production never builds (hand-built fixture shape no writer emits). Authority: Docs/canon/definition-of-done.md (relocated from CLAUDE.md § Definition of Done, THR-1718) → "Update the interface map".

## B. Graph shape — load-bearing decisions

4. **Bare `getNodesByType('location')`** where settlements are meant — it returns both tiers. Use `getLocationNodes` / `getPlaceNodes` / `isPlaceNode` from `src/engine/sublocationShape.ts`. Precedent: THR-1346 truncated 235/391 settlements. Authority: CLAUDE.md § Load-Bearing Architectural Decisions (three-tier position).
5. **Relationship stored as an id in a property bag** instead of an edge. Authority: same section ("Relationships between entities are graph edges").
6. **New node type** (or new `NodeType` string) without a design doc. Authority: same section; `src/types/graph.ts`.
7. **In-place graph mutation without `touchWorld()` / `touchStructure()`**, or a memo/cache keyed on `gameState.graph` identity. Authority: same section; `src/engine/simulationRuntime.ts`.
8. **Module-scope cache** holding per-session engine state. Authority: same section ("owned per session").
9. **Encounter awareness via the location distance matrix** instead of hex distance. Authority: same section; `encounterAwareness.ts`.

## C. Non-Functional Priorities (CLAUDE.md § Non-Functional Priorities)

10. **Unnamed tuning number** — a magic number that changes game feel, inline in logic. (NFP 1.)
11. **Unseeded randomness** — `Math.random()`, `Date.now()` or iteration-order dependence feeding a simulation outcome. (NFP 3.)
12. **Throw on the tick path** — a `throw`, an unguarded `JSON.parse`, or a non-null assertion on data that can be missing, reachable from `runTick`. (NFP 4.)
13. **No trace** for a new decision or state change the player could ask "why?" about. (NFP 2.)

## D. Correctness the type system cannot see

14. **Wrong identity** — an id compared against the wrong id space (faction node id vs `factionDefId`; template id vs instance id; `@hero` resolved to the wrong actor). Authority: CLAUDE.md § Debugging Protocol.
15. **Off-by-one / inverted condition / unreachable branch** with a concrete input that exercises it.
16. **Async misuse** — a `__DEBUG` or engine accessor used without `await`; a promise whose rejection is dropped on a path that matters.
17. **Rejected approach reintroduced.** Authority: CLAUDE.md § Rejected Approaches.

## E. Process artifacts in the diff

18. **Close keyword misuse** — `Fixes/Closes/Resolves THR-XX` not alone on its own line, or naming an issue the diff does not close. Authority: Docs/canon/definition-of-done.md (relocated from CLAUDE.md § Definition of Done, THR-1718) (THR-738).
19. **Orphan deferral** — a new `// TODO` / `// DEFERRED` without `(THR-XX)`. Authority: Docs/canon/definition-of-done.md (relocated from CLAUDE.md § Definition of Done, THR-1718) → Log deferrals.

## F. How the game behaves

20. **A Game Design Law broken** — the diff breaks an [E] law in `Docs/game-design/laws.md`: a forecast that is not the roll (Law 18), a failure that lowers Reach (Law 24), an authored rate players do not get (Law 1). Authority: that book; precedents: THR-1575 (planner forecast ≠ roll), THR-1889 (Legendary set at 5%, paid 2.6%).

## G. What the player sees

21. **A UI Law broken** — the diff breaks an [E] law in `Docs/design-system/laws.md` in a way a player would meet. Judge only what CI does not already gate (the UI-debt ratchet, `styleguideSync`, the layout-contract and law-named tests cover hex colours, raw buttons, glyph icons, literal sizes, z-numbers, tooltip ids). The ones a diff shows and no gate catches: a magnitude rendered as a numeral or a raw internal key on a player surface (Laws 13, 14); a named subject rendered as plain text where it should link through the router (Law 21); a control that renders but does nothing (Law 25); a new per-kind panel, sheet or modal instead of a row on the subject's page (Laws 26, 58); a new always-visible element on the rails or top bar with no stated reason it earns the space (Law 53); a spend or a closed path on a single click (Law 48); an input with no visible acknowledgement (Law 47); an overlay that takes no focus or swallows Escape (Laws 23, 50). The failure scenario names the screen and what the player sees there. Precedents: THR-1004 (`${delta.toFixed(2)}` reached a chip), THR-1812 (a fix landed in a handler with no callers — Law 47 never held).

## Severity

- **high** — wrong game state, data loss, a crash, or a silent no-op of the feature the PR claims to ship.
- **medium** — a contract or shape violation that will bite the next author (a reader with no writer, a bare location sweep that happens to be harmless today).
- **low** — a missing trace or named constant with no behavioural consequence yet.

Only **high** and **medium** findings block. A confirmed **low** is recorded with disposition `fixed` or `rebutted` like any other, but the author may rebut it with "deferred: THR-XX" after filing the ticket.
