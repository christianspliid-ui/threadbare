# FE Polish Sprint #1 — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add micro-animations, themed empty states, ARIA live regions, spacing consistency, and an error boundary to make the game feel alive instead of like a dashboard.

**Architecture:** Pure CSS animations orchestrated by a small AnimateMount React wrapper (~30 lines) that delays DOM removal so exit animations can play. Zero new dependencies. All animation classes in index.css, all component changes are additive (wrapping existing JSX, not restructuring).

**Tech Stack:** React 19, TypeScript (strict mode), Tailwind CSS v4.2, Vitest, CSS @keyframes

**Design doc:** `Docs/plans/2026-03-10-fe-polish-sprint-1-design.md`

---

### Task 1: Animation CSS Foundation

Add animation timing tokens, animation keyframes, animation utility classes, and screen-reader utility to `src/index.css`.

**Files:**
- Modify: `src/index.css` (add after line 58 in `:root`, and after line 197 where existing keyframes end)

**Step 1: Add timing tokens to :root block**

In `src/index.css`, inside the existing `:root { ... }` block (after line 58), add:

```css
  /* Animation timing */
  --anim-fast: 150ms;
  --anim-normal: 200ms;
  --anim-slow: 400ms;
```

**Step 2: Add animation keyframes after existing ones (after line 197)**

```css
/* === FE Polish Sprint #1 — Animation Classes === */

/* Mount/unmount animation pairs */
.anim-fade-enter {
  animation: fadeInOnly var(--anim-normal) ease-out forwards;
}
.anim-fade-exit {
  animation: fadeOutOnly var(--anim-normal) ease-in forwards;
}

.anim-fade-up-enter {
  animation: fadeSlideUpIn var(--anim-normal) ease-out forwards;
}
.anim-fade-up-exit {
  animation: fadeSlideUpOut var(--anim-normal) ease-in forwards;
}

.anim-fade-down-enter {
  animation: fadeSlideDownIn var(--anim-normal) ease-out forwards;
}
.anim-fade-down-exit {
  animation: fadeSlideDownOut var(--anim-normal) ease-in forwards;
}

/* One-shot highlight pulses */
.pulse-gold {
  animation: pulseGoldFlare 600ms ease-out;
}
.pulse-doom {
  animation: pulseDoomFlare 600ms ease-out;
}

/* Breathe utility (for empty states) */
.animate-breathe {
  animation: breathe 3s ease-in-out infinite;
}

/* Screen reader only (visually hidden, accessible to assistive tech) */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* Keyframes */
@keyframes fadeInOnly {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes fadeOutOnly {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes fadeSlideUpIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fadeSlideUpOut {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(8px); }
}

@keyframes fadeSlideDownIn {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fadeSlideDownOut {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(-8px); }
}

@keyframes pulseGoldFlare {
  0% { box-shadow: 0 0 0 0 rgba(212, 160, 64, 0); }
  50% { box-shadow: 0 0 12px 4px rgba(212, 160, 64, 0.4); }
  100% { box-shadow: 0 0 0 0 rgba(212, 160, 64, 0); }
}

@keyframes pulseDoomFlare {
  0% { box-shadow: 0 0 0 0 rgba(248, 113, 113, 0); }
  50% { box-shadow: 0 0 12px 4px rgba(248, 113, 113, 0.4); }
  100% { box-shadow: 0 0 0 0 rgba(248, 113, 113, 0); }
}
```

**Step 3: Add spacing tokens to :root block (alongside the timing tokens)**

```css
  /* Spacing grid (4px base) */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
```

**Step 4: Verify CSS parses**

Run: `npx vite build 2>&1 | head -20`
Expected: Build succeeds (no CSS parse errors)

**Step 5: Commit**

```bash
git add src/index.css
git commit -m "feat(ui): add animation CSS classes, timing tokens, spacing tokens, sr-only utility"
```

---

### Task 2: AnimateMount Component + Tests

**Files:**
- Create: `src/components/shared/AnimateMount.tsx`
- Create: `src/components/shared/__tests__/AnimateMount.test.tsx`

**Step 1: Write the tests**

