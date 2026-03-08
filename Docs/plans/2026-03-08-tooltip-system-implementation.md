# Tooltip System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a tooltip system for onboarding/discoverability with linked concept chains, driven by existing content packages (zero duplication).

**Architecture:** Custom `<Tooltip>` component wraps trigger elements, resolves content at runtime via `resolveTooltip(id)` which routes to existing content packages by ID prefix. Descriptions can contain `{{concept.id}}` markers rendered as hoverable links spawning child tooltips (max depth 2). A small `ui-content.ts` holds UI-system tooltip strings.

**Tech Stack:** React 19, TypeScript, Tailwind 4.2, vitest + @testing-library/react. No external tooltip library.

**Design Doc:** `Docs/plans/2026-03-08-tooltip-system-design.md`

---

### Task 1: Tooltip Types

**Files:**
- Create: `src/types/tooltip.ts`
- Test: `src/types/__tests__/tooltip.test.ts`

**Step 1: Write the type definitions**

```typescript
// src/types/tooltip.ts

/**
 * Tooltip Content — resolved from content packages or ui-content.ts.
 *
 * ═══════════════════════════════════════════════════════════════════
 * CONTENT MANAGER: This file defines the tooltip content interface.
 * To add new tooltip IDs, update resolveTooltip() in engine/tooltipResolver.ts.
 * To add UI-system tooltips, update data/ui-content.ts.
 * ═══════════════════════════════════════════════════════════════════
 */

/** Resolved tooltip content returned by resolveTooltip(). */
export interface TooltipContent {
  /** Primary label — short, bold, Cinzel font. */
  label: string;
  /** Optional description — longer, Inter font. May contain {{concept.id}} links. */
  desc?: string;
}

/** Tooltip placement relative to trigger element. */
export type TooltipPlacement = 'above' | 'below';

// ─── Timing Constants ────────────────────────────────────────────

/** Delay before showing tooltip on hover (ms). Prevents flash on quick sweeps. */
export const TOOLTIP_SHOW_DELAY = 200;

/** Fade-in animation duration (ms). */
export const TOOLTIP_FADE_IN = 150;

/** Fade-out animation duration (ms). */
export const TOOLTIP_FADE_OUT = 100;

/** Grace period for moving between tooltip targets without re-delay (ms). */
export const TOOLTIP_RETRIGGER_GRACE = 300;

// ─── Positioning Constants ───────────────────────────────────────

/** Flip to below if trigger is within this many px of top viewport edge. */
export const TOOLTIP_TOP_THRESHOLD = 80;

/** Shift horizontally if within this many px of left/right viewport edge. */
export const TOOLTIP_SIDE_THRESHOLD = 100;

/** Maximum tooltip width in px. */
export const TOOLTIP_MAX_WIDTH = 220;

/** Gap between tooltip and trigger element in px. */
export const TOOLTIP_OFFSET = 8;

// ─── Chain Constants ─────────────────────────────────────────────

/** Maximum depth for linked tooltip chains. */
export const TOOLTIP_MAX_CHAIN_DEPTH = 2;

/** Regex to match {{concept.id}} markers in tooltip descriptions. */
export const TOOLTIP_LINK_PATTERN = /\{\{([a-z_]+\.[a-z0-9_.]+)\}\}/g;
```

**Step 2: Write the type tests**

```typescript
// src/types/__tests__/tooltip.test.ts
import { describe, it, expect } from 'vitest';
import {
  TOOLTIP_SHOW_DELAY,
  TOOLTIP_FADE_IN,
  TOOLTIP_FADE_OUT,
  TOOLTIP_RETRIGGER_GRACE,
  TOOLTIP_TOP_THRESHOLD,
  TOOLTIP_SIDE_THRESHOLD,
  TOOLTIP_MAX_WIDTH,
  TOOLTIP_OFFSET,
  TOOLTIP_MAX_CHAIN_DEPTH,
  TOOLTIP_LINK_PATTERN,
} from '../tooltip';
import type { TooltipContent, TooltipPlacement } from '../tooltip';

describe('tooltip types', () => {
  it('exports timing constants as positive numbers', () => {
    expect(TOOLTIP_SHOW_DELAY).toBeGreaterThan(0);
    expect(TOOLTIP_FADE_IN).toBeGreaterThan(0);
    expect(TOOLTIP_FADE_OUT).toBeGreaterThan(0);
    expect(TOOLTIP_RETRIGGER_GRACE).toBeGreaterThan(0);
  });

  it('exports positioning constants as positive numbers', () => {
    expect(TOOLTIP_TOP_THRESHOLD).toBeGreaterThan(0);
    expect(TOOLTIP_SIDE_THRESHOLD).toBeGreaterThan(0);
    expect(TOOLTIP_MAX_WIDTH).toBeGreaterThan(0);
    expect(TOOLTIP_OFFSET).toBeGreaterThan(0);
  });

  it('limits chain depth to 2', () => {
    expect(TOOLTIP_MAX_CHAIN_DEPTH).toBe(2);
  });

  it('TOOLTIP_LINK_PATTERN matches {{concept.id}} markers', () => {
    const text = 'Influenced by {{sphere.force}} and {{doom.unmaking}}';
    const matches = [...text.matchAll(TOOLTIP_LINK_PATTERN)];
    expect(matches).toHaveLength(2);
    expect(matches[0][1]).toBe('sphere.force');
    expect(matches[1][1]).toBe('doom.unmaking');
  });

  it('TOOLTIP_LINK_PATTERN does not match malformed markers', () => {
    const text = 'No match: {{ broken }} or {single} or {{CAPS.id}}';
    const matches = [...text.matchAll(TOOLTIP_LINK_PATTERN)];
    expect(matches).toHaveLength(0);
  });

  it('TooltipContent interface allows desc to be optional', () => {
    const withDesc: TooltipContent = { label: 'Force', desc: 'Sharp power' };
    const withoutDesc: TooltipContent = { label: 'Force' };
    expect(withDesc.desc).toBeDefined();
    expect(withoutDesc.desc).toBeUndefined();
  });

  it('TooltipPlacement is above or below', () => {
    const above: TooltipPlacement = 'above';
    const below: TooltipPlacement = 'below';
    expect(above).toBe('above');
    expect(below).toBe('below');
  });
});
```

