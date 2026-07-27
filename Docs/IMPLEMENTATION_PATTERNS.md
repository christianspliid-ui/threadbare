# Implementation Patterns Reference

This document captures the exact code patterns used across the Fantasy World Simulator codebase for writing a **Tooltip System Plan**. All patterns are extracted from working production code.

---

## 1. SHARED COMPONENT PATTERNS

### 1.1 Props Interface & React.memo

**File:** `src/components/shared/ProgressBar.tsx`

```typescript
interface ProgressBarProps {
  /**
   * Progress value as a decimal (0.0 to 1.0)
   */
  progress: number;

  /**
   * Color of the progress fill (hex code)
   */
  color: string;

  /**
   * Whether to show a glowing boxShadow effect (default: true)
   */
  glow?: boolean;

  /**
   * Optional CSS class for custom styling
   */
  className?: string;

  /**
   * Optional test ID for testing
   */
  dataTestId?: string;
}

export const ProgressBar = React.memo(function ProgressBar({
  progress,
  color,
  glow = true,
  className = 'h-2',
  dataTestId,
}: ProgressBarProps) {
  const percentage = Math.round(progress * 100);

  return (
    <div
      className={`${className} bg-stone-700 rounded-full overflow-hidden`}
      data-testid={dataTestId}
    >
      <div
        className="rounded-full transition-all duration-500 ease-out"
        style={{
          height: '100%',
          width: `${percentage}%`,
          backgroundColor: color,
          boxShadow: glow ? `0 0 8px ${color}${PROGRESS_BAR_GLOW_OPACITY}` : undefined,
        }}
      />
    </div>
  );
});
```

**Key Patterns:**
- Named `React.memo` with descriptive function name
- Props interface with JSDoc comments on each property
- Default values directly in destructuring
- Consistent naming: `Props` suffix for interface
- Mix of Tailwind classes + inline styles for dynamic theming
- Data attributes for testing (`data-testid`)

---

### 1.2 Icon Component Pattern

**File:** `src/components/shared/SphereIcon.tsx`

```typescript
export interface SphereIconProps {
  /** Sphere name (e.g., 'force', 'mind', 'chaos') */
  sphereName: string;
  /** CSS font size (default: 1rem) */
  size?: string | number;
  /** Optional CSS class name */
  className?: string;
  /** Optional inline style overrides */
  style?: React.CSSProperties;
  /** Whether to render without color (monochrome) */
  monochrome?: boolean;
  /** Optional title for accessibility */
  title?: string;
}

export const SphereIcon = React.memo(function SphereIcon({
  sphereName,
  size = '1rem',
  className,
  style,
  monochrome = false,
  title,
}: SphereIconProps) {
  const color = getSphereColor(sphereName);
  const symbol = getSphereSymbol(sphereName);

  const fontSize = typeof size === 'number' ? `${size}px` : size;

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize,
        color: monochrome ? 'currentColor' : color,
        lineHeight: 1,
        ...style,
      }}
      title={title}
      aria-label={title || sphereName}
    >
      {symbol}
    </span>
  );
});
```

**Key Patterns:**
- Pure presentational component
- Delegates data lookup to helper functions (`getSphereColor`, `getSphereSymbol`)
- Flexible sizing: handles both string (`"1rem"`) and numeric (`24`) units
- Accessibility-first: `title` + `aria-label`
- Style composition: Tailwind classes + merge with inline styles
- Monochrome variant support

---

## 2. CONTENT PACKAGE PATTERNS

### 2.1 Simple Content Export (Doom)

**File:** `src/data/doom-content.ts`

```typescript
/**
 * Doom Content Package — Stage names and thresholds for the doom clock.
 *
 * ═══════════════════════════════════════════════════════════════════
 * CONTENT MANAGER: This is the file you edit to change doom archetype
 * names, stage progression, and escalation thresholds.
 * ═══════════════════════════════════════════════════════════════════
 */
import type { DoomClockArchetype } from '../types/doomClock';

/** Default stage thresholds (fraction of total ticks) */
export const DEFAULT_THRESHOLDS = [0.20, 0.40, 0.60, 0.80, 1.0];

/** Archetype-specific stage names */
export const ARCHETYPE_STAGE_NAMES: Record<DoomClockArchetype, [string, string, string, string, string]> = {
  breach:       ['Strange Whispers', 'Reality Cracks', 'The Thinning', 'Barriers Fail', 'The Breach'],
  convergence:  ['Distant Pull', 'Gathering Forces', 'The Drawing', 'Convergence Point', 'The Singularity'],
  changing:     ['Old Winds Die', 'New Powers Stir', 'The Turning', 'Power Shifts', 'The New Order'],
  sundering:    ['Hairline Fractures', 'Tremors', 'The Splitting', 'Lands Drift', 'The Sundering'],
  failing:      ['Waning Light', 'Creeping Entropy', 'The Dimming', 'Collapse Begins', 'The Failing'],
  ascension:    ['Mortal Spark', 'Growing Power', 'Threshold Nears', 'Divine Trial', 'The Ascension'],
  reckoning:    ['Old Debts Surface', 'Witnesses Gather', 'The Accounting', 'Judgment Begins', 'The Reckoning'],
};
```

