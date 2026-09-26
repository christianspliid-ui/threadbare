/**
 * Reaction windows — what a fired `reactive` does when its nested effect is a
 * modifier rather than an action (THR-1568).
 *
 * Before this module a reaction handed its nested effect to `executeEffect`
 * whatever it was. For the executor family (`cascade`, `resource_manipulate`
 * `fight_clock`, `inflict_condition`, …) that is right. For a modifier —
 * "when struck, Iron +0.03 for six ticks" — it was a silent no-op:
 * `executeEffect` lists every modifier shape as "handled by effectResolver",
 * and the resolver returned 0 for `reactive` without looking inside. Fifteen
 * shipped items promised a burst that never landed (UI Law 56).
 *
 * The fix is a **window**: firing opens it on the attachment's runtime state,
 * `effectTick` counts it down, and the resolver's `reactive` arm reads the
 * nested value while it is open.
 *
 * ─── Window length ───────────────────────────────────────────────
 * | Nested type          | Window                                         |
 * |----------------------|------------------------------------------------|
 * | duration             | its `ticks`                                    |
 * | decay                | ticks until it reaches `limitValue`            |
 * | passive / permanent  | reaction `duration` if authored, else          |
 * |                      | cooldown × REACTIVE_UNTIMED_WINDOW_COOLDOWN_FRACTION |
 * Every window is floored at REACTIVE_WINDOW_MIN_TICKS.
 *
 * A nested `duration`'s `destroyOnExpiry` is **ignored** here: it describes a
 * standalone timed attachment, and honouring it inside a reaction would
 * destroy the item that reacted the first time its burst ran out.
 *
 * Re-firing while a window is open (possible only when the cooldown is shorter
 * than the window) restarts the window at full length — a refresh, never a
 * second stacked copy.
 *
 * ─── Fail-soft ───────────────────────────────────────────────────
 * | Failure case                  | Fallback                              |
 * |-------------------------------|---------------------------------------|
 * | decay with changePerTick 0    | window = REACTIVE_WINDOW_MIN_TICKS    |
 * | non-finite authored numbers   | window = REACTIVE_WINDOW_MIN_TICKS    |
 *
 * ─── PRNG ────────────────────────────────────────────────────────
 * None — pure arithmetic over authored numbers and runtime state.
 */

import type { ReachDomain } from '../../types/traits';
import type {
  AttachmentEffect,
  EffectRuntimeState,
  ReactiveEffect,
} from '../../types/effects';
import {
  REACTIVE_UNTIMED_WINDOW_COOLDOWN_FRACTION,
  REACTIVE_WINDOW_MIN_TICKS,
} from '../../data/effect-constants';

/** Nested effect shapes a reaction turns into a timed modifier window. */
export type ReactiveWindowEffect = Extract<
  AttachmentEffect,
  { type: 'duration' | 'passive' | 'permanent' | 'decay' }
>;

/**
 * True when a reaction's nested effect is a reach modifier the resolver can
 * value — the shapes that open a window instead of going to `executeEffect`.
 */
export function isReactiveWindowEffect(effect: AttachmentEffect): effect is ReactiveWindowEffect {
  return effect.type === 'duration'
    || effect.type === 'passive'
    || effect.type === 'permanent'
    || effect.type === 'decay';
}

function floorWindow(ticks: number): number {
  if (!Number.isFinite(ticks)) return REACTIVE_WINDOW_MIN_TICKS;
  return Math.max(REACTIVE_WINDOW_MIN_TICKS, Math.ceil(ticks));
}

/**
 * How many ticks the window opened by this reaction lasts.
 *
 * @param reactive - the reaction whose nested effect is a window effect
 * @param resolvedCooldown - the cooldown actually in force (authored or default)
 */
export function reactiveWindowTicks(
  reactive: ReactiveEffect,
  resolvedCooldown: number,
): number {
  const nested = reactive.effect;
  switch (nested.type) {
    case 'duration':
      return floorWindow(nested.ticks);
    case 'decay': {
      if (nested.changePerTick === 0) return REACTIVE_WINDOW_MIN_TICKS;
      return floorWindow((nested.limitValue - nested.startValue) / nested.changePerTick);
    }
    case 'passive':
    case 'permanent':
      return floorWindow(
        reactive.duration ?? resolvedCooldown * REACTIVE_UNTIMED_WINDOW_COOLDOWN_FRACTION,
      );
    default:
      return REACTIVE_WINDOW_MIN_TICKS;
  }
}

/**
 * The modifier a reaction contributes to `reach` right now: the nested
 * effect's value while its window is open, 0 otherwise (and 0 for any reaction
 * whose nested effect is not a window effect — those execute, they do not
 * modify).
 */
export function reactiveWindowValue(
  reactive: ReactiveEffect,
  reach: ReachDomain,
  runtimeState: EffectRuntimeState | undefined,
): number {
  const nested = reactive.effect;
  if (!isReactiveWindowEffect(nested)) return 0;
  const remaining = runtimeState?.reactiveWindowTicksRemaining ?? 0;
  if (remaining <= 0) return 0;
  if (nested.reach !== reach) return 0;

  if (nested.type === 'decay') {
    const total = runtimeState?.reactiveWindowTicks ?? remaining;
    const elapsed = Math.max(0, total - remaining);
    const raw = nested.startValue + nested.changePerTick * elapsed;
    // Clamp toward the limit in whichever direction the burst moves.
    return nested.changePerTick < 0
      ? Math.max(raw, nested.limitValue)
      : Math.min(raw, nested.limitValue);
  }
  return nested.value;
}

/** Open (or restart) a reaction window on a runtime state. Pure — returns a new state. */
export function openReactiveWindow(
  state: EffectRuntimeState,
  windowTicks: number,
): EffectRuntimeState {
  return { ...state, reactiveWindowTicksRemaining: windowTicks, reactiveWindowTicks: windowTicks };
}

/**
 * Count an open window down by one tick. Returns `null` when nothing changes
 * (no window open), so the tick loop can skip the write and the trace.
 */
export function tickReactiveWindow(
  state: EffectRuntimeState,
): { state: EffectRuntimeState; closed: boolean } | null {
  const remaining = state.reactiveWindowTicksRemaining;
  if (remaining === undefined || remaining <= 0) return null;
  const next = Math.max(0, remaining - 1);
  return { state: { ...state, reactiveWindowTicksRemaining: next }, closed: next === 0 };
}
