---
phase: 16-expand-retinue-sidebar-threads-area
plan: "01"
subsystem: retinue-engine, threads-ui
tags: [engine, ui, retinue, threads, sidebar]
dependency_graph:
  requires: []
  provides: [getThreadedNodes, ThreadsPanel, threadedNodes-hook-value]
  affects: [GameView-right-sidebar, useAgentInteraction]
tech_stack:
  added: []
  patterns: [grouped-compact-rows, collapsible-sections, discriminated-union-classification]
key_files:
  created:
    - src/engine/retinue.ts
    - src/engine/__tests__/retinue.test.ts
    - src/components/Game/ThreadsPanel.tsx
    - src/components/Game/__tests__/ThreadsPanel.test.tsx
  modified:
    - src/components/Game/GameView.tsx
    - src/components/Game/hooks/useAgentInteraction.ts
decisions:
  - "Thread classification uses node.type + actorType discriminant: individual→agent, faction→faction, group+armyState→army, location→location, artifact|artifact_legendary→artifact"
  - "Faction dominantSphere resolves via sphereAlignment.primary → sphereAffinity.scores max → territory 'controls' edge aggregate → null"
  - "Group nodes without armyState are silently skipped (not surfaced as an error)"
  - "Agent activity labels enriched in useMemo via getAgentActivityLabel (same pattern as enrichRetinueWithActivity)"
  - "GameView sidebar now always renders ThreadsPanel (when threadedNodes.length > 0) rather than AgentInfoCard+RetinuePanel conditional"
metrics:
  duration: "6 minutes"
  completed: "2026-03-30"
  tasks: 2
  files: 6
---

# Phase 16 Plan 01: Engine Query Layer + ThreadsPanel Summary

Engine query layer (getThreadedNodes) and ThreadsPanel UI component that replaces the agent-only RetinuePanel with a grouped compact-row sidebar covering all 5 thread target node types.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Engine — getThreadedNodes() query + types + tests | 8d42709 | src/engine/retinue.ts, src/engine/__tests__/retinue.test.ts |
| 2 | UI — ThreadsPanel component + GameView sidebar wiring | c50a7bd | ThreadsPanel.tsx, ThreadsPanel.test.tsx, GameView.tsx, useAgentInteraction.ts |

## What Was Built

**Engine layer (retinue.ts):**
- `ThreadCategory` union type: `'agent' | 'location' | 'faction' | 'army' | 'artifact'`
- `ThreadedNodeBase` + 5 specialized interfaces (ThreadedAgent, ThreadedLocation, ThreadedFaction, ThreadedArmy, ThreadedArtifact)
- `getThreadedNodes(graph, ascendantId)` — queries all outgoing `thread` edges, classifies by node type, excludes tier-0, sorts tier-desc then name-asc
- `resolveFactionDominantSphere()` — multi-strategy resolver: direct property → sphereAffinity scores → territory aggregate
- `groupThreadedNodes()` — groups flat array into Record<ThreadCategory, ThreadedNode[]>

**UI layer (ThreadsPanel.tsx):**
- Compact rows (~40px) with 3px tier-colored left border
- Agents section defaults expanded; all others collapsed
- Empty sections hidden entirely; global empty state renders "No Threads"
- Faction rows show sphere alignment first in secondary info per CONTEXT.md locked decision
- Eye icon centers map on entity's hex (with event.stopPropagation)
- Encounter badge and attention toggle wired for agent rows

**Hook updates (useAgentInteraction.ts):**
- New `selectedThreadNode` state for discriminated thread selection
- New `threadedNodes` computed value with agent activity labels enriched
- `handleThreadNodeSelect` / `handleThreadDetailClose` callbacks exported

**GameView.tsx:** Right sidebar now renders `ThreadsPanel` instead of the `AgentInfoCard ? ... : RetinuePanel ? ... : WorldPulse` cascade.

## Test Results

- `src/engine/__tests__/retinue.test.ts`: 23 passed (11 existing getRetinueAgents + 12 new getThreadedNodes)
- `src/components/Game/__tests__/ThreadsPanel.test.tsx`: 12 passed
- `npx tsc --noEmit`: clean
- `npx vite build`: clean (pre-existing chunk size warning unrelated to this change)

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- src/engine/retinue.ts: FOUND
- src/components/Game/ThreadsPanel.tsx: FOUND
- src/components/Game/__tests__/ThreadsPanel.test.tsx: FOUND
- Commits 8d42709 and c50a7bd: FOUND
