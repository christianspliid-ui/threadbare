# CLI Aftermath Hook — Headless Auto-Pick for Modal-Gated Aftermath Reactions

**Linear:** THR-257 · **Project:** Encounter Format Migration · **Created:** 2026-04-23 · **Author:** Cowork

## Problem

Aftermath effects (`hidden_mark`, `intelligence`, `encounter_seed`, `reputation_tally`) are gated behind a player reaction in `EncounterVeil`. The headless CLI (`npm run cli`) and Playwright/Claude-in-Chrome verification scripts cannot exercise these effects because there is no headless way to pick a reaction. THR-134's verification run (E9/E10/X6) silently skipped aftermath events, which is exactly the failure mode the migration is supposed to eliminate.

We need a headless hook so future audit runs can confirm aftermath effects fire end-to-end without a human clicking the modal.

## Why this is design-shaped (not pure executor work)

THR-257's "What to do" lists three plausible approaches: a CLI command, an `--auto-aftermath` flag, or a `__DEBUG` bridge method. Each surface (CLI vs browser headless) has different consumers (audit scripts, Playwright tests, agent-analyser exports). The right answer is "ship the shared engine seam once, then expose it on both surfaces" — but only if we extract the right seam. This plan picks the seam and the surfaces.

## Approach (one engine seam, two surfaces, one optional auto flag)

### Engine seam

Today the React-side handler `handleEncounterAftermathReaction(reactionId)` in `src/components/Game/GameView.tsx:2029` does three things in one closure:

1. Resolve the pending aftermath context: looks up `tieredEncounterState.encounter.aftermathSummary.reactions`, finds the matching `unifiedActions[encounterId]` action, and gets the `runtime`.
2. Call the engine: `applyEncounterAftermathReaction(state, action, reaction, tick, runtime)` (already exported from `src/engine/encounterAftermath.ts:211`).
3. Apply UI mutation tracking (`pendingAftermathMutations.touched{World,Structure}`) and ad-hoc THR-117 condition_attachment glue.

Steps 1 and 2 are the headless-reusable bit. Step 3 is React-only.

**Extract step 1 to a pure helper:**

```ts
// src/engine/encounterAftermath.ts (new export)
export interface ResolvedAftermathContext {
  readonly action: UnifiedAction;
  readonly reaction: EncounterAftermathReaction;
}

export function resolveAftermathContextForAgent(
  state: GameState,
  agentId: string,
  reactionId?: string
): ResolvedAftermathContext | { error: string } {
  // Find the unifiedAction for this agent that has an unresolved aftermathSummary
  // (action.aftermathSummary present AND no aftermath_applied trace fired yet for this run).
  // If reactionId is omitted, return the first reaction in
  // action.aftermathSummary.reactions (deterministic — array order is authored,
  // not PRNG-dependent).
  // If reactionId is provided, match by id; return error if not found.
}
```

This helper has no React/UI dependencies. CLI and `__DEBUG` bridge both call it, then call the existing `applyEncounterAftermathReaction`.

### Surface 1 — CLI commands (`scripts/cli.ts`)

Two new commands, following the existing `case 'spawn':` switch pattern in `handleCommand`:

| Command | Behaviour |
|---|---|
| `aftermath list <agent>` | Print all available reactions for the agent's pending aftermath: `<reactionId> — <label>`. If none pending, print `(no pending aftermath)`. |
| `aftermath pick <agent> [reactionId]` | Resolve context, call `applyEncounterAftermathReaction`, print `applied <reactionId>` plus a one-line summary (touchedWorld/touchedStructure flags + count of effects). If `reactionId` omitted, picks first available; print which one was auto-picked. |

`<agent>` resolves via the existing partial-id/name match used by `agent`, `move agent`, `spawn encounter`, etc. (`@hero` shortcut already supported in those commands.)

### Surface 2 — `--auto-aftermath` flag on `run`

`run [N] [--auto-aftermath]` — when set, after each tick the CLI scans `state.unifiedActions` for any action with an unresolved `aftermathSummary` and auto-picks the first reaction. Prints one line per auto-pick: `tick N: auto-aftermath <agent> → <reactionId>`. This is what verification scripts will use to keep the loop unattended for 60 ticks.

The flag is opt-in. Default `run` behaviour is unchanged — no silent picks.

### Surface 3 — `__DEBUG` bridge for browser headless

Two new methods on `window.__DEBUG` (browser-side):

```ts
window.__DEBUG.listAftermathReactions(agentQuery: string)
  → { reactions: { id: string; label: string }[] } | { error: string }

window.__DEBUG.pickAftermathReaction(agentQuery: string, reactionId?: string)
  → { success: boolean; reactionId?: string; touchedWorld?: boolean;
      touchedStructure?: boolean; message?: string }
```

Wired via the existing `_registerAftermathBridge` pattern (mirrors `_registerActionBridge` at `src/debug-bridge.ts:111`). GameView registers a bridge object whose `pickAftermathReaction` invokes the same `handleEncounterAftermathReaction` flow already in place — no second code path, no risk of skew.