**Key Patterns:**
- Header comment: triple-line ASCII separator with "CONTENT MANAGER" callout
- Named exports for content constants
- Type annotations from `types/` folder
- JSDoc comments on each export
- Tunable constants grouped by semantic purpose
- Discriminated unions for archetype-specific data (e.g., `Record<DoomClockArchetype, ...>`)

### 2.2 Economy Constants Pattern (Influence)

**File:** `src/data/influence-content.ts`

```typescript
/**
 * Influence Content Package — Tier names, costs, and economy constants.
 *
 * ═══════════════════════════════════════════════════════════════════
 * CONTENT MANAGER: This is the file you edit to change influence
 * tier names, maintenance costs, promotion thresholds, and economy.
 * ═══════════════════════════════════════════════════════════════════
 */

import type { InfluenceTier } from '../types/influence';

// ─── Economy Constants ────────────────────────────────────────────

/** Base generation rate: 1 essence per tick. */
export const BASE_ESSENCE_PER_TICK = 1.0;

/** Essence per worshipper per tick. */
export const ESSENCE_PER_WORSHIPPER = 0.1;

// ─── Tier Data ────────────────────────────────────────────────────

/** Working names for each tier. */
export const TIER_NAMES: Record<InfluenceTier, string> = {
  0: 'Unaware',
  1: 'Touched',
  2: 'Devoted',
  3: 'Champion',
  4: 'Aspect',
};

/** Maintenance cost per tick per tier. */
export const TIER_MAINTENANCE: Record<InfluenceTier, number> = {
  0: 0,
  1: 0.5,
  2: 1.0,
  3: 2.0,
  4: 4.0,
};
```

**Key Patterns:**
- Section headers with thin-line ASCII dividers (`─`)
- Grouped by semantic domain (Economy Constants, Tier Data, etc.)
- Each constant has a JSDoc comment explaining purpose
- `Record<>` for discriminated unions (tier → value mapping)
- Constants represent knobs that designers/content managers tune

---

## 3. ENGINE/AGGREGATOR PATTERNS

### 3.1 Resolver Function Pattern

**File:** `src/engine/agentDetail.ts` (excerpt)

```typescript
/**
 * Agent Detail Aggregator — Combines graph data into a single AgentDetail object
 * for the AgentDetailPanel component.
 */

import type { WorldGraph } from './graph';
import type { AxiologicalProfile, ValuePair } from '../types/agent';
import type { ReachDomain } from '../types/traits';
import type { InfluenceTier } from '../types/influence';
import { TIER_NAMES } from '../types/influence';  // ← uses content import
import { getArchetype, type NarrativeArchetype } from '../data/archetype-content';
import type { CooperationStrategy, InteractionRecord } from '../types/disposition';
import { DEFAULT_REPUTATION } from '../types/disposition';

// ─── Type Definitions ─────────────────────────────────────────

export interface TopValue {
  pair: ValuePair;
  value: number;
  label: string;
}

export interface BondSummary {
  targetId: string;
  targetName: string;
  sentiment: number;
  strength: number;
  basis: string;
}

export interface AgentDetail {
  id: string;
  name: string;
  tier: InfluenceTier;
  tierName: string;
  locationId: string;
  locationName: string;
  factionName: string | null;
  archetype: NarrativeArchetype | null;
  profile: AxiologicalProfile;
  domainCapabilities: Record<ReachDomain, number>;
  topValues: TopValue[];
  topBonds: BondSummary[];
  cooperationStrategy: CooperationStrategy | null;
  reputationScore: number;
  recentInteractions: InteractionRecord[];
}

// ─── Helper Functions ─────────────────────────────────────────

function intensityPrefix(absVal: number): string {
  if (absVal >= 0.8) return 'Deeply ';
  if (absVal >= 0.5) return '';
  return 'Somewhat ';
}

// ─── Main Aggregator ──────────────────────────────────────────

export function getAgentDetail(
  graph: WorldGraph,
  agentId: string,
  ascendantId: string,
): AgentDetail | null {
  const agentNode = graph.getNode(agentId);
  if (!agentNode) return null;

  const props = agentNode.properties as Record<string, unknown>;

  // ─── Multi-step data gathering ────────────────────────────

  const worshipsEdges = graph.getOutgoingEdges(agentId, 'worships');
  const worshipEdge = worshipsEdges.find(e => e.target === ascendantId);
  if (!worshipEdge) return null;

  const tier = (worshipEdge.properties as Record<string, unknown>).tier as InfluenceTier;
  const profile = (props.axiologicalProfile as AxiologicalProfile) || {} as AxiologicalProfile;

  // ─── Transform & sort ───────────────────────────────────

  const valuePairs = Object.keys(profile) as ValuePair[];
  const sortedValues = valuePairs
    .map(pair => ({ pair, value: profile[pair] }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, 3);

  const topValues: TopValue[] = sortedValues.map(({ pair, value }) => {
    const absVal = Math.abs(value);
    const [leftLabel, rightLabel] = VALUE_LABELS[pair] || [pair, pair];
    const label = value >= 0
      ? `${intensityPrefix(absVal)}${leftLabel}`
      : `${intensityPrefix(absVal)}${rightLabel}`;
    return { pair, value, label };
  });

  // ─── Return aggregated object ────────────────────────────

  return {
    id: agentId,
    name: agentNode.name,
    tier,
    tierName: TIER_NAMES[tier] || 'Unknown',
    locationId,
    locationName,
    factionName,
    archetype,
    profile,
    domainCapabilities,
    topValues,
    topBonds: bonds,
    cooperationStrategy,
    reputationScore,
    recentInteractions,
  };
}
```

