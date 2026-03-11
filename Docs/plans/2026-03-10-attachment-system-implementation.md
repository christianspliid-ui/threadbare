# Attachment System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the unified attachment system (possessions, conditions, bestowed powers, agreements, on-use triggers, reward pools) using existing graph infrastructure with minimal new engine code.

**Architecture:** Everything is a graph node or edge property. The modifier engine already resolves `possesses`, `has_trait`, `blessed`, `cursed` edges — zero changes to `modifiers.ts`. New code: type extensions, a `getByTag()` helper, reward pool assembly, on-use trigger resolution, and UI detail cards.

**Tech Stack:** TypeScript, Vitest, React, existing WorldGraph + modifier engine.

**Design doc:** `Docs/plans/2026-03-10-attachment-system-design.md`
**Content skill:** `.skills/content-authoring/SKILL.md`

---

## Task 1: Extend TraitCategory with `bestowed`

**Files:**
- Modify: `src/types/traits.ts:10` (TraitCategory union)
- Test: `src/types/__tests__/traits.test.ts` (create if not exists)

**Step 1: Write the failing test**

Create `src/types/__tests__/traits.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import type { TraitCategory } from '../traits';

describe('TraitCategory', () => {
  it('accepts bestowed as a valid category', () => {
    const category: TraitCategory = 'bestowed';
    expect(category).toBe('bestowed');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/types/__tests__/traits.test.ts --reporter=verbose`
Expected: FAIL — TypeScript error, `'bestowed'` not assignable to `TraitCategory`

**Step 3: Add `bestowed` to the union**

In `src/types/traits.ts` line 10, change:
```typescript
export type TraitCategory = 'innate' | 'mastery' | 'reputation' | 'scar' | 'condition' | 'destiny' | 'cultural';
```
to:
```typescript
export type TraitCategory = 'innate' | 'mastery' | 'reputation' | 'scar' | 'condition' | 'destiny' | 'cultural' | 'bestowed';
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/types/__tests__/traits.test.ts --reporter=verbose`
Expected: PASS

**Step 5: Run full type check to confirm no breakage**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 6: Commit**

```bash
git add src/types/traits.ts src/types/__tests__/traits.test.ts
git commit -m "feat(types): add 'bestowed' to TraitCategory union for divine powers"
```

---

## Task 2: Extend TraitAssignmentProperties with `ticksRemaining` and `modifiers`

The intervention effects design added `ticksRemaining` conceptually but it may not be on the type yet. We need `ticksRemaining` and `modifiers` on `TraitAssignmentProperties` for conditions and bestowed powers.

**Files:**
- Modify: `src/types/traits.ts:40-47` (TraitAssignmentProperties)
- Test: `src/types/__tests__/traits.test.ts` (extend)

**Step 1: Write the failing test**

Add to `src/types/__tests__/traits.test.ts`:

```typescript
import type { TraitAssignmentProperties } from '../traits';

describe('TraitAssignmentProperties', () => {
  it('supports ticksRemaining for transient conditions', () => {
    const props: TraitAssignmentProperties = {
      level: 1,
      acquiredTick: 10,
      lastReinforcedTick: 10,
      source: 'encounter.plague_ship',
      visibility: 'public',
      ticksRemaining: 15,
    };
    expect(props.ticksRemaining).toBe(15);
  });

  it('supports null ticksRemaining for permanent effects', () => {
    const props: TraitAssignmentProperties = {
      level: 1,
      acquiredTick: 5,
      lastReinforcedTick: 5,
      source: 'divine.sun_god',
      visibility: 'public',
      ticksRemaining: null,
    };
    expect(props.ticksRemaining).toBeNull();
  });

  it('supports modifiers record on the edge', () => {
    const props: TraitAssignmentProperties = {
      level: 1,
      acquiredTick: 10,
      lastReinforcedTick: 10,
      source: 'encounter.cursed_tomb',
      visibility: 'discoverable',
      modifiers: { heart: -0.10, star: -0.05 },
    };
    expect(props.modifiers).toEqual({ heart: -0.10, star: -0.05 });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/types/__tests__/traits.test.ts --reporter=verbose`
Expected: FAIL — `ticksRemaining` and `modifiers` not in type

**Step 3: Extend the interface**

In `src/types/traits.ts`, update `TraitAssignmentProperties` (line 40):

```typescript
export interface TraitAssignmentProperties {
  level: number;
  acquiredTick: number;
  lastReinforcedTick: number;
  source: string;
  visibility: TraitVisibility;
  /** Ticks until auto-removal. null = permanent until dispelled. undefined = no decay. */
  ticksRemaining?: number | null;
  /** Attribute deltas carried by this trait assignment (fed into modifier engine). */
  modifiers?: Record<string, number>;
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/types/__tests__/traits.test.ts --reporter=verbose`
Expected: PASS

**Step 5: Type check**

Run: `npx tsc --noEmit`
Expected: No errors (fields are optional, so existing code is unaffected)

**Step 6: Commit**

```bash
git add src/types/traits.ts src/types/__tests__/traits.test.ts
git commit -m "feat(types): add ticksRemaining and modifiers to TraitAssignmentProperties"
```

---

## Task 3: Define Attachment Types — Possession Properties and On-Use Triggers

**Files:**
- Create: `src/types/attachments.ts`
- Test: `src/types/__tests__/attachments.test.ts`

**Step 1: Write the failing test**

