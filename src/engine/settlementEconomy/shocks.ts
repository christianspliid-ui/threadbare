/**
 * Land shocks — what a god's hand or a siege does to the land a settlement works
 * (THR-1923, plan § Resolution logic 7).
 *
 * The four economic god verbs append a record to the settlement's `landShocks`: Blight and
 * Sour Mine cut the best food / stone hex to `SHOCK_BLIGHT_FACTOR`, Bless the Harvest and
 * Reveal Vein lift it to `SHOCK_BOON_FACTOR`. The effect fades linearly back to 1 over
 * `SHOCK_DAYS`; a faded record is dropped. A siege is **read, never stored**: while a siege
 * node names the settlement, every owned hex but the centre yields `SHOCK_SIEGE_FACTOR`.
 *
 * The verb pins the hex the phase last named as the settlement's best for that channel
 * (`economyBestHex`), so the cast receipt can say *which* fields. Before the phase has run
 * there, the record carries no hex and the phase pins it on its next day.
 */
import type { GraphNode } from '../../types/graph';
import type { WorldGraph } from '../graph';
import { TICKS_PER_DAY } from '../../data/attention-constants';
import {
  SETTLEMENT_ECONOMY_ENABLED,
  SHOCK_BLIGHT_FACTOR,
  SHOCK_BOON_FACTOR,
  SHOCK_DAYS,
} from '../../data/settlement-economy-constants';
import { resolveToParentLocation } from '../sublocationShape';
import { isEconomySettlement } from './land';

export type LandShockSource = 'bless_harvest' | 'blight' | 'sour_mine' | 'reveal_vein' | 'siege';
export type GodLandShockSource = Exclude<LandShockSource, 'siege'>;

/** Where a hex lies from its settlement, as the receipt and the livelihood line say it. */
export type HexDirection = 'north' | 'north-east' | 'east' | 'south-east' | 'south' | 'south-west' | 'west' | 'north-west' | 'river' | 'centre';

export interface LandShock {
  /** The hex it lies on, or null until the phase pins the settlement's best hex. */
  hexKey: string | null;
  /** 0 food, 2 stone. */
  channel: 0 | 1 | 2;
  /** The multiplier on the day it was cast. */
  factor: number;
  startTick: number;
  untilTick: number;
  source: GodLandShockSource;
  /** Where the hex lies from the settlement, when known. */
  direction?: HexDirection;
}

/** Settlement property: the best hex per channel, written daily by the phase. */
export const BEST_HEX_PROP = 'economyBestHex';
export const LAND_SHOCKS_PROP = 'landShocks';

/** Per source: which channel it hits and its starting factor. */
export const LAND_SHOCK_SHAPE: Readonly<Record<GodLandShockSource, { channel: 0 | 2; factor: number }>> = {
  blight: { channel: 0, factor: SHOCK_BLIGHT_FACTOR },
  bless_harvest: { channel: 0, factor: SHOCK_BOON_FACTOR },
  sour_mine: { channel: 2, factor: SHOCK_BLIGHT_FACTOR },
  reveal_vein: { channel: 2, factor: SHOCK_BOON_FACTOR },
};

export function readLandShocks(node: GraphNode | undefined): LandShock[] {
  const raw = node?.properties?.[LAND_SHOCKS_PROP];
  if (!Array.isArray(raw)) return [];
  return raw.filter((s): s is LandShock => !!s && typeof s === 'object'
    && typeof (s as LandShock).factor === 'number'
    && typeof (s as LandShock).untilTick === 'number');
}

/** A shock's multiplier at `tick`: its factor on the day cast, fading linearly to 1. */
export function shockFactorAt(shock: LandShock, tick: number): number {
  if (tick >= shock.untilTick) return 1;
  const span = Math.max(1, shock.untilTick - shock.startTick);
  const progress = Math.max(0, Math.min(1, (tick - shock.startTick) / span));
  return shock.factor + (1 - shock.factor) * progress;
}

export function isShockActive(shock: LandShock, tick: number): boolean {
  return tick < shock.untilTick;
}

/**
 * Append a god verb's land shock to the settlement the target stands in. Returns the
 * record written, or null when the economy is off or the target is no settlement
 * (fail-soft: the verb's other writes stand).
 */
export function appendLandShock(
  graph: WorldGraph,
  targetId: string,
  source: GodLandShockSource,
  tick: number,
): LandShock | null {
  if (!SETTLEMENT_ECONOMY_ENABLED) return null;
  const settlement = resolveToParentLocation(graph, graph.getNode(targetId));
  if (!settlement || !isEconomySettlement(settlement)) return null;
  const shape = LAND_SHOCK_SHAPE[source];
  const best = (settlement.properties[BEST_HEX_PROP] as Record<string, { key: string; direction?: HexDirection }> | undefined)?.[String(shape.channel)];
  // The phase has run and the town works no hex of this channel: there is nothing for the
  // verb to touch, so no shock is laid and the receipt says nothing (Law 56).
  if (settlement.properties[BEST_HEX_PROP] !== undefined && !best) return null;
  const shock: LandShock = {
    hexKey: best?.key ?? null,
    channel: shape.channel,
    factor: shape.factor,
    startTick: tick,
    untilTick: tick + SHOCK_DAYS * TICKS_PER_DAY,
    source,
    ...(best?.direction ? { direction: best.direction } : {}),
  };
  settlement.properties[LAND_SHOCKS_PROP] = [...readLandShocks(settlement), shock];
  return shock;
}

/** Siege nodes by the settlement they name (`battleState.battleType === 'siege'`). */
export function besiegedSettlementIds(graph: WorldGraph): Set<string> {
  const out = new Set<string>();
  for (const actor of graph.getNodesByType('actor')) {
    const bs = actor.properties?.battleState as { battleType?: string; settlementId?: unknown } | undefined;
    if (!bs || bs.battleType !== 'siege' || typeof bs.settlementId !== 'string') continue;
    out.add(bs.settlementId);
  }
  return out;
}