**Step 3: Run tests to verify they pass**

Run: `npx vitest run src/types/__tests__/tooltip.test.ts`
Expected: PASS (all 7 tests)

**Step 4: Commit**

```bash
git add src/types/tooltip.ts src/types/__tests__/tooltip.test.ts
git commit -m "feat(tooltip): add tooltip type foundation — TooltipContent, placement, timing/positioning/chain constants"
```

---

### Task 2: UI Content Package

**Files:**
- Create: `src/data/ui-content.ts`
- Test: `src/data/__tests__/ui-content.test.ts`

**Step 1: Write the failing tests**

```typescript
// src/data/__tests__/ui-content.test.ts
import { describe, it, expect } from 'vitest';
import { UI_TOOLTIPS, getUITooltip } from '../ui-content';

describe('UI_TOOLTIPS', () => {
  it('has entries for all core HUD elements', () => {
    const requiredKeys = [
      'ui.doom_bar',
      'ui.essence_panel',
      'ui.mandate_tracker',
      'ui.avatar_move',
      'ui.avatar_wheel',
      'ui.avatar_scry',
      'ui.sim_play_pause',
      'ui.sim_speed',
      'ui.rival_panel',
    ];
    for (const key of requiredKeys) {
      expect(UI_TOOLTIPS[key], `Missing tooltip for ${key}`).toBeDefined();
      expect(UI_TOOLTIPS[key].label.length).toBeGreaterThan(0);
    }
  });

  it('every entry has a non-empty label', () => {
    for (const [key, entry] of Object.entries(UI_TOOLTIPS)) {
      expect(entry.label.length, `${key} has empty label`).toBeGreaterThan(0);
    }
  });

  it('descriptions that contain {{links}} use valid format', () => {
    const linkPattern = /\{\{([a-z_]+\.[a-z0-9_.]+)\}\}/g;
    for (const [key, entry] of Object.entries(UI_TOOLTIPS)) {
      if (entry.desc) {
        const matches = [...entry.desc.matchAll(linkPattern)];
        for (const match of matches) {
          // Verify link IDs have a valid prefix
          const prefix = match[1].split('.')[0];
          const validPrefixes = ['sphere', 'doom', 'ui', 'archetype', 'reach', 'terrain', 'mandate'];
          expect(validPrefixes, `${key} has link with unknown prefix: ${prefix}`).toContain(prefix);
        }
      }
    }
  });
});

describe('getUITooltip', () => {
  it('returns content for known ID', () => {
    const result = getUITooltip('ui.doom_bar');
    expect(result).not.toBeNull();
    expect(result!.label).toBeTruthy();
  });

  it('returns null for unknown ID', () => {
    expect(getUITooltip('ui.nonexistent')).toBeNull();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/data/__tests__/ui-content.test.ts`
Expected: FAIL — module not found

**Step 3: Write the implementation**

```typescript
// src/data/ui-content.ts
/**
 * UI Content Package — Tooltip strings for UI-system elements.
 *
 * ═══════════════════════════════════════════════════════════════════
 * CONTENT MANAGER: This is the file you edit to change tooltip text
 * for UI buttons, panels, and controls. Game-entity tooltips (spheres,
 * reaches, archetypes) are resolved from their respective content
 * packages — do NOT duplicate them here.
 * ═══════════════════════════════════════════════════════════════════
 */

import type { TooltipContent } from '../types/tooltip';

export const UI_TOOLTIPS: Record<string, TooltipContent> = {
  // ─── Core HUD ──────────────────────────────────────────────────
  'ui.doom_bar': {
    label: 'Doom Clock',
    desc: 'Tracks the world\'s descent toward the Unmaking. Each stage escalates {{sphere.entropy}} effects.',
  },
  'ui.essence_panel': {
    label: 'Divine Essence',
    desc: 'Your power reserve. Spent on {{ui.avatar_wheel}} interventions, replenished by {{ui.mandate_tracker}} completion.',
  },
  'ui.mandate_tracker': {
    label: 'Active Mandates',
    desc: 'Divine objectives — complete them to gain essence and slow the {{ui.doom_bar}}.',
  },

  // ─── Avatar Actions ────────────────────────────────────────────
  'ui.avatar_move': {
    label: 'Move Avatar',
    desc: 'Relocate your divine presence to a visible hex on the map.',
  },
  'ui.avatar_wheel': {
    label: 'Agent Wheel',
    desc: 'Open the wheel of divine interventions for the selected agent.',
  },
  'ui.avatar_scry': {
    label: 'Ascendant Scry',
    desc: 'Organize your divine court — assign agents to positions of power.',
  },

  // ─── Simulation Controls ──────────────────────────────────────
  'ui.sim_play_pause': {
    label: 'Play / Pause',
    desc: 'Advance or pause the world simulation.',
  },
  'ui.sim_speed': {
    label: 'Tick Speed',
    desc: 'How fast the world turns — higher speed skips routine events.',
  },

  // ─── Panels ────────────────────────────────────────────────────
  'ui.rival_panel': {
    label: 'Rival Gods',
    desc: 'Other divine powers competing for influence over the world.',
  },
  'ui.retinue_panel': {
    label: 'Retinue',
    desc: 'Mortal agents under your divine influence, ranked by tier.',
  },
  'ui.debug_panel': {
    label: 'Debug Traces',
    desc: 'Engine decision traces — action selection, narrative generation, context harvest.',
  },
};

/** Lookup a UI tooltip by ID. Returns null if not found. */
export function getUITooltip(id: string): TooltipContent | null {
  return UI_TOOLTIPS[id] ?? null;
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/data/__tests__/ui-content.test.ts`
Expected: PASS (all 5 tests)

