# QA Agent Prompt Templates

Copy the relevant block verbatim when dispatching each agent. Replace every `{QA_URL}` with the actual URL from `scripts/qa-server.sh start` output **before** pasting into the Agent tool — never pass the literal placeholder string.

---

## Agent 1: Visual Style Compliance

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
> 1. `browser_navigate` to `{QA_URL}/?view=game` (skips worldgen/selection). Wait 3 seconds for the game to load.
> 2. `browser_take_screenshot` — full viewport
> 4. `browser_evaluate` to extract ALL computed CSS background-color, color, border-color values from visible elements. Convert each to HSL and check the L (lightness) component against STYLE.md brightness thresholds.
> 5. Screenshot individual panels for detail inspection
> 6. Advance game 10+ ticks (click Step button repeatedly), screenshot again
> 7. Check sphere icon colors match canonical sphere palette from STYLE.md
>
> **Step 3:** If `window.__DEBUG` is available, enable tracing and read traces after ticking to cross-reference visual state with engine state.
>
> **Output:** Return a JSON array of Finding objects with these fields: id (VS-NNN), agent ("visual"), severity, category, backlog, notionPrefix, title, description, evidence, screenshot, location, effort, suggestedFix. Apply the backlog routing tree: STYLE.md violations -> backlog "visual-assets", notionPrefix "ART".

**Tools needed:** Playwright MCP (browser_navigate, browser_take_screenshot, browser_evaluate, browser_snapshot, browser_click)

**Expected output:** 5-15 findings, mostly critical or major.

---

## Agent 2: Information Architecture

> You are an Information Architecture auditor for The Fantasy World Simulator. Identify redundant text, dead space, information density imbalance, and wasted screen real estate.
>
> **Use Playwright MCP tools:**
> 1. Navigate to `{QA_URL}/?view=game` (skips worldgen/selection). Wait 3 seconds.
> 2. `browser_evaluate` to run a DOM analysis that:
>    - Extracts all visible text nodes with their parent element tags and bounding rects
>    - Groups by screen zone (LEFT_SIDEBAR: x<250, TOP_BAR: y<60, CENTER_MAP: 250<x<viewport-350, RIGHT_SIDEBAR: x>viewport-350, BOTTOM: bottom 200px)
>    - Finds duplicate text strings (same text appearing 2+ times)
>    - Counts words per zone for density analysis
>    - Identifies zero-value displays ("0.0", "0%", "N/A", "0")
> 3. Check heading hierarchy: are H1->H2->H3 properly nested?
> 4. Advance game 10+ ticks, re-run analysis. Do densities improve with progression?
> 5. Check the right sidebar — is it populated or empty when no agent is selected?
> 6. Check the narrative log — how many items? Are they repetitive?
>
> **Output:** Return a JSON array of Finding objects with: id (IA-NNN), agent ("info-arch"), severity, category, backlog, notionPrefix, title, description, evidence, location, effort, suggestedFix. Most info-arch findings route to backlog "frontend", notionPrefix "FE". Repetitive content routes to backlog "content", notionPrefix "CB".

**Tools needed:** Playwright MCP (browser_evaluate, browser_snapshot, browser_click)

**Expected output:** 3-8 findings, mostly major.

---

## Agent 3: Interaction & State

> You are an Interaction & State auditor for The Fantasy World Simulator. Click through every interactive flow and verify correct state transitions, overlay behavior, and user feedback.
>
> **Surface coverage:** Read `test-surfaces.md` in the qa-orchestrator skill directory. Your job is to touch as many surfaces as possible. Tag every finding with `surfaceIds` from the registry. After testing, report which surface IDs you visited vs. skipped.
>
> **Use Playwright MCP to systematically test each flow:**
>
> 1. **Game Entry:** Navigate to `{QA_URL}/?view=game` (skips worldgen/selection). Wait 3 seconds. Screenshot to confirm game loaded.
>
> 2. **Tick Progression:** Click "Step" button 5+ times. Verify: narrative log updates, doom bar moves, essence values change. Screenshot before/after.
>
> 3. **Retinue Panel:** Click an agent name in left sidebar -> right panel should show AgentInfoCard. Click different agent -> panel updates. Screenshot.
>
> 4. **Action Drawer:** Click "Actions" in AvatarHUD -> bottom drawer should appear with ActionCards. Click an ActionCard -> InterventionConfirm should appear. Cancel -> drawer closes. Screenshot each state.
>
> 5. **Scry Overlay:** Click "Scry" button -> full-screen overlay. Interact with court positions. Close overlay -> verify assignments persist. Screenshot.
>
> 6. **Hex Zoom:** Click a hex tile -> HexZoomView with locations. Click a location -> LocationView detail. Use breadcrumb to navigate back. Verify view state machine: world <-> hex-zoom <-> location. Screenshot.
>
> 7. **Avatar Movement:** Click "Move" in AvatarHUD -> click a hex -> avatar should move. Verify fog of war updates around new position. Screenshot.
>
> 8. **Mandate Tracker:** Click mandate bar -> popover with progress details. Close popover. Screenshot.
>
> 9. **Debug Panel:** Press backtick key -> debug drawer opens. Verify traces appear. Toggle category filters. Close panel. Screenshot.
>
> 10. **Edge Cases:** Double-click buttons rapidly. Open overlay, click outside -> should close. Try opening two overlays simultaneously (should not stack). Click disabled/unavailable actions.
>
> **For each test:** `browser_snapshot` to verify DOM state, `browser_take_screenshot` for visual evidence.
>
> **Output:** Return a JSON array of Finding objects with: id (IX-NNN), agent ("interaction"), severity, category, backlog, notionPrefix, title, description, evidence, screenshot, location, effort, suggestedFix. Broken flows -> severity critical. Missing feedback -> major. Edge cases -> minor. Most route to backlog "frontend", notionPrefix "FE".

**Tools needed:** Playwright MCP (full set — navigate, click, snapshot, screenshot, evaluate, wait_for)

**Expected output:** 5-20 findings depending on current state.

---

## Agent 4: React Code Quality

> You are a React Code Quality auditor for The Fantasy World Simulator. Analyze React components for anti-patterns, performance issues, and accessibility gaps. This is static code analysis — no browser needed.
>
> **Surface coverage:** Read `test-surfaces.md` in the qa-orchestrator skill directory. Map each component file to its surface ID. Tag every finding with `surfaceIds`. After scanning, report which surface IDs you covered vs. skipped.
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
> **Output:** Return a JSON array of Finding objects with: id (RC-NNN), agent ("react-code"), severity, category, backlog, notionPrefix, title, description, evidence (include code snippet), location (file:line), effort, suggestedFix (include corrected code). Performance in hot paths -> major. Style issues -> minor. All route to backlog "frontend", notionPrefix "FE" unless it's an engine bug (-> "architecture", "SYS").

**Tools needed:** File system only (Read, Grep, Glob) — no browser.

**Expected output:** 10-30 findings, mostly minor or suggestion.
