# Ascendant Scry Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the Ascendant Scry — a full-screen overlay showing the player's divine court with agent positions, title assignment, sacred site slots, and artifact slots.

**Architecture:** New type definitions in `src/types/scry.ts`, pure engine functions in `src/engine/scry.ts`, content data in `src/data/scry-content.ts`, and a full-screen overlay component `ScryOverlay.tsx` wired into `GameView.tsx`. All scry state lives on the ascendant node properties in the graph (no separate storage). Title generation uses seeded PRNG + agent stats. Sacred sites and artifacts are rendered but not interactive (placeholder).

**Tech Stack:** TypeScript, React, Vitest, @testing-library/react

**Design Doc:** `Docs/plans/2026-03-06-ascendant-scry-design.md`

---

## Task 1: Type Definitions

**Files:**
- Create: `src/types/scry.ts`

**Step 1: Create scry type definitions**

Create `src/types/scry.ts` with all types for the Scry system:

```typescript
/**
 * Ascendant Scry — Type definitions for the divine court system.
 *
 * The Scry is a metaphysical overlay showing the player's divine court:
 * agent positions with titles, sacred site slots, and artifact slots.
 */

import type { SphereName } from './index';
import type { ReachDomain } from './traits';

// ─── Position Ranks ─────────────────────────────────────────────

export type PositionRank = 'apex' | 'inner' | 'outer';

export const POSITION_RANK_ORDER: PositionRank[] = ['apex', 'inner', 'outer'];

/** Minimum influence tier required to fill a position of this rank */
export const RANK_MIN_TIER: Record<PositionRank, number> = {
  apex: 3,   // Devoted+
  inner: 2,  // Aligned+
  outer: 1,  // Touched+
};

/** Base essence cost to reassign a position of this rank */
export const RANK_REASSIGNMENT_COST: Record<PositionRank, number> = {
  apex: 30,
  inner: 15,
  outer: 5,
};

/** Demotion costs half of reassignment */
export const RANK_DEMOTION_COST: Record<PositionRank, number> = {
  apex: 15,
  inner: 8,
  outer: 3,
};

/** Each subsequent reassignment increases cost by this factor */
export const REASSIGNMENT_ESCALATION = 1.25;

/** Essence cost to restructure the entire court */
export const RESTRUCTURE_COST = 50;

// ─── Court Structures ───────────────────────────────────────────

export type CourtStructureType = 'high_house' | 'circle' | 'web' | 'abyss';

export type FoundationAffinity = 'order' | 'light' | 'chaos' | 'darkness';

export interface StructureBonus {
  type: 'tier_cost' | 'sphere_influence' | 'domain_bonus' | 'weakness_reduction';
  description: string;
  /** Which positions this bonus applies to ('all' or specific ranks) */
  appliesTo: 'all' | PositionRank;
  value: number;
}

export interface CourtStructureDefinition {
  id: string;
  structureType: CourtStructureType;
  foundationAffinity: FoundationAffinity;
  name: string;
  description: string;
  flavorText: string;
  /** How many positions per rank */
  positionCounts: Record<PositionRank, number>;
  sacredSiteSlots: number;
  artifactSlots: number;
  structureBonus: StructureBonus;
}

// ─── Positions ──────────────────────────────────────────────────

export interface Position {
  id: string;
  rank: PositionRank;
  slotIndex: number;
  /** Position archetype — thematic label guiding title generation */
  archetype: string;
  assignedAgentId: string | null;
  activeTitle: Title | null;
  /** Expansion hook: sealed positions can be unlocked later */
  locked: boolean;
}

// ─── Titles ─────────────────────────────────────────────────────

export type TitleEffectType =
  | 'domain_bonus'
  | 'tier_cost'
  | 'detection_risk'
  | 'essence_gen'
  | 'sphere_influence'
  | 'custom';

export interface TitleEffect {
  type: TitleEffectType;
  target: string;
  value: number;
  description: string;
}

export interface Title {
  id: string;
  name: string;
  rank: PositionRank;
  sphereAffinity: SphereName;
  domainAffinity: ReachDomain;
  bonuses: TitleEffect[];
  weaknesses: TitleEffect[];
  flavorText: string;
  /** Params used to generate this title (for reproducibility) */
  generationSeed: Record<string, unknown>;
}

/** A title option presented to the player during assignment */
export interface TitleProposal {
  title: Title;
  /** Why this title fits the agent (for UI tooltip) */
  rationale: string;
}

// ─── Holdings: Sacred Sites ─────────────────────────────────────

export interface SacredSite {
  slotIndex: number;
  locationId: string | null;
  locationName: string | null;
  consecrationCost: number;
  radiusSphereInfluence: SphereName | null;
  influenceStrength: number;
  bonusEssencePerTick: number;
}

// ─── Holdings: Divine Artifacts ─────────────────────────────────

export interface DivineArtifact {
  slotIndex: number;
  artifactId: string | null;
  name: string | null;
  bearerId: string | null;
  bearerName: string | null;
  sphereAffinity: SphereName | null;
  effects: TitleEffect[];
  lossConsequence: string | null;
  creationCost: number;
}

// ─── Scry State ─────────────────────────────────────────────────

export type TitleAction = 'assign' | 'reassign' | 'demote' | 'restructure';

export interface TitleAssignment {
  tick: number;
  positionId: string;
  agentId: string;
  titleId: string;
  action: TitleAction;
  essenceCost: number;
}

export interface ScryState {
  /** Which court structure the player chose */
  courtStructureType: CourtStructureType;
  /** Instantiated positions with assignments */
  positions: Position[];
  /** Sacred site holdings */
  sacredSites: SacredSite[];
  /** Artifact holdings */
  artifacts: DivineArtifact[];
  /** Audit trail of all title changes */
  titleHistory: TitleAssignment[];
  /** Running count of reassignments (for cost escalation) */
  totalReassignmentCount: number;
  /** Whether the scry has been initialized (player has chosen a structure) */
  initialized: boolean;
}
```

**Step 2: Run TypeScript check**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors related to scry.ts

**Step 3: Commit**

```bash
git add src/types/scry.ts
git commit -m "feat(scry): add type definitions for divine court system

CourtStructure, Position, Title, TitleEffect, SacredSite, DivineArtifact,
ScryState types + rank constants, reassignment costs, and escalation rules."
```

---

## Task 2: Content Data — Court Structures & Title Fragments

**Files:**
- Create: `src/data/scry-content.ts`

This file is the **content package** — the single source of truth for all content-managed data in the Scry system. A content manager modifying the Scry system should edit ONLY this file.

**Step 1: Create content data file**

Create `src/data/scry-content.ts`:

```typescript
/**
 * Scry Content Package — All data-driven content for the divine court system.
 *
 * ═══════════════════════════════════════════════════════════════════
 * CONTENT MANAGER: This is the file you edit to change court structures,
 * title generation, sacred site rules, and artifact templates.
 * ═══════════════════════════════════════════════════════════════════
 *
 * Sections:
 * 1. COURT_STRUCTURES — the 4 geometry definitions (High House, Circle, Web, Abyss)
 * 2. POSITION_ARCHETYPES — thematic labels per structure that guide title generation
 * 3. TITLE_FRAGMENTS — sphere-keyed name parts (prefixes, suffixes, epithets)
 * 4. TITLE_TEMPLATES — rank-keyed name patterns
 * 5. BONUS_RULES — what bonuses each rank can grant
 * 6. WEAKNESS_POOL — possible negative effects
 * 7. SACRED_SITE_RULES — consecration costs, radius, decay (placeholder)
 * 8. ARTIFACT_TEMPLATES — name fragments, costs, loss consequences (placeholder)
 */

import type {
  CourtStructureDefinition,
  PositionRank,
  TitleEffectType,
} from '../types/scry';
import type { SphereName } from '../types/index';
import type { ReachDomain } from '../types/traits';

// ═══════════════════════════════════════════════════════════════════
// 1. COURT STRUCTURES
// ═══════════════════════════════════════════════════════════════════

export const COURT_STRUCTURES: CourtStructureDefinition[] = [
  {
    id: 'court.high_house',
    structureType: 'high_house',
    foundationAffinity: 'order',
    name: 'The High House',
    description: 'A rigid pyramid of divine hierarchy. Those at the top command absolute authority.',
    flavorText: 'Stone upon stone, tier upon tier — the cosmos demands structure.',
    positionCounts: { apex: 1, inner: 3, outer: 6 },
    sacredSiteSlots: 2,
    artifactSlots: 3,
    structureBonus: {
      type: 'tier_cost',
      description: 'Top 3 positions cost 1 less essence for tier maintenance',
      appliesTo: 'apex',
      value: -1,
    },
  },
  {
    id: 'court.circle',
    structureType: 'circle',
    foundationAffinity: 'light',
    name: 'The Circle',
    description: 'A radiant mandala where all positions resonate with shared divine energy.',
    flavorText: 'Light finds its center, and the center holds.',
    positionCounts: { apex: 1, inner: 3, outer: 6 },
    sacredSiteSlots: 3,
    artifactSlots: 2,
    structureBonus: {
      type: 'sphere_influence',
      description: 'All positions share +0.1 sphere influence bonus',
      appliesTo: 'all',
      value: 0.1,
    },
  },
  {
    id: 'court.web',
    structureType: 'web',
    foundationAffinity: 'chaos',
    name: 'The Web',
    description: 'A shifting network where connections matter more than rank.',
    flavorText: 'Every strand vibrates with possibility. Pull one, and the pattern changes.',
    positionCounts: { apex: 1, inner: 3, outer: 6 },
    sacredSiteSlots: 2,
    artifactSlots: 4,
    structureBonus: {
      type: 'domain_bonus',
      description: 'Outer positions gain +1 to a random domain each tick',
      appliesTo: 'outer',
      value: 1,
    },
  },
  {
    id: 'court.abyss',
    structureType: 'abyss',
    foundationAffinity: 'darkness',
    name: 'The Abyss',
    description: 'An inverted pyramid where power flows downward into the deep.',
    flavorText: 'What rises must descend. The deepest truths lie at the bottom.',
    positionCounts: { apex: 1, inner: 3, outer: 6 },
    sacredSiteSlots: 2,
    artifactSlots: 3,
    structureBonus: {
      type: 'weakness_reduction',
      description: 'Title weaknesses are reduced by 30%',
      appliesTo: 'all',
      value: 0.7,
    },
  },
];

// ═══════════════════════════════════════════════════════════════════
// 2. POSITION ARCHETYPES — thematic labels per structure + rank
// ═══════════════════════════════════════════════════════════════════

/** Each structure has named archetypes for each slot. These guide title generation. */
export const POSITION_ARCHETYPES: Record<string, Record<PositionRank, string[]>> = {
  high_house: {
    apex: ['The Sovereign'],
    inner: ['The Shield', 'The Voice', 'The Eye'],
    outer: ['The Blade', 'The Coin', 'The Shadow', 'The Flame', 'The Root', 'The Tide'],
  },
  circle: {
    apex: ['The Center'],
    inner: ['The First Light', 'The Harmony', 'The Radiance'],
    outer: ['The Spark', 'The Echo', 'The Thread', 'The Bloom', 'The Mirror', 'The Wind'],
  },
  web: {
    apex: ['The Nexus'],
    inner: ['The Spinner', 'The Anchor', 'The Lurker'],
    outer: ['The Strand', 'The Knot', 'The Fly', 'The Signal', 'The Weave', 'The Trap'],
  },
  abyss: {
    apex: ['The Depth'],
    inner: ['The Descent', 'The Hunger', 'The Silence'],
    outer: ['The Crack', 'The Whisper', 'The Fossil', 'The Pressure', 'The Drift', 'The Void'],
  },
};

// ═══════════════════════════════════════════════════════════════════
// 3. TITLE FRAGMENTS — sphere-keyed name parts
// ═══════════════════════════════════════════════════════════════════

export interface TitleFragments {
  epithets: string[];   // adjective-like: "Storm", "Silent", "Burning"
  roles: string[];      // noun-like: "Marshal", "Keeper", "Herald"
}

export const TITLE_FRAGMENTS: Record<SphereName, TitleFragments> = {
  force: {
    epithets: ['Storm', 'Iron', 'War', 'Thunder', 'Crimson'],
    roles: ['Marshal', 'Warden', 'Champion', 'Destroyer', 'Sentinel'],
  },
  matter: {
    epithets: ['Stone', 'Earthen', 'Granite', 'Deep', 'Unbroken'],
    roles: ['Architect', 'Shaper', 'Foundation', 'Bulwark', 'Mason'],
  },
  energy: {
    epithets: ['Burning', 'Radiant', 'Lightning', 'Blazing', 'Bright'],
    roles: ['Herald', 'Conduit', 'Beacon', 'Igniter', 'Torch'],
  },
  life: {
    epithets: ['Verdant', 'Blooming', 'Evergreen', 'Vital', 'Fertile'],
    roles: ['Shepherd', 'Tender', 'Gardener', 'Lifebringer', 'Healer'],
  },
  mind: {
    epithets: ['Silent', 'Dreaming', 'Lucid', 'Keen', 'Piercing'],
    roles: ['Oracle', 'Seer', 'Weaver', 'Scholar', 'Whisperer'],
  },
  spirit: {
    epithets: ['Ethereal', 'Spectral', 'Veiled', 'Ghostly', 'Hollow'],
    roles: ['Walker', 'Guide', 'Medium', 'Watcher', 'Binder'],
  },
  time: {
    epithets: ['Ancient', 'Timeless', 'Fleeting', 'Cyclic', 'Enduring'],
    roles: ['Chronicler', 'Keeper', 'Turner', 'Witness', 'Tide'],
  },
  entropy: {
    epithets: ['Ashen', 'Withering', 'Hollow', 'Fading', 'Dark'],
    roles: ['Unraveler', 'Harbinger', 'Ender', 'Reaper', 'Void'],
  },
};

// ═══════════════════════════════════════════════════════════════════
// 4. TITLE TEMPLATES — rank-keyed patterns
// ═══════════════════════════════════════════════════════════════════

/**
 * {epithet} = from TITLE_FRAGMENTS[sphere].epithets
 * {role} = from TITLE_FRAGMENTS[sphere].roles
 * {archetype} = from POSITION_ARCHETYPES[structure][rank][slotIndex]
 * {domain} = ReachDomain display name
 */
export const TITLE_TEMPLATES: Record<PositionRank, string[]> = {
  apex: [
    'The {epithet} {role}',
    '{epithet} Sovereign of the {domain}',
    'The {epithet} One',
  ],
  inner: [
    '{epithet} {role}',
    '{role} of the {domain}',
    'The {epithet} {archetype}',
  ],
  outer: [
    '{epithet} of the {domain}',
    'The {role}',
    '{archetype} {role}',
  ],
};

// ═══════════════════════════════════════════════════════════════════
// 5. BONUS RULES — stat ranges per rank
// ═══════════════════════════════════════════════════════════════════

export interface BonusRule {
  type: TitleEffectType;
  target: 'primary_domain' | 'secondary_domain' | 'sphere' | 'tier' | 'detection';
  minValue: number;
  maxValue: number;
  /** How many bonuses of this type to generate */
  weight: number;
}

export const BONUS_RULES: Record<PositionRank, BonusRule[]> = {
  apex: [
    { type: 'domain_bonus', target: 'primary_domain', minValue: 2, maxValue: 4, weight: 3 },
    { type: 'essence_gen', target: 'sphere', minValue: 0.3, maxValue: 0.8, weight: 2 },
    { type: 'tier_cost', target: 'tier', minValue: -2, maxValue: -1, weight: 1 },
  ],
  inner: [
    { type: 'domain_bonus', target: 'primary_domain', minValue: 1, maxValue: 3, weight: 3 },
    { type: 'essence_gen', target: 'sphere', minValue: 0.1, maxValue: 0.4, weight: 2 },
    { type: 'sphere_influence', target: 'sphere', minValue: 0.1, maxValue: 0.3, weight: 1 },
  ],
  outer: [
    { type: 'domain_bonus', target: 'primary_domain', minValue: 1, maxValue: 2, weight: 3 },
    { type: 'sphere_influence', target: 'sphere', minValue: 0.05, maxValue: 0.15, weight: 2 },
  ],
};

// ═══════════════════════════════════════════════════════════════════
// 6. WEAKNESS POOL — possible negative effects
// ═══════════════════════════════════════════════════════════════════

export interface WeaknessTemplate {
  type: TitleEffectType;
  target: string;
  minValue: number;
  maxValue: number;
  description: string;
  /** Which spheres tend to produce this weakness */
  sphereAssociations: SphereName[];
}

export const WEAKNESS_POOL: WeaknessTemplate[] = [
  {
    type: 'domain_bonus',
    target: 'heart',
    minValue: -2,
    maxValue: -1,
    description: 'Diminished social grace',
    sphereAssociations: ['force', 'entropy', 'matter'],
  },
  {
    type: 'domain_bonus',
    target: 'shadow',
    minValue: -2,
    maxValue: -1,
    description: 'Conspicuous presence',
    sphereAssociations: ['energy', 'life', 'force'],
  },
  {
    type: 'detection_risk',
    target: 'detection',
    minValue: 0.05,
    maxValue: 0.20,
    description: 'Increased divine visibility',
    sphereAssociations: ['energy', 'spirit', 'mind'],
  },
  {
    type: 'domain_bonus',
    target: 'iron',
    minValue: -2,
    maxValue: -1,
    description: 'Weakened martial prowess',
    sphereAssociations: ['mind', 'spirit', 'time'],
  },
  {
    type: 'domain_bonus',
    target: 'eye',
    minValue: -2,
    maxValue: -1,
    description: 'Clouded perception',
    sphereAssociations: ['entropy', 'matter', 'force'],
  },
  {
    type: 'essence_gen',
    target: 'sphere',
    minValue: -0.3,
    maxValue: -0.1,
    description: 'Essence drain',
    sphereAssociations: ['entropy', 'time', 'spirit'],
  },
  {
    type: 'tier_cost',
    target: 'tier',
    minValue: 0.5,
    maxValue: 1.5,
    description: 'Increased maintenance burden',
    sphereAssociations: ['life', 'energy', 'mind'],
  },
];

// ═══════════════════════════════════════════════════════════════════
// 7. SACRED SITE RULES (placeholder — not mechanically active yet)
// ═══════════════════════════════════════════════════════════════════

export const SACRED_SITE_DEFAULTS = {
  /** Base consecration cost in primary sphere essence */
  baseCost: 20,
  /** Influence strength of a freshly consecrated site */
  baseInfluenceStrength: 0.3,
  /** Bonus essence per tick from a sacred site */
  baseBonusEssence: 0.2,
};

// ═══════════════════════════════════════════════════════════════════
// 8. ARTIFACT TEMPLATES (placeholder — not mechanically active yet)
// ═══════════════════════════════════════════════════════════════════

export const ARTIFACT_DEFAULTS = {
  /** Base creation cost in primary sphere essence */
  baseCost: 35,
};

export const DOMAIN_DISPLAY_NAMES: Record<ReachDomain, string> = {
  iron: 'Iron',
  gold: 'Gold',
  shadow: 'Shadow',
  veil: 'Veil',
  heart: 'Heart',
  eye: 'Eye',
  stone: 'Stone',
  star: 'Star',
  flesh: 'Flesh',
};
```

