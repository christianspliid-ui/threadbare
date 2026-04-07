# Three-Tier Attention Model — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the three-tier attention model (background / shaping / story beat) that classifies encounters by importance, manages player attention as a regenerating pool, introduces thread tugs, the curator, dormant threads, Read the Threads, and ambient hex map activity indicators.

**Architecture:** Tier-at-Source — each template carries `intrinsicTier`. At encounter initiation, `resolveEffectiveTier()` combines `intrinsicTier` with `courtPosition` to produce `effectiveTier` stored on the encounter record. All downstream systems (digest buffer, curator, pacing governor, thread tugs, notifications) branch on this stored tier. Attention capacity is a soft-capped ascendant stat with continuous regeneration.

**Tech Stack:** TypeScript, React, Three.js (HexMapV2), Vitest

**Spec:** `Docs/plans/2026-04-05-attention-tier-model-design.md`

---

## File Structure Overview

**New files to create:**

| File | Responsibility |
|------|---------------|
| `src/types/attention.ts` | AttentionTier, DigestEntry, ThreadTug, QueuedStoryBeat, AscendantAttentionState types |
| `src/data/attention-constants.ts` | All tunable constants for the attention system |
| `src/engine/attentionTier.ts` | `resolveEffectiveTier()`, `checkMidEncounterPromotion()`, `isNotableEntry()` |
| `src/engine/digestBuffer.ts` | `appendDigestEntry()`, `pruneDigestBuffer()`, `queryDigest()` |
| `src/engine/attentionPool.ts` | `regenAttention()`, `spendAttention()`, `getAttentionState()` |
| `src/engine/curator.ts` | `scoreCurationCandidates()`, `selectThreadTugs()` |
| `src/engine/pacingGovernor.ts` | `canFireStoryBeat()`, `enqueueStoryBeat()`, `tickPacingGovernor()` |
| `src/engine/phaseAttention.ts` | Orchestrator phase: regen + curator + tug generation + pacing |
| `tests/engine/attentionTier.test.ts` | Unit tests for tier resolution and promotion |
| `tests/engine/digestBuffer.test.ts` | Unit tests for digest buffer operations |
| `tests/engine/attentionPool.test.ts` | Unit tests for pool regen/spend |
| `tests/engine/curator.test.ts` | Unit tests for curation scoring |
| `tests/engine/pacingGovernor.test.ts` | Unit tests for story beat queue |

**Existing files to modify:**

| File | Changes |
|------|---------|
| `src/types/encounter.ts` | Add `intrinsicTier` to `EncounterTemplate`, `effectiveTier` to `EncounterProgress` |
| `src/types/unifiedAction.ts` | Add `intrinsicTier` to `UnifiedActionTemplate`, `effectiveTier` to `UnifiedAction` |
| `src/types/influence.ts` | Add `'dormant'` to `CourtPosition` |
| `src/types/gameState.ts` | Add `digestBuffer`, `activeThreadTugs`, `storyBeatQueue` fields |
| `src/data/encounter-content.ts` | Add `intrinsicTier` to all 115 templates |
| `src/data/faction-encounter-content.ts` | Add `intrinsicTier` to ~58 templates |
| `src/data/social-encounter-content.ts` | Add `intrinsicTier` to 14 templates |
| `src/data/monster-encounter-content.ts` | Add `intrinsicTier` to 17 templates |
| `src/data/army-encounter-content.ts` | Add `intrinsicTier` to 17 templates |
| `src/data/encounter-anomaly-content.ts` | Add `intrinsicTier` to ~25 templates |
| `src/data/borderland-encounter-content.ts` | Add `intrinsicTier` to 60 templates |
| `src/data/unified-action-templates.ts` | Add `intrinsicTier` to ~83 templates |
| `src/engine/orchestrator.ts` | Wire `phaseAttention`, pass `effectiveTier` context |
| `src/engine/phaseAgentDecision.ts` | Set `effectiveTier` at encounter creation |
| `src/engine/encounterVisibility.ts` | Branch on `effectiveTier` for notification routing |
| `src/engine/visibility.ts` | Handle `'dormant'` courtPosition (no LOS) |
| `src/components/CMS/tunableConstants.ts` | Register attention constant group |

---

## Phase 1: Types, Constants & Tier Resolution (Engine Foundation)

### Task 1: Core Attention Types

**Files:**
- Create: `src/types/attention.ts`
- Test: `tests/engine/attentionTier.test.ts`

- [ ] **Step 1: Create the attention types file**

```typescript
// src/types/attention.ts

import type { ReachDomain } from './index';
import type { EncounterType } from './encounter';
import type { CourtPosition } from './influence';

// ── Tier Classification ──────────────────────────────────────────

export type AttentionTier = 'background' | 'shaping' | 'story_beat';

// ── Digest Buffer ────────────────────────────────────────────────

export interface DigestEntry {
  agentId: string;
  agentName: string;
  encounterId: string;
  encounterName: string;
  encounterType: EncounterType;
  reachPrimary: ReachDomain;
  tick: number;
  success: boolean;
  significantOutcomes: string[];
  capabilityChanges: Record<string, number>;
  attachmentsGained: string[];
  attachmentsLost: string[];
  quintessenceDelta: number;
  isNotable: boolean;
  wasCuratedOut: boolean;
  isDormantAgent: boolean;
  sourceType: 'agent' | 'location';
}

// ── Thread Tugs ──────────────────────────────────────────────────

export interface ThreadTug {
  id: string;
  agentId: string;
  encounterId: string;
  actionId?: string;
  reachPrimary: ReachDomain;
  threatLevel: 'moderate' | 'hard' | 'deadly';
  courtPosition: CourtPosition;
  createdTick: number;
  expiresTick: number;
  attended: boolean;
  curationScore: number;
}

// ── Story Beat Queue ─────────────────────────────────────────────

export type StoryBeatPriority = 'doom_clock' | 'faction_war' | 'promoted' | 'template_intrinsic';

export interface QueuedStoryBeat {
  encounterId: string;
  actionId?: string;
  agentId: string;
  priority: StoryBeatPriority;
  queuedTick: number;
  hexCol: number;
  hexRow: number;
}

// ── Ascendant Attention State ────────────────────────────────────

export interface AscendantAttentionState {
  attentionPool: number;
  attentionCapacity: number;
  attentionRegen: number;
}

// ── Attention Overload Visual State ──────────────────────────────

export type AttentionVisualState = 'focused' | 'busy' | 'strained' | 'overwhelmed';

// ── Encounter Promotion Trace ────────────────────────────────────

export interface EncounterPromotionTrace {
  type: 'encounter_promotion';
  encounterId: string;
  actionId?: string;
  agentId: string;
  previousTier: AttentionTier;
  newTier: AttentionTier;
  trigger: string;
  tick: number;
}

export interface CuratorDecisionTrace {
  type: 'curator_decision';
  tick: number;
  candidateCount: number;
  selectedCount: number;
  demotedCount: number;
  topScore: number;
  bottomScore: number;
}

export interface AttentionPoolTrace {
  type: 'attention_pool';
  tick: number;
  previousPool: number;
  regenAmount: number;
  spendAmount: number;
  newPool: number;
  capacity: number;
  visualState: AttentionVisualState;
}

export interface StoryBeatQueueTrace {
  type: 'story_beat_queue';
  tick: number;
  action: 'enqueue' | 'fire' | 'demote' | 'cooldown_block';
  encounterId: string;
  queueDepth: number;
  priority: StoryBeatPriority;
}
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: Clean (no errors referencing attention.ts)

- [ ] **Step 3: Commit**

```bash
git add src/types/attention.ts
git commit -m "feat(attention): add core attention tier type definitions"
```

---

### Task 2: Attention Constants

**Files:**
- Create: `src/data/attention-constants.ts`
- Modify: `src/components/CMS/tunableConstants.ts`

- [ ] **Step 1: Create attention-constants.ts with all named constants from spec Section 8**

```typescript
// src/data/attention-constants.ts
// All tunable constants for the three-tier attention model.
// Registered in CMS tunableConstants.ts for live tweaking.

