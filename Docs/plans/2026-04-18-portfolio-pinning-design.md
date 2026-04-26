# Portfolio-Pinning Mechanism — PR 0 Implementation Design

**Issue:** [THR-148](https://linear.app/threadbare/issue/THR-148)
**Project:** Elder Magic & Ruins ([project link](https://linear.app/threadbare/project/elder-magic-and-ruins-b91feec3f708))
**Author:** Cowork (2026-04-18)
**Status:** Ready for Dev
**Suggested model:** sonnet
**Related:** Blocks THR-149 (PR 1 — knowledge rename + ruins.* trace registration). Related to THR-150 (PR 2 — Clue edge creation + Narrative Gravity bias).

---

## Purpose

Portfolio-pinning is the **player-driven curation signal** that identifies the ~5–9 agents the ascendant considers "part of my ongoing story." Future Narrative Gravity (THR-150, PR 2) biases saga-scale clue delivery and story-beat selection toward these actors. PR 0 ships the mechanism only — pin/unpin, cap enforcement, persistence, traces, and debug surface — without any consumer. Downstream PRs read `isPortfolioPinned` as input; PR 0 guarantees the signal exists, is stable, and degrades gracefully when the cap is hit.

**Scope gate for PR 0:** mechanism only. No divine action, no HUD indicator in production UI, no bias logic. A minimal debug tab + debug-bridge methods are sufficient; a production "Pin to Portfolio" UI is deliberately deferred to a future UI pass (tracked as a follow-up if/when the Ruins layer proves the concept).

---

## Load-bearing decisions

1. **Flag lives on the agent's property bag, not on GameState.**
   `node.properties.isPortfolioPinned?: boolean` on actor nodes. Rationale: aligns with the existing `spotlightTier`, `importance` pattern (see `src/engine/npcGraduation.ts`); survives graph serialization without bespoke persistence; any query that touches an agent can read the flag without a separate lookup. Rejected alternative: a `Set<string>` on `GameState.portfolioPinnedAgentIds` — creates a second source of truth that has to stay in sync with graph mutations (agent death, merge, etc.).

2. **Portfolio-pinning is orthogonal to spotlight tier.**
   Spotlight = performance/fidelity tier (`ambient | notable | spotlight` — see `src/types/npc.ts`). Portfolio-pin = narrative curation. An ambient-tier agent can be pinned; a spotlight-tier agent can be unpinned. The two signals coexist and combine multiplicatively in future scoring (Narrative Gravity PR 2). Rejected alternative: collapse into a fourth spotlight tier — spotlight is owned by the performance system and has tick-budget implications; narrative curation must not accidentally promote an NPC to higher fidelity.

3. **Cap is advisory, enforced at the API boundary, not at the schema.**
   `PORTFOLIO_MAX_PINNED = 7` (configurable constant). `pinToPortfolio(agentId)` refuses and emits a `portfolio.cap_exceeded` trace when the cap is hit. The graph itself will never refuse a property write; we enforce through the public engine/debug API so the cap remains tunable without schema migration.

4. **Single ascendant → single portfolio.**
   `GameState.ascendantId` is scalar (`src/types/gameState.ts`). There is exactly one portfolio per session. The cap is global for that ascendant. If multi-ascendant support ever lands, portfolio becomes per-ascendant via ownership edge; PR 0 does not over-build for this.

5. **PR 0 is debug-surfaced only.**
   A dedicated DebugPanel "Portfolio" tab + `window.__DEBUG.pinToPortfolio(...)` are the only write paths. No divine action template, no ActionDrawer card, no right-click menu. This matches the project's "ship the mechanism, add the UI when consumers exist" pattern (see `bumpImportance` in `npcGraduation.ts`).

---

## Engine pillar

### Graph changes

No new node or edge types. A single optional property is added to actor nodes:

```ts
// Conceptual shape — src/types/graph.ts has no explicit AgentNodeProperties
// interface today; properties live in the generic Record<string, unknown> bag.
// Document the key here so future consumers know to look for it.
//
// node.properties.isPortfolioPinned?: boolean
//   Present and true  → agent is in the player's portfolio
//   Present and false → agent was pinned and explicitly unpinned (treated as "not pinned")
//   Absent            → never pinned; treated as "not pinned"
```

The existing `spotlightTier` and `importance` conventions in `src/engine/npcGraduation.ts` are the reference pattern. No `AgentNodeProperties` interface is introduced in PR 0 — that's a wider cleanup (candidate for a future hygiene issue if the property bag keeps growing).

### New module

`src/engine/portfolio.ts` — owns read/write + cap enforcement + traces.

Exports:

```ts
export interface PortfolioOperationResult {
  success: boolean;
  reason?: 'already_pinned' | 'not_pinned' | 'cap_exceeded' | 'agent_not_found' | 'agent_dead';
  portfolioSize: number; // size after operation (or before, if op failed)
}

export function isPortfolioPinned(graph: WorldGraph, agentId: string): boolean;

export function listPortfolio(graph: WorldGraph): string[]; // returns agentIds, stable sort

export function pinToPortfolio(
  graph: WorldGraph,
  agentId: string,
  ctx: { tick: number; reason?: string }
): PortfolioOperationResult;

export function unpinFromPortfolio(
  graph: WorldGraph,
  agentId: string,
  ctx: { tick: number; reason?: string }
): PortfolioOperationResult;
```

Implementation sketch:

```ts
// pinToPortfolio
function pinToPortfolio(graph, agentId, ctx) {
  const node = graph.getNode(agentId);
  if (!node || node.type !== 'actor') return fail('agent_not_found', listPortfolio(graph).length);
  if (node.properties.isDead === true)   return fail('agent_dead',     listPortfolio(graph).length);
  if (node.properties.isPortfolioPinned === true) {
    return { success: true, reason: 'already_pinned', portfolioSize: listPortfolio(graph).length };
  }
  const current = listPortfolio(graph);
  if (current.length >= PORTFOLIO_MAX_PINNED) {
    emitTrace('portfolio.cap_exceeded', { agentId, attemptedAction: 'pin', cap: PORTFOLIO_MAX_PINNED, currentSize: current.length, tick: ctx.tick });
    return fail('cap_exceeded', current.length);
  }
  graph.updateNode(agentId, { properties: { ...node.properties, isPortfolioPinned: true } });
  touchWorld(); // UI version counter — selectors need to re-read
  emitTrace('portfolio.pinned', { agentId, portfolioSize: current.length + 1, reason: ctx.reason, tick: ctx.tick });
  return { success: true, portfolioSize: current.length + 1 };
}
```

`unpinFromPortfolio` mirrors pin: idempotent on "not currently pinned," writes `isPortfolioPinned: false` (explicit-false — not delete — so the flag round-trips through serialization without surprises), emits `portfolio.unpinned`.

`listPortfolio` iterates `graph.getNodesByType('actor')` and filters `properties.isPortfolioPinned === true`. Stable sort by id (determinism).

### Tick phase work

**None.** Portfolio-pinning is event-driven: writes happen when the debug bridge / UI invokes the API. No per-tick sweep, no decay, no re-evaluation. This keeps PR 0 cost at zero on the tick loop. (Future PR 2 / Narrative Gravity reads the flag during clue distribution; that's not PR 0 work.)

### PRNG

**None.** Pin/unpin is deterministic by construction (the player chooses). No seeded randomness required.

### Constants table

| Constant | Default | Location | Purpose |
|----------|---------|----------|---------|
| `PORTFOLIO_MAX_PINNED` | `7` | `src/engine/portfolio.ts` | Cap on simultaneously pinned agents per ascendant. 5 felt too tight (one per Reach family), 9 felt loose. 7 matches the project brief's "5-9" sweet spot. |
| `PORTFOLIO_TRACE_CATEGORY_PREFIX` | `'portfolio'` | `src/engine/portfolio.ts` | Trace prefix reserved for portfolio-related traces. Consumers filter by this prefix. |

No additional constants in PR 0. Narrative Gravity biases (`CLUE_BIAS_PORTFOLIO_PINNED` etc.) are owned by PR 2 (THR-150) — listed in THR-150's design, not duplicated here.

### Tracing

Three trace categories. All three live under the `portfolio.*` family and must be registered in `src/types/trace.ts`'s `TraceCategory` union.

```ts
// src/types/trace.ts (add to TraceCategory union)
| 'portfolio.pinned'
| 'portfolio.unpinned'
| 'portfolio.cap_exceeded'

// src/types/trace.ts (new interfaces)
export interface PortfolioPinnedTrace extends TraceBase {
  category: 'portfolio.pinned';
  agentId: string;
  portfolioSize: number;        // size AFTER pin
  reason?: string;              // optional free-text reason passed by caller
}

export interface PortfolioUnpinnedTrace extends TraceBase {
  category: 'portfolio.unpinned';
  agentId: string;
  portfolioSize: number;        // size AFTER unpin
  reason?: string;
}

export interface PortfolioCapExceededTrace extends TraceBase {
  category: 'portfolio.cap_exceeded';
  agentId: string;              // the agent we tried to pin
  attemptedAction: 'pin';       // reserved for future unpin-below-min etc.
  cap: number;
  currentSize: number;
}
```

### Fail-soft table

| Failure case | Behaviour | Rationale |
|--------------|-----------|-----------|
| Agent id not found | Return `{ success: false, reason: 'agent_not_found' }`; no trace. | Normal control flow for callers; silent to avoid spamming traces when debug tab races a graph mutation. |
| Agent is dead (`isDead === true`) | Return `{ success: false, reason: 'agent_dead' }`; no trace. | Can't pin a corpse. No trace to avoid noise — UI should gate the button. |
| Agent already pinned (pin) | Return `{ success: true, reason: 'already_pinned' }`; no trace. | Idempotent — repeated pins should never throw or produce duplicate traces. |
| Agent not pinned (unpin) | Return `{ success: true, reason: 'not_pinned' }`; no trace. | Idempotent. |
| Cap hit on pin | Return `{ success: false, reason: 'cap_exceeded' }`; emit `portfolio.cap_exceeded` trace. | This is a real event the player should see in debug output. |
| Graph mutation fails partway | Wrap `graph.updateNode` in try/catch; on exception, log to crashLog and return `{ success: false, reason: 'agent_not_found' }`. | Tick loop must never crash per NFP #4. Better to silently fail than throw. |
| `touchWorld()` missing after mutation | Selectors serve stale data; not a crash. Covered by unit test that asserts `worldVersion` increments. | Enforces the "every mutation touches the world" rule (load-bearing decision in CLAUDE.md). |

---

## Content pillar

**Mostly N/A with rationale.** Portfolio-pinning is a mechanism, not a narrative event. However, there are two small content hooks worth specifying so downstream consumers don't add them ad hoc.

### Chronicle entries (optional; gated)

When a pin is initiated by the **player** (not a future auto-pin heuristic), the engine emits a single one-line chronicle entry so the player's history shows the choice was made. Suggested prose in `src/data/narrative-content.ts` or a new `src/data/portfolio-content.ts`:

```ts
export const PORTFOLIO_PIN_CHRONICLE = {
  pinned: [
    "You turn your attention fully toward {agent}.",
    "{agent}'s thread glows brighter — you mark them as your own.",
    "You pin {agent} to the portfolio of names you will remember.",
  ],
  unpinned: [
    "You release {agent} from your close attention.",
    "{agent}'s thread dims; other stories reclaim the foreground.",
    "You unpin {agent} — they go on without your watch.",
  ],
};
```

PR 0 **wires the entry emission** but keeps it debug-surfaced. Production UI (future) will surface the chronicle entry more prominently. Three variants per action so repeated pin/unpin doesn't produce identical prose — deterministic selection via `pickDeterministic(variants, agentId + tick)`.

### Rejected content scope

- **No encounter template.** Pin/unpin does not produce a multi-step encounter.
- **No attachment.** Pinned status is not an attachment.
- **No enrichment placeholder changes.** Existing `{name}` / `{agent}` placeholders in the prose pipeline continue to work; no new placeholder like `{pinned_agent}` is introduced — that's over-specific.
- **No faction/omen/doom content.** Pinning is private to the player's attention, not a world event.

---

## UI pillar

### DebugPanel "Portfolio" tab (required for PR 0)

New tab following the `HiddenMarksTab` / `EncounterSeedsTab` pattern at `src/components/Game/debug/PortfolioTab.tsx`.

Layout (plain text):

```
┌ Portfolio (N / 7) ─────────────────────────────────────┐
│                                                        │
│  Currently pinned                                      │
│  ─────────────────                                     │
│  [•] Kael Thornweaver         Reach 4 · spotlight   ✕  │
│  [•] Serafina                 Reach 6 · notable     ✕  │
│  ...                                                   │
│                                                        │
│  Candidates (all agents, sortable)                     │
│  ──────────────────────────────────                    │
│  Filter: [___________]   Sort: [By reach ▾]            │
│  [ ] Dren the Merchant        Reach 2 · ambient     +  │
│  [ ] Aethra Stormcaller       Reach 8 · spotlight   +  │
│  ...                                                   │
│                                                        │
│  Cap: 7 · Currently pinned: N                          │
│  [Unpin all]                                           │
└────────────────────────────────────────────────────────┘
```

Behaviour:

- Top section lists currently pinned agents. `✕` button calls `unpinFromPortfolio`.
- Bottom section lists all living actor nodes. `+` button calls `pinToPortfolio`. If cap reached, the `+` button is disabled with tooltip "Portfolio full (7 / 7) — unpin first."
- Header shows `(N / 7)` counter.
- "Unpin all" escape hatch for debug convenience.
- Tab uses the standard Debug styling (no new design tokens).
- No animation, no confirm dialog — this is a debug tool.

Register in `src/components/Game/debug/DebugTabContent.tsx` TABS array as `{ id: 'portfolio', label: 'Portfolio' }`. Add `'portfolio'` to the `ViewMode` union.

### Agent detail panel indicator (minimal)

Add a small "◆ Pinned" badge to `AgentDetailPanel` when `isPortfolioPinned === true`. One line, same styling as existing spotlight-tier badge. No interaction — players can't unpin from the detail panel in PR 0.

### Debug bridge methods

Append to `src/debug-bridge.ts`:

```ts
pinToPortfolio: (agentId: string) =>
  _portfolioBridge?.pin(agentId) ?? { success: false, reason: 'agent_not_found' as const, portfolioSize: 0 },

unpinFromPortfolio: (agentId: string) =>
  _portfolioBridge?.unpin(agentId) ?? { success: false, reason: 'agent_not_found' as const, portfolioSize: 0 },

listPortfolio: () =>
  _portfolioBridge?.list() ?? [],

isPortfolioPinned: (agentId: string) =>
  _portfolioBridge?.isPinned(agentId) ?? false,
```

`_portfolioBridge` is wired in `useSimulation` identically to `_actionBridge`. Add TypeScript declarations in `src/debug-bridge.d.ts` mirroring `fireAction`.

### CLI support (headless REPL)

Three commands in `src/cli/cli.ts`:

- `portfolio` — print current portfolio (N / cap, names, reaches).
- `pin <agent|@hero>` — pin by name/id/prefix, same resolver as `gotoAgent`.
- `unpin <agent|@hero>` — unpin.

Matches the existing `spawn encounter`, `fog on/off` style. Zero-effort additions once the engine API exists.

### Rejected UI scope

- **No divine action card / ActionDrawer entry.** Adds a content-authoring surface PR 0 doesn't need. When UI for pinning ships (future), it should go through ActionDrawer with context-filtered targeting — but that's a real design pass, not a bolt-on.
- **No right-click / context menu.** Same reason.
- **No HexMap signifier.** The pin signal is a player-private curation, not a world fact visible on the map. If Narrative Gravity (PR 2) produces visible effects (brighter clue beams toward pinned agents), those effects are owned by PR 2's UI.

---

## Wiring section

Cross-referenced against `Docs/plans/wiring-checklist.md`.

| Surface | Wiring |
|---------|--------|
| **Orchestrator phase** | N/A — event-driven, no phase. Explicitly confirmed: no tick-loop work. |
| **UI component** | New `PortfolioTab` rendered inside `DebugTabContent.tsx`. `AgentDetailPanel` reads `node.properties.isPortfolioPinned`. No new top-level modals. |
| **GameState flow** | Flag is on `node.properties`, not on `GameState` itself. Consumers read via `isPortfolioPinned(graph, agentId)` or `graph.getNode(id).properties.isPortfolioPinned`. |
| **Traces** | `portfolio.pinned`, `portfolio.unpinned`, `portfolio.cap_exceeded` added to `TraceCategory` union with companion interfaces. Debug panel Feed tab surfaces them via existing category filter. |
| **Debug visibility** | DebugPanel "Portfolio" tab; `window.__DEBUG.{pinToPortfolio,unpinFromPortfolio,listPortfolio,isPortfolioPinned}`; CLI `portfolio` / `pin` / `unpin` commands. |
| **Prose pipeline** | `PORTFOLIO_PIN_CHRONICLE` strings routed through existing `enrichProse()` call that consumes `{agent}` placeholder. No new enrichment keys. |
| **Player controls** | Debug-only in PR 0. Production control (if needed) is a follow-up issue. |
| **Versioning** | Every `graph.updateNode` call in `portfolio.ts` is followed by `touchWorld()` so UI selectors refresh. `structuralCacheVersion` is NOT bumped — the flag does not affect distance matrix, encounter cache, or scoring in PR 0. |
| **Codesight high-impact files** | `src/types/graph.ts` (370 importers) — this change is **documentation-only** (comment describing the new optional property); no type signature change. `src/types/trace.ts` is the load-bearing edit — 3 new union members + 3 new interfaces. |

**Checklist items to add to `Docs/plans/wiring-checklist.md` at PR 0 merge time:**
- "Portfolio-pinning writes call `touchWorld()` after `graph.updateNode`."
- "Portfolio trace categories are filterable in DebugPanel Feed tab."

---

## Testing

Unit tests in `src/engine/__tests__/portfolio.test.ts`:

1. Pin an unpinned agent → `success: true`, `portfolioSize: 1`, flag set, trace emitted.
2. Pin already-pinned agent → `success: true, reason: 'already_pinned'`, no trace, no graph mutation.
3. Pin non-existent agent → `success: false, reason: 'agent_not_found'`, no trace.
4. Pin dead agent → `success: false, reason: 'agent_dead'`, no trace.
5. Fill to cap (7), then try 8th → `success: false, reason: 'cap_exceeded'`, `portfolio.cap_exceeded` trace emitted.
6. Pin → unpin → pin round trip → flag is `true` at end, no stale state.
7. `listPortfolio` returns only pinned, sorted by id, stable across calls.
8. `worldVersion` increments on pin and unpin.
9. Serialize → deserialize → flag survives round trip (explicit-false is preserved).
10. Pin, then kill the agent (set `isDead: true`) — `isPortfolioPinned` is still true (cleanup is out of scope for PR 0; pinned-dead is valid state); `listPortfolio` still returns them. Future PR may add auto-unpin on death, but that's a separate decision.

Integration test: debug-bridge `pinToPortfolio` → agent's `node.properties.isPortfolioPinned === true` → `listPortfolio` contains id.

Contract test in `src/components/Game/debug/__tests__/PortfolioTab.test.tsx`: renders, pin button triggers debug-bridge call, cap-reached state disables buttons.

**Pre-commit (CLAUDE.md §Testing):**
1. `npm test`
2. `npx tsc --noEmit`
3. `npx vite build`

CLI smoke: `npm run cli -- --seed 42`, then `pin @hero`, `portfolio`, `unpin @hero`, confirm output.

---

## NFP compliance summary

| Priority | Status | Note |
|----------|--------|------|
| 1. Tunability | PASS | `PORTFOLIO_MAX_PINNED` is a named constant. |
| 2. Inspectability | PASS | Three trace categories cover pin, unpin, cap-exceeded. DebugPanel tab shows live state. |
| 3. Determinism | PASS | No PRNG; pin/unpin is player-driven. Chronicle prose selection uses `pickDeterministic(variants, agentId + tick)`. |
| 4. Fail-soft | PASS | Every failure path returns a structured result; no throws; tick loop untouched. |
| 5. Narrative over mechanical perfection | PASS | Chronicle entries included so pinning has a small narrative footprint even in PR 0. |
| 6. Additive over destructive | PASS | New optional property, new module, new tab, new traces. No existing types or signatures broken. |
| 7. Performance budget | PASS | Zero per-tick cost. `listPortfolio` is O(actors) but only called on debug render + API calls (not hot path). |

---

## Three-pillar check

| Pillar | Status |
|--------|--------|
| Engine | ✅ `src/engine/portfolio.ts`, trace category additions, constants. |
| Content | ✅ `PORTFOLIO_PIN_CHRONICLE` prose variants, routed through existing enrichProse. Rest explicitly N/A with rationale. |
| UI | ✅ DebugPanel Portfolio tab, AgentDetailPanel badge, debug-bridge methods, CLI commands. Production UI explicitly deferred. |
| Wiring | ✅ Section above. |

---

## Out of scope (do NOT implement in PR 0)

- Narrative Gravity consumption of the pin flag (owned by THR-150 / PR 2).
- Auto-pin heuristics (e.g., auto-pin the first mortal bonded to the ascendant).
- Auto-unpin on agent death (future hygiene decision).
- Production ActionDrawer card for pinning (future UI pass).
- HexMap signifier for pinned agents (PR 2 may add, not PR 0).
- Multi-ascendant portfolio separation (feature doesn't exist).
- `AgentNodeProperties` interface introduction (wider refactor; file its own hygiene issue).
- Codex entry for "Portfolio" as a game concept (player-facing docs wait for real UI).

---

## Definition of Done (for CC handoff)

1. `src/engine/portfolio.ts` created with exports above.
2. `src/types/trace.ts` updated with three categories + three interfaces.
3. `src/debug-bridge.ts` + `src/debug-bridge.d.ts` expose the four methods.
4. `_portfolioBridge` wired in `useSimulation` (the hook that already wires `_actionBridge`).
5. `src/components/Game/debug/PortfolioTab.tsx` created; registered in `DebugTabContent.tsx`.
6. `AgentDetailPanel` renders "◆ Pinned" badge when flag is true.
7. `src/cli/cli.ts` adds `portfolio`, `pin`, `unpin` commands.
8. `src/data/portfolio-content.ts` (or append to existing narrative content) with three pin + three unpin chronicle variants.
9. Unit tests + integration test described above.
10. `Docs/plans/wiring-checklist.md` appended with the two bullets above.
11. Pre-commit triad (`npm test`, `npx tsc --noEmit`, `npx vite build`) all green.
12. Codex review on branch diff before push.
13. Commit closing with `Fixes THR-148` to trigger Linear auto-close.