**Key Patterns:**
- Header comment explains what aggregator does
- Imports both types and content (content packages have lookup functions)
- Return type is nullable (`| null`)
- Early returns for validation failures
- Multi-stage processing:
  1. Fetch from graph
  2. Transform/compute
  3. Sort/filter
  4. Return aggregated object
- Type casting: `as Record<string, unknown>` then extract fields
- Composition of derived types (e.g., `TopValue` built from `profile`)

---

## 4. ASSET MAP PATTERNS

### 4.1 Hex Tile Asset Maps

**File:** `src/data/hex-tile-assets.ts`

```typescript
import type { TerrainType, LocationSubtype } from '../types';

export const TERRAIN_TILE_MAP: Record<TerrainType, string> = {
  ocean: 'ocean.png',
  coastal_shallows: 'coastal-shallows.png',
  lake: 'lake.png',
  // ... 20+ more terrain types
};

export function getHexTileUrl(terrain: TerrainType): string {
  return `/hex-tiles/${TERRAIN_TILE_MAP[terrain]}`;
}

/** All sphere names (creation + foundation) for magic overlay lookup */
export type AllSphereName =
  | 'force' | 'matter' | 'energy' | 'life' | 'mind' | 'spirit' | 'time' | 'entropy'
  | 'chaos' | 'order' | 'light' | 'darkness';

/** Magic overlay filenames keyed by sphere name */
export const MAGIC_OVERLAY_MAP: Record<AllSphereName, string> = {
  // Creation spheres
  force: 'magic-force.png',
  matter: 'magic-matter.png',
  // ... 10+ more spheres
};

export function getMagicOverlayUrl(sphere: AllSphereName): string {
  return `/hex-tiles/${MAGIC_OVERLAY_MAP[sphere]}`;
}

/** Full-size overlay icons (settlement areas and terrain-covering features — fill the hex) */
const FULL_SIZE_OVERLAYS: Set<LocationSubtype> = new Set([
  'hamlet', 'town', 'city', 'capital', 'farmland',
]);

/** Overlay icon filenames for location subtypes */
export const OVERLAY_ICON_MAP: Partial<Record<LocationSubtype, string>> = {
  hamlet: 'overlay-hamlet.png',
  town: 'overlay-town.png',
  // ... more overlays
};

export function getOverlayIconUrl(subtype: LocationSubtype): string | null {
  const filename = OVERLAY_ICON_MAP[subtype];
  return filename ? `/hex-tiles/${filename}` : null;
}

/** Whether this overlay should render at full hex size (settlement areas) or half size (structures) */
export function isFullSizeOverlay(subtype: LocationSubtype): boolean {
  return FULL_SIZE_OVERLAYS.has(subtype);
}
```

**Key Patterns:**
- Maps are `Record<KeyType, string>` for filename lookups
- Getter functions return full paths (`/hex-tiles/filename.png`)
- Discriminated union for groups (e.g., `AllSphereName`)
- Helper functions for derived data (e.g., `isFullSizeOverlay()`)
- Type-safe asset lookups (no string errors at runtime)
- Comments explain each map's purpose
- `Partial<Record<>>` for optional mappings

---

## 5. HUD COMPONENT PATTERNS

### 5.1 Simple HUD Component (DoomBar)

**File:** `src/components/Game/DoomBar.tsx`

```typescript
import type { DoomClockState, DoomClockDefinition } from '../../types/doomClock';
import { ProgressBar } from '../shared/ProgressBar';
import { DOOM_ARCHETYPE_COLORS } from '../../data/uiColorPalette';

interface DoomBarProps {
  definition: DoomClockDefinition;
  state: DoomClockState;
}

export function DoomBar({ definition, state }: DoomBarProps) {
  const color = DOOM_ARCHETYPE_COLORS[definition.archetype] ?? DOOM_ARCHETYPE_COLORS.breach;
  const pct = Math.round(state.progress * 100);
  // currentStage is 1-5, so index into stages array with currentStage - 1
  const currentStageDef = definition.stages[state.currentStage - 1] ?? definition.stages[0];
  const stageName = currentStageDef?.name ?? 'Unknown';

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color, fontFamily: 'Cinzel, serif' }}
          >
            {definition.archetype}
          </span>
          <span className="text-amber-200/60 text-xs">
            Stage {state.currentStage}: {stageName}
          </span>
        </div>
        <span className="text-xs font-mono" style={{ color }}>
          {state.expired ? 'THE UNMAKING' : `${pct}%`}
        </span>
      </div>
      <ProgressBar progress={state.progress} color={color} glow={true} />
    </div>
  );
}
```

