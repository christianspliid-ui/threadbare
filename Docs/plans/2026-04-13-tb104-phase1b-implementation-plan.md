# TB-104 Phase 1B — `resource_delta` + `action_trigger` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two new content primitives (`resource_delta`, `action_trigger`) to the generic effect system, with TDD, proof-pack items, and wired integration points.

**Architecture:** Extend the existing `AttachmentEffect` union in `effects.ts` with two new interfaces. Each primitive gets its own helper module in `src/engine/effects/`. `resource_delta` is consumed at reward/resolution time. `action_trigger` is checked by event handlers in encounter aftermath, movement, and unified action resolution. Cooldown state tracked in `EffectRuntimeState`.

**Tech Stack:** TypeScript, Vitest, existing effect system (`effects.ts`, `effectResolver.ts`, `effectTick.ts`, `rewardPool.ts`)

**Spec:** `Docs/plans/2026-04-13-tb104-phase1b-resource-delta-action-trigger.md`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/types/effects.ts` | Modify | Add `ResourceDeltaEffect`, `ActionTriggerEffect`, related types, trace detail interfaces, `EffectRuntimeState` extensions, union additions |
| `src/data/effect-constants.ts` | Modify | Add 5 new constants |
| `src/engine/effects/resourceDelta.ts` | Create | `applyResourceDelta()` helper — one-shot resource mutation with clamping and trace |
| `src/engine/effects/actionTrigger.ts` | Create | `checkAndFireActionTriggers()` helper — walk triggers, check eligibility, fire payloads, update state |
| `src/engine/effects/index.ts` | Modify | Barrel exports for new modules |
| `src/engine/effectResolver.ts` | Modify | Add `resource_delta` + `action_trigger` to non-modifier skip list |
| `src/engine/orchestrator.ts` | Modify | Wire trigger checks into legacy encounter aftermath |
| `src/engine/phaseMovement.ts` | Modify | Wire trigger checks into movement arrival |
| `src/engine/unifiedActionResolution.ts` | Modify | Wire trigger checks into action completion |
| `src/engine/rewardPool.ts` | Modify | Wire `resource_delta` into reward instantiation path |
| `src/data/reward-attachment-catalog.ts` | Modify | Add 2 proof-pack items |
| `src/engine/__tests__/resourceDelta.test.ts` | Create | Unit tests for `applyResourceDelta()` |
| `src/engine/__tests__/actionTrigger.test.ts` | Create | Unit tests for `checkAndFireActionTriggers()` |

---

## Task 1: Type Definitions + Constants

**Files:**
- Modify: `src/types/effects.ts`
- Modify: `src/data/effect-constants.ts`

- [ ] **Step 1: Add `ActionTriggerEvent`, `ActionTriggerPayload`, and effect interfaces to `effects.ts`**

After the `ContentGrantEffect` interface (around line 417), add:

```ts
// ─── Content Primitive: resource_delta (TB-104 Phase 1B) ─────────

/** Type 19h: One-shot resource mutation at resolution/reward time */
export interface ResourceDeltaEffect {
  readonly type: 'resource_delta';
  readonly resource: 'essence' | 'quintessence' | 'doom';
  readonly amount: number;
  readonly condition?: EffectPredicate;
  readonly scope?: EffectScope;
}

// ─── Content Primitive: action_trigger (TB-104 Phase 1B) ──────────

export type ActionTriggerEvent =
  | 'encounter_success'
  | 'encounter_failure'
  | 'movement_complete'
  | 'rest'
  | 'spell_cast'
  | 'action_complete';

export type ActionTriggerPayload =
  | { readonly kind: 'resource_delta'; readonly resource: 'essence' | 'quintessence' | 'doom'; readonly amount: number }
  | { readonly kind: 'content_grant'; readonly templateIds: readonly string[]; readonly selection?: 'first' | 'random' }
  | { readonly kind: 'trace_only'; readonly message: string };

/** Type 19i: Fire a payload when the owner performs a specific action */
export interface ActionTriggerEffect {
  readonly type: 'action_trigger';
  readonly on: ActionTriggerEvent;
  readonly payload: ActionTriggerPayload;
  readonly condition?: EffectPredicate;
  readonly maxFires?: number;
  readonly cooldownTicks?: number;
}
```

- [ ] **Step 2: Add both types to the `AttachmentEffect` union**

In the `AttachmentEffect` type (around line 689), after `ContentGrantEffect`, add:

```ts
  | ResourceDeltaEffect
  | ActionTriggerEffect
```

- [ ] **Step 3: Extend `EffectRuntimeState` with action trigger fields**

In the `EffectRuntimeState` interface (around line 820), add:

```ts
  /** Action trigger: total fires consumed so far */
  actionTriggerFireCount?: number;
  /** Action trigger: tick when cooldown expires (trigger cannot fire before this tick) */
  actionTriggerCooldownUntil?: number;
```

- [ ] **Step 4: Add trace detail interfaces**

After the `EffectModifierResult` interface (around line 896), add:

```ts
// ─── Content Primitive Trace Details (TB-104 Phase 1B) ────────────