### Refactor of GameView's existing handler

`handleEncounterAftermathReaction` shrinks to:

```ts
const handleEncounterAftermathReaction = useCallback((reactionId: string) => {
  const context = resolveAftermathContextForAgent(gameState, ascendantAgentId, reactionId);
  if ('error' in context) { console.warn(context.error); return; }
  // ... existing setGameState + mutation tracking + THR-117 glue using context.action / context.reaction
}, [/* deps */]);
```

This means the player-facing modal flow uses the same resolution helper as the headless surfaces — fixes drift risk, and shrinks the modal handler.

## Three-pillar coverage

### Engine pillar

- **New export:** `resolveAftermathContextForAgent(state, agentId, reactionId?)` in `src/engine/encounterAftermath.ts`.
- **Reuses existing export:** `applyEncounterAftermathReaction(state, action, reaction, tick, runtime)` (line 211).
- **No new graph nodes/edges, no new tick phases.** This is a tooling seam over an existing engine call — pure additive.
- **Determinism preserved:** `applyEncounterAftermathReaction` already uses `reactionId` as part of its PRNG salt (`encounterAftermath.ts:175` — `salt = ${encounterId}_${reactionId}_${effectIndex}`). Auto-picking the first reaction is deterministic given the same state; same seed + same tick + same encounter = same first reaction = same effect outcomes.
- **Constants table:**

  | Constant | Default | Purpose |
  |---|---|---|
  | `AUTO_AFTERMATH_TRACE_CATEGORY` | `'cli_auto_aftermath'` | Trace category emitted by CLI auto-pick path so audit runs can grep for it. |
  | `AUTO_AFTERMATH_MAX_PICKS_PER_TICK` | `8` | Safety cap — if more than 8 agents have pending aftermath in one tick, the rest carry over. Prevents runaway loops. |

- **Tracing:** new `cli_auto_aftermath` trace `{ tick, agentId, encounterId, reactionId, source: 'cli' | 'debug-bridge' }` emitted whenever a headless surface picks a reaction. Production-safe (never fires in browser player flow). Existing `encounter_aftermath_applied` trace continues to fire from `applyEncounterAftermathReaction` regardless of source.

- **Fail-soft table:**

  | Failure case | Fallback |
  |---|---|
  | Agent query matches no agent | CLI prints `no agent matches "<query>"`; `__DEBUG` returns `{ error }`. No state mutation. |
  | Agent has no pending aftermath | CLI prints `(no pending aftermath)`; `__DEBUG` returns `{ error }`. No state mutation. |
  | `reactionId` provided but not in `aftermathSummary.reactions` | CLI prints `unknown reaction "<id>"; available: <list>`; `__DEBUG` returns `{ error }`. |
  | `reactions` array empty (template authored without reactions) | Treated as "no pending aftermath" — same fallback as above. Audit-loud: emits `cli_auto_aftermath` trace with `reactionId: null` and `outcome: 'no_reactions_authored'` so the verification script can flag content gaps. |
  | `applyEncounterAftermathReaction` throws | Caught at the surface boundary; CLI prints stack trace, `__DEBUG` returns `{ success: false, message }`. Tick loop continues. |

### Content pillar

**N/A — no new authored content.** This is a debug/tooling capability over existing aftermath content already shipped by the encounter migration. No new templates, prose tables, attachments, or data tables.

### UI pillar

- **No player-facing UI change.** The aftermath modal (`EncounterVeil` reactions section) continues to work exactly as today.
- **DebugPanel:** the existing trace tab will surface the new `cli_auto_aftermath` traces alongside the existing `encounter_aftermath_applied`, so a developer running with debug panel open can see auto-picks live. No new tab needed.
- **Documentation surfaces** (this is the "UI" for tooling):
  - `CLAUDE.md` — extend the "Headless CLI" section table with the two new commands and the `--auto-aftermath` flag. Extend the "Debug Bridge" code block with the two new `window.__DEBUG.*` methods.
  - `src/debug-bridge.d.ts` — add type signatures for `pickAftermathReaction` and `listAftermathReactions`.

## Wiring

| Module | Wired into |
|---|---|
| `resolveAftermathContextForAgent` (new) | Called by GameView's `handleEncounterAftermathReaction`, by CLI `aftermath pick/list` commands, by `__DEBUG.pickAftermathReaction/listAftermathReactions`. |
| CLI `aftermath` command | Added to `handleCommand` switch in `scripts/cli.ts` (alongside `spawn`, `move`, etc.). Help text added to `printHelp`. |
| CLI `--auto-aftermath` flag | Parsed in `parseArgs` (CLI launch flag) and recognised by the `run` command's tick callback. |
| `__DEBUG.pickAftermathReaction` / `listAftermathReactions` | Registered via new `_registerAftermathBridge` callback in `src/debug-bridge.ts`, mirroring `_registerActionBridge` pattern. GameView registers an object whose methods delegate to the same handler flow as the modal. |
| Trace emission | `cli_auto_aftermath` trace type added to `src/types/trace.ts`. Emitted only by the CLI auto-pick path and `__DEBUG.pickAftermathReaction`. |
| Documentation | `CLAUDE.md` CLI + Debug Bridge sections updated. `src/debug-bridge.d.ts` extended. `Docs/plans/wiring-checklist.md` gets a row for the new debug-bridge surface. |

