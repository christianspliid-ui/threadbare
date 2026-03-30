# Phase 16: Threads Area — Research

**Researched:** 2026-03-30
**Domain:** React UI refactor + engine graph query extension + action system wiring
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Engine + display** — this phase adds both engine support for creating thread edges to new node types AND the UI to display them
- **Threadable node types:** actors (existing), locations, factions, artifacts, armies — all selected
- **Creation mechanism:** Action-driven — player uses divine actions (ActionDrawer cards) targeting a location/faction/artifact/army to establish a thread. Fits existing Generalized Action Targeting system
- **Edge properties:** Reuse the same `ThreadEdgeProperties` schema for all thread types (tier, devotion, courtPosition, attentionMode). courtPosition and attentionMode may be null/unused for non-agent types. Uniform model
- **Deferred:** Divine court expansion to cover all thread types — future phase. For now, courtPosition semantics only fully apply to agents
- **Grouped sections** — collapsible sections by node type: Agents, Locations, Factions, Artifacts, Armies. Each section has its own header and count
- **All entries compact** — every entry (agents included) becomes a compact row, roughly 25% of current agent card height. No portraits in the sidebar list. Portraits/detail show on click into detail view
- **Agent row format:** name (eye icon to zoom), location (eye icon to zoom), activity (clickable link). Tier indicated by colored left border stripe (existing pattern)
- **Non-agent row format:** name (eye icon to zoom to location), type-appropriate secondary info (e.g., faction territory count, army strength). Claude's discretion on exact per-type secondary line
- **Quick detail view position:** Floats next to the right sidebar, top-right corner, under the top bar. Never overlaps the sidebar — appears to the LEFT of it
- **Quick detail view scope:** Opens for ALL thread types, not just agents. Different info layout per node type
- **Detail content philosophy:** Decision-useful data only — what helps you choose which actions to play. Narrative info belongs in the full profile modal. Adaptive display: only show fields that are populated and actionable.
- **Per-type detail data:**
  - Agent: domain capabilities, sphere alignment, thread tier, quintessence health, current activity/encounter
  - Location: sphere character, prosperity, agents present, controlling faction, active threats
  - Faction: sphere alignment, territory extent, threaded members within, relations to other threaded factions
  - Army: strength/composition, current location/heading, commander (is threaded?), faction
  - Artifact: bearer/location, properties, sphere resonance
- **Interaction:** Click entry → opens quick detail view next to sidebar (does NOT center the map). Eye icon → centers map. "View Profile" in detail view → opens full modal
- **Stub profile modals:** LocationProfileModal, FactionSheet, ArmySheet, ArtifactSheet — minimal shell with placeholder content, wired for navigation. Content filled in future phases
- Replaces current AgentInfoCard overlay behavior (which currently replaces the sidebar content)

### Claude's Discretion
- Exact compact row heights and spacing
- Section collapse/expand default states
- Detail view width and exact positioning math
- Non-agent row secondary info selection per type
- Animation/transition for detail view appearance
- Stub modal internal layout and placeholder content

### Deferred Ideas (OUT OF SCOPE)
- **Divine court expansion** — reiterate the court system to cover all thread types (not just agents with courtPosition). Noted by user as a future phase
- **Full profile modals for non-agent types** — this phase creates stub shells; content-rich modals are separate phases
- **Automatic thread formation** — threads forming automatically from agent presence/investment patterns. This phase is action-driven only
</user_constraints>

---

## Summary

Phase 16 converts the right sidebar from an agent-only retinue list into a generalized **Threads panel** showing every graph node the Ascendant has a `thread` edge to, grouped by node type. The work has three pillars: (1) an engine-layer generalization of `getRetinueAgents()` into a `getThreadedNodes()` query that categorizes by NodeType/actorType, (2) a full UI rebuild of `RetinuePanel` into compact grouped rows with a repositioned floating detail view, and (3) new divine action templates that create thread edges to locations/factions/artifacts/armies via the existing `add_edge` GraphOp.

All five node types the player can thread to are already present in the graph schema: `actor` nodes with `actorType: 'individual'` (agents), `actorType: 'group'` (armies), `actorType: 'faction'` (factions), `location` nodes, and `artifact`/`artifact_legendary` nodes. Thread edges already exist as EdgeType `'thread'` with `ThreadEdgeProperties`. No new NodeTypes or EdgeTypes are required.

