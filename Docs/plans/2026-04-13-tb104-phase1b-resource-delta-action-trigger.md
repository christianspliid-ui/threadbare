# TB-104 Phase 1B — `resource_delta` + `action_trigger` Primitives

**Date:** 2026-04-13  
**Status:** Implemented (2026-04-13)  
**Backlog:** TB-104 (Procedural Content Component Library Foundation)  
**Parent plan:** `Docs/plans/2026-04-03-procedural-content-component-library-foundation-plan.md`

---

## Objective

Complete the remaining **immediately shippable** Phase 1 primitives for the content component library. This pass delivers `resource_delta` and `action_trigger` — both are self-contained on delivery, requiring no deferred UI or follow-up chunks.

`choice_set` (the third planned Phase 1 primitive) is backlogged separately as TB-128 because it requires player-facing choice UI to be a complete primitive.

---

## Non-Goals

- No `choice_set` in this pass (see TB-128)
- No new UI surfaces — both primitives integrate through existing reward/event/trace paths
- No stateful shell work (Phase 2)
- No new graph node types

---

## Primitives

### `resource_delta` (Type 19h) — Immediate Resource Change

One-shot resource mutation at resolution or reward time. Not ticked — fires once and is done.

```ts
export interface ResourceDeltaEffect {
  readonly type: 'resource_delta';
  readonly resource: 'essence' | 'quintessence' | 'doom';
  readonly amount: number;             // positive = gain, negative = cost
  readonly condition?: EffectPredicate;
  readonly scope?: EffectScope;
}
```

**Why not reuse `resource_manipulate`?**  
`resource_manipulate` (Type 36) is a per-tick drain/restore attached to possessions. `resource_delta` is about encounter *outcomes* and *rewards* — it fires during resolution, not on gaining an item. Different lifecycle, different authoring intent. Reach score changes are intentionally excluded — those should come through possessions/traits, not raw deltas.

**Integration points:**
- `applyResourceDelta()` helper function (new, in `src/engine/effects/`)
- Called from encounter aftermath when resolution effects include `resource_delta`
- Called from reward instantiation when reward effects include `resource_delta`
- Called from `action_trigger` payload execution

**Fail-soft:**

| Failure case | Fallback |
|---|---|
| Resource name not in `essence \| quintessence \| doom` | No-op, emit trace |
| Result would exceed max (quintessence cap, doom threshold) | Clamp to max |
| Result would go below 0 | Clamp to 0 |
| Amount exceeds per-delta cap | Clamp to cap, emit trace |

### `action_trigger` (Type 19i) — Fire on Agent Action

An effect on a possession/trait that fires a payload when the owner performs a specific action. Different from `reactive` effects (which trigger on things happening *to* the agent).

```ts
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

export interface ActionTriggerEffect {
  readonly type: 'action_trigger';
  readonly on: ActionTriggerEvent;
  readonly payload: ActionTriggerPayload;
  readonly condition?: EffectPredicate;
  readonly maxFires?: number;          // undefined = unlimited
  readonly cooldownTicks?: number;     // undefined = use ACTION_TRIGGER_DEFAULT_COOLDOWN
}
```

**Integration points:**
- `checkActionTriggers()` helper function (new, in `src/engine/effects/`)
- Called from encounter aftermath (for `encounter_success`, `encounter_failure`, `action_complete`)
- Called from movement completion handler (for `movement_complete`)
- Called from spell activation (for `spell_cast`)
- Called from rest handler (for `rest`)
- Cooldown decrement added to `effectTick.ts` tick loop

**Runtime state additions to `EffectRuntimeState`:**

```ts
// Added fields:
actionTriggerFireCount?: number;     // fires consumed so far
actionTriggerCooldownUntil?: number; // tick when cooldown expires
```

**Fail-soft:**

| Failure case | Fallback |
|---|---|
| Unknown event type on trigger | Skip, emit trace |
| Payload execution failure (e.g., content_grant pool empty) | No-op, emit trace |
| maxFires exhausted | Auto-disable trigger, emit trace |
| Cooldown not expired | Skip silently |
| Missing agent node | Skip, emit trace |

---

## Constants

All added to `src/data/effect-constants.ts`:

| Constant | Default | Purpose |
|---|---:|---|
| `RESOURCE_DELTA_ESSENCE_CAP` | `50` | Max absolute essence change per single resource_delta |
| `RESOURCE_DELTA_QUINTESSENCE_CAP` | `30` | Max absolute quintessence change per single resource_delta |
| `RESOURCE_DELTA_DOOM_CAP` | `20` | Max absolute doom change per single resource_delta |
| `ACTION_TRIGGER_MAX_PER_ATTACHMENT` | `2` | Max action_trigger effects per attachment template |
| `ACTION_TRIGGER_DEFAULT_COOLDOWN` | `6` | Default ticks between action_trigger fires when cooldownTicks not specified |