## Acceptance criteria

These match the THR-257 acceptance criteria with concrete verification steps:

1. **Headless mechanism exists for both CLI and browser:**
   - `npm run cli` → spawn an encounter with aftermath → `tick 5` to advance to aftermath → `aftermath list <agent>` shows reactions → `aftermath pick <agent> <reactionId>` succeeds.
   - In browser dev console: `window.__DEBUG.listAftermathReactions('serafina')` returns reactions; `window.__DEBUG.pickAftermathReaction('serafina')` succeeds.
2. **End-to-end trace verified:** after `aftermath pick`, `traces 200` (CLI) or `__DEBUG.getTraces()` (browser) shows both `cli_auto_aftermath` (new) and `encounter_aftermath_applied` (existing) for the same encounter.
3. **Auto flag works for unattended runs:** `npm run cli -- --seed 42 --map medium --auto-aftermath` then `run 5` for 60 ticks; transcript shows at least one `tick N: auto-aftermath` line, and `traces 200` shows `encounter_aftermath_applied` events.
4. **Modal flow unchanged:** in browser, click an aftermath reaction button manually — still works; same trace fires.
5. **`CLAUDE.md` updated:** CLI section lists `aftermath` commands + `--auto-aftermath` flag; Debug Bridge section lists the two new methods.
6. **Tests:**
   - Unit test for `resolveAftermathContextForAgent` covering: no agent match, no pending aftermath, unknown reactionId, empty reactions array, happy path with explicit reactionId, happy path with auto-pick.
   - Integration smoke test that the modal handler and CLI surface produce identical state mutations (snapshot equality) when given the same starting state and reactionId.

## Coordination block (Cowork → CC handoff)

- **Suggested model:** sonnet (touches engine seam + two surfaces + tests + docs; haiku would miss the resolver-extraction subtlety, opus is overkill).
- **Parallel-safe with:** THR-255, THR-256 (both touch unrelated test/trace files in the Encounter Format Migration project; no overlap with `encounterAftermath.ts`, `cli.ts`, `debug-bridge.ts`, or `GameView.tsx`).
- **Mutex with:** any other in-flight issue that modifies `src/engine/encounterAftermath.ts`, `scripts/cli.ts`, `src/debug-bridge.ts`, or `src/components/Game/GameView.tsx` aftermath path. As of this design no such issue is in flight; verify before claiming.
- **Codex review:** yes — engine seam extraction + dual-surface wiring benefits from a structural review pass.
- **Files to touch:**
  - `src/engine/encounterAftermath.ts` (new export)
  - `src/engine/__tests__/encounterAftermath.test.ts` or new `resolveAftermathContext.test.ts` (unit tests for resolver)
  - `scripts/cli.ts` (new commands + flag)
  - `src/debug-bridge.ts` + `src/debug-bridge.d.ts` (new bridge methods + types)
  - `src/components/Game/GameView.tsx` (refactor `handleEncounterAftermathReaction` to use resolver; register aftermath bridge)
  - `src/types/trace.ts` (new `CliAutoAftermathTrace`)
  - `CLAUDE.md` (docs)
  - `Docs/plans/wiring-checklist.md` (one-row update)
- **Done when:** all six acceptance criteria pass; `npm test`, `npx tsc --noEmit`, `npx vite build` clean; commit message uses `Fixes THR-257`.

## NFP compliance

| NFP | Status |
|---|---|
| 1. Tunability | PASS — two new constants in the constants table, both named. |
| 2. Inspectability | PASS — new `cli_auto_aftermath` trace surfaces every headless pick; `encounter_aftermath_applied` continues to fire end-to-end. |
| 3. Determinism | PASS — auto-pick uses authored array order (deterministic), and `applyEncounterAftermathReaction` already salts PRNG by `reactionId` — identical seed + tick + encounter = identical effects. |
| 4. Fail-soft | PASS — five failure cases enumerated above, each with a non-throwing fallback. Tick loop is never blocked. |
| 5. Narrative over mechanical | PASS with note — N/A; this is tooling. No narrative surface affected. |
| 6. Additive over destructive | PASS — one new export, two new CLI commands, two new bridge methods. The existing modal handler is refactored to call the new resolver but its observable behaviour is unchanged. |
| 7. Performance budget | PASS — `--auto-aftermath` adds an O(unifiedActions) scan once per tick, capped at 8 picks/tick. Negligible against existing tick cost. |

## Why now

THR-134 closed today after manual verification. The next encounter-migration phase (Phase 2 content) needs the same verification protocol to be runnable unattended — otherwise every audit becomes a human-in-the-loop bottleneck and silent aftermath regressions creep in. This unblocks the entire audit workflow for the rest of the Encounter Format Migration project.
