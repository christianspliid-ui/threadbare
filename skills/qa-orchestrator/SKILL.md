---
name: qa-orchestrator
description: Use when running a QA sweep of The Fantasy World Simulator UI. Trigger on "run QA", "check the UI", "visual audit", "find UI bugs", "frontend QA", or after completing a major implementation phase. Dispatches 4 specialist sub-agents sequentially for visual style, information architecture, interaction flows, and React code quality.
---

# QA Orchestrator

## Overview

Dispatches 4 specialist sub-agents **sequentially** to audit The Fantasy World Simulator's UI against STYLE.md, check for redundant information, test interaction flows, and scan React code for anti-patterns. Each agent produces structured findings. The orchestrator merges, deduplicates, and presents a prioritized report.

Sequential dispatch is required because Playwright MCP controls a single browser instance — parallel agents would conflict.

## Prerequisites

Before running this skill, verify:

1. **Dev server running** — `npm run dev` must be active on the user's machine at `http://localhost:5173`
2. **STYLE.md exists** — visual style reference at project root
3. **Playwright MCP connected** — browser tools (`browser_navigate`, `browser_take_screenshot`, etc.) must respond
4. **Notion MCP connected** — for writing findings to the Development Backlog

**Pre-flight check sequence:**
1. `browser_navigate` to `http://localhost:5173` — page must load
2. Read `STYLE.md` — must contain color definitions
3. Test Notion search for "Development Backlog" — must find the page

If any prerequisite fails, stop and inform the user what's missing.

## Finding Schema

Every agent produces findings in this format. Use this exact structure so the orchestrator can merge and deduplicate.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Prefix by agent: VS-001, IA-001, IX-001, RC-001 |
| `agent` | enum | `visual` \| `info-arch` \| `interaction` \| `react-code` |
| `severity` | enum | `critical` \| `major` \| `minor` \| `suggestion` |
| `category` | string | e.g., `color-violation`, `redundant-text`, `broken-flow`, `anti-pattern` |
| `title` | string | One-line summary |
| `description` | string | What's wrong, with evidence |
| `evidence` | string? | CSS value, screenshot ref, code snippet |
| `location` | string | File path or UI panel name |
| `effort` | enum | `S` (<30min) \| `M` (30-120min) \| `L` (2h+) |
| `suggestedFix` | string? | How to fix it |

### Severity Guide

- **Critical:** Violates STYLE.md hard rules OR breaks core interaction flow
- **Major:** Significantly degrades UX or contradicts design intent
- **Minor:** Polish issue, no functional impact
- **Suggestion:** Improvement opportunity, not a defect

### Agent ID Prefixes

| Agent | Prefix | Example |
|-------|--------|---------|
| Visual Style | VS | VS-001, VS-002 |
| Info Architecture | IA | IA-001, IA-002 |
| Interaction | IX | IX-001, IX-002 |
| React Code | RC | RC-001, RC-002 |

## Agent 1: Visual Style Compliance

**Dispatch with:** `Agent` tool, `subagent_type: "general-purpose"`

**Prompt template:**

> You are a Visual Style Compliance auditor for The Fantasy World Simulator. Your job is to check every visible UI element against the game's STYLE.md specification.
>
> **First:** Read STYLE.md at the project root for the full color/typography/brightness spec. Key rules:
> - World surfaces: 10-40% brightness (dark world aesthetic)
> - Magic elements: sphere-specific colors at 70-100% brightness, threadlike/concentrated
> - UI chrome: oklch(0.21-0.24, ...) dark range
> - Typography: system monospace for data, serif for narrative
> - No emoji where sphere-colored icons should be
> - Threadlike decorative elements (thin lines, not broad glows)
>
> **Then:** Use Playwright MCP tools to:
> 1. Navigate to http://localhost:5173
> 2. Click through world creation (select spheres, confirm) to reach the main game view
> 3. Take a full viewport screenshot
> 4. Extract ALL CSS background-color, color, border-color values via browser_evaluate
> 5. Compute brightness for each color value (convert to HSL, check L component)
> 6. Compare against STYLE.md thresholds
> 7. Screenshot individual panels for detail inspection
> 8. Advance game 10+ ticks (click Play, wait, click Pause), screenshot again
>
> **Output:** Return a JSON array of Finding objects with these fields: id (VS-NNN), agent ("visual"), severity, category, title, description, evidence (actual CSS values), location (UI panel or selector), effort (S/M/L), suggestedFix.
>
> Severity guide: critical = violates hard brightness/color rules; major = typography/icon issues; minor = polish.
>
> **Known issues from previous audits:** The hex map SVG background was rgb(244, 232, 193) at ~88% brightness — this is a critical violation. Check if this has been fixed.

**Tools needed:** Playwright MCP (browser_navigate, browser_take_screenshot, browser_evaluate, browser_snapshot, browser_click)

**Expected output:** 5-15 findings, mostly severity critical or major.

## Agent 2: Information Architecture

**Dispatch with:** `Agent` tool, `subagent_type: "general-purpose"`

**Prompt template:**

