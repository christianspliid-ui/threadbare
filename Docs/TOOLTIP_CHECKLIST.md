# Tooltip System Implementation Checklist

Use this checklist when writing the Tooltip System Plan. Reference items point to sections in `IMPLEMENTATION_PATTERNS.md`.

---

## COMPONENT STRUCTURE

- [ ] Create `src/components/shared/Tooltip.tsx`
  - [ ] Props interface with JSDoc comments (see: 1.1 Props Interface)
  - [ ] React.memo wrapper with named function
  - [ ] Default values in destructuring: `position='top'`, `delay=0`, `maxWidth='200px'`
  - [ ] Export as named export (not default)

- [ ] Props to implement:
  - [ ] `children: React.ReactNode` — element that triggers tooltip
  - [ ] `content: string | React.ReactNode` — tooltip body text
  - [ ] `position?: 'top' | 'bottom' | 'left' | 'right'` — placement
  - [ ] `delay?: number` — ms before showing (default: 300)
  - [ ] `maxWidth?: string` — tooltip width constraint (default: '200px')
  - [ ] `className?: string` — custom CSS class
  - [ ] `dataTestId?: string` — for testing

---

## STYLING

- [ ] Threadbare theme colors (see: Testing Framework section)
  - [ ] Background: `#0a0a0e` (matches HEX_MAP_BACKGROUND)
  - [ ] Border: `rgba(217, 119, 6, 0.2)` (amber/gold with low opacity)
  - [ ] Text: `#fef3c7` (amber-100)
  - [ ] Glow: `0 0 8px rgba(217, 119, 6, 0.5)` (color with 50% opacity)

- [ ] Module-level style constants (see: 5.2 AvatarHUD)
  ```typescript
  const TOOLTIP_STYLE = { ... };
  const ARROW_STYLE = { ... };
  const CONTENT_STYLE = { ... };
  ```

- [ ] Mix Tailwind + inline styles
  - [ ] Tailwind for layout: `absolute`, `z-50`, `rounded`
  - [ ] Inline styles for dynamic values: `color`, `backgroundColor`, `transform`

- [ ] Pointer/arrow (optional)
  - [ ] Small triangle pointing to trigger element
  - [ ] Position depends on `position` prop
  - [ ] Use CSS or small `<div>` element

---

## POSITIONING & VISIBILITY

- [ ] State: `isVisible` using `useState(false)` (see: 5.3 MandateTracker)
  - [ ] Show on hover (onMouseEnter)
  - [ ] Hide on mouse leave (onMouseLeave)
  - [ ] Hide on Escape key (useEffect + document.addEventListener)

- [ ] Positioning logic
  - [ ] Calculate pixel offsets for each position (top/bottom/left/right)
  - [ ] Constrain to viewport (check if tooltip would overflow)
  - [ ] Use inline style: `style={{ position: 'absolute', top: `${y}px`, left: `${x}px` }}`

- [ ] Delay before showing
  - [ ] Use `setTimeout()` in `onMouseEnter`
  - [ ] Clear timeout in `onMouseLeave`
  - [ ] Store timeoutId in `useRef()` to clear on unmount

---

## TESTING (see: 10. TEST PATTERNS)

Create `src/components/shared/__tests__/Tooltip.test.tsx`

- [ ] Test visibility toggle
  - [ ] Render hidden by default
  - [ ] Show on mouseEnter
  - [ ] Hide on mouseLeave

- [ ] Test content rendering
  - [ ] String content displays correctly
  - [ ] React.ReactNode content (components) renders

- [ ] Test positioning
  - [ ] Top position renders above trigger
  - [ ] Bottom position renders below trigger
  - [ ] Left/right positions render accordingly

- [ ] Test delay
  - [ ] Tooltip doesn't show immediately
  - [ ] Shows after delay ms
  - [ ] useTimer or vi.advanceTimersByTime() to advance clock

- [ ] Test keyboard
  - [ ] Escape key hides tooltip
  - [ ] Other keys don't affect it