**Step 5: Commit**

```bash
git add src/data/ui-content.ts src/data/__tests__/ui-content.test.ts
git commit -m "feat(tooltip): add ui-content.ts — UI-system tooltip strings for core HUD elements"
```

---

### Task 3: Tooltip Resolver

**Files:**
- Create: `src/engine/tooltipResolver.ts`
- Test: `src/engine/__tests__/tooltipResolver.test.ts`

This is the core zero-duplication layer. It routes by ID prefix to existing content packages.

**Step 1: Write the failing tests**

```typescript
// src/engine/__tests__/tooltipResolver.test.ts
import { describe, it, expect } from 'vitest';
import { resolveTooltip } from '../tooltipResolver';

describe('resolveTooltip', () => {
  // ─── UI tooltips ─────────────────────────────────────────────
  it('resolves ui.* IDs from ui-content.ts', () => {
    const result = resolveTooltip('ui.doom_bar');
    expect(result).not.toBeNull();
    expect(result!.label).toBe('Doom Clock');
    expect(result!.desc).toContain('Unmaking');
  });

  it('returns null for unknown ui.* IDs', () => {
    expect(resolveTooltip('ui.nonexistent')).toBeNull();
  });

  // ─── Sphere tooltips ─────────────────────────────────────────
  it('resolves sphere.* IDs from world-model.json', () => {
    const force = resolveTooltip('sphere.force');
    expect(force).not.toBeNull();
    expect(force!.label).toContain('Force');
    expect(force!.desc).toBeTruthy();
  });

  it('resolves foundation sphere IDs', () => {
    const chaos = resolveTooltip('sphere.chaos');
    expect(chaos).not.toBeNull();
    expect(chaos!.label).toContain('Chaos');
  });

  // ─── Reach tooltips ──────────────────────────────────────────
  it('resolves reach.* IDs from world-model.json', () => {
    const iron = resolveTooltip('reach.iron');
    expect(iron).not.toBeNull();
    expect(iron!.label).toContain('Iron');
  });

  // ─── Terrain tooltips ────────────────────────────────────────
  it('resolves terrain.* IDs from world-model.json', () => {
    const forest = resolveTooltip('terrain.forest');
    expect(forest).not.toBeNull();
    expect(forest!.label).toBeTruthy();
  });

  // ─── Archetype tooltips ──────────────────────────────────────
  it('resolves archetype.* IDs from archetype-content.ts', () => {
    const hero = resolveTooltip('archetype.reluctant_hero');
    expect(hero).not.toBeNull();
    expect(hero!.label).toBeTruthy();
    expect(hero!.desc).toBeTruthy();
  });

  // ─── Doom tooltips ───────────────────────────────────────────
  it('resolves doom.unmaking', () => {
    const result = resolveTooltip('doom.unmaking');
    expect(result).not.toBeNull();
    expect(result!.label).toBeTruthy();
  });

  // ─── Unknown prefix ──────────────────────────────────────────
  it('returns null for completely unknown prefix', () => {
    expect(resolveTooltip('zzzz.nothing')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(resolveTooltip('')).toBeNull();
  });

  // ─── Description truncation ──────────────────────────────────
  it('truncates long world-model descriptions to tooltip-appropriate length', () => {
    // World-model descriptions can be 50+ words. Tooltip desc should be <= 120 chars.
    const chaos = resolveTooltip('sphere.chaos');
    if (chaos?.desc) {
      expect(chaos.desc.length).toBeLessThanOrEqual(120);
    }
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/engine/__tests__/tooltipResolver.test.ts`
Expected: FAIL — module not found

**Step 3: Write the implementation**

