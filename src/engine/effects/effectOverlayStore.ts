/**
 * Effect Overlay Store — persist, query and expire terrain overlays and rule overrides.
 *
 * THR-1240, stage 2 of the effect-vocabulary activation program.
 *
 * The `alter_terrain` and `modify_rules` executors have always produced
 * `ActiveTerrainOverlay[]` / `ActiveRuleOverride[]` and surfaced them on
 * `ExecutionResult`. No consumer ever read those two fields: every call site
 * looped `result.mutations`, applied the graph writes, and let the other two
 * fall on the floor. Both primitives therefore *executed successfully* and
 * changed nothing — the worst shape a dead subsystem can take, because
 * `success: true` came back every time and no trace recorded the discard.
 *
 * This module is the somewhere for them to live. It owns:
 *   - the two GameState collections and their key discipline,
 *   - the stacking fold (one semantic per key family, decided once here),
 *   - expiry, run once per tick from the orchestrator's effect-tick phase.
 *
 * ─── Stacking semantics (decided in the plan doc, implemented here) ──
 * | Key family        | Fold            | Neutral | Rationale                    |
 * |-------------------|-----------------|---------|------------------------------|
 * | `*_multiplier`    | multiplicative  | 1.0     | Scales compose; clamped       |
 * | `*_bonus`         | additive        | 0       | Flat adjustments add          |
 * | `*_modifier`      | additive        | 0       | Same; matches the legacy sum  |
 * | boolean flags     | boolean-OR      | false   | One source granting is enough |
 * | string / struct   | first-wins      | —       | No meaningful composition     |
 *
 * Multiplier folds are clamped symmetrically into
 * `[1 / RULE_OVERRIDE_VALUE_CAP, RULE_OVERRIDE_VALUE_CAP]` — nothing bounds how
 * many attachments an agent may carry, so unclamped multiplicative stacking is
 * unbounded in both directions, and the downward direction is the dangerous one
 * (a 0× movement cost multiplier freezes movement outright).
 *
 * ─── Fail-soft (NFP #4) ─────────────────────────────────────────────
 * | Failure case                          | Fallback                          |
 * |---------------------------------------|-----------------------------------|
 * | Overlay with non-finite hex coords    | dropped, `overlay_expired` at 0   |
 * | Override with an unknown key          | stored; readers fold by suffix    |
 * | Read for a key with no entries        | neutral value for that key family |
 * | Expiry on absent collections          | no-op, no allocation              |
 * | Malformed entry mid-expiry            | that entry dropped, rest survive  |
 *
 * ─── Determinism (NFP #3) ───────────────────────────────────────────
 * No PRNG. Expiry is a tick comparison; the fold is order-independent for
 * multiplicative/additive/OR and order-stable (insertion order) for first-wins.
 *
 * Plan doc: Docs/plans/2026-08-25-effect-vocabulary-activation.md
 */

import type { GameState } from '../../types/gameState';
import type {
  ActiveRuleOverride,
  ActiveTerrainOverlay,
  RuleOverrideKey,
} from '../../types/effects';
import type { TraceEntry } from '../../types/trace';
import { emitTrace } from '../traceBuffer';
import { hexKey } from '../../lib/hexKey';
import {
  OVERLAY_DEFAULT_DURATION_TICKS,
  RULE_OVERRIDE_VALUE_CAP,
} from '../../data/effect-constants';

/**
 * What an apply or expiry pass changed, so the caller can bump version counters.
 *
 * The producing sites (`phaseMovement`, `phaseDoom`, `battleResolution`) have no
 * `SimulationRuntime` in scope and cannot call `touchWorld`/`touchStructure`
 * themselves. They record the need on GameState instead; the orchestrator, which
 * owns the runtime and runs the expiry pass every tick, does the touching.
 */
export interface OverlayStoreDelta {
  /** Entries added or removed — any change a UI selector could care about. */
  changed: boolean;
  /**
   * True when a *terrain* overlay changed. Terrain is what the distance matrix
   * reads, so this additionally invalidates structural caches.
   *
   * Deliberately every terrain overlay rather than a curated
   * "movement-affecting" subset: CLAUDE.md sanctions structural over-
   * invalidation for v1, and a hand-maintained subset is a correctness bug
   * waiting for the first overlay type someone forgets to add to it.
   */
  structural: boolean;
}

const NO_CHANGE: OverlayStoreDelta = { changed: false, structural: false };

// ═══════════════════════════════════════════════════════════════════
// Stacking fold
// ═══════════════════════════════════════════════════════════════════

/** Neutral (identity) value for a key, returned when nothing is in force. */
export function neutralRuleOverrideValue(rule: string): number | boolean {
  if (rule.endsWith('_multiplier')) return 1.0;
  if (rule === 'death_prevented') return false;
  return 0;
}

/** Clamp a multiplier symmetrically so stacking cannot run away in either direction. */
function clampMultiplier(value: number): number {
  const floor = 1 / RULE_OVERRIDE_VALUE_CAP;
  if (!Number.isFinite(value)) return 1.0;
  return Math.min(RULE_OVERRIDE_VALUE_CAP, Math.max(floor, value));
}

