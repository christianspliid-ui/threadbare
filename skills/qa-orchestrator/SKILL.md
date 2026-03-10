---
name: qa-orchestrator
description: Use when running QA on The Fantasy World Simulator — interactive playtests via Playwright, headless sweeps, or targeted audits. Triggers on "run QA", "test the game", "find bugs", "QA sweep", "playtest", "check the UI", or after completing a major implementation phase. Routes findings to the correct Notion backlog.
---

# QA Orchestrator

## Overview

Play the game via Playwright, find bugs, route them to the right backlog. Three modes: interactive playtest (browser), headless sweep (tests + CLI), targeted audit (specific system deep-dive).

## Prerequisites

Before starting, verify in order:

1. **Dev server** — `browser_navigate` to `http://localhost:5173` — page must load with "Fantasy World Simulator" title
2. **STYLE.md** — read project root `STYLE.md` for visual rules (brightness ceilings, sphere colors, typography)
3. **Notion MCP** — `notion-fetch` the backlog page at `https://www.notion.so/3182b241dfb081b9af78c279eef405cf`

If any fails, stop and tell the user what's missing. If dev server isn't running, fall back to headless sweep mode only.

## Backlog Routing

All findings route to sections on the [Notion Development Backlog](https://www.notion.so/3182b241dfb081b9af78c279eef405cf):

| Backlog | Notion Section | Prefix | Routes When... |
|---------|---------------|--------|----------------|
| Content & Worldbuilding | 📝 Content Backlog / 🐛 Defects | CB / DEF | Repetitive prose, thin pools, hardcoded strings in engine, missing templates |
| Design & Frontend | 🎨 Frontend Polish Backlog | FE | Layout, animation, a11y, responsiveness, UX confusion, focus mgmt |
| Architecture & Systems | Main body / 🔮 Next Up | SYS | Engine crashes, type errors, data flow bugs, perf, state mgmt, tracing |
| Visual Assets | 🎨 Visual Asset Backlog | ART | STYLE.md violations, brightness, missing art, placeholders, visual regression |

**Routing decision:** What needs to change to fix it?
- Engine code / types → Architecture (SYS)
- Art assets / STYLE.md compliance → Visual Assets (ART)
- Content data / templates / prose pools → Content (CB/DEF)
- React components / CSS / UX → Frontend (FE)

## Finding Schema

```json
{
  "id": "QA-YYYY-MM-DD-NNN",
  "mode": "interactive|headless|targeted",
  "severity": "critical|major|minor|cosmetic",
  "category": "data-flow|visual|ux|content|accessibility|performance|type-error",
  "backlog": "content|frontend|architecture|visual-assets",
  "title": "Short description",
  "description": "Full description with repro steps",
  "evidence": "Code ref, CSS value, console output, or trace data",
  "screenshot": "Docs/qa/screenshots/QA-YYYY-MM-DD-NNN.png|null",
  "location": "src/path/to/file.ts:line|null",
  "effort": "S|M|L|XL",
  "suggestedFix": "What to do"
}
```

## Mode 1: Interactive Playtest (Playwright)

The primary mode. Play the full game via Playwright MCP tools.

### Game Flow Sequence

This is the exact click path through the game. Use `browser_snapshot` before each action to get current element refs.

```
PHASE A — WORLD CREATION
1. browser_navigate → http://localhost:5173
2. browser_snapshot → find sphere sliders, presets, seed input, "Generate World" button
3. (Optional) Adjust sphere sliders or click a preset like "balanced"
4. browser_click → "Generate World"
5. browser_take_screenshot → save world creation state
6. browser_click → "✧ Shape Your Divinity ✧"

PHASE B — ASCENDANT CREATION
7. browser_snapshot → find archetype cards (4 options)
8. browser_click → select an archetype card
9. (Optional) browser_type into avatar name textbox
10. browser_click → "✧ Ascend ✧"
11. browser_take_screenshot → save ascendant screen

PHASE C — GAME VIEW (main gameplay)
12. browser_snapshot → verify: sidebar (Time, Divine Essence, Rival Gods),
    hex map, AvatarHUD (Move/Actions/Scry tabs), Retinue panel
13. browser_click → "Debug" button (top-right) — THIS ENABLES TRACING
14. browser_take_screenshot → initial game state

PHASE D — TICK PROGRESSION
15. browser_click → "⏭ Step" button (advances 1 tick)
16. browser_snapshot → check: tick counter, doom %, essence values, narrative log
17. Repeat step 15-16 for 10-20 ticks
18. browser_take_screenshot → save mid-game state
19. Check narrative log toggle (☰ button with count badge) for accumulated events

PHASE E — AGENT INTERACTION
20. browser_click → agent name in Retinue panel → right sidebar populates
21. browser_click → "Actions" tab in AvatarHUD
22. browser_snapshot → verify action drawer opens with agent cards
23. browser_click → select an agent card → intervention options appear
24. browser_click → select intervention type
25. browser_snapshot → verify AgendaPicker or InterventionConfirm appears
26. browser_take_screenshot → save intervention flow

PHASE F — MAP INTERACTION
27. browser_click → a hex tile on the map → should enter hex zoom
28. browser_snapshot → verify HexZoomView with sublocations, breadcrumb nav
29. browser_click → breadcrumb to return to world view
30. browser_click → "Move" tab → click destination hex → avatar moves

PHASE G — SCRY
31. browser_click → "Scry" tab → ScryOverlay opens
32. browser_snapshot → verify court positions, agent assignment UI
33. browser_click → close/dismiss scry

PHASE H — DEBUG TRACE INSPECTION
34. browser_snapshot → read Debug Panel content (right side drawer)
35. Verify traces are appearing (if "No traces yet" after ticks → file as SYS bug)
36. Check trace categories: action_selection, narrative_generation, tick_summary should have entries
37. Try Feed/Agent/Tick view modes
```

### What to Check at Each Step

| Check | What to look for | Backlog if broken |
|-------|-----------------|-------------------|
| Console errors | `browser_console_messages` after each major action | Architecture (SYS) |
| Visual style | Screenshot brightness, colors vs STYLE.md | Visual Assets (ART) |
| Text repetition | Same prose appearing multiple ticks in a row | Content (CB) |
| Empty states | Panels with no content, "undefined", "NaN" | Frontend (FE) |
| Interaction flow | Click→expected result, overlays open/close properly | Frontend (FE) |
| Accessibility | Interactive elements have ARIA labels, keyboard works | Frontend (FE) |
| Trace output | Debug panel shows traces after ticks run | Architecture (SYS) |
| Placeholder text | Emoji where icons should be, "TODO", lorem ipsum | Visual Assets (ART) |
| Content pools | Same name/verb/adjective repeating within 10 ticks | Content (CB) |

## Mode 2: Headless Sweep

No browser needed. Run from the skill directly:

```bash
# Type checking
npx tsc --noEmit

# Full test suite
npm test

# Multi-seed playtest (4 seeds × 100 ticks)
npm run playtest -- --seeds 1,42,100,999 --ticks 100

# World model validation
npm run validate-model
```

Parse output for:
- **Type errors** → Architecture (SYS)
- **Test failures** → route by test file location (engine/ → SYS, components/ → FE, data/ → CB)
- **Playtest anomalies** → doom frozen (SYS), zero dilemmas (SYS), repetitive prose (CB), population collapse (SYS)
- **Model validation failures** → Content (CB)

## Mode 3: Targeted Audit

When asked to audit a specific system (e.g., "audit the encounter flow"):

1. Read the relevant design doc from `Docs/plans/`
2. Read the implementation files
3. Play through that specific flow via Playwright
4. Cross-reference: does the UI match the design doc? Does the engine trace show expected behavior?
5. File findings scoped to that system

## Tracing System

### Enabling Traces

Tracing is **off by default** for performance. Two ways to enable:

**Via UI (always available):**
Click the "Debug" button in the top-right corner of the game view. This calls `enableTracing()`. The backtick key (`` ` ``) also toggles it.

**Via window.__DEBUG (if implemented):**
```javascript
await page.evaluate(() => window.__DEBUG?.enableTracing())
```

After enabling, step ticks. Traces accumulate in a 500-entry ring buffer.

### Reading Traces

**Via Debug Panel DOM:**
After enabling tracing and stepping ticks, `browser_snapshot` the debug panel. Traces appear as entries with category, tick number, agent ID, and detail data. Three view modes:
- **Feed** — all traces, newest first
- **Agent** — filter by agent ID
- **Tick** — filter by tick number

10 trace categories: action_selection, narrative_generation, context_harvest, dilemma_resolution, tick_summary, encounter_resolution, familiarity_change, intervention_effect, action_execution, modifier_resolution.

**Via window.__DEBUG (if implemented):**
```javascript
const traces = await page.evaluate(() => window.__DEBUG?.getTraces())
```

### Known Bug: Stale Trace Display

`DebugPanel.tsx` line 676: `useMemo(() => getTraces(), [])` — empty dependency array means traces read once on mount, never refreshed. If you open the debug panel and step ticks but see "No traces yet", this bug is the cause.

**Fix:** Change to `useMemo(() => getTraces(), [currentTick])`. File as Architecture (SYS) finding if still present.

**Workaround:** Close and reopen the debug panel between tick steps (forces re-mount).

### Trace-Based Checks

When traces are accessible:
- **Are dilemmas firing?** Check for `dilemma_resolution` traces (should appear every few ticks)
- **Are encounters progressing?** Check for `encounter_resolution` traces
- **Is narrative generating?** Check for `narrative_generation` traces every tick
- **Are interventions working?** After applying one, check for `intervention_effect` trace
- **Determinism:** Same seed should produce identical trace sequences

## Orchestrator Checklist

**Use TodoWrite for each step.**

### Phase 1: Setup
- [ ] Read this skill fully
- [ ] Read STYLE.md
- [ ] Pre-flight: dev server + Playwright + Notion all respond
- [ ] Create findings collection: `findings = []`

### Phase 2: Execute (pick mode)
- [ ] **Interactive:** Follow game flow sequence above, screenshot + check at each phase
- [ ] **Headless:** Run all CLI commands, parse output
- [ ] **Targeted:** Read design doc, play specific flow, cross-reference

### Phase 3: Report
- [ ] Deduplicate: same element + same issue → merge
- [ ] Route each finding to correct backlog using routing table
- [ ] Sort by severity (critical first), then effort (S first)
- [ ] Present summary: "Found N findings: X critical, Y major, Z minor"
- [ ] Ask user: "Push to Notion? (all / critical+major only / specific IDs)"

### Phase 4: Archive
- [ ] Save findings JSON to `Docs/qa/YYYY-MM-DD-qa-findings.json`
- [ ] Save screenshots to `Docs/qa/screenshots/`
- [ ] Push approved findings to Notion backlog sections

## Notion Integration

Backlog page: `https://www.notion.so/3182b241dfb081b9af78c279eef405cf`

To add findings:
1. `notion-fetch` the page
2. `notion-update-page` with `command: "update_content"` — append after the relevant backlog section
3. Format each finding as a checkbox item matching existing backlog style:

```markdown
### QA-YYYY-MM-DD-NNN: [Title] 🔴
**Severity:** [severity] | **Type:** [category] | **Effort:** [effort]
[description]
- [ ] [suggestedFix]
```

## STYLE.md Quick Reference for Visual Checks

These are the key rules to check against (read the full STYLE.md for details):

- **World brightness:** 10-40% (non-magic surfaces)
- **Magic brightness:** 70-100% (sphere-colored, threadlike)
- **UI chrome:** oklch(0.21-0.24, ...) dark range
- **Background:** Dark charcoal/near-black, NOT light tan
- **Typography:** System mono for data, serif for narrative
- **Sphere colors:** Force=rose, Matter=amber, Energy=gold, Life=green, Mind=blue, Spirit=purple, Time=muted-gold, Entropy=teal
- **No stray emoji** where sphere-colored icons should be

## When NOT to Use

- During active development with unstable game state
- Without dev server running (use headless mode only)
- For content quality review (use prose-resolver skill)
- For engine-only changes (use unit tests)

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Not clicking Debug before stepping ticks | No traces collected. Always enable tracing first. |
| Fixing during the sweep | Collect all findings first, fix after. Mid-sweep changes invalidate later checks. |
| Not saving raw JSON | Lose ability to diff between QA runs |
| Pushing all findings to Notion without asking | Some findings may be deferred. Always ask first. |
| Forgetting to screenshot | Evidence is key. Screenshot at every phase transition. |
| Ignoring console errors | `browser_console_messages` catches JS errors invisible to visual inspection |