```typescript
// src/engine/tooltipResolver.ts
/**
 * Tooltip Resolver — Routes tooltip IDs to their canonical content sources.
 *
 * This is the zero-duplication layer. Game entity tooltips are read from
 * existing content packages (archetype-content.ts, doom-content.ts, etc.)
 * and world-model.json. UI-system tooltips come from ui-content.ts.
 *
 * ID format: "prefix.identifier" (e.g., "sphere.force", "ui.doom_bar")
 */

import type { TooltipContent } from '../types/tooltip';
import { getUITooltip } from '../data/ui-content';
import { getArchetype, ARCHETYPES } from '../data/archetype-content';
import worldModel from '../data/world-model.json';

// ─── Helpers ─────────────────────────────────────────────────────

/** Max description length for tooltips. World-model descriptions get truncated. */
const MAX_DESC_LENGTH = 120;

function truncateDesc(desc: string): string {
  if (desc.length <= MAX_DESC_LENGTH) return desc;
  // Find last sentence boundary within limit
  const truncated = desc.slice(0, MAX_DESC_LENGTH);
  const lastPeriod = truncated.lastIndexOf('.');
  const lastDash = truncated.lastIndexOf('—');
  const breakPoint = Math.max(lastPeriod, lastDash);
  if (breakPoint > MAX_DESC_LENGTH * 0.5) {
    return desc.slice(0, breakPoint + 1).trim();
  }
  return truncated.trim() + '…';
}

function findWorldModelNode(id: string): { name: string; description: string } | null {
  // Try exact match first, then partial match by name
  const node = worldModel.nodes.find(
    (n) => n.id === id || n.name.toLowerCase() === id.toLowerCase()
  );
  if (node) return { name: node.name, description: node.description };
  return null;
}

// ─── Category resolvers ──────────────────────────────────────────

function resolveSphere(identifier: string): TooltipContent | null {
  // Search both foundation and creation spheres
  const node = worldModel.nodes.find(
    (n) =>
      (n.category === 'foundation-sphere' || n.category === 'creation-sphere') &&
      n.name.toLowerCase() === identifier.toLowerCase()
  );
  if (!node) return null;
  return {
    label: node.name,
    desc: truncateDesc(node.description),
  };
}

function resolveReach(identifier: string): TooltipContent | null {
  const node = worldModel.nodes.find(
    (n) => n.category === 'reach' && n.name.toLowerCase() === identifier.toLowerCase()
  );
  if (!node) return null;
  return {
    label: `${node.name} Reach`,
    desc: truncateDesc(node.description),
  };
}

function resolveTerrain(identifier: string): TooltipContent | null {
  const node = worldModel.nodes.find(
    (n) => n.category === 'terrain' && n.name.toLowerCase() === identifier.toLowerCase()
  );
  if (!node) return null;
  return {
    label: node.name,
    desc: truncateDesc(node.description),
  };
}

function resolveArchetype(identifier: string): TooltipContent | null {
  const archetype = getArchetype(identifier);
  if (!archetype) return null;
  return {
    label: archetype.name,
    desc: archetype.storyShape,
  };
}

function resolveDoom(identifier: string): TooltipContent | null {
  if (identifier === 'unmaking') {
    return {
      label: 'The Unmaking',
      desc: 'The final dissolution — when the {{ui.doom_bar}} expires, the world enters its twilight phase.',
    };
  }
  if (identifier === 'clock') {
    return {
      label: 'Doom Clock',
      desc: 'Measures time until the Unmaking. Slowed by completing {{ui.mandate_tracker}} objectives.',
    };
  }
  return null;
}

function resolveMandate(identifier: string): TooltipContent | null {
  // Mandate IDs match template IDs in mandate-content.ts
  // Dynamic resolution needed — for now return a generic entry
  return null;
}

// ─── Main resolver ───────────────────────────────────────────────

/**
 * Resolve a tooltip ID to its content. Routes by prefix to canonical content sources.
 *
 * @param id Tooltip ID in "prefix.identifier" format
 * @returns Resolved tooltip content, or null if not found
 */
export function resolveTooltip(id: string): TooltipContent | null {
  if (!id || !id.includes('.')) return null;

  const dotIndex = id.indexOf('.');
  const prefix = id.slice(0, dotIndex);
  const identifier = id.slice(dotIndex + 1);

  switch (prefix) {
    case 'ui':
      return getUITooltip(id);
    case 'sphere':
      return resolveSphere(identifier);
    case 'reach':
      return resolveReach(identifier);
    case 'terrain':
      return resolveTerrain(identifier);
    case 'archetype':
      return resolveArchetype(identifier);
    case 'doom':
      return resolveDoom(identifier);
    case 'mandate':
      return resolveMandate(identifier);
    default:
      return null;
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/engine/__tests__/tooltipResolver.test.ts`
Expected: PASS (all 11 tests)

Note: Some tests may need adjustment based on exact world-model.json node IDs and names. Check the actual node IDs with `grep -i '"id":.*force' src/data/world-model.json` and adjust the resolver's matching logic if IDs use prefixed format (e.g., `cs.force` vs `force`).

**Step 5: Commit**

```bash
git add src/engine/tooltipResolver.ts src/engine/__tests__/tooltipResolver.test.ts
git commit -m "feat(tooltip): add tooltip resolver — routes IDs to content packages, zero duplication"
```

---

### Task 4: Tooltip Component (Core)

**Files:**
- Create: `src/components/shared/Tooltip.tsx`
- Test: `src/components/shared/__tests__/Tooltip.test.tsx`