Create `src/types/__tests__/attachments.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import type {
  PossessionSubcategory,
  LossCondition,
  AttachmentTier,
  OnUseTrigger,
  PossessionNodeProperties,
  AgreementProperties,
  RewardPoolRecipe,
} from '../attachments';
import {
  POSSESSION_SUBCATEGORIES,
  ATTACHMENT_TIER_NAMES,
  ATTACHMENT_TIER_COLORS,
} from '../attachments';

describe('Attachment types', () => {
  it('defines seven possession subcategories', () => {
    expect(POSSESSION_SUBCATEGORIES).toHaveLength(7);
    expect(POSSESSION_SUBCATEGORIES).toContain('arms');
    expect(POSSESSION_SUBCATEGORIES).toContain('provisions');
  });

  it('defines four tier names', () => {
    expect(Object.keys(ATTACHMENT_TIER_NAMES)).toHaveLength(4);
    expect(ATTACHMENT_TIER_NAMES[1]).toBe('Mundane');
    expect(ATTACHMENT_TIER_NAMES[4]).toBe('Legendary');
  });

  it('defines tier colors', () => {
    expect(ATTACHMENT_TIER_COLORS[1]).toBeDefined();
    expect(ATTACHMENT_TIER_COLORS[4]).toBeDefined();
  });

  it('creates a valid possession properties object', () => {
    const props: PossessionNodeProperties = {
      subcategory: 'arms',
      tier: 2,
      tags: ['#iron', '#weapon'],
      mechanicalSummary: '+Iron, grants cavalry_charge',
      lossCondition: 'breakable',
    };
    expect(props.tier).toBe(2);
    expect(props.tags).toContain('#iron');
  });

  it('creates a valid on-use trigger', () => {
    const trigger: OnUseTrigger = {
      triggerCondition: 'critical_failure',
      probability: 0.25,
      effect: { type: 'remove_possession' },
      narrativeTemplate: '{item_name} shatters against {target}.',
    };
    expect(trigger.probability).toBe(0.25);
    expect(trigger.triggerCondition).toBe('critical_failure');
  });

  it('creates a valid agreement properties object', () => {
    const agreement: AgreementProperties = {
      type: 'pact',
      tier: 3,
      tags: ['#binding', '#supernatural'],
      terms: 'Your firstborn in exchange for victory.',
      fulfillmentCondition: 'Deliver the child at the next solstice.',
      ticksRemaining: null,
    };
    expect(agreement.type).toBe('pact');
  });

  it('creates a valid reward pool recipe', () => {
    const recipe: RewardPoolRecipe = {
      categoryWeights: { possession: 0.5, condition: 0.3, agreement: 0.2 },
      tierCurve: { 1: 0.5, 2: 0.3, 3: 0.15, 4: 0.05 },
      tagFilters: ['#iron'],
      badOutcomeChance: 0.1,
    };
    expect(recipe.tierCurve[1]).toBe(0.5);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/types/__tests__/attachments.test.ts --reporter=verbose`
Expected: FAIL — module not found

**Step 3: Create the types module**

Create `src/types/attachments.ts`:

```typescript
/**
 * Attachment System type definitions.
 *
 * Attachments are anything that connects to an agent and modifies
 * what they can do, unlock, or experience. Six categories:
 * Possessions, Conditions, Blessings/Curses, Bestowed Powers, Agreements, Retainers.
 *
 * Design doc: Docs/plans/2026-03-10-attachment-system-design.md
 */

// ─── Possession Subcategories ───────────────────────────────────

export type PossessionSubcategory =
  | 'arms'
  | 'mounts_beasts'
  | 'vestments'
  | 'tomes_scrolls'
  | 'relics_talismans'
  | 'tools_instruments'
  | 'provisions';

export const POSSESSION_SUBCATEGORIES: PossessionSubcategory[] = [
  'arms', 'mounts_beasts', 'vestments', 'tomes_scrolls',
  'relics_talismans', 'tools_instruments', 'provisions',
];

// ─── Tier System ────────────────────────────────────────────────

export type AttachmentTier = 1 | 2 | 3 | 4;

export const ATTACHMENT_TIER_NAMES: Record<AttachmentTier, string> = {
  1: 'Mundane',
  2: 'Storied',
  3: 'Mythic',
  4: 'Legendary',
};

export const ATTACHMENT_TIER_COLORS: Record<AttachmentTier, string> = {
  1: '#b0b0b0',  // Pale silver
  2: '#c87533',  // Copper/warm bronze
  3: '#4b0082',  // Deep violet/indigo
  4: '#d4a017',  // Gold/ember glow
};

// ─── Loss Conditions ────────────────────────────────────────────

export type LossCondition =
  | 'consumable'   // removed on use
  | 'breakable'    // can break via on-use trigger
  | 'stealable'    // can be taken by another agent
  | 'cursed'       // can't be willingly discarded
  | 'permanent';   // never lost

// ─── On-Use Triggers ────────────────────────────────────────────

export type TriggerCondition =
  | 'critical_failure'
  | 'failure'
  | 'success'
  | 'critical_success'
  | 'any_use'
  | 'first_use';

export interface OnUseTriggerEffect {
  /** What type of effect this trigger produces */
  type: 'add_condition' | 'remove_condition' | 'remove_possession'
      | 'spawn_actor' | 'add_possession' | 'modify_relationship';
  /** Trait/node ID to add/remove, if applicable */
  targetId?: string;
  /** Modifiers for the effect, if applicable */
  modifiers?: Record<string, number>;
  /** Duration in ticks, if applicable */
  ticksRemaining?: number | null;
  /** Tags to assign to the created effect */
  tags?: string[];
}

export interface OnUseTrigger {
  triggerCondition: TriggerCondition;
  /** Chance of firing when condition is met (0.0–1.0) */
  probability: number;
  effect: OnUseTriggerEffect;
  /** Prose template: {actor}, {target}, {item_name}, {location}, {they}, {them}, {their}, {adj} */
  narrativeTemplate: string;
  /** Tags on the trigger itself: #breakage, #backfire, #bonus, #revelation */
  tags?: string[];
}

// ─── Possession Node Properties ─────────────────────────────────

export interface PossessionNodeProperties {
  subcategory: PossessionSubcategory;
  tier: AttachmentTier;
  tags: string[];
  /** Human-readable one-liner: "+Iron, grants cavalry_charge, +movement" */
  mechanicalSummary: string;
  lossCondition: LossCondition;
  /** 1-2 sentences, in-world voice, no mechanical language */
  flavorText?: string;
  /** Path to concept art image */
  image?: string;
  /** Encounter/event of origin */
  source?: string;
  /** Creation Sphere alignment */
  sphereAffinity?: string;
  /** Triggers that fire when the possession is "used" in an encounter */
  onUseTriggers?: OnUseTrigger[];
}

// ─── Possession Edge Properties ─────────────────────────────────

export interface PossessionEdgeProperties {
  /** Attribute deltas fed into modifier engine */
  modifiers: Record<string, number>;
  /** Qualitative unlocks: encounter types, abilities, perceptions */
  grants: string[];
  /** Edge-level tags (may differ from node tags) */
  tags: string[];
}

// ─── Agreement Properties ───────────────────────────────────────

export type AgreementType =
  | 'pact' | 'debt' | 'favour' | 'oath' | 'treaty' | 'bargain';

export interface AgreementProperties {
  type: AgreementType;
  tier: AttachmentTier;
  tags: string[];
  /** Human-readable description of the agreement terms */
  terms: string;
  /** What resolves the agreement */
  fulfillmentCondition: string;
  /** Ticks until expiry. null = permanent until fulfilled. */
  ticksRemaining: number | null;
  /** Attribute deltas on the source agent */
  modifiers?: Record<string, number>;
}

// ─── Reward Pool Recipe ─────────────────────────────────────────

export type AttachmentCategory =
  | 'possession' | 'condition' | 'blessing' | 'curse'
  | 'bestowed_power' | 'agreement';

export interface RewardPoolRecipe {
  /** How likely each attachment category is (weights, normalized at assembly) */
  categoryWeights: Partial<Record<AttachmentCategory, number>>;
  /** Probability distribution across 4 tiers */
  tierCurve: Record<AttachmentTier, number>;
  /** Constrain pool to matching tags */
  tagFilters?: string[];
  /** Favor sphere-aligned items */
  sphereTint?: string;
  /** 0% (critical success) to 90% (critical failure) — chance of bad outcome */
  badOutcomeChance: number;
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/types/__tests__/attachments.test.ts --reporter=verbose`
Expected: PASS

