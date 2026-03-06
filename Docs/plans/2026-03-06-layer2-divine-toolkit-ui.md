# Layer 2: Divine Toolkit UI — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make wheel slots functional — clicking an intervention slot shows a confirmation popover with cost/risk/range info, executes the intervention on confirm, and feeds results into the NarrativeFeed. Local interventions offer Visit/Summon sub-choices. Dream opens the Dream Interface. Range-gated slots show distance feedback.

**Architecture:** Three layers: (1) new delivery types and range constants in `src/types/dream.ts`, (2) range-checking logic and enhanced `executeIntervention` in `src/engine/dream.ts` + `src/engine/wheel.ts`, (3) a React `InterventionConfirm` popover component wired into `GameView.tsx` to replace the Layer 1 `// Other interventions will be handled in Layer 2` placeholder. All engine code is pure TypeScript with no React. All UI state lives in GameView.

**Tech Stack:** TypeScript, Vitest, React, existing engine modules (dream.ts, wheel.ts, influence.ts, stealth.ts).

**Design doc:** `Docs/plans/2026-03-05-intervention-delivery-mechanics.md`

**Existing code to build on:**
- `src/types/dream.ts` — InterventionType, InterventionDefinition, InterventionResult, INTERVENTION_DEFINITIONS
- `src/engine/dream.ts` — executeIntervention(), computeInterventionCost(), computeDetection()
- `src/engine/wheel.ts` — WheelSlot interface, getAgentWheelSlots(), WHEEL_LAYOUT
- `src/engine/influence.ts` — canAfford(), spendEssence()
- `src/engine/stealth.ts` — processMortalDetection(), processRivalDetection()
- `src/components/Game/GameView.tsx` — handleWheelSlotClick() (currently only handles 'scry')
- `src/components/Game/AgentWheel.tsx` — SVG radial menu
- `src/components/Game/NarrativeFeed.tsx` — event display

**Dependency order:**
```
Task 1: Delivery type definitions + range constants
  ↓
Task 2: Range-checking engine functions
  ↓
Task 3: Enhanced wheel slots with range status
  ↓
Task 4: InterventionConfirm popover component
  ↓
Task 5: Wire GameView — intervention flow end-to-end
  ↓
Task 6: Integration test
```

---

## Conventions (same as prior phases)

- **Tests** go in `src/engine/__tests__/<module>.test.ts` for engine, `src/components/Game/__tests__/<component>.test.tsx` for UI
- **IDs** use prefixes: `actor_`, `edge_`, `loc_`, etc.
- **No classes** in engine modules — export pure functions
- **All engine code** is deterministic when given a seed/roll parameter
- **Imports** use `type` keyword for type-only imports
- **Constants** are named and grouped at top of module or in type files

---

### Task 1: Delivery Type Definitions + Range Constants

**Files:**
- Modify: `src/types/dream.ts`

**Step 1: Write the failing test**