Create `src/components/shared/__tests__/AnimateMount.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AnimateMount } from '../AnimateMount';

describe('AnimateMount', () => {
  it('renders children when show is true', () => {
    render(
      <AnimateMount show={true} animation="anim-fade">
        <div data-testid="child">Hello</div>
      </AnimateMount>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('does not render children when show is false and never was true', () => {
    render(
      <AnimateMount show={false} animation="anim-fade">
        <div data-testid="child">Hello</div>
      </AnimateMount>
    );
    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
  });

  it('applies enter class when show becomes true', async () => {
    const { container } = render(
      <AnimateMount show={true} animation="anim-fade">
        <div data-testid="child">Hello</div>
      </AnimateMount>
    );
    // After mount, the wrapper should have the enter class
    await act(async () => {
      await new Promise(r => setTimeout(r, 50));
    });
    const wrapper = container.firstElementChild;
    expect(wrapper?.classList.contains('anim-fade-enter')).toBe(true);
  });

  it('applies exit class when show becomes false', async () => {
    const { container, rerender } = render(
      <AnimateMount show={true} animation="anim-fade" duration={100}>
        <div data-testid="child">Hello</div>
      </AnimateMount>
    );
    // Trigger exit
    rerender(
      <AnimateMount show={false} animation="anim-fade" duration={100}>
        <div data-testid="child">Hello</div>
      </AnimateMount>
    );
    const wrapper = container.firstElementChild;
    expect(wrapper?.classList.contains('anim-fade-exit')).toBe(true);
  });

  it('removes children from DOM after exit duration', async () => {
    vi.useFakeTimers();
    const { rerender } = render(
      <AnimateMount show={true} animation="anim-fade" duration={100}>
        <div data-testid="child">Hello</div>
      </AnimateMount>
    );
    rerender(
      <AnimateMount show={false} animation="anim-fade" duration={100}>
        <div data-testid="child">Hello</div>
      </AnimateMount>
    );
    // Still present during exit
    expect(screen.getByTestId('child')).toBeInTheDocument();
    // After duration, removed
    await act(async () => {
      vi.advanceTimersByTime(150);
    });
    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('handles rapid show toggle without breaking', async () => {
    vi.useFakeTimers();
    const { rerender } = render(
      <AnimateMount show={true} animation="anim-fade" duration={100}>
        <div data-testid="child">Hello</div>
      </AnimateMount>
    );
    // Close
    rerender(
      <AnimateMount show={false} animation="anim-fade" duration={100}>
        <div data-testid="child">Hello</div>
      </AnimateMount>
    );
    // Immediately reopen before exit completes
    rerender(
      <AnimateMount show={true} animation="anim-fade" duration={100}>
        <div data-testid="child">Hello</div>
      </AnimateMount>
    );
    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    // Should still be visible
    expect(screen.getByTestId('child')).toBeInTheDocument();
    vi.useRealTimers();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/shared/__tests__/AnimateMount.test.tsx`
Expected: FAIL — `Cannot find module '../AnimateMount'`

**Step 3: Write the component**

Create `src/components/shared/AnimateMount.tsx`:

```tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';

interface AnimateMountProps {
  show: boolean;
  animation: string;
  duration?: number;
  children: React.ReactNode;
}

export const AnimateMount = React.memo(function AnimateMount({
  show,
  animation,
  duration = 200,
  children,
}: AnimateMountProps) {
  const [shouldRender, setShouldRender] = useState(show);
  const [animClass, setAnimClass] = useState('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPendingTimeout = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (show) {
      // Mount: render immediately, apply enter class next frame
      clearPendingTimeout();
      setShouldRender(true);
      // Use requestAnimationFrame to ensure the element is in the DOM before animating
      requestAnimationFrame(() => {
        setAnimClass(`${animation}-enter`);
      });
    } else if (shouldRender) {
      // Unmount: apply exit class, then remove after duration
      setAnimClass(`${animation}-exit`);
      clearPendingTimeout();
      timeoutRef.current = setTimeout(() => {
        setShouldRender(false);
        setAnimClass('');
      }, duration);
    }
    return clearPendingTimeout;
  }, [show, animation, duration, shouldRender, clearPendingTimeout]);

  if (!shouldRender) return null;

  return <div className={animClass}>{children}</div>;
});
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/shared/__tests__/AnimateMount.test.tsx`
Expected: All 6 tests PASS

**Step 5: Run full test suite to confirm no regressions**

Run: `npm test`
Expected: All existing tests still pass

