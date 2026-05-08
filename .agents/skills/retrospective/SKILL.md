---
name: retrospective
description: Review the impediment log (Docs/impediments.md) and conduct a structured retrospective. Reads this week's drift-scan Linear issues as the first input, then analyzes patterns, proposes concrete improvements to tools, skills, CLAUDE.md, and processes. Trigger with "/retrospective" or "run a retro" or "review impediments" or "continuous improvement review".
last_validated_against: 2026-05-08
---

# Retrospective

## Purpose

Turn accumulated impediment data and weekly scan signals into concrete improvements. This is the "act" step in a plan-do-check-act cycle. The impediment reporter captures friction; the drift scan surfaces codebase health signals; this skill synthesizes both and eliminates the most impactful friction.

## Workflow

### Step 0: Load Drift-Scan Input

Before reading the impediment log, load the current week's drift-scan output from Linear.

Query Continuous Improvement for issues labeled `drift-scan` created or updated in the last 7 days:

```
list_issues(
  project: "Continuous Improvement",
  label: "drift-scan",
  state: "Backlog",
  createdAt: "-P7D"
)
```

Also query `state: "Todo"` and `state: "In Dev"` for any scan issues already triaged this cycle.

**For each scan issue found:** extract the signal name (S1–S4), the summary, and the raw data. These feed the retro's pattern-recognition pass in Step 2.

**Graceful fallback (per §13):** If the Linear API is unavailable, note "drift-scan data unavailable this cycle" in the retro report's Summary section and continue from Step 1 using only the impediment log. Do not abort.

**Failure-handling (per §8.4 / §16):** If scan produced no issues this week (and the previous 2 weeks also produced none), explicitly include a "Signal health" agenda item in the retro:
- **Working (health good):** No red signals means codebase health is genuinely good — keep running.
- **Noise (thresholds wrong):** Signals aren't firing because thresholds are too permissive — propose tuning in the Tuning Recommendations section.
- **Dead signal (kill it):** Signal is structurally broken and not worth the maintenance cost — open a Linear issue to remove it.
The retro's qualitative assessment decides which category applies. No auto-kill.

Record which scan issue IDs were consumed; include them in the retro report.

### Step 1: Generate Deterministic Draft, Then Validate

Run `npm run retro-draft` first. This writes `Docs/retrospectives/YYYY-MM-DD-retro-draft.md` from `Docs/impediments.md` using deterministic parsing and stable ordering.

Open the generated draft and cross-check it against `Docs/impediments.md` before writing narrative conclusions. Treat the impediment log as the source of truth if anything disagrees.

Produce/verify these analytics:

1. **Volume**: Total new impediments since last retro
2. **By category**: Count per category, sorted descending
3. **By impact**: Count per impact level (S/M/L/Blocked)
4. **Top friction sources**: Group impediments by root cause (not just category). Example: 5 separate `api-quirk` entries might all trace to "Obsidian MCP patch_content is unreliable"
5. **Unresolved blockers**: Any entries where Workaround Found = No
6. **Repeat offenders**: Same impediment appearing 3+ times across sessions
7. **Total estimated time lost**: S=1min, M=8min, L=20min, Blocked=30min (rough heuristic)

### Step 2: Synthesize Scan + Impediments Together

Combine the drift-scan signals (Step 0) with the impediment analytics (Step 1) for a unified pattern pass:

- **Cross-signal correlation:** does the scan's S2 (broken-windows tally) align with impediment entries for process-friction? If scan and impediments point at the same root cause, the fix is higher ROI.
- **Scan vs impediments coverage gap:** are there friction patterns in impediments that the scan doesn't yet flag? If yes, note them as candidates for a new signal in the Tuning Recommendations section.
- **New scan signals this cycle:** for each red signal in Step 0, note whether it was a first-time hit or a repeat. Repeat signals that have been triaged and dismissed multiple times may indicate a calibration problem.

### Step 3: Identify Actionable Improvements

For each top friction source (and all unresolved blockers), propose a concrete fix. Categorize each proposal:

| Fix Type | What It Means | Example |
|----------|--------------|---------|
| **skill-update** | Modify an existing skill's instructions | Add workaround to gamedocumenter for Obsidian MCP quirk |
| **skill-create** | Create a new skill | Reusable pattern that agents keep rediscovering |
| **claude-md-update** | Add/modify instruction in CLAUDE.md | New architectural decision, new gotcha |
| **tool-config** | Change MCP server config, permissions, hooks | Fix a permission that keeps blocking agents |
| **process-change** | Change a workflow or convention | Reorder steps in Definition of Done |
| **cant-fix** | External limitation we can't change | Platform bug, API limitation — document and move on |

### Step 4: Prioritize

Score each proposed fix:

- **Frequency** (how often this impediment occurs): 1-5
- **Severity** (average impact when it occurs): 1-5
- **Fix effort** (how hard is the fix): 1-5 (1=trivial, 5=major)
- **ROI score** = (Frequency × Severity) / Fix effort

Sort by ROI descending. The top items are the most valuable improvements.

### Step 5: Execute Quick Wins

For any fix with effort=1 (trivial) and ROI > 3, **implement it immediately**:

- Edit the skill file
- Edit CLAUDE.md
- Update the relevant process doc

For larger fixes, open a Linear issue in Continuous Improvement under the appropriate section:
- Prefix description with `💡` if it needs design work, `🔲` if ready to build
- Include the ROI score so they can be prioritized relative to other backlog items

### Step 5b: Systemic Wiring Guide Audit

**Check whether new engine capabilities have been added since the guide was last updated.**

1. Grep `src/types/effects.ts` for effect type names and compare against the capability inventory in `Docs/plans/2026-04-16-systemic-wiring-guide.md` Part 5.
2. Check `src/engine/proseEnrichment.ts` for placeholder patterns vs. what the guide documents in Part 2 Capability 1.
3. Check `src/types/encounter.ts` for EncounterTemplate fields vs. the guide's template-level fields table.
4. Check `src/engine/strategicGraphOps.ts` for available operations vs. Part 2 Capability 5.

If there are undocumented capabilities, flag them as a quick-win improvement (edit the guide immediately) or backlog if the capability is complex enough to need a worked example.

**Why this matters:** The wiring guide is the IKEA manual for content authoring. If it's stale, content agents produce hardcoded fiction instead of systemically alive content. Every undocumented capability is a missed opportunity for dynamic storytelling.

### Step 6: Write the Retrospective Report

Create a dated file: `Docs/retrospectives/YYYY-MM-DD-retro.md`

Structure:
```markdown
# Retrospective — YYYY-MM-DD

## Period
From: <date of last retro or project start>
To: <today>

## Summary
- Drift-scan issues consumed: <list IDs, or "none this cycle" / "data unavailable">
- Impediments logged: N
- Total estimated time lost: ~Xh Ym
- Top category: <category> (N occurrences)
- Improvements implemented: N
- Improvements backlogged: N

## Drift-Scan Signals This Cycle
<For each red signal: signal name, summary, raw data. If no scan data: note why.>
<If 3+ consecutive weeks with no red signals: include Signal health assessment (working / noise / dead).>

## Impediment Analytics
<tables from Step 1>

## Cross-Signal Patterns
<synthesis from Step 2: correlations, gaps, repeats>

## Improvements Made This Session
<list of changes actually made, with file paths>

## Improvements Backlogged
<list of Linear issues opened, with links>

## Tuning Recommendations
<concrete proposals for adjusting drift-scan thresholds or adding/removing signals.
Format per recommendation: Signal → current threshold → proposed threshold → rationale.
If none needed, write "No tuning needed this cycle.">

## Patterns to Watch
<emerging patterns that aren't yet actionable but worth tracking>
```

### Step 7: Update the Impediment Log

Add a horizontal rule and note at the bottom of `Docs/impediments.md`:

```markdown
---
**Retrospective conducted: YYYY-MM-DD** — N impediments reviewed, N improvements implemented, N backlogged. Scan issues consumed: <IDs or "none">. Report: `Docs/retrospectives/YYYY-MM-DD-retro.md`
---
```

## When to Run

- **Scheduled (weekly):** Fridays at ~15:00 UTC, one hour after the drift scan runs at 14:00 UTC. The scan's output is warm when the retro starts.
- **Proactively**: Every ~10 sessions or when the impediment log grows by 20+ entries
- **On request**: When the user says "run a retro", "review impediments", or "/retrospective"
- **After a rough session**: If a single session logs 5+ impediments, suggest a retro at session end

## Rules

1. **Data-driven, not opinion-driven.** Every proposed improvement must trace back to specific impediment entries or scan signals.
2. **Implement quick wins immediately.** Don't just propose — fix what you can fix right now.
3. **Be specific in proposals.** "Improve the skill" is not actionable. "Add lines 4-8 to gamedocumenter SKILL.md documenting the Obsidian patch workaround" is actionable.
4. **Respect scope.** Only modify skills and docs in this project. Don't propose changes to external tools you can't control — document those as `cant-fix`.
5. **Track improvement over time.** Each retro should reference whether previous retro's backlogged items were completed.
6. **Scan absence is data, not a failure.** If the scan produced no issues, say so explicitly and assess why. No auto-kill without retro judgment.
7. **User makes verdicts; retro recommends.** Tuning recommendations go into the report for user review, not auto-applied.
