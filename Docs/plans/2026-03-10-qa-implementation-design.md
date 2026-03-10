# QA Implementation — Unified Design

**Date:** 2026-03-10
**Status:** Approved
**Supersedes:** 2026-03-07-qa-orchestrator-design.md (agent specs), 2026-03-10-qa-test-strategy.md (modes + tracing)
**Scope:** DebugPanel bug fix, window.__DEBUG bridge, qa-orchestrator skill (3 modes, 4 agents, backlog routing)

---

## 1. Deliverables

| # | Deliverable | Type | Effort |
|---|-------------|------|--------|
| 1 | Fix DebugPanel stale trace bug | Code fix | S |
| 2 | `window.__DEBUG` bridge | Code (dev-only) | S |
| 3 | qa-orchestrator skill file | Skill (SKILL.md) | M |
| 4 | DebugPanel fix test | Test | S |
| 5 | Debug bridge test | Test | S |
| 6 | Documentation updates | Docs | S |

## 2. DebugPanel Bug Fix

**File:** `src/components/Game/DebugPanel.tsx` ~line 676
**Bug:** `useMemo(() => getTraces(), [])` — empty dep array means traces read once on mount, never refreshed.
**Fix:** `useMemo(() => getTraces(), [currentTick])`

This is a 1-line change. The `currentTick` prop already exists on the component — it just isn't in the dependency array.

## 3. window.__DEBUG Bridge

**File:** `src/main.tsx` (or new `src/debug-bridge.ts` imported by main.tsx)
**Purpose:** Expose engine internals to Playwright in dev mode for programmatic QA.

```typescript
// dev-only, tree-shaken in production
if (import.meta.env.DEV) {
  (window as any).__DEBUG = {
    getTraces: () => import('./engine/traceBuffer').then(m => m.getTraces()),
    enableTracing: () => import('./engine/traceBuffer').then(m => m.enableTracing()),
    disableTracing: () => import('./engine/traceBuffer').then(m => m.disableTracing()),
    isTracingEnabled: () => import('./engine/traceBuffer').then(m => m.isTracingEnabled()),
    clearTraces: () => import('./engine/traceBuffer').then(m => m.clearTraces()),
  };
}
```

**Design decisions:**
- Lazy imports via `import()` so the bridge doesn't enlarge the main bundle
- Only exposed in DEV mode — `import.meta.env.DEV` is statically replaced by Vite, so production builds tree-shake this entirely
- No GameState exposure in v1 — traces alone give the QA skill enough insight. GameState can be added later if needed via a React ref callback
- Separate file (`src/debug-bridge.ts`) keeps main.tsx clean

**Type safety:** Add a global declaration in `src/vite-env.d.ts` or a new `src/debug-bridge.d.ts`:

```typescript
interface DebugBridge {
  getTraces: () => Promise<ReadonlyArray<import('./engine/traceBuffer').TraceEntry>>;
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

## 4. qa-orchestrator Skill

### 4.1 Skill Location

`.claude/skills/qa-orchestrator/SKILL.md` — follows the project's skill directory convention.

### 4.2 Three Modes

The skill supports three invocation modes. The orchestrator selects based on user request or defaults to Mode 1.

| Mode | Name | Browser? | Agents | When to use |
|------|------|----------|--------|-------------|
| 1 | Interactive Playtest | Yes (Playwright) | All 4 sequential | Full QA sweep, "run QA", after major phases |
| 2 | Headless Sweep | No | None (CLI tools) | Quick regression check, CI-like validation |
| 3 | Targeted Audit | Maybe | 1-2 relevant | Deep-dive on specific system ("audit encounters") |

**Mode 1 — Interactive Playtest:**
Dispatches 4 specialist agents sequentially (Playwright single-browser constraint). Full game playthrough from world creation to endgame. Screenshots + trace analysis at each step.

**Mode 2 — Headless Sweep:**
Runs `npm test`, `npx tsc --noEmit`, playtest runner (multi-seed), `npm run validate-model`. Parses output for failures/warnings/anomalies. No browser needed.

**Mode 3 — Targeted Audit:**
User specifies a system (e.g., "audit the encounter system"). Orchestrator dispatches only the relevant agents with narrowed scope. May or may not need browser.

### 4.3 Four Specialist Agents (Mode 1)

Sequential dispatch order matters — later agents build on earlier context.

| # | Agent | Prefix | Tools | Focus |
|---|-------|--------|-------|-------|
| 1 | Visual Style | VS- | Playwright | STYLE.md compliance, brightness, sphere colors, typography |
| 2 | Information Architecture | IA- | Playwright | Redundant text, dead space, density imbalance, zero-values |
| 3 | Interaction & State | IX- | Playwright | Click flows, overlays, state transitions, edge cases |
| 4 | React Code Quality | RC- | File system | Anti-patterns, perf, accessibility, code hygiene |

Agent prompt templates are taken directly from the 03-07 design doc (Tasks 4-7 of the implementation plan). They are comprehensive and proven in prior QA sweeps.

### 4.4 Finding Schema (Reconciled)

Merges the 03-07 agent-centric schema with the 03-10 backlog routing:

```typescript
interface Finding {
  // Identity
  id: string;              // Agent prefix: "VS-001", "IA-003", "IX-007", "RC-012"
  agent: "visual" | "info-arch" | "interaction" | "react-code";