// ── Time Base ────────────────────────────────────────────────────
export const TICKS_PER_DAY = 12;

// ── Attention Pool ───────────────────────────────────────────────
export const ATTENTION_BASE_CAPACITY = 6;
export const ATTENTION_BASE_REGEN = 0.4;
export const ATTENTION_POOL_FOCUSED_THRESHOLD = 0.6;
export const ATTENTION_POOL_BUSY_THRESHOLD = 0.3;
export const ATTENTION_POOL_STRAINED_THRESHOLD = 0.1;

// ── Attention Costs ──────────────────────────────────────────────
export const ATTEND_COST_MODERATE = 1.0;
export const ATTEND_COST_HARD = 1.5;
export const ATTEND_COST_STORY_BEAT = 2.0;
export const ATTEND_COST_STORY_PHASE = 0.5;
export const ATTEND_COST_NOTABLE = 0.5;
export const COURT_COST_MULTIPLIER_FIRST = 0.5;
export const COURT_COST_MULTIPLIER_RETINUE = 1.0;
export const COURT_COST_MULTIPLIER_WATCHED = 1.5;

// ── Thread Tugs ──────────────────────────────────────────────────
export const THREAD_TUG_LINGER = 3;
export const ATTEND_COOLDOWN = 1;
export const MAX_CONCURRENT_TUGS = 3;
export const FOMO_OVERFLOW_RATIO = 1.4;

// ── Story Beat Pacing ────────────────────────────────────────────
export const STORY_BEAT_COOLDOWN = 12;
export const STORY_BEAT_QUEUE_MAX = 3;
export const STORY_BEAT_QUEUE_OVERFLOW_DEMOTE = true;

// ── Read the Threads ─────────────────────────────────────────────
export const READ_THREADS_COOLDOWN = 6;
export const READ_THREADS_COST_6 = 2;
export const READ_THREADS_COST_12 = 4;
export const READ_THREADS_COST_24 = 8;
export const READ_THREADS_COST_36 = 12;
export const DIGEST_BUFFER_RETENTION = 48;

// ── Dormant Threads ──────────────────────────────────────────────
export const DORMANT_ESSENCE_MULTIPLIER = 0.5;
export const DORMANT_ACTIVATION_COST = 2;
export const DORMANT_REACTIVATION_COST = 4;
export const DORMANT_REACTIVATION_COOLDOWN = 3;

// ── Notable Thresholds ───────────────────────────────────────────
export const NOTABLE_QUINTESSENCE_LOSS = 0.3;
export const NOTABLE_REPUTATION_DELTA = 0.3;
export const NOTABLE_ATTACHMENT_LOSS = true;
export const NOTABLE_TIER_PROMOTION = true;
export const NOTABLE_CHAIN_COMPLETION = true;

// ── Ambient Activity Icons ───────────────────────────────────────
export const ACTIVITY_ICON_SIZE = 7;
export const ACTIVITY_ICON_OPACITY_BACKGROUND = 0.4;
export const ACTIVITY_ICON_OPACITY_SHAPING = 0.6;
export const ACTIVITY_ICON_OPACITY_STORY = 0.8;
export const ACTIVITY_ICON_PULSE_PERIOD = 1.75;
export const ACTIVITY_ICON_ZOOM_HIDE_THRESHOLD = 15;
```

- [ ] **Step 2: Register in CMS tunableConstants.ts**

Add a new group entry to the `TUNABLE_GROUPS` array in `src/components/CMS/tunableConstants.ts`, following the existing pattern with the `n()` and `b()` helpers. Import from `attention-constants.ts`. Group id: `'attention-tiers'`, label: `'Attention & Notification Tiers'`.

Register all numeric constants with `n()` and boolean constants with `b()`, matching the existing pattern (description, sourceFile, range, usedBy).

- [ ] **Step 3: Verify compile**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/data/attention-constants.ts src/components/CMS/tunableConstants.ts
git commit -m "feat(attention): add tunable constants and CMS registration"
```

---

### Task 3: Tier Resolution Function

**Files:**
- Create: `src/engine/attentionTier.ts`
- Create: `tests/engine/attentionTier.test.ts`

- [ ] **Step 1: Write failing tests for resolveEffectiveTier**

```typescript
// tests/engine/attentionTier.test.ts
import { describe, it, expect } from 'vitest';
import { resolveEffectiveTier } from '../../src/engine/attentionTier';
import type { AttentionTier } from '../../src/types/attention';
import type { CourtPosition } from '../../src/types/influence';

describe('resolveEffectiveTier', () => {
  // No thread or dormant = always invisible
  it('returns invisible when courtPosition is null', () => {
    expect(resolveEffectiveTier('shaping', null)).toBe('invisible');
  });
  it('returns invisible when courtPosition is dormant', () => {
    expect(resolveEffectiveTier('shaping', 'dormant')).toBe('invisible');
  });

  // Watched demotes by one tier
  it('watched + background = background', () => {
    expect(resolveEffectiveTier('background', 'watched')).toBe('background');
  });
  it('watched + shaping = background (demoted)', () => {
    expect(resolveEffectiveTier('shaping', 'watched')).toBe('background');
  });
  it('watched + story_beat = shaping (demoted)', () => {
    expect(resolveEffectiveTier('story_beat', 'watched')).toBe('shaping');
  });

  // Retinue preserves intrinsic
  it('retinue + background = background', () => {
    expect(resolveEffectiveTier('background', 'retinue')).toBe('background');
  });
  it('retinue + shaping = shaping', () => {
    expect(resolveEffectiveTier('shaping', 'retinue')).toBe('shaping');
  });
  it('retinue + story_beat = story_beat', () => {
    expect(resolveEffectiveTier('story_beat', 'retinue')).toBe('story_beat');
  });

  // The First promotes background to shaping
  it('the_first + background = shaping (promoted)', () => {
    expect(resolveEffectiveTier('background', 'the_first')).toBe('shaping');
  });
  it('the_first + shaping = shaping', () => {
    expect(resolveEffectiveTier('shaping', 'the_first')).toBe('shaping');
  });
  it('the_first + story_beat = story_beat', () => {
    expect(resolveEffectiveTier('story_beat', 'the_first')).toBe('story_beat');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/engine/attentionTier.test.ts`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement resolveEffectiveTier**