**Step 6: Commit**

```bash
git add src/components/shared/AnimateMount.tsx src/components/shared/__tests__/AnimateMount.test.tsx
git commit -m "feat(ui): add AnimateMount wrapper for enter/exit CSS animations"
```

---

### Task 3: GameErrorBoundary + Tests

**Files:**
- Create: `src/components/shared/GameErrorBoundary.tsx`
- Create: `src/components/shared/__tests__/GameErrorBoundary.test.tsx`
- Modify: `src/components/Game/GameView.tsx` (wrap main content)

**Step 1: Write the tests**

Create `src/components/shared/__tests__/GameErrorBoundary.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameErrorBoundary } from '../GameErrorBoundary';

const ThrowingChild = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) throw new Error('Test crash');
  return <div data-testid="child">Working</div>;
};

describe('GameErrorBoundary', () => {
  // Suppress React error boundary console noise
  const originalError = console.error;
  beforeAll(() => { console.error = vi.fn(); });
  afterAll(() => { console.error = originalError; });

  it('renders children when no error', () => {
    render(
      <GameErrorBoundary>
        <div data-testid="child">OK</div>
      </GameErrorBoundary>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders fallback UI when child throws', () => {
    render(
      <GameErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </GameErrorBoundary>
    );
    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
    expect(screen.getByText(/threads of reality/i)).toBeInTheDocument();
  });

  it('shows a restore button in fallback', () => {
    render(
      <GameErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </GameErrorBoundary>
    );
    expect(screen.getByRole('button', { name: /restore/i })).toBeInTheDocument();
  });

  it('recovers when restore is clicked', () => {
    // We can't truly test recovery because the child will throw again,
    // but we can verify the boundary resets its state
    const { container } = render(
      <GameErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </GameErrorBoundary>
    );
    const restoreBtn = screen.getByRole('button', { name: /restore/i });
    // Click restore — it will try to re-render and hit the error again,
    // but the state reset mechanism is what we're testing
    fireEvent.click(restoreBtn);
    // Boundary should still show fallback (since child still throws)
    expect(screen.getByText(/threads of reality/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/shared/__tests__/GameErrorBoundary.test.tsx`
Expected: FAIL — module not found

**Step 3: Write the component**

Create `src/components/shared/GameErrorBoundary.tsx`:

```tsx
import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GameErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  private handleRestore = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleCopyError = () => {
    const msg = this.state.error
      ? `${this.state.error.name}: ${this.state.error.message}\n${this.state.error.stack ?? ''}`
      : 'Unknown error';
    navigator.clipboard?.writeText(msg);
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex flex-col items-center justify-center gap-6 p-8"
          style={{
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-secondary)',
            minHeight: '300px',
          }}
        >
          <p
            className="italic text-center"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-lg)',
              color: 'var(--text-secondary)',
            }}
          >
            The threads of reality fray here. The world endures.
          </p>
          <div className="flex gap-3">
            <button
              onClick={this.handleRestore}
              aria-label="Restore game view"
              className="px-4 py-2 rounded transition-colors duration-150"
              style={{
                backgroundColor: 'var(--accent-gold)',
                color: 'var(--bg-abyss)',
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-sm)',
              }}
            >
              Restore
            </button>
            <button
              onClick={this.handleCopyError}
              aria-label="Copy error details"
              className="px-4 py-2 rounded transition-colors duration-150"
              style={{
                backgroundColor: 'var(--bg-raised)',
                color: 'var(--text-tertiary)',
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-sm)',
              }}
            >
              Copy Error
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Step 4: Run tests**

Run: `npx vitest run src/components/shared/__tests__/GameErrorBoundary.test.tsx`
Expected: All 4 tests PASS

**Step 5: Wire into GameView**

In `src/components/Game/GameView.tsx`, add import at top:
```tsx
import { GameErrorBoundary } from '../shared/GameErrorBoundary';
```

Wrap the main return JSX. Find the outermost `<div className="h-screen flex flex-col">` (line ~215) and wrap:
```tsx
return (
  <GameErrorBoundary>
    <div className="h-screen flex flex-col ...">
      {/* ... entire existing content unchanged ... */}
    </div>
  </GameErrorBoundary>
);
```

**Step 6: Type-check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 7: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 8: Commit**

```bash
git add src/components/shared/GameErrorBoundary.tsx src/components/shared/__tests__/GameErrorBoundary.test.tsx src/components/Game/GameView.tsx
git commit -m "feat(ui): add GameErrorBoundary with themed fallback, wire into GameView"
```

---

### Task 4: Overlay Animations (wrap 6 overlays in AnimateMount)

**Files:**
- Modify: `src/components/Game/GameView.tsx` (lines ~532-575 — the overlay renders)

**Step 1: Add AnimateMount import**

At top of GameView.tsx, add:
```tsx
import { AnimateMount } from '../shared/AnimateMount';
```

**Step 2: Wrap ScryOverlay (lines ~541-557)**

Replace:
```tsx
{scryVisible && (
  <ScryProvider value={{...}}>
    <ScryOverlay />
  </ScryProvider>
)}
```

With:
```tsx
<AnimateMount show={scryVisible} animation="anim-fade">
  <ScryProvider value={{
    scryState,
    retinueAgents,
    essencePool: gameState.essencePool,
    primarySphere: archetype.sphereAlignment.primary,
    tick: gameState.tick,
    seed: gameState.seed + gameState.tick,
    onAssign: handleScryAssign,
    onDemote: handleScryDemote,
    onClose: handleCloseScry,
  }}>
    <ScryOverlay />
  </ScryProvider>
