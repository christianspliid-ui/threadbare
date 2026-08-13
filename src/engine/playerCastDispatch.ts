/**
 * Player-Cast Dispatch (THR-739)
 *
 * The single construction path for player-sourced `UnifiedAction`s. Every UI
 * surface that lets the player fire a card — the agent drawer, the non-agent
 * drawer, the intervention confirm, and the `__DEBUG` action bridge — calls
 * `preparePlayerCast` to build the action, then folds it into game state with
 * `commitPlayerCast`.
 *
 * ## Why this module exists
 *
 * Each surface used to carry its own hand-rolled copy of the same sequence, and
 * the copies drifted. The non-agent drawer shipped **without a dispatch toast**
 * until THR-727 fixed both paths separately, and it still never wrote the
 * `ACTION_START` timeline event that the agent drawer wrote on every cast — so
 * a whole class of player action was invisible to the causal trail (NFP #2).
 * Folding the sequence into one function closes that gap by construction rather
 * than by remembering to mirror the next edit.
 *
 * ## What deliberately stays in the callers
 *
 * Surface-specific feedback is *not* centralized here: sphere audio, the
 * particle burst, drawer close, the card-play animation, and the dispatch copy
 * itself all remain with the surface that owns them. Only the engine-shaped
 * sequence — buffs, RNG, action construction, timeline, essence, state append —
 * lives in this module.
 */

import type { WorldGraph } from './graph';
import type { SimulationRuntime } from './simulationRuntime';
import type { GameState, TickEvent } from '../types/gameState';
import type { SphereName } from '../types/index';
import type {
  ActionScale,
  UnifiedAction,
  UnifiedActionTemplate,
} from '../types/unifiedAction';
import { createUnifiedAction } from './unifiedActionLifecycle';
import { applyAscendantBuffs } from './ascendantBuffs';
import { tierScaledEssenceCost } from './targetTierScaling';
import { appendEvent } from './encounterTimeline';
import { touchWorld } from './simulationRuntime';
import { mulberry32 } from '../lib/prng';

// ─── Tunables (NFP #1) ─────────────────────────────────────────────

/**
 * Multiplier folded into the per-cast PRNG seed so two casts in the same tick
 * from different ticks do not share a stream. Historically an inline `43` at
 * every dispatch site.
 */
export const PLAYER_CAST_RNG_TICK_STRIDE = 43;

/** Significance stamped on a dispatch-time `recentEvents` entry. */
export const PLAYER_CAST_EVENT_SIGNIFICANCE = 0.5;

// ─── Prepare ───────────────────────────────────────────────────────

export interface PreparePlayerCastParams {
  readonly graph: WorldGraph;
  /** The casting ascendant — becomes the action's `actorId`. */
  readonly ascendantId: string;
  readonly template: UnifiedActionTemplate;
  readonly templateId: string;
  readonly targetId: string;
  readonly tick: number;
  readonly seed: number;
  /**
   * Sphere the essence cost is drawn from. `null` means no pool is charged —
   * the action is still created and committed.
   */
  readonly sphere: SphereName | null;
  /** Defaults to `template.scale`. Override only where the surface fixes a scale. */
  readonly scale?: ActionScale;
  /**
   * Run the Recede/Focus buff pass before pricing the cast. Default `true`.
   * The intervention path prices through `executeIntervention` and the debug
   * bridge fires at list price, so both opt out — consuming a one-shot buff
   * there would spend it on a cast that never asked for it.
   */
  readonly applyBuffs?: boolean;
  /**
   * Fixed essence cost, bypassing the buff-adjusted price. Used by the callers
   * that opt out of `applyBuffs` and compute their own cost.
   */
  readonly essencePaid?: number;
  /** Per-session runtime. Touched when a buff was consumed (graph mutated in place). */
  readonly runtime?: SimulationRuntime;
}

export interface PreparedPlayerCast {
  readonly action: UnifiedAction;
  /** Essence actually charged — buff-adjusted unless `essencePaid` was supplied. */
  readonly essenceCost: number;
  /** Pool key the cost is drawn from; `null` charges nothing. */
  readonly sphere: SphereName | null;
  /**
   * `" (after Recede, with Focus)"` or `""`. The caller appends this to its own
   * dispatch copy — the string is shared so the two drawers cannot word the
   * same buff differently, which they previously did by accident.
   */
  readonly buffParenthetical: string;
  readonly buffsConsumed: boolean;
}

/**
 * Build a player-sourced action: apply buffs, mint the action, and write the
 * `ACTION_START` timeline event. Does not touch game state — pass the result to
 * `commitPlayerCast`.
 */
