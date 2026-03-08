# Action Card Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the SVG radial AgentWheel with a card-based bottom drawer action system, and move the narrative feed to a floating toggle log.

**Architecture:** Three new components (ActionCard, ActionDrawer, NarrativeLog) replace the SVG AgentWheel and fixed NarrativeFeed bar. The bottom drawer slides up when an agent is selected, showing action cards with full info (cost, risk, effect, range). The narrative log becomes a togglable floating overlay. All wiring goes through the existing `useAgentInteraction` hook.

**Tech Stack:** React + TypeScript, Tailwind CSS, existing WheelSlot data model, vitest + @testing-library/react for tests.

**Design doc:** `Docs/plans/2026-03-08-action-card-redesign-design.md`

---

### Task 1: Add `description` field to WheelSlot and populate from INTERVENTION_DEFINITIONS

**Files:**
- Modify: `src/engine/wheel.ts` — add `description: string` to `WheelSlot` interface and populate it in `getAgentWheelSlots()`
- Modify: `src/engine/__tests__/wheel.test.ts` — add test for description field
- Modify: `src/components/Game/__tests__/AgentWheel.test.tsx` — add `description` to mock slots (backward compat)

**Step 1: Write the failing test**

In `src/engine/__tests__/wheel.test.ts`, add a test:

```ts
it('populates description from INTERVENTION_DEFINITIONS', () => {
  const slots = getAgentWheelSlots({
    tier: 3,
    pool: { force: 100, matter: 100, energy: 100, life: 100, mind: 100, spirit: 100, time: 100, entropy: 100 },
    primarySphere: 'mind',
  });
  const dreamSlot = slots.find(s => s.id === 'dream');
  expect(dreamSlot?.description).toBe('Manipulate selection probabilities during sleep');

  const scrySlot = slots.find(s => s.id === 'scry');
  expect(scrySlot?.description).toBe('Observe agent psyche and situation');

  const centerSlot = slots.find(s => s.id === 'center');
  expect(centerSlot?.description).toBe('');
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/wheel.test.ts --reporter=verbose`
Expected: FAIL — `description` property does not exist on `WheelSlot`

**Step 3: Implement**

In `src/engine/wheel.ts`:

1. Add `description: string;` to the `WheelSlot` interface (after `lockedReason`).
2. In `getAgentWheelSlots()`, populate `description`:
   - Center slot: `description: ''`
   - Scry slot: `description: 'Observe agent psyche and situation'`
   - Intervention slots: `description: interventionDef.description`

3. Update mock WheelSlot objects in `AgentWheel.test.tsx` to include `description: ''` (or relevant text) so existing tests don't break.

**Step 4: Run tests to verify pass**

Run: `npx vitest run src/engine/__tests__/wheel.test.ts --reporter=verbose`
Expected: ALL PASS

Run: `npx vitest run src/components/Game/__tests__/AgentWheel.test.tsx --reporter=verbose`
Expected: ALL PASS (backward compat)

**Step 5: Commit**

```bash
git add src/engine/wheel.ts src/engine/__tests__/wheel.test.ts src/components/Game/__tests__/AgentWheel.test.tsx
git commit -m "feat: add description field to WheelSlot"
```

---

### Task 2: Create ActionCard component

**Files:**
- Create: `src/components/Game/ActionCard.tsx`
- Create: `src/components/Game/__tests__/ActionCard.test.tsx`

**Step 1: Write the failing tests**

