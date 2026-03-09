# UI Patterns — Frontend Interaction Conventions

This document records established interaction patterns for the game's React UI. Any agent building new components should check here first and follow existing conventions. If a new pattern is introduced, add it here in the same session.

**Scope:** React component behavior, prop conventions, interaction patterns, accessibility rules, performance norms.
**Not in scope:** Visual art direction, image generation prompts, color palettes — those live in `STYLE.md`.

---

## 1. Sidebar List Items → Map Navigation (Eye Icon)

Every list item in a sidebar or panel that references a map-located entity (agent, location, faction, landmark) gets a **zoom-to-location eye icon** next to its location text.

### Where it appears today

| Component | What it zooms to |
|-----------|-----------------|
| RetinuePanel agent rows | Agent's current location hex |
| AgentInfoCard (Tier 2 sidebar) | Selected agent's location hex |
| AvatarHUD (top-left overlay) | Ascendant's current hex |

### Implementation pattern

```tsx
{onZoomToLocation && (
  <button
    onClick={(e) => { e.stopPropagation(); onZoomToLocation(locationId); }}
    aria-label={`Zoom to ${locationName}`}
    className="flex-shrink-0 transition-opacity hover:opacity-70"
    style={{ color: 'var(--accent-gold-dim)', fontSize: 'var(--text-xs)', lineHeight: 1 }}
    title={`Zoom to ${locationName}`}
  >
    &#x1F441;
  </button>
)}
```

### Rules

- **Icon:** `&#x1F441;` (👁) — consistent across all usages
- **Color:** `var(--accent-gold-dim)` — subtle gold, secondary to the element name
- **Size:** `var(--text-xs)` — unobtrusive
- **Hover:** opacity transition (not color change)
- **Click:** `e.stopPropagation()` — prevents bubbling to parent row's select/click handler
- **Tooltip:** add a Tooltip wrapper or `title` attribute with brief description
- **Prop shape:** `onZoomToLocation?: (locationId: string) => void` — the handler in GameView resolves locationId → hex coordinates via graph node properties (`hexCol`/`hexRow`) and calls `handleHexClick`
- **AvatarHUD exception:** uses `onZoomToLocation?: () => void` (no param) since the ascendant's position is already known via `avatarPos`

### Extensibility

Any future sidebar list referencing map-located entities should follow this pattern. Likely candidates: faction panels, culture lists, landmark registries.

---

## 2. Progressive Disclosure Tiers

Agent information is gated by familiarity level across three UI tiers:

| Tier | Component | Trigger | What's shown |
|------|-----------|---------|-------------|
| 1 | Tooltip | Hover | Name + one-line summary (familiarity-aware via `agent.*` prefix in tooltipResolver) |
| 2 | AgentInfoCard | Click (sidebar) | Domain grid, values, bonds — sections gated by knowledge level |
| 3 | AgentProfileModal | "View Full Character Sheet" button | Generated quotes, backstory, portrait prompt — full profile |

### Navigation between tiers

- Tier 1 → Tier 2: click an agent in RetinuePanel or HexZoomView
- Tier 2 → Tier 3: click "View Full Character Sheet" button (footer) or "Sheet →" link (header)
- Tier 2 → back: "← Back" button returns to RetinuePanel
- Tier 3 → dismiss: Escape key or close button

### Rules

- No numeric stats are shown to the player — use verbal word scales from `domain-words.ts` (`getDomainWord`, `getValueWord`, `getReputationWord`, `getBondStrengthWord`)
- Knowledge level gates what sections are visible — don't show data the player hasn't "earned" through familiarity
- The `getAgentInfoCard()` and `getAgentFullProfile()` aggregators handle gating — components render what they receive

---

## 3. Overlay Stack and Mutual Exclusion

Multiple overlays can exist but only one should be active at a time. The interaction hooks manage mutual exclusion via `closeAllAgentOverlays()`.

| Overlay | Component | Z-order | Dismiss |
|---------|-----------|---------|---------|
| Action Drawer | ActionDrawer | Bottom drawer | Escape, close button, click outside |
| Narrative Log | NarrativeLog | Floating pill + overlay | Escape, close button |
| Intervention Confirm | InterventionConfirm | Popover on action card | Escape, cancel button |
| Agenda Picker | AgendaPicker | Center overlay | Escape, selection |
| Scry Court | ScryOverlay | Full-screen overlay | Escape, close button |
| Strand View | StrandView | Full-screen overlay | Escape, close button |
| Agent Profile | AgentProfileModal | Full-screen modal | Escape, close button |
| Debug Panel | DebugPanel | Right-side drawer | Backtick key toggle |

