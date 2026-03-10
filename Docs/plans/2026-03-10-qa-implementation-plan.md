# QA Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the DebugPanel stale trace bug, implement a dev-only `window.__DEBUG` bridge for Playwright access to engine traces, and create the `qa-orchestrator` skill that teaches Claude to run systematic 3-mode QA sweeps with 4 specialist sub-agents.

**Architecture:** Three independent deliverables: (1) a 1-line DebugPanel bug fix with test, (2) a `debug-bridge.ts` module that exposes traceBuffer functions on `window.__DEBUG` in dev mode with type declarations, (3) a comprehensive SKILL.md file at `.claude/skills/qa-orchestrator/SKILL.md` containing 3 QA modes, 4 agent prompt templates, a finding schema, an orchestrator checklist, and backlog routing. The skill is a markdown file — no runtime code.

**Tech Stack:** React (DebugPanel fix), Vite `import.meta.env.DEV` (debug bridge), vitest + @testing-library/react (tests), Markdown (skill file).

---

### Task 1: Fix DebugPanel Stale Trace Bug

**Files:**
- Modify: `src/components/Game/DebugPanel.tsx:676`

**Step 1: Write the failing test**

Create test in existing test file `src/components/Game/__tests__/DebugPanel.test.tsx`. Add this test at the end of the describe block:

```typescript
it('refreshes traces when currentTick changes', () => {
  emitTrace({
    tick: 1,
    category: 'tick_summary',
    summary: 'Tick 1 summary',
    phaseEventCounts: { agent_actions: 1 },
    agentsProcessed: 1,
    doomStage: 1,
    essenceTotal: 10,
    mandateProgress: 0.1,
  } as any);

  const { rerender } = render(<DebugPanel currentTick={1} />);
  expect(screen.getByText(/Tick 1 summary/)).toBeTruthy();

  // Emit a new trace for tick 2
  emitTrace({
    tick: 2,
    category: 'tick_summary',
    summary: 'Tick 2 summary',
    phaseEventCounts: { agent_actions: 2 },
    agentsProcessed: 2,
    doomStage: 1,
    essenceTotal: 20,
    mandateProgress: 0.2,
  } as any);

  // Re-render with updated tick — traces should refresh
  rerender(<DebugPanel currentTick={2} />);
  expect(screen.getByText(/Tick 2 summary/)).toBeTruthy();
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/Game/__tests__/DebugPanel.test.tsx --reporter=verbose`
Expected: FAIL — "Tick 2 summary" not found because `useMemo` has empty dep array and never re-reads traces.

**Step 3: Fix the bug**

In `src/components/Game/DebugPanel.tsx` line 676, change:

```typescript
const allTraces = useMemo(() => getTraces(), []);
```

to:

```typescript
const allTraces = useMemo(() => getTraces(), [currentTick]);
```

This adds `currentTick` (already a prop on DebugPanelProps) to the dependency array so traces re-read on each tick advance.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/Game/__tests__/DebugPanel.test.tsx --reporter=verbose`
Expected: ALL PASS including the new "refreshes traces when currentTick changes" test.

**Step 5: Run full DebugPanel test suite**

Run: `npx vitest run src/components/Game/__tests__/DebugPanel --reporter=verbose`
Expected: All tests in DebugPanel.test.tsx, DebugPanel-intervention.test.tsx, DebugPanel-modifier.test.tsx pass.

**Step 6: Commit**

```bash
git add src/components/Game/DebugPanel.tsx src/components/Game/__tests__/DebugPanel.test.tsx
git commit -m "fix: DebugPanel traces refresh when currentTick changes (was stale on mount)"
```

---

### Task 2: Create Debug Bridge Type Declarations

**Files:**
- Create: `src/debug-bridge.d.ts`

**Step 1: Write the type declaration file**

Create `src/debug-bridge.d.ts`:

```typescript
import type { TraceEntry } from './types/trace';

export interface DebugBridge {
  getTraces: () => Promise<ReadonlyArray<TraceEntry>>;
  enableTracing: () => Promise<void>;
  disableTracing: () => Promise<void>;
  isTracingEnabled: () => Promise<boolean>;
  clearTraces: () => Promise<void>;
}