**Primary recommendation:** Build a new `getThreadedNodes()` engine function that returns a typed union categorized by node type, refactor `RetinuePanel` into a `ThreadsPanel` with compact row groups, reposition the detail view to float left of the sidebar, and add five new divine action templates (one per new threadable type).

---

## Standard Stack

### Core (already in project)
| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| React 18 | 18.x | Component tree | Project standard |
| TypeScript | 5.x | Type safety | Project standard |
| Tailwind CSS | 3.x | Utility classes | Project standard — design tokens in `index.css` |
| Vitest | 2.x | Test runner | `npm test` |

### Supporting (already in project)
| Component | Location | Purpose | Notes |
|-----------|----------|---------|-------|
| `SectionHeading` | `src/components/shared/SectionHeading.tsx` | Group headers with count badge | Already supports `count` prop |
| `IconButton` | `src/components/shared/IconButton.tsx` | Eye/zoom icon button | Already used for center-on-hex |
| `Tooltip` | `src/components/shared/Tooltip.tsx` | Hover info on compact rows | Already used in RetinuePanel |
| `Modal` | `src/components/shared/Modal.tsx` | Stub profile modals | Portal-based, max-height 85vh |
| `AnimateMount` | `src/components/shared/AnimateMount.tsx` | Detail view fade transition | Already used in GameView |
| `TIER_COLORS`, `TIER_COLOR_DEFAULT` | `src/data/uiColorPalette.ts` | Tier→color mapping for border stripe | Already used in RetinuePanel |

**No new npm packages required.** This phase is pure internal refactor + new components.

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── engine/
│   ├── retinue.ts             # Extend: add getThreadedNodes() alongside existing getRetinueAgents()
│   └── graphQueries.ts        # Extend: getThreadsFrom() already exists; add typed variant
├── components/Game/
│   ├── ThreadsPanel.tsx        # NEW: replaces RetinuePanel — compact grouped rows
│   ├── ThreadDetailView.tsx    # NEW: repositioned/generalized AgentInfoCard
│   ├── LocationProfileModal.tsx # NEW: stub modal
│   ├── FactionSheet.tsx        # NEW: stub modal
│   ├── ArmySheet.tsx           # NEW: stub modal
│   └── ArtifactSheet.tsx       # NEW: stub modal
└── data/
    └── unified-action-templates.ts  # Extend: add thread-creation action templates
```

### Pattern 1: Node Type Classification in getThreadedNodes()

Thread edges from the ascendant point to nodes with different `type` and `properties.actorType` values. The function needs to dispatch on these to produce typed entries.

**Node type → row category mapping:**
| NodeType | `actorType` property | Thread category |
|----------|---------------------|-----------------|
| `actor` | `individual` | `'agent'` |
| `actor` | `faction` | `'faction'` |
| `actor` | `group` (with `armyState`) | `'army'` |
| `location` | — | `'location'` |
| `artifact` / `artifact_legendary` | — | `'artifact'` |
| `actor` | `god` / `culture` / other | skip or `'other'` |

**Existing graph queries that help:**
- `getThreadsFrom(graph, ascendantId)` — returns all outgoing thread edges (in `graphQueries.ts` line ~191)
- `getAgentLocation(graph, agentId)` — used in retinue.ts for agent location lookup
- Army location: resolve via `located_at` outgoing edge (same pattern as agents)
- Faction territory: count `controls` outgoing edges or locations with `member_of` relationship

**Key insight about army detection:** Armies are `actor` nodes with `actorType: 'group'` and a non-null `armyState` property (see `src/types/army.ts`). The group actorType is shared with non-army groups, so check for `armyState` presence to distinguish.

### Pattern 2: Compact Row (25% height of current card)

Current agent card in RetinuePanel renders: portrait (3:4 ratio) + name/tier badge + location + activity + attention toggle + encounter badge. That's ~200px tall.

Compact row target: ~40-48px. Content: tier-colored left border (3px), name truncated (eye icon), secondary line (location or type-specific info). No portrait in sidebar.

```typescript
// Compact row structure (approximate)
<div style={{ borderLeftWidth: '3px', borderLeftColor: tierColor, padding: '4px 8px', height: '~40px' }}>
  <div className="flex items-center gap-1">
    <span className="truncate font-medium" style={{ fontSize: 'var(--text-sm)' }}>{name}</span>
    <IconButton icon="eye" onClick={onCenterOnMap} />
  </div>
  <div className="truncate" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
    {secondaryInfo}
  </div>
