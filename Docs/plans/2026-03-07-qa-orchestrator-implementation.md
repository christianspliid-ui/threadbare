# QA Orchestrator Skill — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a project-specific QA orchestrator skill that dispatches 4 specialist sub-agents to systematically audit the Fantasy World Simulator's UI/UX/frontend code, producing a prioritized findings list for the Notion backlog.

**Architecture:** The skill is a technique-type SKILL.md file containing agent prompt templates, a finding schema, an orchestrator checklist, and Notion integration patterns. It lives in the project's `skills/` directory alongside `gamedocumenter/`. Testing uses application scenarios (can agents follow the orchestrator flow correctly?) rather than pressure scenarios.

**Tech Stack:** Markdown skill file, Playwright MCP for browser agents, Agent tool for sub-agent dispatch, Notion MCP for backlog integration.

---

### Task 1: Scaffold the Skill Directory

**Files:**
- Create: `skills/qa-orchestrator/SKILL.md` (empty scaffold)

**Step 1: Create directory and empty file**

```bash
mkdir -p /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator/skills/qa-orchestrator
```

**Step 2: Write frontmatter-only scaffold**

Create `skills/qa-orchestrator/SKILL.md` with:

```markdown
---
name: qa-orchestrator
description: Use when running a QA sweep of The Fantasy World Simulator UI. Trigger on "run QA", "check the UI", "visual audit", "find UI bugs", "frontend QA", or after completing a major implementation phase. Dispatches 4 specialist sub-agents sequentially for visual style, information architecture, interaction flows, and React code quality.
---

# QA Orchestrator

(Content will be added in subsequent tasks)
```

**Step 3: Verify file exists**

Run: `cat skills/qa-orchestrator/SKILL.md`
Expected: Frontmatter with name and description visible.

---

### Task 2: Write the Overview and Prerequisites Section

**Files:**
- Modify: `skills/qa-orchestrator/SKILL.md`

**Step 1: Add Overview section after frontmatter**

Replace the placeholder content with:

```markdown
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
```

**Step 2: Verify content**

Run: `head -40 skills/qa-orchestrator/SKILL.md`
Expected: Frontmatter + Overview + Prerequisites visible.

---

### Task 3: Write the Finding Schema Section

**Files:**
- Modify: `skills/qa-orchestrator/SKILL.md`

**Step 1: Append Finding Schema section**

```markdown
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
```

**Step 2: Verify**

Run: `grep -c "Finding Schema" skills/qa-orchestrator/SKILL.md`
Expected: 1

---

### Task 4: Write Agent 1 Prompt Template (Visual Style)

**Files:**
- Modify: `skills/qa-orchestrator/SKILL.md`

**Step 1: Append Agent 1 section**

```markdown
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
> **Output:** Return a JSON array of Finding objects. Use the VS- prefix for IDs (VS-001, VS-002, etc.). Include:
> - agent: "visual"
> - severity: critical if brightness violates hard rules, major for typography/icon issues, minor for polish
> - evidence: include the actual CSS color values you extracted
> - location: the UI panel or CSS selector where the violation occurs
>
> **Known issues from previous audits:** The hex map SVG background was rgb(244, 232, 193) at ~88% brightness — this is a critical violation. Check if this has been fixed.

**Tools needed:** Playwright MCP (browser_navigate, browser_take_screenshot, browser_evaluate, browser_snapshot, browser_click)

**Expected output:** 5-15 findings, mostly severity critical or major.
```

**Step 2: Verify**

Run: `grep "Agent 1" skills/qa-orchestrator/SKILL.md`
Expected: Section header visible.

---

### Task 5: Write Agent 2 Prompt Template (Information Architecture)

**Files:**
- Modify: `skills/qa-orchestrator/SKILL.md`

**Step 1: Append Agent 2 section**

