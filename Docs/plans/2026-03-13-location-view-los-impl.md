# LocationView LOS Threading Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Pass `hexLineOfSight` from `GameView` down to `LocationView` and apply veiled/dimmed rendering states, consistent with the rest of the hex-zoom hierarchy.

**Architecture:** Hex-level LOS inheritance — `LocationView` receives the same `LineOfSight` value already computed for its parent hex. No new engine queries. `'none'` returns an early "Veiled Location" screen; `'partial'` wraps content in reduced opacity; `'full'` is unchanged.

**Tech Stack:** React + TypeScript, Vitest + Testing Library, existing `LineOfSight` type from `src/engine/hexZoom.ts`

**Design doc:** `Docs/plans/2026-03-13-location-view-los.md`

---

## Task 1: Add failing tests to LocationView.test.tsx

**Files:**
- Modify: `src/components/Game/__tests__/LocationView.test.tsx`

Existing tests use `defaultProps` without `lineOfSight`. The component currently accepts no such prop, so these tests will fail once the prop is required — that's fine, we'll make them pass in Task 2.

**Step 1: Add LOS tests at the bottom of the describe block**

Open `src/components/Game/__tests__/LocationView.test.tsx` and append the following tests inside the `describe('LocationView', ...)` block:

```typescript
  describe('line of sight', () => {
    it('shows full content when lineOfSight is full', () => {
      render(<LocationView {...defaultProps} lineOfSight="full" />);
      expect(screen.getByText('The Rusty Tankard')).toBeTruthy();
      // Should NOT show the veiled message
      expect(screen.queryByText(/beyond your sight/i)).toBeNull();
    });

    it('shows veiled screen when lineOfSight is none', () => {
      render(<LocationView {...defaultProps} lineOfSight="none" />);
      expect(screen.getByText('The Rusty Tankard')).toBeTruthy();
      expect(screen.getByText(/beyond your sight/i)).toBeTruthy();
    });

    it('hides sublocation content when lineOfSight is none', () => {
      render(<LocationView {...defaultProps} lineOfSight="none" />);
      // Agents should NOT be visible
      expect(screen.queryByText('Kael')).toBeNull();
      expect(screen.queryByText('Mirael')).toBeNull();
    });

    it('shows content dimmed when lineOfSight is partial', () => {
      const { container } = render(<LocationView {...defaultProps} lineOfSight="partial" />);
      // Agents should still be visible
      expect(screen.getByText('Kael')).toBeTruthy();
      // Outer wrapper should have reduced opacity
      const dimWrapper = container.querySelector('[data-testid="location-dim-wrapper"]');
      expect(dimWrapper).toBeTruthy();
      expect((dimWrapper as HTMLElement).style.opacity).toBe('0.5');
    });

    it('renders without lineOfSight prop (defaults to full)', () => {
      // Backwards compat: existing call sites without prop should still work
      render(<LocationView {...defaultProps} />);
      expect(screen.getByText('The Rusty Tankard')).toBeTruthy();
      expect(screen.queryByText(/beyond your sight/i)).toBeNull();
    });
  });
```

**Step 2: Run the new tests to confirm they fail**

```bash
cd /path/to/TheFantasyWorldSimulator
npx vitest run src/components/Game/__tests__/LocationView.test.tsx --reporter=verbose
```

Expected: the 5 new `line of sight` tests FAIL (TypeScript error or prop not recognised). Existing tests pass.

**Step 3: Commit the failing tests**

```bash
git add src/components/Game/__tests__/LocationView.test.tsx
git commit -m "test: add failing LOS tests for LocationView"
```

---

## Task 2: Add lineOfSight prop to LocationView

**Files:**
- Modify: `src/components/Game/LocationView.tsx`

**Step 1: Add the import and prop**

At the top of `LocationView.tsx`, add to the existing imports:

```typescript
import type { LineOfSight } from '../../engine/hexZoom';
```

