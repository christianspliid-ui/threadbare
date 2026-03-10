# Frontend, UI & Design Audit — 2026-03-10

## Executive Summary

The Fantasy World Simulator's frontend is in **strong structural shape** — 50+ components, enforced patterns, a mature dark-tapestry design system, and solid accessibility baseline. What's missing is a **dedicated frontend improvement track**. All UI work to date has been reactive (built to serve engine features), which means there are systematic gaps in polish, responsiveness, animation, and player experience that no single engine sprint would ever surface.

This document serves as both audit and backlog.

---

## Audit Scorecard

| Dimension | Grade | Summary |
|-----------|-------|---------|
| **Component Architecture** | A | 50+ components, well-decomposed, 6 extracted hooks in GameView, 42 test files |
| **Design System** | B+ | CSS vars + Tailwind + sphere color lookups. Consistent but not formalized into a token system. Style tile exists but isn't auto-synced to code. |
| **Visual Polish** | B- | Frosted glass panels look great. But some areas feel utilitarian — raw data dumps, inconsistent spacing, no micro-animations, no loading states. |
| **Accessibility** | B | 64 a11y attributes, keyboard nav, WCAG AA contrast. Missing: ARIA live regions, screen reader announcements for game events, focus trapping in modals. |
| **Responsiveness** | D | Desktop-only. No breakpoint testing, no sidebar collapse, no mobile layout. |
| **Animation & Feedback** | D | Almost zero motion. No transitions on state changes, no entrance/exit animations, no hover microinteractions beyond opacity changes. |
| **Error & Empty States** | C- | Fail-soft engine philosophy keeps things from crashing, but UI shows raw fallbacks — no designed empty states, no friendly error messages. |
| **Onboarding / Learnability** | D | No tutorial, no contextual hints, no progressive reveal of UI complexity. Player dropped into full god-game UI cold. |
| **Performance** | B+ | 73+ memo/useMemo/useCallback optimizations. No profiling infrastructure. Convention-driven, not measurement-driven. |
| **Content Presentation** | B | Prose generator integrated. Word-scale system replacing numbers is excellent. But prose surfaces are small — narrative log is compact, location descriptions are sidebar-width. |

---

## What's Working Well

**Don't touch these — they're load-bearing and good:**

- **Progressive disclosure (3-tier agent info)** — tooltip → sidebar card → full modal. Familiarity-gated. Excellent pattern.
- **Sphere color system** — centralized in `sphereIcons.ts`, never hardcoded. Every sphere is visually distinct.
- **Overlay mutual exclusion** — `closeAllAgentOverlays()` prevents stacking. All overlays dismiss on Escape.
- **Dark Tapestry aesthetic** — the frosted glass panels, parchment text, gold accents create a cohesive atmosphere.
- **Word-scale system** — "Capable" instead of "67/100". Fits the fiction, avoids spreadsheet-brain.
- **Eye-icon zoom pattern** — consistent navigation from any entity reference to its map location.
- **Debug panel** — backtick toggle, 5 trace categories, 500-entry ring buffer. Developer-facing but doesn't leak into player UI.

---

## Frontend Backlog

### Priority 1: Player Experience Polish (High Impact, Moderate Effort)

These improvements make the game *feel* better without changing mechanics.

#### FE-01: Micro-animation System
**Why:** The UI is static. Panels appear/disappear instantly. State changes have no visual feedback. This makes the game feel like a dashboard, not a living world.
**What:**
- CSS transition on panel open/close (slide or fade, 150-200ms)
- Gentle pulse on essence changes (gold glow keyframe)
- Doom bar fill animation (not instant snap)
- Mandate tracker progress animation
- NarrativeLog new-entry slide-in
- HexTile hover lift/glow on interactive hexes
**Effort:** Medium (mostly CSS, some state wiring)

#### FE-02: Loading & Transition States
**Why:** World generation, tick processing, and prose generation all take time. Currently the UI just... waits.
**What:**
- Skeleton loaders for prose panels (location description, agent profile)
- Tick-processing indicator (subtle pulse on WorldPulse during computation)
- World-gen progress feedback (phase indicator during initial setup)
- Hex map initial render placeholder (before tiles load)
**Effort:** Medium

#### FE-03: Empty & Error State Design
**Why:** When an agent has no bonds, a location has no encounters, or a hex has no POIs — the UI shows nothing or raw fallback text.
**What:**
- Designed empty states for every panel (poetic/thematic, not "No data")
- Example: Empty retinue → "The cosmos stirs, but no souls yet attend your court."
- Error boundaries with themed fallback UI (not white screen of death)
- Missing hex tile graceful fallback (placeholder terrain pattern)
**Effort:** Low-Medium

#### FE-04: Narrative Log Expansion
**Why:** The prose generator produces rich content, but the narrative log is a small scrolling panel. The writing deserves more space.
**What:**
- Expandable narrative log (full-width mode, toggle between compact/expanded)
- Event grouping by tick (collapsible tick boundaries)
- Sphere-colored event type indicators (already started, needs consistency pass)
- "Story so far" summary view (aggregated key events across ticks)
**Effort:** Medium

---

### Priority 2: Accessibility & Inclusivity (Important, Low-Medium Effort)

#### FE-05: ARIA Live Regions
**Why:** Screen readers can't announce game events. NarrativeLog, EventLog, DoomBar changes are silent to assistive tech.
**What:**
- `aria-live="polite"` on NarrativeLog container
- `aria-live="assertive"` on critical alerts (doom threshold warnings, mandate failures)
- Role announcements for state transitions (phase changes, encounter starts)
**Effort:** Low