- [ ] Test accessibility
  - [ ] role="tooltip" on container
  - [ ] aria-label on trigger or content
  - [ ] title attribute fallback (optional)

Example test structure (from DoomBar.test.tsx):
```typescript
// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Tooltip } from '../Tooltip';

describe('Tooltip', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders tooltip on hover', () => {
    const { container } = render(
      <Tooltip content="Test tooltip">
        <button>Trigger</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Trigger');
    fireEvent.mouseEnter(trigger);
    vi.advanceTimersByTime(300); // default delay

    expect(screen.getByText('Test tooltip')).toBeInTheDocument();
  });

  it('hides tooltip on mouse leave', () => {
    const { container } = render(
      <Tooltip content="Test tooltip">
        <button>Trigger</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Trigger');
    fireEvent.mouseEnter(trigger);
    vi.advanceTimersByTime(300);
    expect(screen.getByText('Test tooltip')).toBeInTheDocument();

    fireEvent.mouseLeave(trigger);
    expect(screen.queryByText('Test tooltip')).not.toBeInTheDocument();
  });

  it('closes on Escape key', () => {
    render(
      <Tooltip content="Test tooltip">
        <button>Trigger</button>
      </Tooltip>
    );

    fireEvent.mouseEnter(screen.getByText('Trigger'));
    vi.advanceTimersByTime(300);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText('Test tooltip')).not.toBeInTheDocument();
  });
});
```

---

## INTEGRATION

- [ ] Export from `src/components/shared/index.ts`
  ```typescript
  export { Tooltip } from './Tooltip';
  export type { TooltipProps } from './Tooltip';
  ```

- [ ] Type file: Decide if types go in component file or separate `types/tooltip.ts`
  - Codebase pattern: Keep in component file if small, extract if shared

- [ ] Use in other components (examples)
  - [ ] Wrap SphereIcon with tooltip: "Force Sphere — physical power"
  - [ ] Wrap influence tier badge with tooltip: "Tier name and description"
  - [ ] Wrap mandate status icons: "Mandate progress details"

---

## DOCUMENTATION

- [ ] Add JSDoc to `Tooltip.tsx`
  ```typescript
  /**
   * Tooltip — Displays contextual help on hover with theme-aware styling.
   *
   * Threadbare-themed tooltip with configurable position, delay, and max-width.
   * Hides on Escape key press. Used throughout UI for stat/mechanic explanations.
   *
   * Example:
   * <Tooltip content="Power of Motion" position="top">
   *   <SphereIcon sphereName="force" />
   * </Tooltip>
   */
  ```

- [ ] Update Obsidian vault (if needed)
  - [ ] Add `Systems/Tooltip.md` with design notes
  - [ ] Link from UI Components index

---

## OPTIONAL ENHANCEMENTS

- [ ] Customizable arrow size/visibility
- [ ] Staggered animation (fade-in over 200ms)
- [ ] Portal rendering (teleport to document.body to avoid overflow)
- [ ] Automatic position fallback (if tooltip overflows, try different position)
- [ ] Rich content support (bold, links, code)
- [ ] Theme prop (dark/light, different color palettes)

---

## REFERENCES

- See `IMPLEMENTATION_PATTERNS.md` for:
  - Section 1.1: Props interface pattern
  - Section 1.2: Icon component (similar structure)
  - Section 5.2: AvatarHUD (style constants + useMemo)
  - Section 5.3: MandateTracker (useState, useEffect, keyboard handling)
  - Section 10: Test patterns with vitest + @testing-library/react

- See `src/components/shared/` for working examples:
  - `ProgressBar.tsx` — simple shared component
  - `SphereIcon.tsx` — icon with props
  - `__tests__/ProgressBar.test.tsx` — test structure

- See `STYLE.md` for:
  - Threadbare color palette
  - Typography (Cinzel serif fonts)
  - Glow/shadow effects
  - Spacing/sizing conventions