**Key Patterns:**
- Simple, stateless functional component
- Props separated into `definition` (immutable data) + `state` (mutable state)
- Lookup with fallback: `DOOM_ARCHETYPE_COLORS[x] ?? fallback`
- Inline type computation (no useState/useCallback needed)
- Delegates rendering complexity to child components (ProgressBar)
- Descriptive CSS classes + inline styles for theme colors
- Comments explain index math (`currentStage - 1`)

### 5.2 Complex HUD with State & Handlers (AvatarHUD)

**File:** `src/components/Game/AvatarHUD.tsx`

```typescript
import { useMemo, useCallback } from 'react';

interface AvatarHUDProps {
  avatarName: string;
  sphereColor: string;
  onCenterOnAvatar: () => void;
  onMoveClick: () => void;
  onWheelClick: () => void;
  onScryClick: () => void;
  moveMode?: boolean;
}

// Base style for all buttons
const BUTTON_BASE_STYLE = {
  padding: '0.5rem 0.75rem',
  fontSize: '0.75rem',
  fontWeight: 'bold',
  border: 'none',
  cursor: 'pointer',
  backgroundColor: 'rgba(10, 10, 14, 0.6)',
  color: '#fbbf24',
  borderRadius: '0.25rem',
  transition: 'all 0.2s ease-out',
  fontFamily: 'Cinzel, serif',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
} as const;

// ... more style constants ...

export function AvatarHUD({
  avatarName,
  sphereColor,
  onCenterOnAvatar,
  onMoveClick,
  onWheelClick,
  onScryClick,
  moveMode = false,
}: AvatarHUDProps) {
  // Memoize computed styles that depend on runtime props
  const moveButtonStyle = useMemo(
    () => ({
      ...BUTTON_BASE_STYLE,
      opacity: moveMode ? 1 : 0.6,
      backgroundColor: moveMode ? `${sphereColor}40` : 'rgba(10, 10, 14, 0.6)',
      borderLeft: moveMode ? `2px solid ${sphereColor}` : 'none',
    }),
    [moveMode, sphereColor]
  );

  const accentBarStyle = useMemo(
    () => ({
      width: '3px',
      height: '24px',
      backgroundColor: sphereColor,
      borderRadius: '0.125rem',
      boxShadow: `0 0 8px ${sphereColor}60`,
    }),
    [sphereColor]
  );

  // Memoize hover handlers for center button
  const handleCenterButtonMouseEnter = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    (e.target as HTMLButtonElement).style.color = sphereColor;
  }, [sphereColor]);

  const handleCenterButtonMouseLeave = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    (e.target as HTMLButtonElement).style.color = '#fef3c7';
  }, []);

  return (
    <div style={CONTAINER_STYLE}>
      {/* Action Buttons Row */}
      <div style={BUTTONS_ROW_STYLE}>
        <button onClick={onMoveClick} style={moveButtonStyle} title="Move">
          Move
        </button>
        <button onClick={onWheelClick} style={OTHER_BUTTON_STYLE} title="Divine Wheel">
          Wheel
        </button>
        <button onClick={onScryClick} style={OTHER_BUTTON_STYLE} title="Scry">
          Scry
        </button>
      </div>

      {/* Avatar Center Button */}
      <div style={CENTER_BUTTON_CONTAINER_STYLE}>
        {/* Accent Bar */}
        <div data-testid="avatar-accent" style={accentBarStyle} />
        {/* Center Button */}
        <button
          onClick={onCenterOnAvatar}
          style={CENTER_BUTTON_STYLE}
          onMouseEnter={handleCenterButtonMouseEnter}
          onMouseLeave={handleCenterButtonMouseLeave}
        >
          Avatar
        </button>
      </div>
    </div>
  );
}
```

**Key Patterns:**
- Module-level constants for static styles (BUTTON_BASE_STYLE, etc.)
- `useMemo()` for dynamic styles that depend on props
- `useCallback()` for event handlers (to prevent inline function creation)
- All styles expressed as objects (not className strings)
- Explicit `as const` for style object types
- Comments separate logical sections
- Props are callback functions (no state mutations inside component)

### 5.3 HUD with Internal State (MandateTracker)

**File:** `src/components/Game/MandateTracker.tsx` (excerpt)

