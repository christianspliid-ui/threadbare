# Claude Code Prompt: Road-Aware Movement + Testing Infrastructure

> Paste this into Claude Code. It covers two linked work items from HANDOVER.md dated 2026-03-25.

---

Two HANDOVER.md entries from today's Cowork session need action. Do the testing infrastructure first (it establishes patterns the road work depends on), then the road-aware movement implementation. Read the full entries in `.planning/HANDOVER.md` before starting.

## Part 1: Testing Infrastructure (do first)

Cowork already wrote new sections in CLAUDE.md, a new `testing-patterns` skill, and a backlog item. Your job is to commit those changes, then build the actual test infrastructure they describe.

**Step 1:** Commit the Cowork documentation changes. These files were modified or created by Cowork and need committing:
- `CLAUDE.md` — new "Cross-Boundary Testing" section + `testing-patterns` skill in Domain Skills table
- `.claude/skills/testing-patterns/SKILL.md` — new skill file
- `.planning/BACKLOG.md` — new "Cross-Boundary Contract Tests" item
- `.planning/HANDOVER.md` — two new entries
- `Docs/plans/2026-03-25-road-aware-movement-design.md` — new design doc

**Step 2:** Load the `testing-patterns` skill and build the contract test infrastructure:
1. Create `src/engine/__tests__/contracts/` directory
2. Create `src/components/HexMapV2/__tests__/contracts/` directory
3. Write `src/components/HexMapV2/scene/__tests__/MovementTrailMesh.test.ts` — this module has zero coverage and is rendering-critical. Test: history entries produce trail segments, faction colors resolve, fade timing matches constants.
4. Write `src/engine/__tests__/contracts/pathfinding-to-movement.contract.test.ts` — the first contract test. Use a real graph (10+ locations with real terrain and adjacency), real `findShortestPath`, and real `initMovementState` + `tickMovement`. Verify: path is valid movement queue, agent ticks to arrival, history has hex coords.
5. Add at least one movement integration test to `orchestrator.test.ts`: agent with movement queue advances after a tick, and agent arrives at destination.
6. Look at `src/engine/__tests__/movement-integration.test.ts` — it has 10 tests under `describe.skip`. Either rewrite them for the current `phaseAgentDecision` architecture or delete them. Do not leave skipped tests.

Run `npm test` and `npx tsc --noEmit` after completing the test infrastructure. All tests must pass. Commit and push.

## Part 2: Road-Aware Movement (do second)

Read the full design doc at `Docs/plans/2026-03-25-road-aware-movement-design.md` before writing any code. It has 6 design decisions, type definitions, constants tables, fail-soft tables, and a testing strategy with ~30 specific test cases.

Implement in this order (each step is independently testable):

**Step 1 — Road-aware pathfinding** (`pathfinding.ts`, `movement-content.ts`):
- Add `ROAD_MAJOR_COST_MULTIPLIER` (0.4) and `ROAD_TRAIL_COST_MULTIPLIER` (0.7) to `movement-content.ts`
- In `findShortestPath`: add `road` edges to Dijkstra (both `getOutgoingEdges` and `getIncomingEdges` — roads are stored with canonical alphabetical source/target). For incoming edges, the neighbor is `edge.source`.
- Road edge cost = `totalCost × multiplier`, not `computeEdgeCost`
- Extend `PathResult` with optional `roadSegments?: RoadSegmentInfo[]`
- Write tests: road cheaper than adjacent, road loses when terrain is easy, incoming edge discovery, missing totalCost fallback, mixed path

**Step 2 — Hex-level movement state** (`types/movement.ts`):
- Add to `MovementState` (all optional): `currentHexPosition?: HexCoord`, `roadHexQueue?: HexCoord[]`, `roadHexCost?: number`, `currentRoadType?: 'major' | 'trail'`
- Add `MIN_ROAD_HEX_COST` (0.25) to `movement-content.ts`
- Write type tests verifying backward compatibility

**Step 3 — Road mode in tickMovement** (`movementExecution.ts`):
- Add road branch: when `roadHexQueue?.length > 0`, accumulate against `roadHexCost` per hex instead of `currentEdgeCost` per node
- Update `currentHexPosition` on each road hex transition
- `located_at` edge updates ONLY when `roadHexQueue` empties (arrival at location node)
- Record `MovementHistoryEntry` with hexCol/hexRow for each road hex
- In `initMovementState`: populate `roadHexQueue` from `RoadSegmentInfo`. **Critical:** reverse hexPath when agent travels opposite to stored direction (check if agent is at source or target of road edge).
- Handle mixed paths: road queue empty → advance to next node in movementQueue → normal adjacent hop
- Write tests per the design doc Testing Strategy section (Step 3 cases)

**Step 4 — Gated re-evaluation** (`phaseAgentDecision.ts`):
- **Do NOT remove lines 110–116.** Replace them with the 5-guard re-evaluation from Decision 4 in the design doc.
- Moving agents only run: score comparison (current vs best alternative), tick gating, reroute threshold (`REROUTE_SCORE_MULTIPLIER` = 1.5), action-type guard (only `queue_movement`), target invalidation check.
- Moving agents NEVER run: social candidate generation, full filter pipeline, `start_local`, `attempt_remote`.
- On reroute: snap to nearest road endpoint for pathfinding, clear old targeting fields, update `lastDecisionTick`.
- Add `REROUTE_SCORE_MULTIPLIER` (1.5) to constants.
- Write tests per design doc (Step 4 cases). **Regression test:** idle agents still enter full pipeline.

**Step 5 — Animation road mode** (`agentAnimationState.ts`, `HexMapV2.tsx`, `agent-visual-content.ts`):
- Add constants: `ROAD_MAJOR_HOP_MS` (300), `ROAD_TRAIL_HOP_MS` (500), `ROAD_WOBBLE_FACTOR` (0.3)
- Add `roadContext?: { roadType, isLastHop }` to `AgentAnimState`
- Create `startRoadHopAnimation` factory (shorter duration, reduced wobble)
- Modify `tickAgentAnimations`: road hops chain without settle bounce; settle only on `isLastHop`
- In `HexMapV2.tsx`: detect `currentRoadType` on agent prop when hex changes → use road hop timing
- Write animation tests; visual verification at `?view=game`

**Step 6 — Trace types** (`types/trace.ts`):
- Add `RoadHexTransitionTrace` and `AgentRerouteTrace` interfaces per the design doc

After each step: `npm test`, `npx tsc --noEmit`. After all steps: visual verification at `?view=game` at world, continental, and hero-local zoom tiers. Then follow Definition of Done (commit, push, merge, document).

**Key gotchas from design review (read these before coding):**
- hexPath stored on road edges may be in the wrong direction for the agent's travel — reverse it in `initMovementState`, not in pathfinding
- The road's `totalCost` uses a different formula scale than `computeEdgeCost` — this is intentional, don't try to "fix" it
- The moving-agent skip in `phaseAgentDecision` is a correctness guard, not dead code — the 5-guard replacement is load-bearing
- `located_at` must NOT update at intermediate road hexes — only on arrival at a location node
- Animation durations and engine tick rate are independent — the system is tolerant of mismatches