**Step 5: Type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 6: Commit**

```bash
git add src/types/attachments.ts src/types/__tests__/attachments.test.ts
git commit -m "feat(types): add attachment system types — possessions, triggers, agreements, reward pools"
```

---

## Task 4: Implement `getByTag()` Graph Helper

A helper that queries the graph for nodes matching a set of tags. Used by reward pool assembly, encounter filtering, and tag-based effects (e.g., "cure all #disease conditions").

**Files:**
- Modify: `src/engine/graph.ts` (add method to WorldGraph)
- Test: `src/engine/__tests__/graph-tags.test.ts` (create)

**Step 1: Write the failing test**

Create `src/engine/__tests__/graph-tags.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import type { NodeType } from '../../types/graph';

describe('WorldGraph.getByTag', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
    graph.addNode({
      id: 'sword1', type: 'artifact', name: 'Iron Blade',
      properties: { tags: ['#iron', '#weapon', '#arms'] },
    });
    graph.addNode({
      id: 'shield1', type: 'artifact', name: 'Oaken Shield',
      properties: { tags: ['#iron', '#armor', '#vestments'] },
    });
    graph.addNode({
      id: 'potion1', type: 'artifact', name: 'Healing Draught',
      properties: { tags: ['#flesh', '#consumable', '#provisions'] },
    });
    graph.addNode({
      id: 'curse1', type: 'trait', name: 'Tomb Chill',
      properties: { tags: ['#curse', '#supernatural', '#heart'] },
    });
  });

  it('returns nodes matching a single tag', () => {
    const results = graph.getByTag(['#iron']);
    expect(results).toHaveLength(2);
    expect(results.map(n => n.id)).toContain('sword1');
    expect(results.map(n => n.id)).toContain('shield1');
  });

  it('returns nodes matching ALL specified tags (AND logic)', () => {
    const results = graph.getByTag(['#iron', '#weapon']);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('sword1');
  });

  it('returns empty array when no nodes match', () => {
    const results = graph.getByTag(['#nonexistent']);
    expect(results).toHaveLength(0);
  });

  it('filters by nodeType when provided', () => {
    const results = graph.getByTag(['#iron'], 'trait');
    expect(results).toHaveLength(0);
  });

  it('returns nodes across types when no type filter', () => {
    const results = graph.getByTag(['#heart']);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('curse1');
  });

  it('handles nodes without tags gracefully', () => {
    graph.addNode({
      id: 'plain1', type: 'actor', name: 'Nobody',
      properties: {},
    });
    const results = graph.getByTag(['#iron']);
    expect(results).toHaveLength(2); // unchanged
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/graph-tags.test.ts --reporter=verbose`
Expected: FAIL — `getByTag` is not a function

**Step 3: Implement `getByTag`**

Add to `src/engine/graph.ts`, after the `getNeighborIds` method (around line 156):

```typescript
/**
 * Find all nodes whose `properties.tags` array includes ALL of the specified tags.
 * Optionally filter by node type. Returns empty array if no matches.
 */
getByTag(tags: string[], nodeType?: NodeType): GraphNode[] {
  const candidates = nodeType
    ? this.getNodesByType(nodeType)
    : Array.from(this.nodes.values());

  return candidates.filter(node => {
    const nodeTags = node.properties.tags as string[] | undefined;
    if (!nodeTags || !Array.isArray(nodeTags)) return false;
    return tags.every(tag => nodeTags.includes(tag));
  });
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/graph-tags.test.ts --reporter=verbose`
Expected: PASS

**Step 5: Type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 6: Commit**

```bash
git add src/engine/graph.ts src/engine/__tests__/graph-tags.test.ts
git commit -m "feat(engine): add getByTag() to WorldGraph for tag-based node queries"
```

---

## Task 5: Implement `resolveOnUseTriggers()`

When an encounter resolves and an attachment's tags overlap with the encounter, check each on-use trigger for activation.

**Files:**
- Create: `src/engine/attachmentTriggers.ts`
- Test: `src/engine/__tests__/attachmentTriggers.test.ts`

**Step 1: Write the failing test**

Create `src/engine/__tests__/attachmentTriggers.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { resolveOnUseTriggers } from '../attachmentTriggers';
import type { OnUseTrigger } from '../../types/attachments';

describe('resolveOnUseTriggers', () => {
  let graph: WorldGraph;
  const agentId = 'agent.kael';

  beforeEach(() => {
    graph = new WorldGraph();
    graph.addNode({
      id: agentId, type: 'actor', name: 'Kael', properties: {},
    });
  });

  it('fires a trigger when condition matches and roll succeeds', () => {
    const trigger: OnUseTrigger = {
      triggerCondition: 'critical_failure',
      probability: 1.0, // always fires
      effect: { type: 'remove_possession' },
      narrativeTemplate: '{item_name} shatters.',
    };

    const result = resolveOnUseTriggers(
      [trigger],
      'critical_failure',
      { actor: agentId, itemName: 'Iron Blade', roll: 0.5 },
    );

    expect(result).toHaveLength(1);
    expect(result[0].fired).toBe(true);
    expect(result[0].narrativeText).toBe('Iron Blade shatters.');
  });

  it('does not fire when condition does not match', () => {
    const trigger: OnUseTrigger = {
      triggerCondition: 'critical_failure',
      probability: 1.0,
      effect: { type: 'remove_possession' },
      narrativeTemplate: '{item_name} shatters.',
    };

    const result = resolveOnUseTriggers(
      [trigger],
      'success',
      { actor: agentId, itemName: 'Iron Blade', roll: 0.5 },
    );

    expect(result).toHaveLength(0);
  });

  it('does not fire when roll exceeds probability', () => {
    const trigger: OnUseTrigger = {
      triggerCondition: 'critical_failure',
      probability: 0.25,
      effect: { type: 'remove_possession' },
      narrativeTemplate: '{item_name} shatters.',
    };

    const result = resolveOnUseTriggers(
      [trigger],
      'critical_failure',
      { actor: agentId, itemName: 'Iron Blade', roll: 0.9 }, // 0.9 > 0.25
    );

    expect(result).toHaveLength(0);
  });

  it('fires when roll is under probability threshold', () => {
    const trigger: OnUseTrigger = {
      triggerCondition: 'critical_failure',
      probability: 0.25,
      effect: { type: 'remove_possession' },
      narrativeTemplate: '{item_name} shatters.',
    };

    const result = resolveOnUseTriggers(
      [trigger],
      'critical_failure',
      { actor: agentId, itemName: 'Iron Blade', roll: 0.10 }, // 0.10 < 0.25
    );

    expect(result).toHaveLength(1);
    expect(result[0].fired).toBe(true);
  });

  it('any_use condition matches all outcomes', () => {
    const trigger: OnUseTrigger = {
      triggerCondition: 'any_use',
      probability: 1.0,
      effect: { type: 'add_condition', modifiers: { heart: -0.1 } },
      narrativeTemplate: 'The amulet drinks deep.',
    };

    for (const outcome of ['critical_failure', 'failure', 'success', 'critical_success'] as const) {
      const result = resolveOnUseTriggers(
        [trigger],
        outcome,
        { actor: agentId, itemName: 'Whispering Eye', roll: 0.5 },
      );
      expect(result).toHaveLength(1);
    }
  });

  it('substitutes template variables correctly', () => {
    const trigger: OnUseTrigger = {
      triggerCondition: 'critical_success',
      probability: 1.0,
      effect: { type: 'add_condition' },
      narrativeTemplate: '{actor} feels the {item_name} pulse with light.',
    };

    const result = resolveOnUseTriggers(
      [trigger],
      'critical_success',
      { actor: 'Kael', itemName: 'Grimoire of Stars', roll: 0.1 },
    );

    expect(result[0].narrativeText).toBe('Kael feels the Grimoire of Stars pulse with light.');
  });

  it('handles multiple triggers independently', () => {
    const triggers: OnUseTrigger[] = [
      {
        triggerCondition: 'critical_failure',
        probability: 1.0,
        effect: { type: 'remove_possession' },
        narrativeTemplate: 'It breaks.',
      },
      {
        triggerCondition: 'critical_failure',
        probability: 0.0, // never fires
        effect: { type: 'add_condition' },
        narrativeTemplate: 'It curses.',
      },
    ];

    const result = resolveOnUseTriggers(
      triggers,
      'critical_failure',
      { actor: agentId, itemName: 'Blade', roll: 0.5 },
    );

    expect(result).toHaveLength(1);
    expect(result[0].narrativeText).toBe('It breaks.');
  });

  it('returns empty array for empty triggers list', () => {
    const result = resolveOnUseTriggers(
      [],
      'success',
      { actor: agentId, itemName: 'Nothing', roll: 0.5 },
    );
    expect(result).toHaveLength(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/attachmentTriggers.test.ts --reporter=verbose`