export interface ResourceDeltaAppliedTraceDetails {
  readonly actorId: string;
  readonly resource: 'essence' | 'quintessence' | 'doom';
  readonly amount: number;
  readonly before: number;
  readonly after: number;
  readonly source: 'encounter' | 'reward' | 'action_trigger';
  readonly sourceAttachmentId?: string;
}

export interface ActionTriggerFiredTraceDetails {
  readonly actorId: string;
  readonly attachmentId: string;
  readonly attachmentName: string;
  readonly event: ActionTriggerEvent;
  readonly payloadKind: ActionTriggerPayload['kind'];
  readonly firesRemaining: number | undefined;
  readonly cooldownUntilTick: number;
}
```

- [ ] **Step 5: Add non-modifier case entries in `effectResolver.ts`**

In `effectResolver.ts`, in the `getEffectValue` switch (around line 155), add to the non-modifier case block alongside `test_shaper`, `prevent_loss`, `content_grant`:

```ts
    case 'resource_delta':
    case 'action_trigger':
```

- [ ] **Step 6: Add constants to `effect-constants.ts`**

At the bottom of `src/data/effect-constants.ts`, add:

```ts
// ─── Content Primitives (TB-104 Phase 1B) ────────────────────────

/** Max absolute essence change from a single resource_delta effect. */
export const RESOURCE_DELTA_ESSENCE_CAP = 50;

/** Max absolute quintessence change from a single resource_delta effect. */
export const RESOURCE_DELTA_QUINTESSENCE_CAP = 30;

/** Max absolute doom change from a single resource_delta effect. */
export const RESOURCE_DELTA_DOOM_CAP = 20;

/** Max action_trigger effects per attachment template. */
export const ACTION_TRIGGER_MAX_PER_ATTACHMENT = 2;

/** Default ticks between action_trigger fires when cooldownTicks not specified. */
export const ACTION_TRIGGER_DEFAULT_COOLDOWN = 6;
```

- [ ] **Step 7: Verify types compile**

Run: `npx tsc --noEmit`
Expected: Clean (0 errors)

- [ ] **Step 8: Commit**

```bash
git add src/types/effects.ts src/data/effect-constants.ts src/engine/effectResolver.ts
git commit -m "feat(effects): add resource_delta + action_trigger type definitions and constants (TB-104 Phase 1B)"
```

---

## Task 2: `applyResourceDelta()` Helper — TDD

**Files:**
- Create: `src/engine/__tests__/resourceDelta.test.ts`
- Create: `src/engine/effects/resourceDelta.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/engine/__tests__/resourceDelta.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { applyResourceDelta } from '../effects/resourceDelta';
import type { ResourceDeltaEffect } from '../../types/effects';