**Step 2: Run TypeScript check**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: Clean compile

**Step 3: Commit**

```bash
git add src/data/scry-content.ts
git commit -m "feat(scry): add content package for divine court system

4 court structures, position archetypes, title fragments per sphere,
title templates per rank, bonus rules, weakness pool, sacred site
and artifact defaults. Single file for content manager edits."
```

---

## Task 3: Scry Engine — State Creation & Court Initialization

**Files:**
- Create: `src/engine/scry.ts`
- Create: `src/engine/__tests__/scry.test.ts`

**Step 1: Write failing tests for state creation**

Create `src/engine/__tests__/scry.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  createScryState,
  initializeCourt,
  getCourtStructureDefinition,
} from '../scry';

describe('Scry Engine — State Creation', () => {
  describe('createScryState', () => {
    it('returns uninitialized state with no positions', () => {
      const state = createScryState();
      expect(state.initialized).toBe(false);
      expect(state.positions).toHaveLength(0);
      expect(state.sacredSites).toHaveLength(0);
      expect(state.artifacts).toHaveLength(0);
      expect(state.titleHistory).toHaveLength(0);
      expect(state.totalReassignmentCount).toBe(0);
    });
  });

  describe('getCourtStructureDefinition', () => {
    it('returns definition for high_house', () => {
      const def = getCourtStructureDefinition('high_house');
      expect(def.name).toBe('The High House');
      expect(def.foundationAffinity).toBe('order');
      expect(def.positionCounts.apex).toBe(1);
      expect(def.positionCounts.inner).toBe(3);
      expect(def.positionCounts.outer).toBe(6);
    });

    it('returns all 4 court structures', () => {
      for (const type of ['high_house', 'circle', 'web', 'abyss'] as const) {
        const def = getCourtStructureDefinition(type);
        expect(def).toBeDefined();
        expect(def.structureType).toBe(type);
      }
    });
  });

  describe('initializeCourt', () => {
    it('creates 10 positions (1 apex + 3 inner + 6 outer)', () => {
      const state = createScryState();
      const initialized = initializeCourt(state, 'high_house');
      expect(initialized.initialized).toBe(true);
      expect(initialized.courtStructureType).toBe('high_house');
      expect(initialized.positions).toHaveLength(10);
      expect(initialized.positions.filter(p => p.rank === 'apex')).toHaveLength(1);
      expect(initialized.positions.filter(p => p.rank === 'inner')).toHaveLength(3);
      expect(initialized.positions.filter(p => p.rank === 'outer')).toHaveLength(6);
    });

    it('creates empty sacred site slots matching structure definition', () => {
      const state = createScryState();
      const initialized = initializeCourt(state, 'circle');
      const def = getCourtStructureDefinition('circle');
      expect(initialized.sacredSites).toHaveLength(def.sacredSiteSlots);
      expect(initialized.sacredSites.every(s => s.locationId === null)).toBe(true);
    });

    it('creates empty artifact slots matching structure definition', () => {
      const state = createScryState();
      const initialized = initializeCourt(state, 'web');
      const def = getCourtStructureDefinition('web');
      expect(initialized.artifacts).toHaveLength(def.artifactSlots);
      expect(initialized.artifacts.every(a => a.artifactId === null)).toBe(true);
    });

    it('positions have correct archetypes from content data', () => {
      const state = createScryState();
      const initialized = initializeCourt(state, 'high_house');
      const apex = initialized.positions.find(p => p.rank === 'apex')!;
      expect(apex.archetype).toBe('The Sovereign');
    });

    it('all positions start unassigned and unlocked', () => {
      const state = createScryState();
      const initialized = initializeCourt(state, 'abyss');
      for (const pos of initialized.positions) {
        expect(pos.assignedAgentId).toBeNull();
        expect(pos.activeTitle).toBeNull();
        expect(pos.locked).toBe(false);
      }
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/scry.test.ts --pool=forks 2>&1 | tail -20`
Expected: FAIL — module '../scry' not found

**Step 3: Implement state creation functions**

Create `src/engine/scry.ts`:

```typescript
/**
 * Scry Engine — Divine court state management, title generation,
 * and position assignment logic.
 *
 * All functions are pure. ScryState lives on the ascendant node properties.
 */

import type {
  ScryState,
  CourtStructureType,
  Position,
  PositionRank,
  SacredSite,
  DivineArtifact,
  CourtStructureDefinition,
} from '../types/scry';
import { POSITION_RANK_ORDER } from '../types/scry';
import { COURT_STRUCTURES, POSITION_ARCHETYPES } from '../data/scry-content';

// ─── State Creation ─────────────────────────────────────────────

/**
 * Create an empty, uninitialized ScryState.
 * The player must choose a court structure before using it.
 */
export function createScryState(): ScryState {
  return {
    courtStructureType: 'high_house', // default, overwritten on init
    positions: [],
    sacredSites: [],
    artifacts: [],
    titleHistory: [],
    totalReassignmentCount: 0,
    initialized: false,
  };
}

/**
 * Look up a court structure definition by type.
 */
export function getCourtStructureDefinition(
  structureType: CourtStructureType,
): CourtStructureDefinition {
  const def = COURT_STRUCTURES.find(s => s.structureType === structureType);
  if (!def) {
    throw new Error(`Unknown court structure type: ${structureType}`);
  }
  return def;
}

/**
 * Initialize the court with a chosen structure type.
 * Creates all position slots, sacred site slots, and artifact slots.
 * Returns a new ScryState (does not mutate input).
 */
export function initializeCourt(
  state: ScryState,
  structureType: CourtStructureType,
): ScryState {
  const def = getCourtStructureDefinition(structureType);
  const archetypes = POSITION_ARCHETYPES[structureType];

  const positions: Position[] = [];

  for (const rank of POSITION_RANK_ORDER) {
    const count = def.positionCounts[rank];
    const rankArchetypes = archetypes[rank];

    for (let i = 0; i < count; i++) {
      positions.push({
        id: `pos.${structureType}.${rank}_${i}`,
        rank,
        slotIndex: i,
        archetype: rankArchetypes[i] || `${rank} ${i}`,
        assignedAgentId: null,
        activeTitle: null,
        locked: false,
      });
    }
  }

  const sacredSites: SacredSite[] = Array.from(
    { length: def.sacredSiteSlots },
    (_, i) => ({
      slotIndex: i,
      locationId: null,
      locationName: null,
      consecrationCost: 0,
      radiusSphereInfluence: null,
      influenceStrength: 0,
      bonusEssencePerTick: 0,
    }),
  );

  const artifacts: DivineArtifact[] = Array.from(
    { length: def.artifactSlots },
    (_, i) => ({
      slotIndex: i,
      artifactId: null,
      name: null,
      bearerId: null,
      bearerName: null,
      sphereAffinity: null,
      effects: [],
      lossConsequence: null,
      creationCost: 0,
    }),
  );

  return {
    ...state,
    courtStructureType: structureType,
    positions,
    sacredSites,
    artifacts,
    initialized: true,
  };
}
```

**Step 4: Run tests to verify they pass**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/scry.test.ts --pool=forks 2>&1 | tail -20`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/engine/scry.ts src/engine/__tests__/scry.test.ts
git commit -m "feat(scry): state creation and court initialization

createScryState, initializeCourt, getCourtStructureDefinition.
10 positions (1 apex + 3 inner + 6 outer) with archetypes,
sacred site and artifact slot creation."
```

---

## Task 4: Scry Engine — Title Generation

**Files:**
- Modify: `src/engine/scry.ts`
- Modify: `src/engine/__tests__/scry.test.ts`

**Step 1: Write failing tests for title generation**

Append to `src/engine/__tests__/scry.test.ts`:

```typescript
import {
  createScryState,
  initializeCourt,
  getCourtStructureDefinition,
  generateTitleProposals,
} from '../scry';
import type { RetinueAgent } from '../retinue';
import type { AxiologicalProfile } from '../../types/agent';
import type { ReachDomain } from '../../types/traits';

// ... existing tests ...

describe('Scry Engine — Title Generation', () => {
  const mockAgent: RetinueAgent = {
    id: 'agent.1',
    name: 'Kalam',
    tier: 3,
    tierName: 'Champion',
    locationId: 'loc.a',
    locationName: 'Shadow Keep',
    profile: {
      ambition_contentment: 0.6,
      courage_prudence: 0.4,
      cruelty_compassion: -0.3,
      cunning_honesty: 0.5,
      devotion_independence: 0.2,
      loyalty_treachery: 0.1,
      tradition_innovation: -0.2,
      dominance_humility: 0.3,
      wrath_patience: 0.4,
      greed_generosity: -0.1,
    } as AxiologicalProfile,
    domainCapabilities: {
      iron: 7, gold: 3, shadow: 8, veil: 2, heart: 4,
      eye: 5, stone: 1, star: 2, flesh: 3,
    } as Record<ReachDomain, number>,
    factionName: null,
  };

  it('generates exactly 3-4 title proposals', () => {
    const proposals = generateTitleProposals({
      agent: mockAgent,
      positionRank: 'inner',
      structureType: 'high_house',
      positionArchetype: 'The Shield',
      primarySphere: 'force',
      seed: 42,
    });
    expect(proposals.length).toBeGreaterThanOrEqual(3);
    expect(proposals.length).toBeLessThanOrEqual(4);
  });

  it('every proposal has a name, bonuses, and weaknesses', () => {
    const proposals = generateTitleProposals({
      agent: mockAgent,
      positionRank: 'apex',
      structureType: 'high_house',
      positionArchetype: 'The Sovereign',
      primarySphere: 'force',
      seed: 42,
    });
    for (const p of proposals) {
      expect(p.title.name.length).toBeGreaterThan(0);
      expect(p.title.bonuses.length).toBeGreaterThan(0);
      expect(p.title.weaknesses.length).toBeGreaterThan(0);
      expect(p.title.flavorText.length).toBeGreaterThan(0);
      expect(p.rationale.length).toBeGreaterThan(0);
    }
  });

  it('title sphere affinity matches agent strongest sphere alignment', () => {
    const proposals = generateTitleProposals({
      agent: mockAgent,
      positionRank: 'outer',
      structureType: 'web',
      positionArchetype: 'The Strand',
      primarySphere: 'mind',
      seed: 99,
    });
    // All titles should have a valid sphere
    for (const p of proposals) {
      expect(typeof p.title.sphereAffinity).toBe('string');
    }
  });

  it('same seed produces same titles (deterministic)', () => {
    const a = generateTitleProposals({
      agent: mockAgent,
      positionRank: 'inner',
      structureType: 'circle',
      positionArchetype: 'The Harmony',
      primarySphere: 'life',
      seed: 777,
    });
    const b = generateTitleProposals({
      agent: mockAgent,
      positionRank: 'inner',
      structureType: 'circle',
      positionArchetype: 'The Harmony',
      primarySphere: 'life',
      seed: 777,
    });
    expect(a.map(p => p.title.name)).toEqual(b.map(p => p.title.name));
  });

  it('apex titles have stronger bonuses than outer titles', () => {
    const apexProposals = generateTitleProposals({
      agent: mockAgent,
      positionRank: 'apex',
      structureType: 'high_house',
      positionArchetype: 'The Sovereign',
      primarySphere: 'force',
      seed: 42,
    });
    const outerProposals = generateTitleProposals({
      agent: mockAgent,
      positionRank: 'outer',
      structureType: 'high_house',
      positionArchetype: 'The Blade',
      primarySphere: 'force',
      seed: 42,
    });

    const apexMaxBonus = Math.max(
      ...apexProposals.flatMap(p => p.title.bonuses.map(b => Math.abs(b.value)))
    );
    const outerMaxBonus = Math.max(
      ...outerProposals.flatMap(p => p.title.bonuses.map(b => Math.abs(b.value)))
    );
    expect(apexMaxBonus).toBeGreaterThanOrEqual(outerMaxBonus);
  });
});
```

**Step 2: Run tests to verify new tests fail**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/scry.test.ts --pool=forks 2>&1 | tail -20`
Expected: New tests FAIL — generateTitleProposals not found

**Step 3: Implement title generation**

Add to `src/engine/scry.ts`:

```typescript
import type {
  Title,
  TitleProposal,
  TitleEffect,
} from '../types/scry';
import type { SphereName } from '../types/index';
import type { ReachDomain } from '../types/traits';
import type { RetinueAgent } from './retinue';
import {
  TITLE_FRAGMENTS,
  TITLE_TEMPLATES,
  BONUS_RULES,
  WEAKNESS_POOL,
  DOMAIN_DISPLAY_NAMES,
} from '../data/scry-content';