Expected: FAIL — module not found

**Step 3: Implement `resolveOnUseTriggers`**

Create `src/engine/attachmentTriggers.ts`:

```typescript
/**
 * On-Use Trigger Resolution.
 *
 * When an encounter resolves and an attachment's tags overlap,
 * each on-use trigger is checked for activation.
 *
 * Pure function. Does not mutate graph — returns effects for the caller to apply.
 */

import type { OnUseTrigger, OnUseTriggerEffect, TriggerCondition } from '../types/attachments';

export interface TriggerContext {
  actor: string;
  itemName: string;
  /** Deterministic roll from PRNG (0.0–1.0) */
  roll: number;
  target?: string;
  location?: string;
}

export interface FiredTrigger {
  fired: true;
  trigger: OnUseTrigger;
  effect: OnUseTriggerEffect;
  narrativeText: string;
}

/**
 * Check whether a trigger condition matches an encounter outcome.
 */
function conditionMatches(
  triggerCondition: TriggerCondition,
  encounterOutcome: string,
): boolean {
  if (triggerCondition === 'any_use') return true;
  return triggerCondition === encounterOutcome;
}

/**
 * Substitute template variables in a narrative template.
 */
function substituteTemplate(template: string, context: TriggerContext): string {
  return template
    .replace(/\{actor\}/g, context.actor)
    .replace(/\{item_name\}/g, context.itemName)
    .replace(/\{target\}/g, context.target ?? '')
    .replace(/\{location\}/g, context.location ?? '');
}

/**
 * Resolve all on-use triggers for a given encounter outcome.
 *
 * Returns only the triggers that actually fired (condition matched AND roll passed).
 * The caller is responsible for applying the effects to the graph.
 */
export function resolveOnUseTriggers(
  triggers: OnUseTrigger[],
  encounterOutcome: string,
  context: TriggerContext,
): FiredTrigger[] {
  const fired: FiredTrigger[] = [];

  for (const trigger of triggers) {
    if (!conditionMatches(trigger.triggerCondition, encounterOutcome)) continue;
    if (context.roll >= trigger.probability) continue;

    fired.push({
      fired: true,
      trigger,
      effect: trigger.effect,
      narrativeText: substituteTemplate(trigger.narrativeTemplate, context),
    });
  }

  return fired;
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/attachmentTriggers.test.ts --reporter=verbose`
Expected: PASS

**Step 5: Type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 6: Commit**

```bash
git add src/engine/attachmentTriggers.ts src/engine/__tests__/attachmentTriggers.test.ts
git commit -m "feat(engine): implement resolveOnUseTriggers for attachment trigger system"
```

---

## Task 6: Implement `assembleRewardPool()`

Given a `RewardPoolRecipe` and the current graph, assemble a weighted pool of candidate attachments, then draw one. The god can nudge weights before the draw.

**Files:**
- Create: `src/engine/rewardPool.ts`
- Test: `src/engine/__tests__/rewardPool.test.ts`

**Step 1: Write the failing test**