describe('applyResourceDelta', () => {
  it('adds essence and clamps to non-negative', () => {
    const effect: ResourceDeltaEffect = { type: 'resource_delta', resource: 'essence', amount: 10 };
    const result = applyResourceDelta(effect, { essence: 5 }, 1, 'reward');
    expect(result.after).toBe(15);
    expect(result.applied).toBe(true);
    expect(result.trace.resource).toBe('essence');
    expect(result.trace.before).toBe(5);
    expect(result.trace.after).toBe(15);
  });

  it('subtracts essence and clamps to 0', () => {
    const effect: ResourceDeltaEffect = { type: 'resource_delta', resource: 'essence', amount: -100 };
    const result = applyResourceDelta(effect, { essence: 30 }, 1, 'encounter');
    expect(result.after).toBe(0);
    expect(result.trace.amount).toBe(-100);
  });

  it('adds quintessence and clamps to max', () => {
    const effect: ResourceDeltaEffect = { type: 'resource_delta', resource: 'quintessence', amount: 20 };
    const result = applyResourceDelta(effect, { quintessence: 90, quintessenceMax: 100 }, 1, 'reward');
    expect(result.after).toBe(100);
  });

  it('clamps amount to per-resource cap', () => {
    const effect: ResourceDeltaEffect = { type: 'resource_delta', resource: 'essence', amount: 999 };
    const result = applyResourceDelta(effect, { essence: 0 }, 1, 'reward');
    // RESOURCE_DELTA_ESSENCE_CAP = 50
    expect(result.after).toBe(50);
    expect(result.trace.amount).toBe(999); // trace records original intent
  });

  it('adds doom and clamps to doomThreshold', () => {
    const effect: ResourceDeltaEffect = { type: 'resource_delta', resource: 'doom', amount: 15 };
    const result = applyResourceDelta(effect, { doom: 80, doomThreshold: 100 }, 1, 'encounter');
    expect(result.after).toBe(95);
  });

  it('clamps doom delta to RESOURCE_DELTA_DOOM_CAP', () => {
    const effect: ResourceDeltaEffect = { type: 'resource_delta', resource: 'doom', amount: 50 };
    const result = applyResourceDelta(effect, { doom: 0, doomThreshold: 100 }, 1, 'encounter');
    // RESOURCE_DELTA_DOOM_CAP = 20
    expect(result.after).toBe(20);
  });

  it('returns applied=false for unrecognized resource', () => {
    const effect = { type: 'resource_delta', resource: 'mana', amount: 10 } as any;
    const result = applyResourceDelta(effect, { essence: 0 }, 1, 'reward');
    expect(result.applied).toBe(false);
  });

  it('records source in trace', () => {
    const effect: ResourceDeltaEffect = { type: 'resource_delta', resource: 'essence', amount: 5 };
    const result = applyResourceDelta(effect, { essence: 0 }, 1, 'action_trigger', 'attachment_123');
    expect(result.trace.source).toBe('action_trigger');
    expect(result.trace.sourceAttachmentId).toBe('attachment_123');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/resourceDelta.test.ts`
Expected: FAIL — module `../effects/resourceDelta` not found

- [ ] **Step 3: Implement `applyResourceDelta()`**

Create `src/engine/effects/resourceDelta.ts`:

```ts
/**
 * Resource Delta — one-shot resource mutation for encounter/reward resolution.
 *
 * Applies an immediate change to essence, quintessence, or doom.
 * Clamps to valid range and respects per-resource caps.
 *
 * Not ticked — fires once at resolution or reward time.
 *
 * TB-104 Phase 1B
 */

import type { ResourceDeltaEffect, ResourceDeltaAppliedTraceDetails } from '../../types/effects';
import {
  RESOURCE_DELTA_ESSENCE_CAP,
  RESOURCE_DELTA_QUINTESSENCE_CAP,
  RESOURCE_DELTA_DOOM_CAP,
} from '../../data/effect-constants';

export interface ResourceDeltaInput {
  essence?: number;
  quintessence?: number;
  quintessenceMax?: number;
  doom?: number;
  doomThreshold?: number;
}

export interface ResourceDeltaResult {
  applied: boolean;
  after: number;
  trace: ResourceDeltaAppliedTraceDetails;
}

const CAPS: Record<string, number> = {
  essence: RESOURCE_DELTA_ESSENCE_CAP,
  quintessence: RESOURCE_DELTA_QUINTESSENCE_CAP,
  doom: RESOURCE_DELTA_DOOM_CAP,
};

export function applyResourceDelta(
  effect: ResourceDeltaEffect,
  agentResources: ResourceDeltaInput,
  tick: number,
  source: ResourceDeltaAppliedTraceDetails['source'],
  sourceAttachmentId?: string,
): ResourceDeltaResult {
  const cap = CAPS[effect.resource];
  if (cap === undefined) {
    return {
      applied: false,
      after: 0,
      trace: {
        actorId: '',
        resource: effect.resource,
        amount: effect.amount,
        before: 0,
        after: 0,
        source,
        sourceAttachmentId,
      },
    };
  }

  // Clamp delta magnitude to per-resource cap
  const clampedDelta = Math.sign(effect.amount) * Math.min(Math.abs(effect.amount), cap);

  let before: number;
  let max: number;

  switch (effect.resource) {
    case 'essence':
      before = agentResources.essence ?? 0;
      max = Infinity;
      break;
    case 'quintessence':
      before = agentResources.quintessence ?? 0;
      max = agentResources.quintessenceMax ?? Infinity;
      break;
    case 'doom':
      before = agentResources.doom ?? 0;
      max = agentResources.doomThreshold ?? Infinity;
      break;
  }

  const after = Math.max(0, Math.min(max, before + clampedDelta));

  return {
    applied: true,
    after,
    trace: {
      actorId: '',
      resource: effect.resource,
      amount: effect.amount,
      before,
      after,
      source,
      sourceAttachmentId,
    },
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/engine/__tests__/resourceDelta.test.ts`
Expected: All 8 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/effects/resourceDelta.ts src/engine/__tests__/resourceDelta.test.ts
git commit -m "feat(effects): add applyResourceDelta() helper with TDD (TB-104 Phase 1B)"
```

---

## Task 3: `checkAndFireActionTriggers()` Helper — TDD

**Files:**
- Create: `src/engine/__tests__/actionTrigger.test.ts`
- Create: `src/engine/effects/actionTrigger.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/engine/__tests__/actionTrigger.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { checkAndFireActionTriggers, type ActionTriggerContext } from '../effects/actionTrigger';
import type { ActionTriggerEffect, EffectRuntimeState } from '../../types/effects';
import type { AttachedEffect } from '../effects/effectWalker';

function makeAttachedTrigger(
  attachmentId: string,
  trigger: ActionTriggerEffect,
  runtimeState?: EffectRuntimeState,
): AttachedEffect {
  return {
    attachmentId,
    attachmentName: `Test ${attachmentId}`,
    attachmentTier: 1,
    effect: trigger,
    runtimeState,
  };
}

describe('checkAndFireActionTriggers', () => {
  const baseCtx: ActionTriggerContext = {
    agentId: 'agent-1',
    tick: 10,
    agentResources: { essence: 50, quintessence: 80, quintessenceMax: 100, doom: 20, doomThreshold: 100 },
  };

  it('fires a matching trigger and returns resource_delta result', () => {
    const trigger: ActionTriggerEffect = {
      type: 'action_trigger',
      on: 'encounter_success',
      payload: { kind: 'resource_delta', resource: 'essence', amount: 5 },
    };
    const effects = [makeAttachedTrigger('att-1', trigger)];
    const states = new Map<string, EffectRuntimeState>();

    const result = checkAndFireActionTriggers(effects, 'encounter_success', baseCtx, states);

    expect(result.firedCount).toBe(1);
    expect(result.resourceDeltas).toHaveLength(1);
    expect(result.resourceDeltas[0].resource).toBe('essence');
    expect(result.resourceDeltas[0].after).toBe(55);
    expect(result.traces).toHaveLength(1);
  });

  it('does not fire when event does not match', () => {
    const trigger: ActionTriggerEffect = {
      type: 'action_trigger',
      on: 'movement_complete',
      payload: { kind: 'resource_delta', resource: 'essence', amount: 5 },
    };
    const effects = [makeAttachedTrigger('att-1', trigger)];
    const states = new Map<string, EffectRuntimeState>();

    const result = checkAndFireActionTriggers(effects, 'encounter_success', baseCtx, states);

    expect(result.firedCount).toBe(0);
    expect(result.resourceDeltas).toHaveLength(0);
  });

  it('respects cooldown — does not fire if cooldown has not expired', () => {
    const trigger: ActionTriggerEffect = {
      type: 'action_trigger',
      on: 'encounter_success',
      payload: { kind: 'resource_delta', resource: 'essence', amount: 5 },
      cooldownTicks: 6,
    };
    const effects = [makeAttachedTrigger('att-1', trigger, {
      actionTriggerCooldownUntil: 15,
      actionTriggerFireCount: 1,
    })];
    const states = new Map<string, EffectRuntimeState>([
      ['att-1', { actionTriggerCooldownUntil: 15, actionTriggerFireCount: 1 }],
    ]);

    const result = checkAndFireActionTriggers(effects, 'encounter_success', { ...baseCtx, tick: 10 }, states);
    expect(result.firedCount).toBe(0);
  });

  it('fires when cooldown has expired', () => {
    const trigger: ActionTriggerEffect = {
      type: 'action_trigger',
      on: 'encounter_success',
      payload: { kind: 'resource_delta', resource: 'essence', amount: 5 },
      cooldownTicks: 6,
    };
    const effects = [makeAttachedTrigger('att-1', trigger, {
      actionTriggerCooldownUntil: 8,
      actionTriggerFireCount: 1,
    })];
    const states = new Map<string, EffectRuntimeState>([
      ['att-1', { actionTriggerCooldownUntil: 8, actionTriggerFireCount: 1 }],
    ]);

    const result = checkAndFireActionTriggers(effects, 'encounter_success', { ...baseCtx, tick: 10 }, states);
    expect(result.firedCount).toBe(1);
  });

  it('respects maxFires — does not fire when exhausted', () => {
    const trigger: ActionTriggerEffect = {
      type: 'action_trigger',
      on: 'encounter_success',
      payload: { kind: 'resource_delta', resource: 'essence', amount: 5 },
      maxFires: 3,
    };
    const effects = [makeAttachedTrigger('att-1', trigger, { actionTriggerFireCount: 3 })];
    const states = new Map<string, EffectRuntimeState>([
      ['att-1', { actionTriggerFireCount: 3 }],
    ]);

    const result = checkAndFireActionTriggers(effects, 'encounter_success', baseCtx, states);
    expect(result.firedCount).toBe(0);
  });

  it('updates state with new fire count and cooldown', () => {
    const trigger: ActionTriggerEffect = {
      type: 'action_trigger',
      on: 'encounter_success',
      payload: { kind: 'resource_delta', resource: 'essence', amount: 5 },
      cooldownTicks: 10,
      maxFires: 5,
    };
    const effects = [makeAttachedTrigger('att-1', trigger)];
    const states = new Map<string, EffectRuntimeState>();

    const result = checkAndFireActionTriggers(effects, 'encounter_success', baseCtx, states);

    const updated = result.updatedStates.get('att-1');
    expect(updated?.actionTriggerFireCount).toBe(1);
    expect(updated?.actionTriggerCooldownUntil).toBe(20); // tick 10 + cooldown 10
  });

  it('fires trace_only payload without resource changes', () => {
    const trigger: ActionTriggerEffect = {
      type: 'action_trigger',
      on: 'movement_complete',
      payload: { kind: 'trace_only', message: 'The stone hums' },
    };
    const effects = [makeAttachedTrigger('att-1', trigger)];
    const states = new Map<string, EffectRuntimeState>();

    const result = checkAndFireActionTriggers(effects, 'movement_complete', baseCtx, states);
    expect(result.firedCount).toBe(1);
    expect(result.resourceDeltas).toHaveLength(0);
    expect(result.traces).toHaveLength(1);
  });

  it('skips non-action_trigger effects', () => {
    const passive = { type: 'passive', reach: 'iron', value: 0.03 } as any;
    const effects: AttachedEffect[] = [{
      attachmentId: 'att-1',
      attachmentName: 'Sword',
      attachmentTier: 1,
      effect: passive,
    }];
    const states = new Map<string, EffectRuntimeState>();

    const result = checkAndFireActionTriggers(effects, 'encounter_success', baseCtx, states);
    expect(result.firedCount).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/actionTrigger.test.ts`
Expected: FAIL — module `../effects/actionTrigger` not found

- [ ] **Step 3: Implement `checkAndFireActionTriggers()`**

Create `src/engine/effects/actionTrigger.ts`:

```ts
/**
 * Action Trigger — fires payloads when the owning agent performs specific actions.
 *
 * Different from reactive effects (which fire on things happening *to* the agent).
 * This fires on things the agent *does*: encounter outcomes, movement, spells, rest.
 *
 * Eligibility: event matches + condition passes + not on cooldown + fires remaining.
 * Payload execution: resource_delta, content_grant, or trace_only.
 *
 * TB-104 Phase 1B
 */

import type {
  ActionTriggerEffect,
  ActionTriggerEvent,
  ActionTriggerPayload,
  ActionTriggerFiredTraceDetails,
  EffectRuntimeState,
} from '../../types/effects';
import type { AttachedEffect } from './effectWalker';
import { applyResourceDelta, type ResourceDeltaInput, type ResourceDeltaResult } from './resourceDelta';
import { ACTION_TRIGGER_DEFAULT_COOLDOWN } from '../../data/effect-constants';

export interface ActionTriggerContext {
  agentId: string;
  tick: number;
  agentResources: ResourceDeltaInput;
}

export interface ActionTriggerResult {
  firedCount: number;
  resourceDeltas: Array<{ resource: string; before: number; after: number }>;
  traces: ActionTriggerFiredTraceDetails[];
  updatedStates: Map<string, EffectRuntimeState>;
}

export function checkAndFireActionTriggers(
  effects: readonly AttachedEffect[],
  event: ActionTriggerEvent,
  ctx: ActionTriggerContext,
  effectStates: ReadonlyMap<string, EffectRuntimeState>,
): ActionTriggerResult {
  const resourceDeltas: ActionTriggerResult['resourceDeltas'] = [];
  const traces: ActionTriggerFiredTraceDetails[] = [];
  const updatedStates = new Map(effectStates);
  let firedCount = 0;

  for (const entry of effects) {
    if (entry.effect.type !== 'action_trigger') continue;
    const trigger = entry.effect as ActionTriggerEffect;

    // Event match
    if (trigger.on !== event) continue;

    // State check: cooldown + fire count
    const state = updatedStates.get(entry.attachmentId) ?? {};
    const fireCount = state.actionTriggerFireCount ?? 0;
    const cooldownUntil = state.actionTriggerCooldownUntil ?? 0;

    // Fires exhausted
    if (trigger.maxFires !== undefined && fireCount >= trigger.maxFires) continue;

    // Still on cooldown
    if (cooldownUntil > ctx.tick) continue;

    // Fire the payload
    const cooldownTicks = trigger.cooldownTicks ?? ACTION_TRIGGER_DEFAULT_COOLDOWN;
    const newFireCount = fireCount + 1;
    const newCooldownUntil = ctx.tick + cooldownTicks;

    // Execute payload
    if (trigger.payload.kind === 'resource_delta') {
      const deltaEffect = {
        type: 'resource_delta' as const,
        resource: trigger.payload.resource,
        amount: trigger.payload.amount,
      };
      const deltaResult = applyResourceDelta(
        deltaEffect,
        ctx.agentResources,
        ctx.tick,
        'action_trigger',
        entry.attachmentId,
      );
      if (deltaResult.applied) {
        resourceDeltas.push({
          resource: trigger.payload.resource,
          before: deltaResult.trace.before,
          after: deltaResult.after,
        });
        // Update running resources for subsequent triggers in the same batch
        (ctx.agentResources as Record<string, number>)[trigger.payload.resource] = deltaResult.after;
      }
    }
    // content_grant and trace_only: no resource changes, just trace

    const firesRemaining = trigger.maxFires !== undefined
      ? trigger.maxFires - newFireCount
      : undefined;

    traces.push({
      actorId: ctx.agentId,
      attachmentId: entry.attachmentId,
      attachmentName: entry.attachmentName,
      event,
      payloadKind: trigger.payload.kind,
      firesRemaining,
      cooldownUntilTick: newCooldownUntil,
    });

    // Update state
    updatedStates.set(entry.attachmentId, {
      ...state,
      actionTriggerFireCount: newFireCount,
      actionTriggerCooldownUntil: newCooldownUntil,
    });

    firedCount++;
  }

  return { firedCount, resourceDeltas, traces, updatedStates };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/engine/__tests__/actionTrigger.test.ts`
Expected: All 8 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/effects/actionTrigger.ts src/engine/__tests__/actionTrigger.test.ts
git commit -m "feat(effects): add checkAndFireActionTriggers() helper with TDD (TB-104 Phase 1B)"
```

---

## Task 4: Barrel Exports + effectResolver Collection + effectTick Cooldown

**Files:**
- Modify: `src/engine/effects/index.ts`
- Modify: `src/engine/effectTick.ts`

- [ ] **Step 1: Update barrel exports in `src/engine/effects/index.ts`**

Add at the bottom:

```ts
// Resource delta — one-shot resource mutation (TB-104 Phase 1B)
export {
  applyResourceDelta,
  type ResourceDeltaInput,
  type ResourceDeltaResult,
} from './resourceDelta';

// Action trigger — event-driven effect firing (TB-104 Phase 1B)
export {
  checkAndFireActionTriggers,
  type ActionTriggerContext,
  type ActionTriggerResult,
} from './actionTrigger';
```

- [ ] **Step 2: Add `action_trigger` to effectTick's non-time-based skip list**

In `src/engine/effectTick.ts`, in the main tick function's switch statement (around line 494), the `default:` case already handles "non-time-based effects: no tick processing needed." The `action_trigger` cooldown is tracked by absolute tick number (`actionTriggerCooldownUntil`), so it doesn't need per-tick decrement — the eligibility check in `checkAndFireActionTriggers()` compares `cooldownUntil > currentTick` directly. No change needed in effectTick.

Verify: read the existing `default:` case in effectTick.ts to confirm `action_trigger` will fall through to it.

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit`
Expected: Clean (0 errors)

- [ ] **Step 4: Commit**

```bash
git add src/engine/effects/index.ts
git commit -m "feat(effects): add barrel exports for resource_delta + action_trigger (TB-104 Phase 1B)"
```

---

## Task 5: Wire `resource_delta` into Reward Path

**Files:**
- Modify: `src/engine/rewardPool.ts`

- [ ] **Step 1: Import the helper**

At the top of `src/engine/rewardPool.ts`, add:

```ts
import { applyResourceDelta } from './effects/resourceDelta';
```

- [ ] **Step 2: Add `applyResourceDeltas()` to `instantiateRewardInternal()`**

In `instantiateRewardInternal()` (around line 299), after the service reward check (around line 320 where `rewardMode === 'service'` is handled), add a resource_delta pass for non-service rewards. Find the section after the reward node is cloned and the edge is created (around line 347-361). After the edge creation, add:

```ts
    // Apply any resource_delta effects immediately (TB-104 Phase 1B)
    const rewardEffects = (template.properties.effects ?? []) as import('../types/effects').AttachmentEffect[];
    for (const eff of rewardEffects) {
      if (eff.type !== 'resource_delta') continue;
      const agentProps = agent.properties as Record<string, unknown>;
      const deltaResult = applyResourceDelta(eff, {
        essence: (agentProps.essence as number) ?? 0,
        quintessence: (agentProps.quintessence as number) ?? 0,
        quintessenceMax: (agentProps.quintessenceMax as number) ?? Infinity,
        doom: (agentProps.doom as number) ?? 0,
        doomThreshold: (agentProps.doomThreshold as number) ?? 100,
      }, tick, 'reward');
      if (deltaResult.applied) {
        agentProps[eff.resource] = deltaResult.after;
        graph.updateNode(recipientAgentId, { properties: agentProps });
      }
    }
```

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit`
Expected: Clean (0 errors)

- [ ] **Step 4: Commit**

```bash
git add src/engine/rewardPool.ts
git commit -m "feat(effects): wire resource_delta into reward instantiation path (TB-104 Phase 1B)"
```

---

## Task 6: Wire `action_trigger` into Encounter Aftermath

**Files:**
- Modify: `src/engine/orchestrator.ts`

- [ ] **Step 1: Import the helpers**

At the top of `src/engine/orchestrator.ts`, add:

```ts
import { checkAndFireActionTriggers, type ActionTriggerContext } from './effects/actionTrigger';
import { collectAttachmentEffects } from './effects/effectWalker';
```

(`collectAttachmentEffects` may already be imported — check before adding a duplicate.)

- [ ] **Step 2: Add trigger check after encounter completion in legacy encounter phase**

In `phaseEncounterProgressionV2()`, find the `ENCOUNTER_END` timeline block (around line 637-658). After the balance telemetry block (around line 658), add:

```ts
      // ── Action trigger check on encounter completion (TB-104 Phase 1B) ──
      if (progress.status === 'completed' || progress.status === 'abandoned') {
        const triggerEvent = result.success ? 'encounter_success' : 'encounter_failure';
        const agentNode = state.graph.getNode(progress.actorId);
        if (agentNode) {
          const agentProps = agentNode.properties as Record<string, unknown>;
          const triggerCtx: ActionTriggerContext = {
            agentId: progress.actorId,
            tick: state.tick,
            agentResources: {
              essence: (agentProps.essence as number) ?? 0,
              quintessence: (agentProps.quintessence as number) ?? 0,
              quintessenceMax: (agentProps.quintessenceMax as number) ?? Infinity,
              doom: (agentProps.doom as number) ?? 0,
              doomThreshold: (agentProps.doomThreshold as number) ?? 100,
            },
          };
          const attachedEffects = collectAttachmentEffects(
            state.graph,
            progress.actorId,
            runningEffectStates,
          );
          const triggerResult = checkAndFireActionTriggers(
            attachedEffects,
            triggerEvent as import('../types/effects').ActionTriggerEvent,
            triggerCtx,
            runningEffectStates,
          );
          if (triggerResult.firedCount > 0) {
            // Apply resource deltas to agent
            for (const delta of triggerResult.resourceDeltas) {
              (agentProps as Record<string, number>)[delta.resource] = delta.after;
            }
            if (triggerResult.resourceDeltas.length > 0) {
              state.graph.updateNode(progress.actorId, { properties: agentProps });
            }
            // Merge updated effect states
            runningEffectStates = triggerResult.updatedStates;
          }
        }
      }
```

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit`
Expected: Clean (0 errors)

- [ ] **Step 4: Commit**

```bash
git add src/engine/orchestrator.ts
git commit -m "feat(effects): wire action_trigger into legacy encounter aftermath (TB-104 Phase 1B)"
```

---

## Task 7: Wire `action_trigger` into Movement Arrival

**Files:**
- Modify: `src/engine/phaseMovement.ts`

- [ ] **Step 1: Import the helpers**

At the top of `src/engine/phaseMovement.ts`, add:

```ts
import { checkAndFireActionTriggers, type ActionTriggerContext } from './effects/actionTrigger';
import { collectAttachmentEffects } from './effects/effectWalker';
import type { EffectRuntimeState } from '../types/effects';
```

- [ ] **Step 2: Add trigger check after movement arrival**

In `phaseMovement()`, find the block that checks `result.arrivedAtDestination` and updates the exploration record (around line 143-169). After the exploration record update (after line 169), add:

```ts
          // ── Action trigger: movement_complete (TB-104 Phase 1B) ──
          const triggerActorNode = state.graph.getNode(actorId);
          if (triggerActorNode) {
            const tProps = triggerActorNode.properties as Record<string, unknown>;
            const triggerCtx: ActionTriggerContext = {
              agentId: actorId,
              tick: state.tick,
              agentResources: {
                essence: (tProps.essence as number) ?? 0,
                quintessence: (tProps.quintessence as number) ?? 0,
                quintessenceMax: (tProps.quintessenceMax as number) ?? Infinity,
                doom: (tProps.doom as number) ?? 0,
                doomThreshold: (tProps.doomThreshold as number) ?? 100,
              },
            };
            const effectStates = state.effectStates ?? new Map<string, EffectRuntimeState>();
            const attachedEffects = collectAttachmentEffects(state.graph, actorId, effectStates);
            const triggerResult = checkAndFireActionTriggers(
              attachedEffects,
              'movement_complete',
              triggerCtx,
              effectStates,
            );
            if (triggerResult.firedCount > 0) {
              for (const delta of triggerResult.resourceDeltas) {
                (tProps as Record<string, number>)[delta.resource] = delta.after;
              }
              if (triggerResult.resourceDeltas.length > 0) {
                state.graph.updateNode(actorId, { properties: tProps });
              }
              // Merge updated effect states back
              if (!state.effectStates) state.effectStates = new Map();
              for (const [k, v] of triggerResult.updatedStates) {
                state.effectStates.set(k, v);
              }
            }
          }
```

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit`
Expected: Clean (0 errors)

- [ ] **Step 4: Commit**

```bash
git add src/engine/phaseMovement.ts
git commit -m "feat(effects): wire action_trigger into movement arrival (TB-104 Phase 1B)"
```

---

## Task 8: Wire `action_trigger` into Unified Action Resolution

**Files:**
- Modify: `src/engine/unifiedActionResolution.ts`

- [ ] **Step 1: Import the helpers**

At the top of `src/engine/unifiedActionResolution.ts`, add:

```ts
import { checkAndFireActionTriggers, type ActionTriggerContext } from './effects/actionTrigger';
import { collectAttachmentEffects } from './effects/effectWalker';
```

- [ ] **Step 2: Add trigger check after action resolution**

Find the function that resolves unified actions — look for where `finalAction.resolved` is set (around line 950-953 in the `resolveAndExecuteStep` function). After the reward processing and trace emission (around line 1044 where the trace is emitted), add:

```ts
  // ── Action trigger: action_complete / encounter_success / encounter_failure (TB-104 Phase 1B) ──
  if (finalAction.resolved) {
    const triggerActorNode = state.graph.getNode(action.actorId);
    if (triggerActorNode) {
      const tProps = triggerActorNode.properties as Record<string, unknown>;
      const triggerCtx: ActionTriggerContext = {
        agentId: action.actorId,
        tick,
        agentResources: {
          essence: (tProps.essence as number) ?? 0,
          quintessence: (tProps.quintessence as number) ?? 0,
          quintessenceMax: (tProps.quintessenceMax as number) ?? Infinity,
          doom: (tProps.doom as number) ?? 0,
          doomThreshold: (tProps.doomThreshold as number) ?? 100,
        },
      };
      const effectStates = state.effectStates ?? new Map();
      const attachedEffects = collectAttachmentEffects(state.graph, action.actorId, effectStates);

      // Fire action_complete for any completed action
      const acResult = checkAndFireActionTriggers(attachedEffects, 'action_complete', triggerCtx, effectStates);

      // Also fire encounter_success/encounter_failure for migrated encounter templates
      const isEncounterTemplate = template.tags?.includes('encounter') ?? false;
      let encResult = acResult;
      if (isEncounterTemplate) {
        const encEvent = isStepSuccess(outcome) ? 'encounter_success' : 'encounter_failure';
        encResult = checkAndFireActionTriggers(
          attachedEffects,
          encEvent,
          { ...triggerCtx, agentResources: triggerCtx.agentResources },
          acResult.updatedStates,
        );
      }

      const finalTriggerResult = isEncounterTemplate ? encResult : acResult;
      if (finalTriggerResult.firedCount > 0) {
        for (const delta of finalTriggerResult.resourceDeltas) {
          (tProps as Record<string, number>)[delta.resource] = delta.after;
        }
        if (finalTriggerResult.resourceDeltas.length > 0) {
          state.graph.updateNode(action.actorId, { properties: tProps });
        }
        if (!state.effectStates) state.effectStates = new Map();
        for (const [k, v] of finalTriggerResult.updatedStates) {
          state.effectStates.set(k, v);
        }
      }
    }
  }
```

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit`
Expected: Clean (0 errors)

- [ ] **Step 4: Commit**

```bash
git add src/engine/unifiedActionResolution.ts
git commit -m "feat(effects): wire action_trigger into unified action resolution (TB-104 Phase 1B)"
```

---

## Task 9: Proof Pack Items

**Files:**
- Modify: `src/data/reward-attachment-catalog.ts`

- [ ] **Step 1: Add proof-pack items**

In `src/data/reward-attachment-catalog.ts`, find the talisman/charm section (or add at the end of the `REWARD_POSSESSIONS` array). Add:

```ts
  // ─── Content Primitive Proof Pack (TB-104 Phase 1B) ─────────────

  {
    id: 'reward_talisman_pilgrims_wayfinding_stone',
    type: 'artifact',
    name: "Pilgrim's Wayfinding Stone",
    properties: {
      subcategory: 'talisman',
      tier: 1,
      tags: ['#quintessence', '#travel', '#mystical'],
      mechanicalSummary: '+3 quintessence on movement arrival (6-tick cooldown)',
      lossCondition: 'durable',
      flavorText: 'The stone hums faintly when you arrive somewhere new, as though approving of the journey.',
      effects: [
        {
          type: 'action_trigger',
          on: 'movement_complete',
          payload: { kind: 'resource_delta', resource: 'quintessence', amount: 3 },
          cooldownTicks: 6,
        },
      ],
    } as PossessionNodeProperties,
  },
  {
    id: 'reward_charm_battle_spoils_talisman',
    type: 'artifact',
    name: 'Battle Spoils Talisman',
    properties: {
      subcategory: 'charm',
      tier: 1,
      tags: ['#essence', '#combat', '#consumable'],
      mechanicalSummary: '+5 essence on encounter success (10 uses total)',
      lossCondition: 'consumable',
      flavorText: 'A leather pouch threaded with bone beads — each bead cracks and darkens after a victory, feeding you its stored warmth.',
      effects: [
        {
          type: 'action_trigger',
          on: 'encounter_success',
          payload: { kind: 'resource_delta', resource: 'essence', amount: 5 },
          maxFires: 10,
          cooldownTicks: 1,
        },
      ],
    } as PossessionNodeProperties,
  },
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: Clean (0 errors)

- [ ] **Step 3: Commit**

```bash
git add src/data/reward-attachment-catalog.ts
git commit -m "feat(effects): add proof-pack items for action_trigger + resource_delta (TB-104 Phase 1B)"
```

---

## Task 10: Full Build Verification + Final Commit

**Files:** None (verification only)

- [ ] **Step 1: Run all tests**

Run: `npm test`
Expected: All tests pass

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: Clean (0 errors)

- [ ] **Step 3: Production build**

Run: `npx vite build`
Expected: Build succeeds (confirms Vercel will deploy)

- [ ] **Step 4: Headless smoke test**

Run the CLI to verify the new effect types don't break the tick loop:

```bash
npm run cli -- --seed 42
```

At the `fws>` prompt:
```
tick 30
status
```

Expected: No crashes, normal tick output.

- [ ] **Step 5: Update plan doc status**

In `Docs/plans/2026-04-13-tb104-phase1b-resource-delta-action-trigger.md`, change status from `Approved design` to `Implemented`.

In `Docs/plans/2026-04-03-procedural-content-component-library-foundation-plan.md`, update the Phase 1 section to note `resource_delta` and `action_trigger` are now shipped.

- [ ] **Step 6: Final commit**

```bash
git add Docs/plans/
git commit -m "docs: mark TB-104 Phase 1B resource_delta + action_trigger as implemented"
```

---

## Notes

### Unwired `ActionTriggerEvent` types

`spell_cast` and `rest` are defined in the `ActionTriggerEvent` union but have **no integration hooks** in this plan. Reason: spell activation (`spellActivation.ts`) is not called from the orchestrator — it's a standalone utility. Rest is not an explicit agent action in the current system. These event types exist so content can be authored against them now; hooks will be added when those systems gain explicit orchestrator phases. No backlog entry needed — they're passive type definitions, not deferred work.
