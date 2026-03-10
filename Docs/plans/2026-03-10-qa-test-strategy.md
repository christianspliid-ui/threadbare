# QA Test Strategy & qa-orchestrator Skill Design

**Date:** 2026-03-10
**Status:** Approved
**Scope:** End-to-end QA framework, test strategy, backlog routing, tracing integration

---

## 1. Problem Statement

The Fantasy World Simulator has strong unit/integration test coverage (~2,389+ tests, 216 test files) and a headless playtest runner, but no automated end-to-end browser testing, no visual regression detection, and no systematic workflow for routing findings to the right backlog. The debug trace panel exists but has a display bug preventing runtime use. The QA skill (`qa-orchestrator`) referenced in CLAUDE.md does not exist yet.

## 2. Backlog Routing Map

All backlogs live on the [Notion Development Backlog](https://www.notion.so/3182b241dfb081b9af78c279eef405cf) page as sections:

| Backlog | Notion Section | ID Prefix | Routes When... |
|---------|---------------|-----------|----------------|
| Content & Worldbuilding | 📝 Content Backlog + 🐛 Defects | CB-xxx, DEF-xxx | Repetitive prose, thin content pools, hardcoded strings in engine, missing templates, narrative gaps |
| Design & Frontend | 🎨 Frontend Polish Backlog | FE-xx | Layout bugs, animation gaps, accessibility failures, responsiveness, UX confusion, focus management |
| Architecture & Systems | Main body + 🔮 Next Up | SYS-xxx | Engine crashes, type errors, data flow bugs, performance issues, state management, tracing failures |
| Visual Assets | 🎨 Visual Asset Backlog | ART-xx | STYLE.md violations, brightness ceiling breaches, missing art, placeholder detection, visual regression |

### Routing Decision Tree

```
Finding → Is it a crash, type error, or engine logic bug?
  YES → Architecture & Systems (SYS-xxx)
  NO  → Is it a STYLE.md violation, missing art, or brightness issue?
    YES → Visual Assets (ART-xx)
    NO  → Is it repetitive text, thin pool, or missing template?
      YES → Content & Worldbuilding (CB-xxx)
      NO  → Design & Frontend (FE-xx)
```

Edge cases: findings that span two backlogs get filed to whichever backlog owns the fix. E.g., "encounter text is repetitive" → Content (needs more templates), not Frontend.

## 3. Testing Pyramid

### Layer 1: Unit Tests (existing — ~2,389+)
Engine pure functions, content data validation, graph operations, PRNG determinism, modifier math, decay curves. Every new engine module gets TDD'd.

**Coverage:** Engine logic, content integrity, graph operations, PRNG determinism.

### Layer 2: Integration Tests (existing — ~100+)
Full pipelines: seed→tick→narrative, encounter lifecycle, intervention→effects→decay, culture→traits→prose.

**Coverage:** Cross-module data flow, pipeline correctness.

### Layer 3: Component Tests (existing — ~100+)
React component rendering with vitest + @testing-library. Props, callbacks, accessibility attributes.

**Coverage:** UI regression without a browser.

### Layer 4: Headless Simulation (existing — playtest runner)
Multi-seed, multi-tick engine stability via `npm run playtest`.

**Coverage:** Long-run stability, statistical anomalies (doom stall, zero dilemmas, population collapse).

### Layer 5: Interactive E2E / QA (NEW — qa-orchestrator skill)
Playwright-driven full playthrough of the game. This is the missing layer.

**Coverage gaps this fills:**
- No E2E browser testing exists today
- No visual regression detection (STYLE.md compliance)
- No interactive flow testing (can a player complete a game?)
- No content repetition detection across multi-tick sessions
- No accessibility testing in real browser (keyboard nav, screen reader)
- No cross-system visual integration (does an intervention visually show its effect?)

## 4. QA Skill — Three Modes

### Mode 1: Interactive Playtest (Playwright)
Full game playthrough via Playwright on `localhost:5173`. Steps through:

1. **World creation** — adjust sphere sliders, try presets, generate world
2. **Ascendant creation** — select archetype, name avatar, ascend
3. **Map exploration** — hover hexes (tooltip text), click into hex zoom, check sublocations
4. **Tick progression** — advance ticks via Step button, watch narrative log, check doom bar
5. **Divine interventions** — open action drawer, pick agents, select interventions, choose agendas, confirm
6. **Agent inspection** — progressive disclosure tiers (hover→sidebar→modal), check knowledge gating
7. **Encounters** — verify encounter log, active/completed states
8. **Debug panel** — open debug panel, verify traces appear, inspect trace content
9. **Endgame** — push toward twilight/harvest, check final screens

At each step: screenshot, check console errors, verify text isn't placeholder/repetitive, check STYLE.md visual compliance.

### Mode 2: Headless Sweep
Automated checks without browser:
- `npm test` — vitest suite
- `npx tsc --noEmit` — type checking
- `npm run playtest -- --seeds 1,42,100,999 --ticks 100` — multi-seed stability
- `npm run validate-model` — world model integrity
- Parse output for failures, warnings, anomalies

### Mode 3: Targeted Audit
Focused deep-dive on a specific system when requested. Combines code reading + live interaction for that area.

## 5. Tracing Integration

### Current State
- 10 trace categories implemented: action_selection, narrative_generation, context_harvest, dilemma_resolution, tick_summary, encounter_resolution, familiarity_change, intervention_effect, action_execution, modifier_resolution
- Ring buffer (500 entries), zero-cost when disabled
- Debug Panel UI with Feed/Agent Follow/Tick Inspector modes
- Tracing enabled/disabled via Debug button toggle (`useAvatarData.ts` lines 81-88)

### Known Bug: DebugPanel Stale Trace Read
`DebugPanel.tsx` line 676: `useMemo(() => getTraces(), [])` — empty dep array means traces are read once on mount and never refreshed. Fix: `useMemo(() => getTraces(), [currentTick])`.

**Backlog routing:** Architecture & Systems (SYS-xxx) — this is a React memoization bug.

### Recommended: window.__DEBUG Bridge
Expose debug hooks in dev mode for Playwright access:

```typescript
// In main.tsx or gameInit.ts, dev-only:
if (import.meta.env.DEV) {
  (window as any).__DEBUG = {
    getTraces: () => import('./engine/traceBuffer').then(m => m.getTraces()),
    enableTracing: () => import('./engine/traceBuffer').then(m => m.enableTracing()),
    isTracingEnabled: () => import('./engine/traceBuffer').then(m => m.isTracingEnabled()),
    getGameState: () => { /* expose current game state ref */ },
  };
}
```

This lets the QA skill:
- Read traces after each tick to verify engine behavior
- Check trace counts per category ("are dilemmas firing?")
- Follow specific agents through their trace trail
- Verify determinism (same seed → same traces)
- Cross-reference UI vs engine reality

### QA Skill Trace Usage
If `window.__DEBUG` is available:
1. Enable tracing via `page.evaluate(() => window.__DEBUG.enableTracing())`
2. After each tick step, read traces: `page.evaluate(() => window.__DEBUG.getTraces())`
3. Analyze: check for expected trace categories, count per tick, verify agent IDs
4. Compare against visual UI state

If `window.__DEBUG` is NOT available:
1. Click Debug button via Playwright to enable tracing visually
2. Step ticks, then read the Debug Panel DOM for trace entries
3. Fall back to visual-only testing

## 6. Findings Format

Extends existing QA findings JSON:

```json
{
  "id": "QA-YYYY-MM-DD-NNN",
  "mode": "interactive|headless|targeted",
  "severity": "critical|major|minor|cosmetic",
  "category": "data-flow|visual|ux|content|accessibility|performance|type-error",
  "backlog": "content|frontend|architecture|visual-assets",
  "notionPrefix": "CB|FE|SYS|ART",
  "title": "Short description",
  "description": "Full description with reproduction steps",
  "evidence": "Code reference or screenshot path or console output",
  "screenshot": "Docs/qa/screenshots/QA-YYYY-MM-DD-NNN.png|null",
  "location": "src/path/to/file.ts:line|null",
  "effort": "S|M|L|XL",
  "suggestedFix": "What to do about it"
}
```

### Output Flow
1. Findings written to `Docs/qa/YYYY-MM-DD-qa-findings.json`
2. Screenshots saved to `Docs/qa/screenshots/`
3. After review, approved findings pushed to correct Notion backlog section with next available ID

## 7. Playwright Interaction Reference

Key Playwright MCP tools for the QA skill:

| Action | Tool | Notes |
|--------|------|-------|
| Navigate to game | `browser_navigate` | `http://localhost:5173` |
| Take screenshot | `browser_take_screenshot` | Save evidence to `Docs/qa/screenshots/` |
| Read page structure | `browser_snapshot` | Accessibility tree — best for finding elements |
| Click element | `browser_click` | Use `ref` from snapshot |
| Type text | `browser_type` | For avatar name input, seed input |
| Fill form | `browser_fill_form` | For slider values |
| Read console | `browser_console_messages` | Check for JS errors/warnings |
| Execute JS | `browser_evaluate` | For `window.__DEBUG` access |
| Wait | `browser_wait_for` | Wait for UI transitions |

### Game Flow Sequence for Playwright

```
1. browser_navigate → localhost:5173
2. browser_snapshot → find sphere sliders, presets, seed input, Generate button
3. browser_click → "Generate World"
4. browser_click → "Shape Your Divinity"
5. browser_snapshot → find archetype cards
6. browser_click → select archetype
7. browser_click → "Ascend"
8. browser_snapshot → game view loaded (verify sidebar, hex map, retinue)
9. browser_click → "Debug" button (enables tracing)
10. browser_click → "Step" button (advance ticks)
11. browser_snapshot → check narrative log, doom bar, essence values
12. Repeat steps 10-11 for N ticks
13. browser_click → agent in retinue (test progressive disclosure)
14. browser_click → "Actions" tab → select agent → select intervention
15. browser_snapshot → verify intervention UI flow
16. browser_take_screenshot → save evidence at each step
```

## 8. STYLE.md Compliance Checks

Visual QA checks derived from STYLE.md rules:

- **Brightness ceiling:** Non-magic world surfaces must stay in 10-40% brightness range
- **Sphere colors:** Each sphere has a canonical color — verify consistent use
- **Typography:** Check font family, heading hierarchy, no unstyled text
- **Dark theme:** Background should be dark charcoal/near-black
- **Magic elements:** Only magic-related UI may exceed 40% brightness
- **Threadbare aesthetic:** Overall tone should feel weathered, muted, textural

## 9. Success Criteria

The qa-orchestrator skill is successful when:
1. A Claude instance can play through the full game via Playwright and identify real issues
2. Every finding is automatically routed to the correct backlog with the right ID prefix
3. Findings include screenshot evidence and reproduction steps
4. The tracing system provides engine-level insight during interactive testing
5. Headless sweeps catch regressions before they reach interactive testing