```typescript
// src/engine/attentionTier.ts

import type { AttentionTier } from '../types/attention';
import type { CourtPosition } from '../types/influence';

/**
 * Effective tier matrix — combines template intrinsic tier with agent court position.
 * Computed once at encounter initiation, stored on the encounter record.
 * See spec Section 2 for the full matrix rationale.
 */
const TIER_MATRIX: Record<
  Exclude<CourtPosition, 'dormant'>,
  Record<AttentionTier, AttentionTier>
> = {
  watched:   { background: 'background', shaping: 'background', story_beat: 'shaping' },
  retinue:   { background: 'background', shaping: 'shaping',    story_beat: 'story_beat' },
  the_first: { background: 'shaping',    shaping: 'shaping',    story_beat: 'story_beat' },
};

/**
 * Resolve the effective attention tier for an encounter.
 *
 * @param intrinsicTier  Template's authored tier
 * @param courtPosition  Agent's position in the divine court (null = no thread)
 * @returns  Effective tier or 'invisible' if no active thread
 */
export function resolveEffectiveTier(
  intrinsicTier: AttentionTier,
  courtPosition: CourtPosition | null,
): AttentionTier | 'invisible' {
  if (!courtPosition || courtPosition === 'dormant') return 'invisible';
  return TIER_MATRIX[courtPosition]?.[intrinsicTier] ?? 'background';
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/engine/attentionTier.test.ts`
Expected: All 9 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/attentionTier.ts tests/engine/attentionTier.test.ts
git commit -m "feat(attention): implement resolveEffectiveTier with full matrix"
```

---

### Task 4: Mid-Encounter Promotion & Notable Detection

**Files:**
- Modify: `src/engine/attentionTier.ts`
- Modify: `tests/engine/attentionTier.test.ts`

- [ ] **Step 1: Write failing tests for checkMidEncounterPromotion and isNotableEntry**

Add to `tests/engine/attentionTier.test.ts`:

```typescript
import { checkMidEncounterPromotion, isNotableEntry } from '../../src/engine/attentionTier';

describe('checkMidEncounterPromotion', () => {
  it('promotes background to shaping on wound', () => {
    const result = checkMidEncounterPromotion('background', { wound: true });
    expect(result).toBe('shaping');
  });
  it('promotes background to shaping on discovery', () => {
    const result = checkMidEncounterPromotion('background', { discovery: true });
    expect(result).toBe('shaping');
  });
  it('promotes shaping to story_beat on chain culmination', () => {
    const result = checkMidEncounterPromotion('shaping', { chainCulmination: true });
    expect(result).toBe('story_beat');
  });
  it('never promotes story_beat further', () => {
    const result = checkMidEncounterPromotion('story_beat', { wound: true, chainCulmination: true });
    expect(result).toBe('story_beat');
  });
  it('returns null when no trigger fires', () => {
    const result = checkMidEncounterPromotion('background', {});
    expect(result).toBeNull();
  });
});