/**
 * Fold a set of raw override values for one key into a single effective value.
 *
 * Exported because stage 3's owning sites must fold *identically* whether the
 * values came from the persisted collection or from attachment-declared
 * `modify_rules` effects — two folds for one key is exactly the drift this
 * function exists to prevent.
 */
export function foldRuleOverrideValues(
  rule: string,
  values: readonly (number | boolean | string | object)[],
): number | boolean | string | object {
  if (values.length === 0) return neutralRuleOverrideValue(rule);

  if (rule.endsWith('_multiplier')) {
    let product = 1.0;
    for (const v of values) if (typeof v === 'number' && Number.isFinite(v)) product *= v;
    return clampMultiplier(product);
  }

  if (rule === 'death_prevented') {
    // Boolean-OR: one source granting the protection is enough. A non-boolean
    // value on a flag key is authoring noise — treat truthiness as intent
    // rather than refusing, since refusing would silently drop the protection.
    for (const v of values) if (v === true || (typeof v === 'number' && v > 0)) return true;
    return false;
  }

  // Numeric keys (`*_bonus`, `*_modifier`, and any future numeric key) sum.
  // This matches the legacy `getActiveRuleOverride` behaviour exactly, which is
  // why extending that function rather than adding a second read path is safe.
  const numeric = values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  if (numeric.length > 0) {
    let total = 0;
    for (const v of numeric) total += v;
    return total;
  }

  // String / struct values (`encounter_reach_override`, the reach swap struct)
  // have no meaningful composition — first-wins, in insertion order.
  return values[0] as string | object;
}

// ═══════════════════════════════════════════════════════════════════
// Apply
// ═══════════════════════════════════════════════════════════════════

/** Resolve an entry's expiry tick, defaulting an unspecified duration. */
function resolveExpiry(expiryTick: number | null | undefined, tick: number): number | null {
  if (expiryTick === null) return null; // explicit permanence
  if (typeof expiryTick === 'number' && Number.isFinite(expiryTick)) return expiryTick;
  return tick + OVERLAY_DEFAULT_DURATION_TICKS;
}

function emitOverlayTrace(
  category: 'effect.overlay_applied' | 'effect.overlay_expired',
  kind: 'terrain' | 'rule',
  key: string,
  overlay: string,
  sourceAttachmentId: string,
  ticksRemaining: number,
  tick: number,
): void {
  const verb = category === 'effect.overlay_applied' ? 'took hold on' : 'lifted from';
  emitTrace({
    category,
    tick,
    key,
    kind,
    overlay,
    sourceAttachmentId,
    ticksRemaining,
    summary: `${overlay} ${verb} ${key}${ticksRemaining > 0 ? ` (${ticksRemaining} ticks left)` : ''}`,
  } as TraceEntry);
}

/**
 * Persist executor-produced terrain overlays and rule overrides onto GameState.
 *
 * Mutates `state` in place — deliberately, and consistently with
 * `raiseEffectEvent`, which already assigns `state.effectStates` directly. The
 * effect phases are not inside a `setGameState` callback; the orchestrator reads
 * these collections back out at the phase boundary.
 *
 * @returns what changed, for the caller's version-counter bookkeeping
 */
export function applyExecutionOverlays(
  state: GameState,
  overlays: readonly ActiveTerrainOverlay[] | undefined,
  overrides: readonly ActiveRuleOverride[] | undefined,
  tick: number,
): OverlayStoreDelta {
  if ((!overlays || overlays.length === 0) && (!overrides || overrides.length === 0)) {
    return NO_CHANGE;
  }

  let changed = false;
  let structural = false;

  if (overlays && overlays.length > 0) {
    const store: Record<string, ActiveTerrainOverlay[]> = { ...(state.activeTerrainOverlays ?? {}) };

    for (const overlay of overlays) {
      // Fail-soft: an overlay with no resolvable hex has nowhere to live. Trace
      // it as expired-at-zero so the drop is visible rather than silent — a
      // silently dropped overlay is the exact failure this stage exists to end.
      if (!Number.isFinite(overlay.hexCol) || !Number.isFinite(overlay.hexRow)) {
        emitOverlayTrace(
          'effect.overlay_expired', 'terrain', 'unresolved-hex',
          overlay.terrainEffect, overlay.sourceAttachmentId, 0, tick,
        );
        continue;
      }

      const key = hexKey(overlay.hexCol, overlay.hexRow);
      const expiryTick = resolveExpiry(overlay.expiryTick, tick);
      const stored: ActiveTerrainOverlay = { ...overlay, expiryTick, establishedTick: tick };

      store[key] = [...(store[key] ?? []), stored];
      changed = true;
      structural = true;

      emitOverlayTrace(
        'effect.overlay_applied', 'terrain', key,
        overlay.terrainEffect, overlay.sourceAttachmentId,
        expiryTick === null ? -1 : Math.max(0, expiryTick - tick), tick,
      );
    }

    if (changed) state.activeTerrainOverlays = store;
  }

  if (overrides && overrides.length > 0) {
    const store: Record<string, ActiveRuleOverride[]> = { ...(state.activeRuleOverrides ?? {}) };

    for (const override of overrides) {
      const key = override.sourceAgentId;
      if (!key) continue; // fail-soft: an override with no bearer has no scope

      const expiryTick = resolveExpiry(override.expiryTick, tick);
      const stored: ActiveRuleOverride = { ...override, expiryTick, establishedTick: tick };

      store[key] = [...(store[key] ?? []), stored];
      changed = true;

      emitOverlayTrace(
        'effect.overlay_applied', 'rule', key,
        override.rule, override.sourceAttachmentId,
        expiryTick === null ? -1 : Math.max(0, expiryTick - tick), tick,
      );
    }

    state.activeRuleOverrides = store;
  }

  if (changed) {
    state.overlayStateDirty = true;
    if (structural) state.overlayStateStructural = true;
  }

  return { changed, structural };
}