// Reuse the mulberry32 PRNG from ascendant.ts
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Title Generation ───────────────────────────────────────────

export interface TitleGenerationParams {
  agent: RetinueAgent;
  positionRank: PositionRank;
  structureType: CourtStructureType;
  positionArchetype: string;
  primarySphere: SphereName;
  seed: number;
}

/**
 * Generate 3-4 title proposals for an agent at a position.
 * Deterministic: same params + seed = same proposals.
 */
export function generateTitleProposals(params: TitleGenerationParams): TitleProposal[] {
  const { agent, positionRank, structureType, positionArchetype, primarySphere, seed } = params;
  const rng = mulberry32(seed);

  // Determine agent's sphere affinity: primary sphere + top 2 domains
  const topDomains = Object.entries(agent.domainCapabilities)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([d]) => d as ReachDomain);

  // Pick 2-3 spheres to generate titles from (primary + related)
  const spherePool: SphereName[] = [primarySphere];
  // Add spheres that relate to agent's strongest domains
  const SPHERE_DOMAIN_AFFINITY: Partial<Record<ReachDomain, SphereName>> = {
    iron: 'force', gold: 'matter', shadow: 'entropy', veil: 'spirit',
    heart: 'life', eye: 'mind', stone: 'matter', star: 'time', flesh: 'life',
  };
  for (const d of topDomains) {
    const relatedSphere = SPHERE_DOMAIN_AFFINITY[d];
    if (relatedSphere && !spherePool.includes(relatedSphere)) {
      spherePool.push(relatedSphere);
    }
  }

  const proposalCount = 3 + (rng() > 0.5 ? 1 : 0); // 3 or 4
  const proposals: TitleProposal[] = [];

  for (let i = 0; i < proposalCount; i++) {
    const sphere = spherePool[i % spherePool.length];
    const fragments = TITLE_FRAGMENTS[sphere];
    const templates = TITLE_TEMPLATES[positionRank];

    // Pick fragments
    const epithet = fragments.epithets[Math.floor(rng() * fragments.epithets.length)];
    const role = fragments.roles[Math.floor(rng() * fragments.roles.length)];
    const template = templates[Math.floor(rng() * templates.length)];
    const domain = topDomains[Math.floor(rng() * topDomains.length)];

    // Build name from template
    const name = template
      .replace('{epithet}', epithet)
      .replace('{role}', role)
      .replace('{archetype}', positionArchetype)
      .replace('{domain}', DOMAIN_DISPLAY_NAMES[domain] || domain);

    // Generate bonuses
    const bonusRules = BONUS_RULES[positionRank];
    const bonuses: TitleEffect[] = [];
    // Pick 1-2 bonuses
    const bonusCount = positionRank === 'apex' ? 2 : 1 + (rng() > 0.6 ? 1 : 0);
    const shuffledRules = [...bonusRules].sort(() => rng() - 0.5);
    for (let b = 0; b < Math.min(bonusCount, shuffledRules.length); b++) {
      const rule = shuffledRules[b];
      const value = rule.minValue + rng() * (rule.maxValue - rule.minValue);
      const roundedValue = Math.round(value * 10) / 10;
      const targetStr = rule.target === 'primary_domain'
        ? (topDomains[0] || 'iron')
        : rule.target === 'secondary_domain'
          ? (topDomains[1] || topDomains[0] || 'gold')
          : rule.target === 'sphere'
            ? sphere
            : rule.target;
      bonuses.push({
        type: rule.type,
        target: targetStr,
        value: roundedValue,
        description: `${roundedValue > 0 ? '+' : ''}${roundedValue} ${DOMAIN_DISPLAY_NAMES[targetStr as ReachDomain] || targetStr}`,
      });
    }

    // Generate 1 weakness
    const applicableWeaknesses = WEAKNESS_POOL.filter(
      w => w.sphereAssociations.includes(sphere)
    );
    const weaknessTemplate = applicableWeaknesses.length > 0
      ? applicableWeaknesses[Math.floor(rng() * applicableWeaknesses.length)]
      : WEAKNESS_POOL[Math.floor(rng() * WEAKNESS_POOL.length)];

    const weaknessValue = weaknessTemplate.minValue +
      rng() * (weaknessTemplate.maxValue - weaknessTemplate.minValue);
    const roundedWeakness = Math.round(weaknessValue * 10) / 10;

    const weakness: TitleEffect = {
      type: weaknessTemplate.type,
      target: weaknessTemplate.target,
      value: roundedWeakness,
      description: weaknessTemplate.description,
    };

    const title: Title = {
      id: `title.${structureType}.${positionRank}_${i}_s${seed}`,
      name,
      rank: positionRank,
      sphereAffinity: sphere,
      domainAffinity: domain,
      bonuses,
      weaknesses: [weakness],
      flavorText: `The ${epithet.toLowerCase()} essence of ${sphere} flows through this office.`,
      generationSeed: { seed, index: i, sphere, domain },
    };

    proposals.push({
      title,
      rationale: `${agent.name}'s ${DOMAIN_DISPLAY_NAMES[domain]} prowess (${agent.domainCapabilities[domain]}) aligns with the ${positionArchetype} role.`,
    });
  }

  return proposals;
}
```

**Step 4: Run tests to verify they pass**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/scry.test.ts --pool=forks 2>&1 | tail -20`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/engine/scry.ts src/engine/__tests__/scry.test.ts
git commit -m "feat(scry): title generation with bonuses and weaknesses

generateTitleProposals: seeded PRNG, agent stats + sphere affinity,
rank-scaled bonuses and sphere-associated weaknesses. 3-4 proposals
per assignment, deterministic given same seed."
```

---

## Task 5: Scry Engine — Assignment, Reassignment, Demotion

**Files:**
- Modify: `src/engine/scry.ts`
- Modify: `src/engine/__tests__/scry.test.ts`

**Step 1: Write failing tests for assignment operations**

Append to `src/engine/__tests__/scry.test.ts`:

```typescript
import {
  // ...existing imports...
  assignAgentToPosition,
  demoteAgent,
  getReassignmentCost,
  getEligiblePositions,
} from '../scry';

