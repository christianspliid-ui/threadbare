---
name: retrospective
description: Review the impediment log (Docs/impediments.md) and conduct a structured retrospective. Analyzes patterns, proposes concrete improvements to tools, skills, CLAUDE.md, and processes. Trigger with "/retrospective" or "run a retro" or "review impediments" or "continuous improvement review".
---

# Retrospective

## Purpose

Turn accumulated impediment data into concrete improvements. This is the "act" step in a plan-do-check-act cycle. The impediment reporter captures friction; this skill eliminates it.

## Workflow

### Step 1: Load and Analyze the Impediment Log

Read `Docs/impediments.md`. Count entries since the last retrospective (check `Docs/retrospectives/` for the most recent one).

Produce these analytics:

1. **Volume**: Total new impediments since last retro
2. **By category**: Count per category, sorted descending
3. **By impact**: Count per impact level (S/M/L/Blocked)
4. **Top friction sources**: Group impediments by root cause (not just category). Example: 5 separate `api-quirk` entries might all trace to "Obsidian MCP patch_content is unreliable"
5. **Unresolved blockers**: Any entries where Workaround Found = No
6. **Repeat offenders**: Same impediment appearing 3+ times across sessions
7. **Total estimated time lost**: S=1min, M=8min, L=20min, Blocked=30min (rough heuristic)

### Step 2: Identify Actionable Improvements

For each top friction source (and all unresolved blockers), propose a concrete fix. Categorize each proposal:

| Fix Type | What It Means | Example |
|----------|--------------|---------|
| **skill-update** | Modify an existing skill's instructions | Add workaround to gamedocumenter for Obsidian MCP quirk |
| **skill-create** | Create a new skill | Reusable pattern that agents keep rediscovering |
| **claude-md-update** | Add/modify instruction in CLAUDE.md | New architectural decision, new gotcha |
| **tool-config** | Change MCP server config, permissions, hooks | Fix a permission that keeps blocking agents |
| **process-change** | Change a workflow or convention | Reorder steps in Definition of Done |
| **cant-fix** | External limitation we can't change | Platform bug, API limitation — document and move on |

### Step 3: Prioritize

Score each proposed fix:

- **Frequency** (how often this impediment occurs): 1-5
- **Severity** (average impact when it occurs): 1-5
- **Fix effort** (how hard is the fix): 1-5 (1=trivial, 5=major)
- **ROI score** = (Frequency × Severity) / Fix effort

Sort by ROI descending. The top items are the most valuable improvements.

### Step 4: Execute Quick Wins

For any fix with effort=1 (trivial) and ROI > 3, **implement it immediately**:

- Edit the skill file
- Edit CLAUDE.md
- Update the relevant process doc

For larger fixes, add entries to `.planning/BACKLOG.md` under the appropriate section:
- Prefix with `💡` if it needs design work, `🔲` if ready to build
- Include the ROI score so they can be prioritized relative to other backlog items

### Step 5: Write the Retrospective Report

Create a dated file: `Docs/retrospectives/YYYY-MM-DD-retro.md`

Structure:
```markdown
# Retrospective — YYYY-MM-DD

## Period
From: <date of last retro or project start>
To: <today>

## Summary
- Impediments logged: N
- Total estimated time lost: ~Xh Ym
- Top category: <category> (N occurrences)
- Improvements implemented: N
- Improvements backlogged: N

## Analytics
<tables from Step 1>

## Improvements Made This Session
<list of changes actually made, with file paths>

## Improvements Backlogged
<list of larger items added to Notion, with links>

## Patterns to Watch
<emerging patterns that aren't yet actionable but worth tracking>
```

### Step 6: Update the Impediment Log

Add a horizontal rule and note at the bottom of `Docs/impediments.md`:

```markdown
---
**Retrospective conducted: YYYY-MM-DD** — N impediments reviewed, N improvements implemented, N backlogged. Report: `Docs/retrospectives/YYYY-MM-DD-retro.md`
---
```

## When to Run

- **Proactively**: Every ~10 sessions or when the impediment log grows by 20+ entries
- **On request**: When the user says "run a retro", "review impediments", or "/retrospective"
- **After a rough session**: If a single session logs 5+ impediments, suggest a retro at session end

## Rules

1. **Data-driven, not opinion-driven.** Every proposed improvement must trace back to specific impediment entries.
2. **Implement quick wins immediately.** Don't just propose — fix what you can fix right now.
3. **Be specific in proposals.** "Improve the skill" is not actionable. "Add lines 4-8 to gamedocumenter SKILL.md documenting the Obsidian patch workaround" is actionable.
4. **Respect scope.** Only modify skills and docs in this project. Don't propose changes to external tools you can't control — document those as `cant-fix`.
5. **Track improvement over time.** Each retro should reference whether previous retro's backlogged items were completed.