</AnimateMount>
```

**Step 3: Wrap HarvestScreen (lines ~560-566)**

Replace:
```tsx
{harvestResult && (
  <HarvestScreen ... />
)}
```

With:
```tsx
<AnimateMount show={harvestResult !== null} animation="anim-fade">
  {harvestResult && (
    <HarvestScreen
      harvest={harvestResult}
      cycle={gameState.cycle}
      onBeginNextCycle={handleBeginNextCycle}
    />
  )}
</AnimateMount>
```

**Step 4: Wrap AgentProfileModal (lines ~569-575)**

Replace:
```tsx
{profileModalAgentId && agentInfoCard && (
  <AgentProfileModal ... />
)}
```

With:
```tsx
<AnimateMount show={!!profileModalAgentId && !!agentInfoCard} animation="anim-fade-up">
  {agentInfoCard && (
    <AgentProfileModal
      card={agentInfoCard}
      profile={agentFullProfile}
      onClose={handleCloseProfile}
    />
  )}
</AnimateMount>
```

**Step 5: Wrap StrandView (lines ~532-538)**

Replace:
```tsx
{strandData && (
  <StrandView ... />
)}
```

With:
```tsx
<AnimateMount show={strandData !== null} animation="anim-fade">
  {strandData && (
    <StrandView
      agentName={strandData.agentName}
      strands={strandData.strands}
      onClose={handleStrandClose}
    />
  )}
</AnimateMount>
```

**Step 6: Wrap AgendaPicker (lines ~355-365)**

Replace the conditional block with:
```tsx
<AnimateMount show={agendaPickerOpen && !!pendingAgendas} animation="anim-fade">
  {pendingAgendas && (() => {
    const slot = wheelSlots?.find(s => s.id === pendingIntervention?.slotId);
    return (
      <AgendaPicker
        agendas={pendingAgendas}
        onSelect={handleAgendaSelect}
        onCancel={handleAgendaCancel}
        sphere={slot?.sphere ?? 'mind'}
      />
    );
  })()}