</div>
```

### Pattern 3: Floating Detail View (left of sidebar)

Currently, `AgentInfoCard` **replaces** the sidebar content: `agentInfoCard ? <AgentInfoCard /> : <RetinuePanel />`.

The new behavior: detail view floats to the **left** of the sidebar. This requires layout restructure in `GameView.tsx` around line 1280-1340.

**Layout approach:**
```tsx
{/* Right sidebar area — sidebar + optional detail view */}
<div className="flex flex-row-reverse flex-shrink-0" style={{ position: 'relative' }}>
  {/* Right sidebar — always visible */}
  <div data-testid="right-sidebar" style={{ width: 'var(--sidebar-width)', ... }}>
    <ThreadsPanel ... />
  </div>
  {/* Detail view — floats to left of sidebar */}
  <AnimateMount show={threadDetailOpen} animation="anim-fade">
    <div style={{
      width: 280,  // Claude's discretion
      position: 'relative',  // participates in flex flow, not absolutely positioned
      borderLeft: '1px solid var(--border-gold)',
      ...
    }}>
      <ThreadDetailView ... />
    </div>
  </AnimateMount>
</div>
```

**Key constraint:** Must never overlap sidebar. Using flex `flex-row-reverse` so detail view pushes left naturally within the flex row, bounded by available space. No position:absolute needed — stays within the layout flow.

**Viewport constraint:** At 1920px, `--sidebar-width` is 280px. A 280px detail view means 560px total right panel. This is well within the 1920px viewport — main map area still has 1360px. At smaller widths (1440px), the detail view may need to be narrower.

### Pattern 4: Thread-Creation Action Templates

New divine action templates follow the existing pattern in `unified-action-templates.ts`. They produce a GraphOp with `op: 'add_edge'`, `edgeType: 'thread'`, `source: '{{ascendant}}'`, `target: '{{target}}'`.

**Symbolic references** (`{{ascendant}}` and `{{target}}`) are resolved via `resolveRef()` in `graphOp.ts` — check existing divine action templates for established conventions.

**Template registration:** Add to `UNIFIED_ACTION_TEMPLATES` array in `unified-action-templates.ts`. Templates must set `targetActorTypes` or targeting context filter to limit to the appropriate node type.

### Pattern 5: Non-Agent Status Derivation

`getAgentActivityLabel()` in `agentActivity.ts` derives activity strings from unified actions + encounter progress + movement state. Non-agent types need simpler status strings derived from node properties:

- **Location:** derive from `prosperityScore`, `activeThreats` in node properties
- **Faction:** derive from `goldCapabilityTier`, member count via incoming `member_of` edges
- **Army:** derive from `armyState.size`, `armyState.objective`, `armyState.quintessence`
- **Artifact:** derive from `possesses` or `bonded_to` incoming edges to find bearer

### Anti-Patterns to Avoid
- **Replacing AgentInfoCard logic wholesale:** Generalize into `ThreadDetailView` that dispatches per node type — don't duplicate the existing agent detail logic
- **Absolute positioning for detail view:** Will cause viewport overflow at smaller widths. Use flex layout to let it participate in normal flow
- **Checking `actorType === 'group'` alone to identify armies:** Groups and guilds are also 'group'. Check for `armyState` property presence
- **Adding new NodeType for armies:** Armies are `actor` nodes with `actorType: 'group'` by existing architecture decision. Do NOT add a new NodeType
- **Fetching full AgentInfoCardData for non-agents:** `buildAgentInfoCard()` in `agentDetail.ts` is agent-specific. Build separate lightweight detail builders for each non-agent type

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Thread edge creation | Custom mutation function | `GraphOp` with `op: 'add_edge'`, `edgeType: 'thread'` | Already the canonical mutation path; executed via `executeGraphOps()` |
| Modal shell | Custom portal/overlay | `Modal` shared component | Portal-based, ESC handling, max-height already handled |
| Tier color lookup | Per-component switch | `TIER_COLORS[tier]` from `uiColorPalette.ts` | Single source of truth |
| Section headers with count | Custom `<h3>` + badge | `SectionHeading` with `count` prop | Already supports count badge, matches ornamental style |
| Eye/zoom button | Raw `<button>` | `IconButton` | Consistent sizing, accessible, already used for eye pattern |
| Detail view fade animation | Custom CSS transition | `AnimateMount` with `animation="anim-fade"` | Already used for scry overlay, strand view, etc. |
| Thread edge query | Raw `getOutgoingEdges(ascendantId, 'thread')` | `getThreadsFrom()` from `graphQueries.ts` | Canonical query, already correct direction and type |

---

## Common Pitfalls

### Pitfall 1: GameView sidebar layout restructure breaks the detail view constraint
**What goes wrong:** If `ThreadDetailView` is rendered inside the right sidebar `<div>` (inside the scrollable area), it will scroll with the sidebar content, cutting off at the panel bottom. The brief says it should be anchored under the top bar — i.e., it should have its own full height.
**Why it happens:** The current sidebar div uses `overflow-y-auto` for scrolling. Placing the detail view inside it makes it participate in that scroll.
**How to avoid:** Render `ThreadDetailView` as a sibling to the sidebar div, not a child. Both are flex children of the right panel wrapper. The sidebar gets `overflow-y-auto`; the detail view gets `overflow-y-auto` independently (its own scroll context).
**Warning signs:** Detail view content gets cut off when sidebar is scrolled. Detail view height is smaller than sidebar.

### Pitfall 2: `actorType: 'group'` matches non-army groups
**What goes wrong:** Guilds, wandering bands, and other group-type actors also have `actorType: 'group'` but no `armyState`. Including them in the "Armies" section or trying to read `armyState.size` crashes.
**How to avoid:** When classifying thread targets, check `(props.armyState as ArmyState | undefined)` — armies have this, other groups don't. Fall through to a generic group category or skip if no `armyState`.
**Warning signs:** "undefined" in Army section, TypeError reading `.size` of undefined.

### Pitfall 3: Detail view width causes viewport overflow at 1440px
**What goes wrong:** At 1440px, `--sidebar-width` is 360px. A 280px detail view brings the right panel to 640px total. If the map + left sidebar also consume their minimum space, horizontal scroll appears — which is forbidden by the viewport contract.
**How to avoid:** Cap detail view width responsively or collapse it at smaller viewports. Use the same CSS variable breakpoints that govern `--sidebar-width` (lines 74, 102, 111, 119 in `index.css`).
**Warning signs:** Horizontal scrollbar appears. `html, body { overflow: hidden }` causes content to be clipped instead.

### Pitfall 4: Forgetting to update GameView's `selectedAgentId` logic
**What goes wrong:** `handleAgentSelect` and `handleBackFromAgentDetail` are tightly coupled to agent-only flow. When the new ThreadsPanel calls `onEntrySelect` with a location or faction ID, the GameView may try to look up an `AgentInfoCardData` for it, fail silently, and show nothing.
**How to avoid:** Extend the selected-node state in GameView to hold a `{ nodeId: string; nodeType: ThreadCategory }` discriminated union. Route to agent detail vs. generic thread detail based on category.
**Warning signs:** Clicking a location thread entry opens no detail view. Console shows silent undefined lookups.

### Pitfall 5: Thread-creation action templates triggering on wrong target types
**What goes wrong:** Divine action templates with broad `targetActorTypes` may surface in ActionDrawer when targeting agents, not just locations/factions/armies.
**How to avoid:** Set tight `targetActorTypes` or use the existing `targetFilter` mechanism (see unified-action-templates.ts). Locations use `nodeType: 'location'`, factions use `actorType: 'faction'`, armies use `actorType: 'group'` with `armyState` check.
**Warning signs:** "Bind Thread" card appears when clicking on individual agents.

### Pitfall 6: RetinuePanel test suite breaks on rename/refactor
**What goes wrong:** There are multiple tests at `src/components/Game/__tests__/RetinuePanel.test.tsx` (implied by the test file list). Renaming or significantly changing props breaks them.
**How to avoid:** Keep `RetinuePanel` as a thin wrapper or alias that forwards to `ThreadsPanel` during transition. Or update tests as part of the plan. Check `src/components/Game/__tests__/` for all RetinuePanel-dependent tests.
**Warning signs:** Test suite shows `RetinuePanel` import errors after component restructure.

---

## Code Examples

### Thread edge traversal (current pattern, extend this)
```typescript
// Source: src/engine/graphQueries.ts line ~191
export function getThreadsFrom(graph: WorldGraph, ascendantId: string): GraphEdge[] {
  return graph.getOutgoingEdges(ascendantId, 'thread');
}

