/**
 * Hunger's stories are planted (THR-2040).
 *
 * A town's larder plants one of its scenes for a resident: on a town's
 * `FAMINE_SEED_DAY`-th hungry day a famine story, on the first day of a glut run a
 * plenty story. At most one per town every `LARDER_SEED_COOLDOWN_DAYS`. The granary
 * riot keeps its own seed and comes first: on a day it planted, the larder waits. A
 * town whose scarcity arc moved within the cooldown waits too, and the arc's hoarding
 * seed waits on a recent larder plant (`phases/economicPower.ts`), so one shortage never
 * plants two hunger stories.
 *
 * Called once a day per settlement from `unrestPressure.ts` `dailyPass`, right after
 * `hungerDays` is written and the riot has had its turn. The seed is the riot's shape
 * (`templateId`, `pickTargetAgent`, the scarcity-arc delay and priority); the seeds
 * join the pass's returned array, so no new orchestrator wiring.
 *
 * The score lean and the board pull were measured flat and are not used (plan § Why).
 *
 * NFP: #1 every number and row in `src/data/larder-seed-config.ts`; #2 a `larder.seed`
 * trace on every trigger day, planted or skipped, with the reason; #3 no PRNG draw —
 * the row is picked by a private `mulberry32(hashString(town + tick))`; #4 the caller catches a throw, and
 * missing data reads as neither famine nor glut.
 *
 * Plan: Docs/plans/2026-10-28-thr-2040-hunger-stories-planted.md.
 */

import type { GameState } from '../types/gameState';
import type { GraphNode } from '../types/graph';
import type { PendingEncounterSeed } from '../types/unifiedAction';
import { emitTrace } from './traceBuffer';
import { templateAcceptsWhereTheyStand } from './encounterSeeding';
import { pickTargetAgent } from './phases/routeEvents';
import { hashString, mulberry32 } from '../lib/prng';
import { getUnifiedTemplateById } from '../data/unified-action-templates';
import { TICKS_PER_DAY } from '../data/attention-constants';
import { SCARCITY_ARC_SEED_DELAY_TICKS, SCARCITY_ARC_SEED_PRIORITY } from '../data/economic-power-config';
import {
  LARDER_SEEDS_ENABLED,
  FAMINE_SEED_DAY,
  LARDER_SEED_COOLDOWN_DAYS,
  PLENTY_MIN_SURPLUS_DAYS,
  PLENTY_BALANCE_FLOOR,
  FAMINE_SEED_ROWS,
  PLENTY_SEED_ROWS,
  type LarderSeedRow,
} from '../data/larder-seed-config';

/** Settlement prop: the tick the last larder story was planted (famine and glut share it). */
export const LARDER_LAST_SEED_PROP = 'larderLastSeedTick';
/** Settlement prop: the tick the last larder *famine* story was planted (the scarcity arc's hoarding seed reads it). */
export const LARDER_LAST_FAMINE_SEED_PROP = 'larderLastFamineSeedTick';
/** Settlement prop: the town read as glutted at the last daily pass (to see a glut run's first day). */
export const LARDER_WAS_GLUT_PROP = 'larderWasGlut';

export type LarderState = 'famine' | 'glut';
export type LarderSkip = 'disabled' | 'cooldown' | 'riot' | 'scarcity_arc' | 'no_row' | 'no_resident';

/**
 * Measurement lever for the on/off census (`scripts/larder-census.ts`) and tests:
 * overrides `LARDER_SEEDS_ENABLED` without editing it. `null` clears the override.
 * Not a gameplay setting — nothing in the live game calls it.
 */
let larderSeedsOverride: boolean | null = null;
export function setLarderSeedsEnabledOverride(value: boolean | null): void {
  larderSeedsOverride = value;
}
/** The effective kill-switch state: the override when set, else `LARDER_SEEDS_ENABLED`. */
export function isLarderSeedsEnabled(): boolean {
  return larderSeedsOverride ?? LARDER_SEEDS_ENABLED;
}

