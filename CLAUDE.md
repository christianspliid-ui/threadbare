This folder contains The Fantasy World Simulator — a systemic god-game/rogue-lite narrative simulation built in React + TypeScript + Vite.

## Cowork vs Claude Code — Read This First

**If you are running in Cowork mode:** You must NOT write code or run git commands. You CAN write to `.planning/` coordination files (BACKLOG.md, HANDOVER.md, ROADMAP.md) — **snapshot before every write** (see `Docs/cowork-ways-of-working.md` → "Coordination File Versioning"). Your job is design, research, documentation (via MCP), and implementation plans. Hand coding tasks to Claude Code with a plan link.

**If you are running in Claude Code:** You do the coding, testing, committing, and pushing. Check for implementation plans in `Docs/plans/` before starting work.

## Running the Prototype

**Prerequisites:** Node.js 22+ and npm 10+.

```bash
npm install    # first time or after pulling new dependencies
npm run dev    # start Vite dev server with hot reload
```

| Command | What it does |
|---------|-------------|
| `npm run build` | Type-check + production build (outputs to `dist/`) |
| `npm test` | Run all tests (vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run validate-model` | Validate world-model.json integrity |
| `npm run generate-vault` | Regenerate Obsidian vault from world-model.json |
| `npm run generate-hex` | Generate a hex tile image (requires Python + API key) |
| `npm run cli` | Interactive REPL for headless game testing (see below) |

**Dev Quick-Start URLs** (append to `http://localhost:5173`):

| URL Param | What it does |
|-----------|-------------|
| `?view=game` | **Primary dev view.** Full game view with Three.js hex map (HexMapV2) and all game chrome. Use this for all hex map and gameplay testing. |
| `?view=glow` | Magic glow tile preview |
| `?view=cms` | Content browser |
| `?fog` | Enable fog of war on load (fog is off by default). Combinable: `?view=game&fog` |

**For all testing, use `?view=game`** — this skips the multi-click entry flow and loads the full game with HexMapV2. Only test the worldgen/selection screens when those screens are the subject of the test.

**Note for Cowork/Claude sessions:** The sandbox VM has isolated networking. Use `npx tsc --noEmit`, `npx vite build`, and `npm test` to verify. The user must run `npm run dev` on their own machine.

### Headless CLI (`npm run cli`)

An interactive REPL for testing the game engine without a browser. **Use this for verifying engine behavior after changes** — it runs the real `initializeGameState` → `runTick` pipeline headlessly.

```bash
npm run cli                          # default seed 42, medium map
npm run cli -- --seed 99 --map small # custom seed + map size
```

Key commands at the `fws>` prompt: `tick [N]` (advance ticks), `run [N]` (auto-run at N ticks/sec), `pause`, `status` (game overview), `agents`, `agent <name>` (inspect one), `events [N]`, `doom`, `mandate`, `essence`, `encounters`, `factions`, `traces [N]`, `graph` (node counts), `eval <expr>` (JS with `state` in scope). Type `help` for the full list.

**When to use the CLI:**
- After modifying tick phases or orchestrator logic — run `tick 30` and check `status` + `events`
- After changing agent decision/movement — inspect with `agents` and `agent <name>`
- For pipeline throughput checks (NFP #7 in Pre-Commit Checklist) — `run 5` for 30+ ticks, then `encounters`, `factions`, `traces`
- Quick smoke test after engine changes when you can't run the browser

## Documentation Strategy

Four surfaces, each with a distinct purpose. Full ownership rules and duplication policy: **`Docs/documentation-ownership.md`**

| Surface | Owns |
|---------|------|
| **Obsidian vault** | Domain model: systems, mechanics, terminology (wikilinks). Read `Index.md` first. |
| **Repo `.planning/`** | Backlog (`BACKLOG.md`), active milestone roadmap, requirements, session state |
| **Repo `Docs/`** | Implementation rationale (`plans/`), changelog, UI patterns, project status, this ownership map |
| **Paper** | Visual documentation: component anatomy, style, asset registry, player journey maps |

*Notion backlog archived 2026-03-22 — all tracking now in repo markdown files.*

## Key Links

- Backlog: `.planning/BACKLOG.md`
- Active milestone roadmap: `.planning/ROADMAP.md`
- Obsidian vault index: read via Obsidian MCP → `TheFantasyWorldSimulator/Index.md`
- Documentation ownership: `Docs/documentation-ownership.md`
- Visual style guide: `STYLE.md`
- Visual style tile: `Design/style-tile.html`
- UI patterns: `Docs/ui-patterns.md`
- Consolidated discovery design: `Docs/plans/2026-03-04-high-level-discovery-pass.md`
- Spheres and Reaches relationship: Obsidian MCP → `TheFantasyWorldSimulator/Cosmology/Spheres and Reaches.md`
- Generalized Action Targeting: `Docs/plans/2026-03-17-generalized-action-targeting-design.md`
- Mutable hex state + hex actions: `Docs/plans/2026-03-17-world-state-and-hex-actions-design.md`
- Hex action brainstorm (control mechanic, prerequisites): `brainstorm-hex-actions-and-control-mechanic.md`
- Agent Decision & Encounter Awareness: `Docs/plans/2026-03-18-agent-decision-and-encounter-awareness-design.md`
- Encounter Resolution & Divine Intervention: `Docs/plans/2026-03-18-encounter-resolution-and-divine-intervention-design.md`
- Tier Promotion & Capability Growth: `Docs/plans/2026-03-18-tier-promotion-and-capability-growth-design.md`
- Axiological Pairs (canonical): Obsidian MCP → `TheFantasyWorldSimulator/Domains/Axiological Pairs.md`
- Meet The First brainstorm: Obsidian MCP → `TheFantasyWorldSimulator/Brainstorms/brainstorm-meet-the-first.md`
- Social Fabric & Faction Formation: `Docs/plans/2026-03-18-social-fabric-and-faction-formation-design.md`
- Social Fabric Visibility Spec: `Docs/plans/2026-03-18-social-fabric-visibility-spec.md`
- Implementation Ordering Guide: `Docs/plans/2026-03-18-implementation-ordering-guide.md`
- Integration wiring checklist: `Docs/plans/wiring-checklist.md`
- Impediment log: `Docs/impediments.md`
- Retrospective reports: `Docs/retrospectives/`

## Non-Functional Priorities (in order)

When in tension, higher priorities win.

1. **Tunability** — Every magic number is a named constant. Changing game feel = changing a number, not rewriting logic.
2. **Inspectability** — Trace *why* something happened. Flat state, pure functions, causal event trails.
3. **Determinism** — Seeded PRNG everywhere. Same seed + same inputs = same outputs.
4. **Fail-soft** — The tick loop must never crash. Missing data → graceful fallback, never thrown exceptions.
5. **Narrative over mechanical perfection** — When mechanics and story diverge, lean toward the story.
6. **Additive over destructive changes** — Add new fields/functions; only refactor when old shape blocks progress.
7. **Performance budget, not premature optimization** — Profile before optimizing. Lean on the spotlight tier system.

## Cross-Boundary Testing

Changes in engine and HexMapV2 frequently break downstream systems because each module is tested in isolation. The fix: **test the contracts between systems, not just the systems themselves.**

### The Layer Boundary Rule

When modifying a module, verify the contract with its immediate consumers — not just the module itself:

- **If you change a function's return type or shape:** Add or update a contract test that feeds real output from the changed function into every known consumer.
- **If you change engine state** (`MovementState`, `GameState`, graph node shape, encounter progress): verify that both the producing module and all consuming modules (UI components, other phases, traces) handle the new shape correctly.
- **If you change a tick phase or phase ordering:** Run the orchestrator integration test, not just the phase's unit test.
- **If you change HexMapV2 data flow** (agent props, trail data, road paths): visual verification at `?view=game` at all three zoom tiers (world, continental, hero-local) in addition to unit tests.

### Contract Tests

For every pair of modules where A's output feeds B's input, there should be a test that constructs **real** A output (not hand-built mocks) and feeds it to real B. These live in `__tests__/contracts/` within the relevant engine or component directory.

```typescript
// ❌ Wrong: each module tested with hand-built mocks that may not match reality
test('pathfinding returns path', () => { /* mock graph, verify path structure */ });
test('movement executes path', () => { /* hand-build path array, verify ticks */ });

// ✅ Right: contract test — A's real output feeds B's real input
test('pathfinding output is valid movementExecution input', () => {
  const pathResult = findShortestPath(realGraph, agentId, startId, endId);
  const state = initMovementState(pathResult.destinationId, pathResult.path, firstEdgeCost, tick);
  const result = tickMovement(graph, agentId, state, tick);
  expect(result.moved || result.arrivedAtDestination).toBe(true);
});
```

### Required Contract Test Pairs

These must exist. If a change breaks one, the failure names which integration is broken:

| Producer | Consumer | What the contract verifies |
|---|---|---|
| `findShortestPath` | `initMovementState` | Path array is a valid movement queue; road segments populate `roadHexQueue` |
| `tickMovement` | HexMapV2 agent props | Movement history entries have valid hex coords for trail rendering |
| `phaseAgentDecision` | `phaseMovement` | Decision output produces valid `MovementState` that ticks correctly |
| `generateRoadEdges` | `findShortestPath` | Road edges are discoverable, cost-valid, and hexPath is traversable |
| `MovementState` changes | `agentAnimationState` | Hex transitions produce valid animation input (fromHex, toHex, roadContext) |
| `movementHistory` | `MovementTrailMesh` | History format matches what the trail renderer consumes |

### When to Write Integration Tests

Write a full-orchestrator integration test (multiple ticks, real graph, real agents) when:

- Adding a new tick phase or modifying phase ordering
- **Wiring new behavior into an existing phase** (e.g., adding reward processing to encounter progression)
- Changing how phases communicate (e.g., movement → encounter detection)
- Modifying `MovementState`, `EncounterProgress`, or `GameState` shape
- Any change that touches 3+ files across `src/engine/` and `src/components/`

### Testing Anti-Patterns to Avoid

- **Mocking upstream modules in integration tests** — If you're testing the road→pathfinding→movement chain, use real `findHexPath`, not `vi.mock`. Mocks mask integration failures.
- **Tiny test graphs only** — The real map is ~320 hexes with ~250 graph nodes. Test with at least one realistic-scale graph per system to catch performance and topology edge cases.
- **No PRNG seed in tests** — Movement and decision tests must pass a deterministic seed. Non-seeded tests hide ordering-dependent bugs.
- **Skipping deprecated tests without replacement** — If a `describe.skip` block exists, either rewrite it for the current architecture or delete it. Skipped tests are false comfort.

### Pre-Commit Verification Checklist

Before committing changes to `src/engine/` or `src/components/HexMapV2/`:

1. `npm test` — all tests pass
2. `npx tsc --noEmit` — type check clean
3. `npx vite build` — production build succeeds (catches issues that type-check alone misses; confirms Vercel will deploy cleanly)
4. If movement/pathfinding changed → verify contract tests in `__tests__/contracts/` pass
5. If any tick phase changed → run orchestrator integration suite
6. If HexMapV2 changed → visual verification at `?view=game` (world, continental, hero-local zoom)
7. **If feature depends on upstream pipeline throughput** (e.g., rewards depend on encounters completing) → run the sim for 30+ ticks at `?view=game` and confirm the upstream triggers are firing. Unit tests passing is not sufficient — the pipeline must produce real throughput in context.

## Viewport Contract (1920×1080)

The game fills exactly one viewport. **Nothing scrolls. Nothing renders below the fold.**

- **CSS enforcement:** `html, body, #root` have `height: 100dvh; overflow: hidden` in `index.css`. Never remove this.
- **Layout rule:** Every full-screen layout must use `h-screen flex flex-col overflow-hidden`. Child panels use `flex-1 overflow-y-auto` for internal scroll.
- **Preview verification:** Always run `preview_resize` to 1920×1080 (or the user's specified resolution) **before** taking screenshots. The default Playwright/preview viewport is not 1920×1080 — it can be any size.
- **WebGL/Three.js verification:** Playwright `preview_snapshot` and `preview_inspect` cannot see WebGL canvas content — they only see a blank `<canvas>` element. For visual verification of the hex map (HexMapV2) or any Three.js/WebGL content, use **Claude in Chrome** (`mcp__Claude_in_Chrome__*` tools): `tabs_context_mcp` → `navigate` → `computer` with `action: "screenshot"` or `action: "zoom"`. Playwright is still useful for console errors, network requests, and DOM-based UI around the canvas.
- **Modal/overlay rule:** Modals use `max-height: 85vh` (already in Modal primitive). Absolute-positioned overlays (InterventionConfirm, AgendaPicker) must use `inset: 0` within their parent, never exceed the parent's bounds.
- **Test for it:** If a component renders off-screen at 1920×1080, that's a bug — same severity as a broken interaction.

## Design Governance

Every design proposal — whether a new system, a significant extension to an existing system, or a new content pipeline — **must be architecturally compliant before the user ever sees it.**

### The design workflow (internal, not user-facing)

1. **Draft** the system design
2. **Audit** the draft against all 7 NFPs, load-bearing decisions, and the rejected approaches list
3. **Revise** the design to integrate every remediation directly into the system descriptions — constants tables, trace schemas, fail-soft tables, PRNG callouts all go inline where the system is described, not in a separate appendix
4. **Summarize** the NFP compliance as a verdict table at the end (PASS / PASS with note per priority)
5. **Present** the finished, compliant design to the user

Steps 1–4 happen in a single pass. The user should never see a design that hasn't been through this cycle. If the audit reveals a fundamental conflict with an NFP (not just a missing constant, but a structural problem), flag it as a trade-off for the user to weigh in on — don't silently ship a non-compliant design.

### Required sections in every system description

Each system within a design document must include these inline (not as a separate audit section):

- **Constants table** — every tunable number named, with default and purpose (NFP #1)
- **Tracing** — what trace types the system emits, with TypeScript interface definitions (NFP #2)
- **Fail-soft** — table of failure cases and fallback behavior (NFP #4)
- **PRNG callouts** — where seeded randomness is needed, called out at the point of use (NFP #3)

### Required UI/visibility phase in every design document

**Every design that produces new state, events, or agent behavior MUST include a UI phase.** An engine system with no player-facing visibility is invisible — the player can't see it, can't react to it, and can't enjoy it. A system without dev visibility can't be tuned.

The UI phase must cover:

1. **Player-facing display** — Where does the player see the new state? Agent profile section? Chronicle events? Map overlay? Notifications? Knowledge-gated by influence tier where appropriate.
2. **Event notifications** — What TickEvents does the system emit? Which get alerts vs toasts vs silent chronicle entries? What glyph and color?
3. **Debug inspection** — How does a developer see the raw state? New DebugPanel tab? Extension to existing tab? What data is shown?
4. **Visual presence** — Does the system need signifiers, map overlays, or other spatial indicators on HexMapV2?

If the design audit finds no UI phase, **add one before presenting the design.** This is not optional polish — it is a required phase alongside engine, content, and integration work.

### Required wiring section in every design document

Every design document must include a **Wiring** section that maps each new module to the game's integration surfaces. This prevents the pattern of building engine modules that are tested in isolation but never connected to the player-facing game. Reference `Docs/plans/wiring-checklist.md` for the canonical list of integration surfaces.

The wiring section must answer for each new module:

1. **Orchestrator:** Which phase calls it? New phase needed? At what position?
2. **UI rendering:** Which component displays its output? Already rendered in GameView JSX, or needs adding?
3. **GameState flow:** What fields written? What component reads each?
4. **Traces:** What categories emitted? From which functions?
5. **Debug visibility:** How does a developer inspect the state?
6. **Prose pipeline:** Does it display text through `enrichProse()`?
7. **Player controls:** What UI element triggers/toggles it?

An engine module that is only imported by test files is not integrated. A UI component that is imported but not rendered in JSX is not integrated. **Both count as incomplete work.**

### Wiring checklist maintenance

`Docs/plans/wiring-checklist.md` is a living document. Update it when:

- A new orchestrator phase is added (update the phase table)
- A new modal/overlay is added to GameView (update the rendered components table)
- A new GameState field is added (update the consumption table)
- A new trace category is defined (update the category list)
- A new player-facing control is added (update the controls table)

**This is part of the Definition of Done for both design plans and implementation.**

### Required summary at end of design document

An NFP Compliance Summary table with one row per priority showing PASS / PASS with note. If any row shows a genuine trade-off (not just "needs tuning"), explain it so the user can make the call.

### When reviewing an existing design

If an older plan in `Docs/plans/` lacks inline NFP compliance, add it before building from it. If it lacks a wiring section, add one before implementing from it.

## Load-Bearing Architectural Decisions

Settled. Do not revisit.

- **Everything is a graph node/edge.** No separate relational tables.
- **Reaches and Spheres are orthogonal axes.** Reaches = what you do (activity categories). Spheres = what fuels it (cosmic energies). They combine freely — same Reach at different Sphere alignments produces different action flavors. Neither subsumes the other.
- **Ascendants use the same prerequisite system as agents.** Domain Capability tiers + sphere alignment checks apply equally. Ascendants are powerful former mortals, not a special-cased entity type. Power level is tunable, not structurally different.
- **No inventing node types without verification.** If a conversation references a node type that doesn't exist in the current graph schema, **stop and ask the human** before creating it. First confirm it isn't an existing node under a different name. Check `src/types/graph.ts` and `world-model.json` for the canonical list.
- **New node types require full design before code.** If a genuinely new node type is confirmed, design it before implementing: define its category, required/optional properties, which edge types connect it to existing nodes, how it participates in the tick loop, and what traces it emits. No stub-it-and-figure-it-out-later.


## Rejected Approaches (do not reintroduce)

- ❌ Classical stats (STR/DEX/INT) — replaced by Domain Capability across Nine Reaches
- ❌ Fixed rival pantheon — replaced by generated rivals from World-Soul
- ❌ Old 5-force cosmology — replaced by Foundation + Creation Sphere model
- ❌ Pure template-based prose — replaced by hybrid layered engine
- ❌ Pure LLM-generated content — replaced by generated-within-constraints with player iteration
- ❌ Intervention wheel (AgentWheel) — replaced by ActionDrawer with context-filtered cards via Generalized Action Targeting
- ❌ Fixed action count / capped action slots — replaced by open-ended, data-driven template pool filtered per target context
- ❌ React Three Fiber (R3F) — use raw Three.js with canvas ref instead. Direct Three.js gives full control over InstancedMesh, render loop, and d3-zoom integration without R3F abstraction overhead.
- ❌ KayKit GLTF 3D models — replaced by flat hex grid with 2D signifier art composited per-hex
- ❌ V1 SVG hex map (HexMap.tsx, HexTile.tsx, AgentDots.tsx, MovementTrails.tsx) — deleted in Phase 8. Replaced by HexMapV2 (Three.js InstancedMesh).

## Change Audit Trail

When modifying Notion pages or Obsidian vault notes:

- **In the document:** Dated inline note near the change (date, what, why — one line).
- **In the changelog:** Append to `Docs/changelog.md` (format: `| date | where | what changed | why |`).

## Definition of Done

When implementation is complete and tests pass, **do all of these automatically — do not ask which option the user wants:**

1. **Commit** all changes
2. **Push** to GitHub (`git push`, with `-u origin <branch>` if needed)
3. **Merge** feature branches into main immediately — don't leave branches waiting
4. **Deploy** to Vercel production — Vercel auto-deploys from GitHub on push to `main`. No manual deploy step needed; just ensure the push succeeded.
5. **Document** — update `.planning/BACKLOG.md` (mark items complete, add new ones), update `Docs/project-status.md` and `Docs/changelog.md` and `Docs/project-history.md`
   - `project-history.md`: Append a one-line `✅ Complete` entry for each completed feature/system
   - `project-status.md`: Keep this file compact (current focus + recent completions only). Move any "Previous:" entries older than the current session into `project-history.md`. This file should never exceed ~60 lines.
   - `changelog.md`: Append row(s) as usual

This is non-negotiable. Work is not "done" until it is deployed and documented. Do not present options, do not ask for confirmation on these steps, do not stop at "ready to push?" — just do it.

6. **Verify wiring** — Check every new module against `Docs/plans/wiring-checklist.md`. Confirm: engine modules called from orchestrator (not just tests), modals rendered in GameView JSX (not just imported), GameState fields consumed by UI components, traces emitted from production code, player controls connected. Update the wiring checklist if new integration surfaces were added.
7. **Log impediments** — If you encountered *any* blockers, workarounds, or friction during the session, verify they are all logged in `Docs/impediments.md`. Load the `impediment-reporter` skill for format details. This is mandatory — unlogged friction is invisible friction.
8. **Close out** — When all steps above are complete, explicitly tell the user: *"Session ready to archive — all work is tested, deployed, and documented. No loose ends."* This is the signal that the session can be safely closed.

## Session Workflow

1. Read this file for orientation
2. **Check `.planning/HANDOVER.md` for pending actions from Cowork sessions** — act on any open items before starting new work
3. Read Obsidian `Index.md` via MCP, follow links to the relevant system
4. Check `.planning/BACKLOG.md` for backlog and `.planning/ROADMAP.md` for active milestone
5. Read relevant design doc in `Docs/plans/` before writing code
6. **Pre-implementation upstream health check:** If the feature depends on upstream pipeline throughput (e.g., rewards require encounters to complete, encounters require agents to arrive at locations), verify the upstream pipeline is actually producing output before starting implementation. Run the liveness integration test or inspect traces/state. A feature wired to a dead pipeline is wasted work — catch it before coding, not after.
7. After completing work, follow the **Definition of Done** above

## Domain Skills

Context for specific problem types lives in on-demand skills. **Always load `state-of-game-design` first** — it provides the foundational cosmology, action system, and architectural context that all other skills depend on.

| Domain | Skill | When to load |
|--------|-------|-------------|
| **Foundational (load first)** | `state-of-game-design` | Always — before any other domain skill. Cosmology, reaches, spheres, action verbs, prerequisites, architectural decisions. |
| Engine & code architecture | `engine-architecture` | Writing engine modules, tick loop work, tracing, resolution, PRNG |
| Frontend & UI | `frontend-ui` | Building components, styling, accessibility, layout at 1920–3440px. Loads `Docs/design-system/` |
| Content systems & worldbuilding | `content-worldbuilding` | Content packages, graph data, constraint layers, world-model.json |
| Hex map renderer | `hexmap-developer` | Writing any code in `src/components/HexMapV2/` or hex-related engine code. Architecture, coordinates, scene layers, zoom, coastline, stencil, signifiers, testing, debugging. Comprehensive developer onboarding guide. |
| Hex map decisions | `hexmap-renderer` | Quick reference for settled renderer decisions and patterns from Phases 1-8. Lighter than `hexmap-developer`. |
| Art direction & visual style | `art-direction` | Hex tiles, prompt construction, STYLE.md, Threadbare aesthetic |
| Blender → HexMap pipeline | `blender-to-hexmap` | Building 3D models in Blender MCP and importing GLB into HexMapV2. Palette, merge, bake rotation, export, Three.js wiring. |
| Creative prose & content | `cw-*` (platform) | `cw-brainstorming` for ideas, `cw-prose-writing` for drafts, `cw-official-docs` for wiki, `cw-story-critique` for review |
| Post-implementation docs | `gamedocumenter` | Notion/Obsidian/changelog updates after completing work |
| Image manipulation | `image-manipulation` | Geometric clipping, alpha masks, hex tile pipeline |
| QA sweeps | `qa-orchestrator` | Systematic UI/UX/frontend QA |
| Testing & contracts | `testing-patterns` | Writing tests for engine or HexMapV2 changes. Contract test patterns, dependency maps, anti-patterns, coverage gap reference. |
| **Impediment reporting (always active)** | `impediment-reporter` | **Every session, every agent.** Log blockers and workarounds to `Docs/impediments.md` as they occur. Part of Definition of Done. |
| Continuous improvement | `retrospective` | Review impediment log, analyze patterns, implement quick-fix improvements, backlog larger ones. Run with `/retrospective`. |

## Continuous Improvement

Two skills form a feedback loop:

1. **`impediment-reporter`** — Every agent logs friction as it happens → `Docs/impediments.md`
2. **`retrospective`** — Periodically analyze the log, implement quick wins, backlog bigger fixes → `Docs/retrospectives/`

Repetitive workflows → propose a skill. Use `skill-creator` to build and eval 