```typescript
import { useState, useEffect } from 'react';
import type { MandateDefinition, MandateState } from '../../types/mandate';
import { ProgressBar } from '../shared/ProgressBar';
import { MANDATE_TYPE_COLORS, SENTIMENT_GREEN, SENTIMENT_NEGATIVE } from '../../data/uiColorPalette';

interface MandateTrackerProps {
  definition: MandateDefinition;
  state: MandateState;
}

const STAGE_ORDER = ['setup', 'escalation', 'culmination'] as const;

function getStagePipStatus(
  stage: string,
  currentStage: string,
  completed: boolean
): 'filled' | 'half' | 'empty' {
  if (completed && stage === 'culmination') return 'filled';
  const currentIndex = STAGE_ORDER.indexOf(currentStage as any);
  const stageIndex = STAGE_ORDER.indexOf(stage as any);
  if (stageIndex < currentIndex) return 'filled';
  if (stageIndex === currentIndex) return 'half';
  return 'empty';
}

const PIP_COLOR = MANDATE_TYPE_COLORS.graph_state;

function renderStagePip(status: 'filled' | 'half' | 'empty') {
  // ... rendering logic ...
}

export function MandateTracker({ definition, state }: MandateTrackerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const color = MANDATE_TYPE_COLORS[definition.type] ?? MANDATE_TYPE_COLORS.graph_state;
  const pct = Math.round(state.progress * 100);
  const displayText = state.completed ? 'FULFILLED' : pct === 0 ? 'NEW' : `${pct}%`;

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  // Close popover with Escape key
  useEffect(() => {
    if (!isExpanded) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsExpanded(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  return (
    <div className="flex-1 min-w-0 relative">
      {/* Compact Bar */}
      <div
        onClick={handleToggle}
        className="cursor-pointer px-4 py-2 bg-stone-800/95 border-b border-amber-900/30 hover:bg-stone-700/95 transition-colors relative z-50"
      >
        {/* ... content ... */}
      </div>

      {/* Expanded Popover */}
      {isExpanded && (
        <div
          className="absolute top-full left-0 right-0 mt-1 bg-stone-800/98 border border-amber-900/40 rounded shadow-lg p-4 z-50 max-w-md"
          onClick={e => e.stopPropagation()}
        >
          {/* ... popover content ... */}
        </div>
      )}

      {/* Backdrop click handler */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsExpanded(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
```

**Key Patterns:**
- Module-level helper functions (getStagePipStatus, renderStagePip)
- Module-level constants (STAGE_ORDER, PIP_COLOR)
- `useState()` for toggled state
- `useEffect()` for keyboard listener (Escape key to close)
- Backdrop pattern: invisible full-screen `<div>` to capture clicks outside popover
- Z-index layering: compact bar z-50, backdrop z-40, popover z-50
- Conditional rendering for expanded state
- Inline styling for dynamic colors, Tailwind for layout

---

## 6. AGENT LIST PATTERN

### 6.1 Agent Entry Rendering

**File:** `src/components/Game/RetinuePanel.tsx`

```typescript
import React from 'react';
import type { RetinueAgent } from '../../engine/retinue';

interface RetinuePanelProps {
  agents: RetinueAgent[];
  selectedAgentId: string | null;
  onAgentSelect: (agentId: string) => void;
}

// Tier colors: 1=gray, 2=purple, 3=gold, 4=red
const TIER_COLORS: Record<number, string> = {
  1: '#6b7280', // gray
  2: '#a78bfa', // purple
  3: '#eab308', // gold
  4: '#ef4444', // red
};

export const RetinuePanel = React.memo(function RetinuePanel({ agents, selectedAgentId, onAgentSelect }: RetinuePanelProps) {
  if (agents.length === 0) {
    return (
      <div className="text-amber-200/30 text-xs italic text-center py-2">
        No agents under your influence yet.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3
        className="text-xs font-bold text-amber-100/60 uppercase tracking-wider"
        style={{ fontFamily: 'Cinzel, serif' }}
      >
        Retinue ({agents.length})
      </h3>
      <div className="space-y-1.5 max-h-[calc(100vh-200px)] overflow-y-auto">
        {agents.map((agent) => {
          const tierColor = TIER_COLORS[agent.tier] || '#78716c';
          const isSelected = agent.id === selectedAgentId;

          return (
            <div
              key={agent.id}
              data-testid="retinue-entry"
              onClick={() => onAgentSelect(agent.id)}
              className={`
                bg-stone-700/50 rounded px-2.5 py-1.5 border border-stone-600/30 cursor-pointer
                transition-colors hover:bg-stone-600/50 active:bg-stone-600/70
                ${isSelected ? 'ring-2 ring-amber-400/60 border-amber-400/30' : ''}
              `}
            >
              {/* Agent name and tier */}
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="text-sm font-medium text-amber-100/90 truncate flex-1">
                  {agent.name}
                </span>
                <span
                  className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                  style={{
                    color: tierColor,
                    backgroundColor: tierColor + '20', // 20% opacity
                  }}
                >
                  {agent.tierName}
                </span>
              </div>

              {/* Location and faction on second line */}
              <div className="text-[11px] text-amber-200/60 space-y-0.5">
                <div className="flex items-center gap-1">
                  <span className="text-amber-200/40">Location:</span>
                  <span className="truncate">{agent.locationName}</span>
                </div>
                {agent.factionName && (
                  <div className="flex items-center gap-1">
                    <span className="text-amber-200/40">Faction:</span>
                    <span className="truncate">{agent.factionName}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
```