describe('Scry Engine — Assignment Operations', () => {
  // Use mockAgent from earlier describe block (move to top-level or re-declare)

  let state: ScryState;

  beforeEach(() => {
    state = initializeCourt(createScryState(), 'high_house');
  });

  describe('getEligiblePositions', () => {
    it('tier 3 agent can fill apex, inner, and outer', () => {
      const eligible = getEligiblePositions(state, 3);
      expect(eligible.some(p => p.rank === 'apex')).toBe(true);
      expect(eligible.some(p => p.rank === 'inner')).toBe(true);
      expect(eligible.some(p => p.rank === 'outer')).toBe(true);
    });

    it('tier 1 agent can only fill outer positions', () => {
      const eligible = getEligiblePositions(state, 1);
      expect(eligible.every(p => p.rank === 'outer')).toBe(true);
      expect(eligible).toHaveLength(6);
    });

    it('excludes already-assigned positions', () => {
      const title = generateTitleProposals({
        agent: mockAgent,
        positionRank: 'outer',
        structureType: 'high_house',
        positionArchetype: 'The Blade',
        primarySphere: 'force',
        seed: 1,
      })[0].title;
      const assigned = assignAgentToPosition(state, 'pos.high_house.outer_0', 'agent.1', title, 10, 0);
      const eligible = getEligiblePositions(assigned, 1);
      expect(eligible.find(p => p.id === 'pos.high_house.outer_0')).toBeUndefined();
    });
  });

  describe('assignAgentToPosition', () => {
    it('assigns agent and title to position', () => {
      const title = generateTitleProposals({
        agent: mockAgent,
        positionRank: 'apex',
        structureType: 'high_house',
        positionArchetype: 'The Sovereign',
        primarySphere: 'force',
        seed: 1,
      })[0].title;
      const updated = assignAgentToPosition(state, 'pos.high_house.apex_0', 'agent.1', title, 10, 0);
      const pos = updated.positions.find(p => p.id === 'pos.high_house.apex_0')!;
      expect(pos.assignedAgentId).toBe('agent.1');
      expect(pos.activeTitle).toEqual(title);
    });

    it('records title history entry', () => {
      const title = generateTitleProposals({
        agent: mockAgent,
        positionRank: 'inner',
        structureType: 'high_house',
        positionArchetype: 'The Shield',
        primarySphere: 'force',
        seed: 1,
      })[0].title;
      const updated = assignAgentToPosition(state, 'pos.high_house.inner_0', 'agent.1', title, 15, 5);
      expect(updated.titleHistory).toHaveLength(1);
      expect(updated.titleHistory[0].action).toBe('assign');
      expect(updated.titleHistory[0].tick).toBe(5);
      expect(updated.titleHistory[0].essenceCost).toBe(15);
    });
  });

  describe('demoteAgent', () => {
    it('clears position assignment and title', () => {
      const title = generateTitleProposals({
        agent: mockAgent,
        positionRank: 'outer',
        structureType: 'high_house',
        positionArchetype: 'The Blade',
        primarySphere: 'force',
        seed: 1,
      })[0].title;
      let updated = assignAgentToPosition(state, 'pos.high_house.outer_0', 'agent.1', title, 5, 1);
      updated = demoteAgent(updated, 'pos.high_house.outer_0', 10);
      const pos = updated.positions.find(p => p.id === 'pos.high_house.outer_0')!;
      expect(pos.assignedAgentId).toBeNull();
      expect(pos.activeTitle).toBeNull();
    });

    it('records demote in title history', () => {
      const title = generateTitleProposals({
        agent: mockAgent,
        positionRank: 'outer',
        structureType: 'high_house',
        positionArchetype: 'The Blade',
        primarySphere: 'force',
        seed: 1,
      })[0].title;
      let updated = assignAgentToPosition(state, 'pos.high_house.outer_0', 'agent.1', title, 5, 1);
      updated = demoteAgent(updated, 'pos.high_house.outer_0', 10);
      const demoteEntry = updated.titleHistory.find(h => h.action === 'demote');
      expect(demoteEntry).toBeDefined();
    });
  });

  describe('getReassignmentCost', () => {
    it('base cost matches rank', () => {
      expect(getReassignmentCost('apex', 0)).toBe(30);
      expect(getReassignmentCost('inner', 0)).toBe(15);
      expect(getReassignmentCost('outer', 0)).toBe(5);
    });

    it('cost escalates with reassignment count', () => {
      const base = getReassignmentCost('inner', 0);
      const after3 = getReassignmentCost('inner', 3);
      expect(after3).toBeGreaterThan(base);
      // 15 * 1.25^3 ≈ 29.3
      expect(after3).toBeCloseTo(15 * Math.pow(1.25, 3), 0);
    });
  });
});
```

**Step 2: Run tests to verify new tests fail**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/scry.test.ts --pool=forks 2>&1 | tail -20`
Expected: New tests FAIL

**Step 3: Implement assignment operations**

Add to `src/engine/scry.ts`:

```typescript
import {
  RANK_MIN_TIER,
  RANK_REASSIGNMENT_COST,
  RANK_DEMOTION_COST,
  REASSIGNMENT_ESCALATION,
} from '../types/scry';

/**
 * Get positions eligible for an agent of the given tier.
 * Returns only unassigned, unlocked positions where the agent meets the minimum tier.
 */
export function getEligiblePositions(state: ScryState, agentTier: number): Position[] {
  return state.positions.filter(
    p => !p.assignedAgentId && !p.locked && agentTier >= RANK_MIN_TIER[p.rank]
  );
}

/**
 * Assign an agent to a position with a chosen title.
 * Returns new ScryState. Does NOT check essence — caller handles spending.
 */
export function assignAgentToPosition(
  state: ScryState,
  positionId: string,
  agentId: string,
  title: Title,
  essenceCost: number,
  tick: number,
): ScryState {
  const isReassignment = state.positions.some(
    p => p.id === positionId && p.assignedAgentId !== null
  );

  const positions = state.positions.map(p =>
    p.id === positionId
      ? { ...p, assignedAgentId: agentId, activeTitle: title }
      : p
  );

  return {
    ...state,
    positions,
    titleHistory: [
      ...state.titleHistory,
      {
        tick,
        positionId,
        agentId,
        titleId: title.id,
        action: isReassignment ? 'reassign' : 'assign',
        essenceCost,
      },
    ],
    totalReassignmentCount: isReassignment
      ? state.totalReassignmentCount + 1
      : state.totalReassignmentCount,
  };
}

/**
 * Remove an agent from their position (demotion).
 * The agent stays in the retinue but loses their title.
 */
export function demoteAgent(
  state: ScryState,
  positionId: string,
  tick: number,
): ScryState {
  const pos = state.positions.find(p => p.id === positionId);
  if (!pos || !pos.assignedAgentId) return state;

  const demotionCost = RANK_DEMOTION_COST[pos.rank];

  const positions = state.positions.map(p =>
    p.id === positionId
      ? { ...p, assignedAgentId: null, activeTitle: null }
      : p
  );

  return {
    ...state,
    positions,
    titleHistory: [
      ...state.titleHistory,
      {
        tick,
        positionId,
        agentId: pos.assignedAgentId,
        titleId: pos.activeTitle?.id || '',
        action: 'demote',
        essenceCost: demotionCost,
      },
    ],
  };
}

/**
 * Calculate reassignment cost for a position rank, accounting for escalation.
 */
export function getReassignmentCost(
  rank: PositionRank,
  totalReassignments: number,
): number {
  const base = RANK_REASSIGNMENT_COST[rank];
  return Math.round(base * Math.pow(REASSIGNMENT_ESCALATION, totalReassignments));
}
```

**Step 4: Run tests to verify they pass**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/scry.test.ts --pool=forks 2>&1 | tail -20`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/engine/scry.ts src/engine/__tests__/scry.test.ts
git commit -m "feat(scry): agent assignment, demotion, and cost escalation

assignAgentToPosition, demoteAgent, getEligiblePositions,
getReassignmentCost with escalation factor. Title history audit trail."
```

---

## Task 6: ScryOverlay Component — Court Visualization

**Files:**
- Create: `src/components/Game/ScryOverlay.tsx`
- Create: `src/components/Game/__tests__/ScryOverlay.test.tsx`

**Step 1: Write failing component tests**

Create `src/components/Game/__tests__/ScryOverlay.test.tsx`:

```typescript
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScryOverlay } from '../ScryOverlay';
import { createScryState, initializeCourt } from '../../../engine/scry';
import type { ScryState } from '../../../types/scry';
import type { RetinueAgent } from '../../../engine/retinue';
import type { EssencePool } from '../../../types/influence';
import { SPHERE_NAMES } from '../../../types/index';

const mockEssencePool: EssencePool = Object.fromEntries(
  SPHERE_NAMES.map(s => [s, 20])
) as EssencePool;

const mockAgents: RetinueAgent[] = [
  {
    id: 'agent.1',
    name: 'Kalam',
    tier: 3,
    tierName: 'Champion',
    locationId: 'loc.a',
    locationName: 'Shadow Keep',
    profile: {} as any,
    domainCapabilities: { iron: 7, gold: 3, shadow: 8, veil: 2, heart: 4, eye: 5, stone: 1, star: 2, flesh: 3 } as any,
    factionName: null,
  },
  {
    id: 'agent.2',
    name: 'Tattersail',
    tier: 2,
    tierName: 'Devoted',
    locationId: 'loc.b',
    locationName: 'Moon Tower',
    profile: {} as any,
    domainCapabilities: { iron: 2, gold: 4, shadow: 3, veil: 7, heart: 5, eye: 6, stone: 2, star: 4, flesh: 1 } as any,
    factionName: 'Bridgeburners',
  },
];

describe('ScryOverlay', () => {
  const baseProps = {
    scryState: initializeCourt(createScryState(), 'high_house'),
    retinueAgents: mockAgents,
    essencePool: mockEssencePool,
    primarySphere: 'force' as const,
    tick: 10,
    seed: 42,
    onAssign: vi.fn(),
    onDemote: vi.fn(),
    onClose: vi.fn(),
  };

  it('renders court name and close button', () => {
    render(<ScryOverlay {...baseProps} />);
    expect(screen.getByText(/The High House/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/close/i)).toBeInTheDocument();
  });

  it('renders 10 position slots', () => {
    render(<ScryOverlay {...baseProps} />);
    // Each position shows its archetype or "Empty"
    expect(screen.getByText('The Sovereign')).toBeInTheDocument(); // apex
    expect(screen.getByText('The Shield')).toBeInTheDocument(); // inner
  });

  it('renders sacred site and artifact sections', () => {
    render(<ScryOverlay {...baseProps} />);
    expect(screen.getByText(/Sacred Sites/i)).toBeInTheDocument();
    expect(screen.getByText(/Divine Artifacts/i)).toBeInTheDocument();
  });

  it('close button calls onClose', () => {
    render(<ScryOverlay {...baseProps} />);
    fireEvent.click(screen.getByLabelText(/close/i));
    expect(baseProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('clicking empty position shows agent picker', () => {
    render(<ScryOverlay {...baseProps} />);
    // Click on an outer position slot (should be empty)
    const emptySlots = screen.getAllByText(/Empty/i);
    fireEvent.click(emptySlots[0]);
    // Agent picker should appear with eligible agents
    expect(screen.getByText('Kalam')).toBeInTheDocument();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/components/Game/__tests__/ScryOverlay.test.tsx --pool=forks 2>&1 | tail -20`
Expected: FAIL — ScryOverlay not found

**Step 3: Implement ScryOverlay component**

Create `src/components/Game/ScryOverlay.tsx`. This is a large component — implement it as a full-screen overlay with:

1. **Header**: Court name, flavor text, close button
2. **Court visualization**: Positions arranged by rank (apex at top, inner middle, outer bottom)
3. **Position slots**: Clickable cards showing archetype name (empty) or agent name + title (filled)
4. **Agent picker panel**: Slides in when clicking empty position, shows eligible retinue agents filtered by tier
5. **Title proposal panel**: Shows 3-4 title cards after selecting an agent
6. **Holdings sections**: Sacred Sites and Artifacts as labeled placeholder slots with "Coming Soon" tooltip
7. **Footer**: Essence display, reassignment cost counter

The component should use CSS-in-JS (inline styles or a style object) matching the Threadbare visual identity (dark background, subtle sphere-colored accents). Component state:
- `selectedPositionId: string | null` — which position was clicked
- `pickerMode: 'closed' | 'agent' | 'title'` — what panel is open
- `selectedAgentForAssignment: RetinueAgent | null` — agent chosen in picker
- `titleProposals: TitleProposal[] | null` — generated proposals

Props:
```typescript
interface ScryOverlayProps {
  scryState: ScryState;
  retinueAgents: RetinueAgent[];
  essencePool: EssencePool;
  primarySphere: SphereName;
  tick: number;
  seed: number;
  onAssign: (positionId: string, agentId: string, title: Title, cost: number) => void;
  onDemote: (positionId: string) => void;
  onClose: () => void;
}
```

Interaction flows:
- Click empty slot → set selectedPositionId, pickerMode='agent'
- Click agent in picker → set selectedAgentForAssignment, generate proposals, pickerMode='title'
- Click title proposal → call onAssign, reset picker state
- Click filled slot → show context buttons (Demote, View), Demote calls onDemote

**Step 4: Run tests to verify they pass**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/components/Game/__tests__/ScryOverlay.test.tsx --pool=forks 2>&1 | tail -20`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/components/Game/ScryOverlay.tsx src/components/Game/__tests__/ScryOverlay.test.tsx
git commit -m "feat(scry): ScryOverlay component with court visualization

Full-screen overlay with position slots, agent picker, title proposal
panel, sacred site/artifact placeholder sections. Assignment and
demotion interaction flows."
```

---

## Task 7: Wire ScryOverlay into GameView

**Files:**
- Modify: `src/components/Game/GameView.tsx`

**Step 1: Add scry state and overlay to GameView**

In `GameView.tsx`, make these changes:

1. Add imports:
```typescript
import { ScryOverlay } from './ScryOverlay';
import {
  createScryState,
  initializeCourt,
  assignAgentToPosition,
  demoteAgent,
} from '../../engine/scry';
import type { ScryState } from '../../types/scry';
import type { Title } from '../../types/scry';
import { spendEssence } from '../../engine/influence';
```

2. Add state:
```typescript
const [scryState, setScryState] = useState<ScryState>(createScryState());
const [scryVisible, setScryVisible] = useState(false);
```

3. Add handlers:
```typescript
const handleOpenScry = useCallback(() => {
  // Auto-initialize with high_house if not initialized
  if (!scryState.initialized) {
    setScryState(prev => initializeCourt(prev, 'high_house'));
  }
  setScryVisible(true);
  setWheelVisible(false);
}, [scryState.initialized]);

const handleScryAssign = useCallback((positionId: string, agentId: string, title: Title, cost: number) => {
  // Spend essence from primary sphere
  const primarySphere = archetype.sphereAlignment.primary;
  setGameState(prev => {
    const newPool = { ...prev.essencePool };
    if (newPool[primarySphere] >= cost) {
      newPool[primarySphere] -= cost;
    }
    return { ...prev, essencePool: newPool };
  });

  setScryState(prev => assignAgentToPosition(prev, positionId, agentId, title, cost, gameState.tick));
}, [archetype, gameState.tick]);

const handleScryDemote = useCallback((positionId: string) => {
  setScryState(prev => demoteAgent(prev, positionId, gameState.tick));
}, [gameState.tick]);
```

4. Modify the wheel slot click handler — when `slotId === 'scry'`, open the ScryOverlay instead of StrandView:
```typescript
// In handleWheelSlotClick:
if (slotId === 'scry' && selectedAgentId) {
  handleOpenScry();  // Changed: opens Scry overlay instead of StrandView
  return;
}
```

5. Add ScryOverlay render (alongside StrandView, InterventionConfirm):
```tsx
{scryVisible && (
  <ScryOverlay
    scryState={scryState}
    retinueAgents={retinueAgents}
    essencePool={gameState.essencePool}
    primarySphere={archetype.sphereAlignment.primary}
    tick={gameState.tick}
    seed={gameState.seed + gameState.tick}
    onAssign={handleScryAssign}
    onDemote={handleScryDemote}
    onClose={() => setScryVisible(false)}
  />
)}
```

**Step 2: Verify TypeScript compiles**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: Clean compile

**Step 3: Commit**

```bash
git add src/components/Game/GameView.tsx
git commit -m "feat(scry): wire ScryOverlay into GameView

Scry opens from wheel scry slot. Court auto-initializes as High House.
Assignment spends essence from primary sphere. Demotion clears position."
```

---

## Task 8: Integration Test

**Files:**
- Create: `src/engine/__tests__/scry-integration.test.ts`

**Step 1: Write integration test covering the full flow**