---

## Tracing

New trace detail interfaces in `src/types/effects.ts`:

```ts
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
  readonly firesRemaining: number | undefined;  // undefined = unlimited
  readonly cooldownUntilTick: number;
}
```

Both route through the existing trace buffer. Category: `effect_reaction` (already proposed in the parent plan).

---

## PRNG

Neither primitive requires seeded randomness. `content_grant` within an `action_trigger` payload uses the existing `content_grant` PRNG seeding if `selection: 'random'`.

---

## Proof Pack

Two new items in `src/data/reward-attachment-catalog.ts`:

### Pilgrim's Wayfinding Stone (T1 talisman)

`action_trigger` on `movement_complete` → `resource_delta` +3 quintessence.  
Tags: `#quintessence`, `#travel`, `#mystical`  
Flavor: *"The stone hums faintly when you arrive somewhere new, as though approving of the journey."*  
Mechanical summary: +3 quintessence on each movement completion (6-tick cooldown).

### Battle Spoils Talisman (T1 charm)

`action_trigger` on `encounter_success` → `resource_delta` +5 essence, maxFires: 10.  
Tags: `#essence`, `#combat`, `#consumable`  
Flavor: *"A leather pouch threaded with bone beads — each bead cracks and darkens after a victory, feeding you its stored warmth."*  
Mechanical summary: +5 essence on encounter success, 10 uses total.

---

## Wiring

### Orchestrator

No new top-level phase. Both primitives integrate through existing seams:
- `resource_delta`: reward instantiation path, encounter aftermath
- `action_trigger`: encounter aftermath, movement handler, spell activation, rest handler

### effectResolver.ts

- Add `collectResourceDeltas()` — walks attachments, collects active `resource_delta` effects matching predicates
- Add `collectActionTriggers()` — walks attachments, collects active `action_trigger` effects matching event + predicates + not on cooldown + fires remaining

### effectTick.ts

- Add cooldown decrement case for `action_trigger`: each tick, if `actionTriggerCooldownUntil <= tick`, mark cooldown as expired (no state change needed — the check is `cooldownUntil <= currentTick`)

### effects.ts

- Add `ResourceDeltaEffect` and `ActionTriggerEffect` interfaces
- Add `ActionTriggerEvent`, `ActionTriggerPayload` types
- Add trace detail interfaces
- Extend `EffectRuntimeState` with trigger fields
- Add both to `AttachmentEffect` union

### effect-constants.ts

- Add 5 new constants listed above

### New helper module: `src/engine/effects/resourceDelta.ts`

- `applyResourceDelta(graph, agentId, effect, source, tick)` → applies the delta, emits trace
- Pure function, no graph mutation — returns a mutation descriptor for the caller to apply

### New helper module: `src/engine/effects/actionTrigger.ts`

- `checkAndFireActionTriggers(graph, agentId, event, tick, effectStates)` → checks all triggers, fires matching ones, returns updated states + traces + any mutations from payloads

### Encounter aftermath / movement / spell / rest handlers

Each handler adds a call to `checkAndFireActionTriggers()` at the appropriate point, passing the event type.

### reward-attachment-catalog.ts

Two new proof-pack items (Pilgrim's Wayfinding Stone, Battle Spoils Talisman).

### Tests

- `src/engine/__tests__/resourceDelta.test.ts` — unit tests for `applyResourceDelta()`
- `src/engine/__tests__/actionTrigger.test.ts` — unit tests for `checkAndFireActionTriggers()`
- Integration tests: proof-pack items resolve correctly through the reward pipeline

---

## NFP Compliance

| Priority | Verdict | Notes |
|---|---|---|
| Tunability | PASS | All caps and cooldown defaults are named constants in effect-constants.ts |
| Inspectability | PASS | Both primitives emit traces with full before/after state |
| Determinism | PASS | No randomness in either primitive |
| Fail-soft | PASS | Clamping, no-ops with traces for every failure case |
| Narrative over mechanical | PASS | Proof-pack items have authored flavor text and narrative framing |
| Additive over destructive | PASS | Extends existing effect/attachment system, no removals |
| Performance budget | PASS | One-shot resolution (resource_delta), event-driven checks (action_trigger) — no per-tick overhead beyond cooldown tracking |