declare global {
  interface Window {
    __DEBUG?: DebugBridge;
  }
}
```

**Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No errors. The global augmentation should be picked up by TypeScript since the file is in `src/`.

**Step 3: Commit**

```bash
git add src/debug-bridge.d.ts
git commit -m "types: add DebugBridge global window type declaration"
```

---

### Task 3: Implement Debug Bridge

**Files:**
- Create: `src/debug-bridge.ts`
- Modify: `src/main.tsx`

**Step 1: Write the failing test**

Create `src/engine/__tests__/debug-bridge.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// We test the bridge by directly importing and calling the functions it exposes,
// since the bridge itself uses dynamic imports to the same modules.
import {
  enableTracing,
  disableTracing,
  isTracingEnabled,
  getTraces,
  clearTraces,
  emitTrace,
} from '../traceBuffer';

describe('debug-bridge contract', () => {
  beforeEach(() => {
    disableTracing();
    clearTraces();
  });

  it('getTraces returns readonly array of TraceEntry', () => {
    enableTracing();
    emitTrace({
      tick: 1,
      category: 'tick_summary',
      summary: 'test trace',
      phaseEventCounts: {},
      agentsProcessed: 0,
      doomStage: 0,
      essenceTotal: 0,
      mandateProgress: 0,
    } as any);
    const traces = getTraces();
    expect(traces.length).toBe(1);
    expect(traces[0].summary).toBe('test trace');
  });

  it('enableTracing/disableTracing toggle tracing state', () => {
    expect(isTracingEnabled()).toBe(false);
    enableTracing();
    expect(isTracingEnabled()).toBe(true);
    disableTracing();
    expect(isTracingEnabled()).toBe(false);
  });

  it('clearTraces empties the buffer', () => {
    enableTracing();
    emitTrace({
      tick: 1,
      category: 'tick_summary',
      summary: 'to be cleared',
      phaseEventCounts: {},
      agentsProcessed: 0,
      doomStage: 0,
      essenceTotal: 0,
      mandateProgress: 0,
    } as any);
    expect(getTraces().length).toBe(1);
    clearTraces();
    expect(getTraces().length).toBe(0);
  });
});
```

**Step 2: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/debug-bridge.test.ts --reporter=verbose`
Expected: PASS — these test the underlying contract that the bridge exposes.

**Step 3: Create the debug bridge module**

Create `src/debug-bridge.ts`:

```typescript
/**
 * Dev-only debug bridge — exposes engine internals on window.__DEBUG
 * for Playwright-driven QA and interactive debugging.
 *
 * Tree-shaken in production: import.meta.env.DEV is statically replaced
 * by Vite, so the entire module becomes dead code in prod builds.
 */
if (import.meta.env.DEV) {
  window.__DEBUG = {
    getTraces: () => import('./engine/traceBuffer').then((m) => m.getTraces()),
    enableTracing: () => import('./engine/traceBuffer').then((m) => m.enableTracing()),
    disableTracing: () => import('./engine/traceBuffer').then((m) => m.disableTracing()),
    isTracingEnabled: () => import('./engine/traceBuffer').then((m) => m.isTracingEnabled()),
    clearTraces: () => import('./engine/traceBuffer').then((m) => m.clearTraces()),
  };
}
```

**Step 4: Wire into main.tsx**

Add the import at the top of `src/main.tsx`, after the existing imports and before `createRoot`:

```typescript
import './debug-bridge';
```

The full file should read:

```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import './debug-bridge';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

**Step 5: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 6: Commit**

```bash
git add src/debug-bridge.ts src/main.tsx src/engine/__tests__/debug-bridge.test.ts
git commit -m "feat: add window.__DEBUG bridge for Playwright QA access to trace buffer"
```

---

### Task 4: Create qa-orchestrator Skill — Scaffold and Overview

**Files:**
- Create: `.claude/skills/qa-orchestrator/SKILL.md`

**Step 1: Create the skill directory**

```bash
mkdir -p .claude/skills/qa-orchestrator
```

**Step 2: Write the skill file scaffold with frontmatter, overview, prerequisites, and mode selection**

Create `.claude/skills/qa-orchestrator/SKILL.md` with the content below. This is the first section — subsequent tasks append to it.

```markdown
---
name: qa-orchestrator
description: Use when running a QA sweep of The Fantasy World Simulator UI. Trigger on "run QA", "check the UI", "visual audit", "find UI bugs", "frontend QA", "QA sweep", or after completing a major implementation phase. Dispatches specialist sub-agents for visual style, information architecture, interaction flows, and React code quality.
---