Create `src/components/Game/__tests__/ActionCard.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActionCard } from '../ActionCard';
import type { WheelSlot } from '../../../engine/wheel';

const baseSlot: WheelSlot = {
  id: 'dream',
  label: 'Dream',
  type: 'intervention',
  angleDeg: 45,
  available: true,
  lockedReason: null,
  essenceCost: 1,
  detectionRisk: 0.1,
  sphere: 'mind',
  interventionType: 'dream',
  rangeStatus: 'unlimited',
  hexDistance: null,
  description: 'Manipulate selection probabilities during sleep',
};

describe('ActionCard', () => {
  it('renders action name and description', () => {
    render(<ActionCard slot={baseSlot} onClick={vi.fn()} />);
    expect(screen.getByText('Dream')).toBeInTheDocument();
    expect(screen.getByText('Manipulate selection probabilities during sleep')).toBeInTheDocument();
  });

  it('shows essence cost and sphere', () => {
    render(<ActionCard slot={baseSlot} onClick={vi.fn()} />);
    expect(screen.getByTestId('action-card-cost')).toHaveTextContent('1');
  });

  it('shows detection risk', () => {
    render(<ActionCard slot={baseSlot} onClick={vi.fn()} />);
    expect(screen.getByTestId('action-card-risk')).toHaveTextContent('10%');
  });

  it('calls onClick when available card is clicked', () => {
    const onClick = vi.fn();
    render(<ActionCard slot={baseSlot} onClick={onClick} />);
    fireEvent.click(screen.getByTestId('action-card-dream'));
    expect(onClick).toHaveBeenCalledWith('dream');
  });

  it('does NOT call onClick when unavailable', () => {
    const onClick = vi.fn();
    const locked = { ...baseSlot, available: false, lockedReason: 'Requires tier 2' };
    render(<ActionCard slot={locked} onClick={onClick} />);
    fireEvent.click(screen.getByTestId('action-card-dream'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('shows locked reason when unavailable', () => {
    const locked = { ...baseSlot, available: false, lockedReason: 'Requires tier 2' };
    render(<ActionCard slot={locked} onClick={onClick} />);
    expect(screen.getByText('Requires tier 2')).toBeInTheDocument();
  });

  it('shows range info for ranged interventions', () => {
    const ranged = { ...baseSlot, rangeStatus: 'in_range' as const, hexDistance: 3 };
    render(<ActionCard slot={ranged} onClick={vi.fn()} />);
    expect(screen.getByTestId('action-card-range')).toHaveTextContent('3');
  });

  it('shows free cost for scry (observation)', () => {
    const scry: WheelSlot = {
      ...baseSlot,
      id: 'scry',
      label: 'Scry',
      type: 'observation',
      essenceCost: 0,
      detectionRisk: 0,
      sphere: null,
      interventionType: null,
      description: 'Observe agent psyche and situation',
    };
    render(<ActionCard slot={scry} onClick={vi.fn()} />);
    expect(screen.getByTestId('action-card-cost')).toHaveTextContent('Free');
  });

  it('applies dimmed styling when unavailable', () => {
    const locked = { ...baseSlot, available: false, lockedReason: 'Not enough essence' };
    render(<ActionCard slot={locked} onClick={vi.fn()} />);
    const card = screen.getByTestId('action-card-dream');
    expect(card.className).toContain('opacity-');
  });

  it('applies sphere color accent when available', () => {
    render(<ActionCard slot={baseSlot} onClick={vi.fn()} />);
    const card = screen.getByTestId('action-card-dream');
    // Should have a left border with sphere color (mind = #44aaff)
    expect(card.style.borderLeftColor).toBeTruthy();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/Game/__tests__/ActionCard.test.tsx --reporter=verbose`
Expected: FAIL — module `../ActionCard` not found

**Step 3: Implement ActionCard**

Create `src/components/Game/ActionCard.tsx`:

```tsx
import React from 'react';
import type { WheelSlot } from '../../engine/wheel';
import { getWheelSlotGlyph, getSphereColor } from '../../data/sphereIcons';

// ─── Constants ─────────────────────────────────────────────────────
const CARD_STYLES = {
  WIDTH: 140,
  LOCKED_OPACITY: 'opacity-40',
  COST_LOCKED_OPACITY: 'opacity-50',
} as const;

// ─── Props ─────────────────────────────────────────────────────────
export interface ActionCardProps {
  slot: WheelSlot;
  onClick: (slotId: string) => void;
}

// ─── Component ─────────────────────────────────────────────────────
export const ActionCard = React.memo(function ActionCard({ slot, onClick }: ActionCardProps) {
  const glyph = getWheelSlotGlyph(slot.id);
  const sphereColor = slot.sphere ? getSphereColor(slot.sphere) : '#d4a574';
  const isAvailable = slot.available;

  const handleClick = () => {
    if (isAvailable) {
      onClick(slot.id);
    }
  };

  // Determine opacity class
  const opacityClass = isAvailable ? '' : slot.lockedReason?.includes('tier')
    ? CARD_STYLES.LOCKED_OPACITY
    : CARD_STYLES.COST_LOCKED_OPACITY;

  // Cost display
  const costDisplay = slot.essenceCost === 0 ? 'Free' : `${slot.essenceCost}`;

  // Risk display
  const riskDisplay = `${Math.round(slot.detectionRisk * 100)}%`;

  // Range display
  const rangeDisplay = (() => {
    if (slot.rangeStatus === 'unlimited') return '∞';
    if (slot.rangeStatus === 'unknown') return null;
    if (slot.hexDistance != null) return `${slot.hexDistance}`;
    return null;
  })();

  return (
    <div
      data-testid={`action-card-${slot.id}`}
      className={`
        flex flex-col rounded-lg border border-stone-700 bg-stone-800/90
        ${isAvailable ? 'cursor-pointer hover:-translate-y-1 hover:shadow-lg' : 'cursor-not-allowed'}
        ${opacityClass}
        transition-all duration-150 select-none
      `}
      style={{
        width: `${CARD_STYLES.WIDTH}px`,
        borderLeftColor: isAvailable ? sphereColor : undefined,
        borderLeftWidth: isAvailable ? '3px' : undefined,
      }}
      onClick={handleClick}
    >
      {/* Icon zone */}
      <div className="flex items-center justify-center pt-3 pb-1">
        <span
          className="text-2xl"
          style={{ color: isAvailable ? sphereColor : '#57534e' }}
        >
          {glyph}
        </span>
      </div>

      {/* Name + effect */}
      <div className="px-3 pb-2 flex-1">
        <div
          className="text-sm font-bold"
          style={{ fontFamily: 'Cinzel, serif', color: isAvailable ? sphereColor : '#78716c' }}
        >
          {slot.label}
        </div>
        <div className="text-xs text-amber-200/60 mt-0.5 leading-tight line-clamp-2">
          {isAvailable ? slot.description : (slot.lockedReason ?? slot.description)}
        </div>
      </div>

      {/* Cost zone */}
      <div className="px-3 pb-3 flex items-center gap-2 text-xs text-amber-200/70">
        <span data-testid="action-card-cost" className="flex items-center gap-1">
          {slot.sphere && (
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ backgroundColor: sphereColor }}
            />
          )}
          {costDisplay}
        </span>
        <span data-testid="action-card-risk" className="flex items-center gap-1">
          ◉ {riskDisplay}
        </span>
        {rangeDisplay && (
          <span data-testid="action-card-range" className="ml-auto">
            ↔ {rangeDisplay}
          </span>
        )}
      </div>
    </div>
  );
});
```

**Step 4: Run tests to verify pass**

Run: `npx vitest run src/components/Game/__tests__/ActionCard.test.tsx --reporter=verbose`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/components/Game/ActionCard.tsx src/components/Game/__tests__/ActionCard.test.tsx
git commit -m "feat: add ActionCard component"
```

---

### Task 3: Create ActionDrawer component

**Files:**
- Create: `src/components/Game/ActionDrawer.tsx`
- Create: `src/components/Game/__tests__/ActionDrawer.test.tsx`

**Step 1: Write the failing tests**

Create `src/components/Game/__tests__/ActionDrawer.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActionDrawer } from '../ActionDrawer';
import type { WheelSlot } from '../../../engine/wheel';