**Key Patterns:**
- Module-level color mapping (TIER_COLORS)
- Empty state handling
- List rendered with `.map()` + `key={agent.id}`
- Selection state toggled via callback prop
- Visual feedback: hover/active states + selected ring
- Truncation for long text (`truncate` class)
- Dynamic color applied via inline style
- Optional secondary data (faction name with conditional rendering)
- Scrollable container with max-height + overflow-y-auto

---

## 7. HEX TILE RENDERING PATTERN

### 7.1 SVG Hex Rendering

**File:** `src/components/HexMap/HexTile.tsx`

```typescript
import type { HexTile, LocationSubtype } from '../../types';
import type { HexVisibilityState } from '../../types/visibility';
import { BIOME_COLORS } from '../../engine/color';
import { hexPolygonPoints, HEX_IMG_SCALE } from '../../lib/hexMath';
import { getHexTileUrl, getOverlayIconUrl, isFullSizeOverlay } from '../../data/hex-tile-assets';

// Hex tile display constants
const UNEXPLORED_HEX_COLOR = '#1e1b2e'; // Dark world surface, ~12% brightness matching HEX_MAP_BACKGROUND

// Overlay sizing: full-size settlements fill the hex, structures render at half size
const OVERLAY_FULL_SCALE = 0.85;  // Settlement overlays (hamlet, town, city, capital) — nearly fill hex
const OVERLAY_HALF_SCALE = 0.45;  // Structure/marker overlays (shrine, fort, ruins, etc.) — half hex size

interface HexTileProps {
  tile: HexTile;
  cx: number;
  cy: number;
  size: number;
  hexClipId: string;
  isHovered?: boolean;
  isSelected?: boolean;
  visibility?: HexVisibilityState;
  isAvatarHex?: boolean;
  sphereColor?: string;
  locationSubtype?: LocationSubtype;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function HexTileComponent({
  tile, cx, cy, size, hexClipId,
  isHovered = false, isSelected = false,
  visibility = 'visible', isAvatarHex = false, sphereColor,
  locationSubtype,
  onClick, onMouseEnter, onMouseLeave,
}: HexTileProps) {
  const fillColor = BIOME_COLORS[tile.terrain];
  const strokeColor = 'rgba(139, 105, 60, 0.3)';
  const points = hexPolygonPoints(cx, cy, size);
  const tileUrl = getHexTileUrl(tile.terrain);
  const imgSize = size * HEX_IMG_SCALE;

  // Unexplored: only render dark fill, no content
  if (visibility === 'unexplored') {
    return (
      <g onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={{ cursor: 'pointer' }}>
        <polygon
          points={points}
          fill={UNEXPLORED_HEX_COLOR}
          stroke={strokeColor}
          strokeWidth={0.6}
        />
      </g>
    );
  }

  // Shared tile content: fallback polygon + clipped image + selection ring
  const tileContent = (
    <>
      {/* Fallback biome color — shows while image loads or if it fails */}
      <polygon
        points={points}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={isSelected ? 2 : isHovered ? 1.2 : 0.6}
        opacity={isHovered ? 0.9 : 1}
      />
      {/* Hex-clipped terrain image */}
      <g clipPath={`url(#${hexClipId})`} transform={`translate(${cx}, ${cy})`}>
        <image
          href={tileUrl}
          x={-size}
          y={-size}
          width={imgSize}
          height={imgSize}
          preserveAspectRatio="xMidYMid slice"
        />
      </g>
      {/* Location overlay icon (settlement/structure) */}
      {locationSubtype && (() => {
        const overlayUrl = getOverlayIconUrl(locationSubtype);
        if (!overlayUrl) return null;
        const scale = isFullSizeOverlay(locationSubtype) ? OVERLAY_FULL_SCALE : OVERLAY_HALF_SCALE;
        const overlaySize = size * 2 * scale;
        return (
          <g clipPath={`url(#${hexClipId})`} transform={`translate(${cx}, ${cy})`}>
            <image
              href={overlayUrl}
              x={-overlaySize / 2}
              y={-overlaySize / 2}
              width={overlaySize}
              height={overlaySize}
              preserveAspectRatio="xMidYMid meet"
              opacity={0.85}
            />
          </g>
        );
      })()}
      {/* Selection ring */}
      {isSelected && (
        <polygon
          points={hexPolygonPoints(cx, cy, size - 3)}
          fill="none"
          stroke="#5A3A1A"
          strokeWidth={1.5}
          strokeDasharray="4,2"
        />
      )}
    </>
  );

  // Remembered: wrap in dimmed group
  if (visibility === 'remembered') {
    return (
      <g onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={{ cursor: 'pointer' }}>
        <g opacity="0.4">
          {tileContent}
        </g>
      </g>
    );
  }

  // Visible: normal rendering
  return (
    <g onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={{ cursor: 'pointer' }}>
      {tileContent}
      {isAvatarHex && sphereColor && (
        <polygon
          points={points}
          fill="none"
          stroke={sphereColor}
          strokeWidth={3}
          className="avatar-pulse"
        />
      )}
    </g>
  );
}
```

**Key Patterns:**
- SVG group (`<g>`) with event handlers
- Fallback biome color polygon (renders while image loads)
- Image clipping via `clipPath` + `url(#id)`
- Visibility state enum with three modes (unexplored/remembered/visible)
- Dynamic stroke width based on hover/selection
- Conditional rendering for overlay icons
- Self-invoking function for inline conditional logic
- Module-level constants for colors and scales
- Data fetched via helper functions (getHexTileUrl, etc.)

---

## 8. NARRATIVE CONTEXT TYPES

### 8.1 Prose Context & NarrativeContext

**File:** `src/types/narrative.ts` (excerpt)

```typescript
export interface ProseFragment {
  text: string;
  voice: VoiceMode;
  tier: NarrativeTier;
  eventId: string;
  sphereColoring?: SphereName;
}

export interface ProseContext {
  actorName?: string;
  targetName?: string;
  locationName?: string;
  sphere?: SphereName;
  dominantValues?: ValuePair[];
  foundationBias?: 'chaos' | 'order' | 'light' | 'darkness' | 'balanced';
  contextObjects?: ContextObject[];
  historicalFragments?: string[];
  oppositionSummary?: OppositionSummary;
}

// ─── Insider Beat Summary ───────────────────────────────────────

export interface InsiderBeatSummary {
  beatId: string;
  name: string;
  minStrength: number;
}
```

**Key Patterns:**
- Optional fields for context building (all `?`)
- Discriminated unions for tone/voice/tier
- Nested objects for complex data (contextObjects, oppositionSummary)
- Type names match their semantic role (ProseContext for text generation, InsiderBeatSummary for cultural flavor)

---

## 9. WORLD-MODEL GRAPH NODE STRUCTURE

### 9.1 Sphere Nodes

**File:** `src/data/world-model.json` (excerpt, lines 207-290)

```json
{
  "id": "foundation.chaos",
  "name": "Chaos",
  "category": "foundation-sphere",
  "description": "The primordial underpinning of all existence—raw potential, formless and boundless. Chaos is not evil or destructive, but rather the infinite wellspring from which all order, structure, and being emerge.",
  "properties": {
    "color": "#1a0033",
    "symbolicAnimal": "Serpent Ouroboros",
    "element": "Void",
    "alignedSpheres": [
      "foundation.darkness",
      "foundation.light"
    ],
    "cosmicPrinciple": "Potentiality",
    "influence": "foundational"
  }
}
```

**Key Patterns:**
- Flat node structure (id, name, category, description, properties)
- `category` is discriminant for grouping (foundation-sphere, creation-sphere, etc.)
- `properties` object holds heterogeneous data specific to category
- Cross-references via IDs in arrays (alignedSpheres)
- Narrative descriptions paired with mechanical data
- Color hex codes stored in properties
- Metadata fields (symbolic animal, element, cosmic principle)

---

## 10. TEST PATTERNS

### 10.1 Component Unit Test (ProgressBar)

**File:** `src/components/shared/__tests__/ProgressBar.test.tsx`

```typescript
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ProgressBar } from '../ProgressBar';

describe('ProgressBar', () => {
  it('renders with correct progress width', () => {
    const { container } = render(
      <ProgressBar progress={0.5} color="#d4a574" />
    );
    const progressFill = container.querySelector('div > div');
    expect(progressFill).toHaveStyle('width: 50%');
  });

  it('uses provided color for background', () => {
    const { container } = render(
      <ProgressBar progress={0.75} color="#5c6bc0" />
    );
    const progressFill = container.querySelector('div > div');
    expect(progressFill).toHaveStyle('backgroundColor: #5c6bc0');
  });

  it('applies glow effect when glow is true', () => {
    const { container } = render(
      <ProgressBar progress={0.5} color="#eab308" glow={true} />
    );
    const progressFill = container.querySelector('div > div');
    const boxShadow = progressFill?.getAttribute('style');
    expect(boxShadow).toContain('0 0 8px');
  });

  it('handles zero progress', () => {
    const { container } = render(
      <ProgressBar progress={0} color="#d4a574" />
    );
    const progressFill = container.querySelector('div > div');
    expect(progressFill).toHaveStyle('width: 0%');
  });

  it('handles full progress', () => {
    const { container } = render(
      <ProgressBar progress={1} color="#d4a574" />
    );
    const progressFill = container.querySelector('div > div');
    expect(progressFill).toHaveStyle('width: 100%');
  });

  it('applies data-testid when provided', () => {
    const { container } = render(
      <ProgressBar progress={0.5} color="#d4a574" dataTestId="custom-test-id" />
    );
    const progressBar = container.querySelector('[data-testid="custom-test-id"]');
    expect(progressBar).toBeInTheDocument();
  });
});
```

**Key Patterns:**
- `// @vitest-environment jsdom` header
- `describe()` wrapper per component
- One test per behavior (`it()` with descriptive name)
- Query via `container.querySelector()` for direct DOM inspection
- Assert on styles, classes, attributes, visibility
- Test both defaults and explicit props
- Edge cases (0, 1, null) handled
- Use `.toHaveStyle()` for inline styles, `.toHaveClass()` for Tailwind classes

### 10.2 Component Test with Mocks (DoomBar)

**File:** `src/components/Game/__tests__/DoomBar.test.tsx`

```typescript
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DoomBar } from '../DoomBar';
import type { DoomClockDefinition, DoomClockState } from '../../../types/doomClock';

describe('DoomBar', () => {
  const mockDefinition: DoomClockDefinition = {
    archetype: 'breach',
    totalTicks: 100,
    stages: [
      {
        stage: 1,
        name: 'Whispers',
        tickThreshold: 0.0,
        events: [],
      },
      {
        stage: 2,
        name: 'Signs',
        tickThreshold: 0.2,
        events: [],
      },
      // ... more stages ...
    ],
  };

  const mockState: DoomClockState = {
    definitionArchetype: 'breach',
    currentTick: 25,
    totalTicks: 100,
    currentStage: 2,
    progress: 0.25,
    stageTransitions: [0, 20, 40, 60, 80],
    expired: false,
    tickModifier: 1.0,
  };

  it('renders archetype name', () => {
    render(<DoomBar definition={mockDefinition} state={mockState} />);
    expect(screen.getByText('breach')).toBeInTheDocument();
  });

  it('renders current stage name', () => {
    render(<DoomBar definition={mockDefinition} state={mockState} />);
    expect(screen.getByText(/Stage 2: Signs/)).toBeInTheDocument();
  });

  it('renders progress percentage', () => {
    render(<DoomBar definition={mockDefinition} state={mockState} />);
    expect(screen.getByText('25%')).toBeInTheDocument();
  });

  it('shows expired state', () => {
    const expiredState: DoomClockState = {
      ...mockState,
      expired: true,
    };
    render(<DoomBar definition={mockDefinition} state={expiredState} />);
    expect(screen.getByText('THE UNMAKING')).toBeInTheDocument();
  });

  it('uses correct archetype color', () => {
    const { container } = render(<DoomBar definition={mockDefinition} state={mockState} />);
    const archetypeSpan = screen.getByText('breach');
    expect(archetypeSpan).toHaveStyle({ color: '#dc2626' });
  });
});
```

**Key Patterns:**
- Mock objects defined at module level
- Use `screen.getByText()` for readable assertions
- Regex patterns for partial text matching (`/Stage 2: Signs/`)
- Spread operator to create variant test cases (expiredState)
- Type annotations on mock objects (DoomClockDefinition, DoomClockState)
- Test text content, styles, and visibility
- Test user-facing strings, not implementation details

---

## 11. TESTING FRAMEWORK

**File:** `package.json` (devDependencies)

```json
"devDependencies": {
  "@testing-library/jest-dom": "^6.9.1",
  "@testing-library/react": "^16.3.2",
  "vitest": "^4.0.18"
}
```

**Key Points:**
- **Test runner:** vitest (Jest-compatible)
- **DOM testing:** @testing-library/react
- **Assertion library:** Jest-DOM matchers
- **Environment:** jsdom (browser-like DOM in Node.js)
- **Test discovery:** `**/__tests__/*.test.{ts,tsx}` pattern
- **Run tests:** `npm test` or `npm run test:watch`

---

## SUMMARY: KEY TAKEAWAYS FOR TOOLTIP SYSTEM PLAN

### Component Architecture
- Shared components use `React.memo()` with typed Props interface
- Props interface documents all fields with JSDoc
- Default values in destructuring
- Style constants at module level, computed styles via `useMemo()`

### Content Packages
- Files in `src/data/` with named exports
- Type imports from `src/types/`
- Lookup functions (e.g., `getHexTileUrl()`) for asset URLs
- Content constants tuned by design (TIER_NAMES, DEFAULT_THRESHOLDS, etc.)

### Engine/Aggregators
- Multi-stage: fetch → transform → aggregate
- Return nullable objects with early error handling
- Helper functions for derived data
- Imports from both types and content packages

### HUD Components
- Props separated into definition (immutable) + state (mutable)
- Handlers passed via callback props
- Conditional rendering for state-dependent UI
- Escape key handling for popovers
- Backdrop pattern for click-outside behavior

### Tests
- Vitest + @testing-library/react
- One test per behavior
- Mock objects typed explicitly
- Assert on styles, classes, text, visibility
- Edge cases covered (0, 1, null, full, empty)

All patterns follow Threadbare visual style (dark, serif fonts, amber/gold accents, opacity layers, glow effects).