  // Classification
  severity: "critical" | "major" | "minor" | "suggestion";
  category: string;        // e.g., "color-violation", "redundant-text", "broken-flow"

  // Backlog routing (from 03-10 strategy)
  backlog: "content" | "frontend" | "architecture" | "visual-assets";
  notionPrefix: "CB" | "FE" | "SYS" | "ART";

  // Description
  title: string;
  description: string;
  evidence?: string;       // CSS value, screenshot path, code snippet
  screenshot?: string;     // Path: Docs/qa/screenshots/QA-YYYY-MM-DD-NNN.png
  location: string;        // File path:line or UI panel name

  // Triage
  effort: "S" | "M" | "L";
  suggestedFix?: string;
}
```

### 4.5 Backlog Routing Decision Tree

Each finding gets a `backlog` + `notionPrefix` field based on this tree:

```
Finding → Is it a crash, type error, or engine logic bug?
  YES → architecture (SYS-xxx)
  NO  → Is it a STYLE.md violation, missing art, or brightness issue?
    YES → visual-assets (ART-xx)
    NO  → Is it repetitive text, thin pool, or missing template?
      YES → content (CB-xxx)
      NO  → frontend (FE-xx)
```

Edge case: findings spanning two backlogs get filed to whichever backlog owns the fix.

### 4.6 Orchestrator Flow

14-step checklist (rigid — do not skip or reorder):

**Phase 1: Setup**
1. Read skill file + STYLE.md
2. Pre-flight: verify dev server (Mode 1/3), Playwright MCP, Notion MCP
3. Initialize findings collection

**Phase 2: Agent Dispatch (Mode 1) / CLI Checks (Mode 2) / Targeted (Mode 3)**
4-7. Dispatch agents sequentially (Mode 1), or run CLI tools (Mode 2), or dispatch relevant subset (Mode 3)

**Phase 3: Merge & Report**
8. Deduplicate findings (same element + same issue → merge)
9. Apply backlog routing tree to each finding
10. Sort: severity (critical→suggestion), then effort (S→L)
11. Present prioritized report to user

**Phase 4: Backlog Integration**
12. User selects which findings to add to Notion
13. Add to correct Notion backlog section with next available ID
14. Save raw findings JSON to `Docs/qa/YYYY-MM-DD-qa-findings.json`

### 4.7 Tracing Integration

If `window.__DEBUG` is available (Mode 1):
1. Enable tracing: `page.evaluate(() => window.__DEBUG.enableTracing())`
2. After each tick step, read traces: `page.evaluate(() => window.__DEBUG.getTraces())`
3. Analyze: expected trace categories present, counts reasonable, agent IDs valid
4. Cross-reference UI state vs engine trace reality

Fallback (no bridge): Click Debug button via Playwright, read trace DOM entries.

## 5. What This Design Does NOT Include

- **Playwright test suite** — this is a skill (teaches Claude how to QA), not a test framework
- **Visual regression snapshots** — future enhancement, not v1
- **CI integration** — Mode 2 (headless sweep) is run manually by Claude, not in a pipeline
- **GameState exposure via __DEBUG** — traces suffice for v1; GameState ref can be added later
- **Auto-fix** — collect first, fix later; user controls priority

## 6. Test Coverage

| Test | What it verifies |
|------|-----------------|
| DebugPanel dep fix | Traces refresh when currentTick changes |
| Debug bridge existence | `window.__DEBUG` defined in dev mode |
| Debug bridge methods | Each method resolves and returns expected types |
| Bridge absent in prod | `import.meta.env.DEV` gating works |

## 7. Files Changed/Created

| Action | File |
|--------|------|
| Fix | `src/components/Game/DebugPanel.tsx` (~line 676) |
| Create | `src/debug-bridge.ts` |
| Modify | `src/main.tsx` (import debug bridge) |
| Create | `src/debug-bridge.d.ts` (global type declaration) |
| Create | `.claude/skills/qa-orchestrator/SKILL.md` |
| Create | `src/components/Game/__tests__/DebugPanel-trace-refresh.test.tsx` |
| Create | `src/__tests__/debug-bridge.test.ts` |
| Modify | `Docs/project-status.md` |
| Modify | `Docs/changelog.md` |