### Rules

- All overlays dismiss on Escape
- Close/dismiss buttons must have descriptive `aria-label` (e.g., "Close scry overlay", not just "Close")
- `useAgentInteraction` hook's `closeAllAgentOverlays()` is called before opening a new overlay to prevent stacking conflicts
- Overlays use `pointerEvents: 'auto'` to ensure they capture clicks
- **Fog of war guard:** hex zoom only opens for `'visible'` hexes — `handleHexClick` in `useViewNavigation` checks `visibilityMap` and silently ignores clicks on unexplored/remembered hexes

---

## 4. Popover Panels (Escape + Backdrop)

Popovers that expand inline (not full-screen overlays) use a consistent pattern: invisible backdrop at z-40, panel at z-50, Escape listener.

### Where it appears

- MandateTracker (compact bar → expanded detail)
- InterventionConfirm (action card → confirmation popover)
- AgendaPicker (intervention → agenda selection)

### Implementation pattern

```tsx
// Escape listener — attached only while expanded
useEffect(() => {
  if (!isExpanded) return;
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') setIsExpanded(false);
  };
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [isExpanded]);

// Backdrop (invisible click target) + panel
return (
  <>
    {isExpanded && (
      <div className="fixed inset-0 z-40" onClick={() => setIsExpanded(false)} />
    )}
    {isExpanded && (
      <div className="absolute z-50" onClick={e => e.stopPropagation()}>
        {/* Panel content */}
      </div>
    )}
  </>
);
```

### Rules

- Escape key always closes — `useEffect` attaches listener only while open, cleans up on unmount
- Backdrop sits at z-40 (invisible, full viewport), panel at z-50
- `e.stopPropagation()` on panel prevents clicks from passing through to backdrop
- Toggle element must be a `<button>` with `aria-expanded` for accessibility

---

## 5. Hover State via Direct Style Mutation

Hover effects are applied via inline `style` property mutations, not CSS classes. This is because many elements have dynamic base colors (sphere colors, tier colors) that can't be expressed in static Tailwind classes.

### Where it appears

- RetinuePanel agent rows (hover background)
- InterventionConfirm buttons (hover color brightness)
- AgendaPicker cards (border + background change)
- MandateTracker compact bar

### Implementation pattern

```tsx
onMouseEnter={(e) => {
  if (!isSelected) {
    (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)';
  }
}}
onMouseLeave={(e) => {
  if (!isSelected) {
    (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-raised)';
  }
}}
```

### Rules

