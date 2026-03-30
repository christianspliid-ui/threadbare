# Testing Patterns

**Analysis Date:** 2026-03-30

## Test Framework

**Runner:**
- Vitest 4.0.18 (testing library built on Vite)
- Main config: `vitest.config.ts`
- Isolated config: `vitest.config.isolated.ts` (for node-only tests without jsdom overhead)

**Assertion Library:**
- Vitest's built-in `expect()` (compatible with Jest assertions)
- `@testing-library/jest-dom` for DOM matchers (`.toBeInTheDocument()`, `.toHaveTextContent()`, etc.)

**Run Commands:**
```bash
npm test              # Run all tests once (vitest run mode)
npm run test:watch   # Watch mode (vitest --watch)
npm run lint         # Check linting (eslint)
npx tsc --noEmit     # Type check without emitting files
npx vite build       # Production build (includes type check)
```

## Test File Organization

**Location:**
- Component tests: co-located in `__tests__/` subdirectory within component's package
  - Example: `src/components/Game/__tests__/ActionCard.test.tsx` for `src/components/Game/ActionCard.tsx`
  - Example: `src/components/Game/hooks/__tests__/useNotifications.test.ts` for the hook
- Engine/logic tests: co-located in `__tests__/` subdirectory within module's directory
  - Example: `src/engine/worldgen/__tests__/biome.test.ts` for worldgen passes

**Naming:**
- Match source file name: `ActionCard.tsx` → `ActionCard.test.tsx`
- Use `.test.ts` for pure logic, `.test.tsx` for React components

**Structure:**
```
src/components/Game/
├── ActionCard.tsx
├── ActionDrawer.tsx
└── __tests__/
    ├── ActionCard.test.tsx
    ├── ActionDrawer.test.tsx
    └── ...

src/engine/worldgen/
├── passes/
├── types.ts
└── __tests__/
    ├── biome.test.ts
    ├── climate.test.ts
    └── ...
```

## Test Structure

**Suite Organization:**

React component tests use vitest's describe/it pattern:
```typescript
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

describe('ActionCard — hand layout', () => {
  it('renders action name in hand size', () => {
    render(<ActionCard slot={baseSlot} onClick={vi.fn()} size="hand" />);
    expect(screen.getByText('Dream')).toBeInTheDocument();
  });
});
```

Engine/logic tests follow the same pattern but without jsdom:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { runBiomePass } from '../passes/pass07-biome';
import type { WorldGenContext, WorldGenParams } from '../types';

function makeTestParams(overrides: Partial<WorldGenParams> = {}): WorldGenParams {
  return {
    cols: 30,
    rows: 20,
    seed: 42,
    ridgeCount: 2,
    seaLevelThreshold: 0.38,
    landShape: 'continent',
    mountainDensity: 'moderate',
    livingCultures: [],
    lostCultures: [],
    ...overrides,
  };
}

describe('runTempReassessPass — lake effect', () => {
  it('lake-adjacent hexes have temperature moderated toward 0.5', () => {
    const params = makeTestParams();
    const ctx = makeCtx(params);
    // ... test implementation
  });
});
```

**Patterns:**
- Use `describe()` to group related tests and name the subject clearly
- Use `it()` to describe the expected behavior (red/green clarity)
- Setup fixtures with factory functions (`makeTestParams()`, `makeCtx()`) rather than beforeEach hooks when data is isolated per test
- Use `beforeEach()` only for shared setup that all tests need (rarely observed in codebase)
- Each `it()` is independent: no test should depend on another test's state

## Mocking

**Framework:** Vitest's `vi` (re-exports Jest mocking API)

**Patterns:**

Function mocks in component tests:
```typescript
const onClick = vi.fn();
render(<ActionCard slot={baseSlot} onClick={onClick} size="hand" />);
fireEvent.click(screen.getByTestId('action-card-dream'));
expect(onClick).toHaveBeenCalledWith('dream');
```

Mock verification methods:
```typescript
expect(onClick).toHaveBeenCalled()              // Called at least once
expect(onClick).toHaveBeenCalledOnce()          // Called exactly once
expect(onClick).toHaveBeenCalledWith('dream')   // Called with specific args
expect(onClick).not.toHaveBeenCalled()          // Never called
```

Helper test functions (internal exports for testing):
```typescript
// useNotifications.ts
export const useNotificationsTestHelpers = {
  expireToasts(state: NotificationState, tick: number): NotificationState { ... },
  dismissAlert(state: NotificationState, id: string): NotificationState { ... },
};

// useNotifications.test.ts
import { useNotificationsTestHelpers } from '../useNotifications';
it('expireToasts removes toasts past their expiresAt', () => {
  const state: NotificationState = { ... };
  const result = useNotificationsTestHelpers.expireToasts(state, 1000);
  expect(result.toasts).toHaveLength(1);
});
```

**What to Mock:**
- User input handlers: `onClick`, `onSlotClick`, callbacks
- Vitest: `vi.fn()` creates spy/mock functions
- Data fixtures: factory functions (`makeTestParams`) that generate mock data
- Component props: pass mock values (e.g., `baseSlot` object)

**What NOT to Mock:**
- React Testing Library utilities (`render`, `screen`, `fireEvent`) — use as-is
- Real component rendering — test the actual component, not a mock
- Simple data structures — use real objects or factories, don't over-mock
- DOM queries — use real screen queries (`screen.getByText`, `screen.getByTestId`)

## Fixtures and Factories

**Test Data:**

Mock objects created as module-level constants or factory functions:
```typescript
const baseSlot: WheelSlot = {
  id: 'dream',
  label: 'Dream',
  // ... all required fields
};