# QA Orchestrator

Systematic QA sweep of The Fantasy World Simulator. Three modes, four specialist agents, structured findings with backlog routing.

## Mode Selection

Ask the user which mode to run, or default to Mode 1 if they said "run QA" without specifics.

| Mode | Name | Browser? | What it does |
|------|------|----------|--------------|
| **1** | Interactive Playtest | Yes (Playwright) | Full sweep: 4 sequential agents audit the live game via browser |
| **2** | Headless Sweep | No | CLI regression check: tests + typecheck + playtest runner + model validation |
| **3** | Targeted Audit | Maybe | Deep-dive on a specific system (user specifies which) |

## Prerequisites (Mode 1 and 3)

Before dispatching browser-based agents, verify:

1. **Dev server running** — user must have `npm run dev` active at `http://localhost:5173`
2. **Playwright MCP connected** — `browser_navigate` must respond
3. **STYLE.md exists** — read it for visual spec reference

**Pre-flight check:** Navigate to `http://localhost:5173` via Playwright. If the page doesn't load, stop and tell the user to start the dev server.

## Prerequisites (Mode 2)

No browser needed. Just verify the project directory is correct and `npm test` can run.

## Prerequisites (All Modes)

- **Notion MCP connected** — for writing findings to the Development Backlog
- Read `STYLE.md` for visual reference
- Initialize findings collection: `findings = []`
```

**Step 3: Verify file exists**

```bash
cat .claude/skills/qa-orchestrator/SKILL.md | head -5
```

Expected: Frontmatter with name `qa-orchestrator` visible.

**Step 4: Commit**

```bash
git add .claude/skills/qa-orchestrator/SKILL.md
git commit -m "feat: scaffold qa-orchestrator skill with mode selection and prerequisites"
```

---

### Task 5: Add Finding Schema and Backlog Routing to Skill

**Files:**
- Modify: `.claude/skills/qa-orchestrator/SKILL.md`

**Step 1: Append the Finding Schema section**

Append to the end of `.claude/skills/qa-orchestrator/SKILL.md`:

```markdown

## Finding Schema

Every agent produces findings in this exact JSON structure. Consistent schema enables merging, deduplication, and Notion import.

```json
{
  "id": "VS-001",
  "agent": "visual",
  "severity": "critical",
  "category": "color-violation",
  "backlog": "visual-assets",
  "notionPrefix": "ART",
  "title": "Hex map background exceeds brightness ceiling",
  "description": "Background color rgb(244,232,193) computes to 88% brightness. STYLE.md requires world surfaces in 10-40% range.",
  "evidence": "CSS: background-color: rgb(244, 232, 193); HSL: hsl(39, 76%, 86%)",
  "screenshot": "Docs/qa/screenshots/QA-2026-03-10-001.png",
  "location": "HexMap.tsx / SVG background rect",
  "effort": "S",
  "suggestedFix": "Change to oklch(0.25, 0.02, 80) or similar dark warm tone"
}
```

### Field Reference

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Agent prefix + sequence: VS-001, IA-001, IX-001, RC-001 |
| `agent` | enum | `visual` \| `info-arch` \| `interaction` \| `react-code` |
| `severity` | enum | `critical` \| `major` \| `minor` \| `suggestion` |
| `category` | string | Free-form: `color-violation`, `redundant-text`, `broken-flow`, `anti-pattern`, etc. |
| `backlog` | enum | `content` \| `frontend` \| `architecture` \| `visual-assets` |
| `notionPrefix` | enum | `CB` \| `FE` \| `SYS` \| `ART` |
| `title` | string | One-line summary |
| `description` | string | Full description with reproduction steps |
| `evidence` | string? | CSS value, screenshot path, code snippet |
| `screenshot` | string? | Path: `Docs/qa/screenshots/QA-YYYY-MM-DD-NNN.png` |
| `location` | string | File path:line or UI panel name |
| `effort` | enum | `S` (<30min) \| `M` (30-120min) \| `L` (2h+) |
| `suggestedFix` | string? | How to fix it |

