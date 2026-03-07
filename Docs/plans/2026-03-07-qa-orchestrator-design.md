# QA Orchestrator Skill — Design Document

**Date:** 2026-03-07
**Status:** Design approved
**Scope:** Project-specific (Fantasy World Simulator, Threadbare aesthetic)

## Problem

The game has accumulated ~67 modules, ~10,500 lines, and 20+ UI components across 6 implementation phases. Visual style drift, redundant UI elements, broken interaction flows, and React anti-patterns accumulate faster than manual review catches them. We need a repeatable, orchestrated QA flow that:

1. Runs multiple specialist checks systematically
2. Produces a prioritized, actionable findings list
3. Feeds into the existing Notion Development Backlog
4. Enables fix agents to work from structured defect descriptions

## Approach: Sequential Specialist Agents

Four specialist sub-agents dispatched **sequentially** by the orchestrator (main Claude session). Sequential dispatch avoids Playwright port conflicts and lets later agents build on earlier findings.

```
┌─────────────────────────────────────────────┐
│              QA ORCHESTRATOR                │
│  (reads skill, dispatches agents, merges)   │
└──────┬──────┬──────┬──────┬─────────────────┘
       │      │      │      │
       v      v      v      v
    Agent 1  Agent 2  Agent 3  Agent 4
    Visual   Info     Inter-   React
    Style    Arch     action   Code
```

### Why Sequential (Not Parallel)

- Playwright MCP controls a single browser — parallel agents would fight over it
- Agent 2 (Info Arch) benefits from Agent 1's screenshot artifacts
- Agent 3 (Interaction) needs the game in a known state, not mid-screenshot
- Agent 4 (React Code) is browser-independent but cheap to run last

## Agent Specifications

### Agent 1: Visual Style Compliance

**Purpose:** Check every visible element against STYLE.md color/typography/brightness rules.

**Tools:** Playwright MCP (`browser_navigate`, `browser_take_screenshot`, `browser_evaluate`, `browser_snapshot`)

**Checks:**
- Background brightness (world surfaces must be 10-40% brightness per STYLE.md)
- UI chrome colors match `oklch(0.21-0.24, ...)` dark range
- Magic elements use sphere-specific colors at 70-100% brightness
- Typography: system monospace for data, serif for narrative
- No emoji where sphere-colored icons should be
- Threadlike decorative elements present (thin lines, not broad glows)
- Fog of war states render correctly (unexplored=black, remembered=dim, visible=normal)

**Method:**
1. Navigate to `http://localhost:5173`
2. Click through world creation to reach main game view
3. Screenshot full viewport
4. Extract all CSS background-color, color, border-color values via `browser_evaluate`
5. Compute brightness for each, compare against STYLE.md thresholds
6. Screenshot individual panels for detail inspection
7. Advance game 10+ ticks, screenshot again (check narrative feed styling)

**Output:** Array of `Finding` objects (see schema below).

### Agent 2: Information Architecture

**Purpose:** Identify redundant text, dead space, information density imbalance, and wasted screen real estate.

**Tools:** Playwright MCP (`browser_evaluate`, `browser_snapshot`)

**Checks:**
- Duplicate text strings across panels (e.g., agent name appearing in 3+ places)
- Repeated identical labels (e.g., "Hostility" ×3)
- Information density per zone (words per panel area)
- Empty/underused panels (right sidebar when no agent selected)
- Narrative feed item count and repetitiveness
- Heading hierarchy (correct H1→H2→H3 nesting)
- Zero-value displays (how many "0.0" or "0%" shown — are they useful?)

**Method:**
1. Run DOM analysis extracting all visible text nodes with positions
2. Group by screen zone (left sidebar, top bar, center, right sidebar, narrative feed)
3. Compute word counts, detect duplicates, measure empty space ratio
4. Advance game and re-check (do densities improve with game progression?)

**Output:** Array of `Finding` objects.

### Agent 3: Interaction & State

**Purpose:** Click through every interactive flow and verify correct state transitions, overlay behavior, and feedback.

**Tools:** Playwright MCP (full set — navigate, click, snapshot, screenshot, evaluate)