Create `src/engine/__tests__/rewardPool.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { assembleRewardPool, drawFromPool } from '../rewardPool';
import type { RewardPoolRecipe } from '../../types/attachments';

describe('assembleRewardPool', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
    // Add some artifact nodes
    graph.addNode({
      id: 'sword.iron', type: 'artifact', name: 'Iron Blade',
      properties: {
        subcategory: 'arms', tier: 1, tags: ['#iron', '#weapon'],
        mechanicalSummary: '+Iron', lossCondition: 'breakable',
      },
    });
    graph.addNode({
      id: 'shield.oak', type: 'artifact', name: 'Oaken Shield',
      properties: {
        subcategory: 'vestments', tier: 1, tags: ['#iron', '#armor'],
        mechanicalSummary: '+Iron defense', lossCondition: 'breakable',
      },
    });
    graph.addNode({
      id: 'tome.secrets', type: 'artifact', name: 'Tome of Secrets',
      properties: {
        subcategory: 'tomes_scrolls', tier: 2, tags: ['#eye', '#tome'],
        mechanicalSummary: '+Eye, grants dark_knowledge', lossCondition: 'permanent',
      },
    });
    // Add a condition trait
    graph.addNode({
      id: 'condition.blessed', type: 'trait', name: 'Sun-Touched',
      properties: {
        subcategory: 'condition', tier: 1, tags: ['#blessing', '#star'],
        description: 'Warmed by the sun god.',
      },
    });
  });

  it('assembles a pool from graph nodes matching recipe', () => {
    const recipe: RewardPoolRecipe = {
      categoryWeights: { possession: 1.0 },
      tierCurve: { 1: 0.7, 2: 0.3, 3: 0, 4: 0 },
      badOutcomeChance: 0,
    };

    const pool = assembleRewardPool(graph, recipe);
    expect(pool.length).toBeGreaterThan(0);
    // Should include artifacts
    expect(pool.some(e => e.nodeId === 'sword.iron')).toBe(true);
  });

  it('filters by tags when specified', () => {
    const recipe: RewardPoolRecipe = {
      categoryWeights: { possession: 1.0 },
      tierCurve: { 1: 1.0, 2: 0, 3: 0, 4: 0 },
      tagFilters: ['#eye'],
      badOutcomeChance: 0,
    };

    const pool = assembleRewardPool(graph, recipe);
    // Only the tome has #eye, but it's tier 2 and tierCurve[2] = 0
    expect(pool).toHaveLength(0);
  });

  it('includes condition traits when recipe includes condition category', () => {
    const recipe: RewardPoolRecipe = {
      categoryWeights: { condition: 1.0 },
      tierCurve: { 1: 1.0, 2: 0, 3: 0, 4: 0 },
      badOutcomeChance: 0,
    };

    const pool = assembleRewardPool(graph, recipe);
    expect(pool.some(e => e.nodeId === 'condition.blessed')).toBe(true);
  });

  it('returns empty pool when nothing matches', () => {
    const recipe: RewardPoolRecipe = {
      categoryWeights: { possession: 1.0 },
      tierCurve: { 1: 0, 2: 0, 3: 0, 4: 0 }, // zero everything
      badOutcomeChance: 0,
    };

    const pool = assembleRewardPool(graph, recipe);
    expect(pool).toHaveLength(0);
  });
});

describe('drawFromPool', () => {
  it('draws an entry based on deterministic roll', () => {
    const pool = [
      { nodeId: 'a', weight: 0.5 },
      { nodeId: 'b', weight: 0.5 },
    ];

    // roll 0.2 should hit first entry (cumulative 0.5)
    const result = drawFromPool(pool, 0.2);
    expect(result).toBe('a');
  });

  it('returns null for empty pool', () => {
    const result = drawFromPool([], 0.5);
    expect(result).toBeNull();
  });

  it('handles edge case where roll equals cumulative exactly', () => {
    const pool = [
      { nodeId: 'a', weight: 0.5 },
      { nodeId: 'b', weight: 0.5 },
    ];

    // roll 0.5 should hit second entry
    const result = drawFromPool(pool, 0.5);
    expect(result).toBe('b');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/rewardPool.test.ts --reporter=verbose`
Expected: FAIL — module not found

**Step 3: Implement the reward pool**

Create `src/engine/rewardPool.ts`:

```typescript
/**
 * Reward Pool Assembly and Drawing.
 *
 * Given a RewardPoolRecipe, queries the graph for matching attachment
 * candidates, applies tier curve weighting, and produces a weighted pool
 * for deterministic drawing via PRNG roll.
 */

import type { WorldGraph } from './graph';
import type {
  RewardPoolRecipe,
  AttachmentTier,
  AttachmentCategory,
} from '../types/attachments';

export interface PoolEntry {
  nodeId: string;
  weight: number;
}

/**
 * Map attachment category to how we find candidates in the graph.
 */
function getCandidateNodes(
  graph: WorldGraph,
  category: AttachmentCategory,
  tagFilters?: string[],
): Array<{ id: string; tier: number }> {
  let nodeType: 'artifact' | 'artifact_legendary' | 'trait';
  let subcategoryFilter: string | undefined;

  switch (category) {
    case 'possession':
      nodeType = 'artifact';
      break;
    case 'condition':
    case 'blessing':
    case 'curse':
      nodeType = 'trait';
      subcategoryFilter = 'condition';
      break;
    case 'bestowed_power':
      nodeType = 'trait';
      subcategoryFilter = 'bestowed';
      break;
    case 'agreement':
      // Agreements are edges, not nodes — skip for pool assembly
      return [];
    default:
      return [];
  }

  let nodes = graph.getNodesByType(nodeType);

  if (subcategoryFilter) {
    nodes = nodes.filter(n => n.properties.subcategory === subcategoryFilter);
  }

  if (tagFilters && tagFilters.length > 0) {
    nodes = nodes.filter(n => {
      const tags = n.properties.tags as string[] | undefined;
      if (!tags) return false;
      return tagFilters.every(t => tags.includes(t));
    });
  }

  return nodes.map(n => ({
    id: n.id,
    tier: (n.properties.tier as number) ?? 1,
  }));
}

/**
 * Assemble a weighted pool of attachment candidates from the graph.
 *
 * Each candidate's weight = categoryWeight × tierCurve[tier].
 * Candidates with zero weight are excluded.
 */
export function assembleRewardPool(
  graph: WorldGraph,
  recipe: RewardPoolRecipe,
): PoolEntry[] {
  const pool: PoolEntry[] = [];

  for (const [category, categoryWeight] of Object.entries(recipe.categoryWeights)) {
    if (!categoryWeight || categoryWeight <= 0) continue;

    const candidates = getCandidateNodes(
      graph,
      category as AttachmentCategory,
      recipe.tagFilters,
    );

    for (const candidate of candidates) {
      const tierWeight = recipe.tierCurve[candidate.tier as AttachmentTier] ?? 0;
      const weight = categoryWeight * tierWeight;
      if (weight > 0) {
        pool.push({ nodeId: candidate.id, weight });
      }
    }
  }

  return pool;
}

/**
 * Draw a single entry from a weighted pool using a deterministic roll (0.0–1.0).
 *
 * Returns the nodeId of the drawn entry, or null if pool is empty.
 */
export function drawFromPool(
  pool: PoolEntry[],
  roll: number,
): string | null {
  if (pool.length === 0) return null;

  const totalWeight = pool.reduce((sum, e) => sum + e.weight, 0);
  if (totalWeight <= 0) return null;

  const target = roll * totalWeight;
  let cumulative = 0;

  for (const entry of pool) {
    cumulative += entry.weight;
    if (target < cumulative) {
      return entry.nodeId;
    }
  }

  // Edge case: return last entry (floating point)
  return pool[pool.length - 1].nodeId;
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/rewardPool.test.ts --reporter=verbose`
Expected: PASS

**Step 5: Type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 6: Commit**

```bash
git add src/engine/rewardPool.ts src/engine/__tests__/rewardPool.test.ts
git commit -m "feat(engine): implement reward pool assembly and drawing for encounter rewards"
```

---

## Task 7: Extend EncounterOutcome with Reward Pool Recipe

Wire the reward pool into the encounter system by adding an optional `rewardPool` field to `EncounterOutcome`.