In `LocationViewProps`, add the new optional prop (optional so existing callers don't break before Task 3):

```typescript
interface LocationViewProps {
  // ... existing props ...
  lineOfSight?: LineOfSight;   // ← add this
}
```

**Step 2: Destructure the prop with a default**

In the `LocationView` function signature destructuring, add:

```typescript
export const LocationView = memo(function LocationView({
  location,
  agents,
  hexTerrain,
  hexCol,
  hexRow,
  onAgentClick,
  onBack,
  availableEncounters,
  activeEncounters,
  getAgentName,
  getEncounterTemplate,
  graph,
  seed,
  lineOfSight = 'full',   // ← add this with default
}: LocationViewProps) {
```

**Step 3: Add the isHidden / isDimmed guards immediately after destructuring**

Find where local constants are derived at the top of the function body (before the first `useMemo`/`useState`) and add:

```typescript
const isHidden = lineOfSight === 'none';
const isDimmed = lineOfSight === 'partial';
```

**Step 4: Add the veiled-state early return**

Find the first `return (` of the component's JSX. Insert this block **before** it:

```typescript
if (isHidden) {
  return (
    <div
      className="flex flex-col items-center justify-center h-full w-full"
      style={{ color: 'var(--text-muted)' }}
    >
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-lg)',
          color: 'var(--text-primary)',
          marginBottom: '0.75rem',
        }}
      >
        {location.name}
      </h2>
      <p
        style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--text-tertiary)',
          fontStyle: 'italic',
          maxWidth: '28ch',
          textAlign: 'center',
          lineHeight: 1.6,
        }}
      >
        This place lies beyond your sight. Draw closer, or scry to pierce the veil.
      </p>
    </div>
  );
}
```

**Step 5: Wrap the existing main return with the dim wrapper**

The existing `return (` renders the full location content. Wrap its outermost `<div>` with:

```typescript
return (
  <div
    data-testid="location-dim-wrapper"
    style={isDimmed ? { opacity: 0.5, pointerEvents: 'none' } : undefined}
  >
    {/* existing outermost div stays exactly as-is, nested here */}
    ...
  </div>
);
```

> **Note:** Check what the existing outermost element is before wrapping — it may already be a single root `<div>`. If it is, just add `data-testid="location-dim-wrapper"` and the style directly to it instead of wrapping. Don't add unnecessary nesting.

**Step 6: Run the LocationView tests**

```bash
npx vitest run src/components/Game/__tests__/LocationView.test.tsx --reporter=verbose
```

Expected: all 5 new tests PASS. All existing tests still PASS.

**Step 7: Run the full test suite to check for regressions**

```bash
npx vitest run --reporter=verbose 2>&1 | tail -30
```

Expected: no new failures.

**Step 8: Commit**

```bash
git add src/components/Game/LocationView.tsx
git commit -m "feat: add lineOfSight prop to LocationView with veiled and dimmed states"
```

---

## Task 3: Thread the prop from GameView

**Files:**
- Modify: `src/components/Game/GameView.tsx:459-475`

**Step 1: Find the LocationView render block**

Around line 459 in `GameView.tsx`:

```typescript
{viewLevel === 'location' && focusedLocation && focusedHex && (
  <LocationView
    location={focusedLocation}
    agents={focusedLocationAgents}
    hexTerrain={...}
    hexCol={focusedHex.col}
    hexRow={focusedHex.row}
    onAgentClick={handleAgentSelect}
    onBack={handleBackToHex}
    availableEncounters={locationEncounters.available}
    activeEncounters={locationEncounters.active}
    getAgentName={getAgentName}
    getEncounterTemplate={getEncounterById}
    graph={gameState.graph}
    seed={gameState.seed}
  />
)}
```

**Step 2: Add the lineOfSight prop**

```typescript
{viewLevel === 'location' && focusedLocation && focusedHex && (
  <LocationView
    location={focusedLocation}
    agents={focusedLocationAgents}
    hexTerrain={...}
    hexCol={focusedHex.col}
    hexRow={focusedHex.row}
    onAgentClick={handleAgentSelect}
    onBack={handleBackToHex}
    availableEncounters={locationEncounters.available}
    activeEncounters={locationEncounters.active}
    getAgentName={getAgentName}
    getEncounterTemplate={getEncounterById}
    graph={gameState.graph}
    seed={gameState.seed}
    lineOfSight={hexLineOfSight}   // ← add this line
  />
)}
```

`hexLineOfSight` is already in scope — it comes from `useHexZoomData` on line ~139.

**Step 3: TypeCheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 4: Run the full test suite one more time**

```bash
npx vitest run --reporter=verbose 2>&1 | tail -30
```

Expected: all tests pass.

**Step 5: Commit**

```bash
git add src/components/Game/GameView.tsx
git commit -m "feat: thread hexLineOfSight into LocationView from GameView"
```

---

## Done

LOS now covers the full hex-zoom → location hierarchy consistently. Verify in-game by:

1. Moving avatar to a hex with locations → LocationView shows full content
2. Zooming into an adjacent hex's location → content is dimmed
3. Zooming into a far hex's location → veiled screen with location name only