const mockSlots: WheelSlot[] = [
  {
    id: 'scry', label: 'Scry', type: 'observation', angleDeg: 0,
    available: true, lockedReason: null, essenceCost: 0, detectionRisk: 0,
    sphere: null, interventionType: null, rangeStatus: 'unknown', hexDistance: null,
    description: 'Observe agent psyche and situation',
  },
  {
    id: 'dream', label: 'Dream', type: 'intervention', angleDeg: 45,
    available: true, lockedReason: null, essenceCost: 1, detectionRisk: 0.1,
    sphere: 'mind', interventionType: 'dream', rangeStatus: 'unlimited', hexDistance: null,
    description: 'Manipulate selection probabilities during sleep',
  },
  {
    id: 'center', label: '', type: 'info', angleDeg: -1,
    available: true, lockedReason: null, essenceCost: 0, detectionRisk: 0,
    sphere: null, interventionType: null, rangeStatus: 'unknown', hexDistance: null,
    description: '',
  },
];

describe('ActionDrawer', () => {
  it('renders when open', () => {
    render(
      <ActionDrawer
        open={true}
        slots={mockSlots}
        agentName="Kael"
        agentTier="Tier 2 Zealot"
        onSlotClick={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByTestId('action-drawer')).toBeInTheDocument();
    expect(screen.getByText('Kael')).toBeInTheDocument();
  });

  it('does not render cards when closed', () => {
    render(
      <ActionDrawer
        open={false}
        slots={mockSlots}
        agentName="Kael"
        agentTier="Tier 2 Zealot"
        onSlotClick={vi.fn()}
        onClose={vi.fn()}
      />
    );
    // Drawer container may exist for animation but cards should not be visible
    expect(screen.queryByText('Dream')).not.toBeInTheDocument();
  });

  it('renders action cards for non-center slots', () => {
    render(
      <ActionDrawer
        open={true}
        slots={mockSlots}
        agentName="Kael"
        agentTier="Tier 2 Zealot"
        onSlotClick={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('Scry')).toBeInTheDocument();
    expect(screen.getByText('Dream')).toBeInTheDocument();
    // Center slot should not render as a card
    expect(screen.queryByTestId('action-card-center')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <ActionDrawer
        open={true}
        slots={mockSlots}
        agentName="Kael"
        agentTier="Tier 2 Zealot"
        onSlotClick={vi.fn()}
        onClose={onClose}
      />
    );
    fireEvent.click(screen.getByTestId('action-drawer-close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onSlotClick when an action card is clicked', () => {
    const onSlotClick = vi.fn();
    render(
      <ActionDrawer
        open={true}
        slots={mockSlots}
        agentName="Kael"
        agentTier="Tier 2 Zealot"
        onSlotClick={onSlotClick}
        onClose={vi.fn()}
      />
    );
    fireEvent.click(screen.getByTestId('action-card-dream'));
    expect(onSlotClick).toHaveBeenCalledWith('dream');
  });

  it('closes on Escape key', () => {
    const onClose = vi.fn();
    render(
      <ActionDrawer
        open={true}
        slots={mockSlots}
        agentName="Kael"
        agentTier="Tier 2 Zealot"
        onSlotClick={vi.fn()}
        onClose={onClose}
      />
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('sorts cards: available first, locked last', () => {
    const mixedSlots: WheelSlot[] = [
      { ...mockSlots[0] }, // scry - available
      {
        id: 'coincidence', label: 'Coincidence', type: 'intervention', angleDeg: 225,
        available: false, lockedReason: 'Requires tier 3', essenceCost: 4,
        detectionRisk: 0.6, sphere: 'time', interventionType: 'coincidence',
        rangeStatus: 'unlimited', hexDistance: null, description: 'Alter environmental prerequisites',
      },
      { ...mockSlots[1] }, // dream - available
      mockSlots[2], // center
    ];
    render(
      <ActionDrawer
        open={true}
        slots={mixedSlots}
        agentName="Kael"
        agentTier="Tier 2 Zealot"
        onSlotClick={vi.fn()}
        onClose={vi.fn()}
      />
    );
    const cards = screen.getAllByTestId(/^action-card-/);
    // Available cards should come before locked
    expect(cards[0].dataset.testid).toBe('action-card-scry');
    expect(cards[cards.length - 1].dataset.testid).toBe('action-card-coincidence');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/Game/__tests__/ActionDrawer.test.tsx --reporter=verbose`
Expected: FAIL — module `../ActionDrawer` not found

**Step 3: Implement ActionDrawer**

Create `src/components/Game/ActionDrawer.tsx`:

```tsx
import React, { useEffect, useMemo } from 'react';
import type { WheelSlot } from '../../engine/wheel';
import { ActionCard } from './ActionCard';

// ─── Constants ─────────────────────────────────────────────────────
const DRAWER_CONFIG = {
  HEIGHT_PERCENT: 35,
  TRANSITION_MS: 200,
} as const;

// ─── Props ─────────────────────────────────────────────────────────
export interface ActionDrawerProps {
  open: boolean;
  slots: WheelSlot[];
  agentName: string;
  agentTier: string;
  onSlotClick: (slotId: string) => void;
  onClose: () => void;
}

// ─── Component ─────────────────────────────────────────────────────
export const ActionDrawer = React.memo(function ActionDrawer({
  open,
  slots,
  agentName,
  agentTier,
  onSlotClick,
  onClose,
}: ActionDrawerProps) {
  // Escape key handler
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Filter out center slot, sort: available first, then by type (observation before intervention)
  const sortedCards = useMemo(() => {
    const actionSlots = slots.filter(s => s.id !== 'center');
    return actionSlots.sort((a, b) => {
      // Available before unavailable
      if (a.available && !b.available) return -1;
      if (!a.available && b.available) return 1;
      // Observations before interventions
      if (a.type === 'observation' && b.type !== 'observation') return -1;
      if (a.type !== 'observation' && b.type === 'observation') return 1;
      return 0;
    });
  }, [slots]);

  if (!open) return null;

  return (
    <div
      data-testid="action-drawer"
      className="border-t border-amber-900/40 bg-stone-900/95 backdrop-blur-sm"
      style={{
        maxHeight: `${DRAWER_CONFIG.HEIGHT_PERCENT}vh`,
        transition: `transform ${DRAWER_CONFIG.TRANSITION_MS}ms ease-out`,
      }}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-amber-900/20">
        <div className="flex items-center gap-3">
          <span
            className="text-amber-100 text-sm font-bold"
            style={{ fontFamily: 'Cinzel, serif' }}
          >
            {agentName}
          </span>
          <span className="text-amber-400/50 text-xs">{agentTier}</span>
        </div>
        <button
          data-testid="action-drawer-close"
          className="text-amber-200/50 hover:text-amber-100 text-lg leading-none px-2"
          onClick={onClose}
          aria-label="Close action drawer"
        >
          ×
        </button>
      </div>

      {/* Card row */}
      <div className="px-4 py-3 overflow-x-auto">
        <div className="flex gap-3">
          {sortedCards.map(slot => (
            <ActionCard key={slot.id} slot={slot} onClick={onSlotClick} />
          ))}
        </div>
      </div>
    </div>
  );
});
```

**Step 4: Run tests to verify pass**

Run: `npx vitest run src/components/Game/__tests__/ActionDrawer.test.tsx --reporter=verbose`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/components/Game/ActionDrawer.tsx src/components/Game/__tests__/ActionDrawer.test.tsx
git commit -m "feat: add ActionDrawer bottom drawer component"
```

---

### Task 4: Create NarrativeLog floating toggle component

**Files:**
- Create: `src/components/Game/NarrativeLog.tsx`
- Create: `src/components/Game/__tests__/NarrativeLog.test.tsx`

**Step 1: Write the failing tests**

Create `src/components/Game/__tests__/NarrativeLog.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NarrativeLog } from '../NarrativeLog';
import type { TickEvent } from '../../../types/gameState';

const mockEvents: TickEvent[] = [
  { id: 'e1', tick: 1, type: 'agent_action', message: 'Kael hunts in the forest', significance: 0.5, sphere: 'life' },
  { id: 'e2', tick: 2, type: 'doom_escalation', message: 'The doom clock advances', significance: 0.8, sphere: 'entropy' },
  { id: 'e3', tick: 3, type: 'narrative', message: 'A strange wind blows', significance: 0.3, sphere: 'spirit' },
];

describe('NarrativeLog', () => {
  it('renders toggle pill button', () => {
    render(<NarrativeLog events={mockEvents} />);
    expect(screen.getByTestId('narrative-log-toggle')).toBeInTheDocument();
  });

  it('shows unread count badge', () => {
    render(<NarrativeLog events={mockEvents} />);
    expect(screen.getByTestId('narrative-log-badge')).toHaveTextContent('3');
  });

  it('expands panel when toggle is clicked', () => {
    render(<NarrativeLog events={mockEvents} />);
    fireEvent.click(screen.getByTestId('narrative-log-toggle'));
    expect(screen.getByTestId('narrative-log-panel')).toBeInTheDocument();
    expect(screen.getByText('Kael hunts in the forest')).toBeInTheDocument();
  });

  it('collapses panel when toggle is clicked again', () => {
    render(<NarrativeLog events={mockEvents} />);
    fireEvent.click(screen.getByTestId('narrative-log-toggle'));
    expect(screen.getByTestId('narrative-log-panel')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('narrative-log-toggle'));
    expect(screen.queryByTestId('narrative-log-panel')).not.toBeInTheDocument();
  });

  it('resets unread count when opened', () => {
    render(<NarrativeLog events={mockEvents} />);
    expect(screen.getByTestId('narrative-log-badge')).toHaveTextContent('3');
    fireEvent.click(screen.getByTestId('narrative-log-toggle'));
    // Badge should disappear or show 0 when panel is open
    expect(screen.queryByTestId('narrative-log-badge')).not.toBeInTheDocument();
  });

  it('shows new unread count after new events arrive while closed', () => {
    const { rerender } = render(<NarrativeLog events={mockEvents} />);
    // Open and close to reset count
    fireEvent.click(screen.getByTestId('narrative-log-toggle'));
    fireEvent.click(screen.getByTestId('narrative-log-toggle'));

    // New events arrive
    const newEvents = [
      ...mockEvents,
      { id: 'e4', tick: 4, type: 'narrative' as const, message: 'Thunder rolls', significance: 0.6, sphere: 'force' as const },
    ];
    rerender(<NarrativeLog events={newEvents} />);
    expect(screen.getByTestId('narrative-log-badge')).toHaveTextContent('1');
  });

  it('closes on Escape key', () => {
    render(<NarrativeLog events={mockEvents} />);
    fireEvent.click(screen.getByTestId('narrative-log-toggle'));
    expect(screen.getByTestId('narrative-log-panel')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByTestId('narrative-log-panel')).not.toBeInTheDocument();
  });

  it('renders empty state when no events', () => {
    render(<NarrativeLog events={[]} />);
    fireEvent.click(screen.getByTestId('narrative-log-toggle'));
    expect(screen.getByText(/awaiting/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/Game/__tests__/NarrativeLog.test.tsx --reporter=verbose`
Expected: FAIL — module `../NarrativeLog` not found

**Step 3: Implement NarrativeLog**

Create `src/components/Game/NarrativeLog.tsx`. This component:
- Uses `useState` for `isOpen` and `useRef` for `lastSeenCount`.
- Renders a pill button (bottom-left positioned) with an unread badge when closed.
- When open, renders the existing `NarrativeFeed` content inside a floating panel.
- Escape key closes the panel.
- Reuses the `TYPE_COLORS` and aggregation logic from the existing `NarrativeFeed.tsx` (import the component or duplicate the render).

Key implementation: Import and render the existing `NarrativeFeed` component inside the floating panel div, so we don't duplicate the event rendering logic.

**Step 4: Run tests to verify pass**

Run: `npx vitest run src/components/Game/__tests__/NarrativeLog.test.tsx --reporter=verbose`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/components/Game/NarrativeLog.tsx src/components/Game/__tests__/NarrativeLog.test.tsx
git commit -m "feat: add NarrativeLog floating toggle component"
```

---

### Task 5: Update useAgentInteraction hook — replace wheelVisible with drawerOpen

**Files:**
- Modify: `src/components/Game/hooks/useAgentInteraction.ts`
- No new tests needed — existing test coverage through GameView integration tests covers this. Verify existing tests still pass.

**Step 1: Modify the hook**

In `src/components/Game/hooks/useAgentInteraction.ts`:

1. Rename `wheelVisible` → `drawerOpen` (state variable and setter).
2. Rename `handleWheelDismiss` → `handleDrawerClose`.
3. Rename `handleOpenWheel` → `handleOpenDrawer`.
4. Rename `handleAvatarWheelClick` → `handleAvatarActionClick`.
5. Update the return object to expose new names.
6. Remove `wheelFeedback` state — the drawer's empty state handles "no agents" messaging.

Keep old names as aliases in the return if needed for incremental migration, or update all at once (next task).

**Step 2: Run all tests**

Run: `npx vitest run --reporter=verbose`
Expected: Some test failures in GameView tests that reference old names. Note them for Task 6.

**Step 3: Commit**

```bash
git add src/components/Game/hooks/useAgentInteraction.ts
git commit -m "refactor: rename wheel state to drawer state in useAgentInteraction"
```

---

### Task 6: Wire ActionDrawer + NarrativeLog into GameView

**Files:**
- Modify: `src/components/Game/GameView.tsx` — replace wheel overlay + fixed NarrativeFeed with ActionDrawer + NarrativeLog
- Modify: `src/components/Game/__tests__/GameView-*.test.tsx` — update test references

**Step 1: Modify GameView.tsx**

1. **Remove imports:** `AgentWheel`, old `NarrativeFeed` placement.
2. **Add imports:** `ActionDrawer`, `NarrativeLog`.
3. **Remove the wheel overlay block** (lines ~226-267 in current GameView: the `{wheelSlots && wheelVisible && selectedAgentId && ...}` block containing the SVG wheel).
4. **Remove the wheelFeedback block** (lines ~259-267).
5. **Remove the fixed NarrativeFeed bar** at the bottom of the center column (lines ~333-336: the `border-t` div containing `<NarrativeFeed>`).
6. **Add NarrativeLog** as an absolutely positioned overlay inside the main content area (bottom-left corner of the center column).
7. **Add ActionDrawer** at the bottom of the center column (where the NarrativeFeed used to be), wired to the renamed hook state:

```tsx
{/* Action drawer at bottom of center column */}
{wheelSlots && drawerOpen && selectedAgentId && (
  <ActionDrawer
    open={drawerOpen}
    slots={wheelSlots}
    agentName={retinueAgents.find(a => a.id === selectedAgentId)?.name ?? ''}
    agentTier={retinueAgents.find(a => a.id === selectedAgentId)?.tierName ?? ''}
    onSlotClick={handleWheelSlotClick}
    onClose={handleDrawerClose}
  />
)}

{/* Floating narrative log */}
<NarrativeLog events={gameState.recentEvents} />
```

8. **Update hook destructuring** to use new names (`drawerOpen`, `handleDrawerClose`, etc.).

**Step 2: Update tests**

Update any GameView test files that reference `wheel-overlay`, `wheel-backdrop`, `wheel-svg`, or `wheel-feedback` test IDs to use new `action-drawer` test IDs instead.

**Step 3: Run all tests**

Run: `npx vitest run --reporter=verbose`
Expected: ALL PASS

**Step 4: Commit**

```bash
git add src/components/Game/GameView.tsx src/components/Game/__tests__/
git commit -m "feat: wire ActionDrawer and NarrativeLog into GameView, remove AgentWheel"
```

---

### Task 7: Delete AgentWheel and update AvatarHUD labels

**Files:**
- Delete: `src/components/Game/AgentWheel.tsx`
- Delete: `src/components/Game/__tests__/AgentWheel.test.tsx`
- Modify: `src/components/Game/AvatarHUD.tsx` — rename "Wheel" button label to "Actions"

**Step 1: Delete old files**

```bash
rm src/components/Game/AgentWheel.tsx
rm src/components/Game/__tests__/AgentWheel.test.tsx
```

**Step 2: Update AvatarHUD**

In `src/components/Game/AvatarHUD.tsx`, change the "Wheel" button label to "Actions" (or whatever the onWheelClick button is labeled).

**Step 3: Verify no import references remain**

Run: `grep -r "AgentWheel" src/` — should return nothing.

**Step 4: Run all tests**

Run: `npx vitest run --reporter=verbose`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: delete AgentWheel, rename Wheel button to Actions"
```

---

### Task 8: Visual polish + integration test

**Files:**
- Possibly modify: `src/components/Game/ActionCard.tsx`, `ActionDrawer.tsx`, `NarrativeLog.tsx` — styling tweaks
- Create: `src/components/Game/__tests__/actionDrawer-integration.test.tsx`

**Step 1: Write integration test**

Test the full flow: agent selection → drawer opens → card click → InterventionConfirm appears → confirm → drawer closes.

```tsx
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { getAgentWheelSlots } from '../../../engine/wheel';

describe('Action Drawer integration', () => {
  it('wheel slots include description for all interventions', () => {
    const slots = getAgentWheelSlots({
      tier: 3,
      pool: { force: 100, matter: 100, energy: 100, life: 100, mind: 100, spirit: 100, time: 100, entropy: 100 },
      primarySphere: 'mind',
    });
    const actionSlots = slots.filter(s => s.id !== 'center');
    for (const slot of actionSlots) {
      expect(slot.description).toBeTruthy();
      expect(slot.description.length).toBeGreaterThan(5);
    }
  });

  it('sorts available cards before locked', () => {
    const slots = getAgentWheelSlots({
      tier: 1,  // Only tier 1 available
      pool: { force: 100, matter: 100, energy: 100, life: 100, mind: 100, spirit: 100, time: 100, entropy: 100 },
      primarySphere: 'mind',
    });
    const actionSlots = slots.filter(s => s.id !== 'center');
    const available = actionSlots.filter(s => s.available);
    const locked = actionSlots.filter(s => !s.available);
    // Tier 1 should have scry, dream, persuade, inspire available; deceive, intimidate, omen, afflict_bless, coincidence locked
    expect(available.length).toBeGreaterThan(0);
    expect(locked.length).toBeGreaterThan(0);
  });
});
```

**Step 2: Run all tests**

Run: `npx vitest run --reporter=verbose`
Expected: ALL PASS

**Step 3: Run type check + build**

Run: `npx tsc --noEmit && npx vite build`
Expected: No type errors, build succeeds.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: action card redesign complete — integration tests + type check"
```

---

## Post-Implementation

After all 8 tasks are done, run the documentation update workflow per CLAUDE.md §Session Workflow step 5:

1. Update CLAUDE.md changelog + project status
2. Update Obsidian vault (create Agent Action Drawer.md, update Agent Wheel.md → mark deprecated)
3. Update Notion backlog (mark complete)
