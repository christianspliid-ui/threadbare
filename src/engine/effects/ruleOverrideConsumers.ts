/**
 * Rule-Override Consumers — the one read path the owning sites share (THR-1241).
 *
 * Stage 3 of the effect-vocabulary activation program
 * (`Docs/plans/2026-08-25-effect-vocabulary-activation.md`).
 *
 * Stage 1 made the executors run, stage 2 gave their output somewhere to live.
 * Eleven of the thirteen `RuleOverrideKey`s still had nobody reading them, which
 * is why an artifact could promise `death_prevented` and a mortal die anyway.
 * This module is the read half: one accessor per key family, called from the
 * single site that owns each rule.
 *
 * ─── Why a module rather than eleven inline reads ────────────────────────────
 * Three things must agree at every site, and each is a chance to disagree:
 *
 *   1. **The neutral.** `1.0` for a multiplier, `0` for a bonus, `false` for a
 *      flag. An inline `?? 1.0` at a `*_bonus` site is a silent, permanent bug
 *      that no test would catch, because the value it produces is plausible.
 *   2. **The fold.** Multiplicative for `*_multiplier`, additive for the numeric
 *      keys, boolean-OR for `death_prevented` — fixed by stage 2 in
 *      `foldRuleOverrideValues` and re-derived nowhere.
 *   3. **The trace.** A rule that bent an outcome is exactly what an
 *      inspectability question is about (NFP #2); a site that reads without
 *      tracing is invisible in the buffer and reads as "not wired".
 *
 * ─── Neutral-safe by construction ────────────────────────────────────────────
 * Every accessor returns its family's neutral when nothing is in force, so a
 * caller may use the result unconditionally — `cost * readMultiplier(...)` is
 * correct whether or not an override exists. That is what keeps the eleven call
 * sites one line each instead of one branch each.
 *
 * ─── Tracing policy: non-neutral reads only ──────────────────────────────────
 * Sites read their key unconditionally and most reads find nothing. Tracing all
 * of them would emit on the order of (agents x keys x ticks) — `movementCost`
 * alone runs per agent per pathfinding step. Only a read that actually bends an
 * outcome is traced, which is also the only read a reader is looking for.
 */