**Files:**
- Modify: `src/types/encounter.ts:75-86` (EncounterOutcome)
- Test: `src/types/__tests__/encounter-rewards.test.ts` (create)

**Step 1: Write the failing test**

Create `src/types/__tests__/encounter-rewards.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import type { EncounterOutcome } from '../encounter';
import type { RewardPoolRecipe } from '../attachments';

describe('EncounterOutcome reward pool', () => {
  it('supports optional rewardPool recipe', () => {
    const outcome: EncounterOutcome = {
      narrative: 'The merchant offers a gift.',
      rewardPool: {
        categoryWeights: { possession: 0.8, condition: 0.2 },
        tierCurve: { 1: 0.5, 2: 0.3, 3: 0.15, 4: 0.05 },
        badOutcomeChance: 0.1,
      },
    };
    expect(outcome.rewardPool).toBeDefined();
    expect(outcome.rewardPool!.categoryWeights.possession).toBe(0.8);
  });

  it('still works without rewardPool (backward compatible)', () => {
    const outcome: EncounterOutcome = {
      narrative: 'Nothing of note.',
    };
    expect(outcome.rewardPool).toBeUndefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/types/__tests__/encounter-rewards.test.ts --reporter=verbose`
Expected: FAIL — `rewardPool` not in `EncounterOutcome`

**Step 3: Add rewardPool to EncounterOutcome**

In `src/types/encounter.ts`, add import and field. At the top of the file, add:

```typescript
import type { RewardPoolRecipe } from './attachments';
```

Then in the `EncounterOutcome` interface (around line 85), add before the closing brace:

```typescript
  /** Reward pool recipe for attachment generation on this outcome */
  rewardPool?: RewardPoolRecipe;
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/types/__tests__/encounter-rewards.test.ts --reporter=verbose`
Expected: PASS

**Step 5: Type check**

Run: `npx tsc --noEmit`
Expected: No errors (field is optional)

**Step 6: Commit**

```bash
git add src/types/encounter.ts src/types/__tests__/encounter-rewards.test.ts
git commit -m "feat(types): add optional rewardPool to EncounterOutcome"
```

---

## Task 8: Implement Condition Tick Decay

Conditions with `ticksRemaining` should decay each tick and be removed when they expire. This hooks into the existing tick loop.

**Files:**
- Create: `src/engine/conditionDecay.ts`
- Test: `src/engine/__tests__/conditionDecay.test.ts`

**Step 1: Write the failing test**

Create `src/engine/__tests__/conditionDecay.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { decayConditions } from '../conditionDecay';

describe('decayConditions', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
    graph.addNode({ id: 'agent1', type: 'actor', name: 'Kael', properties: {} });
    graph.addNode({
      id: 'wound1', type: 'trait', name: 'Bruised Ribs',
      properties: { subcategory: 'condition', tags: ['#wound'] },
    });
  });

  it('decrements ticksRemaining on condition edges', () => {
    graph.addEdge({
      id: 'e1', source: 'agent1', target: 'wound1', type: 'has_trait',
      properties: { level: 1, ticksRemaining: 5, acquiredTick: 1, source: 'combat' },
    });

    const removed = decayConditions(graph, 10);

    const edge = graph.getEdge('e1');
    expect(edge!.properties.ticksRemaining).toBe(4);
    expect(removed).toHaveLength(0);
  });

  it('removes condition edge when ticksRemaining reaches 0', () => {
    graph.addEdge({
      id: 'e1', source: 'agent1', target: 'wound1', type: 'has_trait',
      properties: { level: 1, ticksRemaining: 1, acquiredTick: 1, source: 'combat' },
    });

    const removed = decayConditions(graph, 10);

    expect(graph.getEdge('e1')).toBeUndefined();
    expect(removed).toHaveLength(1);
    expect(removed[0].edgeId).toBe('e1');
    expect(removed[0].traitName).toBe('Bruised Ribs');
  });

  it('ignores edges without ticksRemaining', () => {
    graph.addEdge({
      id: 'e1', source: 'agent1', target: 'wound1', type: 'has_trait',
      properties: { level: 1, acquiredTick: 1, source: 'innate' },
    });

    const removed = decayConditions(graph, 10);

    expect(graph.getEdge('e1')).toBeDefined();
    expect(removed).toHaveLength(0);
  });

  it('ignores edges with null ticksRemaining (permanent)', () => {
    graph.addEdge({
      id: 'e1', source: 'agent1', target: 'wound1', type: 'has_trait',
      properties: { level: 1, ticksRemaining: null, acquiredTick: 1, source: 'curse' },
    });

    const removed = decayConditions(graph, 10);

    expect(graph.getEdge('e1')).toBeDefined();
    expect(removed).toHaveLength(0);
  });

  it('handles multiple agents with multiple conditions', () => {
    graph.addNode({ id: 'agent2', type: 'actor', name: 'Ren', properties: {} });
    graph.addNode({
      id: 'plague', type: 'trait', name: 'Plague',
      properties: { subcategory: 'condition', tags: ['#disease'] },
    });

    graph.addEdge({
      id: 'e1', source: 'agent1', target: 'wound1', type: 'has_trait',
      properties: { level: 1, ticksRemaining: 1, acquiredTick: 1, source: 'combat' },
    });
    graph.addEdge({
      id: 'e2', source: 'agent2', target: 'plague', type: 'has_trait',
      properties: { level: 1, ticksRemaining: 3, acquiredTick: 1, source: 'encounter' },
    });

    const removed = decayConditions(graph, 10);

    expect(removed).toHaveLength(1);
    expect(removed[0].edgeId).toBe('e1');
    expect(graph.getEdge('e2')!.properties.ticksRemaining).toBe(2);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/conditionDecay.test.ts --reporter=verbose`
Expected: FAIL — module not found

**Step 3: Implement condition decay**

Create `src/engine/conditionDecay.ts`:

```typescript
/**
 * Condition Decay — tick-based removal of transient conditions.
 *
 * Called once per tick. Decrements ticksRemaining on all has_trait edges
 * that have a numeric ticksRemaining. Removes edges that reach 0.
 *
 * Pure function over graph state. Returns removed conditions for tracing.
 */

import type { WorldGraph } from './graph';

export interface RemovedCondition {
  edgeId: string;
  agentId: string;
  traitId: string;
  traitName: string;
  tick: number;
}

/**
 * Decay all condition trait edges by one tick.
 * Returns list of conditions that expired and were removed.
 */
export function decayConditions(
  graph: WorldGraph,
  tick: number,
): RemovedCondition[] {
  const removed: RemovedCondition[] = [];
  const traitEdges = graph.getEdgesByType('has_trait');

  for (const edge of traitEdges) {
    const remaining = edge.properties.ticksRemaining;

    // Skip edges without tick-based decay
    if (remaining === undefined || remaining === null) continue;
    if (typeof remaining !== 'number') continue;

    const newRemaining = remaining - 1;

    if (newRemaining <= 0) {
      // Expired — remove the edge
      const traitNode = graph.getNode(edge.target);
      removed.push({
        edgeId: edge.id,
        agentId: edge.source,
        traitId: edge.target,
        traitName: traitNode?.name ?? edge.target,
        tick,
      });
      graph.removeEdge(edge.id);
    } else {
      // Decrement
      graph.updateEdge(edge.id, {
        properties: { ...edge.properties, ticksRemaining: newRemaining },
      });
    }
  }

  return removed;
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/conditionDecay.test.ts --reporter=verbose`
Expected: PASS