Create `src/engine/__tests__/delivery.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import type {
  DeliveryMode,
  LocalEncounterMode,
} from '../../types/dream';
import {
  DELIVERY_RANGE,
  LOCAL_ENCOUNTER,
  INTERVENTION_DEFINITIONS,
} from '../../types/dream';

describe('Delivery type definitions', () => {
  it('exports DELIVERY_RANGE with correct hex values', () => {
    expect(DELIVERY_RANGE.deceive).toBe(3);
    expect(DELIVERY_RANGE.intimidate).toBe(3);
    expect(DELIVERY_RANGE.inspire).toBe(5);
  });

  it('exports LOCAL_ENCOUNTER constants', () => {
    expect(LOCAL_ENCOUNTER.visitImpactBonus).toBe(1.15);
    expect(LOCAL_ENCOUNTER.summonEssenceCost).toBe(1);
    expect(LOCAL_ENCOUNTER.summonDetectionPenalty).toBe(0.10);
    expect(LOCAL_ENCOUNTER.summonImpactBonus).toBe(1.05);
  });

  it('every InterventionDefinition has a deliveryMode', () => {
    const validModes: DeliveryMode[] = ['astral', 'regional', 'remote', 'local'];
    for (const [key, def] of Object.entries(INTERVENTION_DEFINITIONS)) {
      expect(validModes).toContain(def.deliveryMode);
    }
  });

  it('maps intervention types to correct delivery modes', () => {
    expect(INTERVENTION_DEFINITIONS.dream.deliveryMode).toBe('astral');
    expect(INTERVENTION_DEFINITIONS.persuade.deliveryMode).toBe('local');
    expect(INTERVENTION_DEFINITIONS.deceive.deliveryMode).toBe('regional');
    expect(INTERVENTION_DEFINITIONS.intimidate.deliveryMode).toBe('regional');
    expect(INTERVENTION_DEFINITIONS.inspire_intervention.deliveryMode).toBe('regional');
    expect(INTERVENTION_DEFINITIONS.coincidence.deliveryMode).toBe('remote');
    expect(INTERVENTION_DEFINITIONS.omen.deliveryMode).toBe('remote');
    expect(INTERVENTION_DEFINITIONS.afflict_bless.deliveryMode).toBe('local');
  });

  it('regional interventions have a range in DELIVERY_RANGE', () => {
    for (const [key, def] of Object.entries(INTERVENTION_DEFINITIONS)) {
      if (def.deliveryMode === 'regional') {
        // The key in DELIVERY_RANGE uses the short name (deceive, intimidate, inspire)
        // For inspire_intervention, it maps to 'inspire'
        const rangeKey = key === 'inspire_intervention' ? 'inspire' : key;
        expect(DELIVERY_RANGE).toHaveProperty(rangeKey);
        expect((DELIVERY_RANGE as any)[rangeKey]).toBeGreaterThan(0);
      }
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/delivery.test.ts`
Expected: FAIL — `DeliveryMode` type not exported, `deliveryMode` property missing from `InterventionDefinition`, constants not exported.

**Step 3: Write minimal implementation**

Modify `src/types/dream.ts`:

1. Add new types after the existing `InterventionType`:
```typescript
/** How an intervention reaches its target */
export type DeliveryMode = 'astral' | 'regional' | 'remote' | 'local';

/** How a local encounter is initiated */
export type LocalEncounterMode = 'visit' | 'summon';
```

2. Add `deliveryMode` to `InterventionDefinition`:
```typescript
export interface InterventionDefinition {
  type: InterventionType;
  sphereAffinities: SphereName[];
  baseCost: number;
  detectionRisk: number;
  minTier: InfluenceTier;
  description: string;
  pipelineStep: 'scoring' | 'personality' | 'topN' | 'probability' | 'environment' | 'condition';
  deliveryMode: DeliveryMode;
}
```

3. Add `deliveryMode` to each entry in `INTERVENTION_DEFINITIONS`:
```typescript
dream:                { ..., deliveryMode: 'astral' },
persuade:             { ..., deliveryMode: 'local' },
deceive:              { ..., deliveryMode: 'regional' },
intimidate:           { ..., deliveryMode: 'regional' },
inspire_intervention: { ..., deliveryMode: 'regional' },
coincidence:          { ..., deliveryMode: 'remote' },
omen:                 { ..., deliveryMode: 'remote' },
afflict_bless:        { ..., deliveryMode: 'local' },
```

4. Add range and local encounter constants at the bottom:
```typescript
/** Intervention delivery range constants (in hexes from avatar position) */
export const DELIVERY_RANGE = {
  deceive: 3,
  intimidate: 3,
  inspire: 5,
} as const;

/** Local encounter modifiers */
export const LOCAL_ENCOUNTER = {
  visitImpactBonus: 1.15,
  summonEssenceCost: 1,
  summonDetectionPenalty: 0.10,
  summonImpactBonus: 1.05,
} as const;
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/delivery.test.ts`
Expected: PASS (all 5 tests)

**Step 5: Commit**

```bash
git add src/types/dream.ts src/engine/__tests__/delivery.test.ts
git commit -m "feat: add delivery mode types and range constants to intervention definitions"
```

---

### Task 2: Range-Checking Engine Functions

**Files:**
- Create: `src/engine/delivery.ts`
- Test: `src/engine/__tests__/delivery.test.ts` (extend)

**Step 1: Write the failing tests**

Append to `src/engine/__tests__/delivery.test.ts`:

```typescript
import {
  hexDistance,
  isInRange,
  getDeliveryInfo,
} from '../delivery';
import type { InterventionType } from '../../types/dream';

describe('hexDistance', () => {
  it('returns 0 for same hex', () => {
    expect(hexDistance({ col: 3, row: 4 }, { col: 3, row: 4 })).toBe(0);
  });

  it('returns 1 for adjacent hexes', () => {
    expect(hexDistance({ col: 3, row: 4 }, { col: 4, row: 4 })).toBe(1);
  });

  it('computes correct distance for offset hex grid', () => {
    // 3 hexes apart
    expect(hexDistance({ col: 0, row: 0 }, { col: 3, row: 0 })).toBe(3);
  });
});

describe('isInRange', () => {
  const avatarPos = { col: 5, row: 5 };

  it('astral interventions are always in range', () => {
    expect(isInRange(avatarPos, { col: 99, row: 99 }, 'dream')).toBe(true);
  });

  it('remote interventions are always in range', () => {
    expect(isInRange(avatarPos, { col: 99, row: 99 }, 'coincidence')).toBe(true);
    expect(isInRange(avatarPos, { col: 99, row: 99 }, 'omen')).toBe(true);
  });

  it('local interventions require same hex', () => {
    expect(isInRange(avatarPos, { col: 5, row: 5 }, 'persuade')).toBe(true);
    expect(isInRange(avatarPos, { col: 6, row: 5 }, 'persuade')).toBe(false);
    expect(isInRange(avatarPos, { col: 5, row: 5 }, 'afflict_bless')).toBe(true);
    expect(isInRange(avatarPos, { col: 4, row: 5 }, 'afflict_bless')).toBe(false);
  });

  it('regional interventions check hex distance against DELIVERY_RANGE', () => {
    // Deceive range = 3
    expect(isInRange(avatarPos, { col: 7, row: 5 }, 'deceive')).toBe(true);  // 2 hexes
    expect(isInRange(avatarPos, { col: 8, row: 5 }, 'deceive')).toBe(true);  // 3 hexes
    expect(isInRange(avatarPos, { col: 9, row: 5 }, 'deceive')).toBe(false); // 4 hexes
  });

  it('inspire has longer range (5) than intimidate (3)', () => {
    expect(isInRange(avatarPos, { col: 9, row: 5 }, 'inspire_intervention')).toBe(true);  // 4 hexes, within 5
    expect(isInRange(avatarPos, { col: 9, row: 5 }, 'intimidate')).toBe(false);           // 4 hexes, outside 3
  });
});

describe('getDeliveryInfo', () => {
  it('returns delivery mode and range for any intervention type', () => {
    const info = getDeliveryInfo('dream');
    expect(info.mode).toBe('astral');
    expect(info.range).toBeNull(); // unlimited
  });

  it('returns hex range for regional interventions', () => {
    const info = getDeliveryInfo('deceive');
    expect(info.mode).toBe('regional');
    expect(info.range).toBe(3);
  });

  it('returns range 0 for local interventions', () => {
    const info = getDeliveryInfo('persuade');
    expect(info.mode).toBe('local');
    expect(info.range).toBe(0);
  });

  it('returns null range for remote interventions', () => {
    const info = getDeliveryInfo('coincidence');
    expect(info.mode).toBe('remote');
    expect(info.range).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/delivery.test.ts`
Expected: FAIL — `hexDistance`, `isInRange`, `getDeliveryInfo` not found.

**Step 3: Write minimal implementation**

Create `src/engine/delivery.ts`:

```typescript
/**
 * Delivery mechanics — range checking and delivery mode queries.
 */

import type { InterventionType, DeliveryMode } from '../types/dream';
import { INTERVENTION_DEFINITIONS, DELIVERY_RANGE } from '../types/dream';

// ─── Hex Distance ─────────────────────────────────────────────────────

export interface HexPosition {
  col: number;
  row: number;
}

/**
 * Compute the distance between two hexes on an offset hex grid.
 * Uses cube coordinate conversion for accurate hex distance.
 */
export function hexDistance(a: HexPosition, b: HexPosition): number {
  // Convert offset coordinates to cube coordinates
  const ax = a.col - Math.floor(a.row / 2);
  const az = a.row;
  const ay = -ax - az;

  const bx = b.col - Math.floor(b.row / 2);
  const bz = b.row;
  const by = -bx - bz;

  return Math.max(Math.abs(ax - bx), Math.abs(ay - by), Math.abs(az - bz));
}

// ─── Range Checking ───────────────────────────────────────────────────

/**
 * Check if an intervention can reach from avatar's position to target's position.
 *
 * - astral/remote: always in range (unlimited)
 * - regional: hex distance ≤ DELIVERY_RANGE[type]
 * - local: must be same hex (distance 0)
 */
export function isInRange(
  avatarPos: HexPosition,
  targetPos: HexPosition,
  interventionType: InterventionType,
): boolean {
  const def = INTERVENTION_DEFINITIONS[interventionType];

  switch (def.deliveryMode) {
    case 'astral':
    case 'remote':
      return true;
    case 'local':
      return hexDistance(avatarPos, targetPos) === 0;
    case 'regional': {
      const rangeKey = interventionType === 'inspire_intervention' ? 'inspire' : interventionType;
      const maxRange = (DELIVERY_RANGE as Record<string, number>)[rangeKey] ?? 0;
      return hexDistance(avatarPos, targetPos) <= maxRange;
    }
  }
}

// ─── Delivery Info ────────────────────────────────────────────────────

export interface DeliveryInfo {
  mode: DeliveryMode;
  /** Max hex range, or null for unlimited (astral/remote) */
  range: number | null;
}

/**
 * Get delivery mode and range for an intervention type.
 */
export function getDeliveryInfo(interventionType: InterventionType): DeliveryInfo {
  const def = INTERVENTION_DEFINITIONS[interventionType];

  switch (def.deliveryMode) {
    case 'astral':
    case 'remote':
      return { mode: def.deliveryMode, range: null };
    case 'local':
      return { mode: 'local', range: 0 };
    case 'regional': {
      const rangeKey = interventionType === 'inspire_intervention' ? 'inspire' : interventionType;
      const maxRange = (DELIVERY_RANGE as Record<string, number>)[rangeKey] ?? 0;
      return { mode: 'regional', range: maxRange };
    }
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/delivery.test.ts`
Expected: PASS (all tests)

**Step 5: Commit**

```bash
git add src/engine/delivery.ts src/engine/__tests__/delivery.test.ts
git commit -m "feat: add hex distance, range checking, and delivery info engine functions"
```

---

### Task 3: Enhanced Wheel Slots with Range Status

**Files:**
- Modify: `src/engine/wheel.ts`
- Modify: `src/engine/__tests__/wheel.test.ts` (extend existing)

**Step 1: Write the failing tests**

Append new tests to the existing `src/engine/__tests__/wheel.test.ts`:

```typescript
import type { HexPosition } from '../delivery';

describe('getAgentWheelSlots with range', () => {
  it('adds rangeStatus "in_range" for regional slot within range', () => {
    const slots = getAgentWheelSlots({
      tier: 2,
      pool: fullPool(10),
      primarySphere: 'mind',
      avatarPos: { col: 5, row: 5 },
      targetPos: { col: 7, row: 5 }, // 2 hexes away, deceive range = 3
    });
    const deceive = slots.find(s => s.id === 'deceive')!;
    expect(deceive.rangeStatus).toBe('in_range');
    expect(deceive.available).toBe(true);
  });

  it('adds rangeStatus "out_of_range" for regional slot outside range', () => {
    const slots = getAgentWheelSlots({
      tier: 2,
      pool: fullPool(10),
      primarySphere: 'mind',
      avatarPos: { col: 0, row: 0 },
      targetPos: { col: 10, row: 10 }, // far away
    });
    const deceive = slots.find(s => s.id === 'deceive')!;
    expect(deceive.rangeStatus).toBe('out_of_range');
    expect(deceive.available).toBe(false);
    expect(deceive.lockedReason).toContain('out of range');
  });

  it('local slots are out_of_range when not same hex', () => {
    const slots = getAgentWheelSlots({
      tier: 1,
      pool: fullPool(10),
      primarySphere: 'spirit',
      avatarPos: { col: 5, row: 5 },
      targetPos: { col: 6, row: 5 },
    });
    const persuade = slots.find(s => s.id === 'persuade')!;
    expect(persuade.rangeStatus).toBe('out_of_range');
    expect(persuade.available).toBe(false);
  });

  it('astral and remote slots always show unlimited range', () => {
    const slots = getAgentWheelSlots({
      tier: 3,
      pool: fullPool(10),
      primarySphere: 'mind',
      avatarPos: { col: 0, row: 0 },
      targetPos: { col: 99, row: 99 },
    });
    const dream = slots.find(s => s.id === 'dream')!;
    expect(dream.rangeStatus).toBe('unlimited');
    const coincidence = slots.find(s => s.id === 'coincidence')!;
    expect(coincidence.rangeStatus).toBe('unlimited');
  });

  it('falls back to no range check when positions not provided', () => {
    const slots = getAgentWheelSlots({
      tier: 2,
      pool: fullPool(10),
      primarySphere: 'mind',
    });
    const deceive = slots.find(s => s.id === 'deceive')!;
    expect(deceive.rangeStatus).toBe('unknown');
    expect(deceive.available).toBe(true); // available if tier + essence OK
  });
});
```