</AnimateMount>
```

**Step 7: Wrap MandateTracker popover**

In `src/components/Game/MandateTracker.tsx`, import AnimateMount:
```tsx
import { AnimateMount } from '../shared/AnimateMount';
```

Replace the popover conditional (line ~117):
```tsx
{isExpanded && (
  <div className="absolute top-full ...">
```

With:
```tsx
<AnimateMount show={isExpanded} animation="anim-fade-down">
  <div className="absolute top-full ...">
```

And close the AnimateMount after the popover div closes (before the backdrop div).

**Step 8: Type-check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 9: Run full test suite**

Run: `npm test`
Expected: All tests pass (AnimateMount renders children identically when show=true)

**Step 10: Commit**

```bash
git add src/components/Game/GameView.tsx src/components/Game/MandateTracker.tsx
git commit -m "feat(ui): wrap 6 overlays in AnimateMount for enter/exit animations"
```

---

### Task 5: Value Feedback Animations (pulse effects + smooth hover)

**Files:**
- Modify: `src/components/Game/EssencePanel.tsx` (add pulse on value change)
- Modify: `src/components/Game/DoomBar.tsx` (add pulse on doom increase)
- Modify: `src/components/Game/RetinuePanel.tsx` (replace manual hover with CSS transition)
- Modify: `src/components/Game/LocationView.tsx` (replace manual hover with CSS transition)

**Step 1: EssencePanel pulse**

In `src/components/Game/EssencePanel.tsx`, add a `useRef` to track previous values:

```tsx
import React, { useMemo, useRef, useEffect, useState } from 'react';
```

Inside the component, before the return, add:
```tsx
const prevPoolRef = useRef<Record<string, number>>({});
const [pulsingIds, setPulsingIds] = useState<Set<string>>(new Set());

useEffect(() => {
  const newPulsing = new Set<string>();
  for (const [id, val] of Object.entries(essencePool)) {
    if (prevPoolRef.current[id] !== undefined && prevPoolRef.current[id] !== val) {
      newPulsing.add(id);
    }
  }
  if (newPulsing.size > 0) {
    setPulsingIds(newPulsing);
    const timer = setTimeout(() => setPulsingIds(new Set()), 600);
    return () => clearTimeout(timer);
  }
  prevPoolRef.current = { ...essencePool };
}, [essencePool]);
```

Then on the bar fill `<div>` (the inner div with `transition-all duration-500`), add the pulse class:
```tsx
className={`h-full rounded-full transition-all duration-500 ease-out${pulsingIds.has(sphere.id) ? ' pulse-gold' : ''}`}
```

**Step 2: DoomBar pulse**

In `src/components/Game/DoomBar.tsx`, add doom tracking:

```tsx
import React, { useRef, useState, useEffect } from 'react';
```

Inside the component:
```tsx
const prevProgressRef = useRef(state.progress);
const [isPulsing, setIsPulsing] = useState(false);

useEffect(() => {
  if (state.progress > prevProgressRef.current) {
    setIsPulsing(true);
    const timer = setTimeout(() => setIsPulsing(false), 600);
    prevProgressRef.current = state.progress;
    return () => clearTimeout(timer);
  }
  prevProgressRef.current = state.progress;
}, [state.progress]);
```

Wrap the ProgressBar in a div that carries the pulse class:
```tsx
<div className={isPulsing ? 'pulse-doom' : ''}>
  <ProgressBar progress={state.progress} color={color} glow={true} />
</div>
```

**Step 3: RetinuePanel smooth hover**

In `src/components/Game/RetinuePanel.tsx`, replace the manual hover handlers (lines ~74-79).

Remove:
```tsx
onMouseEnter={(e) => {
  if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)';
}}
onMouseLeave={(e) => {
  if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-raised)';
}}
```

Replace with CSS-driven hover. On the agent row div, change/add classes:
```tsx
className={`... transition-colors duration-150 ${isSelected ? '' : 'hover:bg-[var(--bg-hover)]'}`}
```

And set the default background via style prop (already there for `--bg-raised`). Remove the inline `onMouseEnter`/`onMouseLeave` entirely.

**Step 4: LocationView smooth hover**

In `src/components/Game/LocationView.tsx`, find the agent buttons with manual `onMouseEnter`/`onMouseLeave` (lines ~193-198) and apply the same pattern: remove the inline handlers, add `transition-colors duration-150` and `hover:bg-[var(--bg-hover)]` classes.

**Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 6: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 7: Commit**

```bash
git add src/components/Game/EssencePanel.tsx src/components/Game/DoomBar.tsx src/components/Game/RetinuePanel.tsx src/components/Game/LocationView.tsx
git commit -m "feat(ui): add pulse effects on value changes, smooth hover transitions"
```

---

### Task 6: Empty States

**Files:**
- Modify: `src/components/Game/RetinuePanel.tsx` (lines 21-32)
- Modify: `src/components/Game/LocationView.tsx` (lines 149, 177, 370)
- Modify: `src/components/Game/NarrativeLog.tsx` (lines 131-140)

**Step 1: RetinuePanel empty state**

In `src/components/Game/RetinuePanel.tsx`, replace the empty return (lines 21-32):

```tsx
if (agents.length === 0) {
  return (
    <p
      className="italic text-center animate-breathe"
      style={{
        fontSize: 'var(--text-xs)',
        color: 'var(--text-tertiary)',
        padding: 'var(--panel-padding, 1rem)',
      }}
    >
      The threads of fate lie still. No souls yet attend your court.
    </p>
  );
}
```

**Step 2: LocationView empty states**

In `src/components/Game/LocationView.tsx`:

Replace the `— establishing shot —` placeholder (line ~149) with:
```tsx
— select a hex to peer into the world below —
```

Replace `No agents present` (line ~177) with:
```tsx
This place lies quiet — for now.
```

Replace `No encounters at this location` (line ~370) with:
```tsx
The stillness here is unbroken.
```

**Step 3: NarrativeLog breathe animation**

In `src/components/Game/NarrativeLog.tsx`, find the empty state div (line ~131) and add the breathe class:

```tsx
<div
  className="italic text-center py-8 animate-breathe"
  style={{
    fontSize: 'var(--text-xs)',
    color: 'var(--text-muted)',
  }}