describe('isNotableEntry', () => {
  it('flags significant quintessence loss', () => {
    expect(isNotableEntry({ quintessenceDelta: -0.4 })).toBe(true);
  });
  it('flags attachment loss', () => {
    expect(isNotableEntry({ attachmentsLost: ['sword'] })).toBe(true);
  });
  it('does not flag trivial entry', () => {
    expect(isNotableEntry({ quintessenceDelta: -0.1, attachmentsLost: [] })).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `npx vitest run tests/engine/attentionTier.test.ts`

- [ ] **Step 3: Implement checkMidEncounterPromotion and isNotableEntry**

Add to `src/engine/attentionTier.ts`:

```typescript
import {
  NOTABLE_QUINTESSENCE_LOSS,
  NOTABLE_REPUTATION_DELTA,
  NOTABLE_ATTACHMENT_LOSS,
  NOTABLE_TIER_PROMOTION,
  NOTABLE_CHAIN_COMPLETION,
} from '../data/attention-constants';

// ── Promotion Triggers ───────────────────────────────────────────

/** Inputs for mid-encounter promotion check. All optional — omit what didn't happen. */
export interface PromotionTriggers {
  wound?: boolean;
  discovery?: boolean;
  chainAdvance?: boolean;
  tierPromotion?: boolean;
  chainCulmination?: boolean;
  multiAgentConvergence?: boolean;
  doomThreshold?: boolean;
  battleEscalation?: boolean;
}

const BACKGROUND_TO_SHAPING: (keyof PromotionTriggers)[] = [
  'wound', 'discovery', 'chainAdvance', 'tierPromotion',
];

const SHAPING_TO_STORY_BEAT: (keyof PromotionTriggers)[] = [
  'chainCulmination', 'multiAgentConvergence', 'doomThreshold', 'battleEscalation',
];

/**
 * Check if an encounter should be promoted mid-flight.
 * Returns the new tier, or null if no promotion triggered.
 * Promotions only go up: background->shaping, shaping->story_beat.
 */
export function checkMidEncounterPromotion(
  currentTier: AttentionTier,
  triggers: PromotionTriggers,
): AttentionTier | null {
  if (currentTier === 'story_beat') return null; // ceiling

  if (currentTier === 'shaping') {
    for (const key of SHAPING_TO_STORY_BEAT) {
      if (triggers[key]) return 'story_beat';
    }
    return null;
  }

  // currentTier === 'background'
  // Check story_beat triggers first (skip shaping)
  for (const key of SHAPING_TO_STORY_BEAT) {
    if (triggers[key]) return 'story_beat';
  }
  for (const key of BACKGROUND_TO_SHAPING) {
    if (triggers[key]) return 'shaping';
  }
  return null;
}

// ── Notable Detection ────────────────────────────────────────────

/** Partial digest data for notable detection. */
export interface NotableCheckInput {
  quintessenceDelta?: number;
  reputationDelta?: number;
  attachmentsLost?: string[];
  tierPromoted?: boolean;
  chainCompleted?: boolean;
  hasWound?: boolean;
}

/**
 * Determine if a digest entry should be flagged as notable.
 */
export function isNotableEntry(input: NotableCheckInput): boolean {
  if (input.quintessenceDelta !== undefined && input.quintessenceDelta < -NOTABLE_QUINTESSENCE_LOSS) return true;
  if (input.reputationDelta !== undefined && Math.abs(input.reputationDelta) > NOTABLE_REPUTATION_DELTA) return true;
  if (NOTABLE_ATTACHMENT_LOSS && input.attachmentsLost && input.attachmentsLost.length > 0) return true;
  if (NOTABLE_TIER_PROMOTION && input.tierPromoted) return true;
  if (NOTABLE_CHAIN_COMPLETION && input.chainCompleted) return true;
  if (input.hasWound) return true;
  return false;
}
```

- [ ] **Step 4: Run tests — expect PASS**

Run: `npx vitest run tests/engine/attentionTier.test.ts`

- [ ] **Step 5: Commit**

```bash
git add src/engine/attentionTier.ts tests/engine/attentionTier.test.ts
git commit -m "feat(attention): add mid-encounter promotion and notable detection"
```

---

### Task 5: Add intrinsicTier to Template Type Definitions

**Files:**
- Modify: `src/types/encounter.ts` (EncounterTemplate interface, ~line 125)
- Modify: `src/types/unifiedAction.ts` (UnifiedActionTemplate interface, ~line 283)

- [ ] **Step 1: Add intrinsicTier to EncounterTemplate**

In `src/types/encounter.ts`, add after the `threatRating` field (line 143):

```typescript
  /** Attention tier classification — controls how this encounter surfaces to the player.
   *  'background' = silent ambient, 'shaping' = optional engagement, 'story_beat' = mandatory modal.
   *  Effective tier computed at runtime via resolveEffectiveTier(). */
  intrinsicTier: import('../types/attention').AttentionTier;
```

Note: Use the import type inline to avoid circular deps, or add `AttentionTier` to the imports at the top of the file.

- [ ] **Step 2: Add intrinsicTier to UnifiedActionTemplate**

In `src/types/unifiedAction.ts`, add after the `rarityTier` field (line 287):

```typescript
  /** Attention tier classification — controls how this action surfaces to the player. */
  readonly intrinsicTier: import('../types/attention').AttentionTier;
```

- [ ] **Step 3: Run tsc — expect type errors in template data files (missing intrinsicTier)**

Run: `npx tsc --noEmit 2>&1 | head -30`
Expected: Errors in encounter content files. This confirms the field is required and content files need updating (Task 8).

- [ ] **Step 4: Commit type changes only**

```bash
git add src/types/encounter.ts src/types/unifiedAction.ts
git commit -m "feat(attention): add intrinsicTier field to template type definitions"
```

---

### Task 6: Add effectiveTier to Runtime Types

**Files:**
- Modify: `src/types/encounter.ts` (EncounterProgress, ~line 264)
- Modify: `src/types/unifiedAction.ts` (UnifiedAction, ~line 489)

- [ ] **Step 1: Add effectiveTier to EncounterProgress**

In `src/types/encounter.ts`, add to the `EncounterProgress` interface (after `occupiedUntilTick`):

```typescript
  /** Effective attention tier — computed at initiation, may be promoted mid-encounter.
   *  Determines notification routing: invisible | background | shaping | story_beat. */
  effectiveTier?: import('../types/attention').AttentionTier | 'invisible';
```

Optional (`?`) for backward compatibility with existing EncounterProgress records in tests.

- [ ] **Step 2: Add effectiveTier to UnifiedAction**

In `src/types/unifiedAction.ts`, add to the `UnifiedAction` interface (after `disregardRemaining`):

```typescript
  /** Effective attention tier — computed at action creation, may be promoted mid-encounter. */
  readonly effectiveTier?: import('../types/attention').AttentionTier | 'invisible';
```

- [ ] **Step 3: Verify compile**

Run: `npx tsc --noEmit 2>&1 | head -10`
Expected: Only errors from Task 5 (missing intrinsicTier on content), no new errors.

- [ ] **Step 4: Commit**

```bash
git add src/types/encounter.ts src/types/unifiedAction.ts
git commit -m "feat(attention): add effectiveTier to encounter/action runtime types"
```

---

### Task 7: Extend CourtPosition with 'dormant'

**Files:**
- Modify: `src/types/influence.ts` (line 39)

- [ ] **Step 1: Add dormant to CourtPosition union**

In `src/types/influence.ts`, change line 39:

```typescript
// Before:
export type CourtPosition = 'the_first' | 'retinue' | 'watched';

// After:
export type CourtPosition = 'the_first' | 'retinue' | 'watched' | 'dormant';
```

- [ ] **Step 2: Run tsc to find any exhaustiveness checks that need updating**

Run: `npx tsc --noEmit 2>&1 | grep -i dormant`

Check for switch/case exhaustiveness errors. If any appear in `encounterVisibility.ts` or `visibility.ts`, they will be addressed in later tasks. For now, note them.

- [ ] **Step 3: Commit**

```bash
git add src/types/influence.ts
git commit -m "feat(attention): add 'dormant' to CourtPosition type"
```

---

### Task 8: Add New GameState Fields

**Files:**
- Modify: `src/types/gameState.ts`

- [ ] **Step 1: Add attention-related fields to GameState interface**

Add imports at the top of `src/types/gameState.ts`:

```typescript
import type { DigestEntry, ThreadTug, QueuedStoryBeat } from './attention';
```

Add fields to the `GameState` interface (after `encounterNotifications`):

```typescript
  // Attention tier system — digest, tugs, story beat queue
  /** Silently accumulated encounter outcomes for Read the Threads. Append-only, pruned on read. */
  digestBuffer?: DigestEntry[];
  /** Active thread tugs awaiting player attention. Managed by phaseAttention. */
  activeThreadTugs?: ThreadTug[];
  /** Queued story beats awaiting pacing governor clearance. Max depth: STORY_BEAT_QUEUE_MAX. */
  storyBeatQueue?: QueuedStoryBeat[];
```

Note: Attention pool state lives on the ascendant graph node properties, not as a GameState field. This follows the design spec (Section 3) and existing pattern for per-entity state.

- [ ] **Step 2: Verify compile**

Run: `npx tsc --noEmit 2>&1 | head -10`

- [ ] **Step 3: Commit**

```bash
git add src/types/gameState.ts
git commit -m "feat(attention): add digestBuffer, activeThreadTugs, storyBeatQueue to GameState"
```

---

## Phase 2: Template Classification (Bulk + Hand-Adjust)

### Task 9: Classify Encounter Templates (Bulk by ThreatRating)

**Files:**
- Modify: All encounter content files in `src/data/`

**Classification rule (from spec Section 9):**
- `threatRating: 'trivial' | 'easy'` → `intrinsicTier: 'background'`
- `threatRating: 'moderate' | 'hard'` → `intrinsicTier: 'shaping'`
- `threatRating: 'deadly'` → `intrinsicTier: 'story_beat'`

- [ ] **Step 1: Add intrinsicTier to each encounter template object**

For each encounter content file, add the `intrinsicTier` field to every template literal. The value is derived mechanically from the template's existing `threatRating`. Example for a template with `threatRating: 'moderate'`:

```typescript
{
  id: 'encounter.explore.ancient_tomb',
  name: 'Ancient Tomb Exploration',
  threatRating: 'moderate',
  intrinsicTier: 'shaping',    // <-- add this line
  // ... rest of template
}
```

Files to process and their mapping rules:

| File | Rule |
|------|------|
| `encounter-content.ts` (115 templates) | threatRating map |
| `faction-encounter-content.ts` (~58) | questType: standard→background, senior→shaping, elite→story_beat |
| `social-encounter-content.ts` (14) | Default `'shaping'` (social interactions are inherently interesting) |
| `monster-encounter-content.ts` (17) | threatRating map, bias toward shaping |
| `army-encounter-content.ts` (17) | threatRating map, bias toward story_beat |
| `encounter-anomaly-content.ts` (~25) | Default `'shaping'` (anomalies are discoveries) |
| `borderland-encounter-content.ts` (60) | threatRating map |
| `siege-encounter-content.ts` | threatRating map, bias toward story_beat |
| All other faction-specific content files (mercenary, thieves-guild, etc.) | Follow parent faction mapping |

- [ ] **Step 2: Hand-adjustment pass (per spec Section 9 Phase 3)**

Override the bulk classification for these cases:
- Chain-culminating encounters (final step of multi-stage): promote to `'shaping'` minimum
- Discovery encounters (hidden sites, anomalies, Elder sites): promote to `'shaping'`
- Encounters with `questPriority > 1.0`: promote to `'shaping'` minimum
- CRUD-type unified actions (single-step create/read/update/delete): force to `'background'`

- [ ] **Step 3: Verify compile clean**

Run: `npx tsc --noEmit`
Expected: Clean — all templates now have `intrinsicTier`

- [ ] **Step 4: Run all existing tests**

Run: `npm test`
Expected: All pass (intrinsicTier is additive, no existing behavior changed)

- [ ] **Step 5: Commit**

```bash
git add src/data/
git commit -m "feat(attention): classify all encounter templates with intrinsicTier"
```

---

### Task 10: Classify Unified Action Templates

**Files:**
- Modify: `src/data/unified-action-templates.ts` and related template source files

**Classification rule (from spec Section 9):**
- `rarityTier: 1` (Mundane) → `intrinsicTier: 'background'`
- `rarityTier: 2` (Uncommon) → `intrinsicTier: 'shaping'`
- `rarityTier: 3` (Rare) → `intrinsicTier: 'story_beat'`
- `rarityTier: 4` (Epic) → `intrinsicTier: 'story_beat'`

- [ ] **Step 1: Add intrinsicTier to each unified action template**

Follow the same pattern as Task 9. Derive from `rarityTier`. Override CRUD-type single-step actions to `'background'` regardless of rarity.

- [ ] **Step 2: Verify compile clean**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Run all tests**

Run: `npm test`

- [ ] **Step 4: Commit**

```bash
git add src/data/
git commit -m "feat(attention): classify all unified action templates with intrinsicTier"
```

---

## Phase 3: Core Engine Wiring

### Task 11: Digest Buffer Module

**Files:**
- Create: `src/engine/digestBuffer.ts`
- Create: `tests/engine/digestBuffer.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/engine/digestBuffer.test.ts
import { describe, it, expect } from 'vitest';
import { appendDigestEntry, pruneDigestBuffer, queryDigest } from '../../src/engine/digestBuffer';
import type { DigestEntry } from '../../src/types/attention';

const makeEntry = (tick: number, agentId = 'a1', overrides?: Partial<DigestEntry>): DigestEntry => ({
  agentId,
  agentName: 'Test Agent',
  encounterId: 'enc1',
  encounterName: 'Test Encounter',
  encounterType: 'explore',
  reachPrimary: 'iron',
  tick,
  success: true,
  significantOutcomes: [],
  capabilityChanges: {},
  attachmentsGained: [],
  attachmentsLost: [],
  quintessenceDelta: 0,
  isNotable: false,
  wasCuratedOut: false,
  isDormantAgent: false,
  sourceType: 'agent',
  ...overrides,
});

describe('appendDigestEntry', () => {
  it('appends entry to buffer', () => {
    const buffer: DigestEntry[] = [];
    appendDigestEntry(buffer, makeEntry(10));
    expect(buffer).toHaveLength(1);
    expect(buffer[0].tick).toBe(10);
  });
});

describe('pruneDigestBuffer', () => {
  it('removes entries older than retention window', () => {
    const buffer = [makeEntry(5), makeEntry(40), makeEntry(50)];
    const result = pruneDigestBuffer(buffer, 52, 48);
    expect(result).toHaveLength(2);
    expect(result[0].tick).toBe(40);
  });
});

describe('queryDigest', () => {
  it('filters by agent and lookback window', () => {
    const buffer = [
      makeEntry(10, 'a1'),
      makeEntry(20, 'a2'),
      makeEntry(30, 'a1'),
    ];
    const result = queryDigest(buffer, { agentId: 'a1', fromTick: 15, toTick: 35 });
    expect(result).toHaveLength(1);
    expect(result[0].tick).toBe(30);
  });

  it('returns all agents when agentId omitted', () => {
    const buffer = [makeEntry(10, 'a1'), makeEntry(20, 'a2')];
    const result = queryDigest(buffer, { fromTick: 0, toTick: 25 });
    expect(result).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run tests — FAIL**

Run: `npx vitest run tests/engine/digestBuffer.test.ts`

- [ ] **Step 3: Implement digestBuffer.ts**

```typescript
// src/engine/digestBuffer.ts

import type { DigestEntry } from '../types/attention';
import { DIGEST_BUFFER_RETENTION } from '../data/attention-constants';

/** Append a new digest entry (mutates buffer in place). */
export function appendDigestEntry(buffer: DigestEntry[], entry: DigestEntry): void {
  buffer.push(entry);
}

/** Prune entries older than retention window. Returns new array. */
export function pruneDigestBuffer(
  buffer: DigestEntry[],
  currentTick: number,
  retention: number = DIGEST_BUFFER_RETENTION,
): DigestEntry[] {
  const cutoff = currentTick - retention;
  return buffer.filter(e => e.tick >= cutoff);
}

/** Query digest buffer with optional filters. */
export interface DigestQuery {
  agentId?: string;
  fromTick: number;
  toTick: number;
  notableOnly?: boolean;
  sourceType?: 'agent' | 'location';
}

export function queryDigest(buffer: DigestEntry[], query: DigestQuery): DigestEntry[] {
  return buffer.filter(e => {
    if (e.tick < query.fromTick || e.tick > query.toTick) return false;
    if (query.agentId && e.agentId !== query.agentId) return false;
    if (query.notableOnly && !e.isNotable) return false;
    if (query.sourceType && e.sourceType !== query.sourceType) return false;
    return true;
  });
}
```

- [ ] **Step 4: Run tests — PASS**

Run: `npx vitest run tests/engine/digestBuffer.test.ts`

- [ ] **Step 5: Commit**

```bash
git add src/engine/digestBuffer.ts tests/engine/digestBuffer.test.ts
git commit -m "feat(attention): implement digest buffer with append, prune, query"
```

---

### Task 12: Attention Pool Module

**Files:**
- Create: `src/engine/attentionPool.ts`
- Create: `tests/engine/attentionPool.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/engine/attentionPool.test.ts
import { describe, it, expect } from 'vitest';
import {
  regenAttention,
  spendAttention,
  getAttentionVisualState,
  computeAttendCost,
} from '../../src/engine/attentionPool';
import type { AscendantAttentionState } from '../../src/types/attention';

const makePool = (pool: number, capacity = 6, regen = 0.4): AscendantAttentionState => ({
  attentionPool: pool,
  attentionCapacity: capacity,
  attentionRegen: regen,
});

describe('regenAttention', () => {
  it('adds regen amount capped at capacity', () => {
    const result = regenAttention(makePool(5.8));
    expect(result.attentionPool).toBe(6); // 5.8 + 0.4 = 6.2, capped at 6
  });
  it('regens normally when below cap', () => {
    const result = regenAttention(makePool(3.0));
    expect(result.attentionPool).toBeCloseTo(3.4);
  });
});

describe('spendAttention', () => {
  it('deducts cost from pool', () => {
    const result = spendAttention(makePool(5.0), 1.5);
    expect(result.attentionPool).toBeCloseTo(3.5);
  });
  it('does not go below zero', () => {
    const result = spendAttention(makePool(0.5), 2.0);
    expect(result.attentionPool).toBe(0);
  });
});

describe('getAttentionVisualState', () => {
  it('returns focused above 60%', () => {
    expect(getAttentionVisualState(makePool(4.0))).toBe('focused');
  });
  it('returns busy at 30-60%', () => {
    expect(getAttentionVisualState(makePool(2.5))).toBe('busy');
  });
  it('returns strained at 10-30%', () => {
    expect(getAttentionVisualState(makePool(1.0))).toBe('strained');
  });
  it('returns overwhelmed below 10%', () => {
    expect(getAttentionVisualState(makePool(0.3))).toBe('overwhelmed');
  });
});

describe('computeAttendCost', () => {
  it('applies court position multiplier', () => {
    // moderate threat, the_first: 1.0 * 0.5 = 0.5
    expect(computeAttendCost('moderate', 'the_first')).toBeCloseTo(0.5);
  });
  it('applies watched multiplier', () => {
    // hard threat, watched: 1.5 * 1.5 = 2.25
    expect(computeAttendCost('hard', 'watched')).toBeCloseTo(2.25);
  });
});
```

- [ ] **Step 2: Run tests — FAIL**

- [ ] **Step 3: Implement attentionPool.ts**

```typescript
// src/engine/attentionPool.ts

import type { AscendantAttentionState, AttentionVisualState } from '../types/attention';
import type { CourtPosition } from '../types/influence';
import {
  ATTENTION_POOL_FOCUSED_THRESHOLD,
  ATTENTION_POOL_BUSY_THRESHOLD,
  ATTENTION_POOL_STRAINED_THRESHOLD,
  ATTEND_COST_MODERATE,
  ATTEND_COST_HARD,
  ATTEND_COST_STORY_BEAT,
  COURT_COST_MULTIPLIER_FIRST,
  COURT_COST_MULTIPLIER_RETINUE,
  COURT_COST_MULTIPLIER_WATCHED,
} from '../data/attention-constants';

/** Regenerate attention pool by regen amount, capped at capacity. Returns new state. */
export function regenAttention(state: AscendantAttentionState): AscendantAttentionState {
  return {
    ...state,
    attentionPool: Math.min(state.attentionPool + state.attentionRegen, state.attentionCapacity),
  };
}

/** Spend from attention pool. Clamps at 0. Returns new state. */
export function spendAttention(state: AscendantAttentionState, cost: number): AscendantAttentionState {
  return {
    ...state,
    attentionPool: Math.max(0, state.attentionPool - cost),
  };
}

/** Determine the visual state of the attention network. */
export function getAttentionVisualState(state: AscendantAttentionState): AttentionVisualState {
  const ratio = state.attentionPool / state.attentionCapacity;
  if (ratio > ATTENTION_POOL_FOCUSED_THRESHOLD) return 'focused';
  if (ratio > ATTENTION_POOL_BUSY_THRESHOLD) return 'busy';
  if (ratio > ATTENTION_POOL_STRAINED_THRESHOLD) return 'strained';
  return 'overwhelmed';
}

const COURT_MULTIPLIERS: Record<Exclude<CourtPosition, 'dormant'>, number> = {
  the_first: COURT_COST_MULTIPLIER_FIRST,
  retinue: COURT_COST_MULTIPLIER_RETINUE,
  watched: COURT_COST_MULTIPLIER_WATCHED,
};

const THREAT_BASE_COSTS: Record<string, number> = {
  moderate: ATTEND_COST_MODERATE,
  hard: ATTEND_COST_HARD,
  deadly: ATTEND_COST_HARD,
  story_beat: ATTEND_COST_STORY_BEAT,
};

/** Compute the attention pool cost for attending a tug. */
export function computeAttendCost(
  threatLevel: string,
  courtPosition: Exclude<CourtPosition, 'dormant'>,
): number {
  const baseCost = THREAT_BASE_COSTS[threatLevel] ?? ATTEND_COST_MODERATE;
  const multiplier = COURT_MULTIPLIERS[courtPosition] ?? COURT_COST_MULTIPLIER_RETINUE;
  return baseCost * multiplier;
}
```

- [ ] **Step 4: Run tests — PASS**

- [ ] **Step 5: Commit**

```bash
git add src/engine/attentionPool.ts tests/engine/attentionPool.test.ts
git commit -m "feat(attention): implement attention pool regen, spend, and visual states"
```

---

### Task 13: Curator Scoring Module

**Files:**
- Create: `src/engine/curator.ts`
- Create: `tests/engine/curator.test.ts`

- [ ] **Step 1: Write failing tests for curation scoring**

Test that candidates are scored by the weighted factors from spec Section 3 (court position, threat severity, chain progress, agent recency, reach variety, faction relevance, ambition alignment). Test that the top N candidates are selected and extras are demoted.

Key test cases:
- the_first scores higher than watched
- Higher threat scores higher
- Same-reach-as-last-tug gets penalized
- Selection respects `MAX_CONCURRENT_TUGS`
- Excess candidates are marked `wasCuratedOut`

- [ ] **Step 2: Implement curator.ts**

```typescript
// src/engine/curator.ts

import type { AttentionTier, ThreadTug, DigestEntry } from '../types/attention';
import type { CourtPosition } from '../types/influence';
import type { ReachDomain } from '../types/index';
import {
  MAX_CONCURRENT_TUGS,
  FOMO_OVERFLOW_RATIO,
  ATTENTION_BASE_REGEN,
  TICKS_PER_DAY,
} from '../data/attention-constants';
import { emitTrace } from './traceBuffer';

// ── Curation Scoring ──────────────────────────────────────────���──

export interface CurationCandidate {
  encounterId: string;
  actionId?: string;
  agentId: string;
  courtPosition: Exclude<CourtPosition, 'dormant'>;
  threatRating: string;
  reachPrimary: ReachDomain;
  isChainStage: boolean;
  isFinalChainStage: boolean;
  factionThreadCount: number;
  matchesAmbition: boolean;
}

// Weights from spec Section 3
const W_COURT = 0.3;
const W_THREAT = 0.15;
const W_CHAIN = 0.2;
const W_RECENCY = -0.15;
const W_VARIETY = 0.1;
const W_FACTION = 0.1;
const W_AMBITION = 0.1;

const COURT_SCORES: Record<string, number> = {
  the_first: 1.0,
  retinue: 0.7,
  watched: 0.3,
};

const THREAT_SCORES: Record<string, number> = {
  trivial: 0.1, easy: 0.3, moderate: 0.5, hard: 0.8, deadly: 1.0,
};

/**
 * Score and select which shaping candidates produce thread tugs this tick.
 * Returns selected candidates sorted by score, and demoted candidates.
 */
export function scoreCurationCandidates(
  candidates: CurationCandidate[],
  lastTugAgentTicks: Map<string, number>,
  lastTugReach: ReachDomain | null,
  currentTick: number,
  sustainableRate: number,
  rng: () => number,
): { selected: CurationCandidate[]; demoted: CurationCandidate[] } {
  if (candidates.length === 0) return { selected: [], demoted: [] };

  // Max tugs this tick (from spec pre-filtering formula)
  const maxThisTick = Math.ceil((sustainableRate * FOMO_OVERFLOW_RATIO) / TICKS_PER_DAY);
  const effectiveMax = Math.min(maxThisTick, MAX_CONCURRENT_TUGS);

  const scored = candidates.map(c => {
    let score = 0;
    score += W_COURT * (COURT_SCORES[c.courtPosition] ?? 0.5);
    score += W_THREAT * (THREAT_SCORES[c.threatRating] ?? 0.5);
    score += W_CHAIN * (c.isFinalChainStage ? 1.0 : c.isChainStage ? 0.5 : 0);
    // Recency penalty — more recent = higher penalty
    const ticksSinceLast = currentTick - (lastTugAgentTicks.get(c.agentId) ?? 0);
    score += W_RECENCY * Math.max(0, 1 - ticksSinceLast / TICKS_PER_DAY);
    // Reach variety penalty
    if (lastTugReach && c.reachPrimary === lastTugReach) score += W_VARIETY * -1;
    else score += W_VARIETY * 0.5;
    score += W_FACTION * Math.min(1.0, c.factionThreadCount / 5);
    score += W_AMBITION * (c.matchesAmbition ? 1.0 : 0);
    // Tiny PRNG tiebreaker for determinism
    score += rng() * 0.001;
    return { candidate: c, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const selected = scored.slice(0, effectiveMax).map(s => s.candidate);
  const demoted = scored.slice(effectiveMax).map(s => s.candidate);

  return { selected, demoted };
}
```

- [ ] **Step 3: Run tests — PASS**

- [ ] **Step 4: Commit**

```bash
git add src/engine/curator.ts tests/engine/curator.test.ts
git commit -m "feat(attention): implement curator curation scoring and selection"
```

---

### Task 14: Pacing Governor Module

**Files:**
- Create: `src/engine/pacingGovernor.ts`
- Create: `tests/engine/pacingGovernor.test.ts`

- [ ] **Step 1: Write failing tests**

Key test cases:
- Cannot fire story beat when one is already active
- Cannot fire during cooldown period
- Queue respects max depth (STORY_BEAT_QUEUE_MAX = 3)
- 4th queued beat demotes to shaping
- Priority ordering: doom > faction_war > promoted > template_intrinsic
- Fires highest-priority queued beat when available

- [ ] **Step 2: Implement pacingGovernor.ts**

```typescript
// src/engine/pacingGovernor.ts

import type { QueuedStoryBeat, StoryBeatPriority } from '../types/attention';
import {
  STORY_BEAT_COOLDOWN,
  STORY_BEAT_QUEUE_MAX,
  STORY_BEAT_QUEUE_OVERFLOW_DEMOTE,
} from '../data/attention-constants';
import { emitTrace } from './traceBuffer';

const PRIORITY_ORDER: StoryBeatPriority[] = [
  'doom_clock', 'faction_war', 'promoted', 'template_intrinsic',
];

function priorityRank(p: StoryBeatPriority): number {
  const idx = PRIORITY_ORDER.indexOf(p);
  return idx >= 0 ? idx : PRIORITY_ORDER.length;
}

export interface PacingState {
  activeStoryBeat: string | null;   // encounterId of currently firing beat
  lastCompletedTick: number;        // tick when last story beat completed
  queue: QueuedStoryBeat[];
}

/** Check if a new story beat can fire this tick. */
export function canFireStoryBeat(pacing: PacingState, currentTick: number): boolean {
  if (pacing.activeStoryBeat) return false;
  if (currentTick - pacing.lastCompletedTick < STORY_BEAT_COOLDOWN) return false;
  return true;
}

/**
 * Enqueue a story beat. Returns the beat to demote (if queue overflows), or null.
 */
export function enqueueStoryBeat(
  pacing: PacingState,
  beat: QueuedStoryBeat,
): QueuedStoryBeat | null {
  pacing.queue.push(beat);
  pacing.queue.sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));

  if (pacing.queue.length > STORY_BEAT_QUEUE_MAX && STORY_BEAT_QUEUE_OVERFLOW_DEMOTE) {
    return pacing.queue.pop()!; // lowest priority removed
  }
  return null;
}

/**
 * Try to fire the next queued story beat. Returns the beat to fire, or null.
 */
export function dequeueStoryBeat(
  pacing: PacingState,
  currentTick: number,
): QueuedStoryBeat | null {
  if (!canFireStoryBeat(pacing, currentTick)) return null;
  if (pacing.queue.length === 0) return null;
  const beat = pacing.queue.shift()!;
  pacing.activeStoryBeat = beat.encounterId;
  return beat;
}

/** Mark the active story beat as completed. */
export function completeStoryBeat(pacing: PacingState, tick: number): void {
  pacing.activeStoryBeat = null;
  pacing.lastCompletedTick = tick;
}
```

- [ ] **Step 3: Run tests — PASS**

- [ ] **Step 4: Commit**

```bash
git add src/engine/pacingGovernor.ts tests/engine/pacingGovernor.test.ts
git commit -m "feat(attention): implement pacing governor with queue and cooldown"
```

---

### Task 15: Wire Tier Resolution into Encounter Initiation

**Files:**
- Modify: `src/engine/phaseAgentDecision.ts`
- Modify: `src/engine/encounter.ts` (if `initiateEncounter` is used)
- Modify: `src/engine/orchestrator.ts` (phaseEncounterProgressionV2)

This task wires `resolveEffectiveTier()` into the two places encounters are created:

1. **phaseAgentDecision.ts ~line 540** — where `EncounterProgress` objects are created for legacy encounters
2. **phaseAgentDecision.ts ~line 526** — where `createUnifiedAction()` creates unified actions

- [ ] **Step 1: Import resolveEffectiveTier in phaseAgentDecision.ts**

```typescript
import { resolveEffectiveTier } from './attentionTier';
```

- [ ] **Step 2: Compute and store effectiveTier at encounter creation**

At the point where `EncounterProgress` is created (~line 540), look up the agent's `courtPosition` from their thread edge, look up the template's `intrinsicTier`, and call `resolveEffectiveTier()`. Store the result on the progress record.

For multi-agent encounters: use the highest court position among participants (per spec Section 2).

For `UnifiedAction` creation: same logic — resolve tier and pass as a field to `createUnifiedAction()`.

- [ ] **Step 3: Wire mid-encounter promotion into phaseEncounterProgressionV2**

In `src/engine/orchestrator.ts` within `phaseEncounterProgressionV2`, after each step resolution (~line 296-301), check promotion triggers by calling `checkMidEncounterPromotion()`. If promoted, update the `effectiveTier` on the encounter record and emit an `EncounterPromotionTrace`.

Promotion inputs to detect:
- `wound`: check if quintessence dropped below 30% or wound attachment acquired
- `discovery`: check if step outcome revealed hidden site/anomaly/artifact
- `chainAdvance`: check if this is a chain stage
- `tierPromotion`: check if capability tier was promoted
- `chainCulmination`: check if this was the final chain step
- `multiAgentConvergence`: check if 3+ threaded agents at same location
- `doomThreshold`: check if doom clock crossed a tier boundary
- `battleEscalation`: check if faction conflict produced a battle node

- [ ] **Step 4: Run existing tests to confirm no regression**

Run: `npm test`

- [ ] **Step 5: Commit**

```bash
git add src/engine/phaseAgentDecision.ts src/engine/orchestrator.ts src/engine/encounter.ts
git commit -m "feat(attention): wire effectiveTier into encounter initiation and progression"
```

---

### Task 16: Wire Digest Buffer Accumulation

**Files:**
- Modify: `src/engine/orchestrator.ts` (phaseEncounterProgressionV2)

- [ ] **Step 1: Import digest buffer functions**

```typescript
import { appendDigestEntry } from './digestBuffer';
import { isNotableEntry } from './attentionTier';
```

- [ ] **Step 2: After encounter step resolution, build and append DigestEntry for background-tier encounters**

In `phaseEncounterProgressionV2`, when an encounter resolves (completion or abandonment), check its `effectiveTier`. If `'background'` or `'invisible'`, build a `DigestEntry` from the resolution results and append to `state.digestBuffer`. Also append for shaping encounters that were curated out (those will be marked `wasCuratedOut: true` in the attention phase).

- [ ] **Step 3: Run tests**

Run: `npm test`

- [ ] **Step 4: Commit**

```bash
git add src/engine/orchestrator.ts
git commit -m "feat(attention): accumulate digest entries for background encounters"
```

---

### Task 17: Phase Attention — Orchestrator Integration

**Files:**
- Create: `src/engine/phaseAttention.ts`
- Modify: `src/engine/orchestrator.ts`

- [ ] **Step 1: Create phaseAttention.ts**

This is the new orchestrator phase that runs at phase 2a.6 (Encounter Visibility), extending the existing `phaseEncounterVisibility`. It handles:

1. Attention pool regeneration
2. Curator: score shaping candidates, select tugs, demote overflow
3. Thread tug lifecycle: create new tugs, expire old ones, handle auto-resolve
4. Pacing governor: check story beat queue, fire or hold

```typescript
// src/engine/phaseAttention.ts

import type { GameState } from '../types/gameState';
import type { ThreadTug, DigestEntry } from '../types/attention';
import { regenAttention, getAttentionVisualState } from './attentionPool';
import { scoreCurationCandidates } from './curator';
import { dequeueStoryBeat } from './pacingGovernor';
import { THREAD_TUG_LINGER, ATTENTION_BASE_CAPACITY, ATTENTION_BASE_REGEN } from '../data/attention-constants';
import { emitTrace } from './traceBuffer';

/**
 * Phase 2a.6 extension: attention pool regen, curator, tug lifecycle, pacing governor.
 * Called after phaseEncounterProgressionV2 (2a.5) and before phaseAgentDecision (2b).
 */
export function phaseAttention(state: GameState): Partial<GameState> {
  // 1. Regen attention pool (read from ascendant node, write back)
  // 2. Collect shaping-eligible encounters from this tick
  // 3. Run curator scoring → produce thread tugs for selected, demote rest
  // 4. Expire old tugs (createdTick + THREAD_TUG_LINGER <= currentTick)
  // 5. Auto-resolve expired unattended tugs → append to digest buffer
  // 6. Check pacing governor for queued story beats
  // 7. Emit traces

  // Implementation: read attention state from ascendant node properties,
  // iterate active encounters with effectiveTier === 'shaping',
  // pass through curator, generate ThreadTug records, update state.

  // Return partial state with updated activeThreadTugs, digestBuffer additions,
  // and tickEvents for any tug-related notifications.

  return {}; // Skeleton — full implementation in context of phaseEncounterVisibility
}
```

- [ ] **Step 2: Wire into orchestrator's runTick**

In `src/engine/orchestrator.ts`, import `phaseAttention` and call it in the tick loop at the correct position (phase 2a.6, after encounter progression, extending or replacing the existing `phaseEncounterVisibility` call at line 1551). The attention phase should run after `phaseEncounterProgressionV2` and before `phaseAgentDecision`.

Merge the partial state returned by `phaseAttention` into the running state.

- [ ] **Step 3: Run tests**

Run: `npm test`

- [ ] **Step 4: Run CLI smoke test**

Run: `npm run cli -- --seed 42`, then `tick 30`, `status`, `events`
Verify no crashes, no new errors in output.

- [ ] **Step 5: Commit**

```bash
git add src/engine/phaseAttention.ts src/engine/orchestrator.ts
git commit -m "feat(attention): wire phaseAttention into orchestrator tick loop"
```

---

### Task 18: Dormant Court Position — LOS and Encounter Handling

**Files:**
- Modify: `src/engine/visibility.ts` (`collectLOSSources`)
- Modify: `src/engine/encounterVisibility.ts`

- [ ] **Step 1: Handle dormant in collectLOSSources**

In `src/engine/visibility.ts` `collectLOSSources()` (~line 91-175), where retinue agents are iterated for LOS sources, add a check: if the thread edge's `courtPosition === 'dormant'`, skip this agent — no LOS contribution.

```typescript
// In the loop collecting agent LOS sources:
const courtPos = threadProps.courtPosition;
if (!courtPos || courtPos === 'dormant') continue; // dormant = no LOS
```

- [ ] **Step 2: Handle dormant in encounterVisibility**

In `src/engine/encounterVisibility.ts`, where `getVisibilityDepth(courtPosition)` is called, add handling for `'dormant'`: return `'none'` (no notifications generated).

- [ ] **Step 3: Run tests**

Run: `npm test`

- [ ] **Step 4: Commit**

```bash
git add src/engine/visibility.ts src/engine/encounterVisibility.ts
git commit -m "feat(attention): handle dormant court position in LOS and notifications"
```

---

## Phase 4: CLI Debug Commands

### Task 19: Add Attention Debug Commands to CLI

**Files:**
- Modify: CLI handler file (find the REPL command handler, likely `src/cli/` or `src/engine/cli.ts`)

Add these debug commands:
- `attention` — show current attention pool, capacity, regen, visual state
- `digest [N]` — show last N digest buffer entries (default 10)
- `tugs` — show active thread tugs
- `storybeats` — show story beat queue
- `threads` — show all thread edges with court positions including dormant

- [ ] **Step 1: Implement commands**

Each command reads from the current `GameState` and formats output. Follow existing CLI command patterns.

- [ ] **Step 2: Test via CLI**

Run: `npm run cli -- --seed 42`, then `tick 30`, then `attention`, `digest`, `tugs`
Verify output is formatted and shows expected data.

- [ ] **Step 3: Commit**

```bash
git add src/cli/
git commit -m "feat(attention): add attention/digest/tugs/storybeats CLI debug commands"
```

---

## Phase 5: Pre-Commit Verification & Build Check

### Task 20: Full Verification Pass

- [ ] **Step 1: Run all tests**

Run: `npm test`
Expected: All pass

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: Clean

- [ ] **Step 3: Production build**

Run: `npx vite build`
Expected: Success (confirms Vercel deploy will work)

- [ ] **Step 4: CLI smoke test**

Run: `npm run cli -- --seed 42`, then:
```
tick 50
status
attention
digest
encounters
events 20
```
Verify: no crashes, attention pool shows values, digest has entries.

- [ ] **Step 5: Commit any remaining fixes**

---

## Phase 6: UI Integration (Subsequent Plan)

The following systems require dedicated UI implementation and should be planned separately after the engine foundation is deployed and verified:

1. **Thread Tug Visuals** — HexMapV2 layer for vibrating thread lines (reach-coloured pulses, click-to-attend)
2. **Ambient Activity Icons** — HexMapV2 layer for per-reach micro-icons on agent dots
3. **Story Beat Modal** — Dramatic modal with prose, stakes, multi-phase choices
4. **Story Beat Gathering Storm** — Hex glow/swirl for queued story beats
5. **Read the Threads Panel** — Divine vision UI with grouped digest display
6. **Attention Overload Visuals** — Thread network aesthetic degradation by pool state
7. **Agent Character Sheet** — Recent Activity Log, capability growth indicators, new badges, last-viewed tracking
8. **Dormant/Reactivate Actions** — Thread management UI, divine action templates
9. **Thread Management Panel** — Opt-in numeric detail showing pool level and events

These are intentionally deferred to keep this plan focused on the engine foundation. Each UI task depends on the engine systems built in Phases 1-5 being functional and testable via CLI.

---

## Wiring Checklist Update

After completing this plan, update `Docs/plans/wiring-checklist.md` with:

| Module | Orchestrator phase | UI component | GameState flow | Traces | Debug visibility | Player controls |
|---|---|---|---|---|---|---|
| Tier resolution | 2b (Agent Decision) | — | effectiveTier on encounter record | EncounterPromotionTrace | CLI: `encounters` shows tier | Automatic |
| Digest buffer | 2a.5 (Encounter Progression) | Read the Threads panel (Phase 6) | state.digestBuffer[] | — | CLI: `digest [N]` | Read the Threads action |
| Curator | 2a.6 (phaseAttention) | Thread tugs on hex map (Phase 6) | state.activeThreadTugs[] | CuratorDecisionTrace | CLI: `tugs` | Click to attend |
| Pacing governor | 2a.6 (phaseAttention) | Story beat modal (Phase 6) | state.storyBeatQueue[] | StoryBeatQueueTrace | CLI: `storybeats` | Story beat engagement |
| Attention pool | 2a.6 + player actions | Thread network aesthetic (Phase 6) | ascendant node props | AttentionPoolTrace | CLI: `attention` | Manage threads |
| Dormant state | Player action | Thread management UI (Phase 6) | courtPosition: 'dormant' | — | CLI: `threads` | Dormant/reactivate |

---

## Documentation Updates (Post-Implementation)

- [ ] Update `Docs/changelog.md` with attention tier entries
- [ ] Update `Docs/project-status.md` (compact, <60 lines)
- [ ] Archive completed backlog items to `BACKLOG_HISTORY.md`
- [ ] Update Obsidian vault Index.md with new system pages
- [ ] Log impediments to `Docs/impediments.md`