```markdown
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
> **Output:** Return a JSON array of Finding objects. Use the IA- prefix. Include:
> - agent: "info-arch"
> - severity: major for redundant critical information, minor for zero-values
> - evidence: include the duplicate text strings and their locations
> - location: the screen zone(s) affected
>
> **Known issues from previous audits:** "The Hollow King" appeared in 3 places (sidebar, HUD, narrative), "Hostility" was repeated 3x identically, right sidebar was empty when no agent selected, narrative feed had 47 items with repetitive content.

**Tools needed:** Playwright MCP (browser_evaluate, browser_snapshot, browser_click)

**Expected output:** 3-8 findings, mostly severity major.
```

**Step 2: Verify**

Run: `grep "Agent 2" skills/qa-orchestrator/SKILL.md`
Expected: Section header visible.

---

### Task 6: Write Agent 3 Prompt Template (Interaction & State)

**Files:**
- Modify: `skills/qa-orchestrator/SKILL.md`

**Step 1: Append Agent 3 section**

```markdown
## Agent 3: Interaction & State

**Dispatch with:** `Agent` tool, `subagent_type: "general-purpose"`

**Prompt template:**

> You are an Interaction & State auditor for The Fantasy World Simulator. Your job is to click through every interactive flow and verify correct state transitions, overlay behavior, and user feedback.
>
> **Use Playwright MCP tools to systematically test each flow:**
>
> 1. **World Creation Flow:**
>    - Navigate to http://localhost:5173
>    - Select spheres, confirm creation, verify game starts
>    - Screenshot each step
>
> 2. **Retinue Panel (left sidebar):**
>    - Click an agent name → right sidebar should populate with AgentDetailPanel
>    - Click a different agent → sidebar updates
>    - Click same agent again → should deselect (or not — document behavior)
>
> 3. **Agent Wheel:**
>    - Select an agent, click "Wheel" button in AvatarHUD
>    - Verify wheel overlay appears with action slots
>    - Click a slot → InterventionConfirm popover should appear
>    - Confirm → essence should be deducted, narrative event should appear
>    - Cancel → popover closes, no state change
>
> 4. **Scry Overlay:**
>    - Click "Scry" button → full-screen overlay with court positions
>    - Assign an agent to a position
>    - Close overlay → assignments persist
>
> 5. **Hex Zoom:**
>    - Click a hex tile → HexZoomView with locations
>    - Click a location → LocationView detail
>    - Use breadcrumb to navigate back
>    - Verify view state machine: world ↔ hex-zoom ↔ location
>
> 6. **Avatar Movement:**
>    - Click "Move" in AvatarHUD → click a hex → avatar moves
>    - Verify fog of war updates around new position
>
> 7. **Mandate Tracker:**
>    - Click mandate bar → popover with progress details
>    - Close popover
>
> 8. **Edge Cases:**
>    - Double-click a button rapidly
>    - Open overlay, then click outside → should close
>    - Try to open two overlays simultaneously → should not stack
>    - Click unavailable/disabled actions
>
> **For each test:** Take a screenshot before and after the action. Use browser_snapshot to verify DOM state changed correctly.
>
> **Output:** Return a JSON array of Finding objects. Use the IX- prefix. Include:
> - agent: "interaction"
> - severity: critical for broken flows, major for missing feedback, minor for edge case issues
> - evidence: describe what happened vs what was expected
> - location: the component/flow name

**Tools needed:** Playwright MCP (full set — navigate, click, snapshot, screenshot, evaluate, wait_for)

**Expected output:** 5-20 findings depending on current state of interaction implementations.
```

**Step 2: Verify**

Run: `grep "Agent 3" skills/qa-orchestrator/SKILL.md`
Expected: Section header visible.

---

### Task 7: Write Agent 4 Prompt Template (React Code Quality)

**Files:**
- Modify: `skills/qa-orchestrator/SKILL.md`

**Step 1: Append Agent 4 section**