#### FE-06: Focus Management in Modals
**Why:** When AgentProfileModal or ScryOverlay opens, focus doesn't trap inside. Tab can escape to background elements.
**What:**
- Focus trap hook for all full-screen overlays
- Return focus to trigger element on close
- Visible focus indicator inside modals (currently only on some elements)
**Effort:** Low

#### FE-07: Keyboard-First Game Controls
**Why:** Core game actions (advance tick, select agenda, confirm intervention) should all be keyboard-accessible without hunting for buttons.
**What:**
- Keyboard shortcut overlay (? key to show shortcuts)
- Spacebar or Enter to advance tick
- Number keys for agenda selection
- Arrow keys for hex navigation
**Effort:** Medium

---

### Priority 3: Visual Consistency Pass (Medium Impact, Low Effort)

#### FE-08: Spacing & Layout Audit
**Why:** Components were built independently. Padding, margins, gap values vary between panels.
**What:**
- Audit all panel padding (standardize to 4px grid: 8/12/16/24/32px)
- Consistent gap between sidebar sections
- Uniform border-radius on glass panels
- Consistent icon sizing across all sidebar panels
**Effort:** Low

#### FE-09: Typography Hierarchy Enforcement
**Why:** Cinzel headers + Alegreya Sans body is defined but not always followed. Some components use raw Tailwind text sizes instead of the design system scale.
**What:**
- Audit all text elements against the 14px→29px type scale
- Ensure all headers use Cinzel, all body uses Alegreya Sans
- Add `font-display: swap` to all web font loads
- Verify contrast ratios on all text/background combinations
**Effort:** Low

#### FE-10: Color Token Consolidation
**Why:** CSS variables exist but some components still use inline hex values or Tailwind color classes (stone-700, stone-800) instead of design tokens.
**What:**
- Grep for hardcoded hex colors in components, replace with CSS vars
- Grep for Tailwind color classes (stone-*, slate-*, etc.), map to design tokens
- Create a color token reference page (extend style-tile.html or create component)
**Effort:** Low

---

### Priority 4: Responsiveness (Future, High Effort)

#### FE-11: Tablet Layout
**Why:** If this ships on Steam/web, tablet is a likely secondary platform.
**What:**
- Collapsible sidebar (hamburger toggle)
- Hex map touch gestures (pinch zoom, pan)
- Bottom sheet for overlays instead of sidebars on narrow screens
- Touch-friendly hit targets (minimum 44px)
**Effort:** High

#### FE-12: Ultrawide / Multi-Monitor Support
**Why:** God-games attract players with big screens.
**What:**
- Max-width constraint on main content (prevent 3000px-wide panels)
- Optional info panel pinning (two sidebars on ultrawide)
- Hex map fill behavior on wide viewports
**Effort:** Medium

---

### Priority 5: Performance Infrastructure (Low Urgency, Strategic)

#### FE-13: Render Performance Dashboard
**Why:** Convention says "profile before optimizing" but there's no profiling infrastructure. 73+ memo wrappers were added without measurement.
**What:**
- React DevTools Profiler integration guide in docs
- Performance budget: target 16ms render for tick advancement
- Identify heaviest components (likely HexMap with many tiles)
- Bundle size tracking (vite-plugin-visualizer)
**Effort:** Medium

#### FE-14: Large World Stress Test
**Why:** Current hex map works well at current world size. What happens at 2x, 5x, 10x?
**What:**
- Virtualized hex rendering (only render visible hexes)
- Agent list virtualization (if retinue grows past 50+)
- Lazy loading for agent profile data
**Effort:** High (only if needed)

---

### Priority 6: Player Onboarding (Future, High Impact)

#### FE-15: Contextual Hints System
**Why:** New players face a complex god-game UI with no guidance.
**What:**
- First-run hint bubbles pointing to key UI elements
- "What is this?" hover mode (toggle that shows explanations for any element)
- Tooltip enrichment — all game terms hyperlinked to concept definitions
**Effort:** High

#### FE-16: Tutorial Scenario
**Why:** A guided first world-cycle that introduces mechanics one at a time.
**What:**
- Scripted tutorial world (predetermined seed, constrained choices)
- Step-by-step overlay guidance
- Unlock UI elements progressively (don't show everything at once)
**Effort:** Very High (design + implementation)

---

## Recommended Next Sprint: "FE Polish Sprint #1"

**Scope:** FE-01 + FE-03 + FE-05 + FE-08 (micro-animations, empty states, ARIA live regions, spacing audit)

**Why this combination:**
- High visual impact (animations + empty states make the game feel alive)
- Low risk (CSS-heavy, no engine changes)
- Accessibility win (live regions are low effort, high value)
- Quick consistency improvement (spacing audit is a few hours)

**Estimated effort:** 2-3 focused sessions

---

## Appendix: Component Inventory Reference

| Category | Count | Key Components |
|----------|-------|---------------|
| Game/Simulation | 30 | GameView, ActionCard, ActionDrawer, NarrativeLog, AgendaPicker, ScryOverlay, StrandView, AgentWheel |
| Hex Map | 4 | HexMap, HexTile, HexDefs, CoastlineOverlay |
| Character Creation | 2 | AscendantSelection, ArchetypeCard |
| Cosmology Setup | 2 | CosmologyPanel, SphereSlider |
| Shared/Reusable | 6 | Tooltip, ProgressBar, SphereIcon, RivalIcon, EntityCard |
| Debug/Dev | 2 | DebugPanel, MagicGlowTiles |
| Taxonomy | 2 | TaxonomyViewer, NodeDetail |
| **Total** | **50+** | |