### Severity Guide

- **Critical:** Violates STYLE.md hard rules OR breaks core interaction flow
- **Major:** Significantly degrades UX or contradicts design intent
- **Minor:** Polish issue, no functional impact
- **Suggestion:** Improvement opportunity, not a defect

### Backlog Routing Decision Tree

Apply this tree to every finding to set `backlog` and `notionPrefix`:

```
Finding → Is it a crash, type error, or engine logic bug?
  YES → backlog: "architecture", notionPrefix: "SYS"
  NO  → Is it a STYLE.md violation, missing art, or brightness issue?
    YES → backlog: "visual-assets", notionPrefix: "ART"
    NO  → Is it repetitive text, thin content pool, or missing template?
      YES → backlog: "content", notionPrefix: "CB"
      NO  → backlog: "frontend", notionPrefix: "FE"
```

Edge case: findings spanning two backlogs get filed to whichever backlog owns the fix.

### Agent ID Prefixes

| Agent | Prefix | Example |
|-------|--------|---------|
| Visual Style | VS | VS-001, VS-002 |
| Info Architecture | IA | IA-001, IA-002 |
| Interaction | IX | IX-001, IX-002 |
| React Code | RC | RC-001, RC-002 |
```

**Step 2: Verify**

Run: `grep -c "Finding Schema" .claude/skills/qa-orchestrator/SKILL.md`
Expected: 1

**Step 3: Commit**

```bash
git add .claude/skills/qa-orchestrator/SKILL.md
git commit -m "feat(qa-skill): add finding schema with backlog routing decision tree"
```

---

### Task 6: Add Agent 1 (Visual Style) and Agent 2 (Info Architecture) Prompt Templates

**Files:**
- Modify: `.claude/skills/qa-orchestrator/SKILL.md`

**Step 1: Append Agent 1 and Agent 2 sections**

Append to the end of `.claude/skills/qa-orchestrator/SKILL.md`:

````markdown

## Agent 1: Visual Style Compliance

**Dispatch with:** `Agent` tool, `subagent_type: "general-purpose"`

**Prompt template (copy this entire block as the agent prompt):**

> You are a Visual Style Compliance auditor for The Fantasy World Simulator. Check every visible UI element against STYLE.md.
>
> **Step 1:** Read `STYLE.md` at the project root. Key rules:
> - World surfaces: 10-40% brightness (dark world aesthetic)
> - Magic elements: sphere-specific colors at 70-100% brightness, threadlike/concentrated
> - UI chrome: oklch(0.21-0.24, ...) dark range
> - Typography: system monospace for data, serif for narrative
> - No emoji where sphere-colored icons should be
> - Fog of war: unexplored=black, remembered=dim, visible=normal
>
> **Step 2:** Use Playwright MCP to play through the game:
> 1. `browser_navigate` to `http://localhost:5173`
> 2. Click through world creation to reach the main game view
> 3. `browser_take_screenshot` — full viewport
> 4. `browser_evaluate` to extract ALL computed CSS background-color, color, border-color values from visible elements. Convert each to HSL and check the L (lightness) component against STYLE.md brightness thresholds.
> 5. Screenshot individual panels for detail inspection
> 6. Advance game 10+ ticks (click Step button repeatedly), screenshot again
> 7. Check sphere icon colors match canonical sphere palette from STYLE.md
>
> **Step 3:** If `window.__DEBUG` is available, enable tracing and read traces after ticking to cross-reference visual state with engine state.
>
> **Output:** Return a JSON array of Finding objects with these fields: id (VS-NNN), agent ("visual"), severity, category, backlog, notionPrefix, title, description, evidence, screenshot, location, effort, suggestedFix. Apply the backlog routing tree: STYLE.md violations → backlog "visual-assets", notionPrefix "ART".

**Tools needed:** Playwright MCP (browser_navigate, browser_take_screenshot, browser_evaluate, browser_snapshot, browser_click)