```markdown
## Agent 4: React Code Quality

**Dispatch with:** `Agent` tool, `subagent_type: "general-purpose"`

**Prompt template:**

> You are a React Code Quality auditor for The Fantasy World Simulator. Your job is to analyze React components for anti-patterns, performance issues, and accessibility gaps. You do NOT need the browser — this is static code analysis only.
>
> **REQUIRED BACKGROUND:** Read the react-best-practices skill first for Vercel Engineering's performance guidelines.
>
> **Scan all .tsx files in src/components/:**
>
> 1. **Performance Anti-Patterns:**
>    - Inline object/array creation in JSX (`style={{...}}`, `options={[...]}`) — causes re-renders
>    - Missing useCallback/useMemo for functions/values passed as props
>    - Large components (>300 lines) that should be split
>    - Missing React.memo on pure presentational components
>
> 2. **Prop Drilling:**
>    - Trace props through component hierarchy
>    - Flag props passed >3 levels deep (suggests context needed)
>
> 3. **Accessibility:**
>    - Interactive elements without ARIA labels
>    - Click handlers on non-button elements (div, span) without role="button"
>    - Missing keyboard navigation support
>    - Color contrast issues (reference STYLE.md dark theme)
>
> 4. **Code Hygiene:**
>    - Console.log/console.warn left in component code
>    - Unused imports
>    - Hardcoded magic numbers (violates project's #1 priority: tunability)
>    - Inconsistent naming patterns
>
> 5. **Error Handling:**
>    - Missing error boundaries
>    - Unhandled promise rejections
>    - Missing loading states
>    - Missing empty/zero states
>
> **Key files to check:** (Glob `src/components/**/*.tsx`)
> - GameView.tsx (main orchestrator — likely largest)
> - RetinuePanel.tsx, AgentWheel.tsx, StrandView.tsx
> - InterventionConfirm.tsx, ScryOverlay.tsx
> - HexZoomView.tsx, LocationView.tsx, HexBreadcrumb.tsx
> - AgentDetailPanel.tsx, MandateTracker.tsx, DoomBar.tsx
> - AvatarHUD.tsx, NarrativeFeed.tsx, RivalPanel.tsx
> - HexTile.tsx, HexMap.tsx
>
> **Also check:** `src/engine/` exports for unused public functions.
>
> **Output:** Return a JSON array of Finding objects. Use the RC- prefix. Include:
> - agent: "react-code"
> - severity: major for performance issues in hot paths, minor for style issues
> - evidence: include the code snippet and file:line reference
> - location: exact file path
> - suggestedFix: include the corrected code pattern

**Tools needed:** File system only (Read, Grep, Glob) — no browser.

**Expected output:** 10-30 findings, mostly severity minor or suggestion.
```

**Step 2: Verify**

Run: `grep "Agent 4" skills/qa-orchestrator/SKILL.md`
Expected: Section header visible.

---

### Task 8: Write the Orchestrator Checklist Section

**Files:**
- Modify: `skills/qa-orchestrator/SKILL.md`

**Step 1: Append Orchestrator Checklist section**