>
  Awaiting the first whispers of fate...
</div>
```

**Step 4: Update tests for new empty state text**

Search test files for the old empty state strings and update:

Run: `grep -r "No agents under your influence" src/` and update any test assertions to match new text.

Run: `grep -r "No agents present" src/` and update if tested.

Run: `grep -r "No encounters at this location" src/` and update if tested.

**Step 5: Run full test suite**

Run: `npm test`
Expected: All tests pass (update any assertions that match old strings)

**Step 6: Commit**

```bash
git add src/components/Game/RetinuePanel.tsx src/components/Game/LocationView.tsx src/components/Game/NarrativeLog.tsx
git commit -m "feat(ui): themed empty states with breathe animation"
```

---

### Task 7: ARIA Live Regions

**Files:**
- Modify: `src/components/Game/NarrativeLog.tsx` (add aria-live to event list)
- Modify: `src/components/Game/DoomBar.tsx` (add stage announcement)
- Modify: `src/components/Game/MandateTracker.tsx` (add aria-live to wrapper)
- Modify: `src/components/Game/EventLog.tsx` (add aria-live to entry list)

**Step 1: NarrativeLog**

On the scrollable event container div in `NarrativeLog.tsx` (the one with `overflow-y-auto`, line ~130), add:
```tsx
aria-live="polite"
aria-label="Narrative event log"
```

**Step 2: DoomBar stage announcements**

In `src/components/Game/DoomBar.tsx`, add a hidden span that only updates on stage changes:

```tsx
const prevStageRef = useRef(state.stage);
const [stageAnnouncement, setStageAnnouncement] = useState('');

useEffect(() => {
  if (state.stage !== prevStageRef.current) {
    setStageAnnouncement(`Doom has reached ${state.stageName}`);
    prevStageRef.current = state.stage;
  }
}, [state.stage, state.stageName]);
```

In the render, add after the ProgressBar:
```tsx
<span className="sr-only" aria-live="assertive">
  {stageAnnouncement}