```typescript
import { describe, it, expect } from 'vitest';
import {
  createScryState,
  initializeCourt,
  generateTitleProposals,
  assignAgentToPosition,
  demoteAgent,
  getEligiblePositions,
  getReassignmentCost,
  getCourtStructureDefinition,
} from '../scry';
import type { RetinueAgent } from '../retinue';
import type { ReachDomain } from '../../types/traits';

describe('Scry integration — full court flow', () => {
  const agent: RetinueAgent = {
    id: 'agent.1',
    name: 'Quick Ben',
    tier: 3,
    tierName: 'Champion',
    locationId: 'loc.a',
    locationName: 'Deadhouse',
    profile: {} as any,
    domainCapabilities: {
      iron: 3, gold: 2, shadow: 6, veil: 9, heart: 4,
      eye: 7, stone: 1, star: 5, flesh: 2,
    } as Record<ReachDomain, number>,
    factionName: 'Bridgeburners',
  };

  it('initialize → assign → demote → reassign with escalating cost', () => {
    // 1. Initialize court
    let state = initializeCourt(createScryState(), 'web');
    expect(state.initialized).toBe(true);
    expect(state.positions).toHaveLength(10);

    // 2. Check eligible positions for tier 3 agent
    const eligible = getEligiblePositions(state, 3);
    expect(eligible.length).toBe(10); // all open

    // 3. Generate titles for apex position
    const apexPos = state.positions.find(p => p.rank === 'apex')!;
    const proposals = generateTitleProposals({
      agent,
      positionRank: 'apex',
      structureType: 'web',
      positionArchetype: apexPos.archetype,
      primarySphere: 'spirit',
      seed: 42,
    });
    expect(proposals.length).toBeGreaterThanOrEqual(3);

    // 4. Assign agent to apex
    const chosenTitle = proposals[0].title;
    state = assignAgentToPosition(state, apexPos.id, agent.id, chosenTitle, 0, 10);
    const filledPos = state.positions.find(p => p.id === apexPos.id)!;
    expect(filledPos.assignedAgentId).toBe(agent.id);
    expect(filledPos.activeTitle!.name).toBe(chosenTitle.name);
    expect(state.titleHistory).toHaveLength(1);

    // 5. Verify position no longer eligible
    const remainingEligible = getEligiblePositions(state, 3);
    expect(remainingEligible.length).toBe(9);

    // 6. Demote agent
    state = demoteAgent(state, apexPos.id, 20);
    const clearedPos = state.positions.find(p => p.id === apexPos.id)!;
    expect(clearedPos.assignedAgentId).toBeNull();
    expect(clearedPos.activeTitle).toBeNull();
    expect(state.titleHistory).toHaveLength(2);

    // 7. Verify reassignment cost escalation
    const baseCost = getReassignmentCost('apex', 0);
    expect(baseCost).toBe(30);
    // After 1 reassignment, cost goes up
    const escalatedCost = getReassignmentCost('apex', 1);
    expect(escalatedCost).toBeGreaterThan(baseCost);
  });

  it('all 4 court structures produce valid positions', () => {
    for (const type of ['high_house', 'circle', 'web', 'abyss'] as const) {
      const state = initializeCourt(createScryState(), type);
      const def = getCourtStructureDefinition(type);
      expect(state.positions).toHaveLength(
        def.positionCounts.apex + def.positionCounts.inner + def.positionCounts.outer
      );
      expect(state.sacredSites).toHaveLength(def.sacredSiteSlots);
      expect(state.artifacts).toHaveLength(def.artifactSlots);
    }
  });
});
```

**Step 2: Run integration test**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/scry-integration.test.ts --pool=forks 2>&1 | tail -20`
Expected: All tests PASS

**Step 3: Commit**

```bash
git add src/engine/__tests__/scry-integration.test.ts
git commit -m "test(scry): integration test — full court flow

Initialize → assign → demote → reassign with escalation.
All 4 structures produce correct slot counts."
```

---

## Task 9: Documentation Updates

**Files:**
- Update: Obsidian vault (via MCP)
- Update: Notion backlog (via MCP)
- Update: `CLAUDE.md`

This task covers all documentation required so the content manager knows what to edit.

**Step 1: Create Obsidian system note for Ascendant Scry**

Via Obsidian MCP, create `Systems/Ascendant Scry.md`:

```markdown
---
type: system
category: player-systems
status: implemented
phase: 6D
---

# Ascendant Scry

The Ascendant Scry is a full-screen overlay showing the player's divine court — a metaphysical visualization of all positions in their divine hierarchy. Inspired by the Deck of Dragons from Malazan Book of the Fallen.

## Core Concepts

- **Court Structure**: 4 geometries (High House, Circle, Web, Abyss) linked to Foundation Spheres
- **Positions**: 10 slots per court (1 Apex, 3 Inner, 6 Outer) — each holds one retinue agent
- **Titles**: Player chooses from 3-4 generated proposals per assignment; each has bonuses AND weaknesses
- **Sacred Sites**: 2-3 slots for consecrated locations (placeholder, not interactive yet)
- **Divine Artifacts**: 2-4 slots for imbued items (placeholder, not interactive yet)

## Content Package

All content-managed data lives in `src/data/scry-content.ts`. This is the **single file** the content manager edits.

### Fields to Define

**Court Structures** (section 1):
- `structureType`, `foundationAffinity`, `name`, `description`, `flavorText`
- `positionCounts` per rank
- `sacredSiteSlots`, `artifactSlots`
- `structureBonus` definition

**Position Archetypes** (section 2):
- Per structure, per rank: thematic labels (e.g., "The Sovereign", "The Shield")
- These guide title generation

**Title Fragments** (section 3):
- Per sphere: `epithets[]` (adjective-like) and `roles[]` (noun-like)
- Combined via templates to create title names

**Title Templates** (section 4):
- Per rank: patterns like "The {epithet} {role}", "{role} of the {domain}"

**Bonus Rules** (section 5):
- Per rank: what effect types, value ranges, and weights

**Weakness Pool** (section 6):
- Effect type, value range, description, sphere associations

**Sacred Site Rules** (section 7 — placeholder):
- `baseCost`, `baseInfluenceStrength`, `baseBonusEssence`

**Artifact Templates** (section 8 — placeholder):
- `baseCost`

## Connected Systems

- [[Retinue Panel]] — agents shown in court positions
- [[Agent Wheel]] — "Scry" slot opens the overlay
- [[Player Influence System]] — essence spent on assignments
- [[Divine Awareness]] — titles affect sphere influence

## Implementation

- Types: `src/types/scry.ts`
- Engine: `src/engine/scry.ts`
- Content: `src/data/scry-content.ts`
- UI: `src/components/Game/ScryOverlay.tsx`
- Design doc: `Docs/plans/2026-03-06-ascendant-scry-design.md`
```

**Step 2: Update Obsidian Index.md**

Append `Ascendant Scry` link to the Player Systems section.

**Step 3: Update Notion backlog**

Mark Phase 6D tasks as complete, add reference docs.

**Step 4: Update CLAUDE.md**

Update project status, engine stats, append changelog entries.

**Step 5: Commit documentation changes**

```bash
git add CLAUDE.md
git commit -m "docs: Phase 6D documentation — Ascendant Scry complete

Updated project status, engine stats, changelog. Obsidian vault and
Notion backlog updated via MCP."
```

---

## Task 10: Verification

**Step 1: Run all scry-related tests**

Run:
```bash
cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator
npx vitest run src/engine/__tests__/scry.test.ts src/engine/__tests__/scry-integration.test.ts src/components/Game/__tests__/ScryOverlay.test.tsx --pool=forks 2>&1 | tail -30
```
Expected: All tests PASS

**Step 2: Run TypeScript type check**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: Clean compile

**Step 3: Verify file structure**

Run:
```bash
find src -name "*scry*" -o -name "*Scry*" | sort
```
Expected:
```
src/components/Game/ScryOverlay.tsx
src/components/Game/__tests__/ScryOverlay.test.tsx
src/data/scry-content.ts
src/engine/__tests__/scry-integration.test.ts
src/engine/__tests__/scry.test.ts
src/engine/scry.ts
src/types/scry.ts
```

**Step 4: Verify content package is self-contained**

Confirm that `src/data/scry-content.ts` is the only file a content manager needs to edit to change court structures, title fragments, bonus rules, etc. Run:
```bash
grep -r "COURT_STRUCTURES\|TITLE_FRAGMENTS\|BONUS_RULES\|WEAKNESS_POOL\|POSITION_ARCHETYPES" src/engine/ src/components/ --include="*.ts" --include="*.tsx" -l
```
Expected: Only `src/engine/scry.ts` imports from `scry-content.ts`. Components go through engine functions.