**Step 5: Type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 6: Commit**

```bash
git add src/engine/conditionDecay.ts src/engine/__tests__/conditionDecay.test.ts
git commit -m "feat(engine): implement condition tick decay for transient trait removal"
```

---

## Task 9: Add Attachment Content Package — Starter Items

Create a content package with a small set of starter items that exercises all attachment features: possessions across subcategories, conditions, and on-use triggers.

**Files:**
- Create: `src/data/content-packages/starter-attachments.ts`
- Test: `src/data/__tests__/starter-attachments.test.ts`

**Step 1: Check existing content package patterns**

Run: `ls src/data/content-packages/`
Read one existing package to match its export pattern.

**Step 2: Write the failing test**

Create `src/data/__tests__/starter-attachments.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  STARTER_POSSESSIONS,
  STARTER_CONDITIONS,
} from '../content-packages/starter-attachments';

describe('starter-attachments content package', () => {
  describe('possessions', () => {
    it('exports at least one possession per subcategory', () => {
      const subcategories = new Set(STARTER_POSSESSIONS.map(p => p.properties.subcategory));
      expect(subcategories.size).toBeGreaterThanOrEqual(4);
    });

    it('every possession has required fields', () => {
      for (const item of STARTER_POSSESSIONS) {
        expect(item.type).toMatch(/^artifact/);
        expect(item.name).toBeTruthy();
        expect(item.properties.subcategory).toBeTruthy();
        expect(item.properties.tier).toBeGreaterThanOrEqual(1);
        expect(item.properties.tier).toBeLessThanOrEqual(4);
        expect(item.properties.tags.length).toBeGreaterThan(0);
        expect(item.properties.mechanicalSummary).toBeTruthy();
        expect(item.properties.lossCondition).toBeTruthy();
      }
    });

    it('tier 2+ possessions have flavorText', () => {
      const storied = STARTER_POSSESSIONS.filter(p => p.properties.tier >= 2);
      for (const item of storied) {
        expect(item.properties.flavorText).toBeTruthy();
      }
    });

    it('at least one possession has on-use triggers', () => {
      const withTriggers = STARTER_POSSESSIONS.filter(
        p => p.properties.onUseTriggers && p.properties.onUseTriggers.length > 0,
      );
      expect(withTriggers.length).toBeGreaterThan(0);
    });
  });

  describe('conditions', () => {
    it('exports at least 3 conditions', () => {
      expect(STARTER_CONDITIONS.length).toBeGreaterThanOrEqual(3);
    });

    it('every condition has required fields', () => {
      for (const cond of STARTER_CONDITIONS) {
        expect(cond.type).toBe('trait');
        expect(cond.name).toBeTruthy();
        expect(cond.properties.subcategory).toMatch(/^(condition|bestowed)$/);
        expect(cond.properties.tags.length).toBeGreaterThan(0);
        expect(cond.properties.description).toBeTruthy();
      }
    });

    it('includes at least one wound, one disease, and one blessing', () => {
      const allTags = STARTER_CONDITIONS.flatMap(c => c.properties.tags);
      expect(allTags).toContain('#wound');
      expect(allTags).toContain('#disease');
      expect(allTags).toContain('#blessing');
    });
  });
});
```

**Step 3: Run test to verify it fails**

Run: `npx vitest run src/data/__tests__/starter-attachments.test.ts --reporter=verbose`
Expected: FAIL — module not found

**Step 4: Create the content package**

Create `src/data/content-packages/starter-attachments.ts`. Follow the content-authoring skill guidelines. Include:

- **Arms:** Iron Blade (tier 1, breakable, on-use trigger: 25% break on crit fail), Ashenmane's Fang (tier 2, with flavor text)
- **Mounts:** Road-Worn Mule (tier 1), Ashenmane Horse of the Western Reach (tier 2, with flavor text)
- **Vestments:** Traveler's Cloak (tier 1)
- **Provisions:** Copper Market Rations (tier 1, consumable)
- **Relics:** The Whispering Eye (tier 3, cursed, on-use drain trigger)
- **Tomes:** Burned Codex (tier 2, with revelation trigger)