Where `fullPool` is a test helper:
```typescript
function fullPool(amount: number): EssencePool {
  return { force: amount, matter: amount, energy: amount, life: amount, mind: amount, spirit: amount, time: amount, entropy: amount };
}
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/wheel.test.ts`
Expected: FAIL — `rangeStatus` property doesn't exist on WheelSlot, `avatarPos`/`targetPos` params not accepted.

**Step 3: Write minimal implementation**

Modify `src/engine/wheel.ts`:

1. Add import:
```typescript
import type { HexPosition } from './delivery';
import { isInRange } from './delivery';
```

2. Add `rangeStatus` to `WheelSlot`:
```typescript
export interface WheelSlot {
  // ... existing fields ...
  /** Range status: in_range, out_of_range, unlimited, or unknown (no position data) */
  rangeStatus: 'in_range' | 'out_of_range' | 'unlimited' | 'unknown';
  /** Hex distance from avatar to target (null if no position data) */
  hexDistance: number | null;
}
```

3. Add optional `avatarPos` and `targetPos` to `getAgentWheelSlots` params:
```typescript
export function getAgentWheelSlots(params: {
  tier: InfluenceTier;
  pool: EssencePool;
  primarySphere: SphereName;
  avatarPos?: HexPosition;
  targetPos?: HexPosition;
}): WheelSlot[]
```