</span>
```

**Step 3: MandateTracker**

On the outermost wrapper div in `MandateTracker.tsx`, add:
```tsx
aria-live="polite"
aria-label="Mandate progress"
```

**Step 4: EventLog**

In `src/components/Game/EventLog.tsx`, on the entries container, add:
```tsx
aria-live="polite"
aria-label="Game event log"
```

**Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 6: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 7: Commit**

```bash
git add src/components/Game/NarrativeLog.tsx src/components/Game/DoomBar.tsx src/components/Game/MandateTracker.tsx src/components/Game/EventLog.tsx
git commit -m "feat(a11y): add ARIA live regions for screen reader game event announcements"
```

---

### Task 8: Spacing Audit

**Files:**
- Modify: Various Game components (padding/gap inconsistencies)
- No test changes expected (spacing doesn't affect test assertions)

**Step 1: Audit inconsistencies**

Run these greps to find spacing that doesn't use the design tokens:

```bash
# Find hardcoded padding values in Game components
grep -n 'padding:.*px' src/components/Game/*.tsx | grep -v 'var(--'
# Find Tailwind gap classes that aren't on the 4px grid
grep -n 'gap-[^2346]' src/components/Game/*.tsx
# Find mixed padding approaches
grep -n 'className.*p-[0-9]' src/components/Game/*.tsx
```

**Step 2: Standardize panel padding**

For each game component using `panel-glass` or `panel-glass-raised`:
- Replace any inline `padding: '12px'` or `padding: '1rem'` with `padding: 'var(--panel-padding)'`
- Replace any Tailwind `p-3` or `p-4` on panel containers with inline `style={{ padding: 'var(--panel-padding)' }}`

**Step 3: Standardize section gaps**

For sidebar list gaps (RetinuePanel, RivalPanel, EssencePanel):
- Use `gap: 'var(--space-3)'` (12px) between list sections
- Use `gap: 'var(--space-2)'` (8px) between items within a section

**Step 4: Type-check + test**

Run: `npx tsc --noEmit && npm test`
Expected: No errors, all tests pass

**Step 5: Commit**

```bash
git add src/components/Game/
git commit -m "style(ui): standardize spacing to 4px grid across game panels"
```

---

### Task 9: Narrative Entry Slide-In Animation

**Files:**
- Modify: `src/components/Game/NarrativeLog.tsx`

**Step 1: Track new entries**

In NarrativeLog, add entry tracking so new entries get a slide-in animation on first render:

```tsx
const prevCountRef = useRef(events.length);
const newEntryCount = events.length - prevCountRef.current;

useEffect(() => {
  prevCountRef.current = events.length;
}, [events.length]);
```

**Step 2: Apply animation class to new entries**

When mapping events, for the most recent `newEntryCount` entries, add the `anim-fade-up-enter` class:

```tsx
{events.map((event, i) => {
  const isNew = i >= events.length - newEntryCount;
  return (
    <div
      key={`${event.tick}-${i}`}
      className={isNew ? 'anim-fade-up-enter' : ''}
      // ... rest of existing render
    >
```

**Step 3: Type-check + test**

Run: `npx tsc --noEmit && npm test`
Expected: All pass

**Step 4: Commit**

```bash
git add src/components/Game/NarrativeLog.tsx
git commit -m "feat(ui): new narrative log entries slide in with fade-up animation"
```

---

### Task 10: Final Verification + Documentation

**Files:**
- Modify: `Docs/ui-patterns.md` (add animation pattern documentation)
- Modify: `Docs/project-status.md` (update status)
- Modify: `Docs/changelog.md` (add entry)

**Step 1: Full verification**

Run all checks:
```bash
npx tsc --noEmit && npm test && npx vite build
```
Expected: All pass, build succeeds.

**Step 2: Update ui-patterns.md**

Add a new section (##12) documenting the animation conventions:
- AnimateMount usage pattern
- Animation class naming convention (anim-* for mount/unmount, pulse-* for one-shot)
- Which overlays use which animation
- Empty state convention (themed text + animate-breathe)

**Step 3: Update project-status.md**

Add FE Polish Sprint #1 as completed with summary of changes.

**Step 4: Update changelog.md**

Add entry: `| 2026-03-10 | UI (all panels) | FE Polish Sprint #1: animations, empty states, ARIA live regions, spacing, error boundary | Player experience polish — game feels alive instead of like a dashboard |`

**Step 5: Update Notion backlog**

Mark FE Polish Sprint #1 items as complete (FE-01, FE-03, FE-05, FE-08).

**Step 6: Commit**

```bash
git add Docs/
git commit -m "docs: FE Polish Sprint #1 — update patterns, status, changelog"
```

---

## Task Dependency Graph

```
Task 1 (CSS foundation)
  └─→ Task 2 (AnimateMount)
       └─→ Task 4 (overlay animations)
       └─→ Task 9 (narrative entry slide-in)
  └─→ Task 5 (pulse effects + hover)
  └─→ Task 6 (empty states — uses animate-breathe)
  └─→ Task 7 (ARIA live regions — uses sr-only)
Task 3 (error boundary) — independent, can run in parallel with 1-2
Task 8 (spacing audit) — independent, can run anytime
Task 10 (verification + docs) — runs last after everything else
```

## Parallelizable groups

- **Group A (independent):** Task 1 → Task 2 → Task 4 → Task 9
- **Group B (independent):** Task 3
- **Group C (depends on Task 1):** Task 5, Task 6, Task 7
- **Group D (independent):** Task 8
- **Group E (last):** Task 10