function num(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

/**
 * A town's larder today: famine when it is hungry, glut when it is not and its grain
 * has had nowhere to go for `PLENTY_MIN_SURPLUS_DAYS` at a balance of at least
 * `PLENTY_BALANCE_FLOOR`. Non-numeric food fields are never glut.
 */
export function readLarder(settlement: GraphNode, hungry: boolean): { state: LarderState | null } {
  if (hungry) return { state: 'famine' };
  const surplusDays = num(settlement.properties.foodSurplusDays);
  const balance = num(settlement.properties.foodBalance);
  if (surplusDays !== undefined && balance !== undefined
    && surplusDays >= PLENTY_MIN_SURPLUS_DAYS && balance >= PLENTY_BALANCE_FLOOR) {
    return { state: 'glut' };
  }
  return { state: null };
}

/**
 * The row a town plants for its chosen resident, or null when none fits. A row fits when
 * its template exists, asks no hold, and accepts the place that resident stands right
 * now (`templateAcceptsWhereTheyStand`, the very test seeding applies when the seed
 * ripens): an ungated row fits anywhere, a tavern row only a mortal in a tavern Place.
 * Judged at the resident, not the whole town, so a seed is never handed to someone a
 * town's other Place would have suited and then withers waiting. The pick is weighted
 * and stable for the same town and tick.
 */
export function pickLarderRow(
  rows: readonly LarderSeedRow[],
  state: GameState,
  town: GraphNode,
  tick: number,
  targetAgentId: string,
): string | null {
  const fit = rows.filter(r => {
    if (!(r.weight > 0)) return false;
    const t = getUnifiedTemplateById(r.templateId);
    if (!t || t.requiresHold) return false;
    return templateAcceptsWhereTheyStand(state.graph, targetAgentId, t);
  });
  if (fit.length === 0) return null;
  const total = fit.reduce((a, r) => a + r.weight, 0);
  // A private generator keyed on the string, read once: the raw hash barely moves
  // between consecutive ticks, and no shared PRNG stream is drawn.
  let x = mulberry32(hashString(`${town.id}:${tick}`))() * total;
  for (const r of fit) {
    x -= r.weight;
    if (x < 0) return r.templateId;
  }
  return fit[fit.length - 1].templateId;
}

/**
 * One settlement's larder for the day. Writes `larderWasGlut` every day it runs and
 * `larderLastSeedTick` on a plant; pushes at most one seed onto `seeds`.
 */
export function plantLarderSeed(
  state: GameState,
  town: GraphNode,
  hungry: boolean,
  hungerDays: number,
  riotPlanted: boolean,
  pendingSeedIds: ReadonlySet<string>,
  seeds: PendingEncounterSeed[],
): void {
  const tick = state.tick;
  const props = town.properties;
  const larder = readLarder(town, hungry).state;
  const wasGlut = props[LARDER_WAS_GLUT_PROP] === true;
  if ((larder === 'glut') !== wasGlut) props[LARDER_WAS_GLUT_PROP] = larder === 'glut';

  const trigger: LarderState | null =
    larder === 'famine' && hungerDays === FAMINE_SEED_DAY ? 'famine'
      : larder === 'glut' && !wasGlut ? 'glut'
        : null;
  if (!trigger) return;

  const cooldownTicks = LARDER_SEED_COOLDOWN_DAYS * TICKS_PER_DAY;
  const lastSeed = num(props[LARDER_LAST_SEED_PROP]);
  const arc = props.scarcityArc as { phaseSinceTick?: number; sinceTick?: number } | undefined;
  const arcMoved = num(arc?.phaseSinceTick) ?? num(arc?.sinceTick);

  let skipped: LarderSkip | undefined;
  let templateId: string | null = null;
  let targetAgentId: string | null = null;
  if (!isLarderSeedsEnabled()) skipped = 'disabled';
  else if (riotPlanted) skipped = 'riot';
  else if (lastSeed !== undefined && tick - lastSeed < cooldownTicks) skipped = 'cooldown';
  else if (arcMoved !== undefined && tick - arcMoved < cooldownTicks) skipped = 'scarcity_arc';
  else {
    const seedId = `larder_${trigger}_${town.id}_${tick}`;
    targetAgentId = (pendingSeedIds.has(seedId) ? undefined : pickTargetAgent(state, [town.id])) ?? null;
    if (!targetAgentId) skipped = 'no_resident';
    else {
      templateId = pickLarderRow(trigger === 'famine' ? FAMINE_SEED_ROWS : PLENTY_SEED_ROWS, state, town, tick, targetAgentId);
      if (!templateId) skipped = 'no_row';
      else {
        seeds.push({
          seedId,
          sourceEncounterId: 'larder',
          sourceReactionId: trigger,
          targetAgentId,
          eligibleAfterTick: tick + SCARCITY_ARC_SEED_DELAY_TICKS,
          priority: SCARCITY_ARC_SEED_PRIORITY,
          plantedTick: tick,
          templateId,
          seedLabel: trigger === 'famine' ? `${town.name} has gone hungry` : `${town.name}'s granaries are full`,
        });
        props[LARDER_LAST_SEED_PROP] = tick;
        if (trigger === 'famine') props[LARDER_LAST_FAMINE_SEED_PROP] = tick;
      }
    }
  }

  const what = trigger === 'famine' ? 'is hungry' : 'has grain to spare';
  emitTrace({
    tick,
    category: 'larder.seed',
    summary: skipped
      ? `${town.name} ${what}: no larder story planted (${skipped})`
      : `${town.name} ${what}: ${templateId} planted for ${targetAgentId}`,
    locationId: town.id,
    state: trigger,
    templateId,
    targetAgentId,
    ...(skipped ? { skipped } : {}),
  });
}