// ═══════════════════════════════════════════════════════════════════
// Query
// ═══════════════════════════════════════════════════════════════════

/** Every terrain overlay currently in force on one hex. Empty array when none. */
export function getTerrainOverlaysAt(
  state: Pick<GameState, 'activeTerrainOverlays'>,
  col: number,
  row: number,
): readonly ActiveTerrainOverlay[] {
  return state.activeTerrainOverlays?.[hexKey(col, row)] ?? [];
}

/** True when a named terrain overlay is in force on one hex. */
export function hasTerrainOverlay(
  state: Pick<GameState, 'activeTerrainOverlays'>,
  col: number,
  row: number,
  terrainEffect: ActiveTerrainOverlay['terrainEffect'],
): boolean {
  return getTerrainOverlaysAt(state, col, row).some(o => o.terrainEffect === terrainEffect);
}

/**
 * The effective persisted value of one rule key for one agent.
 *
 * Returns the key family's neutral value when nothing is in force, so a caller
 * may use the result unconditionally — no `?? 1.0` at each of stage 3's eleven
 * owning sites, which is eleven chances to pick the wrong neutral.
 */
export function getPersistedRuleOverride(
  state: Pick<GameState, 'activeRuleOverrides'>,
  agentId: string,
  rule: RuleOverrideKey | string,
): number | boolean | string | object {
  const entries = state.activeRuleOverrides?.[agentId];
  if (!entries || entries.length === 0) return neutralRuleOverrideValue(rule);

  const values = entries.filter(e => e.rule === rule).map(e => e.value);
  return foldRuleOverrideValues(rule, values);
}

// ═══════════════════════════════════════════════════════════════════
// Expiry
// ═══════════════════════════════════════════════════════════════════

/**
 * Drop every overlay and override whose expiry tick has passed.
 *
 * Run once per tick from the orchestrator's effect-tick phase — the same place
 * attachment durations and cooldowns already tick. Global rather than per-agent
 * because the collections are keyed by hex and agent, not walked per bearer.
 *
 * An entry with `expiryTick: null` is permanent and never expires here; the only
 * way it leaves is its source attachment being destroyed, which stage 4's
 * consolidation pass handles.
 */
export function expireOverlays(state: GameState, tick: number): OverlayStoreDelta {
  let changed = false;
  let structural = false;

  const overlays = state.activeTerrainOverlays;
  if (overlays) {
    const next: Record<string, ActiveTerrainOverlay[]> = {};
    for (const [key, list] of Object.entries(overlays)) {
      const survivors: ActiveTerrainOverlay[] = [];
      for (const entry of list) {
        if (entry.expiryTick !== null && entry.expiryTick <= tick) {
          changed = true;
          structural = true;
          emitOverlayTrace(
            'effect.overlay_expired', 'terrain', key,
            entry.terrainEffect, entry.sourceAttachmentId, 0, tick,
          );
          continue;
        }
        survivors.push(entry);
      }
      // Drop emptied keys rather than leaving `[]` behind — the collection is a
      // point-lookup index, and empty buckets accumulate for the whole run.
      if (survivors.length > 0) next[key] = survivors;
      else if (list.length > 0) changed = true;
    }
    if (changed) state.activeTerrainOverlays = next;
  }

  const overrides = state.activeRuleOverrides;
  if (overrides) {
    let overrideChanged = false;
    const next: Record<string, ActiveRuleOverride[]> = {};
    for (const [key, list] of Object.entries(overrides)) {
      const survivors: ActiveRuleOverride[] = [];
      for (const entry of list) {
        if (entry.expiryTick !== null && entry.expiryTick <= tick) {
          overrideChanged = true;
          emitOverlayTrace(
            'effect.overlay_expired', 'rule', key,
            entry.rule, entry.sourceAttachmentId, 0, tick,
          );
          continue;
        }
        survivors.push(entry);
      }
      if (survivors.length > 0) next[key] = survivors;
      else if (list.length > 0) overrideChanged = true;
    }
    if (overrideChanged) {
      state.activeRuleOverrides = next;
      changed = true;
    }
  }

  return { changed, structural };
}