**Expected output:** 5-15 findings, mostly critical or major.

---

## Agent 2: Information Architecture

**Dispatch with:** `Agent` tool, `subagent_type: "general-purpose"`

**Prompt template (copy this entire block as the agent prompt):**

> You are an Information Architecture auditor for The Fantasy World Simulator. Identify redundant text, dead space, information density imbalance, and wasted screen real estate.
>
> **Use Playwright MCP tools:**
> 1. Navigate to `http://localhost:5173`. If on title screen, click through creation to reach main game view.
> 2. `browser_evaluate` to run a DOM analysis that:
>    - Extracts all visible text nodes with their parent element tags and bounding rects
>    - Groups by screen zone (LEFT_SIDEBAR: x<250, TOP_BAR: y<60, CENTER_MAP: 250<x<viewport-350, RIGHT_SIDEBAR: x>viewport-350, BOTTOM: bottom 200px)
>    - Finds duplicate text strings (same text appearing 2+ times)
>    - Counts words per zone for density analysis
>    - Identifies zero-value displays ("0.0", "0%", "N/A", "0")
> 3. Check heading hierarchy: are H1→H2→H3 properly nested?
> 4. Advance game 10+ ticks, re-run analysis. Do densities improve with progression?
> 5. Check the right sidebar — is it populated or empty when no agent is selected?
> 6. Check the narrative log — how many items? Are they repetitive?
>
> **Output:** Return a JSON array of Finding objects with: id (IA-NNN), agent ("info-arch"), severity, category, backlog, notionPrefix, title, description, evidence, location, effort, suggestedFix. Most info-arch findings route to backlog "frontend", notionPrefix "FE". Repetitive content routes to backlog "content", notionPrefix "CB".

**Tools needed:** Playwright MCP (browser_evaluate, browser_snapshot, browser_click)

**Expected output:** 3-8 findings, mostly major.
````

**Step 2: Verify**

Run: `grep -c "^## Agent" .claude/skills/qa-orchestrator/SKILL.md`
Expected: 2

**Step 3: Commit**

```bash
git add .claude/skills/qa-orchestrator/SKILL.md
git commit -m "feat(qa-skill): add Agent 1 (visual style) and Agent 2 (info arch) prompt templates"
```

---

### Task 7: Add Agent 3 (Interaction) and Agent 4 (React Code) Prompt Templates

**Files:**
- Modify: `.claude/skills/qa-orchestrator/SKILL.md`

**Step 1: Append Agent 3 and Agent 4 sections**

Append to the end of `.claude/skills/qa-orchestrator/SKILL.md`:

````markdown

## Agent 3: Interaction & State

**Dispatch with:** `Agent` tool, `subagent_type: "general-purpose"`

**Prompt template (copy this entire block as the agent prompt):**

> You are an Interaction & State auditor for The Fantasy World Simulator. Click through every interactive flow and verify correct state transitions, overlay behavior, and user feedback.
>
> **Use Playwright MCP to systematically test each flow:**
>
> 1. **World Creation:** Navigate to `http://localhost:5173`. Select spheres, confirm creation, verify game starts. Screenshot each step.
>
> 2. **Tick Progression:** Click "Step" button 5+ times. Verify: narrative log updates, doom bar moves, essence values change. Screenshot before/after.
>
> 3. **Retinue Panel:** Click an agent name in left sidebar → right panel should show AgentInfoCard. Click different agent → panel updates. Screenshot.
>
> 4. **Action Drawer:** Click "Actions" in AvatarHUD → bottom drawer should appear with ActionCards. Click an ActionCard → InterventionConfirm should appear. Cancel → drawer closes. Screenshot each state.
>
> 5. **Scry Overlay:** Click "Scry" button → full-screen overlay. Interact with court positions. Close overlay → verify assignments persist. Screenshot.
>
> 6. **Hex Zoom:** Click a hex tile → HexZoomView with locations. Click a location → LocationView detail. Use breadcrumb to navigate back. Verify view state machine: world ↔ hex-zoom ↔ location. Screenshot.
>
> 7. **Avatar Movement:** Click "Move" in AvatarHUD → click a hex → avatar should move. Verify fog of war updates around new position. Screenshot.
>
> 8. **Mandate Tracker:** Click mandate bar → popover with progress details. Close popover. Screenshot.
>
> 9. **Debug Panel:** Press backtick key → debug drawer opens. Verify traces appear. Toggle category filters. Close panel. Screenshot.
>
> 10. **Edge Cases:** Double-click buttons rapidly. Open overlay, click outside → should close. Try opening two overlays simultaneously (should not stack). Click disabled/unavailable actions.
>
> **For each test:** `browser_snapshot` to verify DOM state, `browser_take_screenshot` for visual evidence.
>
> **Output:** Return a JSON array of Finding objects with: id (IX-NNN), agent ("interaction"), severity, category, backlog, notionPrefix, title, description, evidence, screenshot, location, effort, suggestedFix. Broken flows → severity critical. Missing feedback → major. Edge cases → minor. Most route to backlog "frontend", notionPrefix "FE".