**Checks:**
- World creation flow: sphere selection → world seed → game start
- Retinue panel: agent selection → right sidebar populates
- Agent Wheel: click Wheel button → wheel overlay appears → slots are clickable
- Intervention flow: wheel slot → InterventionConfirm popover → execute → essence deducted
- Scry overlay: Scry button → full-screen overlay → position slots → agent picker
- Hex zoom: click hex → HexZoomView → click location → LocationView → breadcrumb back
- Avatar movement: Move button → click hex → avatar moves → fog updates
- Mandate tracker: click → popover with progress details
- Doom bar: visual progression matches tick count
- Overlay stacking: can two overlays appear simultaneously? (shouldn't)
- Edge cases: click outside overlay → closes? Double-click same button? Rapid clicking?

**Method:**
1. Start fresh game, advance to tick 5
2. Systematically test each interaction flow
3. After each action, snapshot to verify DOM state changed correctly
4. Screenshot before/after for visual diff evidence
5. Test error states: click unavailable actions, empty selection, etc.

**Output:** Array of `Finding` objects.

### Agent 4: React Code Quality

**Purpose:** Static analysis of React components for anti-patterns, performance issues, and accessibility gaps.

**Tools:** File system (Read, Grep, Glob) — no browser needed.

**Checks:**
- Missing `key` props in lists
- Inline object/function creation in JSX (re-render triggers)
- Large components (>300 lines) that should be split
- Missing `useCallback`/`useMemo` for expensive computations
- Prop drilling depth (>3 levels suggests context needed)
- Missing ARIA labels on interactive elements
- Missing error boundaries
- Console.log left in production code
- Hardcoded magic numbers (violates tunability principle)
- CSS-in-JS vs className consistency
- Unused imports or dead code

**Method:**
1. Glob all `.tsx` files in `src/components/`
2. Read each, apply checks as regex + structural analysis
3. Also check `src/engine/` exports for unused public functions
4. Cross-reference with CLAUDE.md non-functional priorities

**Output:** Array of `Finding` objects.

## Finding Schema

Every agent produces findings in this structure:

```typescript
interface Finding {
  id: string;              // e.g., "VS-001", "IA-003", "IX-007", "RC-012"
  agent: "visual" | "info-arch" | "interaction" | "react-code";
  severity: "critical" | "major" | "minor" | "suggestion";
  category: string;        // e.g., "color-violation", "redundant-text", "broken-flow", "anti-pattern"
  title: string;           // One-line summary
  description: string;     // What's wrong, with evidence
  evidence?: string;       // CSS value, screenshot ref, code snippet
  location: string;        // File path or UI panel name
  effort: "S" | "M" | "L";  // S=<30min, M=30-120min, L=2h+
  suggestedFix?: string;   // How to fix it
}
```

### Severity Definitions

| Severity | Meaning | Example |
|----------|---------|---------|
| **Critical** | Violates STYLE.md hard rules or breaks core interaction | Hex map background at 88% brightness (rule: 10-40%) |
| **Major** | Significantly degrades UX or contradicts design intent | Agent name duplicated in 3 panels |
| **Minor** | Polish issue, no functional impact | Missing hover state on non-essential element |
| **Suggestion** | Improvement opportunity, not a defect | Component could use `useMemo` for slight perf gain |

### Effort Definitions

| Size | Time | Example |
|------|------|---------|
| **S** | <30 min | Change a CSS color value |
| **M** | 30-120 min | Refactor component to remove redundancy |
| **L** | 2h+ | Redesign panel layout, add new component |

## Orchestrator Flow

```
1. READ skill instructions
2. VERIFY dev server is running (Playwright navigate → check page loads)
3. DISPATCH Agent 1 (Visual Style) → collect findings[]
4. DISPATCH Agent 2 (Info Arch) → collect findings[]
5. DISPATCH Agent 3 (Interaction) → collect findings[]
6. DISPATCH Agent 4 (React Code) → collect findings[]
7. MERGE all findings
8. DEDUPLICATE (same issue found by multiple agents → keep highest severity)
9. SORT by severity (critical → major → minor → suggestion), then by effort (S → M → L)
10. PRESENT prioritized report to user
11. USER selects which findings to fix
12. ADD approved findings to Notion Development Backlog as a "QA Findings" section
13. (Optional) DISPATCH fix agents for approved items
```

### Deduplication Rules

- Same UI element + same issue → merge, keep the more detailed description
- Related issues (e.g., "background too bright" + "insufficient contrast") → group under parent finding
- Cross-agent validation: if Agent 1 flags a color and Agent 4 finds the hardcoded value → link them

## Notion Integration

Findings flow into the **existing Development Backlog** at:
`https://www.notion.so/Development-Backlog-3182b241dfb081b9af78c279eef405cf`

New section: **QA Findings [date]** with a table:

| ID | Severity | Category | Title | Effort | Status |
|----|----------|----------|-------|--------|--------|
| VS-001 | Critical | color-violation | Hex map background at 88% brightness | S | To Fix |

Status values: `To Fix` → `In Progress` → `Fixed` → `Verified`

## Skill Structure

The skill file (`qa-orchestrator/SKILL.md`) will contain:

1. **Overview** — what the skill does, when to use it
2. **Prerequisites** — dev server must be running, STYLE.md must exist
3. **Agent Prompt Templates** — exact prompts for each of the 4 agents, with tool lists and output format instructions
4. **Finding Schema** — the TypeScript interface (for agent reference)
5. **Orchestrator Checklist** — the 13-step flow above as a rigid checklist
6. **Notion Template** — markdown template for the backlog entry
7. **Fix Dispatch Guide** — how to create fix agent prompts from findings

## Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Sequential agents, not parallel | Playwright MCP single-browser constraint |
| 2 | Project-specific, not generic | STYLE.md color rules, Threadbare aesthetic, Nine Reaches terminology — a generic QA skill would miss all of this |
| 3 | Structured JSON findings | Enables deduplication, sorting, Notion import, fix agent dispatch |
| 4 | Collect-first, fix-later | Full picture before acting prevents whack-a-mole; user controls priority |
| 5 | Four specialist agents (not 2 or 6) | Visual + Info Arch + Interaction + Code covers all QA dimensions without overlap. Fewer misses issues; more creates redundancy |
| 6 | Severity×Effort matrix | Borrowed from standard defect triage — critical+S items get fixed first |
| 7 | Notion integration | Single backlog avoids tracking sprawl; QA findings live next to feature work |