// Extended pattern for getThreadedNodes():
export function getThreadedNodes(graph: WorldGraph, ascendantId: string): ThreadedNode[] {
  const edges = graph.getOutgoingEdges(ascendantId, 'thread');
  return edges
    .map(edge => {
      const node = graph.getNode(edge.target);
      if (!node) return null;
      const props = node.properties as Record<string, unknown>;
      const threadProps = edge.properties as unknown as ThreadEdgeProperties;
      if (threadProps.tier === 0) return null; // exclude unaware
      return classifyThreadedNode(node, edge, threadProps);
    })
    .filter((n): n is ThreadedNode => n !== null);
}
```

### Army detection (distinguish from non-army groups)
```typescript
// Source: src/types/army.ts + existing armySpawning tests
const isArmy = (node: GraphNode): boolean => {
  const props = node.properties as Record<string, unknown>;
  return node.type === 'actor'
    && props.actorType === 'group'
    && props.armyState != null;
};
```

### GraphOp for thread-creation action
```typescript
// Pattern from existing divine action templates in unified-action-templates.ts
// New thread-creation action step:
{
  op: 'add_edge',
  edgeType: 'thread',
  source: '{{ascendant}}',   // resolved to ascendant node ID at runtime
  target: '{{target}}',      // resolved to the action target node ID
  properties: {
    tier: 1,
    ticksAtCurrentTier: 0,
    establishedTick: '{{tick}}',
    totalEssenceSpent: 0,
    maintenanceCurrent: true,
    readBackstoryTier: 0,
  }
}
```

### Compact row height target
The current agent card achieves height via portrait (3:4 aspect ratio = ~160px at 280px width) + three content lines. Removing the portrait and compressing to two lines at `var(--text-sm)` + `var(--text-xs)` with `py-1` padding yields approximately 40px — within the "25% of current" target.

### Sidebar layout restructure in GameView
```tsx
{/* Right panel: sidebar always + detail view conditionally to its left */}
<div className="flex flex-shrink-0" style={{ alignItems: 'stretch' }}>
  {/* Detail view — to the LEFT of sidebar, own scroll context */}
  <AnimateMount show={threadDetailOpen} animation="anim-fade">
    <div
      style={{
        width: 'clamp(240px, 280px, 30vw)',
        borderLeft: '1px solid var(--border-gold)',
        background: 'var(--bg-surface)',
        overflowY: 'auto',
      }}
    >
      <ThreadDetailView ... />
    </div>
  </AnimateMount>
  {/* Sidebar — always rendered */}
  <div
    data-testid="right-sidebar"
    className="overflow-y-auto flex-shrink-0"
    style={{ width: 'var(--sidebar-width)', ... }}
  >
    <ThreadsPanel ... />
  </div>