**Step 1: Write the failing tests**

```typescript
// src/components/shared/__tests__/Tooltip.test.tsx
// @vitest-environment jsdom
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Tooltip } from '../Tooltip';

describe('Tooltip', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders children without tooltip initially', () => {
    render(
      <Tooltip label="Test Label">
        <button>Hover me</button>
      </Tooltip>
    );
    expect(screen.getByText('Hover me')).toBeInTheDocument();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('shows tooltip after hover delay', () => {
    render(
      <Tooltip label="Test Label">
        <button>Hover me</button>
      </Tooltip>
    );
    fireEvent.pointerEnter(screen.getByText('Hover me'));
    act(() => { vi.advanceTimersByTime(200); });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('does not show tooltip before delay completes', () => {
    render(
      <Tooltip label="Test Label">
        <button>Hover me</button>
      </Tooltip>
    );
    fireEvent.pointerEnter(screen.getByText('Hover me'));
    act(() => { vi.advanceTimersByTime(100); });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('hides tooltip on pointer leave', () => {
    render(
      <Tooltip label="Test Label">
        <button>Hover me</button>
      </Tooltip>
    );
    fireEvent.pointerEnter(screen.getByText('Hover me'));
    act(() => { vi.advanceTimersByTime(200); });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    fireEvent.pointerLeave(screen.getByText('Hover me'));
    act(() => { vi.advanceTimersByTime(150); });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('shows description when provided', () => {
    render(
      <Tooltip label="Test Label" desc="Description text">
        <button>Hover me</button>
      </Tooltip>
    );
    fireEvent.pointerEnter(screen.getByText('Hover me'));
    act(() => { vi.advanceTimersByTime(200); });
    expect(screen.getByText('Description text')).toBeInTheDocument();
  });

  it('resolves content from ID via resolveTooltip', () => {
    render(
      <Tooltip id="ui.doom_bar">
        <button>Hover me</button>
      </Tooltip>
    );
    fireEvent.pointerEnter(screen.getByText('Hover me'));
    act(() => { vi.advanceTimersByTime(200); });
    expect(screen.getByText('Doom Clock')).toBeInTheDocument();
  });

  it('prefers explicit label/desc over id', () => {
    render(
      <Tooltip id="ui.doom_bar" label="Override Label">
        <button>Hover me</button>
      </Tooltip>
    );
    fireEvent.pointerEnter(screen.getByText('Hover me'));
    act(() => { vi.advanceTimersByTime(200); });
    expect(screen.getByText('Override Label')).toBeInTheDocument();
  });

  it('sets aria-describedby on trigger element', () => {
    render(
      <Tooltip label="Test Label">
        <button>Hover me</button>
      </Tooltip>
    );
    fireEvent.pointerEnter(screen.getByText('Hover me'));
    act(() => { vi.advanceTimersByTime(200); });
    const trigger = screen.getByText('Hover me').closest('[aria-describedby]');
    expect(trigger).toBeInTheDocument();
    const tooltipId = trigger?.getAttribute('aria-describedby');
    expect(document.getElementById(tooltipId!)).toBeInTheDocument();
  });

  it('shows on focus and hides on blur', () => {
    render(
      <Tooltip label="Test Label">
        <button>Focus me</button>
      </Tooltip>
    );
    fireEvent.focus(screen.getByText('Focus me'));
    act(() => { vi.advanceTimersByTime(200); });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    fireEvent.blur(screen.getByText('Focus me'));
    act(() => { vi.advanceTimersByTime(150); });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('hides on Escape key', () => {
    render(
      <Tooltip label="Test Label">
        <button>Hover me</button>
      </Tooltip>
    );
    fireEvent.pointerEnter(screen.getByText('Hover me'));
    act(() => { vi.advanceTimersByTime(200); });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    act(() => { vi.advanceTimersByTime(150); });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('does not render when label is empty and id resolves to null', () => {
    render(
      <Tooltip id="nonexistent.id">
        <button>Hover me</button>
      </Tooltip>
    );
    fireEvent.pointerEnter(screen.getByText('Hover me'));
    act(() => { vi.advanceTimersByTime(200); });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/shared/__tests__/Tooltip.test.tsx`
Expected: FAIL — module not found

**Step 3: Write the Tooltip component**

Create `src/components/shared/Tooltip.tsx`. The component should:

- Accept props: `id?: string`, `label?: string`, `desc?: string`, `children: React.ReactNode`, `depth?: number` (internal, for chain tracking)
- Use `useState` for `visible` (boolean) and `placement` (TooltipPlacement)
- Use `useRef` for show/hide timers and trigger element ref
- Use `useId()` for unique tooltip ID (aria-describedby)
- On `pointerEnter` / `focus`: start show delay timer
- On `pointerLeave` / `blur`: start hide timer
- On `Escape` keydown: hide immediately
- Resolve content: if `id` provided, call `resolveTooltip(id)` from `tooltipResolver.ts`; explicit `label`/`desc` override resolved content
- Position: measure trigger element with `getBoundingClientRect()`, apply above/below logic based on viewport thresholds
- Render: portal to document.body using `createPortal`, absolute positioned div with role="tooltip"
- Styling: bg `#1a1a1e`, border `1px solid #57534e`, rounded, shadow-lg, max-width 220px
- Label: Cinzel font, text-xs, amber-200 (#fcd34d)
- Desc: Inter font, text-xs, stone-400 (#a8a29e)
- Arrow: 6px CSS border triangle
- Fade: opacity transition via CSS class toggle

Implementation is ~150-200 lines. Follow the ProgressBar.tsx pattern: `React.memo`, typed props interface, module-level style constants, JSDoc.

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/shared/__tests__/Tooltip.test.tsx`
Expected: PASS (all 10 tests)

**Step 5: Commit**

```bash
git add src/components/shared/Tooltip.tsx src/components/shared/__tests__/Tooltip.test.tsx
git commit -m "feat(tooltip): add Tooltip component — hover/focus, delay, positioning, aria, Threadbare styling"
```

---

### Task 5: Linked Concept Rendering

**Files:**
- Modify: `src/components/shared/Tooltip.tsx`
- Create: `src/components/shared/__tests__/TooltipChain.test.tsx`

This adds the `{{concept.id}}` link parsing and child tooltip spawning.

**Step 1: Write the failing tests**

```typescript
// src/components/shared/__tests__/TooltipChain.test.tsx
// @vitest-environment jsdom
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Tooltip } from '../Tooltip';

describe('Tooltip linked chains', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders {{concept.id}} markers as underlined text', () => {
    render(
      <Tooltip label="Test" desc="Influenced by {{sphere.force}} power">
        <button>Hover me</button>
      </Tooltip>
    );
    fireEvent.pointerEnter(screen.getByText('Hover me'));
    act(() => { vi.advanceTimersByTime(200); });

    // The description should contain an underlined span for the linked concept
    const tooltip = screen.getByRole('tooltip');
    const underlined = tooltip.querySelector('[data-tooltip-link]');
    expect(underlined).toBeInTheDocument();
    expect(underlined?.textContent).toBeTruthy(); // Resolved label for sphere.force
  });

  it('spawns child tooltip when hovering a linked concept', () => {
    render(
      <Tooltip label="Test" desc="See {{ui.doom_bar}} for details">
        <button>Hover me</button>
      </Tooltip>
    );
    fireEvent.pointerEnter(screen.getByText('Hover me'));
    act(() => { vi.advanceTimersByTime(200); });

    // Hover the linked concept
    const link = screen.getByRole('tooltip').querySelector('[data-tooltip-link]');
    expect(link).toBeInTheDocument();
    fireEvent.pointerEnter(link!);
    act(() => { vi.advanceTimersByTime(200); });

    // Child tooltip should appear with resolved content
    const tooltips = screen.getAllByRole('tooltip');
    expect(tooltips.length).toBe(2); // Parent + child
    expect(screen.getByText('Doom Clock')).toBeInTheDocument();
  });

  it('does not spawn tooltips beyond max depth', () => {
    // A tooltip at depth 2 should render {{markers}} as plain text
    render(
      <Tooltip label="Test" desc="See {{ui.doom_bar}}" depth={2}>
        <button>Hover me</button>
      </Tooltip>
    );
    fireEvent.pointerEnter(screen.getByText('Hover me'));
    act(() => { vi.advanceTimersByTime(200); });

    // No underlined links should exist at max depth
    const tooltip = screen.getByRole('tooltip');
    const links = tooltip.querySelectorAll('[data-tooltip-link]');
    expect(links.length).toBe(0);
  });

  it('renders unresolvable {{markers}} as plain text', () => {
    render(
      <Tooltip label="Test" desc="See {{nonexistent.thing}} here">
        <button>Hover me</button>
      </Tooltip>
    );
    fireEvent.pointerEnter(screen.getByText('Hover me'));
    act(() => { vi.advanceTimersByTime(200); });

    // Unresolvable marker should be plain text, not a link
    const tooltip = screen.getByRole('tooltip');
    const links = tooltip.querySelectorAll('[data-tooltip-link]');
    expect(links.length).toBe(0);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/shared/__tests__/TooltipChain.test.tsx`
Expected: FAIL — no `[data-tooltip-link]` elements rendered

**Step 3: Add link parsing to Tooltip.tsx**

Add a `parseDescription` function that:
1. Splits desc text on `TOOLTIP_LINK_PATTERN` regex
2. For each `{{concept.id}}` match, calls `resolveTooltip(id)`
3. If resolved AND `depth < TOOLTIP_MAX_CHAIN_DEPTH`: render as underlined `<span data-tooltip-link={id}>` with amber-400 color, wrapped in a nested `<Tooltip>` at `depth + 1`
4. If not resolved or at max depth: render as plain text (just the resolved label, or the raw ID if unresolvable)

This function returns `ReactNode[]` — an array of text strings and `<span>` elements.

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/shared/__tests__/TooltipChain.test.tsx`
Expected: PASS (all 4 tests)

**Step 5: Commit**

```bash
git add src/components/shared/Tooltip.tsx src/components/shared/__tests__/TooltipChain.test.tsx
git commit -m "feat(tooltip): add linked concept chains — {{concept.id}} markers render as hoverable links with child tooltips"
```

---

### Task 6: Content Validation Tests

**Files:**
- Create: `src/engine/__tests__/tooltipValidation.test.ts`

**Step 1: Write the validation tests**

```typescript
// src/engine/__tests__/tooltipValidation.test.ts
import { describe, it, expect } from 'vitest';
import { resolveTooltip } from '../tooltipResolver';
import { UI_TOOLTIPS } from '../../data/ui-content';
import { TOOLTIP_LINK_PATTERN } from '../../types/tooltip';

describe('tooltip content validation', () => {
  it('all {{concept.id}} references in UI_TOOLTIPS resolve to valid tooltips', () => {
    const brokenLinks: string[] = [];

    for (const [key, entry] of Object.entries(UI_TOOLTIPS)) {
      if (!entry.desc) continue;
      const matches = [...entry.desc.matchAll(TOOLTIP_LINK_PATTERN)];
      for (const match of matches) {
        const linkedId = match[1];
        const resolved = resolveTooltip(linkedId);
        if (!resolved) {
          brokenLinks.push(`${key} → {{${linkedId}}}`);
        }
      }
    }

    expect(brokenLinks, `Broken tooltip links:\n${brokenLinks.join('\n')}`).toHaveLength(0);
  });

  it('all resolvable tooltips have non-empty labels', () => {
    const testIds = [
      'ui.doom_bar', 'ui.essence_panel', 'ui.mandate_tracker',
      'ui.avatar_move', 'ui.avatar_wheel', 'ui.avatar_scry',
      'sphere.force', 'sphere.chaos', 'doom.unmaking',
    ];
    for (const id of testIds) {
      const result = resolveTooltip(id);
      if (result) {
        expect(result.label.length, `${id} has empty label`).toBeGreaterThan(0);
      }
    }
  });

  it('no tooltip description exceeds 200 characters', () => {
    const longDescs: string[] = [];
    for (const [key, entry] of Object.entries(UI_TOOLTIPS)) {
      if (entry.desc && entry.desc.length > 200) {
        longDescs.push(`${key}: ${entry.desc.length} chars`);
      }
    }
    expect(longDescs, `Descriptions too long:\n${longDescs.join('\n')}`).toHaveLength(0);
  });
});
```

**Step 2: Run tests**

Run: `npx vitest run src/engine/__tests__/tooltipValidation.test.ts`
Expected: PASS (all 3 tests). If any `{{concept.id}}` links are broken, the first test will list them — fix the IDs in ui-content.ts or add resolver support.

**Step 3: Commit**

```bash
git add src/engine/__tests__/tooltipValidation.test.ts
git commit -m "test(tooltip): add content validation — broken link detection, label checks, length limits"
```

---

### Task 7: Wire Tooltips into Core HUD

**Files:**
- Modify: `src/components/Game/DoomBar.tsx`
- Modify: `src/components/Game/AvatarHUD.tsx`
- Modify: `src/components/Game/MandateTracker.tsx`
- Modify: `src/components/Game/SimulationControls.tsx`
- Modify: `src/components/Game/RivalPanel.tsx`
- Modify: `src/components/Game/EssencePanel.tsx`

For each component, wrap the relevant element in `<Tooltip id="...">`. Import Tooltip from `../../components/shared/Tooltip`.

**DoomBar.tsx example:**

```tsx
import { Tooltip } from '../shared/Tooltip';

// Wrap the outer div:
<Tooltip id="ui.doom_bar">
  <div className="flex-1 min-w-0">
    {/* existing content */}
  </div>
</Tooltip>
```

**AvatarHUD.tsx example:**

```tsx
import { Tooltip } from '../shared/Tooltip';

// Wrap each button:
<Tooltip id="ui.avatar_move">
  <button onClick={onMoveClick} style={moveButtonStyle}>Move</button>
</Tooltip>
<Tooltip id="ui.avatar_wheel">
  <button onClick={onWheelClick} style={OTHER_BUTTON_STYLE}>Wheel</button>
</Tooltip>
<Tooltip id="ui.avatar_scry">
  <button onClick={onScryClick} style={OTHER_BUTTON_STYLE}>Scry</button>
</Tooltip>
```

Repeat the same pattern for MandateTracker, SimulationControls, RivalPanel, and EssencePanel. Each wraps the relevant element with `<Tooltip id="ui.xxx">`.

**Step 1: Add tooltips to all 6 HUD components**

Follow the pattern above. Remove any existing `title=` attributes (they conflict with our tooltip).

**Step 2: Run existing component tests to verify no regressions**

Run: `npx vitest run src/components/`
Expected: All existing tests pass. The Tooltip wrapper should be transparent to existing tests since it only adds hover behavior.

**Step 3: Commit**

```bash
git add src/components/Game/DoomBar.tsx src/components/Game/AvatarHUD.tsx \
  src/components/Game/MandateTracker.tsx src/components/Game/SimulationControls.tsx \
  src/components/Game/RivalPanel.tsx src/components/Game/EssencePanel.tsx
git commit -m "feat(tooltip): wire tooltips into core HUD — DoomBar, AvatarHUD, MandateTracker, SimControls, RivalPanel, EssencePanel"
```

---

### Task 8: Wire Tooltips into Agents and Locations

**Files:**
- Modify: `src/components/Game/RetinuePanel.tsx`
- Modify: `src/components/Game/HexZoomView.tsx`
- Modify: `src/components/HexMap/HexTile.tsx`

**RetinuePanel.tsx:** Wrap each agent entry div with a dynamic Tooltip:

```tsx
import { Tooltip } from '../shared/Tooltip';
import { getArchetype } from '../../data/archetype-content';

// Inside the map:
const archetypeId = agent.narrativeArchetype; // if available on RetinueAgent
const archetype = archetypeId ? getArchetype(archetypeId) : null;

<Tooltip
  label={agent.name}
  desc={archetype ? `{{archetype.${archetypeId}}} — ${agent.tierName}` : agent.tierName}
>
  <div key={agent.id} ...>
    {/* existing agent entry */}
  </div>
</Tooltip>
```

Note: Check if `RetinueAgent` type includes `narrativeArchetype`. If not, the archetype info may need to be added to the retinue query in `src/engine/retinue.ts`. This is an integration detail to resolve during implementation.

**HexTile.tsx:** Add tooltip showing terrain name for visible hexes:

```tsx
import { Tooltip } from '../shared/Tooltip';

// For visible hexes, wrap the SVG group:
<Tooltip label={terrainName} desc={`{{terrain.${terrainId}}}`}>
  <g ...> {/* existing hex rendering */} </g>
</Tooltip>
```

Note: Tooltip component needs to handle SVG `<g>` children. The wrapper `<span>` used for DOM elements won't work inside SVG. The Tooltip component may need a `as="g"` prop or detect SVG context. This is a known complexity — handle during implementation.

**HexZoomView.tsx:** Add tooltips to location markers and agent dots.

**Step 1: Wire tooltips into all 3 components**

**Step 2: Run all tests**

Run: `npx vitest run`
Expected: All tests pass

**Step 3: Commit**

```bash
git add src/components/Game/RetinuePanel.tsx src/components/Game/HexZoomView.tsx \
  src/components/HexMap/HexTile.tsx
git commit -m "feat(tooltip): wire tooltips into agents and locations — RetinuePanel, HexZoomView, HexTile"
```

---

### Task 9: Integration Test

**Files:**
- Create: `src/engine/__tests__/tooltip-integration.test.ts`

**Step 1: Write integration tests**

```typescript
// src/engine/__tests__/tooltip-integration.test.ts
import { describe, it, expect } from 'vitest';
import { resolveTooltip } from '../tooltipResolver';
import { UI_TOOLTIPS } from '../../data/ui-content';
import { TOOLTIP_LINK_PATTERN } from '../../types/tooltip';

describe('tooltip system integration', () => {
  it('full chain: ui.doom_bar → sphere.entropy resolves at both depths', () => {
    const doom = resolveTooltip('ui.doom_bar');
    expect(doom).not.toBeNull();
    expect(doom!.desc).toContain('{{sphere.entropy}}');

    // The linked concept also resolves
    const entropy = resolveTooltip('sphere.entropy');
    expect(entropy).not.toBeNull();
    expect(entropy!.label).toContain('Entropy');
  });

  it('all UI tooltips with links form valid chains', () => {
    const chainResults: { source: string; target: string; resolved: boolean }[] = [];

    for (const [key, entry] of Object.entries(UI_TOOLTIPS)) {
      if (!entry.desc) continue;
      const matches = [...entry.desc.matchAll(TOOLTIP_LINK_PATTERN)];
      for (const match of matches) {
        const target = match[1];
        const resolved = resolveTooltip(target);
        chainResults.push({ source: key, target, resolved: !!resolved });
      }
    }

    const broken = chainResults.filter(r => !r.resolved);
    expect(broken, `Broken chains: ${JSON.stringify(broken)}`).toHaveLength(0);
  });

  it('no circular references in depth-1 links', () => {
    // Ensure no tooltip links back to itself
    for (const [key, entry] of Object.entries(UI_TOOLTIPS)) {
      if (!entry.desc) continue;
      const matches = [...entry.desc.matchAll(TOOLTIP_LINK_PATTERN)];
      for (const match of matches) {
        expect(match[1], `${key} has self-referencing link`).not.toBe(key);
      }
    }
  });
});
```

**Step 2: Run integration tests**

Run: `npx vitest run src/engine/__tests__/tooltip-integration.test.ts`
Expected: PASS (all 3 tests)

**Step 3: Run full test suite**

Run: `npm test`
Expected: All ~1,650+ tests pass with 0 failures

**Step 4: Commit**

```bash
git add src/engine/__tests__/tooltip-integration.test.ts
git commit -m "test(tooltip): add integration tests — chain resolution, broken link detection, circular reference check"
```

---

### Task 10: Documentation Update

**Files:**
- Modify: `CLAUDE.md` (changelog + project status)
- Update: Obsidian vault (new system note)
- Update: Notion backlog

Follow the `gamedocumenter` skill for exact API calls and templates. Key updates:

1. **CLAUDE.md changelog:** Add entries for tooltip types, ui-content.ts, tooltip resolver, Tooltip component, linked chains, HUD/agent/location wiring
2. **CLAUDE.md project status:** Add "Tooltip System: ✅ Complete" with module/test counts
3. **Obsidian vault:** Create `Systems/Tooltip System.md` with connections to Content Packages, world-model.json, UI components
4. **Notion backlog:** Mark tooltip implementation complete

**Commit:**

```bash
git add CLAUDE.md
git commit -m "docs(tooltip): update CLAUDE.md changelog and project status"
```