```markdown
## Orchestrator Checklist

**IMPORTANT: Use TodoWrite to create todos for EACH numbered step below.**

This is the rigid flow the orchestrator (you) follows when running a QA sweep. Do not skip steps. Do not reorder.

### Phase 1: Setup

- [ ] **Step 1:** Read this skill file fully before starting
- [ ] **Step 2:** Read STYLE.md for current visual spec
- [ ] **Step 3:** Pre-flight checks — verify dev server, Playwright MCP, Notion MCP all respond
- [ ] **Step 4:** Create a timestamped findings collection: `findings_YYYY-MM-DD = []`

### Phase 2: Agent Dispatch (Sequential)

- [ ] **Step 5:** Dispatch Agent 1 (Visual Style Compliance)
  - Use Agent tool with the prompt template from the Agent 1 section
  - Collect returned findings, append to collection
  - Log: "Agent 1 complete: N findings"

- [ ] **Step 6:** Dispatch Agent 2 (Information Architecture)
  - Use Agent tool with the prompt template from the Agent 2 section
  - Collect returned findings, append to collection
  - Log: "Agent 2 complete: N findings"

- [ ] **Step 7:** Dispatch Agent 3 (Interaction & State)
  - Use Agent tool with the prompt template from the Agent 3 section
  - Collect returned findings, append to collection
  - Log: "Agent 3 complete: N findings"

- [ ] **Step 8:** Dispatch Agent 4 (React Code Quality)
  - Use Agent tool with the prompt template from the Agent 4 section
  - Collect returned findings, append to collection
  - Log: "Agent 4 complete: N findings"

### Phase 3: Merge & Report

- [ ] **Step 9:** Deduplicate findings
  - Same UI element + same issue → merge, keep the more detailed description
  - Related issues (e.g., "background too bright" + "insufficient contrast") → group under parent finding
  - Cross-agent links: if Agent 1 flags a color and Agent 4 finds the hardcoded value → reference both

- [ ] **Step 10:** Sort findings
  - Primary sort: severity (critical → major → minor → suggestion)
  - Secondary sort: effort (S → M → L)
  - Group by agent for readability

- [ ] **Step 11:** Present prioritized report to user
  - Summary: "QA sweep found N findings: X critical, Y major, Z minor, W suggestions"
  - Table format with ID, severity, title, effort, location
  - Ask: "Which findings should I add to the Notion backlog? (all/critical+major/select specific IDs)"

### Phase 4: Backlog Integration

- [ ] **Step 12:** Add approved findings to Notion Development Backlog
  - Search for the Development Backlog page
  - Add a new section: "QA Findings [YYYY-MM-DD]"
  - Create a table or list with: ID, Severity, Category, Title, Effort, Status (default: "To Fix")
  - Link to this skill's design doc for full details

- [ ] **Step 13:** (Optional) Dispatch fix agents
  - Only if user requests immediate fixes
  - Create one Agent per finding (or group related findings)
  - Each fix agent gets: finding description, evidence, suggested fix, file locations
  - After fix, re-run the relevant specialist agent to verify

### Phase 5: Cleanup

- [ ] **Step 14:** Save raw findings JSON to `Docs/qa/YYYY-MM-DD-qa-findings.json`
  - Full structured data for future comparison
  - Enables "diff between QA runs" to track progress
```

**Step 2: Verify checklist completeness**

Run: `grep -c "Step" skills/qa-orchestrator/SKILL.md`
Expected: 14 (one per step)

---

### Task 9: Write the Notion Integration and Fix Dispatch Sections

**Files:**
- Modify: `skills/qa-orchestrator/SKILL.md`

**Step 1: Append Notion and fix dispatch sections**

```markdown
## Notion Integration

The Development Backlog is at:
`https://www.notion.so/Development-Backlog-3182b241dfb081b9af78c279eef405cf`

**Adding findings:** Use the Notion MCP tools:
1. `notion-fetch` the backlog page to get current content
2. `notion-update-page` with `insert_content_after` to add a new section
3. Format as a markdown table:

```
## QA Findings [YYYY-MM-DD]

| ID | Severity | Category | Title | Effort | Status |
|----|----------|----------|-------|--------|--------|
| VS-001 | Critical | color-violation | Hex map background at 88% brightness | S | To Fix |
| IA-003 | Major | redundant-text | Agent name duplicated in 3 panels | M | To Fix |
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
> 4. If tests fail, investigate and fix without changing the original fix intent
>
> **Do not** change anything unrelated to this finding.

Group related findings into a single fix agent when they share a file (e.g., multiple CSS issues in the same component).

## When NOT to Use This Skill

- Don't run during active development (game state unstable)
- Don't run without the dev server (Agents 1-3 need the browser)
- Don't run for backend/engine-only changes (use unit tests instead)
- Don't use for content review (narrative quality, world-model data) — different skill

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Running agents in parallel | Playwright MCP is single-browser. Run sequentially. |
| Skipping pre-flight checks | Agent 1 will fail silently if dev server isn't running |
| Fixing during sweep | Collect first, fix later. Changing code mid-sweep invalidates later agents' results |
| Not saving raw JSON | You lose the ability to diff between QA runs |
| Merging all findings to Notion | Ask user first — they may want to defer suggestions |
```