</div>
```

---

## State of the Art

| Old Pattern | New Pattern | Notes |
|-------------|-------------|-------|
| `RetinuePanel` renders only agents | `ThreadsPanel` renders all thread target node types | Extends, not replaces |
| `AgentInfoCard` replaces sidebar content | `ThreadDetailView` floats left of sidebar | Layout restructure in GameView |
| Thread edges only exist to `actor` nodes with `actorType: 'individual'` | Thread edges to any node type | `ThreadEdgeProperties` schema reused as-is |
| Agent-only detail view in sidebar | Per-node-type detail views | Dispatch based on `ThreadCategory` |
| No divine actions targeting locations/factions/armies/artifacts for thread creation | New action templates in `UNIFIED_ACTION_TEMPLATES` | Uses existing `add_edge` GraphOp |

**Deprecated behavior (this phase retires it):**
- `AgentInfoCard` rendering inside the sidebar div, replacing the retinue list — replaced by `ThreadDetailView` floating alongside

---

## Open Questions

1. **`getAscendantThreadEdges()` and `getAscendantForAgent()` referenced in CONTEXT.md do not exist yet**
   - What we know: `getThreadsFrom()` and `getThreadAscendant()` exist in `graphQueries.ts` and cover this functionality
   - What's unclear: Whether these were planned additions or the CONTEXT.md used slightly different naming
   - Recommendation: Use `getThreadsFrom()` as-is; rename or alias if needed for clarity. No new functions required.

2. **Faction "territory count" secondary info — how to derive it**
   - What we know: `controls` outgoing edges exist (`EdgeType: 'controls'`). `getFactionMembers()` exists.
   - What's unclear: Whether `controls` edges point to location nodes (for territory count) or resource nodes. Runtime inspection needed.
   - Recommendation: In the engine detail builder for factions, count outgoing `controls` edges to `location` nodes. Fall back to member count if zero. Mark as `LOW` confidence until verified at runtime.

3. **Artifact bearer lookup — `possesses` vs `bonded_to`**
   - What we know: Both edge types exist (`possesses` for common, `bonded_to` for legendary).
   - What's unclear: Whether all seeded artifacts have bearer edges or only some.
   - Recommendation: Check for `bonded_to` first, then `possesses` incoming edges to find the bearer/location. Fail-soft to "(location unknown)" if not found.

4. **Collapsible section state — local or persisted**
   - What we know: Other collapsible panels in the game (e.g., HexSidebar) use local React state
   - What's unclear: Whether collapse state should survive navigation/re-renders
   - Recommendation: Use local `useState` per section. Persisting is out of scope for this phase.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 2.x |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test -- --reporter=verbose --run src/engine/__tests__/retinue.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Area | Behavior | Test Type | Automated Command |
|------|----------|-----------|-------------------|
| Engine: `getThreadedNodes()` | Returns typed entries grouped by node type, excludes tier-0, handles mixed types | unit | `npm test -- --run src/engine/__tests__/retinue.test.ts` |
| Engine: army detection | `armyState` presence distinguishes army from non-army group | unit | (in retinue.test.ts) |
| Engine: location thread entry | Returns location info (name, hex coords) for location-type thread targets | unit | (in retinue.test.ts) |
| UI: ThreadsPanel sections | Each node type appears in correct section | component | `npm test -- --run src/components/Game/__tests__/RetinuePanel.test.tsx` |
| UI: compact row | Agent row is ~40px, no portrait rendered | component | visual + snapshot |
| Action template: thread creation | add_edge GraphOp produces thread edge with correct properties | integration | `npm test -- --run src/engine/__tests__/unifiedActionResolution.test.ts` |

### Sampling Rate
- **Per task commit:** `npm test -- --run src/engine/__tests__/retinue.test.ts`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green + `npx tsc --noEmit` + `npx vite build` before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] New tests for `getThreadedNodes()` covering all five node type categories — add to `src/engine/__tests__/retinue.test.ts` (extend existing file)
- [ ] New tests for `ThreadsPanel` compact rows — in `src/components/Game/__tests__/ThreadsPanel.test.tsx`
- [ ] Update `src/components/Game/__tests__/RetinuePanel.test.tsx` if it imports by old name (or replace with ThreadsPanel tests)

---

## Sources

### Primary (HIGH confidence)
- Direct source read: `src/engine/retinue.ts` — getRetinueAgents() implementation, RetinueAgent interface
- Direct source read: `src/types/influence.ts` — ThreadEdgeProperties schema
- Direct source read: `src/types/graph.ts` — NodeType, EdgeType, ActorType
- Direct source read: `src/engine/graphQueries.ts` — getThreadsFrom(), getThreadAscendant(), existing query patterns
- Direct source read: `src/types/army.ts` — ArmyState, actorType: 'group' pattern
- Direct source read: `src/components/Game/RetinuePanel.tsx` — current card heights and structure
- Direct source read: `src/components/Game/AgentInfoCard.tsx` — current detail view structure
- Direct source read: `src/components/Game/GameView.tsx` lines 1280-1340 — sidebar rendering logic
- Direct source read: `src/data/uiColorPalette.ts` — TIER_COLORS, design tokens
- Direct source read: `src/index.css` — --sidebar-width breakpoints (280px/360px/400px/420px)

### Secondary (MEDIUM confidence)
- Inferred from `src/data/unified-action-templates.ts` structure — add_edge GraphOp pattern for new thread-creation templates
- Inferred from existing test files in `src/engine/__tests__/` — test infrastructure shape for new retinue tests

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — entire stack is existing project code, no new dependencies
- Architecture patterns: HIGH — all patterns derived from direct source reading
- Pitfalls: HIGH — identified from source code structure and project constraints
- Action template wiring: MEDIUM — inferred from template structure; exact `targetFilter` convention needs verification in plan

**Research date:** 2026-03-30
**Valid until:** 2026-05-01 (stable codebase, no fast-moving deps)