> You are an Information Architecture auditor for The Fantasy World Simulator. Your job is to identify redundant text, dead space, information density imbalance, and wasted screen real estate.
>
> **Use Playwright MCP tools to:**
> 1. Navigate to http://localhost:5173 (game should already be running from Agent 1)
> 2. If on title screen, click through creation flow to reach main game view
> 3. Run a DOM analysis via browser_evaluate that:
>    - Extracts all visible text nodes with their parent element tags and screen positions
>    - Groups text by screen zone (LEFT_SIDEBAR: x<250, TOP_BAR: y<60, CENTER_MAP: 250<x<viewport-350, RIGHT_SIDEBAR: x>viewport-350, NARRATIVE_FEED: bottom 200px)
>    - Finds duplicate text strings (same text appearing 2+ times)
>    - Counts words per zone for density analysis
>    - Identifies zero-value displays ("0.0", "0%", "N/A")
> 4. Advance game 10+ ticks if not already advanced
> 5. Re-run analysis to see if densities improve with game progression
> 6. Check heading hierarchy (H1→H2→H3 nesting)
> 7. Measure the right sidebar — is it populated or empty?
>
> **Output:** Return a JSON array of Finding objects with fields: id (IA-NNN), agent ("info-arch"), severity, category, title, description, evidence (duplicate strings and positions), location (screen zones), effort, suggestedFix.
>
> Severity guide: major = redundant critical information or large dead zones; minor = zero-values or slight imbalance.
>
> **Known issues from previous audits:** "The Hollow King" appeared in 3 places (sidebar, HUD, narrative), "Hostility" was repeated 3x identically, right sidebar was empty when no agent selected, narrative feed had 47 items with repetitive content.

**Tools needed:** Playwright MCP (browser_evaluate, browser_snapshot, browser_click)

**Expected output:** 3-8 findings, mostly severity major.

## Agent 3: Interaction & State

**Dispatch with:** `Agent` tool, `subagent_type: "general-purpose"`

**Prompt template:**