Conditions:
- Bruised Ribs (#wound, tier 1, 5 ticks)
- Plague-Touched (#disease, tier 2, 20 ticks)
- Sun-Touched (#blessing, tier 1, 10 ticks)
- Revelation (#magical, tier 2, 20 ticks)

Use `GraphNode`-shaped objects with `id`, `type`, `name`, `properties` so they can be loaded directly via `graph.addNode()`.

**Step 5: Run test to verify it passes**

Run: `npx vitest run src/data/__tests__/starter-attachments.test.ts --reporter=verbose`
Expected: PASS

**Step 6: Type check and commit**

```bash
npx tsc --noEmit
git add src/data/content-packages/starter-attachments.ts src/data/__tests__/starter-attachments.test.ts
git commit -m "content: add starter attachments content package with items, conditions, triggers"
```

---

## Task 10: Integration Test — Full Attachment Lifecycle

End-to-end test: create agent → give possession → encounter → trigger fires → condition applied → condition decays → removed.

**Files:**
- Create: `src/engine/__tests__/attachment-lifecycle-integration.test.ts`

**Step 1: Write the integration test**

```typescript
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { resolveOnUseTriggers } from '../attachmentTriggers';
import { decayConditions } from '../conditionDecay';
import { collectModifiers, getModifiedValue } from '../modifiers';

describe('Attachment lifecycle integration', () => {
  it('possession → trigger → condition → decay → removed', () => {
    const graph = new WorldGraph();

    // 1. Create agent
    graph.addNode({
      id: 'agent.kael', type: 'actor', name: 'Kael',
      properties: { baseIron: 0.50 },
    });

    // 2. Create possession node
    graph.addNode({
      id: 'sword.iron', type: 'artifact', name: 'Iron Blade',
      properties: {
        subcategory: 'arms', tier: 1,
        tags: ['#iron', '#weapon'],
        mechanicalSummary: '+Iron',
        lossCondition: 'breakable',
        onUseTriggers: [{
          triggerCondition: 'critical_failure',
          probability: 1.0,
          effect: { type: 'add_condition', targetId: 'condition.disarmed', modifiers: { iron: -0.20 }, ticksRemaining: 5 },
          narrativeTemplate: '{item_name} shatters.',
        }],
      },
    });

    // 3. Give possession to agent (possesses edge with modifiers)
    graph.addEdge({
      id: 'e.possess', source: 'agent.kael', target: 'sword.iron',
      type: 'possesses',
      properties: { modifiers: { iron: 0.10 }, grants: ['melee_combat'], tags: ['#iron'] },
    });

    // 4. Verify modifier engine picks up possession
    const ironMods = collectModifiers(graph, 'agent.kael', 'iron');
    expect(ironMods).toHaveLength(1);
    expect(ironMods[0].delta).toBe(0.10);

    const modifiedIron = getModifiedValue(graph, 'agent.kael', 'iron', 0.50);
    expect(modifiedIron).toBe(0.60);

    // 5. Simulate encounter critical failure — trigger fires
    const triggers = graph.getNode('sword.iron')!.properties.onUseTriggers as any[];
    const fired = resolveOnUseTriggers(
      triggers,
      'critical_failure',
      { actor: 'Kael', itemName: 'Iron Blade', roll: 0.1 },
    );
    expect(fired).toHaveLength(1);

    // 6. Apply the trigger effect: add condition
    const effect = fired[0].effect;
    graph.addNode({
      id: 'condition.disarmed', type: 'trait', name: 'Disarmed',
      properties: { subcategory: 'condition', tags: ['#wound'], description: 'Empty-handed.' },
    });
    graph.addEdge({
      id: 'e.disarmed', source: 'agent.kael', target: 'condition.disarmed',
      type: 'has_trait',
      properties: {
        level: 1, acquiredTick: 10, lastReinforcedTick: 10,
        source: 'sword.iron', visibility: 'public',
        ticksRemaining: effect.ticksRemaining,
        modifiers: effect.modifiers,
      },
    });

    // 7. Verify condition modifiers are active
    const postMods = collectModifiers(graph, 'agent.kael', 'iron');
    const conditionMod = postMods.find(m => m.sourceName === 'Disarmed');
    expect(conditionMod).toBeDefined();
    expect(conditionMod!.delta).toBe(-0.20);

    // 8. Decay conditions over 5 ticks
    for (let tick = 11; tick <= 15; tick++) {
      decayConditions(graph, tick);
    }

    // 9. Condition should be removed
    expect(graph.getEdge('e.disarmed')).toBeUndefined();

    // 10. Iron modifier from condition should be gone
    const finalMods = collectModifiers(graph, 'agent.kael', 'iron');
    expect(finalMods.find(m => m.sourceName === 'Disarmed')).toBeUndefined();
  });

  it('agreement modifiers feed into modifier engine', () => {
    const graph = new WorldGraph();

    graph.addNode({ id: 'agent.a', type: 'actor', name: 'Merchant', properties: {} });
    graph.addNode({ id: 'agent.b', type: 'actor', name: 'Debtor', properties: {} });

    // Agreement as enriched relates_to edge
    graph.addEdge({
      id: 'e.debt', source: 'agent.b', target: 'agent.a',
      type: 'relates_to',
      properties: {
        sentiment: -0.3,
        strength: 0.6,
        basis: 'financial',
        agreement: {
          type: 'debt',
          tier: 1,
          tags: ['#commercial', '#binding'],
          terms: 'Repay 50 gold by next harvest.',
          fulfillmentCondition: 'Pay 50 gold.',
          ticksRemaining: 30,
        },
        modifiers: { gold: -0.10 }, // debt weighs on commerce
      },
    });

    // Modifier engine should pick up the gold penalty
    const mods = collectModifiers(graph, 'agent.b', 'gold');
    expect(mods).toHaveLength(1);
    expect(mods[0].delta).toBe(-0.10);
    expect(mods[0].sourceName).toBe('Merchant');
  });

  it('getByTag finds attachments by tag', () => {
    const graph = new WorldGraph();

    graph.addNode({
      id: 'sword1', type: 'artifact', name: 'Iron Blade',
      properties: { tags: ['#iron', '#weapon'] },
    });
    graph.addNode({
      id: 'disease1', type: 'trait', name: 'Plague',
      properties: { subcategory: 'condition', tags: ['#disease', '#flesh'] },
    });
    graph.addNode({
      id: 'blessing1', type: 'trait', name: 'Sun-Touched',
      properties: { subcategory: 'condition', tags: ['#blessing', '#star'] },
    });

    // Healing flask cures all #disease
    const diseases = graph.getByTag(['#disease']);
    expect(diseases).toHaveLength(1);
    expect(diseases[0].name).toBe('Plague');

    // Find all conditions
    const conditions = graph.getByTag(['#blessing'], 'trait');
    expect(conditions).toHaveLength(1);
  });
});
```

**Step 2: Run the test**

Run: `npx vitest run src/engine/__tests__/attachment-lifecycle-integration.test.ts --reporter=verbose`
Expected: PASS (all prior tasks complete)

**Step 3: Commit**

```bash
git add src/engine/__tests__/attachment-lifecycle-integration.test.ts
git commit -m "test: add attachment lifecycle integration tests"
```

---

## Task 11: Run Full Test Suite and Type Check

Verify nothing is broken across the entire codebase.

**Step 1: Type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 2: Full test suite**

Run: `npm test`
Expected: All tests pass, including the new attachment tests

**Step 3: Fix any failures**

If any existing tests break, investigate and fix. Common issues:
- Import paths — verify all new modules export correctly
- Type widening — `TraitCategory` now has `'bestowed'`, check switch/case exhaustiveness

**Step 4: Commit if fixes were needed**

```bash
git add -A
git commit -m "fix: resolve any test regressions from attachment system types"
```

---

## Summary

| Task | What | New Lines (approx) | Tests |
|------|------|--------------------|-------|
| 1 | Add `bestowed` to TraitCategory | ~1 | 1 |
| 2 | Add `ticksRemaining` + `modifiers` to TraitAssignmentProperties | ~4 | 3 |
| 3 | Create attachment types module | ~170 | 7 |
| 4 | Implement `getByTag()` | ~15 | 6 |
| 5 | Implement `resolveOnUseTriggers()` | ~70 | 8 |
| 6 | Implement `assembleRewardPool()` + `drawFromPool()` | ~100 | 5 |
| 7 | Add `rewardPool` to EncounterOutcome | ~3 | 2 |
| 8 | Implement condition tick decay | ~50 | 5 |
| 9 | Starter content package | ~200 | 6 |
| 10 | Integration tests | ~120 | 3 |
| 11 | Full suite verification | 0 | all |

**Total: ~733 new lines, ~46 new tests, 11 commits.**

Engine changes are minimal. The modifier engine (`modifiers.ts`) is untouched. All new code is additive.