// Variants spread from base
const lockedSlot = { ...baseSlot, available: false, lockedReason: 'Requires tier 2' };
```

Factory functions for parametric tests:
```typescript
function makeTestParams(overrides: Partial<WorldGenParams> = {}): WorldGenParams {
  return {
    cols: 30,
    rows: 20,
    seed: 42,
    // ... defaults
    ...overrides,  // Allow per-test customization
  };
}
```

**Location:**
- Mock data defined at top of test file (near imports, before test suites)
- Factories exported as module functions within test files
- Shared fixtures (if any emerge across multiple test files) placed in test utilities directory (currently not observed as needed)

## Coverage

**Requirements:** Not enforced (no coverage threshold configured in `vitest.config.ts`)

**View Coverage:**
```bash
# Vitest doesn't have built-in coverage reporters configured
# To add coverage in future: install @vitest/coverage-v8, update vitest.config.ts
# Then run: vitest run --coverage
```

Currently no coverage threshold enforced. Best practice: aim for >80% on core engine logic and UI components.

## Test Types

**Unit Tests:**
- Scope: Single function or component in isolation
- Approach: Pass mock data/props, verify output or side effects
- Example: `ActionCard.test.tsx` tests card rendering with different slot states
- Example: `useNotifications.test.ts` tests state manipulation helpers in isolation

**Integration Tests:**
- Scope: Multiple components or modules working together
- Approach: Render component tree, simulate user interactions, verify state changes across components
- Example: `ActionDrawer.test.tsx` tests the drawer + card interaction (two-click flow, focus/activate)
- Example: Worldgen tests in `src/engine/worldgen/__tests__/` chain multiple passes and verify output

**E2E Tests:**
- Framework: Not observed (no Playwright or Cypress config)
- Status: No automated E2E tests in this codebase
- Manual QA: User runs `npm run dev` and tests via browser at `http://localhost:5173?view=game`

## Common Patterns

**Async Testing:**

Not heavily used (component tests are mostly synchronous). When needed:
```typescript
// Pattern: async it() with await
it('async operation completes', async () => {
  const result = await someAsyncFunction();
  expect(result).toBe(expectedValue);
});

// React Testing Library: use findBy (waits for element)
it('renders delayed content', async () => {
  render(<ComponentWithAsyncLoad />);
  const element = await screen.findByText('Loaded content');
  expect(element).toBeInTheDocument();
});
```

**Error Testing:**

Verify error handling (fail-soft pattern):
```typescript
it('returns empty array when actor not found', () => {
  const candidates = generateActionCandidates(graph, 'nonexistent-id', 'loc.1');
  expect(candidates).toEqual([]);
});

it('gracefully skips invalid numeric changes', () => {
  // Pass non-numeric value, expect console.warn but no throw
  const result = applyNodeChanges(node, { health: 'not-a-number' });
  expect(result).toBeDefined();  // Didn't crash
});
```

**State Validation Testing:**

Verify expected state shape and invariants:
```typescript
it('detail has all required fields', () => {
  const detail = buildAgentDetail(graph, agentId);
  expect(detail).toHaveProperty('id');
  expect(detail).toHaveProperty('name');
  expect(detail).toHaveProperty('domainCapabilities');
  // ... check shape
});
```

**Component Interaction Testing:**

Simulate user actions and verify state/callbacks:
```typescript
it('two-click flow: first click focuses, second click activates', () => {
  const onSlotClick = vi.fn();
  render(
    <ActionDrawer
      open={true}
      slots={mockSlots}
      onSlotClick={onSlotClick}
      onClose={vi.fn()}
    />
  );

  // First click — focuses
  fireEvent.click(screen.getByTestId('action-card-dream'));
  expect(onSlotClick).not.toHaveBeenCalled();
  expect(screen.getByTestId('action-drawer-backdrop')).toBeInTheDocument();

  // Second click — activates
  const dreamCards = screen.getAllByTestId('action-card-dream');
  const focusedCard = dreamCards.find(el => el.closest('.anim-card-fly-up'));
  fireEvent.click(focusedCard || dreamCards[dreamCards.length - 1]);
  expect(onSlotClick).toHaveBeenCalledWith('dream');
});
```

## Vitest Environment Declaration

**Component tests use jsdom environment:**
```typescript
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
```

First comment line declares the environment. This tells Vitest to use JSDOM (browser-like DOM) for rendering React components.

**Engine/logic tests use node environment:**
- Default (specified in `vitest.config.ts`: `environment: 'node'`)
- No special comment needed unless overriding

---

*Testing analysis: 2026-03-30*