**Tools needed:** Playwright MCP (full set — navigate, click, snapshot, screenshot, evaluate, wait_for)

**Expected output:** 5-20 findings depending on current state.

---

## Agent 4: React Code Quality

**Dispatch with:** `Agent` tool, `subagent_type: "general-purpose"`

**Prompt template (copy this entire block as the agent prompt):**

> You are a React Code Quality auditor for The Fantasy World Simulator. Analyze React components for anti-patterns, performance issues, and accessibility gaps. This is static code analysis — no browser needed.
>
> **Scan all `.tsx` files in `src/components/`:**
>
> 1. **Performance Anti-Patterns:**
>    - Inline object/array creation in JSX (`style={{...}}`, `options={[...]}`) — causes unnecessary re-renders
>    - Missing `useCallback`/`useMemo` for functions/values passed as props to memoized children
>    - Large components (>300 lines) that should be split
>    - Missing `React.memo` on pure presentational components that receive complex props
>
> 2. **Accessibility:**
>    - Interactive elements without `aria-label` or accessible text
>    - Click handlers on non-semantic elements (div, span) without `role="button"` and keyboard support
>    - Missing keyboard navigation (Enter/Space on interactive elements)
>    - Images without alt text
>
> 3. **Code Hygiene:**
>    - `console.log`/`console.warn` left in component code (not in engine/test code)
>    - Unused imports
>    - Hardcoded magic numbers (violates project priority #1: tunability — every magic number should be a named constant)
>
> 4. **Error Handling:**
>    - Missing error boundaries around component subtrees
>    - Components that crash on undefined/null data instead of showing empty states
>
> **Key files to prioritize:** GameView.tsx, ActionDrawer.tsx, ActionCard.tsx, NarrativeLog.tsx, RetinuePanel.tsx, AgentInfoCard.tsx, AgentProfileModal.tsx, HexZoomView.tsx, LocationView.tsx, EncounterLog.tsx, InterventionConfirm.tsx, ScryOverlay.tsx, DebugPanel.tsx, DoomBar.tsx, MandateTracker.tsx, AvatarHUD.tsx, HexTile.tsx, HexMap.tsx, CoastlineOverlay.tsx, AgendaPicker.tsx, Tooltip.tsx
>
> **Output:** Return a JSON array of Finding objects with: id (RC-NNN), agent ("react-code"), severity, category, backlog, notionPrefix, title, description, evidence (include code snippet), location (file:line), effort, suggestedFix (include corrected code). Performance in hot paths → major. Style issues → minor. All route to backlog "frontend", notionPrefix "FE" unless it's an engine bug (→ "architecture", "SYS").

**Tools needed:** File system only (Read, Grep, Glob) — no browser.

**Expected output:** 10-30 findings, mostly minor or suggestion.
````

**Step 2: Verify all 4 agents present**

Run: `grep -c "^## Agent" .claude/skills/qa-orchestrator/SKILL.md`
Expected: 4

**Step 3: Commit**

```bash
git add .claude/skills/qa-orchestrator/SKILL.md
git commit -m "feat(qa-skill): add Agent 3 (interaction) and Agent 4 (react code) prompt templates"
```

---

### Task 8: Add Orchestrator Checklist, Mode 2, and Mode 3 Sections

**Files:**
- Modify: `.claude/skills/qa-orchestrator/SKILL.md`

**Step 1: Append orchestrator checklist and mode-specific instructions**

Append to the end of `.claude/skills/qa-orchestrator/SKILL.md`:

````markdown

## Orchestrator Checklist (Mode 1 — Interactive Playtest)

**IMPORTANT: Create a TodoWrite todo for EACH numbered step.**

This is the rigid flow for a full QA sweep. Do not skip steps. Do not reorder.

### Phase 1: Setup

1. Read this skill file fully
2. Read `STYLE.md` for current visual spec
3. Pre-flight: `browser_navigate` to `http://localhost:5173` — must load. Test Notion MCP responds.
4. Initialize findings collection

### Phase 2: Agent Dispatch (Sequential)

5. **Dispatch Agent 1** (Visual Style) — use the prompt template above. Collect returned findings.
6. **Dispatch Agent 2** (Info Architecture) — use the prompt template above. Collect returned findings.
7. **Dispatch Agent 3** (Interaction & State) — use the prompt template above. Collect returned findings.
8. **Dispatch Agent 4** (React Code Quality) — use the prompt template above. Collect returned findings.

**Why sequential:** Playwright MCP controls a single browser. Parallel agents would conflict. Later agents also benefit from the game state left by earlier agents.

### Phase 3: Merge & Report

9. **Deduplicate:** Same UI element + same issue → merge, keep the more detailed description. Cross-agent links: if Agent 1 flags a color and Agent 4 finds the hardcoded value → reference both.
10. **Route:** Apply the Backlog Routing Decision Tree to every finding.
11. **Sort:** Primary: severity (critical→suggestion). Secondary: effort (S→L).
12. **Present:** Show summary to user — "QA sweep found N findings: X critical, Y major, Z minor, W suggestions". Table format with ID, severity, title, effort, backlog. Ask: "Which findings should I add to the Notion backlog? (all / critical+major / select specific IDs)"

### Phase 4: Backlog Integration

13. **Notion:** Add user-approved findings to the Development Backlog at `https://www.notion.so/Development-Backlog-3182b241dfb081b9af78c279eef405cf`. Create a section "QA Findings [YYYY-MM-DD]" with a table: ID, Severity, Category, Title, Effort, Status (default: "To Fix").
14. **Save raw JSON:** Write all findings to `Docs/qa/YYYY-MM-DD-qa-findings.json` for future diffing.

---

## Mode 2: Headless Sweep

No browser needed. Run these CLI checks and parse output for failures:

1. `npm test` — vitest suite. Parse for FAIL lines.
2. `npx tsc --noEmit` — type checking. Parse for error lines.
3. `npm run validate-model` — world model integrity. Parse for validation failures.
4. If playtest runner is available: `npm run playtest -- --seeds 1,42,100,999 --ticks 100` — multi-seed stability. Parse for anomalies (doom stall, zero dilemmas, population collapse).

**Output:** Summarize results. Any failures become findings with:
- Test failures → agent "react-code", backlog "architecture", notionPrefix "SYS"
- Type errors → agent "react-code", backlog "architecture", notionPrefix "SYS"
- Model validation errors → agent "info-arch", backlog "content", notionPrefix "CB"
- Playtest anomalies → agent "interaction", backlog "architecture", notionPrefix "SYS"

Then proceed to Phase 3 (Merge & Report) and Phase 4 (Backlog Integration) from the Mode 1 checklist.

---

## Mode 3: Targeted Audit

User specifies which system to audit (e.g., "audit encounters", "check the hex map", "review accessibility").

1. Determine which agent(s) are relevant:
   - Visual issue → Agent 1 only
   - Layout/density issue → Agent 2 only
   - Interaction/flow issue → Agent 3 only
   - Code quality issue → Agent 4 only
   - Multiple concerns → dispatch relevant subset sequentially

2. Narrow the agent prompt to focus on the specified system. For example, if auditing encounters:
   - Agent 3 prompt focuses on EncounterLog, encounter lifecycle, threat badges
   - Agent 4 prompt focuses on EncounterLog.tsx, encounter-content.ts

3. Proceed to Phase 3 and Phase 4 from the Mode 1 checklist.

---

## Tracing Integration (Mode 1 and 3)

If the game is running in dev mode, `window.__DEBUG` exposes engine trace access:

```javascript
// In Playwright browser_evaluate:
await window.__DEBUG.enableTracing();
// ... advance ticks ...
const traces = await window.__DEBUG.getTraces();
```

**Use traces to:**
- Verify engine behavior matches UI display (e.g., doom bar visual matches trace doom stage)
- Check trace counts per category ("are dilemmas firing? are encounters progressing?")
- Follow specific agents through their decision pipeline
- Detect zero-activity anomalies (no traces for a category = system might be broken)

**Fallback (no bridge):** Click the Debug button via Playwright to enable tracing visually, then read trace entries from the Debug Panel DOM.

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Running agents in parallel | Playwright MCP is single-browser. Run sequentially. |
| Skipping pre-flight checks | Agent 1 will fail if dev server isn't running |
| Fixing during sweep | Collect first, fix later. Changing code mid-sweep invalidates later agents. |
| Not saving raw JSON | You lose the ability to diff between QA runs |
| Merging all findings to Notion without asking | Ask user first — they may want to defer suggestions |
| Forgetting backlog routing | Every finding needs `backlog` and `notionPrefix` fields |

## When NOT to Use This Skill

- During active implementation (game state unstable)
- For engine-only changes (use unit tests, not browser QA)
- For content/narrative quality review (different concern — use prose skills)
- Without the dev server running (Agents 1-3 need the browser)
````

**Step 2: Verify completeness**

Run: `grep -c "^##" .claude/skills/qa-orchestrator/SKILL.md`
Expected: 12+ section headers (Mode Selection, Prerequisites x3, Finding Schema, Agent 1-4, Orchestrator Checklist, Mode 2, Mode 3, Tracing, Common Mistakes, When NOT)

**Step 3: Commit**

```bash
git add .claude/skills/qa-orchestrator/SKILL.md
git commit -m "feat(qa-skill): add orchestrator checklist, Mode 2/3, tracing integration, common mistakes"
```

---

### Task 9: Run Full Test Suite and Type Check

**Files:**
- No changes — verification only

**Step 1: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 2: Run all tests**

Run: `npx vitest run --reporter=verbose`
Expected: All tests pass, including new DebugPanel trace refresh test and debug-bridge contract test.

**Step 3: If any failures, fix them before proceeding**

---

### Task 10: Update Documentation

**Files:**
- Modify: `Docs/project-status.md`
- Modify: `Docs/changelog.md`

**Step 1: Add project-status entry**

Append before the "Current phase" line in `Docs/project-status.md`:

```
- QA Implementation: ✅ Complete — DebugPanel stale trace bug fixed (useMemo dep array), window.__DEBUG bridge (dev-only Playwright access to traceBuffer), qa-orchestrator skill (3 modes: interactive playtest with 4 sequential agents, headless sweep, targeted audit; reconciled finding schema with backlog routing CB/FE/SYS/ART; 14-step orchestrator checklist; tracing integration). 2 bug/feature code changes, 2 new tests, 1 skill file (~350 lines). Design doc + implementation plan in Docs/plans/
```

Update the "Current phase" line:

```
- Current phase: **QA Implementation complete** — check Notion backlog for next priority
```

**Step 2: Add changelog entries**

Prepend to the "Recent Changes" table in `Docs/changelog.md`:

```
| 2026-03-10 | Repo: DebugPanel.tsx | Fixed useMemo empty dep array → traces now refresh on tick change | Stale traces on mount prevented runtime debugging |
| 2026-03-10 | Repo: debug-bridge.ts + main.tsx | Added window.__DEBUG dev-only bridge exposing traceBuffer functions | Playwright QA agents need programmatic access to engine traces |
| 2026-03-10 | .claude/skills/qa-orchestrator/ | Created qa-orchestrator skill — 3 modes, 4 agents, backlog routing, 14-step checklist | Repeatable systematic QA sweeps with structured findings |
```

**Step 3: Commit**

```bash
git add Docs/project-status.md Docs/changelog.md
git commit -m "docs: update project status and changelog for QA implementation"
```