import type { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import type { EffectRuntimeState, RuleOverrideKey } from '../../types/effects';
import type { ReachDomain } from '../../types/traits';
import type { TraceEntry } from '../../types/trace';
import { emitTrace } from '../traceBuffer';
import { getActiveRuleOverride } from './effectQueries';
import { getPersistedRuleOverride, neutralRuleOverrideValue } from './effectOverlayStore';
import { collectAttachmentEffects } from './effectWalker';

/**
 * Everything an owning site needs to resolve a rule override for one agent.
 *
 * `persisted` is optional because not every owning site sits where `GameState`
 * is in hand — `movementCost` and `conditionDecay` take a graph and a tick.
 * Omitting it reads the attachment-declared `modify_rules` half only, which is
 * where every shipped rule-override content ref lives today, so a site without
 * state is honest rather than merely lenient. Sites that do hold state pass it
 * and get both halves through one fold.
 */
export interface RuleOverrideContext {
  readonly graph: WorldGraph;
  readonly effectStates?: ReadonlyMap<string, EffectRuntimeState>;
  /**
   * THR-1242 widened this from `Pick<GameState, 'activeRuleOverrides'>` to carry
   * the terrain half too. Both collections are written by the same stage-2 drain
   * from the same `ExecutionResult`, and both are read at the same two sites
   * (`movementCost`, `encounterAwareness`) — so threading a second context object
   * through those signatures would have been two parameters describing one thing.
   */
  readonly persisted?: Pick<GameState, 'activeRuleOverrides' | 'activeTerrainOverlays'>;
  readonly tick: number;
}

/** Emit the consumption trace for a read that came back non-neutral. */
function traceConsumed(
  key: RuleOverrideKey,
  agentId: string,
  value: number | boolean | string,
  site: string,
  tick: number,
): void {
  emitTrace({
    category: 'effect.rule_override_consumed',
    tick,
    agentId,
    key,
    value,
    site,
    summary: `${key} = ${String(value)} consumed at ${site} for ${agentId}`,
  } as TraceEntry);
}

/**
 * Read a numeric rule override (both `*_multiplier` and additive keys).
 *
 * Folds the attachment-declared and persisted halves through the same
 * `foldRuleOverrideValues` stage 2 fixed, so a `haste` that arrived as a
 * persisted executor override and one declared on a worn ring compose the way
 * two worn rings do.
 */
function readNumeric(
  ctx: RuleOverrideContext,
  agentId: string,
  key: RuleOverrideKey,
  site: string,
): number {
  // `getActiveRuleOverride` already folds both sources when `persisted` is given.
  const value = getActiveRuleOverride(ctx.graph, agentId, key, ctx.effectStates, ctx.persisted);
  const neutral = neutralRuleOverrideValue(key);

  if (typeof neutral === 'number' && value !== neutral) {
    traceConsumed(key, agentId, value, site, ctx.tick);
  }
  return value;
}

/**
 * The effective multiplier for a `*_multiplier` key. Neutral is **1.0**.
 *
 * Already clamped to `[1/RULE_OVERRIDE_VALUE_CAP, RULE_OVERRIDE_VALUE_CAP]` by
 * the stage-2 fold, so a caller may multiply without a runaway guard of its own.
 */
export function readMultiplierOverride(
  ctx: RuleOverrideContext,
  agentId: string,
  key: RuleOverrideKey,
  site: string,
): number {
  return readNumeric(ctx, agentId, key, site);
}

/** The effective additive bonus for a `*_bonus` / `*_modifier` key. Neutral is **0**. */
export function readBonusOverride(
  ctx: RuleOverrideContext,
  agentId: string,
  key: RuleOverrideKey,
  site: string,
): number {
  return readNumeric(ctx, agentId, key, site);
}

/**
 * The effective state of a boolean flag key (`death_prevented`). Neutral is **false**.
 *
 * Boolean-OR across sources: one ward is enough, and a second does not make the
 * protection stronger — which is why this is not a numeric read.
 */
export function readFlagOverride(
  ctx: RuleOverrideContext,
  agentId: string,
  key: RuleOverrideKey,
  site: string,
): boolean {
  // The numeric accessor reports a flag as 1/0, and the persisted accessor keeps
  // it boolean. Read both and OR, so a flag set by only one source still holds.
  const numeric = getActiveRuleOverride(ctx.graph, agentId, key, ctx.effectStates);
  let active = numeric > 0;

  if (!active && ctx.persisted) {
    const folded = getPersistedRuleOverride(ctx.persisted, agentId, key);
    active = folded === true || (typeof folded === 'number' && folded > 0);
  }

  if (active) traceConsumed(key, agentId, true, site, ctx.tick);
  return active;
}

/**
 * The reach swap in force on this agent, or `null` when none is.
 *
 * `encounter_reach_override` is the one non-numeric, non-flag key: its value is
 * a `{ from, to }` struct, so it is unreadable through the numeric accessor
 * (which would report `0` and look like "no override"). Composition is
 * first-wins per the stage-2 fold — two swaps of the same reach have no sensible
 * product, and picking one is better than silently picking neither.
 */
export function readReachOverride(
  ctx: RuleOverrideContext,
  agentId: string,
  site: string,
): { from: ReachDomain; to: ReachDomain } | null {
  const key: RuleOverrideKey = 'encounter_reach_override';

  const candidates: unknown[] = [];

  // Attachment-declared swaps first. They are not readable through
  // `getActiveRuleOverride`, whose return type is `number` — a struct value
  // reports as 0 there and is indistinguishable from "no override" — so they are
  // walked here rather than widening that signature and forcing every existing
  // numeric caller to narrow a union it never sees.
  for (const entry of collectAttachmentEffects(ctx.graph, agentId, ctx.effectStates)) {
    const effect = entry.effect;
    if (effect.type !== 'modify_rules') continue;
    if (effect.rule !== key) continue;
    candidates.push(effect.value);
  }

  // Then the persisted half, so a worn amulet wins over an executor-placed swap
  // when both name the same reach — first-wins needs a stated order to be
  // deterministic, and "what you are carrying" is the more legible one.
  if (ctx.persisted) candidates.push(getPersistedRuleOverride(ctx.persisted, agentId, key));

  for (const value of candidates) {
    if (
      value && typeof value === 'object'
      && typeof (value as { from?: unknown }).from === 'string'
      && typeof (value as { to?: unknown }).to === 'string'
    ) {
      const swap = value as { from: ReachDomain; to: ReachDomain };
      traceConsumed(key, agentId, `${swap.from}->${swap.to}`, site, ctx.tick);
      return swap;
    }
  }
  return null;
}