- Guard with state check (don't apply hover if already selected/disabled)
- Use CSS variables or lookup values — never hardcode hex strings inline
- Add `transition: 'background-color 0.15s'` (or equivalent) in the element's base style for smoothness
- For simple opacity hover, prefer Tailwind `hover:opacity-70` over JS mutation

---

## 6. Horizontal Scroll Containers

Action cards and other multi-item rows use a horizontal scroll layout that prevents wrapping.

### Where it appears

- ActionDrawer (horizontal card row)

### Implementation pattern

```tsx
<div className="flex-1 overflow-x-auto overflow-y-hidden px-4 py-3">
  <div className="flex gap-3">
    {items.map(item => (
      <div key={item.id} className="flex-shrink-0">
        <Card item={item} />
      </div>
    ))}
  </div>
</div>
```

### Rules

- Parent: `overflow-x-auto overflow-y-hidden`
- Inner row: `flex gap-3` (or `gap-2` for tighter spacing)
- Each item: `flex-shrink-0` to prevent compression
- Padding on the scroll container prevents items from touching panel edges

---

## 7. Multi-State Enum Rendering

When a UI element has 3+ visual states (e.g., filled/half/empty, locked/available/disabled), extract a pure renderer function keyed by a string enum.

### Where it appears

- MandateTracker stage pips (filled/half/empty)
- InterventionConfirm range indicators (in_range/out_of_range/unlimited/unknown)
- HexTile visibility states (unexplored/remembered/visible)
- ActionCard lock states (available/locked-tier/locked-cost)

### Implementation pattern

```tsx
type PipStatus = 'filled' | 'half' | 'empty';

function renderStagePip(status: PipStatus, color: string) {
  if (status === 'filled') return <div style={{ backgroundColor: color }} />;
  if (status === 'half') return <div style={{ borderColor: color }} />;
  return <div style={{ borderColor: `${color}4d` }} />;
}
```

### Rules

- Define an explicit TypeScript union type for the states (no magic strings or numbers)
- Extract the renderer to a separate function — keeps JSX map bodies clean
- Use opacity/alpha variations between states (e.g., full color → 30% alpha)
- Fallback gracefully for unknown states

---

## 8. Compound State in Custom Hooks

GameView delegates all state management to custom hooks. Each hook groups related state (overlay state, pending actions, computed data) and returns a flat object.

### Where it appears

- `useAgentInteraction` (12+ useState, manages overlay mutual exclusion, pending interventions, agenda flow)
- `useSimulation` (game state, tick loop, running/paused)
- `useViewNavigation` (view level state machine: world → hex-zoom → location)
- `useAvatarData` (avatar position, sphere color, location overlays)
- `useHexZoomData` (derived hex zoom view data)
- `useScry` (scry state + handlers)

### Rules

- **Group related state** with section comments (`// Overlay state`, `// Pending action state`)
- **Mutual exclusion:** create a `closeAll*()` callback that resets all overlay state — called before opening any new overlay
- **Tight memo deps:** derived values (`useMemo`) should depend on specific fields, not whole objects. Avoid `gameState.tick` in deps unless the value truly changes per tick
- **Return a flat object** — GameView destructures hook results and passes them down as props. No nested objects
- **Never compute expensive values in render** — always `useMemo` with carefully chosen deps

---

## 9. SVG Layout Constants

All SVG/canvas-based components (hex map, hex zoom, breadcrumbs) extract every magic number into module-level typed constant objects.

### Where it appears

- HexZoomView (LAYOUT, COLORS, OPACITY, FONT — 40+ constants)
- HexBreadcrumb (TERRAIN_COLORS)
- AgentWheel constants (WHEEL_CONFIG, now removed but pattern remains in ActionCard)

### Implementation pattern

```tsx
const LAYOUT = {
  VIEW_W: 800,
  VIEW_H: 700,
  HEX_RADIUS: 320,
  LOCATION_RADIUS: 48,
  AGENT_SIZE: 22,
  POLYGON_FRACTION: 0.55,
} as const;

const COLORS = {
  HEX_FILL: '#0a0a0e',
  HEX_BORDER: '#d4a040',
  LOCATION_FILL: '#1a1a1f',
} as const;

// Derived constants (computed once at module load)
const CENTER_X = LAYOUT.VIEW_W / 2;
const CENTER_Y = LAYOUT.VIEW_H / 2;
```

### Rules

- Group into typed objects by concern: `LAYOUT`, `COLORS`, `OPACITY`, `FONT`
- Use `as const` for TypeScript narrow types
- Precompute derived values (center coordinates, etc.) at module level
- Document non-obvious values with inline comments
- This pattern is **mandatory** for SVG/canvas components — makes visual tuning a number change, not a code hunt

---

## 10. Glyph and Color Lookup Tables

Sphere colors, tier colors, and icon glyphs are resolved via module-level `Record<K, V>` lookup tables with fallbacks.

### Where it appears

- RetinuePanel (`TIER_COLORS: Record<number, string>`)
- ActionCard (`getWheelSlotGlyph()`)
- EssencePanel (sphere icon lookup)
- HexBreadcrumb (`TERRAIN_COLORS`)

### Implementation pattern

```tsx
const TIER_COLORS: Record<number, string> = {
  1: '#6b7280',  // gray
  2: '#a78bfa',  // purple
  3: '#eab308',  // gold
  4: '#ef4444',  // red
};

// Always provide a fallback
const color = TIER_COLORS[agent.tier] || '#78716c';
```

### Rules

- Define at module level (not inside components)
- Always provide a fallback value in the accessor (`|| defaultValue`)
- For sphere colors specifically, use `getSphereColor()` — never hardcode sphere hex values
- Use `Record<K, V>` for TypeScript compile-time key safety

---

## 11. Portal-Rendered Positioning (Two-Phase)

Tooltips and other viewport-aware elements use a two-phase positioning strategy: estimate position, then measure actual size and correct before paint.

### Where it appears

- Tooltip component (most sophisticated: full viewport clamping + flip above/below)
- Debug panel (fixed right-side drawer)

### Implementation pattern

```tsx
// Phase 1: estimate position from trigger rect
const calculatePosition = () => {
  const triggerRect = triggerRef.current.getBoundingClientRect();
  let left = triggerRect.left + triggerRect.width / 2 - TOOLTIP_MAX_WIDTH / 2;
  // Clamp to viewport margins
  left = Math.max(VIEWPORT_MARGIN, Math.min(left, window.innerWidth - TOOLTIP_MAX_WIDTH - VIEWPORT_MARGIN));
  setPosition({ left, top: triggerRect.top - TOOLTIP_OFFSET, placement: 'above' });
};

// Phase 2: measure actual rendered size + correct overflow before paint
useLayoutEffect(() => {
  if (!isVisible || !position || position.corrected) return;
  const rect = tooltipRef.current.getBoundingClientRect();
  if (rect.top < VIEWPORT_MARGIN) {
    setPosition({ ...position, top: triggerRect.bottom + TOOLTIP_OFFSET, placement: 'below', corrected: true });
  }
}, [isVisible, position]);

return createPortal(content, document.body);
```

### Rules

- **Phase 1** (estimate): calculate from trigger `getBoundingClientRect()`, clamp to `VIEWPORT_MARGIN` (8px) on all edges
- **Phase 2** (correct): `useLayoutEffect` — measures the rendered element and flips/adjusts before the browser paints. Use a `corrected` flag to prevent infinite loops
- **Portal to `document.body`** for z-stacking independence from parent overflow/positioning
- For chained/nested positioning (tooltip chains), calculate relative to the parent tooltip, not the viewport

---

## Panel Styling (Threadbare)

All sidebar panels and HUD elements follow the Threadbare dark aesthetic.

- **Background:** `bg-stone-800` or darker — never lighter than `bg-stone-700`
- **Text primary:** `var(--text-primary)`
- **Text secondary:** `var(--text-secondary)` for labels, locations, metadata
- **Text tertiary:** `var(--text-tertiary)` for least-important info
- **Accent:** sphere colors from `getSphereColor()` for sphere-related elements — never hardcoded hex values
- **Gold accent:** `var(--accent-gold-dim)` for interactive affordances (eye icons, links)
- **Borders:** subtle, `border-stone-700` or `border-stone-600` — never bright

---

## Accessibility Baseline

Minimum requirements for all interactive elements:

- **Keyboard:** all clickable elements must respond to Enter and Space (add `onKeyDown` handler for non-button elements like SVG circles, div rows)
- **Focus:** visible `focus:ring` outline on interactive elements
- **Labels:** all buttons have descriptive `aria-label` — icon-only buttons especially
- **Semantics:** use `role="list"` / `role="listitem"` for list-like structures that aren't `<ul>`/`<li>`
- **Landmarks:** left sidebar wrapped in `<nav>`, main content in `<main>`
- **Expanded state:** toggleable popovers use `aria-expanded` on their trigger button

---

## Performance Conventions

- **React.memo:** wrap any component rendered inside a list or that receives stable-but-referentially-new props (RetinuePanel, RivalPanel, ActionCard, HexZoomView, LocationView, HexBreadcrumb)
- **useCallback:** all event handlers passed as props — especially in GameView and hooks
- **useMemo:** derived data computations that depend on gameState — but don't over-include `gameState.tick` in dependency arrays (causes per-tick recomputation of everything)
- **Constants:** extract magic numbers and inline style objects to module-level constants — never create object literals inside render
- **Conditional computation:** expensive derived values (wheel slots, hex zoom data) should guard with an early-out (`if (!selectedAgentId || !drawerOpen) return null`) before computing

---

## Changelog

*(2026-03-09 — Created. 11 numbered interaction patterns + 3 cross-cutting sections (panel styling, accessibility, performance). Sourced from codebase audit of 15+ component/hook files.)*