**Step 2: Verify skill is complete**

Run: `wc -l skills/qa-orchestrator/SKILL.md`
Expected: 250-350 lines (comprehensive but not bloated)

---

### Task 10: RED Phase — Baseline Test Without Skill

**Files:**
- No file changes — this is a test run

**Step 1: Create a baseline test scenario**

Dispatch a sub-agent WITHOUT the qa-orchestrator skill with this prompt:

> Run a QA audit of The Fantasy World Simulator. The dev server is at http://localhost:5173.
> Check visual style compliance against STYLE.md, look for redundant UI elements,
> test interaction flows, and scan React code for anti-patterns.
> Report findings in a structured format.

**Step 2: Document baseline behavior**

Record:
- Did the agent check STYLE.md before auditing? (likely: no or partially)
- Did it use structured findings? (likely: ad hoc prose)
- Did it cover all 4 areas? (likely: skipped some)
- Did it offer Notion integration? (likely: no)
- Did it suggest fix agents? (likely: no)
- How long did it take? (benchmark)

**Step 3: Save baseline**

Create `Docs/qa/baseline-test-YYYY-MM-DD.md` with the raw agent output and your observations.

---

### Task 11: GREEN Phase — Test With Skill

**Files:**
- No file changes — this is a test run

**Step 1: Run orchestrator WITH the skill**

Follow the orchestrator checklist from the skill. Dispatch all 4 agents using the prompt templates.

**Step 2: Compare against baseline**

Verify:
- [ ] All 4 specialist areas covered (vs baseline: likely 1-2 missed)
- [ ] Structured findings with IDs, severity, effort (vs baseline: prose)
- [ ] STYLE.md was read before visual checks (vs baseline: ad hoc)
- [ ] Notion integration offered (vs baseline: not offered)
- [ ] Deduplication happened (vs baseline: duplicates likely)
- [ ] Prioritized report presented (vs baseline: flat list)

**Step 3: If gaps found, iterate on skill (REFACTOR)**

Fix any sections where agents didn't follow instructions. Common issues:
- Agent prompt too vague → add more specific instructions
- Output format not followed → add example JSON
- Agent scope too broad → narrow the checklist

---

### Task 12: Commit and Document

**Files:**
- Create: `Docs/qa/` directory
- Modify: `CLAUDE.md` (changelog entry)

**Step 1: Create QA docs directory**

```bash
mkdir -p Docs/qa
```

**Step 2: Commit all skill files**

```bash
git add skills/qa-orchestrator/SKILL.md
git add Docs/plans/2026-03-07-qa-orchestrator-design.md
git add Docs/plans/2026-03-07-qa-orchestrator-implementation.md
git commit -m "feat: add QA orchestrator skill — 4 specialist agents for UI/UX/frontend QA"
```

**Step 3: Update CLAUDE.md changelog**

Add entry:
```
| 2026-03-07 | skills/qa-orchestrator/ | Created QA orchestrator skill — 4 specialist agents (visual, info-arch, interaction, react-code), finding schema, orchestrator checklist, Notion integration | Repeatable QA flow for UI/UX/frontend |
```

**Step 4: Update CLAUDE.md project skills list**

Add to the "Existing project skills" section:
```
- `qa-orchestrator` — dispatches 4 specialist sub-agents for systematic UI/UX/frontend QA sweeps
```

**Step 5: Commit docs update**

```bash
git add CLAUDE.md
git commit -m "docs: update changelog and project skills for QA orchestrator"
```
