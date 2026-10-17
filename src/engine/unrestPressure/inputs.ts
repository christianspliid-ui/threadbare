/**
 * The unrest target's inputs (THR-1934 S1, plan § Engine 1).
 *
 * Pure: reads one settlement's flat properties plus the tick and whether a siege
 * names it, and returns the six terms. The target is their clamped sum. Pushes
 * (Incite Unrest, doom cards, complications) are never terms — they ride on top of
 * the number and the drift pulls them back.
 */
import type { GraphNode } from '../../types/graph';
import { LOC_HEALTH_DEFAULT_BASELINE } from '../../data/location-action-constants';
import { TICKS_PER_DAY } from '../../data/attention-constants';
import { DEATH_SITE_UNREST_TARGET_PROPERTY } from '../../data/death-site-unrest-constants';
import {
  HUNGER_BASE,
  HUNGER_PER_DAY,
  HUNGER_MAX,
  POVERTY_PIVOT,
  POVERTY_PER_POINT,
  POVERTY_MAX,
  SIEGE_PRESSURE,
  SIEGE_LINGER_DAYS,
  SICK_PRESSURE,
  SICK_HEALTH_LINE,
  PROSPERITY_CONTENT_LINE,
  PROSPERITY_CONTENT_RELIEF,
} from '../../data/unrest-pressure-constants';

export interface UnrestInputs {
  hunger: number;
  poverty: number;
  siege: number;
  sickness: number;
  deathSite: number;
  contentment: number;
}

export type UnrestInputKey = keyof UnrestInputs;

/** Settlement properties this module writes (flat; NFP #2). */
export const UNREST_TARGET_PROP = 'unrestTarget';
export const UNREST_INPUTS_PROP = 'unrestInputs';
export const HUNGER_DAYS_PROP = 'hungerDays';
export const LAST_SIEGE_SEEN_PROP = 'lastSiegeSeenTick';
export const RESTLESS_DAYS_PROP = 'restlessDays';
export const LAST_LEAVE_TO_PROP = 'unrestLastLeaveTo';
export const LAST_RIOT_SEED_PROP = 'unrestLastRiotSeedTick';

const SETTLEMENT_SUBTYPES: ReadonlySet<string> = new Set(['hamlet', 'town', 'city', 'capital']);

/** A place-tier settlement: the subtypes the pressure model runs over. */
export function isPressureSettlement(node: GraphNode | undefined): node is GraphNode {
  return !!node && node.type === 'location'
    && node.properties?.parentLocationId === undefined
    && SETTLEMENT_SUBTYPES.has(node.properties?.locationSubtype as string);
}

function num(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

export function hungerTerm(hungerDays: number): number {
  if (!(hungerDays > 0)) return 0;
  return Math.min(HUNGER_MAX, HUNGER_BASE + HUNGER_PER_DAY * (hungerDays - 1));
}

export function povertyTerm(prosperity: number | undefined): number {
  if (prosperity === undefined) return 0;
  return Math.min(POVERTY_MAX, Math.max(0, POVERTY_PIVOT - prosperity) * POVERTY_PER_POINT);
}

export function siegeTerm(besiegedNow: boolean, lastSiegeSeenTick: number | undefined, tick: number): number {
  if (besiegedNow) return SIEGE_PRESSURE;
  if (lastSiegeSeenTick === undefined) return 0;
  return tick - lastSiegeSeenTick <= SIEGE_LINGER_DAYS * TICKS_PER_DAY ? SIEGE_PRESSURE : 0;
}

export function sicknessTerm(populationHealth: number | undefined): number {
  const health = populationHealth ?? LOC_HEALTH_DEFAULT_BASELINE;
  return health < SICK_HEALTH_LINE ? SICK_PRESSURE : 0;
}

/**
 * Contentment, before the settlement economy: a prosperous town is calmer.
 * The settlement economy's PR switches this to its happiness term (without
 * `HUNGER_UNHAPPY`, so hunger is never counted twice) — plan § Wiring.
 */
export function contentmentTerm(prosperity: number | undefined): number {
  return (prosperity ?? 0) > PROSPERITY_CONTENT_LINE ? -PROSPERITY_CONTENT_RELIEF : 0;
}

/**
 * The six terms for one settlement. `hungerDays` is the already-updated counter for
 * today; `besiegedNow` is whether a siege actor names the settlement this tick.
 * The death-site term is THR-1925's bounded haunting target, written by
 * `phaseProsperity` (which runs first) as `deathSiteUnrestTarget`.
 */
export function computeUnrestInputs(
  settlement: GraphNode,
  hungerDays: number,
  besiegedNow: boolean,
  tick: number,
): UnrestInputs {
  const props = settlement.properties ?? {};
  const prosperity = num(props.prosperity);
  return {
    hunger: hungerTerm(hungerDays),
    poverty: povertyTerm(prosperity),
    siege: siegeTerm(besiegedNow, num(props[LAST_SIEGE_SEEN_PROP]), tick),
    sickness: sicknessTerm(num(props.populationHealth)),
    deathSite: Math.max(0, num(props[DEATH_SITE_UNREST_TARGET_PROPERTY]) ?? 0),
    contentment: contentmentTerm(prosperity),
  };
}

export function targetOf(inputs: UnrestInputs): number {
  const sum = inputs.hunger + inputs.poverty + inputs.siege + inputs.sickness + inputs.deathSite + inputs.contentment;
  return Math.max(0, Math.min(100, sum));
}

/** The largest raising input, or null when none is above zero. Ties go to the earlier key. */
export function largestInput(inputs: UnrestInputs): Exclude<UnrestInputKey, 'contentment'> | null {
  let best: Exclude<UnrestInputKey, 'contentment'> | null = null;
  let bestValue = 0;
  for (const key of ['hunger', 'poverty', 'siege', 'sickness', 'deathSite'] as const) {
    if (inputs[key] > bestValue) { best = key; bestValue = inputs[key]; }
  }
  return best;
}

/** Read the inputs a settlement carries, or null when the pressure model has not run there. */
export function readUnrestInputs(settlement: GraphNode | undefined): UnrestInputs | null {
  const raw = settlement?.properties?.[UNREST_INPUTS_PROP] as Partial<UnrestInputs> | undefined;
  if (!raw || typeof raw !== 'object') return null;
  return {
    hunger: num(raw.hunger) ?? 0,
    poverty: num(raw.poverty) ?? 0,
    siege: num(raw.siege) ?? 0,
    sickness: num(raw.sickness) ?? 0,
    deathSite: num(raw.deathSite) ?? 0,
    contentment: num(raw.contentment) ?? 0,
  };
}