4. In the function body, compute range status per slot using `isInRange()` and the delivery mode from `INTERVENTION_DEFINITIONS`. If `avatarPos`/`targetPos` are not provided, `rangeStatus` is `'unknown'` and range doesn't gate availability. If provided, out-of-range overrides `available = false`.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/wheel.test.ts`
Expected: PASS (all tests, including existing ones which should still pass because they don't provide positions)

**Step 5: Commit**

```bash
git add src/engine/wheel.ts src/engine/__tests__/wheel.test.ts
git commit -m "feat: add range status to wheel slots with avatar/target position checking"
```

---

### Task 4: InterventionConfirm Popover Component

**Files:**
- Create: `src/components/Game/InterventionConfirm.tsx`
- Create: `src/components/Game/__tests__/InterventionConfirm.test.tsx`

**Step 1: Write the failing test**

Create `src/components/Game/__tests__/InterventionConfirm.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InterventionConfirm } from '../InterventionConfirm';

const baseProps = {
  interventionType: 'deceive' as const,
  label: 'Deceive',
  deliveryMode: 'regional' as const,
  essenceCost: 2,
  sphere: 'mind' as const,
  detectionRisk: 0.30,
  rangeStatus: 'in_range' as const,
  hexDistance: 2,
  description: 'Inject false information into world-model',
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
};

describe('InterventionConfirm', () => {
  it('renders intervention name and description', () => {
    render(<InterventionConfirm {...baseProps} />);
    expect(screen.getByText('Deceive')).toBeTruthy();
    expect(screen.getByText(/false information/)).toBeTruthy();
  });

  it('shows essence cost and detection risk', () => {
    render(<InterventionConfirm {...baseProps} />);
    expect(screen.getByText(/2 mind/i)).toBeTruthy();
    expect(screen.getByText(/30%/)).toBeTruthy();
  });

  it('calls onConfirm when confirm button clicked', () => {
    render(<InterventionConfirm {...baseProps} />);
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));
    expect(baseProps.onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onCancel when cancel button clicked', () => {
    render(<InterventionConfirm {...baseProps} />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(baseProps.onCancel).toHaveBeenCalledOnce();
  });

  it('shows local encounter choice for local delivery mode', () => {
    render(
      <InterventionConfirm
        {...baseProps}
        interventionType="persuade"
        label="Persuade"
        deliveryMode="local"
        rangeStatus="in_range"
        hexDistance={0}
      />
    );
    expect(screen.getByText(/go to them/i)).toBeTruthy();
    expect(screen.getByText(/summon/i)).toBeTruthy();
  });

  it('calls onConfirm with encounter mode for local interventions', () => {
    const onConfirm = vi.fn();
    render(
      <InterventionConfirm
        {...baseProps}
        interventionType="persuade"
        label="Persuade"
        deliveryMode="local"
        rangeStatus="in_range"
        hexDistance={0}
        onConfirm={onConfirm}
      />
    );
    fireEvent.click(screen.getByText(/summon/i));
    expect(onConfirm).toHaveBeenCalledWith('summon');
  });

  it('shows out-of-range message when out of range', () => {
    render(
      <InterventionConfirm
        {...baseProps}
        rangeStatus="out_of_range"
        hexDistance={7}
      />
    );
    expect(screen.getByText(/out of range/i)).toBeTruthy();
    // Confirm button should be disabled or hidden
    expect(screen.queryByRole('button', { name: /confirm/i })).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/Game/__tests__/InterventionConfirm.test.tsx`
Expected: FAIL — module not found.

**Step 3: Write minimal implementation**

Create `src/components/Game/InterventionConfirm.tsx`:

A small floating panel (absolutely positioned near the wheel slot) that shows:
- Intervention name + glyph
- Description (one line)
- Cost: `{cost} {sphere} essence`
- Risk: `{risk}% detection`
- Range indicator (Regional: "2/3 hexes", Local: "same hex", Remote: "unlimited")
- For `local` delivery: two buttons ("Go to Them (+15%)" / "Summon (+1 ess, +10% det)")
- For all others: Confirm / Cancel buttons
- When out of range: shows "Out of range — move avatar closer" with Cancel only

Props:
```typescript
export interface InterventionConfirmProps {
  interventionType: InterventionType;
  label: string;
  deliveryMode: DeliveryMode;
  essenceCost: number;
  sphere: SphereName;
  detectionRisk: number;
  rangeStatus: 'in_range' | 'out_of_range' | 'unlimited' | 'unknown';
  hexDistance: number | null;
  description: string;
  onConfirm: (encounterMode?: LocalEncounterMode) => void;
  onCancel: () => void;
}
```

Style: dark stone background (`bg-stone-800`), amber border, Cinzel headings, small popover feel. Keep it under 100 lines.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/Game/__tests__/InterventionConfirm.test.tsx`
Expected: PASS (all 7 tests)

**Step 5: Commit**

```bash
git add src/components/Game/InterventionConfirm.tsx src/components/Game/__tests__/InterventionConfirm.test.tsx
git commit -m "feat: add InterventionConfirm popover component with local encounter choice"
```

---

### Task 5: Wire GameView — Intervention Flow End-to-End

**Files:**
- Modify: `src/components/Game/GameView.tsx`
- Modify: `src/components/Game/__tests__/GameView-interaction.test.tsx` (extend)

**Step 1: Write the failing tests**

Append to `src/components/Game/__tests__/GameView-interaction.test.tsx`:

```typescript
describe('Intervention confirmation flow', () => {
  it('shows InterventionConfirm when intervention slot clicked', () => {
    // Setup: render GameView, select agent, click intervention slot
    // Verify: InterventionConfirm is rendered with correct props
  });

  it('executes intervention on confirm and adds event to narrative feed', () => {
    // Setup: render, select agent, click slot, click confirm
    // Verify: essence decreased, event in narrative feed
  });

  it('dismisses popover on cancel', () => {
    // Setup: render, select agent, click slot, click cancel
    // Verify: InterventionConfirm gone, wheel still visible
  });
});
```

Note: These tests will need mock data. Follow the pattern in the existing `GameView-interaction.test.tsx` file for mocking GameState and retinue agents.

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/Game/__tests__/GameView-interaction.test.tsx`
Expected: FAIL — InterventionConfirm not rendered.

**Step 3: Write minimal implementation**

Modify `src/components/Game/GameView.tsx`:

1. Add imports:
```typescript
import { InterventionConfirm } from './InterventionConfirm';
import { getDeliveryInfo } from '../../engine/delivery';
import { isInRange } from '../../engine/delivery';
import type { LocalEncounterMode, InterventionType } from '../../types/dream';
import { INTERVENTION_DEFINITIONS } from '../../types/dream';
import { executeIntervention } from '../../engine/dream';
import { spendEssence } from '../../engine/influence';
```

2. Add state:
```typescript
const [pendingIntervention, setPendingIntervention] = useState<{
  slotId: string;
  interventionType: InterventionType;
} | null>(null);
```

3. Replace the placeholder in `handleWheelSlotClick`:
```typescript
const handleWheelSlotClick = useCallback((slotId: string) => {
  if (slotId === 'scry' && selectedAgentId) {
    setStrandViewAgent(selectedAgentId);
    setWheelVisible(false);
    return;
  }

  // Find the slot to get the intervention type
  const slot = wheelSlots?.find(s => s.id === slotId);
  if (!slot?.interventionType || !slot.available) return;

  // For dream: open dream interface (placeholder for Layer 3)
  if (slot.interventionType === 'dream') {
    // TODO: Layer 3 will open DreamInterface here
    return;
  }

  // For all other interventions: show confirmation popover
  setPendingIntervention({
    slotId,
    interventionType: slot.interventionType,
  });
}, [selectedAgentId, wheelSlots]);
```

4. Add `handleInterventionConfirm` and `handleInterventionCancel`:
```typescript
const handleInterventionConfirm = useCallback((encounterMode?: LocalEncounterMode) => {
  if (!pendingIntervention || !selectedAgentId) return;

  const def = INTERVENTION_DEFINITIONS[pendingIntervention.interventionType];
  const slot = wheelSlots?.find(s => s.id === pendingIntervention.slotId);
  if (!slot?.sphere) return;

  // Execute intervention
  const result = executeIntervention({
    interventionType: pendingIntervention.interventionType,
    sphere: slot.sphere,
    baseCost: slot.essenceCost,
    alignmentFactor: 1.0, // Simplified for now; full alignment from actor profile in Layer 3
    actorType: 'individual',
    pool: gameState.essencePool,
  });

  if (result.success) {
    // Spend essence
    setGameState(prev => {
      const newPool = { ...prev.essencePool };
      spendEssence(newPool, slot.sphere!, result.essenceSpent[slot.sphere!]);
      return {
        ...prev,
        essencePool: newPool,
        recentEvents: [
          ...prev.recentEvents,
          {
            id: `evt_intervention_${prev.tick}`,
            tick: prev.tick,
            type: 'intervention' as const,
            text: `${def.description} (${result.detected ? 'detected!' : 'undetected'})`,
            importance: result.detected ? 'notable' : 'routine',
          },
        ],
      };
    });
  }

  setPendingIntervention(null);
  setWheelVisible(false);
}, [pendingIntervention, selectedAgentId, wheelSlots, gameState.essencePool]);

const handleInterventionCancel = useCallback(() => {
  setPendingIntervention(null);
}, []);
```

5. Add InterventionConfirm to JSX (inside the main content area, after the wheel):
```tsx
{pendingIntervention && wheelSlots && (
  <InterventionConfirm
    interventionType={pendingIntervention.interventionType}
    label={wheelSlots.find(s => s.id === pendingIntervention.slotId)?.label ?? ''}
    deliveryMode={INTERVENTION_DEFINITIONS[pendingIntervention.interventionType].deliveryMode}
    essenceCost={wheelSlots.find(s => s.id === pendingIntervention.slotId)?.essenceCost ?? 0}
    sphere={wheelSlots.find(s => s.id === pendingIntervention.slotId)?.sphere ?? 'mind'}
    detectionRisk={wheelSlots.find(s => s.id === pendingIntervention.slotId)?.detectionRisk ?? 0}
    rangeStatus={wheelSlots.find(s => s.id === pendingIntervention.slotId)?.rangeStatus ?? 'unknown'}
    hexDistance={wheelSlots.find(s => s.id === pendingIntervention.slotId)?.hexDistance ?? null}
    description={INTERVENTION_DEFINITIONS[pendingIntervention.interventionType].description}
    onConfirm={handleInterventionConfirm}
    onCancel={handleInterventionCancel}
  />
)}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/Game/__tests__/GameView-interaction.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/Game/GameView.tsx src/components/Game/__tests__/GameView-interaction.test.tsx
git commit -m "feat: wire intervention confirmation flow into GameView"
```

---

### Task 6: Integration Test

**Files:**
- Create: `src/engine/__tests__/delivery-integration.test.ts`

**Step 1: Write the integration test**

```typescript
import { describe, it, expect } from 'vitest';
import { getAgentWheelSlots } from '../wheel';
import { isInRange, hexDistance, getDeliveryInfo } from '../delivery';
import { executeIntervention } from '../dream';
import { INTERVENTION_DEFINITIONS, DELIVERY_RANGE, LOCAL_ENCOUNTER } from '../../types/dream';
import type { EssencePool } from '../../types/influence';

function fullPool(amount: number): EssencePool {
  return { force: amount, matter: amount, energy: amount, life: amount, mind: amount, spirit: amount, time: amount, entropy: amount };
}

describe('Delivery mechanics integration', () => {
  it('wheel slots gate availability by range for regional interventions', () => {
    const slots = getAgentWheelSlots({
      tier: 3,
      pool: fullPool(20),
      primarySphere: 'mind',
      avatarPos: { col: 0, row: 0 },
      targetPos: { col: 10, row: 10 },
    });

    // Dream (astral) should be available — unlimited range
    expect(slots.find(s => s.id === 'dream')!.available).toBe(true);
    // Coincidence (remote) should be available — unlimited range
    expect(slots.find(s => s.id === 'coincidence')!.available).toBe(true);
    // Deceive (regional, range 3) should be unavailable — too far
    expect(slots.find(s => s.id === 'deceive')!.available).toBe(false);
    // Persuade (local) should be unavailable — not same hex
    expect(slots.find(s => s.id === 'persuade')!.available).toBe(false);
  });

  it('full intervention flow: range check → cost → execute → result', () => {
    const avatarPos = { col: 5, row: 5 };
    const targetPos = { col: 7, row: 5 }; // 2 hexes away

    // 1. Check range for deceive (regional, range 3)
    expect(isInRange(avatarPos, targetPos, 'deceive')).toBe(true);

    // 2. Get wheel slots with positions
    const slots = getAgentWheelSlots({
      tier: 2,
      pool: fullPool(10),
      primarySphere: 'mind',
      avatarPos,
      targetPos,
    });
    const deceiveSlot = slots.find(s => s.id === 'deceive')!;
    expect(deceiveSlot.available).toBe(true);
    expect(deceiveSlot.rangeStatus).toBe('in_range');

    // 3. Execute intervention
    const result = executeIntervention({
      interventionType: 'deceive',
      sphere: 'mind',
      baseCost: 2,
      alignmentFactor: 1.0,
      actorType: 'individual',
      pool: fullPool(10),
      detectionRoll: 0.5, // > 0.3 detection risk, so not detected
    });
    expect(result.success).toBe(true);
    expect(result.detected).toBe(false);
  });

  it('every intervention type has consistent delivery info', () => {
    for (const [key, def] of Object.entries(INTERVENTION_DEFINITIONS)) {
      const info = getDeliveryInfo(key as any);
      expect(info.mode).toBe(def.deliveryMode);
    }
  });
});
```

**Step 2: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/delivery-integration.test.ts`
Expected: PASS (all 3 tests)

**Step 3: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass (existing + new)

**Step 4: Commit**

```bash
git add src/engine/__tests__/delivery-integration.test.ts
git commit -m "test: add delivery mechanics integration tests"
```

---

## Post-Implementation Documentation Checklist

After all tasks pass, complete these documentation updates (per CLAUDE.md session workflow):

1. **Notion backlog** — Mark Phase 6B tasks as complete, update progress
2. **Obsidian vault** — Update `Intervention Delivery.md` with implementation details, update `Agent Wheel.md` with range status fields
3. **CLAUDE.md** — Update project status (Phase 6B complete), engine stats, append changelog entries