> You are an Interaction & State auditor for The Fantasy World Simulator. Your job is to click through every interactive flow and verify correct state transitions, overlay behavior, and user feedback.
>
> **Use Playwright MCP tools to systematically test each flow:**
>
> 1. **World Creation Flow:** Navigate to http://localhost:5173. Select spheres, confirm creation, verify game starts. Screenshot each step.
>
> 2. **Retinue Panel (left sidebar):** Click an agent name → right sidebar should populate with AgentDetailPanel. Click a different agent → sidebar updates. Click same agent again → document behavior.
>
> 3. **Agent Wheel:** Select an agent, click "Wheel" button in AvatarHUD. Verify wheel overlay appears with action slots. Click a slot → InterventionConfirm popover should appear. Confirm → essence deducted, narrative event appears. Cancel → popover closes, no state change.
>
> 4. **Scry Overlay:** Click "Scry" button → full-screen overlay with court positions. Assign an agent to a position. Close overlay → assignments persist.
>
> 5. **Hex Zoom:** Click a hex tile → HexZoomView with locations. Click a location → LocationView detail. Use breadcrumb to navigate back. Verify: world ↔ hex-zoom ↔ location.
>
> 6. **Avatar Movement:** Click "Move" in AvatarHUD → click a hex → avatar moves. Verify fog of war updates.
>
> 7. **Mandate Tracker:** Click mandate bar → popover with progress. Close popover.
>
> 8. **Edge Cases:** Double-click rapidly. Click outside overlay → should close. Try to open two overlays simultaneously. Click disabled actions.
>
> **For each test:** Screenshot before and after. Use browser_snapshot to verify DOM state.
>
> **Output:** Return a JSON array of Finding objects with fields: id (IX-NNN), agent ("interaction"), severity, category, title, description, evidence (expected vs actual behavior), location (component/flow name), effort, suggestedFix.
>
> Severity guide: critical = broken flow (can't complete action); major = missing feedback or wrong state; minor = edge case polish.

**Tools needed:** Playwright MCP (full set — navigate, click, snapshot, screenshot, evaluate, wait_for)

**Expected output:** 5-20 findings.

## Agent 4: React Code Quality

**Dispatch with:** `Agent` tool, `subagent_type: "general-purpose"`

**Prompt template:**

> You are a React Code Quality auditor for The Fantasy World Simulator. Analyze React components for anti-patterns, performance issues, and accessibility gaps. No browser needed — static code analysis only.
>
> **REQUIRED BACKGROUND:** Read the react-best-practices skill first for performance guidelines.
>
> **Scan all .tsx files in src/components/ for:**
>
> 1. **Performance:** Inline object/array creation in JSX, missing useCallback/useMemo for prop-passed functions, large components (>300 lines), missing React.memo on presentational components.
>
> 2. **Prop Drilling:** Props passed >3 levels deep (suggests context needed).
>
> 3. **Accessibility:** Interactive elements without ARIA labels, click handlers on non-button elements without role="button", missing keyboard navigation.
>
> 4. **Code Hygiene:** Console.log left in components, unused imports, hardcoded magic numbers (project priority #1 is tunability — every magic number should be a named constant), inconsistent naming.
>
> 5. **Error Handling:** Missing error boundaries, unhandled promise rejections, missing loading/empty states.
>
> **Key files:** GameView.tsx, RetinuePanel.tsx, AgentWheel.tsx, StrandView.tsx, InterventionConfirm.tsx, ScryOverlay.tsx, HexZoomView.tsx, LocationView.tsx, HexBreadcrumb.tsx, AgentDetailPanel.tsx, MandateTracker.tsx, DoomBar.tsx, AvatarHUD.tsx, NarrativeFeed.tsx, RivalPanel.tsx, HexTile.tsx, HexMap.tsx
>
> **Output:** Return a JSON array of Finding objects with fields: id (RC-NNN), agent ("react-code"), severity, category, title, description, evidence (code snippet + file:line), location (exact file path), effort, suggestedFix (corrected code pattern).
>
> Severity guide: major = performance in hot paths or accessibility blockers; minor = style/hygiene; suggestion = optimization opportunities.

**Tools needed:** File system only (Read, Grep, Glob).

**Expected output:** 10-30 findings, mostly minor or suggestion.

## Orchestrator Checklist

**IMPORTANT: Use TodoWrite to create todos for EACH numbered step below.**

This is the rigid flow the orchestrator (you) follows when running a QA sweep. Do not skip steps. Do not reorder.

### Phase 1: Setup

- [ ] **Step 1:** Read this skill file fully before starting
- [ ] **Step 2:** Read STYLE.md for current visual spec
- [ ] **Step 3:** Pre-flight checks — verify dev server, Playwright MCP, Notion MCP all respond
- [ ] **Step 4:** Create a timestamped findings collection: `findings_YYYY-MM-DD = []`

### Phase 2: Agent Dispatch (Sequential)

- [ ] **Step 5:** Dispatch Agent 1 (Visual Style Compliance) — collect findings, log count
- [ ] **Step 6:** Dispatch Agent 2 (Information Architecture) — collect findings, log count
- [ ] **Step 7:** Dispatch Agent 3 (Interaction & State) — collect findings, log count
- [ ] **Step 8:** Dispatch Agent 4 (React Code Quality) — collect findings, log count

### Phase 3: Merge & Report

- [ ] **Step 9:** Deduplicate findings
  - Same UI element + same issue → merge, keep more detailed description
  - Related issues → group under parent finding
  - Cross-agent links: visual color flag + code hardcoded value → reference both

- [ ] **Step 10:** Sort: severity (critical→suggestion), then effort (S→L). Group by agent.

- [ ] **Step 11:** Present prioritized report
  - Summary line: "QA sweep found N findings: X critical, Y major, Z minor, W suggestions"
  - Table: ID | Severity | Title | Effort | Location
  - Ask: "Which findings should I add to the Notion backlog? (all / critical+major / specific IDs)"

### Phase 4: Backlog Integration

- [ ] **Step 12:** Add approved findings to Notion Development Backlog
  - Fetch the backlog page
  - Insert section: "QA Findings [YYYY-MM-DD]"
  - Table with: ID, Severity, Category, Title, Effort, Status ("To Fix")

- [ ] **Step 13:** (Optional) Dispatch fix agents if user requests immediate fixes

### Phase 5: Archive

- [ ] **Step 14:** Save raw findings JSON to `Docs/qa/YYYY-MM-DD-qa-findings.json`

## Notion Integration

The Development Backlog is at:
`https://www.notion.so/Development-Backlog-3182b241dfb081b9af78c279eef405cf`

**Adding findings:** Use the Notion MCP tools:
1. `notion-fetch` the backlog page to get current content
2. `notion-update-page` with `insert_content_after` to add a new section after existing content
3. Format as markdown table:

```
## QA Findings [YYYY-MM-DD]

| ID | Severity | Category | Title | Effort | Status |
|----|----------|----------|-------|--------|--------|
| VS-001 | Critical | color-violation | Hex map background too bright | S | To Fix |
```

**Status flow:** To Fix → In Progress → Fixed → Verified

## Fix Agent Dispatch

When the user approves fixes, create fix agents with this prompt pattern:

> You are fixing a QA finding for The Fantasy World Simulator.
>
> **Finding:** [paste full finding object]
>
> **Instructions:**
> 1. Read the file at [location]
> 2. Apply the suggested fix: [suggestedFix]
> 3. Run `npm test` to ensure no regressions
> 4. If tests fail, investigate without changing the fix intent
>
> Do not change anything unrelated to this finding.

Group related findings into a single fix agent when they share a file.

## When NOT to Use

- During active development (game state unstable)
- Without the dev server running (Agents 1-3 need the browser)
- For backend/engine-only changes (use unit tests instead)
- For content review (narrative quality, world-model data)

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Running agents in parallel | Playwright MCP is single-browser. Run sequentially. |
| Skipping pre-flight checks | Agent 1 fails silently if dev server isn't running |
| Fixing during sweep | Collect first, fix later. Mid-sweep changes invalidate later agents. |
| Not saving raw JSON | Lose ability to diff between QA runs |
| Merging all findings to Notion | Ask user first — they may want to defer suggestions |