export function preparePlayerCast(params: PreparePlayerCastParams): PreparedPlayerCast {
  const {
    graph, ascendantId, template, templateId, targetId, tick, seed, sphere,
    scale, applyBuffs = true, essencePaid, runtime,
  } = params;

  // THR-1073: a template may price itself from the target's attachment tier
  // (`essenceCostContext`). Resolve that first, then let the buff pass discount
  // the *real* price — Recede taking its cut off the tier-1 price while the pool
  // was charged the tier-3 one would be the same mismatch this ticket removes.
  // Untouched for every template without the marker: `tierScaledEssenceCost`
  // returns the authored `essenceCost` unchanged.
  const scaledBaseCost = tierScaledEssenceCost(template, graph.getNode(targetId)?.properties);
  const pricedTemplate = scaledBaseCost === (template.essenceCost ?? 0)
    ? template
    : { ...template, essenceCost: scaledBaseCost };

  const buffResult = applyBuffs
    ? applyAscendantBuffs(pricedTemplate, graph, ascendantId, tick)
    : null;
  if (buffResult?.buffsConsumed && runtime) touchWorld(runtime);

  const essenceCost = essencePaid ?? buffResult?.effectiveEssenceCost ?? scaledBaseCost;
  const buffsConsumed = buffResult?.buffsConsumed ?? false;

  const rng = mulberry32(seed + tick * PLAYER_CAST_RNG_TICK_STRIDE);
  const resolvedScale = scale ?? template.scale;
  const action = createUnifiedAction({
    actorId: ascendantId,
    templateId,
    targetId,
    scale: resolvedScale,
    source: 'player',
    tick,
    template,
    rng,
    essencePaid: essenceCost,
    ...(buffsConsumed && buffResult
      ? { effectiveRarityTier: buffResult.effectiveRarityTier }
      : {}),
  });

  // Causal trail for every player cast, from every surface (NFP #2). The
  // non-agent drawer and the debug bridge gained this at THR-739 — the agent
  // drawer had always written it, which is exactly how the gap stayed unnoticed.
  const targetNode = graph.getNode(targetId);
  appendEvent(ascendantId, {
    phase: 'ACTION_START',
    tick,
    template: template.name,
    target: targetNode?.name ?? targetId,
    reach: template.reach ?? 'unknown',
    scale: resolvedScale,
    steps: template.steps.length,
    source: 'player',
  });

  const buffParenthetical = buffsConsumed && buffResult
    ? ` (${[
        buffResult.discountApplied ? 'after Recede' : '',
        buffResult.tierBoostApplied ? 'with Focus' : '',
      ].filter(Boolean).join(', ')})`
    : '';

  return { action, essenceCost, sphere, buffParenthetical, buffsConsumed };
}

// ─── Commit ────────────────────────────────────────────────────────

export interface PlayerCastEvent {
  /** `recentEvents` id prefix — e.g. `evt_action`, `evt_target_action`. */
  readonly idPrefix: string;
  /** The narrative line. The caller owns its dispatch copy. */
  readonly message: string;
  readonly isInterventionBeat: boolean;
  /** Defaults to `PLAYER_CAST_EVENT_SIGNIFICANCE`. */
  readonly significance?: number;
}

export interface CommitPlayerCastParams {
  readonly cast: PreparedPlayerCast;
  /** Omit to append the action without a `recentEvents` line (the debug bridge does). */
  readonly event?: PlayerCastEvent;
}

/**
 * Fold a prepared cast into game state: clamp the essence pool, append the
 * action, and (optionally) push the dispatch narrative line.
 *
 * Pure — safe to call from inside a `setGameState` updater.
 */
export function commitPlayerCast(
  prev: GameState,
  { cast, event }: CommitPlayerCastParams,
): GameState {
  const essencePool = { ...prev.essencePool };
  if (cast.essenceCost > 0 && cast.sphere) {
    essencePool[cast.sphere] = Math.max(0, (essencePool[cast.sphere] ?? 0) - cast.essenceCost);
  }

  const next: GameState = {
    ...prev,
    essencePool,
    unifiedActions: [...(prev.unifiedActions ?? []), cast.action],
  };
  if (!event) return next;

  const entry: TickEvent = {
    id: `${event.idPrefix}_${prev.tick}_${Date.now()}`,
    tick: prev.tick,
    type: 'narrative',
    message: event.message,
    significance: event.significance ?? PLAYER_CAST_EVENT_SIGNIFICANCE,
    ...(cast.sphere ? { sphere: cast.sphere } : {}),
    isInterventionBeat: event.isInterventionBeat,
  };
  return { ...next, recentEvents: [...prev.recentEvents.slice(-99), entry] };
}
